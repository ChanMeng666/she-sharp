/**
 * Exports one Humanitix event's checkout opt-ins as the CSV the existing import
 * chain already reads.
 *
 * The Humanitix checkout carries a built-in, uneditable tick-box —
 * `organiserMailListOptIn`, whose wording is fixed: *"Keep me updated on the
 * latest news, events, and exclusive offers from the event host"*. It is a
 * per-event setting that defaults OFF, and it is the only place She Sharp
 * collects a consent record that is per person, timestamped, and made by the
 * person themselves — route 2 of `consent-rules.md`. Until now the only way to
 * get those ticks out was the console's **reports → orders → Export CSV**, by
 * hand, for the whole account. This reads one event, through the API, keeping
 * six fields.
 *
 * The chain it feeds, unchanged:
 *
 *   this CSV → normalize-recipients.ts (detect) → --map --for-import
 *            → tmp/emails/recipients-<key>.json → import-optin-subscribers.ts
 *
 * The column contract that makes that work is in `./optin-orders.ts`, and it is
 * locked by `./optin-orders.test.ts` in CI. This file is the plumbing: resolve
 * an event, refuse the cases where the export would be a lie, fetch, write,
 * and print the next command.
 *
 * ---------------------------------------------------------------------------
 * DRY RUN IS THE DEFAULT. `--write` WRITES.
 * ---------------------------------------------------------------------------
 *
 * The opposite of `fetch-api.ts`, which writes unless told not to, and the same
 * as `import-optin-subscribers.ts`, which is the point: **this file's output is
 * the head of the consent chain, and every writing step of that chain is
 * opt-in.** A dry run still makes the `/orders` calls and prints every count —
 * it withholds only the file, so the numbers can be checked before a file of
 * real addresses exists on disk.
 *
 * ---------------------------------------------------------------------------
 * NOTHING IS EVER WRITTEN OUTSIDE `tmp/`
 * ---------------------------------------------------------------------------
 *
 * Three reasons, and `--out-dir` is checked against all three before a single
 * request goes out:
 *
 *  1. **The file holds real names and addresses.** `.gitignore` covers `tmp/`
 *     and nothing else that would do. A file of attendee addresses sitting one
 *     `git add -A` away from a commit is the same class of accident as the
 *     three access codes that reached a committed JSON on 2026-06-11 and needed
 *     a git history rewrite plus a rotation. A leaked address cannot be
 *     un-leaked by a later edit.
 *  2. **`tmp/` is a contract**, not litter — `scripts/CLAUDE.md` says so. Those
 *     exact paths appear in skill instructions and script defaults.
 *  3. **`HUMANITIX_VAULT_DIR` is not an alternative.** A vault stores VERBATIM
 *     payloads, never mapped objects: a checksum over a projection proves only
 *     what the projection kept, which is how 86 months of Mailchimp growth
 *     history came to be stored as zeroes under a valid hash. This CSV is a
 *     six-column filtered projection. There is deliberately no `--to-vault`.
 *
 * The check realpaths the nearest existing ancestor first, so a symlinked or
 * junctioned `tmp/` cannot be used to walk out of the repository.
 *
 * ---------------------------------------------------------------------------
 * WHAT IT REFUSES, AND WHY EACH REFUSAL IS BEFORE THE FIRST REQUEST
 * ---------------------------------------------------------------------------
 *
 *  - **A `--slug` whose site record has no readable Humanitix URL.** The URL
 *    path is the only bridge to a 24-hex event id; neither `crosswalk.json` nor
 *    `events.json` carries one (see `./listing-slug.ts`).
 *  - **A listing cited by more than one site event.** The export is stamped
 *    with the listing's name and date, and that sentence IS the consent record
 *    — "they ticked this box, at this event, on this date". A shared citation
 *    means one of the two site events pasted the other's link, so the sentence
 *    would name the wrong event for somebody. `--event-id` is required to
 *    proceed, which forces the operator to have looked.
 *  - **A listing absent from `listEvents()`.** We cannot name the event, so the
 *    consent sentence cannot be composed at all.
 *  - **A historic event, without `--allow-historic`.** See below.
 *  - **Zero ticked rows.** A zero cannot distinguish "the switch was off" from
 *    "everybody declined", and writing an empty file lets the first reading be
 *    quietly assumed. See the refusal's own text.
 *
 * ---------------------------------------------------------------------------
 * `--since` IS OFFERED, DEFAULT OFF, AND NEVER LOAD-BEARING
 * ---------------------------------------------------------------------------
 *
 * **`since` filters on `updatedAt`, not `createdAt`** — established empirically
 * against the live account on 2026-09-01: an order created 2026-05-29 and
 * updated 2026-06-10 IS returned by `since=2026-06-04`, and the returned set
 * matched the `updatedAt` set (26) rather than the `createdAt` set (25). So it
 * cannot be read as "orders placed since", and an order edited after the window
 * opened appears while one placed inside it and never touched may not.
 *
 * It is off by default because an event is one or two pages: it buys almost
 * nothing and could silently truncate a consent record. When passed, the run
 * prints a PARTIAL VIEW banner, records it in the sidecar, and says in the
 * next-command block that the file is not the event's full opt-in list.
 *
 * Usage:
 *   npx tsx scripts/humanitix/export-optins.ts --slug <site-slug>
 *   npx tsx scripts/humanitix/export-optins.ts --event-id <24hex> --write
 *   npx tsx scripts/humanitix/export-optins.ts --humanitix-slug <listing-slug> --json
 *
 * Environment: `HUMANITIX_API_KEY` (required — local tooling only, and it must
 * not be set in Vercel).
 */
import "dotenv/config";

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { realpathSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";

import { TZDate } from "@date-fns/tz";

import { getAllEvents } from "../../lib/data/events";
import { listEvents, type HumanitixEvent } from "../../lib/humanitix/client";
import { hashEmail, loadSuppressionHashes } from "../email/suppression";
import { extractHumanitixSlug, HUMANITIX_HOST, indexListings } from "./listing-slug";
import { fetchOrders, OPTIN_EXPORT_FIELDS } from "./orders-api";
import { selectOptinOrders, toOptinCsv, type SelectResult } from "./optin-orders";
import { argValue, REPO_ROOT } from "./vault";

/** Every She Sharp event runs on the New Zealand calendar; see verify-live-events.ts. */
const NZ_TIME_ZONE = "Pacific/Auckland";

/** The only directory this script may write into. */
const TMP_ROOT = join(REPO_ROOT, "tmp");

/**
 * The first `organiserMailListOptIn === true` in four years, and the line
 * between a live opt-in and a historic one.
 *
 * Measured across 59 events and 4,204 complete orders on 2026-09-01: 238 ticks,
 * of which the first since 2022-05-30 is dated 2026-08-26. Everything before it
 * belongs to the 2020–2022 era, when the switch was on and the list it fed was
 * Mailchimp's.
 */
const LIVE_OPTIN_ERA_START = "2026-08-26";

const INDENT = "  ";

/** A usage or configuration problem — reported as one line, never a stack. */
class ExportError extends Error {}

const USAGE = `Exports one Humanitix event's checkout opt-ins as an import-ready CSV.

Usage:
  npx tsx scripts/humanitix/export-optins.ts (--slug <site-slug> | --event-id <24hex>
                                             | --humanitix-slug <listing-slug>) [options]

Selection (exactly one):
  --slug <s>            a She Sharp site event slug; its Humanitix URL is the join
  --event-id <24hex>    the API's own ObjectId, e.g. 6a422a2d01e463796c170142
  --humanitix-slug <s>  the listing slug from the events.humanitix.com URL

Options:
  --since <ISO8601>  only orders UPDATED since then (not created — see the header).
                     Prints a PARTIAL VIEW banner; the file is not the full list.
  --out-dir <path>   default tmp/humanitix. Anything outside tmp/ is refused.
  --write            write the CSV and its sidecar. Without it this is a dry run
                     that still makes the API calls and prints every count.
  --allow-historic   permit an event whose every tick predates ${LIVE_OPTIN_ERA_START}
  --json             machine-readable summary
  --help             this message

Prints counts and truncated hashes only. No address, name or access code ever
reaches stdout, a log or a scratch file.`;

interface Options {
  slug: string | null;
  eventId: string | null;
  humanitixSlug: string | null;
  since: string | null;
  outDir: string;
  write: boolean;
  allowHistoric: boolean;
  json: boolean;
}

/**
 * Parses argv, refusing the two id mistakes that look like typos and are not.
 *
 * @param argv - Arguments after the script name.
 * @returns The parsed options.
 * @throws {ExportError} On an unknown flag, a missing value, or no selection.
 */
function parseArgs(argv: string[]): Options {
  const known = new Set([
    "--slug", "--event-id", "--humanitix-slug", "--since", "--out-dir",
    "--write", "--allow-historic", "--json", "--help", "-h",
  ]);
  const valued = new Set(["--slug", "--event-id", "--humanitix-slug", "--since", "--out-dir"]);

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--") && !arg.startsWith("-")) {
      throw new ExportError(`Unexpected argument: ${arg}\n\n${USAGE}`);
    }
    if (!known.has(arg)) throw new ExportError(`Unknown flag: ${arg}\n\n${USAGE}`);
    if (valued.has(arg)) {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new ExportError(`${arg} requires a value.`);
      index += 1;
    }
  }

  const outDirArg = argValue(argv, "--out-dir");
  const options: Options = {
    slug: argValue(argv, "--slug") ?? null,
    eventId: argValue(argv, "--event-id") ?? null,
    humanitixSlug: argValue(argv, "--humanitix-slug") ?? null,
    since: argValue(argv, "--since") ?? null,
    outDir: resolve(outDirArg ?? join(TMP_ROOT, "humanitix")),
    write: argv.includes("--write"),
    allowHistoric: argv.includes("--allow-historic"),
    json: argv.includes("--json"),
  };

  const selectors = [options.slug, options.eventId, options.humanitixSlug].filter(Boolean);
  if (selectors.length !== 1) {
    throw new ExportError(
      `Give exactly one of --slug, --event-id or --humanitix-slug (got ${selectors.length}).` +
        `\n\n${USAGE}`
    );
  }

  if (options.since && Number.isNaN(Date.parse(options.since))) {
    throw new ExportError(
      `--since "${options.since}" is not an ISO 8601 instant, e.g. 2026-08-26T00:00:00Z.`
    );
  }

  return options;
}

/**
 * Refuses an `--out-dir` that is not inside `tmp/`.
 *
 * The nearest EXISTING ancestor is realpathed before the comparison, because
 * `tmp/` may be a symlink or a Windows junction — comparing the un-resolved
 * strings would let `--out-dir tmp/../../elsewhere` through on a checkout where
 * `tmp` resolves somewhere else entirely.
 *
 * @param outDir - The already-resolved candidate directory.
 * @throws {ExportError} When it is anywhere but `tmp/` or below.
 */
function assertInsideTmp(outDir: string): void {
  // Resolve the deepest ancestor that exists, then re-attach the part that does
  // not exist yet. `realpathSync` throws on a missing path, and the common case
  // is a tmp/humanitix/ nobody has created — so resolving only the existing
  // prefix is what lets the check run before the directory does.
  const realOf = (path: string): string => {
    const missing: string[] = [];
    let current = path;
    for (;;) {
      if (existsSync(current)) return join(realpathSync(current), ...missing.reverse());
      const parent = dirname(current);
      if (parent === current) return path;
      missing.push(current.slice(parent.length + 1));
      current = parent;
    }
  };

  const realOut = realOf(outDir);
  const realTmp = realOf(TMP_ROOT);

  const inside = (candidate: string, root: string) =>
    candidate === root || candidate.startsWith(root + sep);

  if (inside(realOut, realTmp)) return;

  throw new ExportError(
    `--out-dir must be inside ${TMP_ROOT}. Refused: ${outDir}\n` +
      "\n" +
      "  1. This file holds real names and email addresses. .gitignore covers tmp/ and\n" +
      "     nothing else that would do, and a file of attendee addresses one `git add -A`\n" +
      "     from a commit is the same class of accident as the three access codes that\n" +
      "     reached a committed JSON on 2026-06-11 and needed a history rewrite plus a\n" +
      "     rotation. A leaked address cannot be un-leaked by a later edit.\n" +
      "  2. tmp/ is a contract, not litter — scripts/CLAUDE.md. Skill instructions and\n" +
      "     script defaults name those exact paths.\n" +
      "  3. HUMANITIX_VAULT_DIR is NOT an alternative. A vault stores verbatim payloads,\n" +
      "     never mapped objects — a checksum over a projection proves only what the\n" +
      "     projection kept. This CSV is a six-column filtered projection, so it does not\n" +
      "     belong in one. There is deliberately no --to-vault."
  );
}

// ---------------------------------------------------------------------------
// Event resolution
// ---------------------------------------------------------------------------

/** The listing this run is about, and how it was reached. */
interface Resolved {
  listing: HumanitixEvent;
  listingSlug: string;
  via: "event-id" | "slug" | "humanitix-slug";
}

/**
 * Turns whichever selector was given into one live listing.
 *
 * Always goes through `listEvents()` — the PII-free call — even for
 * `--event-id`, because the export is stamped with the listing's NAME and DATE
 * and that sentence is the consent record. An id alone cannot compose it.
 *
 * @param options - The parsed selection.
 * @returns The listing and its canonical slug.
 * @throws {ExportError} When the selector cannot be resolved, or resolves to a
 *   listing several site events cite.
 */
async function resolveListing(options: Options): Promise<Resolved> {
  // The 8-character uppercase code is a different identifier from the API's
  // ObjectId, and mistaking one for the other is the trap named in
  // lib/humanitix/client.ts where HumanitixEvent is declared.
  if (options.eventId && /^[A-Z0-9]{8}$/.test(options.eventId)) {
    throw new ExportError(
      `"${options.eventId}" is an 8-character humanitixEventId from ` +
        "lib/data/json/humanitix/events.json, which came from the CSV export.\n" +
        "  The API wants its own 24-character lowercase hex ObjectId\n" +
        "  (e.g. 6a422a2d01e463796c170142). They are different identifiers and nothing\n" +
        "  in this repository maps between them — the Humanitix URL path is the only\n" +
        "  bridge, so use --slug or --humanitix-slug instead."
    );
  }
  if (options.eventId && !/^[0-9a-f]{24}$/.test(options.eventId)) {
    throw new ExportError(
      `--event-id must be 24 lowercase hex characters (got "${options.eventId}").`
    );
  }

  const allEvents = getAllEvents();

  // Which listing slug are we after, and does the site cite it more than once?
  let wantedSlug: string | null = options.humanitixSlug?.trim().toLowerCase() ?? null;

  if (options.slug) {
    const event = allEvents.find((candidate) => candidate.slug === options.slug);
    if (!event) {
      throw new ExportError(
        `No site event has the slug "${options.slug}".\n` +
          "  Slugs come from the merged event list — check lib/data/json/events-custom.json,\n" +
          "  or run: npx tsx scripts/events/event-status.ts --all"
      );
    }
    const raw = event.detailPageData.registrationUrl ?? event.detailPageData.humanitixUrl ?? "";
    const extracted = extractHumanitixSlug(raw);
    if (extracted === null) {
      throw new ExportError(
        `Site event "${options.slug}" carries no Humanitix URL.\n` +
          "  The URL path is the only bridge to a 24-hex event id — neither crosswalk.json\n" +
          "  nor events.json holds one. Add the registrationUrl, or pass --event-id."
      );
    }
    if ("reason" in extracted) {
      throw new ExportError(
        `Site event "${options.slug}" has an unreadable Humanitix URL: ${extracted.reason}.\n` +
          "  Fix it in lib/data/json/events-custom.json, or pass --event-id."
      );
    }
    wantedSlug = extracted.slug;
  }

  // Every site event's citation, so a shared listing can be detected the way
  // verify-live-events.ts detects it — over the WHOLE corpus, never over the
  // selection. A duplicate you can only see by looking at the event you did not
  // ask about is exactly the duplicate that has been going unnoticed.
  const citedBy = new Map<string, string[]>();
  for (const event of allEvents) {
    const seen = new Set<string>();
    for (const url of [event.detailPageData.registrationUrl, event.detailPageData.humanitixUrl]) {
      const extracted = extractHumanitixSlug(url ?? "");
      if (!extracted || "reason" in extracted) continue;
      seen.add(extracted.slug);
    }
    for (const slug of seen) citedBy.set(slug, [...(citedBy.get(slug) ?? []), event.slug]);
  }

  const listings = await listEvents();
  const bySlug = indexListings(listings);

  let listing: HumanitixEvent | undefined;
  if (options.eventId) {
    listing = listings.find((candidate) => candidate.id === options.eventId);
    if (!listing) {
      throw new ExportError(
        `The account listing does not contain an event with id ${options.eventId}.\n` +
          `  ${listings.length} listings were returned. GET /v1/events has no archived\n` +
          '  filter, so read this as "absent from the listing", not "deleted".'
      );
    }
  } else {
    listing = bySlug.get(wantedSlug ?? "");
    if (!listing) {
      throw new ExportError(
        `No listing in the account carries the slug "${wantedSlug}".\n` +
          `  The account returned ${listings.length} listings and none matches, so the\n` +
          "  event cannot be NAMED — and the consent sentence this export is stamped with\n" +
          "  is \"they ticked this box, at this event, on this date\". It cannot be composed\n" +
          "  from an id alone, so nothing is fetched.\n" +
          "\n" +
          `  Investigate:  npx tsx scripts/humanitix/verify-live-events.ts --slug ${options.slug ?? "<site-slug>"}\n` +
          `  Or open:      https://${HUMANITIX_HOST}/${wantedSlug}`
      );
    }
  }

  const canonicalSlug = listing.slug.trim().toLowerCase();
  const sharers = citedBy.get(canonicalSlug) ?? citedBy.get(wantedSlug ?? "") ?? [];
  if (sharers.length > 1 && !options.eventId) {
    throw new ExportError(
      `Listing "${canonicalSlug}" is cited by ${sharers.length} site events: ${sharers.join(", ")}.\n` +
        "  In every known case an earlier event's link was pasted onto a later, different\n" +
        "  event. This export is stamped with the listing's name and date, and THAT\n" +
        "  SENTENCE IS THE CONSENT RECORD — so a shared citation means it would name the\n" +
        "  wrong event for somebody on the list.\n" +
        "\n" +
        "  Establish which event is which first:\n" +
        `    npx tsx scripts/humanitix/verify-live-events.ts --slug ${sharers[0]}\n` +
        `  then re-run with --event-id ${listing.id} to say you have looked.`
    );
  }

  return {
    listing,
    listingSlug: canonicalSlug,
    via: options.eventId ? "event-id" : options.slug ? "slug" : "humanitix-slug",
  };
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * The New Zealand calendar day of an instant, as `YYYY-MM-DD`.
 *
 * The same helper `verify-live-events.ts` uses, and for the same reason: an
 * Auckland evening is routinely the previous day in UTC, so the date printed in
 * the next command — which somebody would otherwise hand-type — must come from
 * a real timezone database rather than `toISOString()`.
 *
 * @param instant - An ISO 8601 instant from the API.
 * @returns The NZ calendar date, or null when the instant is unreadable.
 */
function nzCalendarDate(instant: string | null): string | null {
  if (!instant) return null;
  const ms = Date.parse(instant);
  if (Number.isNaN(ms)) return null;
  const nz = new TZDate(ms, NZ_TIME_ZONE);
  return `${nz.getFullYear()}-${pad(nz.getMonth() + 1)}-${pad(nz.getDate())}`;
}

/** Today's NZ calendar date, for the filename. */
function todayNz(): string {
  return nzCalendarDate(new Date().toISOString()) ?? "unknown-date";
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(argv: string[]): Promise<number> {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(USAGE);
    return 0;
  }

  const options = parseArgs(argv);

  // Before anything else, and before any request: an --out-dir outside tmp/ is
  // a refusal, not a warning, and finding out after the fetch would mean the
  // addresses are already in memory with nowhere sanctioned to go.
  assertInsideTmp(options.outDir);

  if (!process.env.HUMANITIX_API_KEY?.trim()) {
    throw new ExportError(
      "HUMANITIX_API_KEY is not set — put it in .env (local tooling only, never in Vercel)."
    );
  }

  const { listing, listingSlug, via } = await resolveListing(options);
  const eventDateNz = nzCalendarDate(listing.startDate);

  const pull = await fetchOrders(listing.id, {
    keep: OPTIN_EXPORT_FIELDS,
    ...(options.since ? { since: options.since } : {}),
  });
  const selection = selectOptinOrders(pull.rows, hashEmail);

  // --- the historic refusal ------------------------------------------------
  //
  // DESIGN NOTE: the plan for this script said to refuse when the event's FIRST
  // ORDER predates 2026-08-26. That does not survive contact with the data: the
  // Les Mills event this tool was built for took its first order on
  // 2026-08-04, so that rule would refuse the one event with live opt-ins. The
  // test that matches the stated intent — do not backfill the 2020–2022 era —
  // is whether every tick IN THIS EXPORT predates the era boundary. An event
  // with no ticks at all never reaches here; the zero-row refusal fires first.
  const latestTick = selection.rows.at(-1)?.["Order completed"] ?? null;
  const earliestTick = selection.rows[0]?.["Order completed"] ?? null;
  const historic = latestTick !== null && latestTick < LIVE_OPTIN_ERA_START;

  // The committed register is a plain file read — no database, no network — so
  // the run can state the ACTUAL yield of this export rather than leaving the
  // operator to discover it two commands later. An address on the register can
  // never be imported: import-optin-subscribers.ts consults both registers.
  const register = loadSuppressionHashes();
  const suppressed = selection.hashes.filter((hash) => register.has(hash.toLowerCase())).length;

  const report = buildReport({
    options, listing, listingSlug, via, eventDateNz, pull, selection,
    earliestTick, latestTick, historic, suppressed,
  });

  if (!options.json) for (const line of report.lines) console.log(line);

  // --- zero rows -----------------------------------------------------------
  if (selection.rows.length === 0) {
    const refusal = [
      "",
      "  REFUSED — nothing to export: 0 complete orders carry a tick.",
      "",
      "  A zero cannot tell these two apart, and they are not the same fact:",
      "    (a) the checkout opt-in switch was never turned on for this event, so",
      "        nobody was ever asked the question; or",
      "    (b) the switch was on and every buyer declined.",
      "",
      "  `organiserMailListOptIn: false` is written in BOTH cases, and Humanitix",
      "  exposes no per-event record of the setting. This is the same ambiguity",
      '  behind the 3,921 `No` cells in the orders export — see the "The ticket',
      '  page" section of docs/development/EVENT_LIFECYCLE_SOP.md, which says in',
      '  as many words: do not quote that column as "3,921 people declined".',
      "",
      "  No file was written. An empty CSV would let reading (a) be assumed by",
      "  anyone who opened it later.",
      "",
      "  Which reading it is:",
      `    npx tsx scripts/humanitix/check-optin-switch.ts --event-id ${listing.id}`,
      "",
    ];
    if (options.json) {
      console.log(JSON.stringify({ ...report.data, refused: "zero-rows" }, null, 2));
    } else {
      for (const line of refusal) console.log(line);
    }
    return 1;
  }

  // --- historic ------------------------------------------------------------
  if (historic && !options.allowHistoric) {
    const refusal = [
      "",
      `  REFUSED — every tick in this export predates ${LIVE_OPTIN_ERA_START}.`,
      `  Latest tick: ${latestTick}`,
      "",
      "  Backfilling the 2020-2022 opt-ins buys almost nothing and asks a question",
      "  this tooling cannot answer:",
      "",
      "    * Of the 97 historical opt-ins not already on the list, 89 are on the",
      "      committed suppression register. An import can never resurrect those —",
      "      import-optin-subscribers.ts consults both registers — so the real",
      "      yield is 8 people, and all 8 are from 2026 anyway.",
      "    * It raises \"they ticked in 2021 and did not tick in 2026 — which answer",
      "      stands?\". Nothing here answers that, and a consent record that guesses",
      "      is worse than one that is missing.",
      "",
      "  Pass --allow-historic if you have decided the answer. Nothing was written.",
      "",
    ];
    if (options.json) {
      console.log(JSON.stringify({ ...report.data, refused: "historic" }, null, 2));
    } else {
      for (const line of refusal) console.log(line);
    }
    return 1;
  }

  // --- write ---------------------------------------------------------------
  const csv = toOptinCsv(selection.rows);
  const csvSha256 = createHash("sha256").update(csv, "utf8").digest("hex");
  const csvName = `optins-${listingSlug}-${todayNz()}.csv`;
  const csvPath = join(options.outDir, csvName);
  const metaPath = `${csvPath.slice(0, -4)}.meta.json`;

  const nextCommand = buildNextCommand({
    csvPath, listing, eventDateNz, listingSlug,
    partial: options.since !== null,
    historic, suppressed, rows: selection.rows.length,
  });

  const meta = {
    generatedAt: new Date().toISOString(),
    eventId: listing.id,
    listingSlug,
    listingName: listing.name,
    eventDateNz,
    since: options.since,
    requests: pull.requests,
    counts: selection.counts,
    historic,
    suppressed,
    expectedNewSubscribers: selection.rows.length - suppressed,
    csvSha256,
    nextCommand,
  };

  if (options.write) {
    mkdirSync(options.outDir, { recursive: true });
    writeFileSync(csvPath, csv, "utf8");
    writeFileSync(metaPath, `${JSON.stringify(meta, null, 2)}\n`, "utf8");
  }

  if (options.json) {
    console.log(JSON.stringify({ ...report.data, written: options.write, meta }, null, 2));
    return 0;
  }

  console.log(`${INDENT}sha256(csv)           ${csvSha256}`);
  console.log("");
  if (options.write) {
    console.log(`  WROTE ${csvPath}`);
    console.log(`  WROTE ${metaPath}`);
  } else {
    console.log("  DRY RUN — the API was called and nothing was written.");
    console.log(`  Re-run with --write to create ${csvName} and its .meta.json sidecar.`);
  }
  console.log("");
  for (const line of nextCommand.lines) console.log(line);
  console.log("");
  for (const line of LIMITS) console.log(`${INDENT}- ${line}`);
  console.log("");

  return 0;
}

/** The things a reader must not conclude from this export. Printed every run. */
const LIMITS = [
  'A `false` is written both when the buyer DECLINED and when the question was never ' +
    'asked — the switch is per-event and defaults off. Never read a non-tick as a refusal.',
  "This is the Humanitix checkout box only. It is not the website's double opt-in, and " +
    "these people never clicked a confirmation link of ours — confirmedAt stays null.",
  "Humanitix keeps a per-event UNSUBSCRIBER list in its console that no API and no export " +
    "reaches. import-optin-subscribers.ts --apply demands --event-unsubscribers-checked " +
    "for exactly this reason; only a person logged into the console can check it.",
  "Nothing here was written to lib/data/json/, to the vault, or to the database.",
];

interface ReportInput {
  options: Options;
  listing: HumanitixEvent;
  listingSlug: string;
  via: Resolved["via"];
  eventDateNz: string | null;
  pull: { requests: number; total: number | null; rows: unknown[] };
  selection: SelectResult;
  earliestTick: string | null;
  latestTick: string | null;
  historic: boolean;
  /** Rows whose address is already on the committed suppression register. */
  suppressed: number;
}

/**
 * Builds the human report and its machine-readable twin.
 *
 * Counts and truncated hashes only — never an address, a name or an access
 * code. The hashes are printed because a count alone cannot be cross-checked
 * against another run or another tool, and `hashEmail()` is the same digest the
 * suppression register and the importer key on.
 *
 * @param input - Everything the run established.
 * @returns Lines to print, and the same facts as data.
 */
function buildReport(input: ReportInput): { lines: string[]; data: Record<string, unknown> } {
  const { options, listing, listingSlug, eventDateNz, pull, selection } = input;
  const c = selection.counts;
  const lines: string[] = [""];

  lines.push("  Humanitix checkout opt-ins (consent-rules.md route 2)");
  lines.push("  ----------------------------------------------------");
  lines.push(`  Listing               ${listing.name}`);
  lines.push(`  Listing slug          ${listingSlug}`);
  lines.push(`  Event id              ${listing.id}`);
  lines.push(`  Event date (NZ)       ${eventDateNz ?? "unknown"}`);
  lines.push(`  Resolved via          ${input.via}`);
  lines.push(`  Requests              ${pull.requests} to /v1/events/{id}/orders`);
  lines.push(`  Fields kept           ${OPTIN_EXPORT_FIELDS.join(", ")}`);
  lines.push("");

  if (options.since) {
    lines.push(`  *** PARTIAL VIEW — --since ${options.since} ***`);
    lines.push("  That filters on updatedAt, NOT createdAt (established against the live");
    lines.push("  account 2026-09-01). An order edited after the window opened appears; one");
    lines.push("  placed inside it and never touched may not. This file is NOT this event's");
    lines.push("  full opt-in list and must not be treated as one.");
    lines.push("");
  }

  lines.push(`  Orders seen           ${c.ordersSeen}${pull.total !== null ? ` (envelope total ${pull.total})` : ""}`);
  lines.push(`    not complete        ${c.notComplete}`);
  lines.push(`    complete, no tick   ${c.noOptIn}`);
  lines.push(`  Complete + tick       ${c.optedIn}`);
  lines.push(`    no email address    ${c.noEmail}`);
  lines.push(`    no completedAt      ${c.noCompletedAt}`);
  lines.push(`  Rows in the CSV       ${selection.rows.length}`);
  lines.push(`    distinct addresses  ${c.distinctEmails}`);
  lines.push(`    duplicate orders    ${c.duplicateOrders}  (not deduped here — the importer keeps the earliest)`);
  lines.push(
    `  Refunded among them   ${c.refundedAmongOptedIn}  (written with their financialStatus; ` +
      "normalize-recipients.ts will exclude them and SAY SO)"
  );
  if (input.earliestTick) lines.push(`  Earliest tick         ${input.earliestTick}`);
  if (input.latestTick) lines.push(`  Latest tick           ${input.latestTick}`);
  lines.push("");

  // The expected yield, stated BEFORE the import is run rather than discovered
  // after it. An address on the committed register can never be imported —
  // import-optin-subscribers.ts consults it and the runtime email_optouts table
  // — so a row count is not a yield, and the difference is the whole reason
  // backfilling historic ticks is usually not worth doing.
  const expected = selection.rows.length - input.suppressed;
  lines.push(`  On the suppression register  ${input.suppressed} of ${selection.rows.length} row(s) — these can NEVER be imported`);
  lines.push(`  EXPECTED NEW SUBSCRIBERS     at most ${expected}, before the runtime opt-out table`);
  lines.push("    and Humanitix's per-event unsubscriber list narrow it further.");
  lines.push("");

  if (input.historic) {
    lines.push(`  *** HISTORIC EXPORT — every tick predates ${LIVE_OPTIN_ERA_START} ***`);
    lines.push("  These are 2020-2022 ticks. Across the whole account, of the 97 historical");
    lines.push("  opt-ins not already on the list, 89 are on the committed suppression register");
    lines.push("  and only 8 are importable — and all 8 are from 2026. The line above is this");
    lines.push("  event's own share of that.");
    lines.push("  It also raises \"they ticked in 2021 and did not tick in 2026 — which answer");
    lines.push("  stands?\", which this tooling does not answer. You passed --allow-historic,");
    lines.push("  so you are asserting you have decided.");
    lines.push("");
  }

  if (selection.hashes.length > 0) {
    lines.push("  Rows (truncated sha256 of each address — no address is ever printed):");
    for (const hash of selection.hashes.slice(0, 12)) lines.push(`    ${hash.slice(0, 12)}…`);
    if (selection.hashes.length > 12) {
      lines.push(`    … and ${selection.hashes.length - 12} more`);
    }
    lines.push("");
  }

  return {
    lines,
    data: {
      generatedAt: new Date().toISOString(),
      eventId: listing.id,
      listingSlug,
      listingName: listing.name,
      eventDateNz,
      since: options.since,
      requests: pull.requests,
      counts: c,
      earliestTick: input.earliestTick,
      latestTick: input.latestTick,
      historic: input.historic,
      suppressed: input.suppressed,
      expectedNewSubscribers: expected,
      hashes: selection.hashes.map((hash) => hash.slice(0, 12)),
    },
  };
}

/**
 * Composes the exact next two commands, with the event name and date filled in.
 *
 * The date comes from `nzCalendarDate()` rather than being left to the reader,
 * because a hand-typed date for an Auckland evening event is a day out often
 * enough that the repo has a rule about it — and this one becomes the
 * `consentDate` on a row in the organisation's consent record.
 *
 * @returns The lines to print, and the two commands as strings for the sidecar.
 */
function buildNextCommand(input: {
  csvPath: string;
  listing: HumanitixEvent;
  eventDateNz: string | null;
  listingSlug: string;
  partial: boolean;
  historic: boolean;
  suppressed: number;
  rows: number;
}): { lines: string[]; normalize: string; import: string } {
  const key = input.listingSlug.slice(0, 40);
  const date = input.eventDateNz ?? "YYYY-MM-DD";
  const relative = input.csvPath.startsWith(REPO_ROOT + sep)
    ? input.csvPath.slice(REPO_ROOT.length + 1).split(sep).join("/")
    : input.csvPath;

  const normalize =
    `npx tsx scripts/email/normalize-recipients.ts "${relative}" --key ${key} \\\n` +
    `  --map "email=Email,firstName=First name,lastName=Last name,status=Order status,optIn=Marketing opt-in" \\\n` +
    `  --for-import --consent-source "Humanitix checkout opt-in" --consent-date ${date} --tier 0`;
  const importCmd =
    `npx tsx scripts/email/import-optin-subscribers.ts tmp/emails/recipients-${key}.json \\\n` +
    `  --event-name "${input.listing.name}" --event-date ${date}`;

  const lines = ["  Next:", "", normalize, "", importCmd, ""];
  lines.push(
    "  Both are dry runs until you add --apply to the second, which also demands",
    "  --event-unsubscribers-checked: Humanitix keeps a per-event unsubscriber list",
    "  that no API and no export reaches, and only a person logged into the console",
    "  can read it."
  );
  if (input.partial) {
    lines.push(
      "",
      "  WARNING: --since was used, so this CSV is a PARTIAL view of the event's",
      "  opt-ins. Do not run the import from it unless you meant to import a subset."
    );
  }
  // Repeated here as well as in the report because THIS is the block somebody
  // copies from. A yield stated forty lines up the scrollback is a yield nobody
  // reads before pasting the command.
  if (input.historic) {
    lines.push(
      "",
      `  WARNING: historic export. ${input.suppressed} of ${input.rows} row(s) are already on`,
      `  the suppression register and cannot be imported, so this yields at most`,
      `  ${input.rows - input.suppressed} new subscriber(s) — likely fewer. Across the account the`,
      "  equivalent figures are 89 of 97 suppressed, 8 importable."
    );
  }
  return { lines, normalize, import: importCmd };
}

main(process.argv.slice(2))
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    if (error instanceof ExportError) {
      console.error(`Error: ${error.message}`);
      process.exitCode = 1;
      return;
    }
    if (
      error instanceof Error &&
      (error.name === "HumanitixOrdersError" || error.name === "HumanitixApiError")
    ) {
      console.error(`Humanitix API error: ${error.message}`);
      process.exitCode = 1;
      return;
    }
    throw error;
  });
