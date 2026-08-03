/**
 * Retention for post-event feedback.
 *
 * Every row has carried a name and an email address since 2026-08-03, when both
 * became required. That turned a table of ratings into a register of identified
 * people, and identified personal information cannot simply sit there forever:
 * under the Privacy Act 2020 (IPP 9) an agency must not keep personal
 * information for longer than it is needed for the purpose it was collected
 * for, and the purposes here — following up on what somebody said, and running
 * the prize draw — are finished within a few months of the event.
 *
 * **Anonymise, do not delete.** The personal columns are what expires; the
 * ratings, the scores and the free text are the organisation's own record of
 * how its events went, they feed the funder report, and destroying them would
 * lose years of measurement to satisfy a rule that only concerns the identity.
 * So `anonymiseOldFeedback()` nulls `name` and `email` and leaves the row.
 *
 * Anonymising is irreversible by design — that is the point — so the entry
 * point runs a dry run unless explicitly told otherwise.
 */

import { and, isNotNull, lt, or, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { eventFeedbackSubmissions } from '@/lib/db/schema';

/**
 * How long a name and address stay attached to a feedback row.
 *
 * Twelve months. Long enough that a prize draw, a thank-you and any follow-up
 * conversation have all comfortably happened, and that a year-on-year report
 * can still reach somebody about last year's event; short enough that the table
 * is not an indefinite mailing list nobody consented to.
 */
export const FEEDBACK_RETENTION_MONTHS = 12;

export interface RetentionResult {
  /** Rows whose personal columns are past the window and still populated. */
  due: number;
  /** Rows actually anonymised. Zero on a dry run. */
  anonymised: number;
  cutoff: Date;
  dryRun: boolean;
}

export function retentionCutoff(now: Date = new Date()): Date {
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - FEEDBACK_RETENTION_MONTHS);
  return cutoff;
}

/**
 * Strips names and email addresses from feedback older than the retention
 * window, keeping the answers.
 *
 * Rows already anonymised are skipped, so this is safe to run repeatedly and
 * the `due` count reflects real work rather than the size of the archive.
 */
export async function anonymiseOldFeedback(
  options: { dryRun?: boolean; now?: Date } = {},
): Promise<RetentionResult> {
  const dryRun = options.dryRun ?? true;
  const cutoff = retentionCutoff(options.now);

  const stillIdentified = and(
    lt(eventFeedbackSubmissions.submittedAt, cutoff),
    or(
      isNotNull(eventFeedbackSubmissions.name),
      isNotNull(eventFeedbackSubmissions.email),
    ),
  );

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(eventFeedbackSubmissions)
    .where(stillIdentified);

  if (dryRun || count === 0) {
    return { due: count, anonymised: 0, cutoff, dryRun };
  }

  const updated = await db
    .update(eventFeedbackSubmissions)
    .set({ name: null, email: null })
    .where(stillIdentified)
    .returning({ id: eventFeedbackSubmissions.id });

  return { due: count, anonymised: updated.length, cutoff, dryRun };
}
