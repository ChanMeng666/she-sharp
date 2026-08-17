/**
 * Lands the Humanitix registration and check-in figures on the site's own
 * event records.
 *
 * Three modes, each a different kind of act and each opt-in separately:
 *   (default)       fill a figure the site never recorded
 *   --corrections   overwrite a figure the site publishes and the export refutes
 *   --unscanned     turn a placeholder `checkedIn: 0` into null on events that
 *                   ran no check-in at all
 *
 * The site publishes `attendees` (registrations) on every event card and event
 * page. Six spot-checked events match the Humanitix export to the digit, which
 * is what establishes the export as the authoritative source for both fields
 * rather than merely a second opinion. Against that source the site carries
 * three missing figures and seven wrong ones.
 *
 * The first two modes decide nothing. Every change is read out of
 * `lib/data/json/humanitix/crosswalk.json`, where a human wrote down, row by
 * row, what differs and why it should change — so reviewing them means reviewing
 * that file, and re-running after a new export cannot invent a correction nobody
 * signed off. `--unscanned` is the one rule expressed here rather than there,
 * because it is a single sentence applied uniformly and the alternative was
 * nineteen copies of the same authored note; its reasoning is on
 * `planUnscanned` below.
 *
 * Two rules the numbers depend on:
 *
 *   1. A series is a SUM. The site models the two 2020 STORYTELLERS series as
 *      one record each; 220 + 9 + 40 = 269 and 30 + 7 = 37 are exactly what it
 *      already publishes. Those rows are correct and are left alone.
 *   2. `checkedIn` becomes NULL, never 0, where no check-in was run. 26 of the
 *      62 instances never scanned anybody, and a 0 there reads as "nobody came"
 *      to anything that later renders it.
 *
 * Dry run by default: this is the step that changes what the public site says.
 *
 * Usage:
 *   npx tsx scripts/data/apply-humanitix-attendance.ts                        # dry run, gaps only
 *   npx tsx scripts/data/apply-humanitix-attendance.ts --apply
 *   npx tsx scripts/data/apply-humanitix-attendance.ts --apply --corrections
 *   npx tsx scripts/data/apply-humanitix-attendance.ts --apply --unscanned
 */
import { readFileSync, writeFileSync } from "node:fs";

import { getAllEvents } from "../../lib/data/events";
import {
  getHumanitixFiguresForSlug,
  getHumanitixInstancesForSlug,
  humanitixCrosswalk,
} from "../../lib/data/humanitix";
import type { EventV3 } from "../../types/event";
import { readEventJson, writeEventJson } from "./json-format";

const CUSTOM = "lib/data/json/events-custom.json";
const V3 = "lib/data/json/shesharp_events_v3.json";

interface Change {
  siteId: number;
  siteSlug: string;
  siteFile: "events-custom" | "events-v3";
  kind: "gap" | "correction" | "unscanned";
  attendees: { from: number | null; to: number };
  checkedIn: { from: number | null; to: number | null };
  source: string;
}

/**
 * Builds the change list from the crosswalk.
 *
 * `gap` rows fill a null. `disagrees` rows overwrite a published figure, which
 * is a different kind of act and needs `--corrections`. `held` rows are
 * differences somebody looked at and decided not to act on here — the 2023 MYOB
 * event's date problem is one — and are never touched.
 */
function planChanges(): Change[] {
  const changes: Change[] = [];

  for (const link of humanitixCrosswalk.links) {
    if (link.status !== "gap" && link.status !== "disagrees") continue;

    const figures = getHumanitixFiguresForSlug(link.siteSlug);
    if (!figures) {
      throw new Error(
        `${link.siteSlug} has no Humanitix instance — the crosswalk and the archive disagree`
      );
    }

    changes.push({
      siteId: link.siteId,
      siteSlug: link.siteSlug,
      siteFile: link.siteFile,
      kind: link.status === "gap" ? "gap" : "correction",
      attendees: { from: link.figures.site.attendees, to: figures.registered },
      checkedIn: { from: link.figures.site.checkedIn, to: figures.checkedIn },
      source: `lib/data/json/humanitix/events.json, instance ${link.humanitixKey}. ${link.note}`,
    });
  }

  return changes.sort((a, b) => a.siteId - b.siteId);
}

/**
 * Turns the placeholder `checkedIn: 0` on events that ran no check-in into null.
 *
 * Nineteen records from 2020 to 2023 publish a check-in count of 0 for events
 * that demonstrably happened — they have speaker line-ups and photo galleries.
 * Humanitix scanned nobody at any of them, so the 0 does not mean "nobody came",
 * it means "we did not scan". The distinction is not academic: it is exactly how
 * the May 2026 HER WAKA cohort's 0 became a "suspect zero" that
 * `report/data/report-data.typ` had to flag by hand and label THE DANGEROUS ONE.
 * Leaving nineteen more of them in place leaves nineteen more of that waiting to
 * happen.
 *
 * Unlike the crosswalk rows this needs no per-event judgement: the rule is one
 * sentence, applies uniformly, and is read straight out of the archive. That is
 * why it is a rule here rather than nineteen copies of the same authored note.
 * Records with no Humanitix data at all are left alone — their 0 is unexamined,
 * not disproved.
 */
function planUnscanned(): Change[] {
  const changes: Change[] = [];

  for (const event of getAllEvents()) {
    if (event.checkedIn !== 0) continue;

    const figures = getHumanitixFiguresForSlug(event.slug);
    if (!figures || figures.checkedIn !== null) continue;

    const instances = getHumanitixInstancesForSlug(event.slug);
    changes.push({
      siteId: event.id,
      siteSlug: event.slug,
      siteFile: event.id <= 84 ? "events-v3" : "events-custom",
      kind: "unscanned",
      attendees: {
        from: event.attendees,
        to: event.attendees ?? figures.registered,
      },
      checkedIn: { from: 0, to: null },
      source:
        `Humanitix scanned 0 of ${figures.registered} registrations across ` +
        `${instances.length === 1 ? "this instance" : `${instances.length} sessions`}, ` +
        `so no check-in was run. 0 means "not scanned", not "nobody came" — see ` +
        `checkInDataPresent in lib/data/json/humanitix/events.json.`,
    });
  }

  return changes.sort((a, b) => a.siteId - b.siteId);
}

/** `events-custom.json` round-trips, so it can be parsed, edited and written. */
function applyToCustom(changes: Change[], apply: boolean): number {
  const targets = changes.filter((change) => change.siteFile === "events-custom");
  if (targets.length === 0) return 0;

  const data = readEventJson<{ template: unknown; events: EventV3[] }>(CUSTOM);
  let applied = 0;

  for (const change of targets) {
    const event = data.events.find((candidate) => candidate.id === change.siteId);
    if (!event) throw new Error(`${CUSTOM}: no event with id ${change.siteId}`);

    if (
      event.attendees === change.attendees.to &&
      event.checkedIn === change.checkedIn.to
    ) {
      console.log(`  already applied  ${change.siteSlug}`);
      continue;
    }

    event.attendees = change.attendees.to;
    event.checkedIn = change.checkedIn.to;
    applied++;
    console.log(
      `  ${apply ? "applied" : "would apply"}  id ${change.siteId} ${change.siteSlug}` +
        `  ${change.attendees.from} -> ${change.attendees.to}` +
        `  /  ${change.checkedIn.from} -> ${change.checkedIn.to}`
    );
  }

  if (apply && applied > 0) writeEventJson(CUSTOM, data);
  return applied;
}

/**
 * `shesharp_events_v3.json` does NOT round-trip through `JSON.stringify` — a
 * handful of its empty arrays are spread over two lines while 258 are inline —
 * so writing it back would reformat thousands of untouched lines. It is edited
 * as text instead, using the Nth-occurrence pattern from
 * `fix-v3-registration-and-status.ts`, with the one-key-per-event assumption
 * asserted rather than assumed.
 */
function applyToV3(changes: Change[], apply: boolean): number {
  const targets = changes.filter((change) => change.siteFile === "events-v3");
  if (targets.length === 0) return 0;

  let raw = readFileSync(V3, "utf8");
  const events = (JSON.parse(raw) as { events: EventV3[] }).events;

  for (const key of ["attendees", "checkedIn"] as const) {
    const occurrences = raw.split(`"${key}":`).length - 1;
    if (occurrences !== events.length) {
      throw new Error(
        `${V3}: expected one "${key}" per event (${events.length}), found ${occurrences} — refusing to write`
      );
    }
  }

  let applied = 0;
  for (const change of targets) {
    const index = events.findIndex((event) => event.id === change.siteId);
    if (index === -1) throw new Error(`${V3}: no event with id ${change.siteId}`);
    const event = events[index];

    if (
      event.attendees === change.attendees.to &&
      event.checkedIn === change.checkedIn.to
    ) {
      console.log(`  already applied  ${change.siteSlug}`);
      continue;
    }

    // Replace the Nth occurrence of each key: the keys appear once per event in
    // array order, so the Nth belongs to the Nth event.
    raw = replaceNth(raw, `"attendees": `, index, String(change.attendees.to));
    raw = replaceNth(
      raw,
      `"checkedIn": `,
      index,
      change.checkedIn.to === null ? "null" : String(change.checkedIn.to)
    );
    applied++;
    console.log(
      `  ${apply ? "applied" : "would apply"}  id ${change.siteId} ${change.siteSlug}` +
        `  ${change.attendees.from} -> ${change.attendees.to}` +
        `  /  ${change.checkedIn.from} -> ${change.checkedIn.to}`
    );
  }

  if (apply && applied > 0) writeFileSync(V3, raw, "utf8");
  return applied;
}

/** Replaces the value after the `index`-th occurrence of `needle`. */
function replaceNth(text: string, needle: string, index: number, value: string): string {
  let cursor = -1;
  for (let seen = 0; seen <= index; seen++) {
    cursor = text.indexOf(needle, cursor + 1);
    if (cursor === -1) {
      throw new Error(`Ran out of "${needle}" occurrences at ${seen} — refusing to write`);
    }
  }
  const start = cursor + needle.length;
  const end = text.indexOf(",", start);
  const newline = text.indexOf("\n", start);
  const stop = end === -1 || (newline !== -1 && newline < end) ? newline : end;
  return text.slice(0, start) + value + text.slice(stop);
}

const LABELS: Record<Change["kind"], string> = {
  gap: "FILL",
  correction: "FIX ",
  unscanned: "NULL",
};

function main() {
  const argv = process.argv.slice(2);
  const apply = argv.includes("--apply");
  const corrections = argv.includes("--corrections");
  const unscanned = argv.includes("--unscanned");

  const crosswalkChanges = planChanges();
  const unscannedChanges = planUnscanned();

  const changes = [
    ...crosswalkChanges.filter(
      (change) => change.kind === "gap" || corrections
    ),
    ...(unscanned ? unscannedChanges : []),
  ].sort((a, b) => a.siteId - b.siteId);

  console.log(
    `Humanitix attendance: ${crosswalkChanges.filter((c) => c.kind === "gap").length} gap(s), ` +
      `${crosswalkChanges.filter((c) => c.kind === "correction").length} correction(s), ` +
      `${unscannedChanges.length} unscanned zero(s)`
  );
  if (!corrections) {
    console.log(
      "  corrections withheld — they overwrite published figures. Pass --corrections."
    );
  }
  if (!unscanned) {
    console.log(
      "  unscanned zeros withheld — they turn a published 0 into null. Pass --unscanned."
    );
  }
  console.log("");

  for (const change of changes) {
    console.log(`  ${LABELS[change.kind]} ${change.siteSlug}`);
    console.log(`       ${change.source}`);
  }
  console.log("");

  const applied = applyToCustom(changes, apply) + applyToV3(changes, apply);

  if (!apply) {
    console.log("\n=== Dry run report ===");
    console.log(`  ${applied} record(s) would change.`);
    console.log("Nothing was written.");
    return;
  }
  console.log(`\n${applied} record(s) changed.`);
}

main();
