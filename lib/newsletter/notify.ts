/**
 * Draft-review notifications for the monthly newsletter pipeline.
 *
 * After the cron assembles + AI-drafts an issue it calls this module to alert a
 * human that a draft is ready to review, edit, and approve. Two independent
 * channels are used, each best-effort (a notify failure must never fail the
 * cron):
 *  - Email to NEWSLETTER_ADMIN_EMAIL: the fully rendered preview HTML with a
 *    slim "DRAFT — not sent to subscribers" banner prepended, so the reviewer
 *    sees exactly what subscribers would get.
 *  - Slack to SLACK_NEWSLETTER_WEBHOOK_URL (falling back to the contact webhook):
 *    a compact summary with the human-action reminders.
 */

import { sendEmail } from "@/lib/email/service";
import type { NewsletterIssueData } from "./schema";

/** Light purple banner background, on-brand and email-client safe. */
const BANNER_BG = "#f7e5f3";
const BANNER_BORDER = "#9b2e83";

type SlackBlock = Record<string, unknown>;

/** Builds "July 2026" from a "YYYY-MM" issue id. */
function issueMonthLabel(id: string): string {
  const [yearStr, monthStr] = id.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  return `${new Date(year, month - 1, 1).toLocaleString("en-US", {
    month: "long",
  })} ${year}`;
}

/** Formats an instant as "Thu 30 Jul" in New Zealand time. */
function formatSendDayNz(d: Date): string {
  return new Intl.DateTimeFormat("en-NZ", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone: "Pacific/Auckland",
  }).format(d);
}

/** Formats an instant as a full date+time in New Zealand time. */
function formatSendDateTimeNz(d: Date): string {
  return new Intl.DateTimeFormat("en-NZ", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Pacific/Auckland",
  }).format(d);
}

/** Formats an instant as "Thu, 30 Jul, 10:00" in 24h New Zealand time. */
function formatScheduledNz(d: Date): string {
  return new Intl.DateTimeFormat("en-NZ", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Pacific/Auckland",
  }).format(d);
}

/**
 * Prepends the review banner to the rendered preview HTML. The banner is a
 * self-contained inline-styled table so it survives email clients; it is
 * inserted just after the opening <body> tag when present, else prepended.
 */
function withReviewBanner(
  previewHtml: string,
  replyBy: string,
  issueId: string,
  draftJsonFallback?: string
): string {
  const banner = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BANNER_BG};border-left:4px solid ${BANNER_BORDER};font-family:Arial,Helvetica,sans-serif;">
  <tr><td style="padding:16px 24px;color:#4a1a40;font-size:14px;line-height:1.5;">
    <strong style="font-size:15px;">DRAFT for review — not sent to subscribers.</strong><br>
    Reply-by: ${replyBy}.<br>
    To review &amp; approve: run <strong>/monthly-newsletter</strong> in Claude Code.
  </td></tr>
</table>`;

  const fallback = draftJsonFallback
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff8e1;border-left:4px solid #f0ad4e;font-family:Arial,Helvetica,sans-serif;">
  <tr><td style="padding:16px 24px;color:#5c4400;font-size:13px;line-height:1.5;">
    <strong>Redis draft staging was unavailable</strong> — the raw issue JSON is included below so nothing is lost. Copy it into <code>lib/data/json/newsletter-issues/${issueId}.json</code> if needed.
    <pre style="white-space:pre-wrap;word-break:break-word;background:#ffffff;border:1px solid #eee;padding:12px;border-radius:4px;font-size:12px;">${escapeHtml(
      draftJsonFallback
    )}</pre>
  </td></tr>
</table>`
    : "";

  const prefix = banner + fallback;
  const bodyMatch = previewHtml.match(/<body[^>]*>/i);
  if (bodyMatch) {
    const insertAt = bodyMatch.index! + bodyMatch[0].length;
    return previewHtml.slice(0, insertAt) + prefix + previewHtml.slice(insertAt);
  }
  return prefix + previewHtml;
}

/** Minimal HTML-escaping for embedding raw JSON in a <pre> block. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Resolves the newsletter Slack webhook, falling back to the contact webhook. */
function getNewsletterWebhookUrl(): string | null {
  return (
    process.env.SLACK_NEWSLETTER_WEBHOOK_URL?.trim() ||
    process.env.SLACK_CONTACT_WEBHOOK_URL?.trim() ||
    null
  );
}

/**
 * Emails the rendered draft (with review banner) to the newsletter admin.
 * Returns false — without throwing — when the address is unset or the send fails.
 */
async function emailDraft(opts: {
  issue: NewsletterIssueData;
  previewHtml: string;
  sendAtUtc: Date;
  draftJsonFallback?: string;
}): Promise<boolean> {
  const adminEmail = process.env.NEWSLETTER_ADMIN_EMAIL?.trim();
  if (!adminEmail) {
    console.warn(
      "[Newsletter] NEWSLETTER_ADMIN_EMAIL not configured, skipping draft review email"
    );
    return false;
  }

  const monthLabel = issueMonthLabel(opts.issue.id);
  const sendDay = formatSendDayNz(opts.sendAtUtc);
  const subject = `[DRAFT] ${monthLabel} Newsletter — review by ${sendDay} 10am NZT`;
  const html = withReviewBanner(
    opts.previewHtml,
    `${sendDay} 10am NZT`,
    opts.issue.id,
    opts.draftJsonFallback
  );
  const text = `DRAFT for review — not sent to subscribers.\nIssue: ${monthLabel}\nSubject: ${opts.issue.editorial.subjectLine}\nReply-by: ${sendDay} 10am NZT.\nTo review & approve: run /monthly-newsletter in Claude Code.`;

  try {
    return await sendEmail({ to: adminEmail, subject, html, text });
  } catch (error) {
    console.error("[Newsletter] Failed to send draft review email:", error);
    return false;
  }
}

/**
 * Posts a compact draft summary to Slack with the human-action reminders.
 * Returns false — without throwing — when no webhook is configured or the post
 * fails.
 */
async function slackDraft(opts: {
  issue: NewsletterIssueData;
  sizeKb: number;
  sendAtUtc: Date;
}): Promise<boolean> {
  const webhookUrl = getNewsletterWebhookUrl();
  if (!webhookUrl) {
    console.warn(
      "[Newsletter] No newsletter/contact Slack webhook configured, skipping draft notification"
    );
    return false;
  }

  const { issue, sizeKb, sendAtUtc } = opts;
  const monthLabel = issueMonthLabel(issue.id);

  const reminders = [
    issue.editorial.spotlight === null
      ? "⚠️ No member spotlight selected — a human should pick one."
      : null,
    "✍️ The founder note is AI-drafted — give it a human voice before sending.",
    "▶️ Run */monthly-newsletter* in Claude Code to review, edit & approve.",
  ].filter((line): line is string => line !== null);

  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `Newsletter Draft Ready — ${monthLabel}`,
        emoji: true,
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Subject line:*\n${issue.editorial.subjectLine}` },
        { type: "mrkdwn", text: `*Rendered size:*\n${sizeKb.toFixed(1)} KB` },
        {
          type: "mrkdwn",
          text: `*Scheduled send:*\n${formatSendDateTimeNz(sendAtUtc)} NZ`,
        },
        {
          type: "mrkdwn",
          text: `*Events:*\n${issue.auto.recapEvents.length} recap / ${issue.auto.upcomingEvents.length} upcoming`,
        },
      ],
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: reminders.join("\n") },
    },
    { type: "divider" },
  ];

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks }),
    });
    if (!response.ok) {
      console.error(
        "[Newsletter] Slack draft webhook failed:",
        response.status,
        await response.text()
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error("[Newsletter] Failed to send draft Slack notification:", error);
    return false;
  }
}

/**
 * Sends the draft-review notifications for a freshly generated issue.
 *
 * @param opts.issue The validated issue that was drafted.
 * @param opts.previewHtml The rendered "preview" HTML from `renderNewsletter`.
 * @param opts.sizeKb The rendered HTML size, surfaced in the Slack summary.
 * @param opts.sendAtUtc The scheduled broadcast instant (last Thursday 10am NZ).
 * @param opts.draftJsonFallback Raw issue JSON to embed in the email when Redis
 *   staging was unavailable, so the draft is never lost.
 * @returns Which channels succeeded. Never throws.
 */
export async function sendDraftReviewNotifications(opts: {
  issue: NewsletterIssueData;
  previewHtml: string;
  sizeKb: number;
  sendAtUtc: Date;
  draftJsonFallback?: string;
}): Promise<{ emailed: boolean; slacked: boolean }> {
  const emailed = await emailDraft({
    issue: opts.issue,
    previewHtml: opts.previewHtml,
    sendAtUtc: opts.sendAtUtc,
    draftJsonFallback: opts.draftJsonFallback,
  });
  const slacked = await slackDraft({
    issue: opts.issue,
    sizeKb: opts.sizeKb,
    sendAtUtc: opts.sendAtUtc,
  });

  return { emailed, slacked };
}

/**
 * Posts a success notification to Slack after an issue has been scheduled (or
 * queued for immediate send) on Resend. Best-effort: returns false without
 * throwing when no webhook is configured or the post fails, so a notify failure
 * never fails the approve request.
 *
 * @param opts.issueId The "YYYY-MM" issue id that was scheduled.
 * @param opts.broadcastId The Resend broadcast id.
 * @param opts.scheduledAt The instant the broadcast is scheduled to send.
 * @returns Whether the Slack post succeeded.
 */
export async function notifyNewsletterScheduled(opts: {
  issueId: string;
  broadcastId: string;
  scheduledAt: Date;
}): Promise<boolean> {
  const webhookUrl = getNewsletterWebhookUrl();
  if (!webhookUrl) {
    console.warn(
      "[Newsletter] No newsletter/contact Slack webhook configured, skipping scheduled notification"
    );
    return false;
  }

  const when = formatScheduledNz(opts.scheduledAt);
  const text = `Newsletter ${opts.issueId} scheduled ✓ for ${when} NZT — broadcast ${opts.broadcastId}`;

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) {
      console.error(
        "[Newsletter] Slack scheduled webhook failed:",
        response.status,
        await response.text()
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error("[Newsletter] Failed to send scheduled Slack notification:", error);
    return false;
  }
}
