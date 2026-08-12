/**
 * Deck: No Pain, All Gain – Getting Fit for AI — Les Mills Auckland City,
 * Thursday 3 September 2026, 5:00–7:30pm.
 *
 * One evening, one host, one projector. The nine opening and five closing
 * slides come from `buildOpeningSlides()` / `buildClosingSlides()` so the team,
 * the impact figures and the sponsor wall stay live; the ten slides between
 * them are this evening.
 *
 * **Every fact on these slides is read from the event at build time** through
 * `lib/deck/event-source.ts` — the speakers, the run-sheet times, the partner
 * logo, the title and the venue are expressions, not copies. So the way to
 * correct any of them is to edit `lib/data/json/events-custom.json`, where the
 * public event page reads them from too. Editing a name into this file instead
 * is how the website and the projector come to disagree, and the disagreement
 * is invisible until somebody in the room notices.
 *
 * What belongs in this file and nowhere else: the accent pair, the chosen
 * imagery, the kicker on each slide, and the host note that says what to say.
 *
 * DELIBERATELY NOT ON SCREEN — it is on the event page, which the closing QR
 * reaches in one scan, and every sentence the room reads is a sentence it is
 * not hearing:
 *   - the four panellists' biographies
 *   - the full venue address and access details
 *   - the long-form description of what the evening is for
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
import type { Deck, DeckImage, DeckSkin, QrBlock, Slide } from "../types";
import { archiveFrame } from "../wall-tiles";
import { deckPlates, plateSrcSet } from "@/public/img/plates";

const EVENT_SLUG = "event-lesmills-03-september-2026";

const event = loadEventForDeck(EVENT_SLUG);

/* She Sharp's standing karakia. A venue opening with its own mihi, or a guest
   reading something else, replaces these two consts and nothing more. */
const OPENING_KARAKIA: KarakiaText = DEFAULT_OPENING_KARAKIA;
const CLOSING_KARAKIA: KarakiaText = DEFAULT_CLOSING_KARAKIA;

// --- Imagery ---------------------------------------------------------------

/**
 * The evening's own picture: a lit braid of fibre-optic strands, twisted like
 * the fascicles of a muscle.
 *
 * Generated with gpt-image-2 at 2048×3072 and cropped to the deck's 3:2, from
 * the same four candidates the event's new poster was built from — so the
 * projector and the poster are one piece of art direction rather than two. It
 * is the only honest picture available for this evening: a fitness company
 * talking about AI, in a deck whose photographic archive contains neither a gym
 * nor a panel that has happened yet.
 *
 * IT IS NOT A PHOTOGRAPH AND MUST NEVER BE CAPTIONED AS ONE. Nothing in the She
 * Sharp archive looks like this, which is exactly why it is safe to use: it
 * could not be mistaken for a real event photograph, and the archive's whole
 * value is that it is true. It carries no people, nothing that imitates taonga,
 * and no branding.
 *
 * Two different frames, not one used twice. The chapter card and the countdown
 * are forty minutes apart, and repeating the image would make the second read
 * as the deck looping rather than moving.
 */
const FIBRE_CHAPTER: DeckImage = {
  src: "/img/events/event-lesmills-03-september-2026-fibre-chapter-1920.webp",
  srcSet:
    "/img/events/event-lesmills-03-september-2026-fibre-chapter-1920.webp 1920w, " +
    "/img/events/event-lesmills-03-september-2026-fibre-chapter-1280.webp 1280w",
  alt: "A braid of fibre-optic strands lit from within in magenta and cyan, twisted like muscle fibre against near-black.",
};

const FIBRE_BREAK: DeckImage = {
  src: "/img/events/event-lesmills-03-september-2026-fibre-break-1920.webp",
  srcSet:
    "/img/events/event-lesmills-03-september-2026-fibre-break-1920.webp 1920w, " +
    "/img/events/event-lesmills-03-september-2026-fibre-break-1280.webp 1280w",
  alt: "A denser braid of lit fibre-optic strands, magenta over cyan, receding into deep bokeh.",
};

/**
 * This evening's skin. She Sharp's own slides keep the archive wall.
 *
 * `surface: "plate"` puts the braid behind every statement slide the evening
 * owns — the chapter cards, the countdown, the closing frame — panned per slide
 * from that slide's own seed so no two show the same crop. Two plates rather
 * than one: a single image across a deck's statement slides reads as a stuck
 * projector however far it is panned.
 *
 * `tempo: 1.25` slows every entrance by a quarter. The house recipes are cut
 * for a hard-edged tile wall, where a fast arrival reads as precision; light
 * travelling along a filament wants to be watched rather than snapped into
 * place. `motion.ts` clamps the range, so this cannot stall a waiting host.
 *
 * The look itself — glass panels instead of cut incisions, rules that are the
 * light in the fibre rather than ruled lines, wider tracking on the small caps
 * — is the `[data-skin="fibre"]` block in `styles/components/deck-skins.css`.
 * Nothing here touches the stage geometry, the copy limits or the type scale;
 * a skin changes how a deck looks, never what it is allowed to say.
 */
const FIBRE_SKIN: DeckSkin = {
  key: "fibre",
  name: "Fibre",
  description:
    "The event poster's braid of lit fibre-optic strands — magenta over cyan on near-black, glass panels, gradient rules.",
  surface: { kind: "plate", images: [FIBRE_CHAPTER, FIBRE_BREAK], drift: true },
  tempo: 1.25,
};

/**
 * The two karakia plates: whenua, and deliberately not the fibre.
 *
 * A karakia is a practice rather than a design slot. The fibre is this event's
 * artwork and it belongs to the parts of the deck that are about the event; the
 * two moments that open and close the evening sit on land and water, which is
 * what the karakia themselves speak about. `whenua-pounamu-sea` is chosen for
 * the opening because the opening karakia's own second line is "Kia whakapapa
 * pounamu te moana" — may the sea be like greenstone. Harakeke at dusk answers
 * it at the end of the night rather than repeating it.
 */
function whenuaPlate(key: "whenua-pounamu-sea" | "whenua-harakeke-dusk"): DeckImage {
  return {
    src: deckPlates[key].src,
    srcSet: plateSrcSet(deckPlates[key]),
    alt: deckPlates[key].alt,
  };
}

// --- Facts, read live ------------------------------------------------------

const PARTNERS = partnerLogosFrom(event);

/* The run sheet is read from the event's own schedule section, so a time
   changed in `events-custom.json` changes the website and this slide together.
   Labels too long for the slide are replaced by exact match below — if a label
   is edited in the JSON its key stops matching and the linter says so, which is
   the failure we want. */
const RUN_SHEET = runSheetFrom(event);

const RUN_SHEET_LABELS: Record<string, string> = {
  "Registration, networking and food": "Registration, networking and food",
  "Kickoff and panel discussion": "Kickoff and panel discussion",
  "Roundtable discussions based on panel topics": "Roundtables on the panel's topics",
  "Networking and event close": "Networking and event close",
};

const RUN_SHEET_ROWS = RUN_SHEET.items.map((row) => ({
  ...row,
  label: RUN_SHEET_LABELS[row.label] ?? row.label,
}));

const SPEAKERS = speakerGroupsFrom(event);

/**
 * Short role lines, keyed by the panellist's name.
 *
 * `personFrom()` in `event-source.ts` already clamps a role to six words, but it
 * does it by TRUNCATING — so Carolina's "Head of Finance – LM Media & Automation
 * Lead" would arrive on the projector cut off mid-title. Only the roles that
 * genuinely overrun are listed; the rest pass through verbatim.
 *
 * The lookup falls through to the event's own title, which means a panellist
 * replaced in the JSON keeps their full title and the linter fails. That is the
 * intended behaviour: a new panellist needs a deliberate short role, not a
 * silent truncation of somebody's job.
 */
const PANEL_ROLES: Record<string, string> = {
  // Both posts, inside the six-word limit. She is Head of Finance for Les Mills
  // Media *and* Automation Lead for Les Mills International; dropping either
  // would misdescribe why she is on this panel.
  "Carolina Lobos": "Head of Finance & Automation Lead",
};

const PANEL = (SPEAKERS[0]?.people ?? []).map((person) => ({
  ...person,
  role: PANEL_ROLES[person.name] ?? person.role,
}));

/* The countdown is however long the run sheet gives the discussion — read on
   every build, not frozen when this file was written, so moving the block in
   the event data moves the clock with it. The fallback is only reached if the
   schedule loses its end time. */
const TABLE_MINUTES = discussionMinutesFrom(event) ?? 15;

/* The closing frame. One photograph from She Sharp's own archive — this evening
   has none of its own yet, and will not until it has happened. Swap in a real
   one afterwards if the deck is ever reshown. */
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

const LINKEDIN_QR: QrBlock = {
  url: "https://www.linkedin.com/company/shesharpnz/",
  label: "She Sharp on LinkedIn",
  caption: "linkedin.com/company/shesharpnz",
};

// --- The evening -----------------------------------------------------------

const EVENING: Slide[] = [
  {
    id: "tonight-run-sheet",
    type: "agenda",
    section: "No Pain, All Gain",
    eyebrow: "Up again at the break",
    title: "How Tonight Runs",
    /* NO LEAD, and this is a layout constraint rather than a style choice. The
       agenda layout sets the lead in a narrow column, so an eleven-word one
       wrapped to two lines and pushed the fifth row — "Networking and event
       close" — down into the archive band at the foot of the slide, where it
       was unreadable. It did that at 1920×1080 as well as at 4:3, and neither
       `lint-deck.ts` nor `deck.test.ts` can see it: overflow is only visible on
       a rendered stage. Five rows is what this slide has room for. */
    items: RUN_SHEET_ROWS,
    note: "The most-looked-at slide of the night. Leave it up while people are still finding seats, and come back to it at the break. Read only the next two rows aloud — people photograph the slide for the rest.",
  },

  {
    id: "tonights-host",
    type: "logos",
    section: "No Pain, All Gain",
    eyebrow: "They opened the doors",
    title: "Tonight's Hosts",
    lead: "Thank you for the room, the food and the evening",
    groups: [{ label: "Hosting with She Sharp", logos: PARTNERS, size: "lg" }],
    note: "Name Les Mills and the person from Les Mills who is in the room. All four panellists work there, so say that now — it is the reason the panel spans four different jobs.",
  },

  {
    id: "section-main-act",
    type: "section",
    section: "Meet the Panel",
    eyebrow: "Phones down for this bit",
    index: "02",
    title: "Meet the Panel",
    // A real She Sharp room behind the handover: the deck stops being about the
    // organisation here and starts being about the evening, and the archive is
    // what carries the organisation across.
    background: archiveFrame(1),
    note: "Hand over to the host or the facilitator here.",
  },

  {
    id: "meet-panel-speakers",
    type: "people",
    section: "Meet the Panel",
    eyebrow: "Please welcome them",
    title: "Meet the Panel",
    lead: "Four jobs, one company, one question between them",
    people: PANEL,
    density: "lg",
    shape: "card",
    note: "Read the names out. Say each person's role, not their biography — the full bios are on the event page behind the closing QR code. The point to land: data, finance, legal and communications are all on this panel, which is the whole argument of the evening.",
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
    note: "These came from the event page, shortened to fit. Say them as an invitation to ask questions, not as a syllabus. The event page lists a sixth — AI from a fitness company's perspective — which is left off here because five is the limit and the room is standing in the fitness company.",
  },

  {
    id: "section-the-tables",
    type: "section",
    section: "Over To The Room",
    eyebrow: "Everyone talks now",
    index: "03",
    title: "Over To The Room",
    background: archiveFrame(9),
    note: "Get people turned towards each other before you explain the task. This is the moment the evening changes gear — do not rush it.",
  },

  /*
   * The mechanics of the tables, not the questions.
   *
   * The run sheet calls this block "Roundtable discussions based on panel
   * topics", which means the questions genuinely do not exist until the panel
   * has finished — they come out of what was said. So this slide is the three
   * things that are true whatever the questions turn out to be, and the host
   * reads the prompts out loud rather than projecting them.
   *
   * If the facilitator does settle on prompts beforehand, they replace these
   * three items and this comment goes with them.
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
    note: "PLACEHOLDER UNTIL THE NIGHT — the prompts come out of the panel, so say them aloud rather than expecting them on screen. Read these three mechanics slowly, then say how long they have and start the clock on the next slide.",
  },

  /*
   * The clock is the run sheet's own allowance for this block — at the time of
   * writing 15 minutes — and it is read from the event data on every build. To
   * change it, move the times in `events-custom.json`; do not edit a number
   * here, and do not regenerate just for this.
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
    background: FIBRE_BREAK,
    note: "Press Space to start the countdown and Space again to pause it. The clock on the wall is what gets a room back on time — do not try to do it by voice.",
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
    note: "Keep each table to under a minute. Repeat the good ones back to the room so the people at the back hear them, and note them down — this is the only record of the discussion anyone will have.",
  },

  /*
   * The deck's closing sequence is three information slides in a row, and the
   * limit is four. This slide is never optional — change the photograph, not
   * the slide. See the comment on the closing sequence in `boilerplate.ts`.
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
    note: "Leave this up while people talk. It is the last thing they see before the thank-yous, and the food and drink are still out.",
  },
];

export const eventLesmills03September2026Deck: Deck = {
  slug: EVENT_SLUG,
  title: deckTitleFrom(event),
  subtitle: deckSubtitleFrom(event),
  eventSlug: EVENT_SLUG,
  /*
   * Set to `drift` for now — Step 1 of the weave change is a no-op by
   * construction, and this deck moves to its own arrangement in the next
   * commit, once there is one to move to.
   */
  archive: "drift",
  skin: FIBRE_SKIN,
  /*
   * The neon pink off the poster headline, run through
   * `accentFromBrandColour()` so it clears the contrast floor on both canvases.
   *
   * Not the navy, which covers half the poster — a background is the one colour
   * never to take. `npx tsx scripts/deck/accent-from-poster.ts` ranks the
   * candidates; this was the second, and it is the colour the poster is actually
   * about. The event's redesigned poster was then built on this exact pair
   * rather than the other way round, so the two agree by construction.
   *
   * `spark` is the cyan that runs through the fibre imagery, and it does the
   * same job on both artefacts: the poster sets "Getting Fit for AI" in it, and
   * here it lights the rules and the countdown ring. The magenta is reserved for
   * the things the room is meant to act on.
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
      // TODO(venue-safety): Les Mills' own lines — which stairwell, where the
      // assembly point is on Victoria Street, who the warden is on a Thursday
      // evening. Left empty rather than guessed: the organisational defaults
      // below are generic and true, and a wrong safety instruction is worse
      // than a generic one. The venue is on Level 2, so a lift-versus-stairs
      // line is the one most likely to be needed.
      safetyExtras: [],
      heroImage: whenuaPlate("whenua-pounamu-sea"),
      // The first time the evening's own identity appears on the projector.
      chapterPlate: FIBRE_CHAPTER,
      contactQrs: [WEBSITE_QR, EVENTS_QR, LINKEDIN_QR],
    }),

    ...EVENING,

    ...buildClosingSlides({
      thanksLogos: [{ label: "Hosts and partners", logos: PARTNERS }],
      // TODO(thanks): the volunteers, the facilitator and whoever ran the door
      // on the night. Names only go on here once somebody has confirmed they
      // were actually there — the 2024 Enviro Hackathon thank-you list was cut
      // back using unclaimed name badges for exactly this reason.
      thanksNames: [],
      // Empty on purpose, and the slide disappears rather than projecting an
      // empty promise. Nothing is confirmed in `events-custom.json` after
      // 3 September 2026 — this evening is currently the last upcoming event in
      // the repo. The events QR in the opening covers it until something is.
      upcoming: [],
      // The feedback code is derived from the slug — nothing to paste.
      eventSlug: EVENT_SLUG,
      karakia: CLOSING_KARAKIA,
      karakiaImage: whenuaPlate("whenua-harakeke-dusk"),
    }),
  ],
};
