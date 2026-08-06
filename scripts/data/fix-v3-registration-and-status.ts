/**
 * Repairs two scrape artefacts that affect every record in
 * `shesharp_events_v3.json` (findings A22 and A23).
 *
 * 1. `detailPageData.registrationUrl` is the charities-register link on all 84
 *    events — `register.charities.govt.nz/Charity/CC57025`, which is the
 *    footer link of the old Webflow site, not a ticket page. The real
 *    registration link was scraped separately into `humanitixUrl`. The event
 *    sidebar happens not to render a Register button on a past event, so this
 *    stayed invisible on the page while leaking everywhere else: it is the
 *    `offers.url` of every Event JSON-LD block (lib/seo/schema.ts), it is what
 *    the chatbot hands visitors (lib/chatbot/tools.ts), and it is what the
 *    newsletter builds buttons from (lib/newsletter/assemble.ts).
 *
 * 2. `detailPageData.status` is `"upcoming"` on all 84, including events from
 *    2014. Nothing on the site reads it — `lib/data/events.ts` decides
 *    upcoming vs past from the date — but it is a declared enum, it is
 *    validated by the Slack event bot, and leaving it wrong invites the next
 *    person to trust it.
 *
 * Why text edits rather than parse-and-write: this file does not round-trip
 * through `JSON.stringify` (a handful of its empty arrays are spread over two
 * lines while 258 are inline), so re-serialising it would reformat thousands
 * of untouched lines. Each key below occurs exactly once per event, in array
 * order, so the Nth occurrence belongs to the Nth event.
 *
 * Run: npx tsx scripts/data/fix-v3-registration-and-status.ts
 */
import { readFileSync, writeFileSync } from "node:fs";

const FILE = "lib/data/json/shesharp_events_v3.json";
const CHARITIES_URL = "https://register.charities.govt.nz/Charity/CC57025";

type EventRecord = {
  id: number;
  slug: string;
  date: string;
  detailPageData: { registrationUrl: string; humanitixUrl?: string };
};

const raw = readFileSync(FILE, "utf8");
const events = (JSON.parse(raw) as { events: EventRecord[] }).events;

/** Replaces the Nth occurrence of each needle with replacements[n]. */
function replaceInOrder(
  text: string,
  needle: (index: number) => string,
  replacement: (index: number) => string,
  expected: number
): string {
  let out = "";
  let cursor = 0;
  for (let i = 0; i < expected; i++) {
    const found = text.indexOf(needle(i), cursor);
    if (found === -1) {
      throw new Error(
        `Expected ${expected} occurrences but ran out at ${i} — refusing to write`
      );
    }
    out += text.slice(cursor, found) + replacement(i);
    cursor = found + needle(i).length;
  }
  return out + text.slice(cursor);
}

// --- 1. registrationUrl -----------------------------------------------------
const registrationLine = `"registrationUrl": "${CHARITIES_URL}"`;
const occurrences = raw.split(registrationLine).length - 1;
if (occurrences !== events.length) {
  throw new Error(
    `${occurrences} charities-register links for ${events.length} events — ` +
      `the one-per-event assumption no longer holds`
  );
}

let recovered = 0;
let cleared = 0;
let text = replaceInOrder(
  raw,
  () => registrationLine,
  (i) => {
    // Events before Humanitix (roughly pre-2020) have no ticket page at all.
    // An empty string is the honest value; a wrong link is not.
    const humanitix = events[i].detailPageData.humanitixUrl ?? "";
    if (humanitix) recovered++;
    else cleared++;
    return `"registrationUrl": ${JSON.stringify(humanitix)}`;
  },
  events.length
);

// --- 2. status --------------------------------------------------------------
// `completed` is the enum member for an event that has happened — see
// EVENT_STATUSES in types/event.ts. `past` is not one of them.
const statusLine = `"status": "upcoming"`;
const statusOccurrences = text.split(statusLine).length - 1;
if (statusOccurrences !== events.length) {
  throw new Error(
    `${statusOccurrences} upcoming statuses for ${events.length} events — ` +
      `the one-per-event assumption no longer holds`
  );
}

const today = new Date();
today.setHours(0, 0, 0, 0);
let stillUpcoming = 0;

text = replaceInOrder(
  text,
  () => statusLine,
  (i) => {
    const when = new Date(events[i].date);
    const isUpcoming = !Number.isNaN(when.getTime()) && when >= today;
    if (isUpcoming) stillUpcoming++;
    return `"status": "${isUpcoming ? "upcoming" : "completed"}"`;
  },
  events.length
);

writeFileSync(FILE, text, "utf8");

console.log(`  A22  ${recovered} registrationUrl restored from humanitixUrl`);
console.log(`  A22  ${cleared} cleared (no ticket page ever existed)`);
console.log(
  `  A23  ${events.length - stillUpcoming} status upcoming -> completed` +
    (stillUpcoming ? `, ${stillUpcoming} genuinely upcoming` : "")
);
console.log(`\nWrote ${FILE}`);
