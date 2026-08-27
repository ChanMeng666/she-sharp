/**
 * Pulls the Humanitix account's events, tags, orders, tickets and check-in
 * counts into the vault, verbatim.
 *
 * The 2026-08-17 CSV export is 18 files Humanitix *assembled* — one
 * account-wide attendee table, one orders table, a handful of aggregate
 * reports. This is the other reading: the raw rows the API returns, per event,
 * with every field Humanitix holds rather than the columns its report builder
 * chose. The two are independent snapshots of the same account, each
 * separately hashable, and neither supersedes the other.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS SCRIPT WRITES IS THE MOST SENSITIVE DATA THIS PROJECT TOUCHES.
 * ---------------------------------------------------------------------------
 *
 * `--include orders` and `--include tickets` write, per event, rows carrying:
 *
 *   * names, email addresses, mobile numbers and street addresses
 *   * dates of birth
 *   * the free-text answers to the dietary, accessibility and photo-consent
 *     questions — health information, in a file named after an event
 *   * `qrCodeData`, which is a working admission token
 *   * a **live `accessCode` on nearly every row**
 *
 * On 2026-06-11 three access codes reached a committed JSON file and had to be
 * rotated with a git history rewrite. A leaked code cannot be un-leaked by a
 * later edit. So three rules, and none of them is negotiable:
 *
 *  1. **`private/` only.** Everything lands under `private/humanitix/<exportId>/`,
 *     which `.gitignore` excludes as `/private/`. Nothing here ever writes to
 *     `lib/data/json/`, and nothing derived from `orders/` or `tickets/` may be
 *     summarised into it either — the committed archive is aggregates, and
 *     `lib/data/humanitix.test.ts` fails CI if an address or a code-shaped value
 *     reaches it.
 *  2. **No body in any message.** Errors name the status code and the event id,
 *     both of which are Humanitix's own identifiers rather than anybody's data.
 *     Progress lines print counts. Nothing prints a row.
 *  3. **The manifest says plainly what each file holds.** `orders/` and
 *     `tickets/` are recorded `piiClass: "access-secret"` — see
 *     `classifyApiFile()` in `./manifest.ts` for why that class rather than
 *     `person-sensitive`, and what the note has to spell out as a result.
 *
 * The one thing this script writes into the repository is a new append-only
 * `exports[]` entry in `lib/data/json/humanitix/manifest.json`, recording each
 * file's sha256, the endpoint it is the response to, and its PII class — so the
 * pull stays auditable on CI, where the data itself can never be.
 *
 * ---------------------------------------------------------------------------
 * WHY THE TRANSPORT IS HERE AND NOT IN lib/humanitix/client.ts
 * ---------------------------------------------------------------------------
 *
 * That client implements only the PII-free half of the API and its header says
 * why in as many words: "a function that does not exist cannot be imported from
 * `app/` by mistake — that absence is the safety mechanism". `/orders` and
 * `/tickets` must stay absent from it. This module lives under `scripts/`,
 * which nothing in `app/`, `lib/` or `components/` imports, so the capability
 * exists exactly where a person runs it by hand and nowhere a request handler
 * could reach — the same arrangement `scripts/humanitix/api-counts.ts` already
 * uses, and the transport below is the same minimal duplicate for the same
 * reason. **Do not move it into `lib/`, and do not re-export it.**
 *
 * Usage:
 *   npx tsx scripts/humanitix/fetch-api.ts --export 2026-08-27-api --dry-run
 *   npx tsx scripts/humanitix/fetch-api.ts --export 2026-08-27-api
 *   npx tsx scripts/humanitix/fetch-api.ts --export 2026-08-27-api --include orders,tickets,check-ins
 *
 * Environment: `HUMANITIX_API_KEY` (required — local tooling only, and it must
 * not be set in Vercel), `HUMANITIX_VAULT_DIR` (only to point at the private
 * archive repo).
 *
 * Ref: https://api.humanitix.com/v1/documentation/json (OpenAPI, read
 * 2026-08-27).
 */
import "dotenv/config";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { appendExportEntry, buildApiExportEntry } from "./manifest";
import { argValue, ensureVaultDir } from "./vault";

const HUMANITIX_BASE_URL = "https://api.humanitix.com";

/**
 * The export id, and why it is not the CSV export's id.
 *
 * `<YYYY-MM-DD>-api`, with the vault **flat** at `private/humanitix/<exportId>/`
 * and no `api/` folder nested inside the 2026-08-17 CSV directory. Three
 * reasons, all of which bite silently:
 *
 * 1. `resolveVaultDir()` maps one exportId to one directory, and
 *    `HUMANITIX_VAULT_DIR` overrides that whole directory. Nesting would make
 *    the override able to point at the CSVs or at the JSON, never both — so
 *    running against the private archive repo would half-work.
 * 2. `manifest.ts --append` and `appendExportEntry()` dedupe on `exportId`.
 *    Sharing an id with the CSV export would not merge the two, it would
 *    clobber the CSV entry, and with it the only record of 18 files nobody can
 *    re-download in that form.
 * 3. A Humanitix export is a reading at a moment. Two readings taken months
 *    apart are two snapshots, each independently hashable; a pull is not an
 *    addendum to the August download.
 */
const EXPORT_ID_PATTERN = /^\d{4}-\d{2}-\d{2}-api$/;

/** `pageSize` ceiling the API enforces. Paging is 1-based; `page` is required. */
const PAGE_SIZE = 100;

// --- Tiers ---------------------------------------------------------------

/**
 * The optional, per-event halves of the pull.
 *
 * Opt-in rather than default because each costs at least 59 requests and two of
 * the three materialise thousands of real people's records on disk. Somebody
 * should have to type the word.
 */
const TIERS = ["orders", "tickets", "check-ins"] as const;
type Tier = (typeof TIERS)[number];

/**
 * Parses `--include a,b,c` into a set of tiers.
 *
 * Unknown names throw rather than being ignored: a typo'd `--include ticket`
 * that silently pulled nothing would look exactly like a successful run that
 * found no tickets.
 *
 * @param raw - The flag's value, or undefined when it was not passed.
 * @returns The requested tiers, in the fixed order above.
 * @throws When a name is not a tier.
 */
function parseTiers(raw: string | undefined): Set<Tier> {
  if (!raw) return new Set();

  const requested = raw
    .split(",")
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean);

  const unknown = requested.filter((name) => !TIERS.includes(name as Tier));
  if (unknown.length > 0) {
    throw new Error(
      `Unknown --include value(s): ${unknown.join(", ")}\n` +
        `  Valid tiers: ${TIERS.join(", ")}`
    );
  }
  return new Set(TIERS.filter((tier) => requested.includes(tier)));
}

// --- Rate budget ---------------------------------------------------------

/**
 * Humanitix publishes 200 requests per minute; this targets 80% of it, matching
 * `lib/humanitix/client.ts` and `api-counts.ts`. A full three-tier pull is
 * ~250 requests, so the budget — not the network — sets the wall-clock time,
 * and the run takes a few minutes by design rather than by accident.
 */
const MIN_REQUEST_INTERVAL_MS = Math.ceil(60_000 / Math.floor(200 * 0.8));

/** Earliest instant (epoch ms) at which the next request may start. */
let nextRequestAt = 0;

/** Sleeps for a number of milliseconds. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Waits until this module's rate budget allows another request to start.
 *
 * The reservation runs to completion with no `await` in the middle, so two
 * concurrent callers on JavaScript's single thread cannot claim the same
 * instant.
 *
 * @returns A promise resolving when the caller may issue its request.
 */
function awaitRateBudget(): Promise<void> {
  const now = Date.now();
  const startAt = Math.max(now, nextRequestAt);
  nextRequestAt = startAt + MIN_REQUEST_INTERVAL_MS;
  const delay = startAt - now;
  return delay > 0 ? sleep(delay) : Promise.resolve();
}

// --- Retry ---------------------------------------------------------------

const MAX_ATTEMPTS = 5;
const BASE_BACKOFF_MS = 500;
const MAX_BACKOFF_MS = 20_000;

/**
 * Decides whether a failed response is worth retrying.
 *
 * 429 and 5xx only. No other 4xx is ever retried: a 401 retried five times is
 * five chances to trip a lockout on the account's only API key, and a 400 is
 * five identical rejections.
 *
 * @param status - HTTP status code.
 * @returns Whether to retry.
 */
function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

/**
 * Decides whether a thrown (non-HTTP) error is a transient network fault.
 *
 * Node's `fetch` reports these as a `TypeError` whose `cause` carries the errno.
 *
 * @param error - The thrown value.
 * @returns Whether to retry.
 */
function isRetryableNetworkError(error: unknown): boolean {
  const cause = error instanceof Error ? (error as { cause?: unknown }).cause : undefined;
  const code =
    cause && typeof cause === "object" && "code" in cause
      ? String((cause as { code?: unknown }).code ?? "")
      : "";
  return code === "ECONNRESET" || code === "ETIMEDOUT";
}

/**
 * Computes the wait before the next attempt: exponential, jittered, capped.
 *
 * @param attempt - Zero-based attempt number that just failed.
 * @param retryAfter - Value of the `Retry-After` header, if the server sent one.
 * @returns Milliseconds to wait.
 */
function backoffMs(attempt: number, retryAfter: string | null): number {
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds > 0) {
      return Math.min(seconds * 1000, MAX_BACKOFF_MS);
    }
  }
  const exponential = Math.min(BASE_BACKOFF_MS * 2 ** attempt, MAX_BACKOFF_MS);
  return Math.round(exponential * (0.5 + Math.random() * 0.5));
}

// --- Transport -----------------------------------------------------------

/**
 * Reads the API key, or explains how to get one.
 *
 * Read once at the top of a run rather than lazily per request, so a missing
 * key costs one sentence instead of failing on request 143 of 250 with a
 * half-written vault directory behind it.
 *
 * @returns The key.
 * @throws When it is not set.
 */
function requireApiKey(): string {
  const key = process.env.HUMANITIX_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "HUMANITIX_API_KEY is not set. Generate one at " +
        "https://console.humanitix.com/console/account/advanced/api-key and put it in .env — " +
        "it is local tooling only and must not be set in Vercel."
    );
  }
  return key;
}

/**
 * Issues one GET and returns the parsed body, retrying transient failures.
 *
 * **The body is never quoted in an error.** This transport is used for
 * `/orders` and `/tickets`, whose error responses are not expected to carry a
 * person — but "not expected to" is not a rule worth relying on when the
 * successful response definitely does.
 *
 * @param apiKey - The account key.
 * @param path - Request path, beginning `/v1/`.
 * @param query - Query parameters; undefined values are dropped.
 * @returns The parsed JSON body, unvalidated and unmapped.
 * @throws When the request fails after retries, or the body is not JSON.
 */
async function humanitixGet(
  apiKey: string,
  path: string,
  query: Record<string, string | number | undefined> = {}
): Promise<unknown> {
  const url = new URL(`${HUMANITIX_BASE_URL}${path}`);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  let lastStatus = 0;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    await awaitRateBudget();

    let res: Response;
    try {
      res = await fetch(url, {
        method: "GET",
        headers: { "x-api-key": apiKey, Accept: "application/json" },
      });
    } catch (error) {
      if (!isRetryableNetworkError(error) || attempt === MAX_ATTEMPTS - 1) {
        const networkFailure = new Error(`Humanitix request failed: network error [${path}].`);
        // 0 means "no HTTP exchange happened", which is a different fact from
        // any real status and is worth being able to tell apart in the archive.
        (networkFailure as Error & { status: number }).status = 0;
        throw networkFailure;
      }
      await sleep(backoffMs(attempt, null));
      continue;
    }

    if (res.ok) {
      const text = await res.text();
      try {
        return JSON.parse(text) as unknown;
      } catch {
        throw new Error(
          `Humanitix returned a non-JSON body for ${path}. It is deliberately not ` +
            "reported: this transport also serves the attendee endpoints."
        );
      }
    }

    lastStatus = res.status;
    if (!isRetryableStatus(res.status) || attempt === MAX_ATTEMPTS - 1) break;

    // The body is not read on a retry either, for the reason above.
    await sleep(backoffMs(attempt, res.headers.get("retry-after")));
  }

  // The status rides on the error object as well as in the prose. A caller that
  // wants to RECORD a failure rather than abort on it — pullCheckInCounts does —
  // needs the number, and parsing it back out of a sentence is the kind of thing
  // that silently becomes 0 the day somebody rewords the sentence.
  const failure = new Error(
    `Humanitix request failed (HTTP ${lastStatus}) [${path}]. The response body is ` +
      "deliberately not reported: this transport also serves the attendee endpoints."
  );
  (failure as Error & { status: number }).status = lastStatus;
  throw failure;
}

/**
 * Walks every page of a collection endpoint and returns the rows verbatim.
 *
 * Paging is 1-based and `page` is REQUIRED — omitting it is a 400, not an
 * implied first page. The walk stops on a short page as well as on the
 * envelope's `total`, so a `total` the API declines to send cannot turn into an
 * infinite loop.
 *
 * Rows are returned exactly as they arrived: no mapping, no field selection.
 * That is the point of an archive pull — `lib/humanitix/client.ts` projects
 * events down to the fields this repo uses, and a projection is a decision that
 * a future reader cannot undo.
 *
 * @param apiKey - The account key.
 * @param path - Collection path, e.g. `/v1/events`.
 * @param collection - The envelope key holding the rows.
 * @param onPage - Called after each page with the running total, for progress.
 * @returns Every row, in API order, and the number of requests it cost.
 */
async function fetchAllPages(
  apiKey: string,
  path: string,
  collection: string,
  onPage?: (fetched: number, total: number | null) => void
): Promise<{ rows: unknown[]; requests: number }> {
  const rows: unknown[] = [];
  let requests = 0;

  for (let page = 1; ; page += 1) {
    const body = await humanitixGet(apiKey, path, { page, pageSize: PAGE_SIZE });
    requests += 1;

    const envelope = (body ?? {}) as Record<string, unknown>;
    const batch = envelope[collection];
    if (!Array.isArray(batch)) {
      throw new Error(
        `Humanitix returned no \`${collection}\` array for ${path} (page ${page}). ` +
          "The response was not inspected further."
      );
    }

    rows.push(...(batch as unknown[]));
    const total = typeof envelope.total === "number" ? envelope.total : null;
    onPage?.(rows.length, total);

    if (batch.length < PAGE_SIZE) break;
    if (total !== null && rows.length >= total) break;
  }

  return { rows, requests };
}

// --- Writing -------------------------------------------------------------

/**
 * Serialises one response into the vault.
 *
 * **LF, not CRLF.** `manifest.ts` renders CRLF because its output is committed
 * and this repository is worked on with `core.autocrlf=true`, so LF there would
 * make every rebuild look like a whole-file rewrite. Vault files are gitignored
 * and git never touches them, so none of that applies — and LF keeps the sha256
 * identical whichever machine ran the pull, which is the whole point of putting
 * a hash in the manifest.
 *
 * @param dir - The export directory.
 * @param relativePath - Path within it, forward slashes.
 * @param value - The response to write.
 * @returns Bytes written.
 */
function writeJson(dir: string, relativePath: string, value: unknown): number {
  const path = join(dir, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  const body = JSON.stringify(value, null, 2) + "\n";
  writeFileSync(path, body, "utf8");
  return Buffer.byteLength(body, "utf8");
}

// --- The event list ------------------------------------------------------

/**
 * The two fields the pull needs off a raw event, with everything else intact.
 *
 * Declared as the minimum rather than the full shape because the rows are
 * written verbatim: anything this file describes is a field it might start
 * depending on, and the archive's value is that it did not choose.
 */
interface RawEventRow {
  _id?: unknown;
  dates?: { _id?: unknown; deleted?: unknown }[];
}

/** One event, reduced to what drives the per-event tiers. */
interface EventPlan {
  id: string;
  /** Live `dates[]._id` values — one check-in request each. */
  dateIds: string[];
}

/**
 * Reduces the verbatim event rows to the ids the per-event tiers iterate.
 *
 * Deleted dates are skipped: `check-in-count` for one of them is a request that
 * answers a question about an occurrence that no longer exists. **Disabled ones
 * are kept** — `disabled` means Humanitix stopped selling for that session, not
 * that it did not happen, and three of this account's dates are in that state
 * with tickets against them. The distinction is worth one deleted date: the
 * account's 59 events carry 64 `dates[]` entries, of which 63 are live.
 *
 * An event whose `dates` array is absent still counts for one date, because
 * every Humanitix listing has at least one and a zero here would silently drop
 * that event from the check-in tier.
 *
 * @param rows - Verbatim `/v1/events` rows.
 * @returns One plan per event, in API order.
 * @throws When a row carries no usable `_id` — the tiers cannot address it, and
 *   skipping it silently would understate the pull.
 */
function planEvents(rows: unknown[]): EventPlan[] {
  return rows.map((row, index) => {
    const event = (row ?? {}) as RawEventRow;
    const id = typeof event._id === "string" ? event._id : "";
    if (!id) {
      throw new Error(
        `Event ${index + 1} in the /v1/events response carries no \`_id\`. ` +
          "The per-event tiers cannot address it."
      );
    }

    const dateIds = (Array.isArray(event.dates) ? event.dates : [])
      .filter((date) => date?.deleted !== true)
      .map((date) => (typeof date?._id === "string" ? date._id : ""))
      .filter(Boolean);

    return { id, dateIds };
  });
}

// --- The plan ------------------------------------------------------------

/**
 * Prints what the pull would cost, then writes nothing.
 *
 * It makes exactly one request — `GET /v1/events`, which returns event metadata
 * and no attendee — because the cost of every other tier is a function of the
 * event list, and a plan that guessed the event count would answer a different
 * question from the one a dry run is asked.
 *
 * Two of the three tiers are stated as **floors**. `orders` and `tickets` page
 * at 100 rows, and how many pages an event needs is not knowable without asking
 * it — which is the request the dry run is avoiding. `check-ins` is exact: the
 * endpoint takes one date and returns one object, so the count is the number of
 * live event dates.
 *
 * @param exportId - The export id.
 * @param vaultPath - Where the files would go.
 * @param events - The planned events.
 * @param tiers - The tiers requested.
 */
function printPlan(
  exportId: string,
  vaultPath: string,
  events: EventPlan[],
  tiers: Set<Tier>
): void {
  const dates = events.reduce((total, event) => total + Math.max(event.dateIds.length, 1), 0);
  const multiDate = events.filter((event) => event.dateIds.length > 1);

  console.log(`Dry run — export ${exportId}`);
  console.log(`  vault      ${vaultPath}`);
  console.log(`  events     ${events.length} on the account`);
  console.log(
    `  dates      ${dates} live event dates ` +
      `(${multiDate.length} multi-date event${multiDate.length === 1 ? "" : "s"}, ` +
      `${dates - events.length} extra session${dates - events.length === 1 ? "" : "s"})`
  );
  console.log("");
  console.log("  tier         files  requests  endpoint");
  console.log("  events           1         1  /v1/events");
  console.log("  tags             1         1  /v1/tags");

  let floor = 2;
  let exact = true;

  if (tiers.has("orders")) {
    console.log(
      `  orders      ${String(events.length).padStart(4)}  ${String(events.length).padStart(8)}+ /v1/events/{eventId}/orders`
    );
    floor += events.length;
    exact = false;
  }
  if (tiers.has("tickets")) {
    console.log(
      `  tickets     ${String(events.length).padStart(4)}  ${String(events.length).padStart(8)}+ /v1/events/{eventId}/tickets`
    );
    floor += events.length;
    exact = false;
  }
  if (tiers.has("check-ins")) {
    console.log(
      `  check-ins   ${String(events.length).padStart(4)}  ${String(dates).padStart(8)}  /v1/events/{eventId}/check-in-count`
    );
    floor += dates;
  }

  const files = 2 + (tiers.has("orders") ? events.length : 0) +
    (tiers.has("tickets") ? events.length : 0) +
    (tiers.has("check-ins") ? events.length : 0);

  console.log("");
  console.log(`  files      ${files}`);
  console.log(
    `  requests   ${floor}${exact ? "" : " minimum"}` +
      (exact
        ? ""
        : " — orders and tickets page at 100 rows, so an event with more than\n" +
          "             100 of either costs an extra request per extra page.")
  );
  console.log(
    `  wall clock ~${Math.ceil((floor * MIN_REQUEST_INTERVAL_MS) / 60_000)} min at the rate budget ` +
      `(${MIN_REQUEST_INTERVAL_MS} ms between requests)`
  );

  if (tiers.has("orders") || tiers.has("tickets")) {
    console.log("");
    console.log(
      "  orders/ and tickets/ carry names, emails, mobiles, addresses, dates of birth,\n" +
        "  free-text dietary and accessibility answers, qrCodeData, and a LIVE accessCode\n" +
        "  on nearly every row. They go to private/ only and are never summarised into\n" +
        "  lib/data/json/. See the header of this file."
    );
  }

  console.log("");
  console.log("Nothing was written. Drop --dry-run to run it.");
}

// --- The pull ------------------------------------------------------------

/**
 * Fetches one per-event collection and writes it verbatim.
 *
 * @param apiKey - The account key.
 * @param dir - The export directory.
 * @param eventId - The 24-hex event id.
 * @param tier - Which collection: `orders` or `tickets`.
 * @returns The number of rows written.
 */
async function pullCollection(
  apiKey: string,
  dir: string,
  eventId: string,
  tier: "orders" | "tickets"
): Promise<number> {
  const { rows } = await fetchAllPages(apiKey, `/v1/events/${eventId}/${tier}`, tier);
  writeJson(dir, `${tier}/${eventId}.json`, rows);
  return rows.length;
}

/**
 * Fetches one event's check-in counts — one call per date — and writes them.
 *
 * The endpoint requires an `eventDateId` and has no whole-event form, so a
 * multi-date series produces several entries in one file. They are written as
 * an array rather than an object keyed by date id so the file's shape does not
 * change between a one-off event and a series.
 *
 * A failed date is RECORDED, not thrown. On 2026-08-28 Humanitix answered 500
 * for one date of `storytellers-series-2-0`, a 2020 three-session series, and an
 * aborting loop cost the remaining five events their counts. An archive pull is
 * the wrong place to be strict: a run that stops at the first bad row leaves a
 * directory nobody can tell apart from a complete one. So the entry becomes
 * `{ eventDateId, error: { status } }` and the pull continues. The status code
 * is kept and the response body is not — this transport also serves the
 * attendee endpoints, and a body echoed into a file is how personal data
 * escapes a place that was supposed to hold counts.
 *
 * @param apiKey - The account key.
 * @param dir - The export directory.
 * @param event - The event and its live date ids.
 * @returns The number of dates written, successful or not.
 */
async function pullCheckInCounts(
  apiKey: string,
  dir: string,
  event: EventPlan
): Promise<number> {
  const entries: unknown[] = [];
  for (const eventDateId of event.dateIds) {
    try {
      entries.push(
        await humanitixGet(apiKey, `/v1/events/${event.id}/check-in-count`, { eventDateId })
      );
    } catch (error) {
      const status =
        typeof (error as { status?: unknown }).status === "number"
          ? (error as { status: number }).status
          : 0;
      console.log(`    ! ${event.id} date ${eventDateId}: HTTP ${status}, recorded as an error`);
      entries.push({ eventDateId, error: { status } });
    }
  }
  writeJson(dir, `check-in-counts/${event.id}.json`, entries);
  return entries.length;
}

/**
 * Runs one per-event tier over every event, printing progress by count only.
 *
 * Serial rather than parallel: the rate budget would queue the requests anyway,
 * and holding 59 orders responses in memory to write them at the end would mean
 * thousands of attendee records live in the heap for no benefit.
 *
 * @param label - Tier name, for the progress lines.
 * @param events - The events to walk.
 * @param each - What to do per event; returns the row count written.
 */
async function runTier(
  label: string,
  events: EventPlan[],
  each: (event: EventPlan) => Promise<number>
): Promise<void> {
  console.log(`  ${label} for ${events.length} events…`);
  let rows = 0;
  for (const [index, event] of events.entries()) {
    rows += await each(event);
    const done = index + 1;
    if (done % 10 === 0 || done === events.length) {
      console.log(`    ${done}/${events.length}  ${rows} rows so far`);
    }
  }
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const exportId = argValue(argv, "--export");
  const dryRun = argv.includes("--dry-run");

  if (!exportId || !EXPORT_ID_PATTERN.test(exportId)) {
    console.error(
      "Usage: npx tsx scripts/humanitix/fetch-api.ts --export <YYYY-MM-DD>-api " +
        `[--include ${TIERS.join(",")}] [--dry-run]\n` +
        "  The -api suffix is required: an API pull is its own snapshot and must not\n" +
        "  share an exportId with a CSV export, which --append would then clobber."
    );
    process.exit(1);
    return;
  }

  const tiers = parseTiers(argValue(argv, "--include"));

  // Read before anything else, and on a dry run too: the question a dry run
  // answers is "would the real run work", and a plan printed on a machine with
  // no key answers it wrongly.
  const apiKey = requireApiKey();

  // The event list drives everything, so it is fetched first in both modes. It
  // is the PII-free endpoint — event metadata, ticket types, venues — and it is
  // the only request a dry run makes.
  const { rows: eventRows } = await fetchAllPages(apiKey, "/v1/events", "events");
  const events = planEvents(eventRows);

  if (dryRun) {
    // Described rather than resolved: resolving would mean either creating the
    // directory or reimplementing `HUMANITIX_VAULT_DIR`'s precedence a second
    // time, and a dry run writes nothing.
    printPlan(
      exportId,
      process.env.HUMANITIX_VAULT_DIR?.trim() || `private/humanitix/${exportId}/`,
      events,
      tiers
    );
    return;
  }

  const dir = ensureVaultDir(exportId);
  const endpoints: string[] = ["/v1/events"];

  const eventBytes = writeJson(dir, "events.json", eventRows);
  console.log(`  wrote events.json          ${String(events.length).padStart(5)} items  ${eventBytes} bytes`);

  const tagRows = (await fetchAllPages(apiKey, "/v1/tags", "tags")).rows;
  const tagBytes = writeJson(dir, "tags.json", tagRows);
  endpoints.push("/v1/tags");
  console.log(`  wrote tags.json            ${String(tagRows.length).padStart(5)} items  ${tagBytes} bytes`);

  if (tiers.has("orders")) {
    await runTier("orders", events, (event) => pullCollection(apiKey, dir, event.id, "orders"));
    endpoints.push("/v1/events/{eventId}/orders");
  }
  if (tiers.has("tickets")) {
    await runTier("tickets", events, (event) => pullCollection(apiKey, dir, event.id, "tickets"));
    endpoints.push("/v1/events/{eventId}/tickets");
  }
  if (tiers.has("check-ins")) {
    await runTier("check-in counts", events, (event) => pullCheckInCounts(apiKey, dir, event));
    endpoints.push("/v1/events/{eventId}/check-in-count");
  }

  const entry = buildApiExportEntry(exportId, {
    // The host, with no credential in it — the key is never recorded anywhere.
    baseUrl: `${HUMANITIX_BASE_URL}/v1`,
    events: events.length,
    endpoints,
  });
  appendExportEntry(entry);

  console.log("");
  console.log(
    `Recorded export ${exportId}: ${entry.fileCount} files in lib/data/json/humanitix/manifest.json`
  );
  if (tiers.has("orders") || tiers.has("tickets")) {
    console.log("");
    console.log(
      `The files under ${entry.vaultPath}orders/ and tickets/ carry live access codes\n` +
        "and every attendee's contact details. They belong in the private archive repo\n" +
        "(she-sharp-slack-archive/humanitix/) and nowhere else."
    );
  }
}

main().catch((error: unknown) => {
  // One line, no stack: every failure this script can hit is a configuration
  // fact, an account fact, or an HTTP status, and a stack trace buries the
  // sentence that says which.
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
