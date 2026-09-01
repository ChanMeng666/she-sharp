/**
 * Reads `GET /v1/events/{eventId}/orders` through a field allowlist, so the
 * fields nobody asked for never enter this process at all.
 *
 * ---------------------------------------------------------------------------
 * THIS IS A PII ENDPOINT READ THROUGH A KEYHOLE. IT IS NOT A PII-FREE CALL.
 * ---------------------------------------------------------------------------
 *
 * An order row carries the buyer's name, email address, mobile, organisation,
 * postal address, every `additionalFields[]` answer they typed at checkout, and
 * the **`accessCode` they redeemed** — a live credential, three of which
 * reached a committed JSON on 2026-06-11 and had to be rotated with a git
 * history rewrite. `lib/humanitix/client.ts` deliberately does not implement
 * this endpoint, and its header says why in as many words: "a function that
 * does not exist cannot be imported from `app/` by mistake — that absence is
 * the safety mechanism".
 *
 * That mechanism is preserved here by LOCATION. This module lives under
 * `scripts/`, which nothing in `app/`, `lib/` or `components/` imports, so the
 * capability exists exactly where a person runs it by hand and nowhere a
 * request handler could reach. **Do not move this into `lib/`, and do not
 * re-export it from `lib/humanitix/client.ts`.**
 *
 * ---------------------------------------------------------------------------
 * WHY THIS IS THE THIRD COPY OF THE TRANSPORT IN THIS DIRECTORY
 * ---------------------------------------------------------------------------
 *
 * `fetch-api.ts` and `api-counts.ts` each carry their own ~60-line duplicate of
 * `lib/humanitix/client.ts`'s transport, for the reason both headers give:
 * exporting `humanitixFetch` from that client would hand every future caller an
 * unrestricted path to *any* Humanitix endpoint from `lib/`, including the four
 * the file exists to keep out of reach. This is the third copy, added
 * deliberately, and it is not a duplicate of either of the other two:
 *
 *   * `fetch-api.ts` writes rows **verbatim** into the vault, and a vault stores
 *     verbatim payloads — a checksum over a mapped object proves only what the
 *     mapper kept. It therefore must NOT have a field allowlist, and cannot
 *     grow one without stopping being an archive pull.
 *   * `api-counts.ts` keeps nothing but a pagination envelope's `total`; it
 *     never walks pages and has no notion of which fields a caller wants.
 *   * This one exists because both new opt-in scripts need the same *filtered*
 *     read of the same endpoint — a projection, which is exactly the thing the
 *     vault may not hold.
 *
 * ---------------------------------------------------------------------------
 * WHY `keep` IS A PARAMETER AND NOT AN OPTION
 * ---------------------------------------------------------------------------
 *
 * The allowlist is a required positional part of the options object, with no
 * default, for the reason `lib/humanitix/client.ts` gives about `acquireSlot()`:
 * **a limiter you have to remember is a limiter somebody forgets.** A default
 * of "everything" would make the safe call the one that takes an extra
 * argument, and the first caller in a hurry would get the whole order row —
 * access code included — into memory, into a `console.log`, into a JSON dump,
 * without ever typing anything that looked wrong. Making it required means the
 * question "which fields do I actually need?" is asked at every call site, by
 * the compiler, before the first request goes out.
 *
 * The filtering is done by `JSON.parse`'s reviver, the same trick as
 * `parseEnvelopeDroppingTickets()` in `api-counts.ts`: the reviver returns
 * `undefined` for any key that is not the root, not a numeric array index, and
 * not in `keep`, which deletes the property. **`accessCode`, `mobile`,
 * `additionalFields[]` and the postal address therefore never exist as
 * properties of any object this module returns.** They still pass through the
 * reviver transiently while the string is being parsed — short of the API
 * growing a `fields` projection that is unavoidable — and nothing retains them.
 *
 * There is **no `method` option**: the transport cannot express a write. That
 * is not a convenience, it is the reason a read-only tool can be given the
 * account's only API key without anybody having to audit the call sites.
 *
 * Errors carry `status` and `eventId` and nothing else. **No message ever
 * quotes a response body**, on success or failure — an error body is not
 * expected to carry a person, but "not expected to" is not a rule worth relying
 * on when the successful response definitely does.
 *
 * Ref: https://api.humanitix.com/v1/documentation/json (OpenAPI, read
 * 2026-08-27); the `/orders` envelope and field set re-confirmed against the
 * live account 2026-09-01.
 */

const HUMANITIX_BASE_URL = "https://api.humanitix.com";

// ---------------------------------------------------------------------------
// Field allowlists
// ---------------------------------------------------------------------------

/**
 * The fields the CSV exporter needs, and not one more.
 *
 * `financialStatus` is here and `mobile` is not, which is the whole shape of
 * this list: everything present is written into a column the downstream import
 * chain reads, and everything absent is a thing the chain has no column for.
 * `_id` earns its place as the duplicate-order key — two orders from one person
 * must be countable as two without either being an address.
 */
export const OPTIN_EXPORT_FIELDS: readonly string[] = [
  "email",
  "firstName",
  "lastName",
  "status",
  "financialStatus",
  "completedAt",
  "organiserMailListOptIn",
  "_id",
];

/**
 * The two fields the switch check needs.
 *
 * Deliberately narrower than {@link OPTIN_EXPORT_FIELDS}: a check that only
 * ever prints counts has no business holding an address, and the narrower list
 * is what lets `check-optin-switch.ts` scan every upcoming event without ever
 * materialising a person. `completedAt` is added by that script's own call when
 * it wants the late-switch signature, which is the one place it needs a date.
 */
export const OPTIN_COUNT_FIELDS: readonly string[] = ["status", "organiserMailListOptIn"];

// ---------------------------------------------------------------------------
// Rate budget
// ---------------------------------------------------------------------------

/**
 * Humanitix publishes 200 requests per minute; the sibling modules target 80%
 * of it for the reasons written there, and this one matches so that a run which
 * interleaves this with `listEvents()` stays inside the published rate on the
 * arithmetic of either module alone.
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

// ---------------------------------------------------------------------------
// Retry
// ---------------------------------------------------------------------------

const MAX_ATTEMPTS = 5;
const BASE_BACKOFF_MS = 500;
const MAX_BACKOFF_MS = 20_000;

/** `pageSize` ceiling the API enforces. Paging is 1-based; `page` is required. */
const PAGE_SIZE = 100;

/**
 * The page walk's hard ceiling.
 *
 * 200 pages is 20,000 orders — five times the whole account's four-year history
 * on one event. It exists so that an API that stops sending `total` and keeps
 * returning full pages throws instead of spinning: an unbounded loop against a
 * PII endpoint is the failure mode where "nothing went wrong, it is just slow"
 * and "we are re-downloading every attendee we have" look identical.
 */
const MAX_PAGES = 200;

/**
 * Decides whether a failed response is worth retrying.
 *
 * 429 and 5xx only, matching `lib/humanitix/client.ts`. No other 4xx is ever
 * retried: a 401 retried five times is five chances to trip a lockout on the
 * account's only API key, and a 400 is five identical rejections.
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

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/**
 * Error thrown by this module. `status` is 0 when no HTTP exchange happened,
 * matching the convention in `lib/humanitix/client.ts` and `api-counts.ts`.
 *
 * There is no `body` field, and that is the point: the sibling client attaches
 * the parsed response to its error because none of its endpoints can return a
 * person. This one's does, so the error carries the status and the event id —
 * both Humanitix's own identifiers rather than anybody's data — and stops.
 */
export interface OrdersApiError extends Error {
  status: number;
  eventId: string;
}

/**
 * Builds the error for a failed orders read.
 *
 * @param message - What went wrong, in one sentence, quoting no response data.
 * @param status - HTTP status, or 0 when the request was never made.
 * @param eventId - The Humanitix event id the caller asked about.
 * @returns The error to throw.
 */
function makeOrdersError(message: string, status: number, eventId: string): OrdersApiError {
  const err = new Error(message) as OrdersApiError;
  err.name = "HumanitixOrdersError";
  err.status = status;
  err.eventId = eventId;
  return err;
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/** Array indices arrive as their decimal string form; those keys must survive. */
const ARRAY_INDEX = /^(?:0|[1-9]\d*)$/;

/**
 * The pagination envelope, with every unlisted order field already gone.
 *
 * `orders` is typed as `unknown[]` rather than an order shape on purpose: the
 * type is the second guard behind the reviver, so a later edit reaching for
 * `order.accessCode` does not compile even though the reviver would already
 * have deleted it.
 */
interface OrdersEnvelope {
  total?: unknown;
  page?: unknown;
  pageSize?: unknown;
  orders?: unknown;
}

/**
 * Parses an orders response, keeping only the allowlisted fields.
 *
 * The reviver keeps a key when it is the synthetic root key (`""`), a numeric
 * array index, or a member of `keep`. Everything else is returned as
 * `undefined`, which deletes the property outright — so the object handed back
 * cannot contain an access code, a mobile or an address no matter what a caller
 * does with it. The envelope keys the walk needs (`total`, `page`, `pageSize`,
 * `orders`) are always kept, because dropping them would make the pagination
 * unreadable rather than making anything safer.
 *
 * @param text - The raw response body.
 * @param keep - Order fields to retain.
 * @returns The filtered envelope, or null when the body is not JSON.
 */
function parseOrdersKeepingOnly(text: string, keep: readonly string[]): OrdersEnvelope | null {
  const allowed = new Set<string>([...keep, "total", "page", "pageSize", "orders"]);
  try {
    const parsed: unknown = JSON.parse(text, (key, value: unknown) => {
      if (key === "" || ARRAY_INDEX.test(key) || allowed.has(key)) return value;
      return undefined;
    });
    return parsed && typeof parsed === "object" ? (parsed as OrdersEnvelope) : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// The walk
// ---------------------------------------------------------------------------

/** What one event's orders pull cost and returned. */
export interface OrdersPullResult {
  /** The filtered order rows, in API order. */
  rows: unknown[];
  /** How many HTTP requests it took, so a report can state its own cost. */
  requests: number;
  /** The envelope's `total`, or null when the API declined to send one. */
  total: number | null;
}

/** Options for {@link fetchOrders}. */
export interface FetchOrdersOptions {
  /**
   * The order fields to keep. Required — see the header for why there is no
   * default and why "everything" is not one of the choices.
   */
  keep: readonly string[];
  /**
   * ISO 8601 instant; only orders changed after it are returned.
   *
   * **This filters on `updatedAt`, not `createdAt`** — established empirically
   * against the live account on 2026-09-01, where an order created 2026-05-29
   * and updated 2026-06-10 was returned by `since=2026-06-04`, and the returned
   * set matched the `updatedAt` set (26) rather than the `createdAt` set (25).
   * A caller using it to mean "orders placed since" will silently be wrong
   * about a refunded or edited order.
   */
  since?: string;
}

/**
 * Fetches every order on one Humanitix listing, through the field allowlist.
 *
 * Paging is 1-based and `page` is REQUIRED — omitting it is a 400, not an
 * implied first page. The walk stops on a short page as well as on the
 * envelope's `total`, so a `total` the API declines to send cannot turn into an
 * unbounded loop, and {@link MAX_PAGES} throws rather than spinning if both
 * signals fail at once.
 *
 * @param eventId - The 24-hex Humanitix event id (`HumanitixEvent.id`), not the
 *   8-character `humanitixEventId` from the CSV archive.
 * @param opts - The required field allowlist, and an optional `since`.
 * @returns The filtered rows, the request count, and the envelope's `total`.
 * @throws {OrdersApiError} When the key is missing, the response is non-2xx
 *   after retries, the body is not JSON, or the page ceiling is reached. The
 *   message names the status and the event id and quotes nothing from the body.
 */
export async function fetchOrders(
  eventId: string,
  opts: FetchOrdersOptions
): Promise<OrdersPullResult> {
  const apiKey = process.env.HUMANITIX_API_KEY?.trim();
  if (!apiKey) {
    throw makeOrdersError(
      "HUMANITIX_API_KEY is not set. Generate one at " +
        "https://console.humanitix.com/console/account/advanced/api-key and put it in .env — " +
        "it is local tooling only and must not be set in Vercel.",
      0,
      eventId
    );
  }

  const path = `/v1/events/${encodeURIComponent(eventId)}/orders`;
  const rows: unknown[] = [];
  let requests = 0;
  let total: number | null = null;

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const url = new URL(`${HUMANITIX_BASE_URL}${path}`);
    url.searchParams.set("page", String(page));
    url.searchParams.set("pageSize", String(PAGE_SIZE));
    if (opts.since) url.searchParams.set("since", opts.since);

    const envelope = await getPage(apiKey, url, eventId, opts.keep);
    requests += 1;

    const batch = envelope.orders;
    if (!Array.isArray(batch)) {
      throw makeOrdersError(
        `Humanitix returned no \`orders\` array for ${eventId} (page ${page}). The response ` +
          "was not inspected further: this endpoint returns attendee records.",
        200,
        eventId
      );
    }

    rows.push(...(batch as unknown[]));
    if (typeof envelope.total === "number" && Number.isFinite(envelope.total)) {
      total = envelope.total;
    }

    if (batch.length < PAGE_SIZE) return { rows, requests, total };
    if (total !== null && rows.length >= total) return { rows, requests, total };
  }

  throw makeOrdersError(
    `Humanitix orders for ${eventId} did not terminate within ${MAX_PAGES} pages ` +
      `(${MAX_PAGES * PAGE_SIZE} rows). Every page came back full and the envelope never ` +
      "reported a reachable total, so the walk was stopped rather than left running against " +
      "an attendee endpoint.",
    200,
    eventId
  );
}

/**
 * Issues one GET and returns the filtered envelope, retrying transient failures.
 *
 * Split out of the walk so the retry loop is not nested inside the page loop —
 * two `for` loops sharing a body is where an off-by-one hides.
 *
 * @param apiKey - The account key.
 * @param url - The fully-built request URL.
 * @param eventId - For the error message only.
 * @param keep - The caller's field allowlist, threaded through rather than
 *   defaulted: this function has no business deciding what a caller may keep.
 * @returns The filtered envelope.
 * @throws {OrdersApiError} On a non-retryable status, exhausted retries, a
 *   network fault, or a body that is not JSON.
 */
async function getPage(
  apiKey: string,
  url: URL,
  eventId: string,
  keep: readonly string[]
): Promise<OrdersEnvelope> {
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
        throw makeOrdersError(`Humanitix orders failed for ${eventId}: network error.`, 0, eventId);
      }
      await sleep(backoffMs(attempt, null));
      continue;
    }

    if (res.ok) {
      const envelope = parseOrdersKeepingOnly(await res.text(), keep);
      if (!envelope) {
        throw makeOrdersError(
          `Humanitix returned a non-JSON body for ${eventId}. It is deliberately not ` +
            "reported: this endpoint returns attendee records.",
          res.status,
          eventId
        );
      }
      return envelope;
    }

    lastStatus = res.status;
    if (!isRetryableStatus(res.status) || attempt === MAX_ATTEMPTS - 1) break;

    // The body is not read on a retry either: an error body is not expected to
    // carry a person, but "not expected to" is not a rule this module relies on.
    await sleep(backoffMs(attempt, res.headers.get("retry-after")));
  }

  throw makeOrdersError(
    `Humanitix orders failed for ${eventId} (HTTP ${lastStatus}). The response body is ` +
      "deliberately not reported: this endpoint returns attendee records.",
    lastStatus,
    eventId
  );
}

/** Test seam: exposes the reviver so the allowlist can be asserted offline. */
export function parseOrdersForTest(text: string, keep: readonly string[]): OrdersEnvelope | null {
  return parseOrdersKeepingOnly(text, keep);
}
