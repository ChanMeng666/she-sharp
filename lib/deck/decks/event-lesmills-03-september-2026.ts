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
 * Four more frames of the same subject, and the reason there are four.
 *
 * The two above are the poster's braid photographed twice, and across eight
 * statement slides they read as one picture the projector keeps returning to —
 * the failure `SurfaceSpec.plate` warns about, arrived at from the other side.
 * Panning further does not fix it; a plate panned far enough to look like a
 * different picture is a plate whose subject has left the frame.
 *
 * So these are four different photographs of fibre rather than four crops of
 * one: a fan of strands receding, the bundle cut and seen end-on, a single
 * filament crossing an empty field, and the light thrown completely out of
 * focus. Each puts its clear space somewhere different — right, left, top,
 * centre — which is what lets `platePlacement()` keep type off the subject on a
 * slide it knows nothing about.
 *
 * The cross-section earns its place twice. Hundreds of individually lit fibres
 * packed into one bundle is, without being asked to be, a picture of four people
 * from four jobs in one company, which is the entire argument of the evening.
 *
 * All four: gpt-image-2, 1536×1024, under the house rules that govern every
 * generated asset here — no people, nothing imitating taonga, no text, no
 * branding, and nothing that could be mistaken for a real She Sharp photograph.
 * That last one is the important one, and abstract macro glass is exactly why
 * this subject is safe: nothing in twelve years of the archive looks remotely
 * like it.
 */
function fibrePlate(name: string, alt: string): DeckImage {
  const base = `/img/events/event-lesmills-03-september-2026-${name}`;
  return {
    src: `${base}-1920.webp`,
    srcSet: `${base}-1920.webp 1920w, ${base}-1280.webp 1280w`,
    alt,
  };
}

const FIBRE_STRANDS = fibrePlate(
  "fibre-strandfield",
  "A fan of fine glass filaments spreading from the left edge, each carrying a point of magenta or cyan light, against near-black.",
);

const FIBRE_SECTION = fibrePlate(
  "fibre-crosssection",
  "A bundle of optical fibres cut and seen end-on, the face a dense disc of hundreds of separately lit points in magenta, cyan and white.",
);

const FIBRE_FILAMENT = fibrePlate(
  "fibre-filament",
  "A single glass filament crossing a wide dark field low in the frame, lit from within in cyan, everything above it empty.",
);

const FIBRE_SCATTER = fibrePlate(
  "fibre-scatter",
  "Points of magenta and cyan light thrown completely out of focus across a near-black field, sparsest at the centre.",
);

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
  surface: {
    kind: "plate",
    images: [
      FIBRE_CHAPTER,
      FIBRE_STRANDS,
      FIBRE_SECTION,
      FIBRE_BREAK,
      FIBRE_FILAMENT,
      FIBRE_SCATTER,
    ],
    drift: true,
  },
  tempo: 1.25,
  /* Declared, though `geometryOf()` would infer the same from the plate
     surface. The `[data-skin="fibre"]` block replaces the house's opaque cuts
     with backdrop-blurred glass and its ruled lines with gradients of light in
     the fibre, so the value is a fact about this deck rather than a guess. */
  geometry: "glass",
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

/* ONLY the labels that genuinely overrun. This table used to hold four entries,
   three of which mapped a string to itself; the fifth row of the run sheet was
   not in it at all and passed through untouched. Identity entries make the table
   look like it is doing the job its comment describes while the one real
   shortening hides among them, so a label that starts overrunning later gets
   added to a list nobody trusts. */
const RUN_SHEET_LABELS: Record<string, string> = {
  "Roundtable discussions based on panel topics": "Roundtables on the panel's topics",
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

/* This evening's own page, where the four bios and their LinkedIn links live.
   Built from the compile-time site URL for the reason `feedbackUrlForSlug()`
   exists: a projected code that encoded `localhost` would scan perfectly on the
   laptop that made it and fail on every phone in the room. */
const EVENT_PAGE_QR: QrBlock = {
  url: `https://www.shesharp.org.nz/events/${EVENT_SLUG}`,
  label: "Tonight's panel",
  caption: `shesharp.org.nz/events/${EVENT_SLUG}`,
};

// --- The evening -----------------------------------------------------------

const EVENING: Slide[] = [
  {
    id: "tonight-run-sheet",
    type: "agenda",
    section: "No Pain, All Gain",
    eyebrow: "Grab a plate, then sit",
    title: "The Shape of Tonight",
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
    eyebrow: "We are in their building",
    title: "Thank You, Les Mills",
    lead: "The room, the food and four of tonight's voices",
    groups: [{ label: "Hosting with She Sharp", logos: PARTNERS, size: "lg" }],
    note: "Name Les Mills and the person from Les Mills who is in the room. All four panellists work there, so say that now — it is the reason the panel spans four different jobs.",
  },

  {
    id: "section-main-act",
    type: "section",
    section: "Meet the Panel",
    eyebrow: "The evening starts here",
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
    eyebrow: "Catch them at the break",
    title: "The Four of Them",
    lead: "Four jobs, one company, one question between them",
    people: PANEL,
    density: "lg",
    shape: "card",
    note: "Read the names out. Say each person's role, not their biography — the full bios are on the event page behind the closing QR code. The point to land: data, finance, legal and communications are all on this panel, which is the whole argument of the evening.",
  },

  /*
   * THE FOUR ANGLES, as cards rather than as a list.
   *
   * The event page's "What You'll Explore" is six bullets, and it was set here
   * as six bullets, which is what a template does with a list. But the argument
   * of this evening is not a list of topics — it is that one question looks
   * completely different from four desks in the same company, and the four desks
   * are exactly who is on the panel. `themes` says that and `bullets` cannot:
   * cards sit side by side as peers, where bullets rank.
   *
   * Kept deliberately abstract — a domain, not a name. Tagging each card with a
   * panellist would couple this slide to `SPEAKERS`, and a replacement panellist
   * would leave a card carrying somebody who is not in the room, silently. The
   * names are on the slide before this one, read live.
   */
  {
    id: "what-well-explore",
    type: "themes",
    section: "Meet the Panel",
    eyebrow: "Bring one of these",
    title: "One Question, Four Desks",
    lead: "The same decision, seen from four jobs",
    themes: [
      {
        title: "Data & AI",
        detail: "What the technology can actually do today",
      },
      {
        title: "Commercial",
        detail: "What it costs and what it returns",
      },
      {
        title: "Legal & Privacy",
        detail: "What you may and may not feed it",
      },
      {
        title: "People & Change",
        detail: "How a company takes any of it up",
      },
    ],
    note: "Do not read the four cards out — the room can read. Say instead that these are the four jobs on the panel, and that the interesting part is where they disagree. The event page lists two more angles, including AI from a fitness company's perspective; that one is standing in front of them, so leave it for the panel to say.",
  },

  /*
   * The bios, at the moment the room wants them.
   *
   * The panel slide's own note says the full bios are on the event page behind
   * the closing QR code — which is forty minutes and eleven slides too late.
   * Someone deciding whether to go and talk to Ben at the break wants his
   * background now, while he is speaking. Same destination, offered when it is
   * useful rather than when the deck happens to end.
   */
  {
    id: "panel-bios",
    type: "qr-cta",
    section: "Meet the Panel",
    eyebrow: "Look them up now",
    title: "Their Full Backgrounds",
    lead: "Every panellist's bio and LinkedIn, on the event page",
    qr: EVENT_PAGE_QR,
    note: "Leave this up for a few seconds before you hand over to the facilitator, and say it once: the bios are on the page, so nobody has to write a name down.",
  },

  {
    id: "section-the-tables",
    type: "section",
    section: "Over To The Room",
    eyebrow: "Turn your chairs around",
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
    eyebrow: "Nobody presents, everybody talks",
    title: "How This Works",
    items: [
      "Pick the answer you disagreed with",
      "Everyone speaks before anyone speaks twice",
      "Agree one line to read out",
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
    eyebrow: "The clock is on screen",
    title: "Your Turn",
    lead: "Talk it through, then we will hear from every table",
    minutes: TABLE_MINUTES,
    resumeLabel: "Back together",
    /* The out-of-focus frame, chosen for what is NOT in it. A countdown sets a
       two-character numeral at the largest size in the deck, and this is the
       only plate in the family whose centre is empty — the braid frames put
       their subject exactly where the clock goes. */
    background: FIBRE_SCATTER,
    note: "Press Space to start the countdown and Space again to pause it. The clock on the wall is what gets a room back on time — do not try to do it by voice.",
  },

  {
    id: "readouts",
    type: "bullets",
    section: "Over To The Room",
    eyebrow: "Thirty seconds a table",
    title: "What Came Up",
    items: [
      "The line your table agreed on",
      "The thing you could not settle",
      "One thing you will try on Monday",
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
    eyebrow: "Food and drink still out",
    image: CLOSING_PHOTO,
    overlay: "scrim",
    title: "Stay a While",
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
   * The contact sheet — one strict, motionless grid of the archive.
   *
   * The reasoning is structural rather than a preference. This evening's own
   * slides already carry a moving ground: `FIBRE_SKIN` sets `drift: true` and
   * `fibre-drift` swells the plate over 38 seconds. Put the drifting archive
   * wall on the organisational slides as well and nothing in the deck is ever
   * still — twenty-four slides of something always sliding. Holding the house
   * slides motionless says the true thing instead: the organisation is the fixed
   * point and the evening is what is in motion.
   *
   * It is also as far from the hackathon as the archive gets. Theirs drifts
   * horizontally; this does not move at all, which is the difference a room
   * actually registers between two decks.
   */
  archive: "contact-sheet",
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
      /*
       * ONE accent, not a pair, because this deck has no light register to
       * speak of. The house pair exists because brand purple scores 2.92:1 on
       * the dark canvas and has to be lightened there; here both grounds are
       * near-black, so the same lit magenta is correct on both and a darker
       * `onLight` would be unreadable on the very slides it was meant for.
       */
      onLight: "#e070cf",
      onDark: "#e070cf",
      spark: "#5ee7f5",
    },
    /*
     * The canvases the deck ACTUALLY renders, declared so
     * `checkAccentContrast()` measures against them.
     *
     * These mirror `--deck-canvas-dark` and `--deck-paper` in the
     * `[data-skin="fibre"]` block, and the duplication is the point: without
     * them the checker measures this magenta against a white page that never
     * appears anywhere in the deck, passes it, and tells us nothing. Keep the
     * two in step — a colour changed in the stylesheet and not here turns the
     * one check that can catch an unreadable slide into a rubber stamp.
     */
    darkCanvas: "#05060b",
    lightCanvas: "#14172a",
    /*
     * Both registers are dark, so both take the same near-white ink — and it
     * has to be said here, not only in CSS. `deck.test.ts` asserts body text
     * clears 7:1 against its own canvas, and it reads this: the first dark
     * build declared the canvases and left the ink implicit, so the check
     * measured the house navy `#1f1e44` against `#14172a` and reported 1.12:1.
     * It was right. The title slide had come out invisible.
     */
    ink: { onLight: "#e8f1f7", onDark: "#e8f1f7" },
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
