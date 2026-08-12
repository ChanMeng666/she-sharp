/**
 * The style ledger — what every deck already looks like, and what is still free.
 *
 * Usage:
 *   npx tsx scripts/deck/style-ledger.ts
 *
 * The only report in the repository that looks at more than one deck at a time,
 * which is why it exists. Every other check asks "is this deck well made"; this
 * one asks "does this deck look like the one next to it", and nothing could
 * answer that until August 2026 — when the repository held two decks that each
 * passed every check and still read as the same deck to the person who
 * commissioned them.
 *
 * It never fails. `deck.test.ts` is the gate; this is the thing you read when
 * the gate goes red, or better, before you have written anything. Read it at
 * Step 3 of `/build-event-slides`, pick a free weave, and the gate never goes
 * red in the first place.
 */

import { ARCHIVE_WEAVES, ARCHIVE_WEAVE_NOTES } from "@/lib/deck/skins";
import {
  STYLE_AXES,
  deckFingerprint,
  eventDistance,
  houseDistance,
  lintDeckSet,
  unusedWeaves,
} from "@/lib/deck/style-library";
import { getAllDecks } from "@/lib/deck/registry";

const decks = getAllDecks();
const prints = decks.map(deckFingerprint);

function pad(text: string, width: number): string {
  return text.length >= width ? text : text + " ".repeat(width - text.length);
}

console.log("\nSTYLE LEDGER — every registered deck, on the five axes a look is made of\n");

for (const [axis, meaning] of Object.entries(STYLE_AXES)) {
  console.log(`  ${pad(axis, 10)} ${meaning}`);
}

const cols = ["houseGround", "surface", "geometry", "tempo", "hue"] as const;
const slugWidth = Math.max(4, ...prints.map((p) => p.slug.length));

console.log("");
console.log(
  `  ${pad("deck", slugWidth)}  ${cols.map((c) => pad(c, 14)).join("")}`,
);
console.log(`  ${"-".repeat(slugWidth)}  ${"-".repeat(cols.length * 14)}`);

for (const print of prints) {
  const cells = cols.map((c) => pad(String(print[c]), 14)).join("");
  console.log(`  ${pad(print.slug, slugWidth)}  ${cells}`);
}

/* Weaves, spelled out. The table above prints a key; an author choosing one
   needs to know what it looks like, and sending them to a different file to
   find out is how a step gets skipped. */
console.log("\nWEAVES\n");
for (const weave of ARCHIVE_WEAVES) {
  const takenBy = prints
    .filter((p) => p.houseGround === `archive:${weave}`)
    .map((p) => p.slug);
  const status = takenBy.length ? `taken — ${takenBy.join(", ")}` : "FREE";
  console.log(`  ${pad(weave, 15)} ${pad(status, 46)} ${ARCHIVE_WEAVE_NOTES[weave]}`);
}

const free = unusedWeaves(decks, ARCHIVE_WEAVES);
console.log(
  free.length
    ? `\n  Still unused: ${free.join(", ")}`
    : `\n  Every weave is in use. A new deck must differ on the accent hue instead,` +
        ` or `.concat("a fourth weave is due — see references/weaves.md."),
);

/* Pairwise, and split house from event for the reason recorded in
   `style-library.ts`: a single averaged distance passes the exact pair this
   whole exercise was about. */
if (prints.length > 1) {
  console.log("\nHOW ALIKE, PAIR BY PAIR\n");
  console.log(
    "  house = the organisational slides (weave, accent hue) — floor 1",
  );
  console.log(
    "  event = the event's own chapters (surface, geometry, tempo, hue) — floor 2\n",
  );

  for (let i = 0; i < prints.length; i += 1) {
    for (let j = i + 1; j < prints.length; j += 1) {
      const a = prints[i];
      const b = prints[j];
      const h = houseDistance(a, b);
      const e = eventDistance(a, b);
      const flag = h < 1 || e < 2 ? "  <-- TOO CLOSE" : "";
      console.log(`  house ${h}   event ${e}   ${a.slug} / ${b.slug}${flag}`);
    }
  }
}

const issues = lintDeckSet(decks);

if (issues.length) {
  console.log("\nWHAT TO FIX\n");
  for (const issue of issues) {
    console.log(`  ${issue.rule}`);
    console.log(`    ${issue.message}\n`);
  }
} else {
  console.log("\nNo two decks are too close to tell apart.\n");
}

/* Always zero. A report that can fail is a report people run with `|| true`. */
process.exit(0);
