/**
 * Checks every registered slide deck.
 *
 * Run: npx tsx lib/deck/deck.test.ts
 *
 * A deck fails in front of a room, at the worst possible moment, with no way to
 * fix it. So the failure modes that cannot be seen while authoring are asserted
 * here instead: an image path that does not exist under `public/` (a blank
 * plate on the projector, offline, with no network to fall back on), copy that
 * overruns the limits, an accent nobody at the back can read, a run-sheet row
 * with no time, and a slide the host has no note for.
 *
 * No database and no network — everything here is pure data.
 */

import assert from "node:assert";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { customEventsV3 } from "@/lib/data/events-custom";
import {
  allFeedbackCodes,
  eventSlugForFeedbackCode,
  feedbackCodeForSlug,
  FEEDBACK_CODE_PATTERN,
} from "@/lib/data/feedback-codes";
import type { EventV3 } from "@/types/event";

import { buildClosingSlides, buildOpeningSlides } from "./boilerplate";
import {
  deckMetaFrom,
  deckTitleFrom,
  discussionMinutesFrom,
  findRowByPatterns,
  loadEventForDeck,
  minutesOf,
  runSheetFrom,
} from "./event-source";
import { DEFAULT_CLOSING_KARAKIA, DEFAULT_OPENING_KARAKIA } from "./karakia";
import { getAllDecks, getDeckSlugs } from "./registry";
import { COPY_LIMITS, hasErrors, lintDeck } from "./lint";
import { rhythmViolations, toRhythmStep } from "./rhythm";
import { planEveningEvent } from "./templates/evening-event";
import { checkAccentContrast, contrastRatio, DEFAULT_DARK_CANVAS, DEFAULT_LIGHT_CANVAS } from "./theme";
import { collectDeckImages, parseTimedLine } from "./utils";

/**
 * Ink colours per tone, mirrored from `.deck-slide[data-tone=…]` in
 * `styles/components/deck.css`. Duplicated on purpose: the CSS is the runtime
 * source of truth and TypeScript cannot read it, so this is the only place that
 * can assert body text stays legible from the back of a room. Keep in sync.
 */
const TONE_INK = {
  light: { ink: "#1f1e44", canvas: DEFAULT_LIGHT_CANVAS },
  dark: { ink: "#ffffff", canvas: DEFAULT_DARK_CANVAS },
} as const;

/**
 * Body text on a projected slide is read at distance in a room whose lights are
 * usually still on. AA's 4.5:1 is the floor for a screen at arm's length; 7:1
 * (AAA) is what survives a washed-out projector.
 */
const INK_CONTRAST_TARGET = 7;

const PUBLIC_DIR = join(process.cwd(), "public");

let failures = 0;

/** Records one assertion and keeps going, so one break does not hide the rest. */
function check(label: string, ok: boolean): void {
  console.log(`  ${ok ? "ok" : "FAIL"} - ${label}`);
  if (!ok) failures++;
}

const decks = getAllDecks();
check("the registry contains at least one deck", decks.length > 0);

for (const deck of decks) {
  console.log(`\n${deck.slug} — ${deck.slides.length} slides`);

  // --- 1. Slide ids --------------------------------------------------------

  const ids = deck.slides.map((slide) => slide.id);
  check("slide ids are unique", new Set(ids).size === ids.length);
  const badIds = ids.filter((id) => !/^[a-z0-9][a-z0-9-]*$/.test(id));
  check(
    `slide ids are kebab-case${badIds.length ? ` (bad: ${badIds.join(", ")})` : ""}`,
    badIds.length === 0,
  );

  // --- 2. Every image exists under public/ ---------------------------------

  const missing = collectDeckImages(deck).filter(
    (src) => !existsSync(join(PUBLIC_DIR, src)),
  );
  check(
    `every image resolves under public/${missing.length ? ` (missing: ${missing.join(", ")})` : ""}`,
    missing.length === 0,
  );

  // --- 3. Copy limits ------------------------------------------------------

  const issues = lintDeck(deck);
  const errors = issues.filter((issue) => issue.severity === "error");
  errors.forEach((issue) =>
    console.log(
      `      error  slide ${issue.slideIndex + 1} (${issue.slideId}) [${issue.rule}] ${issue.message}`,
    ),
  );
  issues
    .filter((issue) => issue.severity === "warning")
    .forEach((issue) =>
      console.log(
        `      warn   slide ${issue.slideIndex + 1} (${issue.slideId}) [${issue.rule}] ${issue.message}`,
      ),
    );
  check(`lintDeck reports no errors (${errors.length})`, !hasErrors(issues));

  // --- 4. Contrast ---------------------------------------------------------

  for (const accent of checkAccentContrast(deck.theme)) {
    check(
      `accent on the ${accent.tone} canvas is ${accent.ratio.toFixed(2)}:1 (need 4.5:1)`,
      accent.passes,
    );
  }

  for (const [tone, pair] of Object.entries(TONE_INK)) {
    const ratio = contrastRatio(pair.ink, deck.theme[tone === "dark" ? "darkCanvas" : "lightCanvas"] ?? pair.canvas);
    check(
      `${tone} ink on its canvas is ${ratio.toFixed(2)}:1 (need ${INK_CONTRAST_TARGET}:1)`,
      ratio >= INK_CONTRAST_TARGET,
    );
  }

  // --- 5. Run sheets -------------------------------------------------------

  const emptyRows = deck.slides
    .filter((slide) => slide.type === "agenda")
    .flatMap((slide) =>
      slide.items
        .filter((item) => !item.time.trim() || !item.label.trim())
        .map((item) => `${slide.id}: ${JSON.stringify(item)}`),
    );
  check(
    `every run-sheet row has a time and a label${emptyRows.length ? ` (bad: ${emptyRows.join("; ")})` : ""}`,
    emptyRows.length === 0,
  );

  // --- 7. Host notes -------------------------------------------------------

  const unnoted = deck.slides.filter((slide) => !slide.note?.trim());
  check(
    `every slide carries a host note${unnoted.length ? ` (missing: ${unnoted.map((s) => s.id).join(", ")})` : ""}`,
    unnoted.length === 0,
  );
}

// --- 8. Feedback short codes ------------------------------------------------
//
// The feedback QR on every closing slide is derived, not authored, so nothing
// in a deck file can be reviewed to catch a bad code. These three assertions
// are the whole safety net.

console.log("\nfeedback codes");

const codes = allFeedbackCodes();
check(`every event has a feedback code (${codes.length} events)`, codes.length > 0);

// A collision means two events share one URL and their feedback lands in one
// pile. The fix is an entry in `FEEDBACK_CODE_OVERRIDES` for the NEWER event:
// moving an old code re-points every already-exported deck PDF and every code
// somebody has already scanned, and there is no way to reach those people.
const bySlugForCode = new Map<string, string[]>();
for (const { slug, code } of codes) {
  bySlugForCode.set(code, [...(bySlugForCode.get(code) ?? []), slug]);
}
const collisions = [...bySlugForCode.entries()]
  .filter(([, slugs]) => slugs.length > 1)
  .map(([code, slugs]) => `${code}: ${slugs.join(" + ")}`);
check(
  `feedback codes are unique${collisions.length ? ` (collides: ${collisions.join("; ")})` : ""}`,
  collisions.length === 0,
);

// The deck encodes the code; the redirect resolves it. If the round trip breaks
// the QR scans to a 404, which is invisible until someone in a room tries it.
const badRoundTrips = codes
  .filter(({ slug }) => eventSlugForFeedbackCode(feedbackCodeForSlug(slug)) !== slug)
  .map(({ slug, code }) => `${slug} -> ${code} -> ${eventSlugForFeedbackCode(code) ?? "(nothing)"}`);
check(
  `every code resolves back to its own event${badRoundTrips.length ? ` (bad: ${badRoundTrips.join("; ")})` : ""}`,
  badRoundTrips.length === 0,
);

const malformed = codes
  .filter(({ code }) => !FEEDBACK_CODE_PATTERN.test(code))
  .map(({ slug, code }) => `${slug}: "${code}"`);
check(
  `every code matches the route's pattern${malformed.length ? ` (bad: ${malformed.join("; ")})` : ""}`,
  malformed.length === 0,
);

// --- 6. parseTimedLine ------------------------------------------------------

console.log("\nparseTimedLine");

const range = parseTimedLine("5:30–5:40pm — Event opening");
check(
  "an en-dash range keeps the whole range as the time",
  range?.time === "5:30–5:40pm" && range?.label === "Event opening",
);

const single = parseTimedLine("8:00pm — Close of day one");
check(
  "a single time parses",
  single?.time === "8:00pm" && single?.label === "Close of day one",
);

check(
  "a line with no time returns null",
  parseTimedLine("Connect — who are you and what is your passion") === null,
);
check("an empty line returns null", parseTimedLine("   ") === null);
check(
  "a line with no separator returns null",
  parseTimedLine("8:00pm Close of day one") === null,
);

/*
 * The four shapes real She Sharp run sheets are written in.
 *
 * Only the first was covered before, and only the first parsed correctly — it
 * is the one the hackathon deck happens to use, which is why nothing caught
 * the other three. A spaced range used to split inside itself and leave the
 * end time glued to the front of the label, so a block opening at 5:00 was
 * projected as "5:30pm — Registration". It looked entirely plausible from the
 * back of the room.
 */
const spacedRange = parseTimedLine("5:00pm – 5:30pm — Registration, networking and food");
check(
  "a spaced en-dash range keeps both ends in the time",
  spacedRange?.time === "5:00pm – 5:30pm" &&
    spacedRange?.label === "Registration, networking and food",
);

const colonSeparated = parseTimedLine("5:30pm – 5:35pm: Welcome and kick off");
check(
  "a colon separates the time from the label",
  colonSeparated?.time === "5:30pm – 5:35pm" &&
    colonSeparated?.label === "Welcome and kick off",
);

const wordRange = parseTimedLine("6:00pm to 7:15pm — Workshop with Candice Murray");
check(
  "a 'to' range keeps both ends in the time",
  wordRange?.time === "6:00pm to 7:15pm" &&
    wordRange?.label === "Workshop with Candice Murray",
);

const prefixed = parseTimedLine("From 7:30pm — Closing remarks and networking");
check(
  "a 'From' prefix stays with the time",
  prefixed?.time === "From 7:30pm" &&
    prefixed?.label === "Closing remarks and networking",
);

const suffixed = parseTimedLine("7:30pm onwards: Networking and event close");
check(
  "an 'onwards' suffix stays with the time",
  suffixed?.time === "7:30pm onwards" &&
    suffixed?.label === "Networking and event close",
);

/*
 * Prose that merely mentions a time is not a run-sheet row. These used to
 * parse — the first as a row with a 22-word label — which is what made
 * "does this section parse as times?" an unreliable way to find the run sheet.
 */
check(
  "a prose line beginning with a word returns null",
  parseTimedLine(
    "Day 1 (Friday 7 August) — Welcome, health & safety briefing, and the build begins.",
  ) === null,
);

// --- 7. The evening template, over every shape of event ---------------------

/*
 * The template's whole safety claim is that removing an optional slide can
 * only shorten a run, never lengthen one — so no combination of missing event
 * data can produce a deck that breaks its shape rules.
 *
 * That is a claim about 2^n shapes, and hand-simulating one of them is how the
 * first design convinced itself it was fine while sitting exactly on three
 * limits. So it is enumerated instead: every combination of present and absent
 * blocks, plus every real event in the repo. Cheap, because the planner
 * reasons over `{type, tone}` descriptors and never builds a slide.
 */

console.log("\nevening template");

const openingSteps = buildOpeningSlides({
  eventTitle: "A Test Event",
  eventMeta: ["Thursday, 3 September 2026", "5:00–7:30pm", "A Venue"],
  karakia: DEFAULT_OPENING_KARAKIA,
}).map(toRhythmStep);

const closingSteps = buildClosingSlides({
  thanksLogos: [{ label: "Hosts", logos: [] }],
  upcoming: [],
  eventSlug: "aotearoa-ai-hackathon-festival-2026",
  karakia: DEFAULT_CLOSING_KARAKIA,
}).map(toRhythmStep);

/** The smallest `EventV3` the planner will look at, shaped by `flags`. */
function syntheticEvent(flags: {
  runSheet: boolean;
  groups: number;
  partners: boolean;
  explore: boolean;
  tables: boolean;
  readouts: boolean;
}): EventV3 {
  const speakers: Record<string, unknown> = {};
  const keys = ["keynote_speakers", "panel_speakers", "guest_speakers"];
  for (let i = 0; i < flags.groups; i += 1) {
    speakers[keys[i]] = {
      heading: `Group ${i + 1}`,
      speakers: [{ name: `Person ${i}`, title: "Engineer", company: "Org", bio: "", image: "", linkedin: "" }],
    };
  }

  const rows = [
    "5:00pm – 5:30pm — Registration and food",
    "5:30pm – 6:15pm — Panel discussion",
    ...(flags.tables ? ["6:15pm – 6:30pm — Roundtable discussions"] : ["6:15pm – 6:30pm — A quiet moment"]),
    ...(flags.readouts ? ["6:30pm – 6:45pm — Table readouts"] : ["6:30pm – 6:45pm — Another thing"]),
    "6:45pm – 7:30pm — Networking and close",
  ];

  return {
    id: 1,
    slug: "synthetic",
    title: "A Test Event",
    date: "September 3, 2026",
    coverImage: { url: "", alt: "" },
    detailPageUrl: "",
    shortDescription: "",
    attendees: null,
    checkedIn: 0,
    detailPageData: {
      url: "",
      title: "A Test Event",
      subtitle: "",
      date: "September 3, 2026",
      time: "5:00pm – 7:30pm NZST",
      location: { format: "in_person", venueName: "A Venue", address: "", city: "Auckland", country: "NZ" },
      fullDescription: [],
      speakers,
      organizers: [],
      sponsors: { main: flags.partners ? [{ name: "A Partner", logo: "/img/sponsors/myob.svg" }] : [], other: [] },
      specialSections: [
        ...(flags.runSheet ? [{ type: "agenda", title: "Event Format", content: rows }] : []),
        ...(flags.explore
          ? [{ type: "why-attend", title: "What You'll Explore", content: ["A short point", "Another short point"] }]
          : []),
      ],
      photos: [],
      galleryUrl: "",
      registrationUrl: "",
      images: [],
      category: "panel",
      status: "upcoming",
      isFeatured: false,
    },
  } as unknown as EventV3;
}

let matrixFailures = 0;
let matrixCount = 0;
for (const runSheet of [true, false]) {
  for (const groups of [0, 1, 2, 3]) {
    for (const partners of [true, false]) {
      for (const explore of [true, false]) {
        for (const tables of [true, false]) {
          for (const readouts of [true, false]) {
            const flags = { runSheet, groups, partners, explore, tables, readouts };
            matrixCount += 1;
            const plan = planEveningEvent({ event: syntheticEvent(flags) });
            const steps = [
              ...openingSteps,
              ...plan.slides.map((planned) => ({ type: planned.type, tone: planned.tone })),
              ...closingSteps,
            ];
            const violations = rhythmViolations(steps);
            if (violations.length > 0) {
              matrixFailures += 1;
              if (matrixFailures <= 3) {
                console.log(
                  `    ${JSON.stringify(flags)} → ${violations.map((v) => v.detail).join("; ")}`,
                );
              }
            }
          }
        }
      }
    }
  }
}
check(
  `every combination of present and absent blocks is rhythm-clean (${matrixCount} shapes)`,
  matrixFailures === 0,
);

/* And the shapes neither the matrix nor anyone else imagined: the real data. */
let corpusFailures = 0;
for (const raw of customEventsV3 as { slug: string }[]) {
  const event = loadEventForDeck(raw.slug);
  const plan = planEveningEvent({ event });
  const steps = [
    ...buildOpeningSlides({
      eventTitle: deckTitleFrom(event),
      eventMeta: deckMetaFrom(event),
      karakia: DEFAULT_OPENING_KARAKIA,
    }).map(toRhythmStep),
    ...plan.slides.map((planned) => ({ type: planned.type, tone: planned.tone })),
    ...closingSteps,
  ];
  const violations = rhythmViolations(steps);
  if (violations.length > 0) {
    corpusFailures += 1;
    console.log(`    ${raw.slug}: ${violations.map((v) => v.detail).join("; ")}`);
  }
}
check(
  `every event in events-custom.json plans a rhythm-clean deck (${(customEventsV3 as unknown[]).length} events)`,
  corpusFailures === 0,
);

/* Titles are the fact most often projected wrong, because a bad cut still
   reads as a title. "No Pain, All Gain – Getting Fit for AI" used to become
   "No Pain". */
const overlongTitles = (customEventsV3 as { slug: string }[])
  .map((raw) => ({ slug: raw.slug, title: deckTitleFrom(loadEventForDeck(raw.slug)) }))
  .filter((entry) => entry.title.trim().split(/\s+/).length > COPY_LIMITS.titleWords);
check(
  "every event derives a title inside the slide limit",
  overlongTitles.length === 0,
);
check(
  "a comma is never treated as a title separator",
  deckTitleFrom(loadEventForDeck("event-lesmills-03-september-2026")) === "No Pain, All Gain",
);

/* The run-sheet detector must reject a section that only claims to be one. */
check(
  "a list of learning outcomes typed 'agenda' is not read as a run sheet",
  runSheetFrom(loadEventForDeck("making-linkedin-work-for-you-with-stuart-little")).items.length === 0,
);
check(
  "the Les Mills run sheet is found by its content, not its title",
  runSheetFrom(loadEventForDeck("event-lesmills-03-september-2026")).items.length === 5,
);

/*
 * The countdown clock has to come from the table-discussion row, not from the
 * first row that happens to contain the word "discussion". A loose pattern
 * matched "Kickoff and panel discussion" at 5:30 and put a 45-minute clock on
 * the wall over a 15-minute exercise — and a wrong clock is obeyed, because
 * the clock is the thing a room actually watches.
 */
const lesMillsSheet = runSheetFrom(loadEventForDeck("event-lesmills-03-september-2026"));
const tableRow = findRowByPatterns(lesMillsSheet, [
  /roundtable|round table|breakout|break-out/i,
  /table discussion|group activity|group exercise|interactive/i,
  /workshop|activity/i,
]);
check(
  "the table-discussion clock comes from the roundtable row, not the panel",
  tableRow?.time === "6:15pm – 6:30pm" && minutesOf(tableRow.time) === 15,
);
check(
  "the countdown length is derived, not a default",
  discussionMinutesFrom(loadEventForDeck("event-lesmills-03-september-2026")) === 15,
);

/*
 * The countdown must be read from the event data on every build, not frozen
 * into the deck when it was generated. `content-checklist.md` tells organisers
 * that correcting the schedule corrects the clock, and a documented promise
 * that the code does not keep is worse than no promise: nobody re-checks it.
 */
const generatedDecks = readdirSync(join(process.cwd(), "lib", "deck", "decks"))
  .filter((name) => name.endsWith(".ts"))
  .map((name) => ({
    name,
    source: readFileSync(join(process.cwd(), "lib", "deck", "decks", name), "utf8"),
  }))
  .filter(({ source }) => source.includes("discussionMinutesFrom"));

check(
  `no deck freezes its countdown as a literal (${generatedDecks.length} using the template)`,
  generatedDecks.every(({ source }) => !/^\s*minutes:\s*\d+\s*,/m.test(source)),
);

/* Every deck file under decks/ must be registered, or `/present/<slug>` 404s
   with nothing to show for it. This was a documented failure mode precisely
   because registration was a manual edit that got forgotten. */
const deckFiles = readdirSync(join(process.cwd(), "lib", "deck", "decks"))
  .filter((name) => name.endsWith(".ts"))
  .map((name) => name.replace(/\.ts$/, ""))
  .sort();
check(
  `every deck file is registered (${deckFiles.length} files)`,
  JSON.stringify(deckFiles) === JSON.stringify([...getDeckSlugs()].sort()),
);

console.log(
  failures === 0
    ? "\nAll deck checks passed."
    : `\n${failures} deck check(s) failed.`,
);
process.exit(failures === 0 ? 0 : 1);
