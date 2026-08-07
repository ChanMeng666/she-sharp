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
import { DEFAULT_CLOSING_KARAKIA, DEFAULT_OPENING_KARAKIA } from "../karakia";
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
// This event uses She Sharp's standing karakia, which is where they came from
// in the first place — the client supplied them for this deck and they now
// live in `../karakia` as the organisational default. An event whose host
// reads something else replaces these two consts and nothing more.

const OPENING_KARAKIA: KarakiaText = DEFAULT_OPENING_KARAKIA;
const CLOSING_KARAKIA: KarakiaText = DEFAULT_CLOSING_KARAKIA;

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

/*
 * REMOVED 5 Aug 2026 — the "My Life My Voice: Accessible UI" brief and its
 * problem-statement video QR, on Mahsa's instruction ("remove the last one").
 * The two sponsors who are in the room with a team and a stake in the weekend
 * lead instead, F&P first. Restore the const with the slide if that reverses;
 * the video is https://youtu.be/THqS1kZbdjo.
 */

/* The marks of the two organisations whose briefs the room chooses between.
   Same paths as `lib/data/sponsors.ts`, which is what the sponsors slide draws
   from — two spellings of one logo on one projector is worse than none. */
const FPH_LOGO: DeckLogo = {
  name: "Fisher & Paykel Healthcare",
  logo: "/img/sponsors/fph.svg",
};

const WOOLWORTHS_LOGO: DeckLogo = {
  name: "Woolworths",
  logo: "/img/sponsors/woolworths.svg",
};

/* The three destinations a team needs the moment it exists. All three are
   already on the event page under "Helpful Links"; they get a slide of their
   own because the run sheet routes the whole weekend through the first of
   them — team channels, the afternoon agenda, the lunch call and the pitch
   order are all announced on Discord, and an attendee who never joins it
   spends two days a step behind. */

const DISCORD_QR: QrBlock = {
  url: "https://discord.gg/Z5heYsa7W",
  label: "Event Discord",
  caption: "discord.gg/Z5heYsa7W",
};

const ASSISTANT_QR: QrBlock = {
  url: "https://hackathon.shesharp.org.nz/",
  label: "Event AI assistant",
  caption: "hackathon.shesharp.org.nz",
};

/*
 * She Sharp's own copy of the template, not the Community Hub page.
 *
 * This pointed at the TNZ Ecosystem Hub until the pre-event QR audit on 5 Aug
 * 2026 opened every destination in a signed-out browser: Circle.so bounces
 * anyone who is not already a member to `login.circle.so/sign_in`. A code that
 * shows a login wall to a room of a hundred people is a dead code, and this is
 * exactly the class of failure the person building the deck cannot see, because
 * they are always signed in. Same reason `AMBASSADOR_FORM_URL` avoids its
 * Google Form.
 *
 * The PDF is AI Forum's six-page template — CONNECT, PROBLEM, BIG IDEA, FUTURE
 * IMPACT, with the per-section timings the pitch slides already teach. It is
 * committed under `public/docs/` rather than uploaded to Blob storage so it is
 * versioned with the deck that points at it and needs no token to serve.
 *
 * FILENAME IS LOAD-BEARING. This code shares a slide with two others, so each
 * is drawn small; the descriptive name `ai-hackathon-pitch-deck-template-2026`
 * pushes the URL to 73 bytes and the symbol to 41×41, while this one fits 37×37
 * in the same physical square. Lengthen it and the modules get smaller.
 */
const PITCH_TEMPLATE_QR: QrBlock = {
  url: "https://www.shesharp.org.nz/docs/pitch-deck-template-2026.pdf",
  label: "Pitch deck template",
  caption: "shesharp.org.nz/docs",
};

/**
 * Organisational safety lines, minus "In an emergency dial 111".
 *
 * Dropped for this venue at the organisers' request. Everything else in the
 * default list is kept in its default order, and `boilerplate.ts` still holds
 * the full five for every other deck.
 */
/**
 * The fifth line is here because a whole slide went.
 *
 * "Who to Find Today" carried the AUT security number alongside a named venue
 * supervisor, and Mahsa cut the slide on 5 Aug 2026 — the objection was to
 * introducing a stranger by name to a room that has no reason to know him, not
 * to the number. Deleting the slide outright would have taken the only
 * emergency contact in the deck with it, so it moves onto the safety slide she
 * kept. Five lines is the linter's limit exactly; nothing else fits here.
 */
const SAFETY_LINES = [
  "Find the nearest fire exits before we start",
  "Follow staff to the assembly point in an evacuation",
  "First aid and accessible facilities are available on request",
  "AUT security, any emergency: 0800 288 7233",
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
function lightPlate(
  key: "light-aurora-sweep" | "light-prism-edge" | "light-deep-field",
): DeckImage {
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
 * Hands, a pen and paper: the three briefs before it are the only stretch of the
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

/**
 * Split points for the mentor slides, balanced and within the density cap.
 *
 * Thirds rather than halves since the roster reached seventeen on 6 August:
 * `Math.ceil(17 / 2)` is nine, and `COPY_LIMITS.peopleCount.md` caps a slide at
 * eight, so halving would fail the linter rather than merely look crowded.
 */
const mentorGroupSize = Math.ceil(mentorTiles.length / 3);
const mentorGroups = [
  mentorTiles.slice(0, mentorGroupSize),
  mentorTiles.slice(mentorGroupSize, mentorGroupSize * 2),
  mentorTiles.slice(mentorGroupSize * 2),
].filter((group) => group.length > 0);

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

/**
 * The five-minute pitch, section by section.
 *
 * Shown twice: on Friday when teams are deciding what to build towards, and
 * again on Saturday immediately before pitch practice, when it stops being a
 * plan and becomes a stopwatch. Shared rather than duplicated so the two
 * cannot drift.
 */
const PITCH_SECTIONS: TimedItem[] = [
  { time: "30 sec", label: "Connect: who you are" },
  { time: "1 min", label: "The problem, humanised and evidenced" },
  { time: "2 min", label: "Your big idea, with prototype", emphasis: true },
  { time: "1.5 min", label: "Future impact and what you need" },
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
    "Fisher & Paykel Healthcare on their two challenge briefs":
      "F&P on their two briefs",
  },
);

const DAY_TWO = shortenLabels(
  parseTimedLines(specialSection(2, "Day 2 Schedule — Saturday 8 August")),
  {
    "Team build with mentor support (pitch prep from 10:00am)":
      "Team build with mentor support",
    "Slides to She Sharp, judges arrive & judge briefing":
      "Slides due, judges arrive",
    "Final presentations to the judging panel": "Final presentations to judges",
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
  eyebrow: "Over to Tek",
  title: "Greetings from AUT",
  // He opens on behalf of the university and nothing else. The safety briefing
  // was attributed to this slide's speaker until Mahsa corrected it on
  // 5 Aug 2026 — putting a name against a duty they have not agreed to perform
  // is the kind of error the room only discovers when nobody steps forward.
  lead: "Tek opens the weekend on behalf of AUT",
  people: [
    {
      // "Professor" is carried on the name rather than folded into the role:
      // it is the title he holds, and the role line is already at its word
      // limit without it.
      name: "Professor Tek Tjing Lie",
      // The school and the faculty ride on `org`, not `role`.
      //
      // His full AUT title is "Head of School - Engineering, Computer &
      // Mathematical Sciences", which is nine words against `personRoleWords`
      // of six. `org` carries no word limit, so the split puts the post in
      // `role` and both the school and the faculty underneath it — the same
      // two lines his AUT profile shows, without raising a limit that exists
      // to keep a role legible at 38px from the back of a lecture theatre.
      role: "Head of School",
      org: "Engineering, Computer & Mathematical Sciences — Design & Creative Technologies",
      image: "/img/events/aotearoa-ai-hackathon-festival-2026-tek-tjing-lie.jpg",
    },
  ],
  density: "lg",
  shape: "card",
  note: "Hand over to Professor Lie here for AUT's welcome, then take the room back. He does NOT read the safety briefing on the next slide — that is yours.",
};

/**
 * The keynote plate, composed rather than cropped.
 *
 * Rach sent a 2500×2500 headshot on a saturated yellow field. Dropped straight
 * into this full-bleed slide it cuts her face at the mouth and the yellow
 * swamps the white display type — rendered and looked at before committing,
 * not assumed. So her portrait is set as a disc on her own yellow inside a 16:9
 * plate, positioned to survive the stage's crop at BOTH ends of its range: the
 * disc sits inside the 4:3 centre cut and inside the vertical cut that 21:9
 * takes. Checked at 4:3, 16:9 and 21:9. If the photograph is ever replaced,
 * re-render those three and look at them; the geometry is the whole point.
 */
const KEYNOTE_PLATE: DeckImage = {
  src: "/img/events/aotearoa-ai-hackathon-festival-2026-rach-monks-plate.jpg",
  alt: "Rach Monks, founder of AI for X and X-Bot Games, keynote speaker for the hackathon",
  focus: "50% 50%",
};

/**
 * The keynote slot, filled 5 August once Rach Monks confirmed and sent her own
 * role, bio and photograph.
 *
 * This was a full-frame `photo` slide while the slot was empty, carrying an
 * archive shot of a She Sharp speaker on a She Sharp stage under the honest
 * caption "name announced on the night". Both halves of that had to change
 * together: the moment the slide names a person, an archive photograph of a
 * DIFFERENT person reads as her portrait.
 *
 * It is a person card rather than a full-frame photograph because her supplied
 * headshot is a 2500×2500 square on a saturated yellow field. Cropped to the
 * stage's 16:9 it cuts her face at the mouth and the yellow swamps the white
 * display type — checked before committing, not assumed. A card crops nothing
 * and puts the yellow inside a frame where it reads as her brand rather than as
 * the slide's background.
 *
 * `tone: "dark"` is load-bearing for rhythm, not decoration: the four slides
 * before this one are all information, which is `lintRhythm`'s limit in a row,
 * and this slide is what breaks the run. Keep it dark and keep it here.
 */
const KEYNOTE_SLIDE: Slide = {
  id: "keynote-speaker",
  type: "photo",
  section: "Welcome",
  tone: "dark",
  // No kicker. It read "Fifteen minutes, then it's yours" until 7 Aug 2026,
  // which asserted a duration the published agenda (5:50–6:10pm) and the run
  // sheet (17:50–18:05 plus Q&A) do not agree on. Removed rather than
  // corrected: nobody has settled which of the three clocks is right, and a
  // slide behind the speaker is the worst place to guess.
  title: "Rach Monks",
  lead: "Founder of AI for X and X-Bot Games",
  image: KEYNOTE_PLATE,
  overlay: "gradient",
  note: "Introduce Rach by name and give her the room. She speaks at 5:50pm for about fifteen minutes; team forming follows straight after.",
};

/*
 * REMOVED 5 Aug 2026 — "Who to Find Today".
 *
 * It introduced AUT's weekend event supervisor by name and photograph, above
 * the 0800 security number. Mahsa cut it on review with "I don't even know who
 * is Vishnu", and she is right about the room: a name and a face nobody has met
 * are not wayfinding, and the slide spent a whole beat of the opening on a
 * person most attendees will never need to find. Anyone who does need him asks
 * a volunteer or the security desk.
 *
 * What survived the deletion is the 0800, which moved up into SAFETY_LINES —
 * it was the only emergency contact anywhere on screen. His mobile was never in
 * this repository and must not be added: the deck is served from a public URL,
 * and a personal number committed once cannot be withdrawn from either. It
 * travels on the printed run sheet, which is where a third party's contact
 * details belong.
 *
 * Do not restore this slide without asking Mahsa first.
 */

/**
 * Tonight's housekeeping: wifi, rooms, the run sheet, the shape of the weekend.
 *
 * These four sat after the chapter divider until 7 Aug 2026 and now run
 * straight after the safety briefing, because they are what the room is
 * already asking each other about while the host is still talking — and a
 * person who has just sat down wants the wifi and the room number before they
 * want the organisational preamble.
 */
/*
 * Saturday's rooms, written once and projected twice.
 *
 * The room table is the single thing most likely to send someone to the wrong
 * floor, so it is shown on Friday night as a preview and again on Saturday
 * morning as the live version. One `items` array feeds both: two copies of a
 * room list are two things to forget to update, and the mentor room already
 * moves between the days.
 *
 * Verified against AUT's own "AI Hackathon Information Hub" on 7 Aug 2026,
 * which agrees room for room and adds only that the photo booth shares WG306.
 */
const SATURDAY_ROOMS = [
  "WG308, the Wave Room — pitches and awards",
  "WG306, the foyer — registration, catering and breaks",
  "WG403 and WG404 — lecture theatres for teams",
  "WG607–609, WG701–703, WG801–803 and WG808 — team rooms",
  "WG809 — the mentor room, all day",
];

const TONIGHT_LOGISTICS: Slide[] = [
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
      { tag: "Password", title: "69244539" },
    ],
    note: "Leave this up through registration. Read the username aloud one hyphen at a time — it is the field everyone mistypes — and say the password twice.",
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
    id: "venue-wayfinding",
    type: "bullets",
    section: "Day One — Friday 7 August",
    eyebrow: "Tonight's rooms",
    title: "Where to Find Things",
    lead: "Every room is in the Sir Paul Reeves Building, the WG building",
    items: [
      "WG308, the Wave Room — tonight's opening and keynote",
      "WG306, the foyer — registration, dinner and coffee",
      "WG128, WG128A, WG129 and WG100D — team spaces",
    ],
    note: "Point in the direction of each room as you say it. Tomorrow's rooms are different — the next slide is the preview, and it comes round again in the morning.",
  },
  /* Saturday's rooms, shown tonight as a look-ahead. Same list as the live
     version in the morning; only the kicker, lead and host note change, because
     tonight the room is being warned and tomorrow it is being directed. */
  {
    id: "venue-wayfinding-day-two-preview",
    type: "bullets",
    section: "Day One — Friday 7 August",
    eyebrow: "Different rooms tomorrow",
    title: "Where to Find Things Tomorrow",
    lead: "The whole building opens up, and the mentors move",
    items: SATURDAY_ROOMS,
    note: "Do not walk them through it line by line tonight — say only that tomorrow is different, that the mentor room moves to WG809, and that this slide comes round again in the morning.",
  },
];

/*
 * The shape of the weekend, and it sits on its own between the keynote and the
 * Challenge chapter rather than at the end of the housekeeping.
 *
 * Housekeeping now runs to four slides — wifi, tonight's run sheet, tonight's
 * rooms, tomorrow's rooms — which is exactly `consecutiveContent`. Leaving this
 * one on the end made five in a row, five light in a row, and three bullet
 * slides in a row: three separate lint errors for one slide in the wrong place.
 * It reads better here anyway, as the bridge out of the welcome and into the
 * event itself.
 */
const TWO_DAY_FORMAT: Slide = {
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
};

const OPENING_SLIDES: Slide[] = insertAfter(
  insertAfter(
      buildOpeningSlides({
        eventTitle: "Aotearoa AI Hackathon Festival 2026",
        /* Two facts, not three. The AI Forum partnership was cut from the title
           slide on Mahsa's 5 Aug review — the partner logo row directly beneath
           already says it, and saying it twice on the one slide the room stares
           at longest reads as padding. The logos stay. */
        eventMeta: ["7–8 August 2026", "AUT City Campus"],
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

/*
 * Tonight's housekeeping goes in directly after the safety briefing, ahead of
 * the She Sharp introduction, the impact figures and the sponsor wall.
 *
 * The chapter divider travels up with it, and that is load-bearing rather than
 * decorative. Dropped straight after the safety slide, the four housekeeping
 * slides make a run of six consecutive light information slides out of the
 * welcome, and leave the divider stranded against the next one — three
 * full-frame slides in a row. `lintRhythm` rejects both. Moving the divider to
 * open the housekeeping fixes all three errors at once and reads correctly
 * besides: safety, then the event's own title card, then what the room is
 * already whispering about — wifi, rooms, and what happens tonight.
 */
const OPENING_WITH_LOGISTICS: Slide[] = insertAfter(
  insertAfter(
    insertAfter(
      OPENING_SLIDES.filter((slide) => slide.id !== "event-opening"),
      "health-and-safety",
      OPENING_SLIDES.find((slide) => slide.id === "event-opening")!,
    ),
    "event-opening",
    ...TONIGHT_LOGISTICS,
  ),
  "keynote-speaker",
  TWO_DAY_FORMAT,
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
    // She Sharp's opening, generated from live site data, plus AUT's own
    // welcome, tonight's housekeeping and the keynote slot.
    ...OPENING_WITH_LOGISTICS,

    // --- Day one -----------------------------------------------------------
    {
      id: "section-the-challenge",
      type: "section",
      section: "Day One — Friday 7 August",
      eyebrow: "Choose before you build",
      index: "02",
      tone: "dark",
      title: "The Challenge",
      subtitle:
        "Five real-world themes drawn from the UN Sustainable Development Goals",
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
    /* Where the five themes came from, immediately after them.
     *
     * Added 5 Aug 2026 at Mahsa's request. Two slides now cite the SDGs — the
     * chapter opener and the themes — and until this page the room had no idea
     * what was being cited. Nobody reads seventeen tiles from three metres and
     * they are not meant to: it is a single beat that lands the provenance, and
     * the host names only the ones the five themes map onto.
     *
     * The UN's own 6×3 poster rather than the 4:3 Global Goals grid, because
     * this stage runs to 21:9 and the squarer version wastes a third of it.
     * `fit: "contain"` is mandatory here — see the note on PhotoSlide.fit.
     */
    {
      id: "sdg-goals",
      type: "photo",
      section: "Day One — Friday 7 August",
      tone: "light",
      fit: "contain",
      eyebrow: "Seventeen, and they connect",
      title: "The UN Sustainable Development Goals",
      lead: "Every theme tonight comes from one of these",
      image: {
        src: "/img/events/aotearoa-ai-hackathon-festival-2026-sdg-goals.webp",
        alt: "The seventeen United Nations Sustainable Development Goals, each with its number, title and icon, under the Sustainable Development Goals wordmark.",
      },
      note: "Point at the four the themes map onto — 2 zero hunger, 4 quality education, 10 reduced inequalities, 15 life on land — then move on. Do not read the list.",
    },
    /* The five themes are the categories; these three are the actual briefs.
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
      subtitle:
        "Three briefs written by the organisations that actually have them",
      background: archivePlate(25),
      note: "Say that these are real problems from real organisations, and that a team is free to bring its own instead.",
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
      logo: FPH_LOGO,
      note: "Mark Modricker from F&P speaks to this brief and the next one — five minutes for both, confirmed by email on 6 August. Hand over here and take the deck back after the restoration slide. F&P maps this to SDGs 8, 9 and 10 for inclusion, 12 for removing rework, and 3 through the products themselves. They judge on whether the design is genuinely underpinned by their Culture of Care.",
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
      logo: FPH_LOGO,
      note: "SDG 15 and SDG 12. Restoring the Oiroa Stream at F&P's Karaka campus. Without drone imagery, teams can use Matuku Link, Waikereru or Hinewai as proxy datasets — the eight metrics are listed on the event page.",
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
      logo: WOOLWORTHS_LOGO,
      note: "Supported by Woolworths New Zealand alongside Kai Commitment. The problem statement video is on the AUT City Campus Community Hub, linked from the event page.",
    },
    /* The room has just been handed three briefs and has to pick one. This is
       the page the host stops talking on, and it is also what keeps the
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
    /* Forty minutes is a long time to run on a wristwatch, and this is the one
       block of the weekend where the room is standing up and moving. The clock
       goes on the projector so the timekeeper does not have to shout. */
    {
      id: "team-forming-clock",
      type: "break",
      section: "Day One — Friday 7 August",
      eyebrow: "Mentors are circulating now",
      title: "Team Forming",
      lead: "Forty minutes to find your people and your problem",
      minutes: 40,
      resumeLabel: "Overview of tomorrow",
      note: "Start the timer as people stand up. Aim for teams of five or six — up to ten teams. Nirmala is timekeeping; agree with her before you call time.",
    },
    /* The three links a team needs the moment it exists.
       Placed here rather than in the housekeeping block on purpose: a code
       scanned before a team exists is a code nobody uses. The run sheet asks
       each team to post its table number in its own Discord channel as soon as
       it has a spot, which is thirty seconds after this slide goes up. */
    {
      id: "event-links",
      type: "contact",
      section: "Day One — Friday 7 August",
      eyebrow: "Three codes, one weekend",
      title: "Everything You Need Tonight",
      lead: "Your team channel, the assistant, and the pitch template",
      socials: [],
      qrs: [DISCORD_QR, ASSISTANT_QR, PITCH_TEMPLATE_QR],
      footnote:
        "Post your table number in your team's Discord channel so we can find you.",
      note: "Leave this up while teams settle. Everything after tonight — the afternoon agenda, the lunch call, the pitch order — is announced on Discord first.",
    },
    /* The mentors across three slides rather than one, however many there are.
       At `md` density a single slide of seventeen has to shrink itself well
       below the 28px the back of the room can read, and `COPY_LIMITS.peopleCount`
       caps a slide at eight anyway. `mentorGroups` splits the roster in thirds. */
    {
      id: "meet-the-mentors-1",
      type: "people",
      section: "Day One — Friday 7 August",
      eyebrow: "First of three groups",
      title: "Meet the Mentors",
      lead: "Ask early and ask often — this is what they are here for",
      people: mentorGroups[0],
      density: "md",
      shape: "circle",
      note: "Ask each mentor to stand as you say their name. Keep it moving — there are two more slides of them.",
    },
    {
      id: "meet-the-mentors-2",
      type: "people",
      section: "Day One — Friday 7 August",
      eyebrow: "Second of three",
      title: "Meet the Mentors",
      people: mentorGroups[1],
      density: "md",
      shape: "circle",
      note: "Same again — stand, name, next. One more group after this.",
    },
    {
      id: "meet-the-mentors-3",
      type: "people",
      section: "Day One — Friday 7 August",
      eyebrow: "And the rest of them",
      title: "Meet the Mentors",
      people: mentorGroups[2],
      density: "md",
      shape: "circle",
      note: "Last group. Andreas Spanner is remote on Discord, so say so rather than looking for him in the room. Then hand over for the introductions.",
    },
    /* A dark beat in the middle of seventeen names.
       Three people slides after the links slide is five information slides in a
       row and five light ones, which `lintRhythm` rejects and a room feels
       before the linter does. Splitting the roster with a photograph fixes both
       and gives the host somewhere to say the one thing the names cannot. */
    {
      id: "mentors-are-for-asking",
      type: "photo",
      section: "Day One — Friday 7 August",
      tone: "dark",
      eyebrow: "Ask before you are stuck",
      title: "None of them mind being interrupted",
      lead: "Waiting until you are stuck costs you the hour you needed",
      image: archivePlate(61),
      overlay: "gradient",
      note: "Say it plainly: the mentors are here to be interrupted, and the teams who ask early finish. Then straight into the last group.",
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
      items: PITCH_SECTIONS,
      note: "Tell teams to describe the problem they actually solved, not the one they set out to solve.",
    },
    /* The template gets its own slide rather than sharing the links slide.
       Mahsa asked for one she could open and show from the front of the room
       while talking about the pitch, and a QR sitting third in a row of three is
       not that. Same `PITCH_TEMPLATE_QR` constant, so this cannot drift from the
       destination the 5 August signed-out QR audit actually checked. */
    {
      id: "pitch-deck-template",
      type: "qr-cta",
      section: "Day One — Friday 7 August",
      tone: "dark",
      eyebrow: "Not a blank page",
      title: "The Pitch Deck Template",
      lead: "The slide order the judges are expecting, ready to fill in",
      points: [
        "Same four sections as the five minutes you just saw",
        "Download it tonight — the venue wifi is busiest tomorrow",
        "Bring a PDF copy in case the laptop fights you",
      ],
      qr: PITCH_TEMPLATE_QR,
      note: "Open it on screen and scroll through it once. Leave the slide up long enough for the back row to scan the code.",
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
      eyebrow: "Four of these exist",
      title: "Prizes & Awards",
      prizes: [
        {
          amount: "$250",
          name: "Venue winning team",
          detail: "Announced here tomorrow evening",
          scope: "venue",
        },
        // TODO(runner-up): swap "2nd" for the cash figure if there is one. The
        // AI Forum's central pool covers the winning team only, and the run
        // sheet records the runner-up prize as six gifts rather than an amount,
        // so a dollar sign here would be invented.
        {
          amount: "2nd",
          name: "Venue runner-up",
          detail: "A prize for every team member",
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
      footnote:
        "The national winner pitches at the Aotearoa AI Summit in September.",
      note: "Say the two venue prizes first and loudest — they are the ones this room can win tomorrow, and the runner-up prize means a second team goes home with something. The Summit is 8–9 September in Wellington; the cash comes from AWS via AI Forum NZ.",
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
      title: "Group Photo, Then Strategy",
      // The photo is four minutes and needs no clock; the thirty minutes after
      // it do, and they are what ends the day. One slide, timed on the block
      // that matters.
      lead: "Thirty minutes with your team, then we close",
      minutes: 30,
      resumeLabel: "Day one closes at 8:00pm",
      background: lightPlate("light-aurora-sweep"),
      note: "Take the group photo first — Mike is shooting it — then start the timer. Day one closes at 8:00pm sharp.",
    },

    // --- 38–54 — Day two --------------------------------------------------
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
      lead: "Presentations start at 4:00pm and awards at 7:00pm",
      items: DAY_TWO,
      columns: 2,
      note: "Point at the 3:00pm row — slides are due to She Sharp then — and at 4:00pm. Everything before those is negotiable, those two are not.",
    },
    /* Saturday has its own rooms, and more of them: the whole building opens up
       and the mentors move from WG808 to WG809. This slide is deliberately here
       rather than beside the Friday one, so nobody reads tomorrow's rooms out on
       Friday night. Source is the room table Nikita circulated on WhatsApp and
       posted into the channel on 4 August — not the `Venue` cell of the run
       sheet, which still lists Friday's rooms for both days. */
    {
      id: "venue-wayfinding-day-two",
      type: "bullets",
      section: "Day Two — Saturday 8 August",
      eyebrow: "More rooms than last night",
      title: "Where to Find Things Today",
      lead: "Your team has a room — check Discord for which one",
      items: SATURDAY_ROOMS,
      note: "The mentor room has moved: WG808 last night, WG809 today. Say that twice — people will walk to yesterday's room. They saw this slide as a preview on Friday night, so this is the repeat, not the first telling.",
    },
    /* Two placeholders that only Friday night can fill.

       TODO(day-one): replace the four archive tiles with the team photographs
       taken during the group photo at the end of day one — save them as
       `/img/events/aotearoa-ai-hackathon-festival-2026-teams-1.jpg` and so on —
       and fill the roster below with the real team names and tables.

       They stand as archive frames rather than empty boxes on purpose: if
       nobody gets to the photographs before Saturday morning, the deck still
       projects something deliberate instead of announcing that it was not
       finished. */
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
    /* A run sheet rather than a card grid, because the venue plans for up to
       ten teams and a `themes` slide caps at six. The number column carries the
       team number and the row carries the name, which is the shape a room reads
       fastest when it is looking for its own table. */
    {
      id: "team-groupings",
      type: "agenda",
      section: "Day Two — Saturday 8 August",
      eyebrow: "Find your table first",
      title: "Today's Teams",
      lead: "Who formed last night, and where they are sitting",
      items: [
        { time: "Team 1", label: "Team name — table" },
        { time: "Team 2", label: "Team name — table" },
        { time: "Team 3", label: "Team name — table" },
        { time: "Team 4", label: "Team name — table" },
        { time: "Team 5", label: "Team name — table" },
        { time: "Team 6", label: "Team name — table" },
        { time: "Team 7", label: "Team name — table" },
        { time: "Team 8", label: "Team name — table" },
        { time: "Team 9", label: "Team name — table" },
        { time: "Team 10", label: "Team name — table" },
      ],
      columns: 2,
      note: "PLACEHOLDER — fill in the real team names and tables after Friday night, and delete any rows you do not need. Read the names out and let each team wave.",
    },
    /* A hero between the morning's logistics and the morning's work.
       The run sheet, the rooms, the team photographs and the team groupings are
       four content slides back to back, which is the cap — the Saturday rooms
       slide added on 7 August pushed it to five. This is the breath, and it is
       also the last thing said before the room goes quiet and starts building. */
    {
      id: "the-morning-is-yours",
      type: "photo",
      section: "Day Two — Saturday 8 August",
      tone: "dark",
      eyebrow: "Four hours, then lunch",
      title: "Build the thing you can show",
      lead: "A demo of one working piece beats a description of ten",
      image: archivePlate(97),
      overlay: "gradient",
      note: "Say it before they scatter: something on screen at 4:00pm matters more than the feature list. Then let them go.",
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
      note: "Say that most teams split at midday — half keep building, half build the pitch. The afternoon agenda goes out on Discord by 10:00am.",
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
      note: "Start the timer as the first person reaches the food. Mentors eat with the teams. The lunch call goes out on Discord at 12:15pm.",
    },
    /* From here to the pitches the afternoon is a chain of timed blocks, and
       every one of them is on the run sheet to the minute. Each gets its own
       clock, and the slide between two clocks is what the room needs at that
       exact point rather than filler inserted to break the run. */
    {
      id: "pitch-prep",
      type: "break",
      section: "Day Two — Saturday 8 August",
      eyebrow: "Slides open, laptops charged",
      title: "Prepare for Pitch Practice",
      lead: "Fifteen minutes to get your deck in front of you",
      minutes: 15,
      resumeLabel: "Pitch practice with mentors",
      note: "One mentor is allocated per team for practice, and the mentors come to the teams. Point at whoever is coordinating that.",
    },
    {
      id: "five-minute-pitch-recap",
      type: "agenda",
      section: "Day Two — Saturday 8 August",
      eyebrow: "Time each section now",
      title: "Five Minutes, Section by Section",
      lead: "Practise to the clock, not to the slide count",
      items: PITCH_SECTIONS,
      note: "Ask every team to run it once against a phone timer before the mentor arrives. Most teams overrun on the problem and lose the demo.",
    },
    {
      id: "pitch-practice",
      type: "break",
      section: "Day Two — Saturday 8 August",
      eyebrow: "One mentor per team",
      title: "Pitch Practice",
      lead: "Forty-five minutes with a mentor watching the clock",
      minutes: 45,
      resumeLabel: "Final pitch updates",
      note: "Mentors go to the teams rather than the other way round. Remind them to time the pitch, not just listen to it.",
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
      note: "Show this as teams come out of practice. Ask each one which criterion they are weakest on, and send them to fix that.",
    },
    {
      id: "final-pitch-updates",
      type: "break",
      section: "Day Two — Saturday 8 August",
      eyebrow: "Change one thing, not five",
      title: "Final Pitch Updates",
      lead: "An hour to act on what the mentors just told you",
      minutes: 60,
      resumeLabel: "Afternoon tea at 3:00pm",
      note: "Slides come to She Sharp at 3:00pm, so this hour is the last one. Say that out loud at the halfway mark.",
    },
    {
      id: "afternoon-tea",
      type: "break",
      section: "Day Two — Saturday 8 August",
      eyebrow: "Grab and go, please",
      title: "Afternoon Tea",
      lead: "Tech check begins as soon as we are back",
      minutes: 15,
      resumeLabel: "Tech check",
      background: lightPlate("light-prism-edge"),
      note: "Judges arrive during this break and are briefed separately. Slides should already be with She Sharp.",
    },
    {
      id: "before-you-pitch",
      type: "bullets",
      section: "Day Two — Saturday 8 August",
      eyebrow: "Four things, then quiet",
      title: "Before You Pitch",
      lead: "The last few things to get right this afternoon",
      items: [
        "Send your slides to She Sharp by 3:00pm",
        "One person per team for the tech check",
        "Every pitch is recorded for the national panel",
        "Presentation order is drawn and posted on Discord",
        "Five minutes each, and the clock does not stop",
      ],
      note: "The recording is the only thing the national panel sees, so a pitch that overruns is a pitch that gets cut. Say that plainly.",
    },
    {
      id: "tech-check",
      type: "break",
      section: "Day Two — Saturday 8 August",
      eyebrow: "One laptop at a time",
      title: "Tech Check",
      lead: "Every team on the projector before we start",
      minutes: 15,
      resumeLabel: "Final presentations at 3:30pm",
      note: "One person per team, in presentation order. Check the recording setup at the same time.",
    },
    {
      id: "presentation-order",
      type: "agenda",
      section: "Day Two — Saturday 8 August",
      eyebrow: "Drawn at random today",
      title: "Presentation Order",
      lead: "Drawn at random and posted on Discord this afternoon",
      items: [
        { time: "1st", label: "Team name" },
        { time: "2nd", label: "Team name" },
        { time: "3rd", label: "Team name" },
        { time: "4th", label: "Team name" },
        { time: "5th", label: "Team name" },
        { time: "6th", label: "Team name" },
        { time: "7th", label: "Team name" },
        { time: "8th", label: "Team name" },
        { time: "9th", label: "Team name" },
        { time: "10th", label: "Team name" },
      ],
      columns: 2,
      note: "PLACEHOLDER — fill in once the order is drawn, and delete any rows you do not need. Leave it up so the next team knows to get ready.",
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
    /* The pitch clock, and the only slide in the deck meant to be returned to
       over and over. The countdown re-arms every time the slide becomes
       current, so jumping away to announce the next team and back is the
       reset. */
    {
      id: "pitch-clock",
      type: "break",
      section: "Day Two — Saturday 8 August",
      eyebrow: "Reset between every team",
      title: "Pitch Clock",
      lead: "Five minutes, and the judges ask questions after",
      minutes: 5,
      resumeLabel: "Next team, please",
      note: "Press O, pick this slide again, and the clock re-arms at five minutes. Space starts it as the team begins. Every pitch is recorded, so hold the time.",
    },

    // 55–60 — She Sharp closing, generated from live site data.
    ...buildClosingSlides({
      thanksLogos: [
        { label: "Hosts, partners and sponsors", logos: PARTNER_LOGOS },
      ],
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
