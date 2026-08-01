/**
 * Deck: Aotearoa AI Hackathon Festival 2026 — AUT City Campus, 7–8 August 2026.
 *
 * Two days, one host, one projector. The nine opening and six closing slides
 * come from `buildOpeningSlides()` / `buildClosingSlides()` so the team, stats
 * and sponsor walls stay live; the twenty in between are this event.
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

import {
  buildClosingSlides,
  buildOpeningSlides,
  type KarakiaText,
} from "../boilerplate";
import type { Deck, DeckImage, DeckLogo, QrBlock } from "../types";
import { parseTimedLines } from "../utils";

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

/** The festival's own koru artwork, used as a quiet plate behind the karakia. */
const koru = detail.photos[0];
if (!koru) {
  throw new Error(
    `"${EVENT_SLUG}" has no photos[0]; the karakia slide expects the festival koru artwork.`,
  );
}
const KORU_IMAGE: DeckImage = { src: koru.url, alt: koru.alt };

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
      heroImage: KORU_IMAGE,
      contactQrs: [WEBSITE_QR, EVENTS_QR, LINKEDIN_QR],
    }),

    // --- 10–22 — Day one ---------------------------------------------------
    {
      id: "day-one-run-sheet",
      type: "agenda",
      section: "Day One — Friday 7 August",
      title: "Tonight",
      lead: "Doors at five, and day one closes at eight",
      items: DAY_ONE,
      columns: 2,
      note: "Read only the next three rows. People photograph the slide for the rest.",
    },
    {
      id: "two-day-format",
      type: "bullets",
      section: "Day One — Friday 7 August",
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
      index: "02",
      tone: "dark",
      title: "The Challenge",
      subtitle: "Five real-world themes drawn from the UN Sustainable Development Goals",
      note: "Pause here. The next slide is the one teams choose from.",
    },
    {
      id: "challenge-themes",
      type: "themes",
      section: "Day One — Friday 7 August",
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
    /* Thirteen mentors across two slides rather than one.
       At `md` density a single slide of thirteen has to shrink itself to about
       74% on a 4:3 projector to fit, which puts the names below the 28px the
       back of the room can read. `COPY_LIMITS.peopleCount` enforces the split. */
    {
      id: "meet-the-mentors-1",
      type: "people",
      section: "Day One — Friday 7 August",
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
      title: "How Mentors Help",
      items: [
        "Technical experts sense-check your design and suggest alternatives",
        "Subject matter experts know whether your solution helps",
        "Business experts shape a pitch that lands",
      ],
      note: "Skip this if the mentors have introduced themselves well. Say they will not build it for you.",
    },
    {
      id: "judging-criteria",
      type: "criteria",
      section: "Day One — Friday 7 August",
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
      footnote:
        "The top four national finalists are invited to pitch live at the Aotearoa AI Summit, 8–9 September 2026 in Wellington. Prizes are supported by AWS and provided via AI Forum New Zealand. Individual venues may offer additional prizes and categories.",
      note: "Say the venue prize first and loudest — it is the one this room can win tomorrow.",
    },
    {
      id: "nationwide-festival",
      type: "bullets",
      section: "Day One — Friday 7 August",
      optional: true,
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
      title: "Group Photo & Break",
      lead: "Bring everyone to the front, then back to your tables",
      minutes: 15,
      resumeLabel: "Team strategy planning",
      note: "Start the timer after the photo. Day one closes at 8:00pm.",
    },

    // --- 23–29 — Day two ---------------------------------------------------
    {
      id: "section-day-two",
      type: "section",
      section: "Day Two — Saturday 8 August",
      index: "03",
      tone: "dark",
      title: "Day Two",
      subtitle: "Saturday 8 August — build, pitch, and the venue winner",
      note: "Open day two here. Welcome anyone who has joined this morning.",
    },
    {
      id: "day-two-run-sheet",
      type: "agenda",
      section: "Day Two — Saturday 8 August",
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
      title: "Lunch",
      lead: "Eat away from your laptop — the afternoon is long",
      minutes: 45,
      resumeLabel: "Prepare for pitch practice",
      note: "Start the timer as the first person reaches the food. Mentors eat with the teams.",
    },
    {
      id: "judging-criteria-recap",
      type: "criteria",
      section: "Day Two — Saturday 8 August",
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
      title: "Afternoon Tea",
      lead: "Tech check begins as soon as we are back",
      minutes: 15,
      resumeLabel: "Tech check",
      note: "Use this break to test every team's laptop on the projector.",
    },
    {
      id: "section-final-presentations",
      type: "section",
      section: "Day Two — Saturday 8 August",
      index: "04",
      tone: "dark",
      title: "Final Presentations",
      subtitle: "Five minutes each, and every pitch is recorded",
      note: "Call the first team up. Hold the room to time — the recording is what goes to national judging.",
    },

    // 30–35 — She Sharp closing, generated from live site data.
    ...buildClosingSlides({
      thanksLogos: [{ label: "Hosts, partners and sponsors", logos: PARTNER_LOGOS }],
      thanksNames: [
        ...judges.map((judge) => judge.name),
        ...mentors.map((mentor) => mentor.name),
      ],
      upcoming: UPCOMING_SNAPSHOT,
      feedbackQr: FEEDBACK_QR,
      karakia: CLOSING_KARAKIA,
    }),
  ],
};
