/**
 * Thin typed wrapper over the Humanitix Public API v1 (spec version 1.21.0).
 *
 * Why hand-rolled `fetch`? Humanitix publishes an OpenAPI document but no
 * TypeScript client, and generating one would pull a build step and a
 * dependency into `lib/` for four GET endpoints that only hand-run scripts
 * call. `lib/mailchimp/client.ts` follows the same precedent, and
 * `lib/mailchimp/client.ts` is this file's sibling: same header style, same
 * error shape, same lazy key read, same retry and pagination idioms. Where the
 * two differ — the throttle, the 1-based paging, the absence of a `fields`
 * projection — the comment at the site says why.
 *
 * LOCAL TOOLING ONLY. Nothing under `app/` reads `HUMANITIX_API_KEY` and
 * nothing may.
 *
 * ---------------------------------------------------------------------------
 * THIS FILE DELIBERATELY IMPLEMENTS ONLY THE PII-FREE HALF OF THE API.
 * ---------------------------------------------------------------------------
 *
 * Implemented: `GET /v1/events`, `GET /v1/events/{id}`,
 * `GET /v1/events/{id}/check-in-count`, `GET /v1/tags`. Every one of those
 * returns event metadata and counts — no attendee.
 *
 * Deliberately **absent**, and to stay absent:
 *
 *   GET   /v1/events/{id}/orders            purchaser first/last name, email,
 *   GET   /v1/events/{id}/orders/{orderId}  mobile, street address, discounts
 *   GET   /v1/events/{id}/tickets           and **access codes**, plus the
 *   GET   /v1/events/{id}/tickets/{id}      free-text answers to the dietary,
 *                                           accessibility and photo-consent
 *                                           questions
 *   POST  /v1/events                        writes — this integration is
 *   PATCH /v1/events/{id}                   read-only
 *   POST  /v1/events/{id}/tickets/{id}/transfer
 *   POST  /v1/events/{id}/tickets/{id}/check-in
 *   POST  /v1/events/{id}/tickets/{id}/check-out
 *
 * `docs/development/HUMANITIX_ARCHIVE.md` states that the whole privacy design
 * "rests on the running application having no path to a real address", and that
 * no access-code value appears anywhere in this repository — three codes that
 * reached a committed JSON file on 2026-06-11 had to be rotated, with a history
 * rewrite, because a leaked code cannot be un-leaked by a later edit.
 *
 * **A function that does not exist cannot be imported from `app/` by mistake.
 * That absence is the safety mechanism, not a comment asking for restraint.**
 * The order and ticket endpoints will be reached from a scripts-only module
 * that writes to `/private/`; do not add them here, and do not add a
 * `listTickets` in passing because the file happened to be open.
 *
 * Ref: https://api.humanitix.com/v1/documentation/json (OpenAPI, read
 * 2026-08-27) and https://humanitix.stoplight.io/docs/humanitix-public-api.
 * Anything marked `TODO(verify-live)` is asserted from that spec rather than
 * from a confirmed live call — `HUMANITIX_API_KEY` was still empty when this
 * file was written.
 */

const HUMANITIX_BASE_URL = "https://api.humanitix.com";

// --- Errors --------------------------------------------------------------

/** Error thrown for any non-2xx Humanitix REST response. */
export interface HumanitixApiError extends Error {
  status: number;
  body: unknown;
  path: string;
}

/**
 * Humanitix's error body: `{ statusCode, error, message }`.
 *
 * Flat, unlike Mailchimp's RFC 7807 problem detail — `message` is the human
 * sentence and `error` the status name ("Bad Request").
 */
interface HumanitixErrorBody {
  statusCode?: number;
  error?: string;
  message?: string;
}

/**
 * Builds the error thrown for a non-2xx response.
 *
 * @param status - HTTP status code.
 * @param body - Parsed response body (a Humanitix error object, or text).
 * @param path - Request path, echoed into the message so a failure names the
 *   endpoint without the caller having to add it.
 * @returns The error to throw.
 */
function makeHumanitixApiError(status: number, body: unknown, path: string): HumanitixApiError {
  const message =
    body && typeof body === "object" && "message" in body
      ? String((body as HumanitixErrorBody).message ?? "")
      : "";
  const err = new Error(
    `${message || `Humanitix API request failed (${status})`} [${status} ${path}]`
  ) as HumanitixApiError;
  err.name = "HumanitixApiError";
  err.status = status;
  err.body = body;
  err.path = path;
  return err;
}

/**
 * Builds the "cannot even try" error, before any request is made.
 *
 * Uses `status: 0` to mean "no HTTP exchange happened", matching the
 * missing-key errors in `lib/mailchimp/client.ts`, so a
 * caller distinguishing misconfiguration from an API rejection tests one field
 * across all three.
 *
 * @param message - What is missing and how to supply it.
 * @param path - Request path the caller was attempting.
 * @returns The error to throw.
 */
function makeConfigError(message: string, path: string): HumanitixApiError {
  const err = new Error(message) as HumanitixApiError;
  err.name = "HumanitixApiError";
  err.status = 0;
  err.body = null;
  err.path = path;
  return err;
}

// --- Rate limiting -------------------------------------------------------

/**
 * Humanitix publishes a limit of **200 requests per minute**. That is a *rate*,
 * not a connection count — the substantive difference from the Mailchimp
 * sibling, where the documented cap is 10 simultaneous connections and a
 * semaphore of 8 is therefore both necessary and sufficient.
 *
 * Against a rate limit a semaphore alone is neither: six concurrent requests to
 * a fast endpoint can exceed 200/minute, and one concurrent request to a slow
 * one wastes the budget. So this file has both — a semaphore bounding in-flight
 * sockets, and a minimum-interval throttle that is the thing actually enforcing
 * the published limit.
 *
 * TODO(verify-live): 200/min comes from the Humanitix API docs; the OpenAPI
 * document carries no rate-limit fields and no live 429 has been observed, so
 * neither the limit nor whether a 429 carries `Retry-After` is confirmed.
 */
const REQUESTS_PER_MINUTE = 200;

/**
 * Target rate, held below the published one. 160/min leaves a fifth of the
 * budget for anything else on the same key (a second script, the Humanitix web
 * console) and absorbs the skew between our request clock and the server's
 * window boundaries.
 */
const TARGET_REQUESTS_PER_MINUTE = Math.floor(REQUESTS_PER_MINUTE * 0.8);

/** Minimum gap between two request *starts*, in milliseconds. */
const MIN_REQUEST_INTERVAL_MS = Math.ceil(60_000 / TARGET_REQUESTS_PER_MINUTE);

/**
 * In-flight cap. Lower than Mailchimp's 8 because the throttle above already
 * spaces starts ~375ms apart: more sockets than a handful only help if a single
 * request outlasts that gap, and the docs warn the first request after a quiet
 * period can take "a few seconds".
 */
const MAX_CONCURRENT_REQUESTS = 6;

let activeRequests = 0;
const waiting: (() => void)[] = [];

/**
 * Takes a slot in the FIFO concurrency gate, waiting if all are in use.
 *
 * This lives *inside* `humanitixFetch`, not as a helper callers wrap around
 * their own `Promise.all`, for the reason its sibling gives: a limiter you have
 * to remember is a limiter somebody forgets, and `Promise.all` over one
 * check-in count per event date is exactly the shape that forgets it. Putting
 * the gate at the single point every request passes through makes the naive
 * call site correct.
 *
 * FIFO (a queue of resolvers, not a polling loop) so a request queued first is
 * not starved by later ones, and so waiting costs no timers.
 *
 * @returns A promise resolving once a slot is held.
 */
function acquireSlot(): Promise<void> {
  if (activeRequests < MAX_CONCURRENT_REQUESTS) {
    activeRequests += 1;
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    waiting.push(() => {
      activeRequests += 1;
      resolve();
    });
  });
}

/** Releases a slot, handing it to the longest-waiting caller if there is one. */
function releaseSlot(): void {
  activeRequests -= 1;
  const next = waiting.shift();
  if (next) next();
}

/** Earliest instant (epoch ms) at which the next request may start. */
let nextRequestAt = 0;

/**
 * Waits until this process's rate budget allows another request to start.
 *
 * The reservation — read `nextRequestAt`, claim a start instant, advance it —
 * runs to completion with no `await` in the middle, so on JavaScript's single
 * thread two concurrent callers cannot claim the same instant and no lock or
 * promise chain is needed. Each then simply sleeps until the slot it reserved.
 *
 * Called once per *attempt*, inside the retry loop, because a retry is another
 * request against the same budget.
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

/**
 * Pushes every caller's budget out after a 429.
 *
 * The rate limit is per key, so one request being told to wait means all of
 * them were over the line. Without this, the other in-flight requests would
 * keep firing into a window the server has already closed.
 *
 * @param waitMs - How long the server asked us to wait.
 */
function deferRateBudget(waitMs: number): void {
  nextRequestAt = Math.max(nextRequestAt, Date.now() + waitMs);
}

// --- Retry ---------------------------------------------------------------

const MAX_ATTEMPTS = 5;
const BASE_BACKOFF_MS = 500;
const MAX_BACKOFF_MS = 20_000;

/** Sleeps for a number of milliseconds. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Decides whether a failed response is worth retrying.
 *
 * 429 and 5xx are transient by definition. **No other 4xx is ever retried**: a
 * 401 retried five times is five chances to trip a lockout on the account's
 * only API key, and a 400 — the answer to a missing `page`, or a `pageSize`
 * over 100 — is five identical rejections. The request is wrong, and waiting
 * does not make it right.
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
 * Node's `fetch` reports these as a `TypeError` whose `cause` carries the
 * system errno, so the code is one level down rather than on the error itself.
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
 * Jitter matters because the concurrency gate can release several requests at
 * once; without it they would back off in lockstep and re-collide.
 *
 * @param attempt - Zero-based attempt number that just failed.
 * @param retryAfter - Value of the `Retry-After` header, if the server sent one.
 * @returns Milliseconds to wait.
 */
function backoffMs(attempt: number, retryAfter: string | null): number {
  // Honour the server's own instruction when it gives one — it knows when the
  // window reopens and guessing shorter just burns another attempt.
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

/** A query string value; `undefined` entries are dropped rather than sent empty. */
type QueryValue = string | number | boolean | undefined;

interface HumanitixFetchOptions {
  /** Path below the origin, including the `/v1` prefix and a leading slash. */
  path: string;
  query?: Record<string, QueryValue>;
}

/**
 * Performs an authenticated GET against the Humanitix Public API.
 *
 * There is no `method` option, and that is deliberate: this module reaches only
 * read endpoints, so the one transport function cannot express a write even if
 * a later edit tries to make one. See the file header.
 *
 * The API key is read **lazily, here, on every call** and never at module load,
 * so importing this module on a machine with no Humanitix key costs nothing and
 * a missing key fails at the call that needed it, naming the variable.
 * (`lib/db/drizzle.ts` throws at module load; that precedent deliberately does
 * not apply — a missing database is fatal to every caller, a missing Humanitix
 * key is fatal only to the ones that call out.)
 *
 * Every request passes through the concurrency gate, the rate budget and the
 * retry loop; there is no unguarded path to `fetch`.
 *
 * @param options - Path and query parameters.
 * @returns The parsed JSON response body.
 * @throws {HumanitixApiError} When the key is missing, or the response is
 *   non-2xx after retries.
 */
async function humanitixFetch<T>(options: HumanitixFetchOptions): Promise<T> {
  const apiKey = process.env.HUMANITIX_API_KEY?.trim();
  if (!apiKey) {
    throw makeConfigError(
      "HUMANITIX_API_KEY is not set. Generate one at " +
        "https://console.humanitix.com/console/account/advanced/api-key and put " +
        "it in .env — it is local tooling only and must not be set in Vercel.",
      options.path
    );
  }

  const url = new URL(`${HUMANITIX_BASE_URL}${options.path}`);
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  await acquireSlot();
  try {
    let lastError: unknown;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      await awaitRateBudget();

      let res: Response;
      try {
        // Humanitix authenticates with a bare `x-api-key` header — not Bearer,
        // and not the HTTP Basic that Mailchimp wants.
        res = await fetch(url, {
          method: "GET",
          headers: { "x-api-key": apiKey, Accept: "application/json" },
        });
      } catch (error) {
        if (!isRetryableNetworkError(error) || attempt === MAX_ATTEMPTS - 1) throw error;
        lastError = error;
        await sleep(backoffMs(attempt, null));
        continue;
      }

      const text = await res.text();
      let parsed: unknown = null;
      if (text) {
        try {
          parsed = JSON.parse(text);
        } catch {
          parsed = text;
        }
      }

      if (res.ok) return parsed as T;

      const err = makeHumanitixApiError(res.status, parsed, options.path);
      if (!isRetryableStatus(res.status) || attempt === MAX_ATTEMPTS - 1) throw err;
      lastError = err;

      const waitMs = backoffMs(attempt, res.headers.get("retry-after"));
      // A 429 is a statement about the whole key, so hold every other caller
      // back too, not just this one.
      if (res.status === 429) deferRateBudget(waitMs);
      // The slot is held across the backoff on purpose: sleeping inside the
      // gate throttles the whole run, rather than freeing a slot for another
      // request to hit the same rate limit with.
      await sleep(waitMs);
    }

    // Unreachable: the loop either returns or throws on its final attempt.
    throw lastError ?? makeConfigError("Humanitix request exhausted retries", options.path);
  } finally {
    releaseSlot();
  }
}

// --- Pagination ----------------------------------------------------------

/**
 * The spec caps `pageSize` at 100 (`minimum: 1, maximum: 100, default: 100`).
 *
 * TODO(verify-live): whether asking for more is a 400 or a silent clamp is
 * unconfirmed, so the value is clamped here rather than found out in
 * production.
 */
const MAX_PAGE_SIZE = 100;

/**
 * Bounds the paging loop. 200 pages of 100 is 20,000 rows — two orders of
 * magnitude past the ~100 events and handful of tags this account holds, so
 * reaching it means the server is not advancing and the run should fail loudly
 * rather than spin against a rate-limited API.
 */
const MAX_PAGES = 200;

/**
 * Walks a `page`/`pageSize` collection endpoint to exhaustion.
 *
 * Two differences from the Mailchimp sibling's `count`/`offset` loop, both
 * forced by the API:
 *
 *  - **`page` is 1-based and required.** Omitting it is a 400, not an implicit
 *    first page, so there is no such thing as an unpaginated call here.
 *  - The envelope's row-count field is `total`, not `total_items`.
 *
 * `total` is the authority for when to stop, but the loop also breaks on a
 * short page and is bounded by `MAX_PAGES`, because a `total` that never
 * settles must not become an infinite request loop.
 *
 * The envelope array is named after the resource — `events`, `tags` — with no
 * generic `data` key, so the key cannot be inferred and is a required
 * parameter.
 *
 * @param path - Collection path, including the `/v1` prefix.
 * @param collectionKey - Envelope key holding the array.
 * @param query - Extra query parameters (filters).
 * @param pageSize - Rows per request; clamped to the API maximum of 100.
 * @returns Every row across all pages, in server order.
 */
async function paginate<T>(
  path: string,
  collectionKey: string,
  query: Record<string, QueryValue> = {},
  pageSize = MAX_PAGE_SIZE
): Promise<T[]> {
  const size = Math.max(1, Math.min(pageSize, MAX_PAGE_SIZE));
  const rows: T[] = [];

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const envelope = await humanitixFetch<Record<string, unknown>>({
      path,
      query: { ...query, page, pageSize: size },
    });

    const batch = (envelope[collectionKey] as T[] | undefined) ?? [];
    rows.push(...batch);

    if (batch.length === 0 || batch.length < size) break;

    const total = envelope.total;
    if (typeof total === "number" && rows.length >= total) break;

    if (page === MAX_PAGES) {
      throw makeConfigError(
        `Humanitix pagination exceeded ${MAX_PAGES} pages at ${path} — refusing ` +
          "to keep requesting. Narrow the query, or raise MAX_PAGES if the " +
          "collection really is this large.",
        path
      );
    }
  }

  return rows;
}

// --- Events --------------------------------------------------------------

/** One ticket type on an event. Prices and quantities; no purchaser. */
export interface HumanitixTicketType {
  id: string;
  name: string;
  price: number;
  quantity: number;
  disabled: boolean;
  deleted: boolean;
  isDonation: boolean;
}

/**
 * One occurrence of a recurring event.
 *
 * The spec types this array as `DateRange`, whose id it calls a `DateRangeId`,
 * while `check-in-count` demands an `eventDateId`. The two examples are the
 * same shape of ObjectId and this is the only id an event carries per
 * occurrence, so `getCheckInCount` is expected to take `dates[].id` — but the
 * spec does not say so in as many words.
 *
 * TODO(verify-live): confirm `dates[].id` is accepted as `eventDateId`.
 */
export interface HumanitixEventDate {
  id: string;
  startDate: string;
  endDate: string;
  disabled: boolean;
  deleted: boolean;
}

/** Where an event happens. A venue, not a person's address. */
export interface HumanitixEventLocation {
  type: string;
  venueName: string | null;
  address: string | null;
  latLng: number[] | null;
  onlineUrl: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
}

/**
 * An event as the API reports it, projected to the fields this repo uses.
 *
 * `id` is Humanitix's own **24-character lowercase hex ObjectId**
 * (`5ac598ccd8fe7c0c0f212e2a`). It is *not* the same identifier as the
 * 8-character uppercase `humanitixEventId` already stored in
 * `lib/data/json/humanitix/events.json` (e.g. `K5SJHRMS`), which came from the
 * CSV export; anything joining the API to the archive has to reconcile the two
 * rather than assume they match.
 *
 * A related trap for whoever adds the next field: the leak guard in
 * `lib/data/humanitix.test.ts` greps committed JSON for `[A-Z0-9]{5,12}`, so a
 * lowercase ObjectId slips past it harmlessly — but a **new uppercase,
 * code-shaped** field would trip it, and that test is what stands between this
 * data and another access-code leak. Read it before naming one.
 */
export interface HumanitixEvent {
  id: string;
  name: string;
  slug: string;
  url: string | null;
  public: boolean;
  published: boolean;
  suspendSales: boolean;
  markedAsSoldOut: boolean;
  startDate: string | null;
  endDate: string | null;
  timezone: string;
  totalCapacity: number;
  currency: string;
  ticketTypes: HumanitixTicketType[];
  pricing: { minimumPrice: number; maximumPrice: number } | null;
  dates: HumanitixEventDate[];
  eventLocation: HumanitixEventLocation | null;
  bannerImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  isArchived: boolean;
  isPermanentlyArchived: boolean;
}

/** Raw `/v1/events` row. Only the fields mapped below are declared. */
interface RawEvent {
  _id: string;
  name?: string;
  slug?: string;
  url?: string | null;
  public?: boolean;
  published?: boolean;
  suspendSales?: boolean;
  markedAsSoldOut?: boolean;
  startDate?: string | null;
  endDate?: string | null;
  timezone?: string;
  totalCapacity?: number;
  currency?: string;
  ticketTypes?: {
    _id?: string;
    name?: string;
    price?: number;
    quantity?: number;
    disabled?: boolean;
    deleted?: boolean;
    isDonation?: boolean;
  }[];
  pricing?: { minimumPrice?: number; maximumPrice?: number };
  dates?: {
    _id?: string;
    startDate?: string;
    endDate?: string;
    disabled?: boolean;
    deleted?: boolean;
  }[];
  eventLocation?: {
    type?: string;
    venueName?: string | null;
    address?: string | null;
    latLng?: number[] | null;
    onlineUrl?: string | null;
    city?: string | null;
    region?: string | null;
    country?: string | null;
  };
  bannerImage?: { url?: string } | null;
  createdAt?: string;
  updatedAt?: string;
  isArchived?: boolean;
  isPermanentlyArchived?: boolean;
}

/**
 * Maps one raw event row.
 *
 * **The mapper is the only projection there is.** Mailchimp takes a `fields`
 * query parameter, so its client can stop unwanted data at the server;
 * Humanitix has no equivalent, and the whole event object comes back whatever
 * we ask for. Three of its fields are therefore dropped here on purpose and
 * must stay dropped: `accessibility.contactName` and
 * `accessibility.contactNumber` are a named human being and their phone number
 * — the organiser's accessibility contact — and `userId` identifies the account
 * holder. Nothing in this repo needs any of them, and a field that is never
 * mapped cannot be written into `lib/data/json/` by a later script that trusted
 * this type.
 *
 * Almost every field is optional in the mapper even where the spec marks it
 * required, because a benign default is a better failure than a mapper that
 * throws halfway through a page of otherwise good events.
 *
 * @param raw - The API row.
 * @returns The projected event.
 */
function mapEvent(raw: RawEvent): HumanitixEvent {
  const location = raw.eventLocation;
  return {
    id: raw._id,
    name: raw.name ?? "",
    slug: raw.slug ?? "",
    url: raw.url ?? null,
    public: raw.public ?? false,
    published: raw.published ?? false,
    suspendSales: raw.suspendSales ?? false,
    markedAsSoldOut: raw.markedAsSoldOut ?? false,
    startDate: raw.startDate ?? null,
    endDate: raw.endDate ?? null,
    timezone: raw.timezone ?? "",
    totalCapacity: raw.totalCapacity ?? 0,
    currency: raw.currency ?? "",
    ticketTypes: (raw.ticketTypes ?? []).map((type) => ({
      id: type._id ?? "",
      name: type.name ?? "",
      price: type.price ?? 0,
      quantity: type.quantity ?? 0,
      disabled: type.disabled ?? false,
      deleted: type.deleted ?? false,
      isDonation: type.isDonation ?? false,
    })),
    pricing: raw.pricing
      ? {
          minimumPrice: raw.pricing.minimumPrice ?? 0,
          maximumPrice: raw.pricing.maximumPrice ?? 0,
        }
      : null,
    dates: (raw.dates ?? []).map((date) => ({
      id: date._id ?? "",
      startDate: date.startDate ?? "",
      endDate: date.endDate ?? "",
      disabled: date.disabled ?? false,
      deleted: date.deleted ?? false,
    })),
    eventLocation: location
      ? {
          type: location.type ?? "",
          venueName: location.venueName ?? null,
          address: location.address ?? null,
          latLng: location.latLng ?? null,
          onlineUrl: location.onlineUrl ?? null,
          city: location.city ?? null,
          region: location.region ?? null,
          country: location.country ?? null,
        }
      : null,
    bannerImageUrl: raw.bannerImage?.url ?? null,
    createdAt: raw.createdAt ?? "",
    updatedAt: raw.updatedAt ?? "",
    isArchived: raw.isArchived ?? false,
    isPermanentlyArchived: raw.isPermanentlyArchived ?? false,
  };
}

/**
 * Lists the account's events, paging to exhaustion.
 *
 * Ref: `GET /v1/events`. Envelope: `{ events: [...], total, page, pageSize }`.
 *
 * TODO(verify-live): the spec does not say whether archived events are included
 * by default. `isArchived` and `isPermanentlyArchived` are mapped so a caller
 * can filter either way, but the default has not been observed against the live
 * account — check before treating a count from here as "all our events".
 *
 * @param opts - `inFutureOnly` to skip past events; `since` (ISO 8601) to fetch
 *   only events updated after an instant; `overrideLocation` (ISO 3166-1
 *   alpha-2) to query another region's store — She Sharp's events are `NZ`, and
 *   omitting it uses the key's own region; `pageSize` for rows per request.
 * @returns Every matching event.
 */
export async function listEvents(
  opts: {
    inFutureOnly?: boolean;
    since?: string;
    overrideLocation?: string;
    pageSize?: number;
  } = {}
): Promise<HumanitixEvent[]> {
  const raw = await paginate<RawEvent>(
    "/v1/events",
    "events",
    {
      inFutureOnly: opts.inFutureOnly,
      since: opts.since,
      overrideLocation: opts.overrideLocation,
    },
    opts.pageSize
  );
  return raw.map(mapEvent);
}

/**
 * Fetches one event by its Humanitix ObjectId.
 *
 * Ref: `GET /v1/events/{eventId}`.
 *
 * @param eventId - The 24-hex event id (`HumanitixEvent.id`), **not** the
 *   8-character `humanitixEventId` from the CSV archive.
 * @param opts - `overrideLocation` (ISO 3166-1 alpha-2), when the event lives in
 *   another region's store.
 * @returns The event.
 */
export async function getEvent(
  eventId: string,
  opts: { overrideLocation?: string } = {}
): Promise<HumanitixEvent> {
  const raw = await humanitixFetch<RawEvent>({
    path: `/v1/events/${encodeURIComponent(eventId)}`,
    query: { overrideLocation: opts.overrideLocation },
  });
  return mapEvent(raw);
}

// --- Check-in counts -----------------------------------------------------

/** Check-in totals for one event date, whole and per ticket type. */
export interface HumanitixCheckInCount {
  eventId: string;
  eventDateId: string;
  checkedIn: number;
  ticketTypes: { ticketTypeId: string; ticketTypeName: string; checkedIn: number }[];
}

interface RawCheckInCount {
  eventId?: string;
  eventDateId?: string;
  checkedIn?: number;
  ticketTypes?: { ticketTypeId?: string; ticketTypeName?: string; checkedIn?: number }[];
}

/**
 * Fetches the check-in count for one date of one event.
 *
 * Ref: `GET /v1/events/{eventId}/check-in-count`; `eventDateId` is **required**,
 * so there is no "whole event" form — a recurring event is one call per date.
 *
 * This is the aggregate half of the check-in data. The per-ticket half sits
 * behind `/v1/events/{id}/tickets`, which this module does not implement and
 * must not: a ticket row carries the attendee's name, email and access code.
 *
 * Before comparing a number from here with the archive, read the `checkedIn`
 * caveat in `docs/development/HUMANITIX_ARCHIVE.md`: **26 of the 62 archived
 * instances never ran a check-in at all**, so a 0 usually means nobody scanned
 * rather than nobody came, and this endpoint cannot tell those apart either.
 *
 * @param eventId - The 24-hex event id.
 * @param eventDateId - The date id, expected to be `HumanitixEvent.dates[].id`
 *   (see `HumanitixEventDate`).
 * @returns The check-in totals.
 */
export async function getCheckInCount(
  eventId: string,
  eventDateId: string
): Promise<HumanitixCheckInCount> {
  const raw = await humanitixFetch<RawCheckInCount>({
    path: `/v1/events/${encodeURIComponent(eventId)}/check-in-count`,
    query: { eventDateId },
  });

  return {
    eventId: raw.eventId ?? eventId,
    eventDateId: raw.eventDateId ?? eventDateId,
    checkedIn: raw.checkedIn ?? 0,
    ticketTypes: (raw.ticketTypes ?? []).map((type) => ({
      ticketTypeId: type.ticketTypeId ?? "",
      ticketTypeName: type.ticketTypeName ?? "",
      checkedIn: type.checkedIn ?? 0,
    })),
  };
}

// --- Tags ----------------------------------------------------------------

/**
 * One of the account's event tags.
 *
 * `userId` is deliberately not mapped: it identifies the human whose Humanitix
 * account owns the tag, and nothing here needs it.
 */
export interface HumanitixTag {
  id: string;
  name: string;
  location: string;
  createdAt: string | null;
  updatedAt: string | null;
}

interface RawTag {
  _id: string;
  name?: string;
  location?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

/**
 * Lists the account's tags, paging to exhaustion.
 *
 * Ref: `GET /v1/tags`. Envelope: `{ tags: [...], total, page, pageSize }`.
 *
 * Tags are the account's own event categories ("People & Culture"), so this is
 * the cheapest way to see how events are grouped inside Humanitix without
 * pulling every event.
 *
 * @param opts - `pageSize` for rows per request.
 * @returns Every tag.
 */
export async function listTags(opts: { pageSize?: number } = {}): Promise<HumanitixTag[]> {
  const raw = await paginate<RawTag>("/v1/tags", "tags", {}, opts.pageSize);
  return raw.map((tag) => ({
    id: tag._id,
    name: tag.name ?? "",
    location: tag.location ?? "",
    createdAt: tag.createdAt ?? null,
    updatedAt: tag.updatedAt ?? null,
  }));
}
