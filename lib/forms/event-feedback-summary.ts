/**
 * Post-event feedback summary.
 *
 * One card per response is the right shape for following somebody up and the
 * wrong shape for answering "how did the event actually go" — a week later that
 * question can only be answered by scrolling Slack or writing SQL, and so it
 * mostly does not get answered. This builds the aggregate that does answer it,
 * and it is deliberately the same computation that feeds `report/`: the H1 2026
 * funder report had no participant-feedback figures at all because no survey
 * ran, and the point of collecting this is to have them next time.
 */

import { asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { eventFeedbackSubmissions } from '@/lib/db/schema';
import { getEventBySlug, parseDateString } from '@/lib/data/events';

export interface FeedbackSummary {
  eventSlug: string;
  eventTitle: string;
  eventDate: string;
  responses: number;
  /** Attendee count from `events-custom.json`, when the event records one. */
  attendees: number | null;
  /** responses / attendees, or null when we have no denominator. */
  responseRate: number | null;
  averageRating: number | null;
  /** Count per 1–5 star, index 0 = one star. */
  ratingCounts: number[];
  /** Net Promoter Score, -100..100, or null when nobody moved the slider. */
  nps: number | null;
  promoters: number;
  passives: number;
  detractors: number;
  npsResponses: number;
  attendAgain: { yes: number; maybe: number; no: number; unanswered: number };
  interests: { mentorship: number; volunteering: number; newsletter: number };
  whatWorked: string[];
  whatToImprove: string[];
}

/**
 * Standard NPS buckets: 9–10 promoters, 7–8 passives, 0–6 detractors, score is
 * %promoters − %detractors. Written out rather than assumed, because the
 * asymmetry surprises people reading the number for the first time — a room
 * that mostly answers 7 and 8 scores zero, not seventy.
 */
function npsBucket(score: number): 'promoter' | 'passive' | 'detractor' {
  if (score >= 9) return 'promoter';
  if (score >= 7) return 'passive';
  return 'detractor';
}

export async function buildFeedbackSummary(
  eventSlug: string,
): Promise<FeedbackSummary | null> {
  const event = getEventBySlug(eventSlug);
  if (!event) return null;

  const rows = await db
    .select()
    .from(eventFeedbackSubmissions)
    .where(eq(eventFeedbackSubmissions.eventSlug, eventSlug))
    .orderBy(asc(eventFeedbackSubmissions.submittedAt));

  const ratingCounts = [0, 0, 0, 0, 0];
  let ratingTotal = 0;

  let promoters = 0;
  let passives = 0;
  let detractors = 0;
  let npsResponses = 0;

  const attendAgain = { yes: 0, maybe: 0, no: 0, unanswered: 0 };
  const interests = { mentorship: 0, volunteering: 0, newsletter: 0 };
  const whatWorked: string[] = [];
  const whatToImprove: string[] = [];

  for (const row of rows) {
    if (row.overallRating >= 1 && row.overallRating <= 5) {
      ratingCounts[row.overallRating - 1] += 1;
      ratingTotal += row.overallRating;
    }

    if (row.recommendScore !== null && row.recommendScore !== undefined) {
      npsResponses += 1;
      const bucket = npsBucket(row.recommendScore);
      if (bucket === 'promoter') promoters += 1;
      else if (bucket === 'passive') passives += 1;
      else detractors += 1;
    }

    if (row.wouldAttendAgain === 'yes') attendAgain.yes += 1;
    else if (row.wouldAttendAgain === 'maybe') attendAgain.maybe += 1;
    else if (row.wouldAttendAgain === 'no') attendAgain.no += 1;
    else attendAgain.unanswered += 1;

    if (row.interestedInMentorship) interests.mentorship += 1;
    if (row.interestedInVolunteering) interests.volunteering += 1;
    if (row.interestedInNewsletter) interests.newsletter += 1;

    const worked = row.whatWorked?.trim();
    if (worked) whatWorked.push(worked);
    const improve = row.whatToImprove?.trim();
    if (improve) whatToImprove.push(improve);
  }

  const responses = rows.length;
  const attendees = event.attendees ?? null;

  return {
    eventSlug,
    eventTitle: event.title,
    eventDate: event.date,
    responses,
    attendees,
    // A bare "24 responses" is unreadable without a denominator — 24 out of 30
    // and 24 out of 300 are opposite results and look identical in Slack.
    responseRate:
      attendees && attendees > 0 ? responses / attendees : null,
    averageRating: responses > 0 ? ratingTotal / responses : null,
    ratingCounts,
    nps:
      npsResponses > 0
        ? Math.round((promoters / npsResponses) * 100 - (detractors / npsResponses) * 100)
        : null,
    promoters,
    passives,
    detractors,
    npsResponses,
    attendAgain,
    interests,
    whatWorked,
    whatToImprove,
  };
}

/** Events whose date is exactly `daysAfter` days ago, in NZ calendar terms. */
export function eventsDueForDigest(
  allSlugs: { slug: string; date: string }[],
  daysAfter: number,
  now: Date = new Date(),
): string[] {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  return allSlugs
    .filter(({ date }) => {
      const eventDay = parseDateString(date);
      eventDay.setHours(0, 0, 0, 0);
      const days = Math.round(
        (today.getTime() - eventDay.getTime()) / 86_400_000,
      );
      return days === daysAfter;
    })
    .map(({ slug }) => slug);
}
