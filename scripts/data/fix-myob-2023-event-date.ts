/**
 * Corrects the published date of the 2023 MYOB "Kickstart Your Career in Tech"
 * event: 12 April 2023 → 28 April 2023.
 *
 * The record contradicted itself. Its top-level `date` said "April 12, 2023"
 * while its own `detailPageData.dateTime` said "Fri, 28 Apr 2023, 5pm - 7:30pm
 * NZST" — and 12 April 2023 was a Wednesday, 28 April a Friday, so the weekday
 * in that string only fits the later date. A scrape artefact: the listing and
 * the detail page disagreed, and the scraper took the listing.
 *
 * Three independent sources say 28 April:
 *
 *   1. The record's own `detailPageData.dateTime`, weekday and all.
 *   2. The Humanitix Event summary — event `UTJ4TDIR`, 28/04/2023, at MYOB.
 *   3. Decisive: ticket sales ran from 24 March to 28 April 2023, with the
 *      final order placed on the event day itself. Orders cannot continue for
 *      sixteen days after an event has happened.
 *
 * The registration count agrees exactly at 86 either way, which is what
 * confirmed the two records are the same event rather than two.
 *
 * `shesharp_events_v3.json` does not round-trip through `JSON.stringify`, so
 * this is a text edit — see `scripts/data/json-format.ts` for why. The needle is
 * asserted unique before anything is written.
 *
 * Run: npx tsx scripts/data/fix-myob-2023-event-date.ts [--apply]
 */
import { readFileSync, writeFileSync } from "node:fs";

const FILE = "lib/data/json/shesharp_events_v3.json";
const SLUG = "2023-kickstart-your-career-in-tech-with-myob";
const NEEDLE = '"date": "April 12, 2023"';
const REPLACEMENT = '"date": "April 28, 2023"';

function main() {
  const apply = process.argv.slice(2).includes("--apply");
  const raw = readFileSync(FILE, "utf8");

  const events = (JSON.parse(raw) as { events: { slug: string; date: string }[] })
    .events;
  const target = events.find((event) => event.slug === SLUG);
  if (!target) throw new Error(`${FILE}: no event with slug ${SLUG}`);

  if (target.date === "April 28, 2023") {
    console.log(`  already applied — ${SLUG} is dated ${target.date}`);
    return;
  }

  // The date string belongs to exactly one event; anything else means the file
  // has changed underneath this script and it must not guess.
  const occurrences = raw.split(NEEDLE).length - 1;
  if (occurrences !== 1) {
    throw new Error(
      `${FILE}: expected exactly one ${NEEDLE}, found ${occurrences} — refusing to write`
    );
  }

  console.log(`  ${apply ? "applying" : "would apply"}  ${SLUG}`);
  console.log(`       date: "${target.date}" -> "April 28, 2023"`);
  console.log(
    `       source: Humanitix Event summary (event UTJ4TDIR, 28/04/2023), corroborated by`
  );
  console.log(
    `               this record's own detailPageData.dateTime ("Fri, 28 Apr 2023") and by`
  );
  console.log(
    `               ticket sales running 24 Mar - 28 Apr 2023, the last order on the day.`
  );

  if (!apply) {
    console.log("\n=== Dry run report ===");
    console.log("Nothing was written.");
    return;
  }

  writeFileSync(FILE, raw.replace(NEEDLE, REPLACEMENT), "utf8");
  console.log("\n1 record changed.");
}

main();
