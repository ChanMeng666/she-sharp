/**
 * The one Humanitix figure that only the attendee endpoint can answer: how many
 * tickets a listing has sold.
 *
 * ---------------------------------------------------------------------------
 * THIS IS A PII CALL WHOSE BODY IS THROWN AWAY. IT IS NOT A PII-FREE CALL.
 * ---------------------------------------------------------------------------
 *
 * `GET /v1/events/{eventId}/tickets` is the single most sensitive endpoint on
 * the Humanitix API: a ticket row carries the attendee's name, email address,
 * mobile, street address, the free-text dietary/accessibility/photo-consent
 * answers, and the **access code** they redeemed. `lib/humanitix/client.ts`
 * deliberately does not implement it, and its header says why in as many words:
 * "a function that does not exist cannot be imported from `app/` by mistake —
 * that absence is the safety mechanism".
 *
 * That mechanism is preserved here by location. This module lives under
 * `scripts/`, which nothing in `app/`, `lib/` or `components/` imports, so the
 * capability exists exactly where a person runs it by hand and nowhere a request
 * handler could reach. **Do not move this function into `lib/`, and do not
 * re-export it from `lib/humanitix/client.ts`.**
 *
 * What it does with the response:
 *
 *  - It asks for `pageSize=1`, the API minimum (`PaginationPageSize` is
 *    `minimum: 1`; there is no `pageSize=0`). **One real ticket therefore comes
 *    back over the wire**, with everything above on it. This is the cost of the
 *    count and it should be stated out loud rather than glossed as "metadata".
 *  - It reads `total` off the pagination envelope and nothing else. The body is
 *    parsed with a reviver that **drops the `tickets` key entirely**, so the
 *    object this module holds cannot carry an attendee even if a later edit
 *    logs it, serialises it, or returns it by mistake.
 *  - Nothing is written to disk, and no failure message ever quotes the
 *    response body — an error names the status code and the event id, both of
 *    which are Humanitix's own identifiers rather than anybody's data.
 *
 * `status` defaults to `"complete"` so cancelled tickets are excluded. That is
 * not a preference: `lib/data/json/humanitix/events.json` counts `registered`
 * from the CSV export's spine, which `lib/data/json/humanitix/manifest.json`
 * records as `filter: "complete"`, and `scripts/humanitix/build-archive.ts`
 * accumulates cancelled tickets into a *separate* `cancelled` field. A count
 * taken any other way would not be comparable with the number already on the
 * site.
 *
 * Transport is a minimal duplicate of `lib/humanitix/client.ts` — the same
 * `x-api-key` header, the same lazy env read, the same "429 and 5xx only" retry
 * rule and the same rate budget — because that module exports its four
 * endpoints and none of its transport. Copying ~60 lines is the cheaper of the
 * two options; the alternative is exporting `humanitixFetch`, which would hand
 * every future caller an unrestricted path to *any* Humanitix endpoint from
 * `lib/`, including the four the file exists to keep out of reach.
 *
 * Ref: https://api.humanitix.com/v1/documentation/json (OpenAPI, read
 * 2026-08-27).
 */

const HUMANITIX_BASE_URL = "https://api.humanitix.com";

// --- Rate budget ---------------------------------------------------------

/**
 * Humanitix publishes 200 requests per minute; the sibling client targets 80%
 * of it for the reasons written there. The two budgets are independent counters
 * in the same process, which would matter if a caller interleaved them — the
 * one caller that exists, `verify-live-events.ts`, awaits its `listEvents()`
 * page walk to completion before the first count is requested, so in practice
 * only one budget is ever spending.
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
 * instant. There is no companion semaphore here, unlike the sibling client: a
 * semaphore bounds sockets, and it is this interval that enforces the published
 * *rate*, whether the caller is serial or hands the module to `Promise.all`.
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

// --- Errors --------------------------------------------------------------

/**
 * Error thrown by this module. `status` is 0 when no HTTP exchange happened,
 * matching the convention in `lib/humanitix/client.ts`.
 *
 * There is no `body` field, and that is the point: the sibling client attaches
 * the parsed response to its error because none of its endpoints can return a
 * person. This one's can, so the error carries the status and the event id and
 * stops there.
 */
export interface TicketCountError extends Error {
  status: number;
  eventId: string;
}

/**
 * Builds the error for a failed count.
 *
 * @param message - What went wrong, in one sentence, quoting no response data.
 * @param status - HTTP status, or 0 when the request was never made.
 * @param eventId - The Humanitix event id the caller asked about.
 * @returns The error to throw.
 */
function makeTicketCountError(message: string, status: number, eventId: string): TicketCountError {
  const err = new Error(message) as TicketCountError;
  err.name = "HumanitixTicketCountError";
  err.status = status;
  err.eventId = eventId;
  return err;
}

// --- The count -----------------------------------------------------------

/**
 * The pagination envelope, with the ticket array already gone.
 *
 * `tickets` is not declared here on purpose — the type is the second guard
 * behind the reviver, so a later edit reaching for a ticket does not compile.
 */
interface CountEnvelope {
  total?: unknown;
  page?: unknown;
  pageSize?: unknown;
}

/**
 * Parses a tickets response into an envelope with no tickets in it.
 *
 * `JSON.parse` is given a reviver that returns `undefined` for the `tickets`
 * key, which deletes the property: the object handed back cannot contain an
 * attendee, so nothing downstream — a `console.log`, a JSON dump, a debugger —
 * can leak one no matter what it does with the return value. The individual
 * ticket fields still pass through the reviver transiently during parsing;
 * short of the API growing a `fields` projection, that is unavoidable, and
 * nothing retains them.
 *
 * @param text - The raw response body.
 * @returns The envelope, or null when the body is not JSON.
 */
function parseEnvelopeDroppingTickets(text: string): CountEnvelope | null {
  try {
    const parsed: unknown = JSON.parse(text, (key, value: unknown) =>
      key === "tickets" ? undefined : value
    );
    return parsed && typeof parsed === "object" ? (parsed as CountEnvelope) : null;
  } catch {
    return null;
  }
}

/** Options for {@link getTicketCount}. */
export interface TicketCountOptions {
  /**
   * Restrict the count to one occurrence of a recurring listing. Omitted, the
   * count spans every date the listing has — which is the right figure for a
   * one-off event and an over-count for a single session of a series.
   */
  eventDateId?: string;
  /**
   * Which tickets to count. Defaults to `"complete"`, the same population the
   * archive's `registered` figure counts; see the file header.
   */
  status?: "complete" | "cancelled";
  /** ISO 3166-1 alpha-2, when the listing lives in another region's store. */
  overrideLocation?: string;
}

/**
 * Counts the tickets on one Humanitix listing.
 *
 * **This issues one request to the attendee endpoint and discards its body.**
 * The returned number is a REGISTRATION count — it is comparable with the
 * site's `attendees` field and with the archive's `registered`, and it is not
 * attendance. Attendance is the check-in count, which `getCheckInCount()` in
 * `lib/humanitix/client.ts` reads without touching a ticket at all; a sold
 * ticket says somebody paid, never that they came.
 *
 * @param eventId - The 24-hex Humanitix event id (`HumanitixEvent.id`), not the
 *   8-character `humanitixEventId` from the CSV archive.
 * @param options - Date, status and region filters; see {@link TicketCountOptions}.
 * @returns The envelope's `total` for the filtered query.
 * @throws {TicketCountError} When the key is missing, the response is non-2xx
 *   after retries, or the envelope carries no usable `total`. The message names
 *   the status and the event id and quotes nothing from the body.
 */
export async function getTicketCount(
  eventId: string,
  options: TicketCountOptions = {}
): Promise<number> {
  const apiKey = process.env.HUMANITIX_API_KEY?.trim();
  if (!apiKey) {
    throw makeTicketCountError(
      "HUMANITIX_API_KEY is not set. Generate one at " +
        "https://console.humanitix.com/console/account/advanced/api-key and put it in .env — " +
        "it is local tooling only and must not be set in Vercel.",
      0,
      eventId
    );
  }

  const path = `/v1/events/${encodeURIComponent(eventId)}/tickets`;
  const url = new URL(`${HUMANITIX_BASE_URL}${path}`);
  // `page` is 1-based and required — omitting it is a 400, not an implied first
  // page. `pageSize=1` is the smallest the API accepts, so exactly one ticket
  // is transferred and thrown away; see the file header.
  url.searchParams.set("page", "1");
  url.searchParams.set("pageSize", "1");
  url.searchParams.set("status", options.status ?? "complete");
  if (options.eventDateId) url.searchParams.set("eventDateId", options.eventDateId);
  if (options.overrideLocation) url.searchParams.set("overrideLocation", options.overrideLocation);

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
        throw makeTicketCountError(
          `Humanitix ticket count failed for ${eventId}: network error.`,
          0,
          eventId
        );
      }
      await sleep(backoffMs(attempt, null));
      continue;
    }

    if (res.ok) {
      const envelope = parseEnvelopeDroppingTickets(await res.text());
      const total = envelope?.total;
      if (typeof total !== "number" || !Number.isFinite(total)) {
        throw makeTicketCountError(
          `Humanitix ticket count for ${eventId} returned no numeric \`total\` on the ` +
            "pagination envelope. The response was discarded unread, so there is nothing " +
            "further to report — check the endpoint in the Humanitix console.",
          res.status,
          eventId
        );
      }
      return total;
    }

    lastStatus = res.status;
    if (!isRetryableStatus(res.status) || attempt === MAX_ATTEMPTS - 1) break;

    // The body is not read on a retry either: an error body is not expected to
    // carry a person, but "not expected to" is not a rule this module relies on.
    await sleep(backoffMs(attempt, res.headers.get("retry-after")));
  }

  throw makeTicketCountError(
    `Humanitix ticket count failed for ${eventId} (HTTP ${lastStatus}). The response body ` +
      "is deliberately not reported: this endpoint returns attendee records.",
    lastStatus,
    eventId
  );
}
