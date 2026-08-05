/**
 * Deck: No Pain, All Gain – Getting Fit for AI
 *
 * Scaffolded by `scripts/deck/new-deck.ts` from the event's own entry in
 * `lib/data/json/events-custom.json`.
 *
 * **Every fact on these slides is read from the event data at build time.** The
 * speakers, the run-sheet times, the partner logos, the title and the venue are
 * expressions, not copies — so the way to correct any of them is to edit the
 * event in `events-custom.json`, where the public event page reads them from
 * too. Editing a name into this file instead is how the website and the
 * projector come to disagree.
 *
 * What belongs in this file, and nowhere else: the accent colour, the chosen
 * photographs, the kicker on each slide, and the host note that says what to
 * say. Regenerate when the event gains or loses a whole block — a new speaker
 * group, a run sheet where there was none. Editing a fact needs no regeneration.
 *
 * Next:
 *   1. Delete the blocks tonight does not have. Everything here is optional
 *      except the closing photograph — see the comment on it.
 *   2. Replace every PLACEHOLDER note with what the host will actually say.
 *   3. Take the accent from the event poster.
 *   4. `npx tsx scripts/deck/lint-deck.ts event-lesmills-03-september-2026`
 *
 * Long-form material — biographies, terms, full venue lists — belongs on the
 * event page, which the closing QR reaches in one scan. Keep it off the wall.
 */

import {
  buildClosingSlides,
  buildOpeningSlides,
  type KarakiaText,
} from "../boilerplate";
import {
  deckMetaFrom,
  deckSubtitleFrom,
  deckTitleFrom,
  discussionMinutesFrom,
  loadEventForDeck,
  partnerLogosFrom,
  runSheetFrom,
  speakerGroupsFrom,
} from "../event-source";
import { DEFAULT_CLOSING_KARAKIA, DEFAULT_OPENING_KARAKIA } from "../karakia";
import type { Deck, DeckImage, QrBlock } from "../types";
import { archiveFrame } from "../wall-tiles";

const EVENT_SLUG = "event-lesmills-03-september-2026";

const event = loadEventForDeck(EVENT_SLUG);

/* She Sharp's standing karakia. Read them back to whoever is opening the
   evening — a venue with its own mihi replaces these two lines. */
const OPENING_KARAKIA: KarakiaText = DEFAULT_OPENING_KARAKIA;
const CLOSING_KARAKIA: KarakiaText = DEFAULT_CLOSING_KARAKIA;

const PARTNERS = partnerLogosFrom(event);
/* The run sheet is read from the event's own schedule section, so a time
   changed in `events-custom.json` changes the website and this slide
   together. Labels too long for the slide are replaced by exact match
   below — if a label is edited in the JSON its key stops matching and the
   linter says so, which is the failure we want. */
const RUN_SHEET = runSheetFrom(event);
const RUN_SHEET_LABELS: Record<string, string> = {};

const RUN_SHEET_ROWS = RUN_SHEET.items.map((row) => ({
  ...row,
  label: RUN_SHEET_LABELS[row.label] ?? row.label,
}));
const SPEAKERS = speakerGroupsFrom(event);

/* The countdown is however long the run sheet gives the discussion —
   read on every build, not frozen when this file was generated, so
   moving the block in the event data moves the clock with it. The
   fallback is only reached if the schedule loses its end time. */
const TABLE_MINUTES = discussionMinutesFrom(event) ?? 15;

/* The closing frame. One photograph from She Sharp's own archive — the
   event has none of its own yet. Swap in a real one when it does. */
const CLOSING_PHOTO: DeckImage = archiveFrame(3);

/* Codes are drawn from these URLs in the browser, so a link change here is the
   only edit a code ever needs. The feedback and ambassador codes are not here:
   the ambassador form is the same at every event and the feedback code is
   derived from EVENT_SLUG, so buildClosingSlides() supplies both. */

const WEBSITE_QR: QrBlock = {
  url: "https://www.shesharp.org.nz",
  label: "She Sharp website",
  caption: "shesharp.org.nz",
};

const EVENTS_QR: QrBlock = {
  url: "https://www.shesharp.org.nz/events",
  label: "Upcoming events",
  caption: "shesharp.org.nz/events",
};

export const eventLesmills03September2026Deck: Deck = {
  slug: EVENT_SLUG,
  title: deckTitleFrom(event),
  // Shortened from: No Pain, All Gain – Getting Fit for AI
  subtitle: deckSubtitleFrom(event),
  eventSlug: EVENT_SLUG,
  /*
   * The neon pink off the poster headline, run through
   * `accentFromBrandColour()` so it clears the contrast floor on both canvases.
   *
   * Not the navy, which covers half the poster — a background is the one
   * colour never to take. `npx tsx scripts/deck/accent-from-poster.ts` ranks
   * the candidates; this was the second, and it is the colour the poster is
   * actually about.
   */
  theme: {
    accent: {
      onLight: "#b749a9",
      onDark: "#ca53bb",
      spark: "#5ee7f5",
    },
  },
  slides: [
    ...buildOpeningSlides({
      eventTitle: deckTitleFrom(event),
      eventMeta: deckMetaFrom(event),
      partnerLogos: PARTNERS,
      karakia: OPENING_KARAKIA,
      // TODO: venue-specific safety lines — where the assembly point is, which
      // stairwell, who the warden is. The organisational defaults are already
      // there; these are added to them.
      safetyExtras: [],
      contactQrs: [WEBSITE_QR, EVENTS_QR],
    }),

    {
      id: "tonight-run-sheet",
      type: "agenda",
      section: "No Pain, All Gain",
      eyebrow: "Up again at the break",
      title: "How Tonight Runs",
      items: RUN_SHEET_ROWS,
      note: "The most-looked-at slide of the night. Leave it up while people are still finding seats, and come back to it at the break.",
    },

    {
      id: "tonights-host",
      type: "logos",
      section: "No Pain, All Gain",
      eyebrow: "They opened the doors",
      title: "Tonight's Hosts",
      lead: "Thank you for the room, the food and the evening",
      groups: [{ label: "Hosting with She Sharp", logos: PARTNERS, size: "lg" }],
      note: "Name the host organisation and the person from it who is in the room. If they are speaking later, say so now.",
    },

    {
      id: "section-main-act",
      type: "section",
      section: "Meet the Panel",
      eyebrow: "Phones down for this bit",
      index: "02",
      title: "Meet the Panel",
      note: "Hand over to the host or the facilitator here.",
    },

    {
      id: "meet-panel-speakers",
      type: "people",
      section: "Meet the Panel",
      eyebrow: "Please welcome them",
      title: "Meet the Panel",
      people: SPEAKERS[0]?.people ?? [],
      density: "lg",
      shape: "card",
      note: "Read the names out. Say each person's role, not their biography — the full bios are on the event page behind the closing QR code.",
    },

    {
      id: "what-well-explore",
      type: "bullets",
      section: "Meet the Panel",
      eyebrow: "Ask about any of these",
      title: "What You'll Explore",
      items: [
        "How AI is impacting different roles across an organisation",
        "Legal and privacy implications of AI",
        "Commercial impact of AI",
        "Communication and change management",
        "Technical perspectives and real use cases",
      ],
      note: "These came from the event page, shortened to fit. Say them as an invitation to ask questions, not as a syllabus.",
    },

    {
      id: "section-the-tables",
      type: "section",
      section: "Over To The Room",
      eyebrow: "Everyone talks now",
      index: "03",
      title: "Over To The Room",
      note: "Get people turned towards each other before you explain the task.",
    },

    /*
     * The prompts are a placeholder. They are the one thing on this slide that
     * cannot come from the event data, because nobody writes table questions
     * down before the night.
     */
    {
      id: "how-the-tables-work",
      type: "bullets",
      section: "Over To The Room",
      eyebrow: "Talk to someone new",
      title: "At Your Table",
      items: [
        "One person writes, everyone talks",
        "Start with what you already do",
        "Two minutes to report back",
      ],
      note: "PLACEHOLDER — replace these three with the actual prompts. Read them out slowly, then say how long they have.",
    },

    /*
     * The clock is the run sheet's own allowance for this block — at the time
     * of writing 15 minutes — and it is read from the event data on every
     * build. To change it, move the times in `events-custom.json`; do not edit
     * a number here, and do not regenerate just for this.
     */
    {
      id: "table-discussion",
      type: "break",
      section: "Over To The Room",
      eyebrow: "Space starts the clock",
      title: "Over to You",
      lead: "Talk it through, then we will hear from every table",
      minutes: TABLE_MINUTES,
      resumeLabel: "Back together",
      note: "Press Space to start the countdown and Space again to pause it. The clock on the wall is what gets a room back on time.",
    },

    {
      id: "readouts",
      type: "bullets",
      section: "Over To The Room",
      eyebrow: "One voice per table",
      title: "What Did You Find?",
      items: [
        "One thing you agreed on",
        "One thing you disagreed on",
        "One thing you will try",
      ],
      note: "Keep each table to under a minute. Repeat the good ones back to the room so the people at the back hear them.",
    },

    /*
     * The deck's closing sequence is four information slides in a row, which
     * is the limit — so the middle has to end on a full-frame slide or the run
     * reaches five and the deck fails its shape check. This slide is never
     * optional. Change the photograph, not the slide.
     */
    {
      id: "close-networking",
      type: "photo",
      section: "No Pain, All Gain",
      eyebrow: "Doors open till the end",
      image: CLOSING_PHOTO,
      overlay: "scrim",
      title: "Stay and Talk",
      lead: "Networking and event close",
      note: "Leave this up while people talk. It is the last thing they see.",
    },

    ...buildClosingSlides({
      thanksLogos: [{ label: "Hosts and partners", logos: PARTNERS }],
      // TODO: volunteers, facilitators and helpers to thank by name.
      thanksNames: [],
      // TODO: snapshot from getUpcomingEvents() at authoring time — never call
      // it at render time. It is relative to today, and would change the
      // projector content under the host.
      upcoming: [],
      // The feedback code is derived from the slug — nothing to paste.
      eventSlug: EVENT_SLUG,
      karakia: CLOSING_KARAKIA,
    }),
  ],
};
