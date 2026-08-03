/**
 * Strip names and email addresses from feedback past the retention window.
 *
 *   npx tsx scripts/events/purge-feedback-personal-data.ts            # dry run
 *   npx tsx scripts/events/purge-feedback-personal-data.ts --apply    # do it
 *
 * Dry run is the default and `--apply` is the only way past it, because
 * anonymising is irreversible: the names and addresses are not archived
 * anywhere else, so a mistaken run cannot be undone from a backup of this
 * table alone.
 *
 * The answers themselves are never touched — see the reasoning in
 * `lib/forms/event-feedback-retention.ts`.
 */

import 'dotenv/config';
import {
  anonymiseOldFeedback,
  retentionCutoff,
  FEEDBACK_RETENTION_MONTHS,
} from '@/lib/forms/event-feedback-retention';

async function main(): Promise<void> {
  const apply = process.argv.includes('--apply');
  const cutoff = retentionCutoff();

  console.log('Event feedback — personal data retention');
  console.log(`  Window : ${FEEDBACK_RETENTION_MONTHS} months`);
  console.log(`  Cutoff : ${cutoff.toISOString().slice(0, 10)} (anything submitted before this)`);
  console.log(`  Mode   : ${apply ? 'APPLY — will anonymise' : 'dry run'}`);
  console.log('');

  const result = await anonymiseOldFeedback({ dryRun: !apply });

  if (result.due === 0) {
    console.log('Nothing to do — no rows past the window still carry a name or address.');
    return;
  }

  if (result.dryRun) {
    console.log(`${result.due} row(s) are past the window and still identified.`);
    console.log('Re-run with --apply to strip the name and email from them.');
    console.log('The ratings, scores and free text stay exactly as they are.');
    return;
  }

  console.log(`Anonymised ${result.anonymised} of ${result.due} row(s).`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Retention run failed:', error);
    process.exit(1);
  });
