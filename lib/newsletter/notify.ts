/**
 * Slack notification for the monthly newsletter's one remaining automated
 * moment: an issue being approved.
 *
 * This module used to carry a second, larger half — `sendDraftReviewNotifications`,
 * which emailed a rendered draft to `NEWSLETTER_ADMIN_EMAIL` and posted a
 * "draft ready" summary to Slack after the monthly cron generated one. Both
 * went when the cloud generation step did: an issue is now started locally with
 * `scripts/newsletter/new-issue.ts`, so there is no unattended draft for anyone
 * to be told about.
 */

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

/** Resolves the newsletter Slack webhook, falling back to the contact webhook. */
function getNewsletterWebhookUrl(): string | null {
  return (
    process.env.SLACK_NEWSLETTER_WEBHOOK_URL?.trim() ||
    process.env.SLACK_CONTACT_WEBHOOK_URL?.trim() ||
    null
  );
}

/**
 * Posts a Slack notification after an issue has been approved.
 *
 * Named "approved", not "scheduled", and worded so that nobody reading
 * #newsletter concludes mail is on its way: approval no longer schedules a
 * Resend broadcast, it only records that the issue is cleared to go. The send
 * is a separate, manual CLI step run by a human — see the approve route.
 *
 * Best-effort: returns false without throwing when no webhook is configured or
 * the post fails, so a notify failure never fails the approve request.
 *
 * @param opts.issueId The "YYYY-MM" issue id that was approved.
 * @param opts.scheduledAt The intended send instant (the slot of record, which
 *   the operator honours by hand; nothing is queued against it).
 * @returns Whether the Slack post succeeded.
 */
export async function notifyNewsletterApproved(opts: {
  issueId: string;
  scheduledAt: Date;
}): Promise<boolean> {
  const webhookUrl = getNewsletterWebhookUrl();
  if (!webhookUrl) {
    console.warn(
      "[Newsletter] No newsletter/contact Slack webhook configured, skipping approved notification"
    );
    return false;
  }

  const when = formatScheduledNz(opts.scheduledAt);
  const text = `Newsletter ${opts.issueId} approved ✓ — intended send ${when} NZT. *Not sent yet:* the send is a manual step, run \`scripts/newsletter/build-newsletter-batch.ts\` then the Resend CLI.`;

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) {
      console.error(
        "[Newsletter] Slack approved webhook failed:",
        response.status,
        await response.text()
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error("[Newsletter] Failed to send approved Slack notification:", error);
    return false;
  }
}
