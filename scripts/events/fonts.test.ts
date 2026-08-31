/**
 * The four poster faces exist where `poster-type.ts` expects them.
 *
 * This check exists because the failure it catches is invisible to every other
 * gate. `RESVG_OPTIONS` sets `loadSystemFonts: false` and hands resvg four
 * absolute paths; resvg does not raise on a path it cannot open, it renders in
 * whatever remains and a poster set entirely in the wrong face looks
 * deliberate. `assertFamiliesDistinct()` does catch it — but only inside
 * `build-event-poster.ts`, which CI never runs, so between a bad commit and the
 * next poster somebody actually builds there is nothing at all.
 *
 * The fonts lived under `report/fonts/` until 2026-09-01, when the two Typst
 * report projects moved to NZ-SheSharp/she-sharp-reports and the poster
 * generator was left importing a directory that no longer existed. `event-status`
 * and `poster-assets` both stayed green through that, because they import
 * `poster-type.ts` and the font files are only read at render time.
 *
 * Deliberately filesystem-only: no resvg, no sharp, no network. It rides the
 * verify-image-paths job like the other pure-data checks.
 */

import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FONT_DIR = path.join(HERE, "fonts");

/** The four faces `poster-type.ts` names, and the licences they ship under. */
const REQUIRED = [
  "BricolageGrotesque-VF.ttf",
  "InstrumentSans-VF.ttf",
  "InstrumentSans-Italic-VF.ttf",
  "Carattere-Regular.ttf",
];

const LICENCES = [
  "OFL-BricolageGrotesque.txt",
  "OFL-InstrumentSans.txt",
  "OFL-Carattere.txt",
];

let failures = 0;
function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    failures++;
    console.error(`not ok - ${name}`);
    console.error(`  ${(error as Error).message}`);
  }
}

check("the font directory exists", () => {
  assert.ok(
    existsSync(FONT_DIR),
    `${FONT_DIR} is missing. poster-type.ts resolves its fonts there.`,
  );
});

for (const file of REQUIRED) {
  check(`${file} is present and non-empty`, () => {
    const full = path.join(FONT_DIR, file);
    assert.ok(existsSync(full), `${full} is missing`);
    // A 0-byte or truncated TTF is the shape an interrupted copy leaves, and
    // resvg treats it exactly like an absent file: silently.
    assert.ok(
      statSync(full).size > 50_000,
      `${file} is ${statSync(full).size} bytes — too small to be a real variable font`,
    );
  });
}

for (const file of LICENCES) {
  check(`${file} travels with the font`, () => {
    assert.ok(
      existsSync(path.join(FONT_DIR, file)),
      `${file} is missing. These faces are OFL; the licence has to ship beside them.`,
    );
  });
}

// The paths in poster-type.ts are the thing under test, so read them rather
// than restating them — a rename there with no rename here would otherwise pass.
check("poster-type.ts still points at this directory", () => {
  const source = readFileSync(path.join(HERE, "poster-type.ts"), "utf8");
  assert.match(
    source,
    /path\.join\(ROOT, "scripts\/events\/fonts", file\)/,
    "poster-type.ts no longer resolves fonts from scripts/events/fonts — update this test with it.",
  );
  assert.ok(
    !source.includes("report/fonts"),
    "poster-type.ts still mentions report/fonts, which left the repo on 2026-09-01.",
  );
});

if (failures > 0) {
  console.error(`\n${failures} font check(s) failed.`);
  process.exit(1);
}
console.log(`\nAll ${REQUIRED.length + LICENCES.length + 2} font checks passed.`);
