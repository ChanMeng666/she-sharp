/**
 * Deck: Aotearoa AI Hackathon Festival 2026 — AUT City Campus, 7–8 August 2026.
 *
 * Two days, one host, one projector. The nine opening and six closing slides
 * come from `buildOpeningSlides()` / `buildClosingSlides()` so the team, stats
 * and sponsor walls stay live; the twenty-three in between are this event.
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
import type { Deck, DeckImage, DeckLogo, QrBlock } from "../types";
import { parseTimedLines } from "../utils";
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

/**
 * The post-event survey is a fresh Google Form for every event, so there is no
 * standing URL to fall back on — and a code pointing at the previous event's
 * form is worse than no code, because nobody in the room can tell.
 *
 * Left empty until the organiser supplies this event's link: the slide then
 * shows a "Link not set yet" panel and the linter reports it. Paste the form
 * URL here and nowhere else.
 */
const FEEDBACK_QR: QrBlock = {
  url: "",
  label: "Feedback form",
  caption: "Ask the host for the link",
};

/* The ambassador code is not defined here: the intake form is the same for
   every event, so `buildClosingSlides()` supplies it. */

const LINKEDIN_QR: QrBlock = {
  url: "https://www.linkedin.com/company/shesharpnz/",
  label: "She Sharp on LinkedIn",
  caption: "linkedin.com/company/shesharpnz",
};

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

/** Mentor tiles: name and organisation only — the bio is the person talking. */
const mentorTiles = mentors.map((mentor) => ({
  name: mentor.name,
  org: mentor.company,
  image: mentor.image,
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
  "Two scorecards: the TAIAO scorecard weights all four categories equally, the Technological Brilliance scorecard leans towards Technology. Judges from the last five festivals advise focusing on three things — is it an important UN Sustainable Development Goal problem, is the solution feasible, and will it make an impact. Every pitch is recorded and all panel decisions are final.";

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
    time: "5:00–8:00pm",
    venue: "Auckland",
    blurb: "A Les Mills x She Sharp panel on diversity and AI for impact",
  },
];

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
    // 1–9 — She Sharp opening, generated from live site data.
    ...buildOpeningSlides({
      eventTitle: "Aotearoa AI Hackathon Festival 2026",
      eventMeta: ["7–8 August 2026", "AUT City Campus", "Hosted with AI Forum NZ"],
      partnerLogos: PARTNER_LOGOS,
      karakia: OPENING_KARAKIA,
      // TODO(venue-safety): AUT's own lines — assembly point, lift rules,
      // after-hours access — go here once the venue briefing is confirmed.
      // Left empty rather than guessed: a wrong safety instruction is worse
      // than a generic one. Adding lines here drops org defaults from the top.
      safetyExtras: [],
      heroImage: OPENING_KARAKIA_PLATE,
      chapterPlate: CHAPTER_PLATE,
      contactQrs: [WEBSITE_QR, EVENTS_QR, LINKEDIN_QR],
    }),

    // --- 10–25 — Day one ---------------------------------------------------
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
        "Four finalists pitch at the Aotearoa AI Summit",
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
      eyebrow: "Straight from the UN goals",
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
    /* Thirteen mentors across two slides rather than one.
       At `md` density a single slide of thirteen has to shrink itself to about
       74% on a 4:3 projector to fit, which puts the names below the 28px the
       back of the room can read. `COPY_LIMITS.peopleCount` enforces the split. */
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
      index: "03",
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
          name: "National Technological Brilliance",
          detail: "National judging panel",
          scope: "national",
        },
      ],
      // Was three sentences and forty words, which pushed the slide past the
      // stage on a 4:3 projector and made it scale itself down to 79% — where
      // the labels fall under the 28px a room can read. Cut rather than shrunk:
      // the Summit dates, the AWS attribution and the per-venue caveat are all
      // on the event page, and the host says them anyway.
      footnote: "Top four nationally pitch at the Aotearoa AI Summit in September.",
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
        "A national panel then selects four finalists",
        "Finalists pitch at the Aotearoa AI Summit, Wellington",
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

    // --- 26–32 — Day two ---------------------------------------------------
    {
      id: "section-day-two",
      type: "section",
      section: "Day Two — Saturday 8 August",
      eyebrow: "Build, pitch, then a winner",
      index: "04",
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
      index: "05",
      tone: "dark",
      title: "Final Presentations",
      subtitle: "Five minutes each, and every pitch is recorded",
      background: archivePlate(115),
      note: "Call the first team up. Hold the room to time — the recording is what goes to national judging.",
    },

    // 33–38 — She Sharp closing, generated from live site data.
    ...buildClosingSlides({
      thanksLogos: [{ label: "Hosts, partners and sponsors", logos: PARTNER_LOGOS }],
      thanksNames: [
        ...judges.map((judge) => judge.name),
        ...mentors.map((mentor) => mentor.name),
      ],
      upcoming: UPCOMING_SNAPSHOT,
      feedbackQr: FEEDBACK_QR,
      karakia: CLOSING_KARAKIA,
      karakiaImage: CLOSING_KARAKIA_PLATE,
    }),
  ],
};
