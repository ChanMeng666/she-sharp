import { NextRequest, NextResponse } from "next/server";

import { markStatus, getStatus } from "@/lib/newsletter/drafts";
import { getIssue } from "@/lib/newsletter/issues-registry";
import { notifyNewsletterScheduled } from "@/lib/newsletter/notify";
import { renderNewsletter } from "@/lib/newsletter/render";
import { createBroadcast, sendBroadcast } from "@/lib/newsletter/resend-api";
import { lastThursdaySendAt } from "@/lib/newsletter/schedule";
import { issueIdSchema } from "@/lib/newsletter/schema";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DEFAULT_FROM = "She Sharp <noreply@shesharp.org.nz>";
const REPLY_TO = "mentoring@shesharp.org.nz";
/** Immediate-send delay: gives a cancel window in the Resend dashboard. */
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
 * POST /api/admin/newsletter/[issue]/approve
 *
 * Approves a committed+deployed newsletter issue and schedules it as a Resend
 * broadcast. Reads ONLY the deployed JSON fixture (never the Redis draft) so the
 * emailed broadcast is byte-identical to the web version. By default it schedules
 * for the issue's canonical send slot (last Thursday 10am NZ); if that slot has
 * already passed it refuses unless `{ sendNow: true }` is provided, in which case
 * it queues an immediate send 5 minutes out (a dashboard cancel window).
 *
 * Auth: a CRON_SECRET bearer token OR an admin session (same dual pattern as the
 * newsletter cron/draft endpoints).
 *
 * Body: { sendNow?: boolean }.
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
  //    and (belt & braces, across deploys) per the Redis status record.
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

  // 3. Required Resend env for a broadcast.
  const segmentId = process.env.RESEND_NEWSLETTER_SEGMENT_ID;
  const topicId = process.env.RESEND_NEWSLETTER_TOPIC_ID;
  if (!segmentId || !topicId || !process.env.RESEND_API_KEY) {
    return NextResponse.json(
      {
        error:
          "Missing Resend configuration. RESEND_API_KEY, RESEND_NEWSLETTER_SEGMENT_ID, and RESEND_NEWSLETTER_TOPIC_ID must all be set.",
      },
      { status: 500 }
    );
  }

  // 4. Render broadcast HTML/text. The renderer's >100KB throw is the size gate.
  let html: string;
  let text: string;
  try {
    ({ html, text } = await renderNewsletter(issue, "broadcast"));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Render failed" },
      { status: 422 }
    );
  }

  // 5. Resolve the send instant. Default = canonical send slot; if it has passed,
  //    refuse unless sendNow, then queue 5 minutes out.
  const [year, month] = issueId.split("-").map(Number);
  const sendSlot = lastThursdaySendAt(year, month);
  const now = new Date();

  let scheduledAt: Date;
  if (sendSlot.getTime() <= now.getTime()) {
    if (!sendNow) {
      return NextResponse.json(
        {
          error: `Send slot ${formatNz(sendSlot)} NZT has passed. Re-POST with {"sendNow":true} to send immediately.`,
        },
        { status: 409 }
      );
    }
    scheduledAt = new Date(now.getTime() + IMMEDIATE_SEND_DELAY_MS);
  } else {
    scheduledAt = sendSlot;
  }

  // 6. Create the broadcast, then schedule the send.
  const scheduledAtIso = scheduledAt.toISOString();
  try {
    const { id: broadcastId } = await createBroadcast({
      segmentId,
      topicId,
      from: process.env.EMAIL_FROM || DEFAULT_FROM,
      replyTo: REPLY_TO,
      subject: issue.editorial.subjectLine,
      html,
      text,
      name: `newsletter-${issueId}`,
    });

    await sendBroadcast(broadcastId, { scheduledAt: scheduledAtIso });

    // 7. Record status (best-effort) and notify Slack (best-effort).
    await markStatus(issueId, {
      status: "scheduled",
      broadcastId,
      scheduledAt: scheduledAtIso,
    });
    await notifyNewsletterScheduled({ issueId, broadcastId, scheduledAt });

    return NextResponse.json({ issueId, broadcastId, scheduledAt: scheduledAtIso });
  } catch (error) {
    console.error(`Newsletter approve failed for ${issueId}:`, error);
    return NextResponse.json(
      {
        error: "Failed to schedule broadcast on Resend",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502 }
    );
  }
}
