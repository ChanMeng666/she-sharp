import { NextRequest, NextResponse } from "next/server";

import { markStatus, getStatus } from "@/lib/newsletter/drafts";
import { getIssue } from "@/lib/newsletter/issues-registry";
import { notifyNewsletterApproved } from "@/lib/newsletter/notify";
import { renderNewsletter } from "@/lib/newsletter/render";
import { lastThursdaySendAt } from "@/lib/newsletter/schedule";
import { issueIdSchema } from "@/lib/newsletter/schema";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * How far ahead of "now" a late approval records its send instant.
 *
 * The send itself is manual, so this is not a queue delay — it is the intended
 * send time written into the status record and announced in Slack, and five
 * minutes is roughly how long the two build commands below take to run.
 */
const IMMEDIATE_SEND_DELAY_MS = 5 * 60 * 1000;

/** Formats an instant as a readable NZ-local date+time for operator messages. */
function formatNz(d: Date): string {
  return new Intl.DateTimeFormat("en-NZ", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Pacific/Auckland",
  }).format(d);
}

/**
 * The two commands the operator runs next, in order, to actually produce the
 * mail. Returned in the response body rather than only documented, because the
 * step that used to happen here now happens on somebody's laptop and the
 * response is the last thing they see.
 */
function nextStepsFor(issueId: string): string[] {
  return [
    `npx tsx scripts/email/recipients-from-db.ts --key newsletter-${issueId}`,
    `npx tsx scripts/newsletter/build-newsletter-batch.ts ${issueId} --recipients tmp/emails/recipients-newsletter-${issueId}.json`,
  ];
}

/**
 * POST /api/admin/newsletter/[issue]/approve
 *
 * Marks a committed+deployed newsletter issue **approved**. It does NOT send,
 * schedule, or contact Resend in any way.
 *
 * Sending is deliberately a CLI step, not part of this route:
 *  - it joins the pipeline the four outbound email skills already share — repo
 *    scripts render, the `resend` CLI sends;
 *  - it keeps a human in the loop by construction, because approving is not
 *    the same act as sending;
 *  - a batch send fans out one request per 100 recipients, and that fan-out has
 *    no business inside a serverless function bounded by `maxDuration` and by
 *    Neon's connection-burst limit.
 *
 * After a 200 the operator runs, on their own machine:
 *   npx tsx scripts/email/recipients-from-db.ts --key newsletter-<issue>
 *   npx tsx scripts/newsletter/build-newsletter-batch.ts <issue> --recipients …
 * and then sends the built batch with the Resend CLI (the `/monthly-newsletter`
 * skill walks through it). `scripts/newsletter/approve.ts` prints the same
 * commands.
 *
 * This still reads ONLY the deployed JSON fixture (never the Redis draft), so
 * what is approved is byte-identical to the web version, and it still renders
 * the issue as a gate (see below) even though it sends nothing.
 *
 * Auth: a CRON_SECRET bearer token OR an admin session (same dual pattern as the
 * newsletter cron/draft endpoints).
 *
 * Body: { sendNow?: boolean } — only relaxes the "send slot has passed" refusal;
 * it does not cause anything to be sent.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ issue: string }> }
) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!(cronSecret && authHeader === `Bearer ${cronSecret}`)) {
    const { getUser } = await import("@/lib/db/queries");
    const { isUserAdmin } = await import("@/lib/auth/permissions");

    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAdmin = await isUserAdmin(user.id);
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { issue: issueId } = await params;
  if (!issueIdSchema.safeParse(issueId).success) {
    return NextResponse.json(
      { error: `Invalid issue id: ${issueId} (expected "YYYY-MM")` },
      { status: 400 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as { sendNow?: boolean };
  const sendNow = body.sendNow === true;

  // 1. Load the COMMITTED+DEPLOYED issue only (never the Redis draft) so the
  //    email is guaranteed identical to the web version.
  const issue = getIssue(issueId);
  if (!issue) {
    return NextResponse.json(
      {
        error: `Issue ${issueId} is not in the deployed bundle. Commit lib/data/json/newsletter-issues/${issueId}.json + registry import, push, wait for deploy, then retry.`,
      },
      { status: 409 }
    );
  }

  // 2. Idempotency: refuse if already scheduled/sent — per the committed meta
  //    and (belt & braces, across deploys) per the Redis status record. Only
  //    those two are terminal; re-approving an approved issue is harmless and
  //    just re-stamps the record.
  if (issue.meta.status === "scheduled" || issue.meta.status === "sent") {
    return NextResponse.json(
      {
        error: `Issue ${issueId} is already ${issue.meta.status}.`,
        broadcastId: issue.meta.broadcastId,
      },
      { status: 409 }
    );
  }
  const redisStatus = await getStatus(issueId);
  const redisState = redisStatus?.status;
  if (redisState === "scheduled" || redisState === "sent") {
    return NextResponse.json(
      {
        error: `Issue ${issueId} is already ${redisState} (per Redis status record).`,
        broadcastId: redisStatus?.broadcastId ?? null,
      },
      { status: 409 }
    );
  }

  // 3. Render the issue. NOT dead code, and not for sending — the rendered
  //    output is thrown away here; the batch builder renders again at send
  //    time. This call is the >100KB Gmail-clip gate, and failing approval on
  //    an oversized issue is far cheaper than discovering it mid-send, once the
  //    fixture is already committed and deployed. Its throw becomes a 422.
  let renderedKb: number;
  try {
    const { html } = await renderNewsletter(issue, "broadcast");
    renderedKb = Number((Buffer.byteLength(html, "utf8") / 1024).toFixed(1));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Render failed" },
      { status: 422 }
    );
  }

  // 4. Resolve the intended send instant. Default = canonical send slot; if it
  //    has passed, refuse unless sendNow. Nothing is queued against it — it is
  //    the send time of record, which the operator honours by hand.
  const [year, month] = issueId.split("-").map(Number);
  const sendSlot = lastThursdaySendAt(year, month);
  const now = new Date();

  let scheduledAt: Date;
  if (sendSlot.getTime() <= now.getTime()) {
    if (!sendNow) {
      return NextResponse.json(
        {
          error: `Send slot ${formatNz(sendSlot)} NZT has passed. Re-POST with {"sendNow":true} to approve for an immediate manual send.`,
        },
        { status: 409 }
      );
    }
    scheduledAt = new Date(now.getTime() + IMMEDIATE_SEND_DELAY_MS);
  } else {
    scheduledAt = sendSlot;
  }

  // 5. Record status (best-effort) and notify Slack (best-effort). Neither may
  //    fail the approval, and neither means mail is on its way.
  const scheduledAtIso = scheduledAt.toISOString();
  await markStatus(issueId, { status: "approved", scheduledAt: scheduledAtIso });
  await notifyNewsletterApproved({ issueId, scheduledAt });

  return NextResponse.json({
    issueId,
    status: "approved",
    sent: false,
    scheduledAt: scheduledAtIso,
    scheduledAtNz: `${formatNz(scheduledAt)} NZT`,
    renderedKb,
    nextSteps: nextStepsFor(issueId),
    note: "Approval does not send. Run the commands in nextSteps, then send the built batch with the Resend CLI.",
  });
}
