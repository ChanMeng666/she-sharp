/**
 * List the people who asked to hear more, for one event.
 *
 *   npx tsx scripts/events/feedback-interests.ts <event-slug>
 *   npx tsx scripts/events/feedback-interests.ts <event-slug> --csv
 *
 * This exists because the checkboxes on the feedback form subscribe nobody.
 * Under `.claude/skills/update-mailing-list/references/consent-rules.md` a
 * ticked box on a feedback form is not a subscription record, whichever
 * platform happens to be sending — so the boxes are an expression of interest
 * that a human has to act on, and a box that promises something nobody
 * delivers is worse than no box at all.
 *
 * Which platform that is, and how far the move off Mailchimp has got, is
 * tracked in `docs/development/EMAIL_PLATFORM_STRATEGY.md`. Deliberately not
 * restated here: this script would go quietly out of date the day it changes,
 * and nothing it does depends on the answer.
 *
 * Output is deliberately paste-ready: names and addresses grouped by what they
 * asked for, so whoever picks this up can add them through whichever front door
 * that programme actually uses.
 */

import 'dotenv/config';
import { asc, eq, or } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { eventFeedbackSubmissions } from '@/lib/db/schema';
import { getEventBySlug } from '@/lib/data/events';

type Interest = 'mentorship' | 'volunteering' | 'newsletter';

const LABELS: Record<Interest, string> = {
  mentorship: 'Mentorship programme',
  volunteering: 'Volunteering & ambassadors',
  newsletter: 'Monthly newsletter',
};

async function main(): Promise<void> {
  const slug = process.argv[2];
  const asCsv = process.argv.includes('--csv');

  if (!slug) {
    console.error('Usage: npx tsx scripts/events/feedback-interests.ts <event-slug> [--csv]');
    process.exit(1);
  }

  const event = getEventBySlug(slug);
  if (!event) {
    console.error(`No event found for slug "${slug}".`);
    process.exit(1);
  }

  const rows = await db
    .select()
    .from(eventFeedbackSubmissions)
    .where(
      or(
        eq(eventFeedbackSubmissions.interestedInMentorship, true),
        eq(eventFeedbackSubmissions.interestedInVolunteering, true),
        eq(eventFeedbackSubmissions.interestedInNewsletter, true),
      ),
    )
    .orderBy(asc(eventFeedbackSubmissions.submittedAt));

  const forEvent = rows.filter((row) => row.eventSlug === slug);

  if (forEvent.length === 0) {
    console.log(`Nobody ticked a box for "${event.title}".`);
    return;
  }

  if (asCsv) {
    console.log('name,email,mentorship,volunteering,newsletter');
    for (const r of forEvent) {
      console.log(
        [
          JSON.stringify(r.name ?? ''),
          JSON.stringify(r.email ?? ''),
          r.interestedInMentorship,
          r.interestedInVolunteering,
          r.interestedInNewsletter,
        ].join(','),
      );
    }
    return;
  }

  console.log(`Asked to hear more — ${event.title}`);
  console.log('');

  const groups: [Interest, typeof forEvent][] = [
    ['mentorship', forEvent.filter((r) => r.interestedInMentorship)],
    ['volunteering', forEvent.filter((r) => r.interestedInVolunteering)],
    ['newsletter', forEvent.filter((r) => r.interestedInNewsletter)],
  ];

  for (const [key, people] of groups) {
    console.log(`${LABELS[key]} — ${people.length}`);
    if (people.length === 0) {
      console.log('  (nobody)');
    } else {
      for (const p of people) {
        // A row can be anonymised by the retention job while its interest flags
        // survive; say so rather than printing an empty line.
        console.log(`  ${p.name ?? '(name removed)'} — ${p.email ?? '(address removed)'}`);
      }
    }
    console.log('');
  }

  console.log(
    'Nobody here is subscribed. Adding anyone to the newsletter list goes\n' +
      'through /update-mailing-list, which records an opt-in source and date;\n' +
      'read .claude/skills/update-mailing-list/references/consent-rules.md first.',
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
