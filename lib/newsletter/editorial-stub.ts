/**
 * The empty, no-AI shape of a newsletter issue's `editorial` block.
 *
 * This is the starting point a human edits. It is deliberately generic but
 * always schema-valid, so `scripts/newsletter/new-issue.ts` can write a
 * complete issue file with no API key, no Redis and no network call, and the
 * month's first diff is a human giving it real voice rather than a machine
 * rewriting a machine.
 *
 * It used to live in `lib/newsletter/generate.ts`, beside the OpenAI drafting
 * pass, and outlived it when that pass was deleted (the generated draft was
 * rewritten by hand every month anyway). It is NOT in `schema.ts`, even though
 * that module owns the shape: the stub needs `evergreenPulse` from `pulse.ts`,
 * and `schema.ts` is a pure-zod leaf imported by the render path, the approve
 * route and the issue registry. Folding the stub in there would put `pulse.ts`'s
 * dependency graph behind every schema import.
 *
 * That graph is smaller than it was when this file was written. The reason
 * given here was "the OpenAI SDK, cheerio and rss-parser", and **the OpenAI SDK
 * is gone** — `lib/newsletter/` no longer imports it anywhere, since the Pulse
 * is now written by whichever agent runs the skill and only validated by code.
 * `cheerio` and `rss-parser` remain, which is still enough reason to keep the
 * separation. Recorded rather than quietly corrected because a stale reason is
 * how a decision stops being reviewable: if those two ever go as well, this
 * module can fold into `schema.ts` and nobody has to re-derive why it did not.
 */

import { evergreenPulse } from "./pulse";
import type { IssueAuto, IssueEditorial } from "./schema";

/** Canonical evergreen get-involved links (absolute — email needs absolute URLs). */
const MENTOR_URL = "https://www.shesharp.org.nz/mentorship/mentor";
const VOLUNTEER_URL = "https://www.shesharp.org.nz/join-our-team";
const DONATE_URL = "https://www.shesharp.org.nz/donate";

/** The three evergreen opportunities, in their fixed order (hrefs are non-negotiable). */
const EVERGREEN_OPPORTUNITIES: IssueEditorial["opportunities"] = [
  {
    title: "Become a mentor",
    body: "Share your experience with a woman finding her feet in STEM. Our mentorship programme pairs you with a mentee and gives you the structure to make it count.",
    href: MENTOR_URL,
  },
  {
    title: "Volunteer with us",
    body: "Every event runs on people who lend a hand. Help out behind the scenes, grow your network, and see the community from the inside.",
    href: VOLUNTEER_URL,
  },
  {
    title: "Support She Sharp",
    body: "Our events are free because people back them. A donation of any size keeps the doors open for the next wave of women in tech.",
    href: DONATE_URL,
  },
];

/**
 * Builds the empty editorial block for an issue from its `auto` snapshot.
 *
 * The primary CTA points at the first upcoming event (its registration link if
 * present, else its page), or the mentor sign-up when there are no upcoming
 * events. The pulse section is filled from the evergreen fact pool, rotated by
 * `monthIndex` so two consecutive months do not open on the same fact.
 *
 * @param auto The machine snapshot from `assembleAutoData()`.
 * @param monthIndex 0-11 month used to rotate the evergreen pool; defaults to
 *   the current month.
 */
export function emptyEditorialStub(
  auto: IssueAuto,
  monthIndex: number = new Date().getMonth()
): IssueEditorial {
  const firstUpcoming = auto.upcomingEvents[0] ?? null;

  const primaryCta = firstUpcoming
    ? {
        label: "See what's on",
        href: firstUpcoming.registrationUrl ?? firstUpcoming.url,
      }
    : { label: "Become a mentor", href: MENTOR_URL };

  const eventBlurbs: Record<string, string> = {};
  for (const event of auto.recapEvents) {
    eventBlurbs[event.slug] =
      `${event.title} brought our community together — thank you to everyone who came along.`;
  }

  return {
    subjectLine: "Your She Sharp community update",
    previewText:
      "A look back at recent events, plus upcoming ways to connect, learn, and get involved with women in STEM.",
    founderNote: {
      heading: "A note from the team",
      bodyMd:
        "Kia ora,\n\nThank you for being part of the She Sharp community. Here is a quick round-up of what we have been up to and what is coming next.\n\nWe would love to see you at an upcoming event, and there are always ways to get more involved — as a mentor, a volunteer, or a supporter.",
      signature: "The She Sharp Team",
      photoUrl: null,
    },
    // Promoting an event to the headline block is a human curation call.
    headline: null,
    photoOfTheMonth: null,
    recapIntro: "Here is a look back at what our community got up to recently.",
    eventBlurbs,
    primaryCta,
    opportunities: EVERGREEN_OPPORTUNITIES,
    sponsorThanks:
      "A heartfelt thank you to the sponsors, host venues, and volunteers who make our events possible. This community would not exist without you.",
    heroImageUrl: null,
    // Off in the stub, and a deliberate decision each time it goes on: the
    // re-permission ask is a campaign with an end, and an issue that carries it
    // every month reads as nagging.
    askToReconfirm: false,
    pulse: evergreenPulse(monthIndex),
  };
}
