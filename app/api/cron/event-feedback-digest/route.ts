import { NextRequest, NextResponse } from 'next/server';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { activityLogs, ActivityType } from '@/lib/db/schema';
import { getAllEvents } from '@/lib/data/events';
import {
  buildFeedbackSummary,
  eventsDueForDigest,
} from '@/lib/forms/event-feedback-summary';
import { sendEventFeedbackDigest } from '@/lib/slack/service';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * How long after an event the summary goes out.
 *
 * Three days. Long enough that the tail of late responses — the people who
 * scanned the code, got distracted, and filled it in on the train the next
 * morning — is in, and short enough that the event is still fresh enough for
 * the team to act on what it says. Waiting a week reliably means reading it
 * after the next event has already been planned.
 */
const DIGEST_DELAY_DAYS = 3;

/**
 * Has this event already been digested?
 *
 * Recorded in `activity_logs` rather than a column on the event, because the
 * public site's events live in a JSON file that this route must not write to.
 * `action` is a plain text column, so a new `ActivityType` needs no migration.
 */
async function alreadySent(eventSlug: string): Promise<boolean> {
  const [row] = await db
    .select({ id: activityLogs.id })
    .from(activityLogs)
    .where(
      and(
        eq(activityLogs.action, ActivityType.SEND_EVENT_FEEDBACK_DIGEST),
        sql`${activityLogs.metadata}->>'eventSlug' = ${eventSlug}`,
      ),
    )
    .limit(1);

  return Boolean(row);
}

async function runJob(slugOverride?: string) {
  const events = getAllEvents().map((event) => ({
    slug: event.slug,
    date: event.date,
  }));

  const due = slugOverride
    ? [slugOverride]
    : eventsDueForDigest(events, DIGEST_DELAY_DAYS);

  const sent: string[] = [];
  const skipped: string[] = [];

  for (const slug of due) {
    // A manual trigger names its event and means it, so it is allowed to
    // re-send; the daily cron must never post the same digest twice.
    if (!slugOverride && (await alreadySent(slug))) {
      skipped.push(slug);
      continue;
    }

    const summary = await buildFeedbackSummary(slug);
    if (!summary) {
      skipped.push(slug);
      continue;
    }

    await sendEventFeedbackDigest(summary);

    await db.insert(activityLogs).values({
      action: ActivityType.SEND_EVENT_FEEDBACK_DIGEST,
      entityType: 'event_feedback_digest',
      metadata: { eventSlug: slug, responses: summary.responses },
    });

    sent.push(slug);
  }

  return NextResponse.json({ ok: true, sent, skipped, checked: due.length });
}

/**
 * GET /api/cron/event-feedback-digest
 * Vercel Cron entry point. Schedule (vercel.json): "0 21 * * *"
 *   = daily 21:00 UTC = 09:00 NZST the following morning.
 * In production, requires Authorization: Bearer ${CRON_SECRET}.
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      console.error('CRON_SECRET not configured');
      return NextResponse.json({ error: 'Cron secret not configured' }, { status: 500 });
    }
    if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return runJob();
}

/**
 * POST /api/cron/event-feedback-digest
 * Manual trigger: `{ "eventSlug": "..." }` posts that event's digest now,
 * whatever the date and whether or not one has already gone out.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!(cronSecret && authHeader === `Bearer ${cronSecret}`)) {
    const { getUser } = await import('@/lib/db/queries');
    const { isUserAdmin } = await import('@/lib/auth/permissions');

    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isAdmin = await isUserAdmin(user.id);
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let eventSlug: string | undefined;
  try {
    const body = await request.json();
    eventSlug = typeof body?.eventSlug === 'string' ? body.eventSlug : undefined;
  } catch {
    // No body is fine — fall through to the same date-driven sweep as the cron.
  }

  return runJob(eventSlug);
}
