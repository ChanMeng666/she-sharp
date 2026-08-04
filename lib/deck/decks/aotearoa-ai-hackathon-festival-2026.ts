/**
 * Deck: Aotearoa AI Hackathon Festival 2026 — AUT City Campus, 7–8 August 2026.
 *
 * Two days, one host, one projector. The nine opening and six closing slides
 * come from `buildOpeningSlides()` / `buildClosingSlides()` so the team, stats
 * and sponsor walls stay live; the rest are this event. Two slides are spliced
 * into the opening sequence with `insertAfter()` — AUT's own welcome, which has
 * to precede the safety briefing it introduces, and the keynote slot, which
 * belongs with the welcome rather than after the handover.
 *
 * Facts come from `lib/data/json/events-custom.json` via `getEventBySlug()`,
 * read through `specialSection()` so that renumbering the JSON fails loudly
 * instead of quietly projecting the wrong section.
 *
 * DELIBERATELY NOT ON SCREEN — the long-form material lives on the event page,
 * which the "Stay Connected" QR reaches in one scan. Do not "helpfully" add it
 * back; each of these is minutes of reading nobody does from three metres away:
 *   - speaker and mentor biographies
 *   - IP ownership and the rules of engagement
 *   - the July Hack Fit training schedule
 *   - the full nine-venue list with dates and addresses
 *   - the national judging panel roster
 */

import { getEventBySlug } from "@/lib/data/events";
import type { TimedItem } from "@/lib/deck/types";
import { curatedImages, toSrcSet } from "@/public/img/curated";
import { deckPlates, plateSrcSet } from "@/public/img/plates";

import {
  buildClosingSlides,
  buildOpeningSlides,
  type KarakiaText,
} from "../boilerplate";
import type { Deck, DeckImage, DeckLogo, QrBlock, Slide } from "../types";
import { insertAfter, parseTimedLines } from "../utils";
import { pickWallTiles } from "../wall-tiles";

const EVENT_SLUG = "aotearoa-ai-hackathon-festival-2026";

const event = getEventBySlug(EVENT_SLUG);
if (!event) {
  throw new Error(
    `Deck "${EVENT_SLUG}" has no matching event in lib/data/json/events-custom.json.`,
  );
}

const detail = event.detailPageData;

/**
 * Reads one `specialSections` entry by index, asserting its title.
 *
 * The JSON is edited by the Slack sync, which appends and reorders. Without the
 * title assertion a shifted index would silently swap "Prizes & Awards" for
 * "Registration" on a slide nobody proofreads again before it is projected.
 */
function specialSection(index: number, expectedTitle: string): string[] {
  const section = detail.specialSections[index];
  if (!section || section.title !== expectedTitle) {
    throw new Error(
      `Expected specialSections[${index}] of "${EVENT_SLUG}" to be "${expectedTitle}", found "${section?.title ?? "nothing"}". Re-point the index after editing the event JSON.`,
    );
  }
  return section.content;
}

/** Replaces run-sheet labels that exceed the six-word limit, by exact match. */
function shortenLabels(
  items: TimedItem[],
  replacements: Record<string, string>,
): TimedItem[] {
  return items.map((item) => ({
    ...item,
    label: replacements[item.label] ?? item.label,
  }));
}

// --- Karakia ---------------------------------------------------------------
// Supplied by the client, verbatim. Macrons are as received; do not "correct"
// them and do not paraphrase the translation.

const OPENING_KARAKIA: KarakiaText = {
  teReo: [
    "Kia hora te marino",
    "Kia whakapapa pounamu te moana",
    "Hei huarahi mā tātou i te rangi nei",
    "Aroha atu, aroha mai",
    "Tātou i ā tātou katoa",
    "Hui e, taiki e!",
  ],
  english: [
    "May peace be widespread",
    "May the sea be like greenstone",
    "A pathway for us all this day",
    "Let us show respect for each other",
    "For one another",
    "Bind us all together",
  ],
};

const CLOSING_KARAKIA: KarakiaText = {
  teReo: [
    "Kia tau te manaakitanga",
    "Ki runga ki tena ki tena o tatau",
    "Kia piki te ora",
    "Kia piki te maramatanga",
    "Kia hoki pai atu, kia hoki pai mai",
    "Haumi e, Hui e, Taiki E",
  ],
  // The client supplied the English as one run-on uppercase line; split into
  // four spoken lines and set in sentence case so it reads at 44px.
  english: [
    "Settle the care and protection upon each of us",
    "May the health and understanding grow",
    "Return well to others and yourselves",
    "Join together, gather together, bind as one",
  ],
};

// --- Shared assets ---------------------------------------------------------

/* Codes are drawn from these URLs in the browser, so a link change here is the
   only edit a code ever needs. */

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

/* Neither the ambassador nor the feedback code is defined here. The ambassador
   intake form is the same for every event, and the feedback code is derived
   from `EVENT_SLUG`, so `buildClosingSlides()` supplies both. */

const LINKEDIN_QR: QrBlock = {
  url: "https://www.linkedin.com/company/shesharpnz/",
  label: "She Sharp on LinkedIn",
  caption: "linkedin.com/company/shesharpnz",
};

/* Two of the featured problems ship with a video from the organisation that
   submitted them. The deck makes no network calls once it has loaded, so a
   video is a code people scan and watch on their own phone during the break —
   not an embed that would need the venue wifi at the exact moment a hundred
   laptops are on it. */

const HELPDESK_VIDEO_QR: QrBlock = {
  url: "https://youtu.be/n9UPiqziB9c",
  label: "Care by Design",
  caption: "youtu.be/n9UPiqziB9c",
};

const ACCESSIBLE_UI_VIDEO_QR: QrBlock = {
  url: "https://youtu.be/THqS1kZbdjo",
  label: "My Life My Voice",
  caption: "youtu.be/THqS1kZbdjo",
};

/**
 * Organisational safety lines, minus "In an emergency dial 111".
 *
 * Dropped for this venue at the organisers' request. Everything else in the
 * default list is kept in its default order, and `boilerplate.ts` still holds
 * the full five for every other deck.
 */
const SAFETY_LINES = [
  "Find the nearest fire exits before we start",
  "Follow staff to the assembly point in an evacuation",
  "First aid and accessible facilities are available on request",
  "Keep your bag and devices with you",
];

const PARTNER_LOGOS: DeckLogo[] = detail.sponsors.main.map((sponsor) => ({
  name: sponsor.name,
  logo: sponsor.logo,
}));

/**
 * Plate behind the opening karakia: a real photograph, not a generated one.
 *
 * This is an unfurling silver-fern koru — a genuine macro photograph with no
 * branding, no text and no date in it, and a clean out-of-focus left half where
 * the te reo sits. It happens to live in this event's asset folder because the
 * event page used it, but it is not artwork for the festival.
 *
 * The deck holds generated plates that suit this slot better on paper: they are
 * darker where the type goes, and one of them is a greenstone sea, which is
 * what the karakia's second line describes. They lost anyway. A karakia is a
 * practice rather than a design slot, and when the organisation's own
 * photograph will do the job, the organisation's own photograph does the job.
 * The generated plates exist for the events that have nothing.
 */
const koru = detail.photos[0];
if (!koru) {
  throw new Error(
    `"${EVENT_SLUG}" has no photos[0]; the opening karakia expects the koru photograph.`,
  );
}
const OPENING_KARAKIA_PLATE: DeckImage = {
  src: koru.url,
  alt: koru.alt,
  // Subject is hard right; hold the frame there so the left stays open for text.
  focus: "70% 40%",
};

/**
 * The chapter card that hands over from She Sharp to the event.
 *
 * Takes the archive wall rather than a photograph. It is the moment the deck
 * stops being about the organisation and starts being about the day, and the
 * wall is what carries the organisation — twelve years of rooms, handing over.
 */
const CHAPTER_PLATE: DeckImage = {
  src: deckPlates["light-prism-edge"].src,
  srcSet: plateSrcSet(deckPlates["light-prism-edge"]),
  alt: deckPlates["light-prism-edge"].alt,
};

/**
 * Plate behind the closing karakia — harakeke at dusk, deliberately not the sea.
 *
 * The two karakia are eighteen hours apart in this deck. Repeating the opening
 * image would read as the deck looping rather than closing, and harakeke at the
 * end of the day answers the sea at the start of it.
 */
const CLOSING_KARAKIA_PLATE: DeckImage = {
  src: deckPlates["whenua-harakeke-dusk"].src,
  srcSet: plateSrcSet(deckPlates["whenua-harakeke-dusk"]),
  alt: deckPlates["whenua-harakeke-dusk"].alt,
};

/** An abstract light plate, for the three countdown slides. */
function lightPlate(key: "light-aurora-sweep" | "light-prism-edge" | "light-deep-field"): DeckImage {
  return {
    src: deckPlates[key].src,
    srcSet: plateSrcSet(deckPlates[key]),
    alt: deckPlates[key].alt,
  };
}

/**
 * One frame from the archive wall, for a chapter divider.
 *
 * `SectionSlide.background` takes a single `DeckImage`, so a divider carries one
 * photograph rather than the tiled wall the archive is written to be read as —
 * see the note at the top of `wall-tiles.ts`. `pickWallTiles` still steps
 * through the pool, so four dividers land in four different years and venues
 * instead of four frames from the same 2023 shoot.
 */
function archivePlate(offset: number): DeckImage {
  const [src] = pickWallTiles(1, offset);
  return {
    src,
    alt: "A room of She Sharp attendees, from twelve years of the archive.",
    focus: "50% 40%",
  };
}

/**
 * The photographic beat that closes the featured-problem chapter.
 *
 * Hands, a pen and paper: the four briefs before it are the only stretch of the
 * deck that asks a room to weigh options rather than follow instructions, and
 * this is the page the host stops talking on while they do it.
 */
const CHOOSING_PHOTO: DeckImage = {
  src: curatedImages["detail-sketch-hands"].src,
  srcSet: toSrcSet(curatedImages["detail-sketch-hands"]),
  alt: curatedImages["detail-sketch-hands"].alt,
  focus: "50% 45%",
};

/**
 * Placeholder plate for the keynote slide, until there is a keynote speaker.
 *
 * A She Sharp speaker on a She Sharp stage — the right register for the slot
 * and honestly captioned as "name announced on the night", rather than a
 * generated portrait of somebody who does not exist. Swap `image` for the
 * speaker's own photograph and put their name in `title` once they are booked;
 * nothing else on the slide has to change.
 */
const KEYNOTE_PLACEHOLDER: DeckImage = {
  src: curatedImages["speaker-stage-spotlight"].src,
  srcSet: toSrcSet(curatedImages["speaker-stage-spotlight"]),
  alt: curatedImages["speaker-stage-spotlight"].alt,
  focus: "50% 35%",
};

/**
 * The photographic beat between team forming and the mentors.
 *
 * Not filler. Forty minutes of a Friday night are about to be spent making
 * people talk to strangers, and this is the only slide in the deck that shows
 * what that looks like when it has worked.
 */
const TEAM_FORMING_PHOTO: DeckImage = {
  src: curatedImages["workshop-fp-hackathon"].src,
  srcSet: toSrcSet(curatedImages["workshop-fp-hackathon"]),
  alt: curatedImages["workshop-fp-hackathon"].alt,
  focus: "50% 45%",
};

// --- People ----------------------------------------------------------------

const mentors = detail.speakers.mentors?.speakers ?? [];
const judges = detail.speakers.panelists?.speakers ?? [];

/**
 * Mentor tiles: name and organisation only — the bio is the person talking.
 *
 * `image` is coerced to `undefined` rather than passed through, because a mentor
 * confirmed late often has no photograph and the event JSON records that as an
 * empty string. `PersonItem.image` is optional and the layout falls back to an
 * initials tile; an empty `src` would instead fail the image-path check in
 * `deck.test.ts` and request the page itself as an image at the venue.
 */
const mentorTiles = mentors.map((mentor) => ({
  name: mentor.name,
  org: mentor.company,
  image: mentor.image || undefined,
}));

/** Split point for the two mentor slides, balanced and within the density cap. */
const mentorSplit = Math.ceil(mentorTiles.length / 2);

/**
 * Judge titles, shortened to the six-word role limit.
 *
 * Keyed by the name in the event JSON: if a judge is replaced the lookup falls
 * through to the full title and the linter fails, which is the intended
 * behaviour — a new judge needs a deliberate short title, not a truncation.
 */
const JUDGE_ROLES: Record<string, string> = {
  "Nicholas Fourie": "Vice President, ICT",
  "Dr. Mahsa Mohaghegh (McCauley)": "Head of Computer & Information Sciences",
  "Abby Dowd": "Senior Director, AI Strategy",
  "Ming Cheuk": "CTO & Co-founder",
};

// --- Judging ---------------------------------------------------------------

/**
 * The four criteria, shown on day one and again on day two.
 *
 * `weight` is the 1–5 score range rather than a percentage: the TAIAO scorecard
 * weights all four equally but the Technical Brilliance scorecard leans on
 * Technology, so "25%" would be wrong on one of the two. The footnote says so.
 */
const JUDGING_CRITERIA = [
  {
    name: "Inspiration",
    description: "A defined problem, a real solution, real impact",
    weight: "1–5",
  },
  {
    name: "Technology",
    description: "Uses AI, feasible, well engineered, prototype recommended",
    weight: "1–5",
  },
  {
    name: "Design & Innovation",
    description: "Originality, user experience, inventive use of technology",
    weight: "1–5",
  },
  {
    name: "Presentation",
    description: "Clear, creative, answers questions inside five minutes",
    weight: "1–5",
  },
];

const JUDGING_FOOTNOTE =
  "Two scorecards: the TAIAO scorecard weights all four categories equally, the Technical Brilliance scorecard leans towards Technology. Judges from the last five festivals advise focusing on three things — is it an important UN Sustainable Development Goal problem, is the solution feasible, and will it make an impact. Every pitch is recorded and all panel decisions are final.";

// --- Run sheets ------------------------------------------------------------

const DAY_ONE = shortenLabels(
  parseTimedLines(specialSection(1, "Day 1 Schedule — Friday 7 August")),
  {
    "Registration, guest arrival & networking + dinner":
      "Registration, networking & dinner",
    "Event opening: karakia, welcome to AUT, health & safety briefing":
      "Opening, welcome & safety briefing",
    "Problems to solve, requirements & judging criteria":
      "Problems, requirements & judging criteria",
  },
);

const DAY_TWO = shortenLabels(
  parseTimedLines(specialSection(2, "Day 2 Schedule — Saturday 8 August")),
  {
    "Team build with mentor support (pitch prep from 10:00am)":
      "Team build with mentor support",
  },
);

// --- Upcoming --------------------------------------------------------------

/**
 * Snapshot, not a live call.
 *
 * `getUpcomingEvents()` is relative to today. Called at render time it would
 * drop this hackathon's own successor as soon as a date passed, and change what
 * is on the projector between the host's rehearsal and the room. Taken on
 * 2026-08-01; refresh by hand if the deck is reused.
 */
const UPCOMING_SNAPSHOT = [
  {
    title: "No Pain, All Gain – Getting Fit for AI",
    date: "Thursday 3 September 2026",
    time: "5:00–7:30pm",
    venue: "Auckland",
    blurb: "A Les Mills x She Sharp panel on diversity and AI for impact",
    /* The event's own poster, not a photograph: the evening has not happened
       yet, so the only picture of it that exists is the one made to sell it.
       The layout fits it whole rather than cropping it to a landscape slot —
       see `upcoming-slide.tsx`. */
    image: {
      src: "/img/events/event-lesmills-03-september-2026-poster.webp",
      alt: "Poster for No Pain, All Gain – Getting Fit for AI, a Les Mills x She Sharp panel on 3 September 2026.",
    },
  },
];

// --- Opening sequence ------------------------------------------------------

/**
 * The venue's own host, introduced before she gives the safety briefing.
 *
 * AUT is the host as well as the venue, and the briefing is delivered by the
 * Dean of the faculty the room is standing in rather than by She Sharp. She
 * gets her own slide because a name read off a run sheet by somebody else is
 * not an introduction.
 *
 * Her fuller history at AUT — Deputy Dean from 2024, Professor before that —
 * stays off the projector under the same rule as the mentor and judge
 * biographies: it is the person's to say, and it is on the event page.
 */
const AUT_WELCOME: Slide = {
  id: "aut-welcome",
  type: "people",
  section: "Welcome",
  tone: "light",
  eyebrow: "Over to Suzanne",
  title: "Greetings from AUT",
  lead: "Suzanne welcomes us and runs the health and safety briefing",
  people: [
    {
      name: "Suzanne Wilkinson",
      // Full title is "Dean of Faculty of Design and Creative Technologies",
      // which is nine words against a six-word limit and reads as a job
      // description rather than an introduction at 38px.
      role: "Dean, Design and Creative Technologies",
      org: "Auckland University of Technology",
      image:
        "/img/events/aotearoa-ai-hackathon-festival-2026-suzanne-wilkinson.jpg",
    },
  ],
  density: "lg",
  shape: "card",
  note: "Hand over to Suzanne here. She welcomes the room on behalf of AUT and reads the safety briefing on the next slide.",
};

/**
 * The keynote slot, standing empty on purpose.
 *
 * TODO(keynote): replace `image` with the speaker's own photograph and put
 * their name in `title` once they are confirmed. Nothing else needs to change.
 *
 * A full-frame photograph rather than a person card, and not only for the look
 * of it: the four slides before this one are all information, which is the
 * limit `lintRhythm` allows in a row. A card here would make five and the deck
 * would stop building.
 */
const KEYNOTE_SLIDE: Slide = {
  id: "keynote-speaker",
  type: "photo",
  section: "Welcome",
  tone: "dark",
  eyebrow: "Name announced on the night",
  title: "Keynote Speaker",
  lead: "One talk before we hand the evening over to you",
  image: KEYNOTE_PLACEHOLDER,
  overlay: "gradient",
  note: "Introduce the keynote speaker by name and give them the room. If the slot is still unfilled, skip this slide rather than reading it out.",
};

const OPENING_SLIDES: Slide[] = insertAfter(
  insertAfter(
    buildOpeningSlides({
      eventTitle: "Aotearoa AI Hackathon Festival 2026",
      eventMeta: ["7–8 August 2026", "AUT City Campus", "Hosted with AI Forum NZ"],
      partnerLogos: PARTNER_LOGOS,
      karakia: OPENING_KARAKIA,
      // TODO(venue-safety): AUT's own lines — assembly point, lift rules,
      // after-hours access — go here once the venue briefing is confirmed.
      // Left empty rather than guessed: a wrong safety instruction is worse
      // than a generic one. Adding lines here drops org defaults from the top.
      safetyExtras: [],
      safetyLines: SAFETY_LINES,
      heroImage: OPENING_KARAKIA_PLATE,
      chapterPlate: CHAPTER_PLATE,
      contactQrs: [WEBSITE_QR, EVENTS_QR, LINKEDIN_QR],
    }),
    "karakia-timatanga",
    AUT_WELCOME,
  ),
  "stay-connected",
  KEYNOTE_SLIDE,
);

// --- Deck ------------------------------------------------------------------

export const aotearoaAiHackathonFestival2026Deck: Deck = {
  slug: EVENT_SLUG,
  title: "Aotearoa AI Hackathon Festival 2026",
  subtitle: "AUT City Campus · 7–8 August 2026",
  eventSlug: EVENT_SLUG,
  // Taken from the event poster: near-black canvas, magenta-purple headline,
  // electric-cyan light burst.
  theme: {
    accent: {
      onLight: "#9b2e83",
      onDark: "#c846ab",
      spark: "#5ee7f5",
    },
  },
  slides: [
    // 1–11 — She Sharp opening, generated from live site data, plus AUT's own
    // welcome and the keynote slot.
    ...OPENING_SLIDES,

    // --- 12–33 — Day one ---------------------------------------------------
    /* Housekeeping first, and in this order, because it is what the room is
       already asking each other about while the host is still talking.

       `themes` rather than a list: the layout sets `tag` small above `title`
       large, which is the label-above-value shape a password needs to survive
       being copied onto a phone from three metres away. There is no wifi slide
       type and this does not need one.

       These credentials are the venue's guest account for the weekend, supplied
       in the AUT mentor briefing. They belong on the projector in a room that
       has already walked past reception — not on the public event page. */
    {
      id: "venue-wifi",
      type: "themes",
      section: "Day One — Friday 7 August",
      eyebrow: "Get online first",
      title: "Venue Wi-Fi",
      lead: "AUT guest network, and the same login both days",
      themes: [
        { tag: "Network", title: "AUTwifi" },
        { tag: "Username", title: "ai-hack-a-thon@guest" },
        { tag: "Password", title: "46533572" },
      ],
      note: "Leave this up through registration. Read the username aloud one hyphen at a time — it is the field everyone mistypes — and say the password twice.",
    },
    {
      id: "venue-wayfinding",
      type: "bullets",
      section: "Day One — Friday 7 August",
      eyebrow: "Three rooms, all weekend",
      title: "Where to Find Things",
      lead: "All three rooms are in the Sir Paul Reeves Building",
      items: [
        "WG306 — registration, dinner and every coffee break",
        "WG308 — tonight's opening, tomorrow's pitches and awards",
        "WG808 — the mentor room, all weekend",
      ],
      note: "Point in the direction of each room as you say it. WG808 is where the mentors are based — teams should know where to find them before tomorrow morning.",
    },
    {
      id: "day-one-run-sheet",
      type: "agenda",
      section: "Day One — Friday 7 August",
      eyebrow: "Doors at five, dinner first",
      title: "Tonight",
      lead: "Three hours, and you will leave with a team",
      items: DAY_ONE,
      columns: 2,
      note: "Read only the next three rows. People photograph the slide for the rest.",
    },
    {
      id: "two-day-format",
      type: "bullets",
      section: "Day One — Friday 7 August",
      eyebrow: "Tonight and all tomorrow",
      title: "How the Two Days Run",
      items: [
        "Friday night: welcome, themes, team forming, build begins",
        "Saturday: build, pitch practice, pitches, winner announced",
        "Venue winners go forward to national judging",
        "One winner to pitch at the Aotearoa AI Summit",
      ],
      note: "Set expectations for the whole weekend before anyone commits to a team.",
    },
    {
      id: "section-the-challenge",
      type: "section",
      section: "Day One — Friday 7 August",
      eyebrow: "Choose before you build",
      index: "02",
      tone: "dark",
      title: "The Challenge",
      subtitle: "Five real-world themes drawn from the UN Sustainable Development Goals",
      background: archivePlate(7),
      note: "Pause here. The next slide is the one teams choose from.",
    },
    {
      id: "challenge-themes",
      type: "themes",
      section: "Day One — Friday 7 August",
      // "Straight from the UN SDG goals" is six words and fails the five-word
      // kicker limit; the article is what goes, not the acronym.
      eyebrow: "From the UN SDG goals",
      title: "Five Real-World Challenges",
      lead: "Pick the one your team actually cares about",
      themes: [
        {
          title: "Food Security",
          detail: "Tackling food insecurity in a food-exporting nation",
        },
        {
          title: "Digital Accessibility",
          detail: "Enhancing digital accessibility for all communities",
        },
        {
          title: "Workforce Upskilling",
          detail: "Upskilling the workforce for an AI-driven future",
        },
        {
          title: "Collaboration",
          detail: "Fostering cross-border, cross-sector collaboration",
        },
        {
          title: "Kaitiakitanga",
          detail: "Honouring indigenous environmental custodianship",
        },
      ],
      note: "Read the five titles, not the detail lines. Teams will come back to this slide.",
    },
    /* The five themes are the categories; these four are the actual briefs.
       Each one was written by the organisation that has the problem, and each
       carries its own UN SDG mapping — which stays in the host notes rather
       than on screen, because an SDG number is a citation and a room does not
       read citations from three metres away.

       Copy is condensed from `specialSections` 13 through 20 of the event
       JSON. The full statements, the eight restoration metrics and the
       beneficiary list are all on the event page, one scan away. */
    {
      id: "section-featured-problems",
      type: "section",
      section: "Day One — Friday 7 August",
      eyebrow: "Brought by the sponsors",
      index: "03",
      tone: "dark",
      title: "Featured Problems",
      subtitle: "Four briefs written by the organisations that actually have them",
      background: archivePlate(25),
      note: "Say that these are real problems from real organisations, and that a team is free to bring its own instead.",
    },
    {
      id: "problem-food-waste",
      type: "bullets",
      section: "Day One — Friday 7 August",
      eyebrow: "Woolworths and Kai Commitment",
      title: "Food Waste, Farm to Fork",
      lead: "Reducing food waste across a whole national supply chain",
      items: [
        "Identify where waste happens along the supply chain",
        "Fill the data gaps nobody currently measures",
        "Optimise ordering, storage and distribution with AI",
        "Improve collaboration between growers, retailers and charities",
      ],
      note: "Supported by Woolworths New Zealand alongside Kai Commitment. The problem statement video is on the AUT City Campus Community Hub, linked from the event page.",
    },
    {
      id: "problem-helpdesk",
      type: "qr-cta",
      section: "Day One — Friday 7 August",
      tone: "dark",
      eyebrow: "Watch before you build",
      title: "F&P Healthcare: Facilities Helpdesk",
      lead: "An AI front door for maintenance and facilities requests",
      points: [
        "Structured intake in plain language, in their own words",
        "Consistent priority, escalation and live status for requestors",
        "Care by Design: people and process ahead of technology",
      ],
      qr: HELPDESK_VIDEO_QR,
      note: "F&P maps this to SDGs 8, 9 and 10 for inclusion, 12 for removing rework, and 3 through the products themselves. They judge on whether the design is genuinely underpinned by their Culture of Care.",
    },
    {
      id: "problem-restoration",
      type: "bullets",
      section: "Day One — Friday 7 August",
      eyebrow: "Drone footage, twenty-year timescale",
      title: "F&P Healthcare: Restoration Intelligence",
      lead: "Turning annual drone surveys into measurable ecological outcomes",
      items: [
        "Three thousand natives planted at Karaka since 2023",
        "Monitoring needs ecologists, GIS specialists and fieldwork today",
        "Automate the analysis of yearly drone imagery",
        "Measure survival, canopy cover, weeds and regeneration",
      ],
      note: "SDG 15 and SDG 12. Restoring the Oiroa Stream at F&P's Karaka campus. Without drone imagery, teams can use Matuku Link, Waikereru or Hinewai as proxy datasets — the eight metrics are listed on the event page.",
    },
    {
      id: "problem-accessible-ui",
      type: "qr-cta",
      section: "Day One — Friday 7 August",
      tone: "dark",
      eyebrow: "WCAG compliance stays stubbornly low",
      title: "My Life My Voice: Accessible UI",
      lead: "Generate accessible layouts while developers build, not audit afterwards",
      points: [
        "Millions hit barriers in apps built without accessibility",
        "Checking happens late, outside the tools developers use",
        "Generate accessible options, not only flags on broken ones",
      ],
      qr: ACCESSIBLE_UI_VIDEO_QR,
      note: "SDGs 4, 8 and 10. The distinction that matters to them is generative rather than corrective — existing checkers already flag what is broken.",
    },
    /* The room has just been handed four briefs and has to pick one. This is
       the page the host stops talking on, and it is also what keeps the four
       information slides above it inside the rhythm limit. */
    {
      id: "problems-close",
      type: "photo",
      section: "Day One — Friday 7 August",
      tone: "dark",
      eyebrow: "Forty minutes from now",
      title: "Pick the one you'd stay for",
      lead: "The problem you choose shapes the whole weekend",
      image: CHOOSING_PHOTO,
      overlay: "gradient",
      note: "Say that a team can also bring its own problem, as long as it answers one of the five themes. Then move to team forming.",
    },
    {
      id: "forming-your-team",
      type: "bullets",
      section: "Day One — Friday 7 August",
      eyebrow: "Nobody builds alone here",
      title: "Forming Your Team",
      lead: "Register alone or arrive with a team — both work",
      items: [
        "Join a team tonight if you came on your own",
        "Three to six people works best",
        "Mix technical, design, domain and commercial skills",
        "Mentors will help you find each other",
      ],
      note: "Send people to the floor after this slide; mentors circulate to balance the teams.",
    },
    /* A photograph, not a decoration.

       Team forming is the loudest forty minutes of the weekend and the one
       thing in this deck that cannot be explained in bullets. It also does the
       structural work of breaking what was an eight-slide run of light
       information slides — the rhythm rule in `lint.ts` exists because of
       exactly this stretch of exactly this deck. */
    {
      id: "team-forming-floor",
      type: "photo",
      section: "Day One — Friday 7 August",
      tone: "dark",
      eyebrow: "The next forty minutes",
      title: "Talk to someone you didn't arrive with",
      lead: "Team forming is the loudest forty minutes of the weekend",
      image: TEAM_FORMING_PHOTO,
      overlay: "gradient",
      note: "Say this and then stop talking. Push people out of their seats — the mentors will circulate and balance the teams.",
    },
    /* The mentors across two slides rather than one, however many there are.
       At `md` density a single slide of thirteen has to shrink itself to about
       74% on a 4:3 projector to fit, which puts the names below the 28px the
       back of the room can read. `mentorSplit` halves the roster and
       `COPY_LIMITS.peopleCount` enforces the eight-per-slide cap. */
    {
      id: "meet-the-mentors-1",
      type: "people",
      section: "Day One — Friday 7 August",
      eyebrow: "First of two groups",
      title: "Meet the Mentors",
      lead: "Ask early and ask often — this is what they are here for",
      people: mentorTiles.slice(0, mentorSplit),
      density: "md",
      shape: "circle",
      note: "Ask each mentor to stand as you say their name. Keep it moving — the second group is on the next slide.",
    },
    {
      id: "meet-the-mentors-2",
      type: "people",
      section: "Day One — Friday 7 August",
      eyebrow: "And the rest of them",
      title: "Meet the Mentors",
      people: mentorTiles.slice(mentorSplit),
      density: "md",
      shape: "circle",
      note: "Second group of mentors. Then hand over for the introductions.",
    },
    {
      id: "how-mentors-help",
      type: "bullets",
      section: "Day One — Friday 7 August",
      optional: true,
      eyebrow: "They will not build it",
      title: "How Mentors Help",
      items: [
        "Technical experts sense-check your design and suggest alternatives",
        "Subject matter experts know whether your solution helps",
        "Business experts shape a pitch that lands",
      ],
      note: "Skip this if the mentors have introduced themselves well. Say they will not build it for you.",
    },
    /* The deck changes subject here.

       Everything above is about getting a team together and getting building.
       Everything below is about being scored — the criteria, the five minutes,
       and the four people who apply them. That is a chapter, and it had no
       card, which is how the judging material ended up stacked on the back of
       the mentor material with no breath between. */
    {
      id: "section-the-pitch",
      type: "section",
      section: "Day One — Friday 7 August",
      eyebrow: "Tomorrow comes down to this",
      index: "04",
      tone: "dark",
      title: "The Pitch",
      subtitle: "How you are scored, and the five minutes you get to do it in",
      background: archivePlate(43),
      note: "Say that everything from here happens tomorrow afternoon, and that teams should be building towards it from tonight.",
    },
    {
      id: "judging-criteria",
      type: "criteria",
      section: "Day One — Friday 7 August",
      eyebrow: "Four numbers, one to five",
      title: "How Teams Are Judged",
      lead: "Four equally weighted criteria, scored one to five each",
      criteria: JUDGING_CRITERIA,
      footnote: JUDGING_FOOTNOTE,
      note: "Say that a working prototype is highly recommended under Technology.",
    },
    {
      id: "five-minute-pitch",
      type: "agenda",
      section: "Day One — Friday 7 August",
      eyebrow: "The clock does not stop",
      title: "Your Five-Minute Pitch",
      lead: "Five minutes, four sections, one first impression",
      items: [
        { time: "30 sec", label: "Connect: who you are" },
        { time: "1 min", label: "The problem, humanised and evidenced" },
        { time: "2 min", label: "Your big idea, with prototype", emphasis: true },
        { time: "1.5 min", label: "Future impact and what you need" },
      ],
      note: "Tell teams to describe the problem they actually solved, not the one they set out to solve.",
    },
    {
      id: "meet-the-judges",
      type: "people",
      section: "Day One — Friday 7 August",
      eyebrow: "They see your idea once",
      title: "Meet the Judges",
      lead: "The panel you pitch to tomorrow afternoon",
      people: judges.map((judge) => ({
        name: judge.name,
        role: JUDGE_ROLES[judge.name] ?? judge.title,
        org: judge.company,
        image: judge.image,
      })),
      density: "lg",
      shape: "card",
      note: "Judges have very little time to absorb an unfamiliar idea — say so here, it changes how teams pitch.",
    },
    {
      id: "prizes",
      type: "prizes",
      section: "Day One — Friday 7 August",
      tone: "dark",
      // Not "Won in this room tomorrow" — the first prize's own label already
      // says that, and a kicker that repeats something else on the slide is the
      // slot wasted.
      eyebrow: "Three of these exist",
      title: "Prizes & Awards",
      prizes: [
        {
          amount: "$250",
          name: "Venue winning team",
          detail: "Announced here tomorrow evening",
          scope: "venue",
        },
        {
          amount: "$1,000",
          name: "National TAIAO Prize",
          detail: "Summit audience vote",
          scope: "national",
        },
        {
          amount: "$1,000",
          name: "National Technical Brilliance",
          detail: "National judging panel",
          scope: "national",
        },
      ],
      // Was three sentences and forty words, which pushed the slide past the
      // stage on a 4:3 projector and made it scale itself down to 79% — where
      // the labels fall under the 28px a room can read. Cut rather than shrunk:
      // the Summit dates, the AWS attribution and the per-venue caveat are all
      // on the event page, and the host says them anyway.
      footnote: "The national winner pitches at the Aotearoa AI Summit in September.",
      note: "Say the venue prize first and loudest — it is the one this room can win tomorrow. The Summit is 8–9 September in Wellington; prizes come from AWS via AI Forum NZ.",
    },
    {
      id: "nationwide-festival",
      type: "bullets",
      section: "Day One — Friday 7 August",
      optional: true,
      // Nine venues in the 2026 list, so eight rooms other than this one.
      eyebrow: "Eight other rooms, doing this",
      title: "A Nationwide Festival",
      lead: "Nine venues hacking across Aotearoa between 3 and 10 August",
      items: [
        "Venues from Auckland to Dunedin run the same brief",
        "Every venue records its pitches and picks a winner",
        "A national panel then selects one winner",
        "That winner pitches at the Aotearoa AI Summit, Wellington",
      ],
      note: "Skip if you are running late. Useful for teams wondering who else they are up against.",
    },
    {
      id: "day-one-close",
      type: "break",
      section: "Day One — Friday 7 August",
      eyebrow: "Everyone to the front, please",
      title: "Group Photo & Break",
      lead: "Fifteen minutes, then team strategy until we close at eight",
      minutes: 15,
      resumeLabel: "Team strategy planning",
      background: lightPlate("light-aurora-sweep"),
      note: "Start the timer after the photo. Day one closes at 8:00pm.",
    },

    // --- 34–44 — Day two --------------------------------------------------
    {
      id: "section-day-two",
      type: "section",
      section: "Day Two — Saturday 8 August",
      eyebrow: "Build, pitch, then a winner",
      index: "05",
      tone: "dark",
      title: "Day Two",
      subtitle: "Saturday 8 August — build, pitch, and the venue winner",
      background: archivePlate(79),
      note: "Open day two here. Welcome anyone who has joined this morning.",
    },
    {
      id: "day-two-run-sheet",
      type: "agenda",
      section: "Day Two — Saturday 8 August",
      eyebrow: "Coffee from half seven",
      title: "Today",
      lead: "Presentations start at 3:30pm and awards at 7:00pm",
      items: DAY_TWO,
      columns: 2,
      note: "Point at the 3:30pm row. Everything before it is negotiable, that one is not.",
    },
    /* Two placeholders that only Friday night can fill.

       TODO(day-one): replace the six cards below with the real team names,
       the challenge each one took and where they are sitting, and swap the
       four archive tiles for the team photographs taken during the group photo
       at the end of day one. Save those as
       `/img/events/aotearoa-ai-hackathon-festival-2026-teams-1.jpg` and so on.

       They stand as archive frames rather than empty boxes on purpose: if
       nobody gets to the photographs before Saturday morning, the deck still
       projects something deliberate instead of announcing that it was not
       finished. */
    {
      id: "team-groupings",
      type: "themes",
      section: "Day Two — Saturday 8 August",
      eyebrow: "Find your table first",
      title: "Today's Teams",
      lead: "Who formed last night, and what they took on",
      themes: [
        { tag: "Team 1", title: "Team name", detail: "Challenge and table number" },
        { tag: "Team 2", title: "Team name", detail: "Challenge and table number" },
        { tag: "Team 3", title: "Team name", detail: "Challenge and table number" },
        { tag: "Team 4", title: "Team name", detail: "Challenge and table number" },
        { tag: "Team 5", title: "Team name", detail: "Challenge and table number" },
        { tag: "Team 6", title: "Team name", detail: "Challenge and table number" },
      ],
      note: "PLACEHOLDER — fill in the real team names, challenges and tables after Friday night. Read the team names out and let each one wave.",
    },
    {
      id: "team-photos",
      type: "photo-grid",
      section: "Day Two — Saturday 8 August",
      tone: "dark",
      eyebrow: "Taken at the group photo",
      title: "The Teams",
      lead: "Everyone who formed a team on Friday night",
      images: pickWallTiles(4, 31).map((src) => ({
        src,
        alt: "Placeholder frame from the She Sharp archive, standing in for a day-one team photograph.",
      })),
      note: "PLACEHOLDER — replace with Friday night's team photographs before Saturday morning. Leave it up while people find their tables.",
    },
    {
      id: "build-with-mentors",
      type: "bullets",
      section: "Day Two — Saturday 8 August",
      eyebrow: "Most teams split at midday",
      title: "Build With Your Mentors",
      items: [
        "Pitch prep starts 10:00am",
        "Split the team: keep building, start pitching",
        "Regroup thirty minutes before pitching",
      ],
      note: "Say that most teams split at midday — half keep building, half build the pitch.",
    },
    {
      id: "lunch",
      type: "break",
      section: "Day Two — Saturday 8 August",
      eyebrow: "Mentors eat with the teams",
      title: "Lunch",
      lead: "Eat away from your laptop — the afternoon is long",
      minutes: 45,
      resumeLabel: "Prepare for pitch practice",
      background: lightPlate("light-deep-field"),
      note: "Start the timer as the first person reaches the food. Mentors eat with the teams.",
    },
    {
      id: "judging-criteria-recap",
      type: "criteria",
      section: "Day Two — Saturday 8 August",
      eyebrow: "Name your weakest one aloud",
      title: "Remember How You're Scored",
      lead: "The same four criteria the panel will use this afternoon",
      criteria: JUDGING_CRITERIA,
      footnote: JUDGING_FOOTNOTE,
      note: "Show this during pitch practice. Ask each team which criterion they are weakest on.",
    },
    {
      id: "afternoon-tea",
      type: "break",
      section: "Day Two — Saturday 8 August",
      eyebrow: "Laptops to the stage now",
      title: "Afternoon Tea",
      lead: "Tech check begins as soon as we are back",
      minutes: 15,
      resumeLabel: "Tech check",
      background: lightPlate("light-prism-edge"),
      note: "Use this break to test every team's laptop on the projector.",
    },
    {
      id: "section-final-presentations",
      type: "section",
      section: "Day Two — Saturday 8 August",
      eyebrow: "The room goes quiet now",
      index: "06",
      tone: "dark",
      title: "Final Presentations",
      subtitle: "Five minutes each, and every pitch is recorded",
      background: archivePlate(115),
      note: "Call the first team up. Hold the room to time — the recording is what goes to national judging.",
    },

    // 45–50 — She Sharp closing, generated from live site data.
    ...buildClosingSlides({
      thanksLogos: [{ label: "Hosts, partners and sponsors", logos: PARTNER_LOGOS }],
      thanksNames: [
        ...judges.map((judge) => judge.name),
        ...mentors.map((mentor) => mentor.name),
      ],
      upcoming: UPCOMING_SNAPSHOT,
      eventSlug: EVENT_SLUG,
      karakia: CLOSING_KARAKIA,
      karakiaImage: CLOSING_KARAKIA_PLATE,
    }),
  ],
};
