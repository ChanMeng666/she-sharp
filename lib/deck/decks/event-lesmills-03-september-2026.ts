/**
 * Deck: No Pain, All Gain – Getting Fit for AI — Les Mills Auckland City,
 * Thursday 3 September 2026, 5:00–7:30pm.
 *
 * One evening, one host, one projector. The nine opening and six closing
 * slides come from `buildOpeningSlides()` / `buildClosingSlides()` so the team,
 * the impact figures and the sponsor wall stay live; the eleven slides between
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
 * THE LOOK IS NOT THIS FILE'S EITHER, AND THAT IS THE CORRECTION. This evening
 * spent three rounds acquiring a visual identity of its own — a new accent, then
 * a different archive weave, then a wholly bespoke dark skin built from
 * generated artwork — and each round was measured against the hackathon deck, a
 * deck that had never made a design decision at all. What was actually missing
 * was the organisation's own editorial system, which the website has had since
 * July 2026 and the projector had never seen. So this deck wears
 * `EDITORIAL_SKIN`: paper and navy ink, hairline rules, script eyebrows,
 * outline numerals, the brand colour as punctuation. It is a DEFAULT rather than
 * this evening's own look, and every regular She Sharp evening after it should
 * wear the same one. A bespoke skin is for an event whose poster can be
 * described in one sentence; a two-hour panel is not that event, and pretending
 * otherwise is what cost three rounds.
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
  findRowByPatterns,
  loadEventForDeck,
  partnerLogosFrom,
  minutesOf,
  runSheetFrom,
  speakerGroupsFrom,
} from "../event-source";
import { parseDateString } from "@/lib/data/event-utils";

import { DEFAULT_CLOSING_KARAKIA, DEFAULT_OPENING_KARAKIA } from "../karakia";
import { EDITORIAL_SKIN } from "../skins";
import type { Deck, DeckImage, QrBlock, Slide } from "../types";
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
 * The two karakia plates: whenua, and deliberately not the archive.
 *
 * A karakia is a practice rather than a design slot. Everywhere else in the deck
 * the ground is twelve years of She Sharp rooms, because everywhere else
 * something is being offered; the two moments that open and close the evening
 * sit on land and water instead, which is what the karakia themselves speak
 * about. `whenua-pounamu-sea` is chosen for the opening because the opening
 * karakia's own second line is "Kia whakapapa pounamu te moana" — may the sea be
 * like greenstone. Harakeke at dusk answers it at the end of the night rather
 * than repeating it.
 *
 * These are generated plates, and they exist because the archive contains no
 * landscape, coastline, sky or dawn at all. Their scope is declared in the
 * manifest and is not negotiable: whenua only, never people, never taonga,
 * nothing mistakable for a real She Sharp event.
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

/*
 * BY KEY, NEVER BY POSITION.
 *
 * This read `SPEAKERS[0]`, which is the first POPULATED group in
 * `SPEAKER_GROUP_ORDER` — an ordering this file does not own and cannot see.
 * On 23 Aug 2026 the event gained a `hosts` group for the MC, `hosts` sorts
 * first in that order, and the "Meet the Panel" slide silently became one
 * person: the MC, alone, under the panel's heading. deck.test.ts and
 * lint-deck.ts both stayed green, because neither asserts WHO is on a slide.
 *
 * Throwing is the point. A deck that cannot find its panel must fail the build
 * rather than project four empty cards, or one wrong face, to a room.
 */
const PANEL_GROUP = SPEAKERS.find((group) => group.key === "panel_speakers");
if (!PANEL_GROUP || PANEL_GROUP.people.length === 0) {
  throw new Error(
    `Deck "${event.slug}" expects a populated panel_speakers group in events-custom.json; found: ${SPEAKERS.map((g) => `${g.key}(${g.people.length})`).join(", ") || "none"}.`,
  );
}

const PANEL = PANEL_GROUP.people.map((person) => ({
  ...person,
  role: PANEL_ROLES[person.name] ?? person.role,
}));

/* The countdown is however long the run sheet gives the discussion — read on
   every build, not frozen when this file was written, so moving the block in
   the event data moves the clock with it. The fallback is only reached if the
   schedule loses its end time. */
const TABLE_MINUTES = discussionMinutesFrom(event) ?? 15;

/* The group photo's own allowance, read from the run sheet rather than typed.
   Falls back to five minutes only if the row is ever removed. */
const PHOTO_MINUTES =
  minutesOf(findRowByPatterns(RUN_SHEET, [/group photo/i, /photo/i])?.time ?? "") ?? 5;

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

/*
 * Snapshotted, not live. `getUpcomingEvents()` is relative to today, so a live
 * read would change the projector between rehearsal and the night. The next
 * confirmed evening after this one is 8 October at Xero; if that date moves,
 * edit this block and the public event page together.
 */
const UPCOMING_SNAPSHOT = [
  {
    title: "Beyond the Code",
    date: "Thursday 8 October 2026",
    time: "5:00–8:00pm",
    venue: "Xero, Parnell",
    blurb: "A live secure-coding tournament, leading the way to secure Aotearoa",
    image: {
      src: "/img/events/code-secure-2026/cover.webp",
      alt: "Poster for Beyond the Code, a She Sharp evening with Xero and Secure Code Warrior on 8 October 2026.",
    },
  },
];

// --- The evening -----------------------------------------------------------

const EVENING: Slide[] = [
  {
    id: "tonight-run-sheet",
    type: "agenda",
    section: "No Pain, All Gain",
    eyebrow: "Grab a plate, then sit",
    title: "The Shape of Tonight",
    /* NO LEAD. Ten rows from the run sheet split into two columns (the layout
       does that past seven), and a lead would steal the height the last row
       needs. Overflow here is only visible on a rendered stage. */
    items: RUN_SHEET_ROWS,
    note: "The most-looked-at slide of the night. Leave it up while people are still finding seats. Read only the next two rows aloud — people photograph the slide for the rest. Amber takes the room at 5:40; the group photo is at 6:20 and now has a slide and a countdown of its own.",
  },

  {
    id: "tonights-host",
    type: "logos",
    section: "No Pain, All Gain",
    eyebrow: "We are in their building",
    title: "Thank You, Les Mills",
    lead: "The room, the food and four of tonight's voices",
    groups: [{ label: "Hosting with She Sharp", logos: PARTNERS, size: "lg" }],
    note: "Name Les Mills, then hand the mic to Amber. She introduces Les Mills and the four panellists, and she facilitates the panel. All four voices work there, which is the reason the panel spans four different jobs.",
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
   * as six bullets, which is what a template does with a list. `themes` beats
   * `bullets` for these four because cards sit side by side as peers, where
   * bullets rank — and these four are peers: they are the four jobs on the
   * panel, looking at the same question.
   *
   * NO LEAD, and the title names the slot rather than making an argument. It
   * read "One Question, Four Tables" over "The same decision, seen from four
   * jobs" until 3 Sep, which is a nice line and one more thing to read while
   * the host is trying to say it out loud.
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
    title: "4 Topics and Discussion",
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
   * The group photo, which used to have no slide of its own.
   *
   * The run sheet has allowed five minutes for it at 6:20 since the clock was
   * written, but the deck only mentioned it in the agenda slide's speaker note
   * — so the one moment that needs the whole room to do something in unison was
   * the one moment with nothing on the screen. A photo call runs long when
   * nobody can see how long it is meant to be; the countdown is the point.
   *
   * The length is read from the run sheet's own Group photo row, not typed, for
   * the same reason the table-discussion clock is: move the time in
   * `events-custom.json` and this follows.
   */
  {
    id: "group-photo",
    type: "break",
    section: "Meet the Panel",
    eyebrow: "Everyone in — yes, everyone",
    title: "Group Photo",
    lead: "Panel at the front, the rest of the room behind them",
    minutes: PHOTO_MINUTES,
    resumeLabel: "Back to your tables",
    /* THIS NOTE NOW CARRIES THE WHOLE HANDOVER TO THE TABLES. Two slides were
       cut on 3 Sep — "How This Works", which projected the three mechanics, and
       the "Over To The Room" chapter card, which was the turn-your-chairs beat.
       Neither was replaced on the wall, deliberately: the run sheet's prompts
       come out of the panel and do not exist until it has finished, so they were
       always going to be spoken. This is the last note before the clock starts,
       so everything the host has to say is here, in running order. */
    note: "Say it twice: everybody, not just the panel. Ask the back row to stand and the front row to crouch, take three frames rather than one, and tell the room the photographs go up on the event page afterwards. Then turn them towards each other — this is where the evening changes gear, do not rush it — and say the three mechanics: pick the answer you disagreed with, everyone speaks before anyone speaks twice, agree one line to read out. Say they have twenty minutes, and start the clock on the next slide.",
  },

  /*
   * The clock is the run sheet's own allowance for this block — twenty minutes
   * at 6:25–6:45 — and it is read from the event data on every build. To
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
    /* NO PLATE, deliberately. A countdown sets a two-character numeral at the
       largest size in the deck and the room reads it from across a hall, so the
       ground behind it wants to be empty — plain navy, with the archive
       surviving as a band along the foot. It is also what puts the rail back to
       its solid bar: `railVariant()` goes sheer only on a backed break slide,
       and a sheer rail over flat colour is a header that has quietly lost its
       ground. */
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
    note: "One beat, not a speech — closing remarks start at 6:50. Click through to Thank You, then the next event, then the codes. Leave the end slide up once networking begins.",
  },
];

export const eventLesmills03September2026Deck: Deck = {
  slug: EVENT_SLUG,
  title: deckTitleFrom(event),
  subtitle: deckSubtitleFrom(event),
  eventSlug: EVENT_SLUG,
  /*
   * The mosaic — an irregular grid of the archive, cut on the same rows.
   *
   * The weave the ledger's own note describes as "Editorial, uneven", which is
   * what this deck is, and the one no deck had claimed. The earlier choice here
   * was the contact sheet, argued for as stillness against a plate that drifted;
   * that plate is gone and its argument went with it, so the honest reason is
   * the plain one — a mosaic is how the website lays photographs out, and the
   * arrangement is the axis a deck is allowed to choose.
   *
   * `EDITORIAL_SKIN` declares no weave of its own, so this value reaches the
   * event's statement slides as well as She Sharp's: one silhouette for the
   * whole deck rather than two. It is also the axis `style-library.ts` measures
   * against the hackathon, which drifts.
   */
  archive: "mosaic",
  /*
   * The house default for a regular evening, not this evening's own look. See
   * `lib/deck/skins.ts` — the two knobs an event actually turns are the accent
   * pair below and the weave above.
   */
  skin: EDITORIAL_SKIN,
  /*
   * The website's own two colours, one per register.
   *
   * Not a colour lifted off the event poster, and that is the whole point of a
   * default skin: the deck speaks in She Sharp's voice at every regular evening,
   * and an event changes the accent only when its own artwork genuinely beats
   * the house pair. Every ratio below was computed with `contrastRatio()` in
   * `lib/deck/theme.ts` against the canvas the colour actually renders on.
   */
  theme: {
    accent: {
      /* Brand purple on the paper register — 6.16:1 on `#f4f4fa`, floor 4.5. */
      onLight: "#9b2e83",
      /*
       * Mint on navy — 12.98:1, and the reason the house `#c846ab` cannot be
       * used here. That purple-mid is tuned for the near-black canvas and
       * scores only 3.71:1 on `#1f1e44`, which is below the floor for body text
       * and would fail exactly where the accent does its work. Mint is also
       * what `deck.css` already sets a dark kicker in, so the deck's kicker and
       * its accent become one colour rather than two.
       */
      onDark: "#b1f6e9",
      /* Periwinkle, decorative only — gradients, hairlines, the timer ring. */
      spark: "#8982ff",
    },
    /*
     * The one ground this deck moves: the site's navy stat band, in place of the
     * house near-black. Declared here rather than in CSS because
     * `themeToCssVars()` emits it as `--deck-canvas-dark` inline AND because
     * `checkAccentContrast()` reads it — a canvas changed in the stylesheet and
     * not here turns the one check that can catch an unreadable slide into a
     * rubber stamp.
     *
     * `theme.ts` warns that navy washes out on a projector, which is why the
     * fallback if it does is to deepen toward `#1a1938`: every ratio here only
     * rises, and the accent hue does not move.
     */
    darkCanvas: "#1f1e44",
    /*
     * The paper register, stated at the value `--deck-paper` already holds.
     * `themeToCssVars()` emits this as `--deck-canvas-light`, which despite its
     * name is used everywhere in the repo as the colour of TYPE laid over a
     * photograph — the karakia, the countdown, photo captions. Both readings
     * want a near-white here, so the one value is correct in both roles and no
     * CSS restatement is needed. On a skin that moves the light ground somewhere
     * dark, they come apart; this one does not.
     */
    lightCanvas: "#f4f4fa",
    /*
     * The house ink pair, said out loud. `deck.test.ts` asserts body text clears
     * 7:1 against its own canvas and it reads THIS rather than the stylesheet,
     * so leaving it implicit on a deck that has moved a canvas is how an
     * unreadable slide ships. Navy on paper and paper on navy are the same two
     * colours swapped: 14.44:1 in both directions.
     */
    ink: { onLight: "#1f1e44", onDark: "#f4f4fa" },
  },
  slides: [
    ...buildOpeningSlides({
      eventTitle: deckTitleFrom(event),
      eventMeta: deckMetaFrom(event),
      partnerLogos: PARTNERS,
      karakia: OPENING_KARAKIA,
      // Counts THIS event, and does not move when the site is redeployed. Without
      // it "Our Impact" reports events held before the build, which excludes the
      // evening the deck is being presented at.
      eventsHeldThrough: parseDateString(event.date),
      // TODO(venue-safety): Les Mills' own lines — which stairwell, where the
      // assembly point is on Victoria Street, who the warden is on a Thursday
      // evening. Left empty rather than guessed: the organisational defaults
      // below are generic and true, and a wrong safety instruction is worse
      // than a generic one. The venue is on Level 2, so a lift-versus-stairs
      // line is the one most likely to be needed.
      safetyExtras: [],
      // LEN, 3 SEP, SLIDE 3: the bullets come off and the slide keeps its title.
      // Amber briefs health and safety herself off the run sheet — it is her
      // building — so the generic organisational lines were a second, quieter
      // safety brief on the wall that nobody was reading from. Two briefings
      // that can disagree is worse than one that is spoken. This is the
      // `safetyLines` escape hatch working as its comment describes: a venue
      // that briefs differently. IF AMBER IS NOT IN THE ROOM, PUT THEM BACK.
      safetyLines: [],
      // LEN, 3 SEP, SLIDE 4: "the organisation word is missing". It was.
      // `missionLead()` derives "a New Zealand non-profit" from SITE_DESCRIPTION,
      // where the adjective stands in for the noun. Fine in a meta description,
      // audibly wrong read aloud. Adding the word costs a word, and the derived
      // line was already at the 18-word limit, so "one woman at a time" gives
      // up its place rather than being silently truncated mid-phrase.
      missionLead:
        "She Sharp is a New Zealand non-profit organisation bridging the gender gap in STEM",
      // LEN, 3 SEP, SLIDE 8: neither account has anything for this room to go
      // to — the podcast has not shipped an episode and the channel is a back
      // catalogue. Five live accounts read better than seven with two dead
      // ends. Names must match footerConfig.socialLinks or the build throws.
      omitSocials: ["Spotify", "YouTube"],
      heroImage: whenuaPlate("whenua-pounamu-sea"),
      // NO CHAPTER PLATE. The handover card falls back to the archive wall with
      // its numeral drawn in outline over it, which under this skin IS the
      // handover: `01` stops being a window cut into twelve years of She Sharp
      // rooms and becomes a line of ink laid over them. An event with artwork
      // worth projecting passes it here; this evening's artwork is its poster,
      // and a poster is not a slide.
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
      upcoming: UPCOMING_SNAPSHOT,
      // The feedback code is derived from the slug — nothing to paste.
      eventSlug: EVENT_SLUG,
      karakia: CLOSING_KARAKIA,
      karakiaImage: whenuaPlate("whenua-harakeke-dusk"),
    }),
  ],
};
