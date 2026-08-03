'use server';

import { and, desc, eq, gte } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  eventFeedbackSubmissions,
  activityLogs,
  ActivityType,
} from '@/lib/db/schema';
import { getEventBySlug } from '@/lib/data/events';
import { sendEventFeedbackSlackNotification } from '@/lib/slack/service';

export interface EventFeedbackData {
  eventSlug: string;
  overallRating: number;
  recommendScore?: number;
  wouldAttendAgain?: 'yes' | 'maybe' | 'no';
  whatWorked?: string;
  whatToImprove?: string;
  interests: ('mentorship' | 'volunteering' | 'newsletter')[];
  name?: string;
  email?: string;
  source: 'deck_qr' | 'event_page' | 'direct_link' | 'email';
}

export interface SubmitResult {
  success: boolean;
  submissionId?: number;
  error?: string;
}

/**
 * How long after a first submission a repeat from the same address is treated as
 * a correction rather than a second opinion.
 *
 * Two hours, narrowed from 24 on 2026-08-03 when name and email became
 * required. While email was optional this window only caught the minority who
 * volunteered an address; now it catches everyone, and a 24-hour overwrite
 * silently destroys two kinds of real data:
 *
 *  - **Multi-day events.** A festival's Day One and Day Two feedback arrive
 *    inside the same 24 hours from the same person, and the second overwrites
 *    the first. The Aotearoa AI Hackathon Festival is exactly this shape.
 *  - **Shared addresses.** Couples and some small teams submit from one inbox;
 *    the second person silently replaces the first.
 *
 * Two hours still covers what this is actually for — a double-tapped submit, or
 * someone reopening the tab a few minutes later to fix a typo or add the thing
 * they meant to say. Anything later is a second opinion and is kept as its own
 * row.
 */
const DEDUP_WINDOW_MS = 2 * 60 * 60 * 1000;

/**
 * Submits post-event feedback: resolves the event, inserts or updates the row,
 * logs activity, and sends a Slack notification.
 */
export async function submitEventFeedback(data: EventFeedbackData): Promise<SubmitResult> {
  try {
    // The event must exist in the public site's source of truth. There is no FK
    // to lean on here (see the table comment in schema.ts), so this is the only
    // thing standing between a typo'd short code and orphaned feedback rows.
    const event = getEventBySlug(data.eventSlug);
    if (!event) {
      return { success: false, error: 'Unknown event.' };
    }

    // Snapshot the title as it reads today. The JSON title gets edited — events
    // are renamed, years appended — and the row should keep what this person
    // actually rated, not whatever the event is called when someone reads it back.
    const eventTitle = event.title;

    const email = data.email?.toLowerCase().trim() || null;
    const values = {
      eventSlug: data.eventSlug,
      eventTitle,
      overallRating: data.overallRating,
      recommendScore: data.recommendScore ?? null,
      // Stored as the answer given, not as a boolean — see `eventAttendAgainEnum`.
      wouldAttendAgain: data.wouldAttendAgain ?? null,
      whatWorked: data.whatWorked?.trim() || null,
      whatToImprove: data.whatToImprove?.trim() || null,
      interestedInMentorship: data.interests.includes('mentorship'),
      interestedInVolunteering: data.interests.includes('volunteering'),
      interestedInNewsletter: data.interests.includes('newsletter'),
      name: data.name?.trim() || null,
      email,
      source: data.source,
    };

    // Soft de-duplication: within the window, the same address answering the
    // same event overwrites its own row — last answer wins. Anonymous rows are
    // never de-duplicated because there is nothing to key on, and collapsing
    // them by IP would silently merge a whole hall behind one NAT.
    let submission: typeof eventFeedbackSubmissions.$inferSelect | undefined;
    let isUpdate = false;

    if (email) {
      const [existing] = await db
        .select({ id: eventFeedbackSubmissions.id })
        .from(eventFeedbackSubmissions)
        .where(
          and(
            eq(eventFeedbackSubmissions.eventSlug, data.eventSlug),
            eq(eventFeedbackSubmissions.email, email),
            gte(eventFeedbackSubmissions.submittedAt, new Date(Date.now() - DEDUP_WINDOW_MS))
          )
        )
        .orderBy(desc(eventFeedbackSubmissions.submittedAt))
        .limit(1);

      if (existing) {
        [submission] = await db
          .update(eventFeedbackSubmissions)
          .set({ ...values, submittedAt: new Date() })
          .where(eq(eventFeedbackSubmissions.id, existing.id))
          .returning();
        isUpdate = true;
      }
    }

    if (!submission) {
      [submission] = await db.insert(eventFeedbackSubmissions).values(values).returning();
    }

    // Log activity
    await db.insert(activityLogs).values({
      action: ActivityType.SUBMIT_EVENT_FEEDBACK,
      entityType: 'event_feedback',
      entityId: submission.id,
      metadata: {
        eventSlug: data.eventSlug,
        overallRating: data.overallRating,
        email,
      },
    });

    // Send Slack notification (non-blocking)
    try {
      await sendEventFeedbackSlackNotification({
        submissionId: submission.id,
        eventSlug: data.eventSlug,
        eventTitle,
        overallRating: data.overallRating,
        recommendScore: data.recommendScore,
        wouldAttendAgain: data.wouldAttendAgain,
        whatWorked: values.whatWorked,
        whatToImprove: values.whatToImprove,
        interests: data.interests,
        name: values.name,
        email,
        source: data.source,
        isUpdate,
      });
    } catch (err) {
      console.error('Slack event feedback notification error:', err);
    }

    return { success: true, submissionId: submission.id };
  } catch (error) {
    console.error('Error submitting event feedback:', error);
    return { success: false, error: 'Failed to save your feedback.' };
  }
}
