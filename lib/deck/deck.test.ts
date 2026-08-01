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
import { existsSync } from "node:fs";
import { join } from "node:path";

import { getAllDecks } from "./registry";
import { hasErrors, lintDeck } from "./lint";
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

console.log(
  failures === 0
    ? "\nAll deck checks passed."
    : `\n${failures} deck check(s) failed.`,
);
process.exit(failures === 0 ? 0 : 1);
