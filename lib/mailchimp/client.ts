/**
 * Thin typed wrapper over the Mailchimp Marketing API v3.
 *
 * Why not the `@mailchimp/mailchimp_marketing` npm SDK? It is a generated,
 * callback-era wrapper whose published typings are `any`-shaped, so it buys no
 * type safety over `fetch` while adding a runtime dependency inside `lib/` for
 * a handful of GET endpoints that only hand-run scripts call.
 * `lib/newsletter/resend-api.ts` set that precedent — and the reason — for
 * Resend, and this file is its sibling: same header style, same error shape,
 * snake_case in, camelCase out, doc URLs cited inline where the shape is
 * non-obvious.
 *
 * LOCAL TOOLING ONLY. Nothing under `app/` reads `MAILCHIMP_API_KEY` and
 * nothing may — see `docs/development/MAILCHIMP_ARCHIVE.md` for why the raw
 * audience data never enters this repository, and what that implies for the
 * default field projections below.
 *
 * Ref: https://mailchimp.com/developer/marketing/api/
 * Fields marked `TODO(verify-live)` are asserted from the documentation rather
 * than from a confirmed live call.
 */

// --- Errors --------------------------------------------------------------

/** Error thrown for any non-2xx Mailchimp REST response. */
export interface MailchimpApiError extends Error {
  status: number;
  body: unknown;
  path: string;
}

/**
 * Mailchimp's RFC 7807 problem-detail error body.
 *
 * Ref: https://mailchimp.com/developer/marketing/docs/errors/
 * `detail` is the human-readable sentence ("Your merge fields were invalid."),
 * which is the only part worth putting in an Error message; `title` is the
 * error class and `type` a doc URL.
 */
interface MailchimpProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
}

/**
 * Builds the error thrown for a non-2xx response.
 *
 * @param status - HTTP status code.
 * @param body - Parsed response body (an RFC 7807 problem detail, or text).
 * @param path - Request path, echoed into the message so a failure names the
 *   endpoint without the caller having to add it.
 * @returns The error to throw.
 */
function makeMailchimpApiError(status: number, body: unknown, path: string): MailchimpApiError {
  const detail =
    body && typeof body === "object" && "detail" in body
      ? String((body as MailchimpProblemDetail).detail ?? "")
      : "";
  const message = detail || `Mailchimp API request failed (${status})`;
  const err = new Error(`${message} [${status} ${path}]`) as MailchimpApiError;
  err.name = "MailchimpApiError";
  err.status = status;
  err.body = body;
  err.path = path;
  return err;
}

/**
 * Builds the "cannot even try" error, before any request is made.
 *
 * Uses `status: 0` to mean "no HTTP exchange happened", matching
 * `resend-api.ts`'s missing-key error, so a caller distinguishing
 * misconfiguration from an API rejection can test one field in both.
 *
 * @param message - What is missing and how to supply it.
 * @param path - Request path the caller was attempting.
 * @returns The error to throw.
 */
function makeConfigError(message: string, path: string): MailchimpApiError {
  const err = new Error(message) as MailchimpApiError;
  err.name = "MailchimpApiError";
  err.status = 0;
  err.body = null;
  err.path = path;
  return err;
}

// --- Configuration -------------------------------------------------------

/**
 * Resolves the data-centre server prefix, which IS the hostname.
 *
 * A Mailchimp key is `<32 hex>-<dc>` and every request goes to
 * `https://<dc>.api.mailchimp.com/3.0/`. There is deliberately no default: a
 * guessed prefix sends the request to another tenant's shard, which answers
 * **401** — indistinguishable from a revoked key, and the wrong thing to go
 * debugging for an afternoon. So the prefix comes from the key's own suffix,
 * or from an explicit `MAILCHIMP_SERVER_PREFIX`, or the call fails saying so.
 *
 * @param apiKey - The raw API key.
 * @param path - Request path, for the error message.
 * @returns The data-centre prefix, e.g. `us3`.
 * @throws {MailchimpApiError} When no prefix can be determined.
 */
function resolveServerPrefix(apiKey: string, path: string): string {
  // An explicit override wins: a key issued through OAuth carries no suffix,
  // and the metadata endpoint that reveals its dc is not worth a round trip.
  const explicit = process.env.MAILCHIMP_SERVER_PREFIX?.trim();
  if (explicit) return explicit;

  const dash = apiKey.lastIndexOf("-");
  const suffix = dash === -1 ? "" : apiKey.slice(dash + 1).trim();
  // Shape is two-to-four letters then digits (us3, us21, mc1). Validated rather
  // than merely non-empty, so a key pasted with a trailing "\n" or a stray
  // fragment fails here instead of resolving to a hostname that does not exist.
  if (/^[a-z]{2,4}\d{1,3}$/i.test(suffix)) return suffix.toLowerCase();

  throw makeConfigError(
    "Cannot determine the Mailchimp server prefix. A key looks like " +
      "<32 hex>-<dc> and the <dc> suffix is the hostname " +
      "(https://<dc>.api.mailchimp.com/3.0/). Either paste the key complete " +
      "with its suffix, or set MAILCHIMP_SERVER_PREFIX explicitly.",
    path
  );
}

// --- Concurrency ---------------------------------------------------------

/**
 * Mailchimp allows 10 simultaneous connections per account and answers 429 on
 * the 11th. 8 leaves headroom for anything else holding a connection (a second
 * script, a dashboard export) without the two colliding.
 *
 * Ref: https://mailchimp.com/developer/marketing/docs/fundamentals/#rate-limits
 */
const MAX_CONCURRENT_REQUESTS = 8;

let activeRequests = 0;
const waiting: (() => void)[] = [];

/**
 * Takes a slot in the FIFO concurrency gate, waiting if all are in use.
 *
 * This lives *inside* `mailchimpFetch` rather than being a helper callers wrap
 * around their own `Promise.all`, because a limiter you have to remember is a
 * limiter somebody forgets — and the shape that forgets it, `Promise.all` over
 * 209 campaign reports, is exactly the shape this integration needs. Putting
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
 * 401 retried five times is five chances to trip an account lockout, and a 400
 * retried is five identical rejections — the request is wrong, and waiting does
 * not make it right.
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
 * Jitter matters because the concurrency gate releases up to 8 requests at
 * once; without it they would all back off in lockstep and re-collide.
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
type QueryValue = string | number | undefined;

interface MailchimpFetchOptions {
  /** Path below `/3.0`, with a leading slash. */
  path: string;
  query?: Record<string, QueryValue>;
}

/**
 * Performs an authenticated GET against the Mailchimp Marketing API.
 *
 * The API key is read **lazily, here, on every call** and never at module load.
 * `scripts/email/suppression.ts` statically imports this module, and its
 * `list` / `add` / `check` subcommands must keep working on a machine that has
 * no Mailchimp key at all. (`lib/db/drizzle.ts` throws at module load; that
 * precedent deliberately does not apply — a missing database is fatal to every
 * caller, a missing Mailchimp key is fatal only to the ones that call out.)
 *
 * Every request passes through the concurrency gate and the retry loop; there
 * is no unguarded path to `fetch`.
 *
 * @param options - Path and query parameters.
 * @returns The parsed JSON response body.
 * @throws {MailchimpApiError} When the key or server prefix is missing, or the
 *   response is non-2xx after retries.
 */
async function mailchimpFetch<T>(options: MailchimpFetchOptions): Promise<T> {
  const apiKey = process.env.MAILCHIMP_API_KEY?.trim();
  if (!apiKey) {
    throw makeConfigError("MAILCHIMP_API_KEY is not set", options.path);
  }

  const serverPrefix = resolveServerPrefix(apiKey, options.path);
  const url = new URL(`https://${serverPrefix}.api.mailchimp.com/3.0${options.path}`);
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  // Mailchimp uses HTTP Basic with any non-empty username; the docs use the
  // literal "anystring", and "key" is the convention their own SDKs send.
  // Ref: https://mailchimp.com/developer/marketing/guides/quick-start/
  const authorization = `Basic ${Buffer.from(`key:${apiKey}`).toString("base64")}`;

  await acquireSlot();
  try {
    let lastError: unknown;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      let res: Response;
      try {
        res = await fetch(url, {
          method: "GET",
          headers: { Authorization: authorization, Accept: "application/json" },
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

      const err = makeMailchimpApiError(res.status, parsed, options.path);
      if (!isRetryableStatus(res.status) || attempt === MAX_ATTEMPTS - 1) throw err;
      lastError = err;
      // The slot is held across the backoff on purpose: sleeping inside the
      // gate throttles the whole run, rather than freeing a slot for another
      // request to hit the same rate limit with.
      await sleep(backoffMs(attempt, res.headers.get("retry-after")));
    }

    // Unreachable: the loop either returns or throws on its final attempt.
    throw lastError ?? makeConfigError("Mailchimp request exhausted retries", options.path);
  } finally {
    releaseSlot();
  }
}

// --- Pagination ----------------------------------------------------------

/** Mailchimp caps `count` at 1000; asking for more is a 400, not a clamp. */
const MAX_PAGE_SIZE = 1000;

/**
 * Bounds the paging loop. 500 pages of 1000 is half a million rows — far past
 * anything this account holds, so hitting it means the server is not advancing
 * and the run should fail loudly rather than spin.
 */
const MAX_PAGES = 500;

/**
 * Walks a `count`/`offset` collection endpoint to exhaustion.
 *
 * `total_items` is the authority for when to stop, but the loop also breaks on
 * a short page and is bounded by `MAX_PAGES`, because a `total_items` that
 * never decrements (or a projection that omits it) must not become an infinite
 * request loop against a rate-limited API.
 *
 * The envelope array is named after the resource — `lists`, `members`,
 * `campaigns`, `reports`, `history`, `emails` — with no generic `data` key, so
 * the key cannot be inferred and is a required parameter.
 *
 * Ref: https://mailchimp.com/developer/marketing/docs/methods-parameters/#pagination
 *
 * @param path - Collection path below `/3.0`.
 * @param collectionKey - Envelope key holding the array.
 * @param query - Extra query parameters (filters, `fields`, sort).
 * @param pageSize - Rows per request; clamped to Mailchimp's maximum of 1000.
 * @returns Every row across all pages, in server order.
 */
async function paginate<T>(
  path: string,
  collectionKey: string,
  query: Record<string, QueryValue> = {},
  pageSize = MAX_PAGE_SIZE
): Promise<T[]> {
  const count = Math.max(1, Math.min(pageSize, MAX_PAGE_SIZE));
  const rows: T[] = [];
  let offset = 0;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const envelope = await mailchimpFetch<Record<string, unknown>>({
      path,
      query: { ...query, count, offset },
    });

    const batch = (envelope[collectionKey] as T[] | undefined) ?? [];
    rows.push(...batch);

    if (batch.length === 0 || batch.length < count) break;

    const totalItems = envelope.total_items;
    if (typeof totalItems === "number" && rows.length >= totalItems) break;

    offset += batch.length;

    if (page === MAX_PAGES - 1) {
      throw makeConfigError(
        `Mailchimp pagination exceeded ${MAX_PAGES} pages at ${path} — refusing ` +
          "to keep requesting. Narrow the query, or raise MAX_PAGES if the " +
          "collection really is this large.",
        path
      );
    }
  }

  return rows;
}

/**
 * Joins a `fields` / `exclude_fields` projection into the comma-separated form
 * the API expects, or returns `undefined` so the parameter is dropped.
 *
 * @param fields - Dotted field paths, e.g. `members.email_address`.
 * @returns The joined value, or `undefined` when there is nothing to send.
 */
function projection(fields: readonly string[] | undefined): string | undefined {
  return fields && fields.length > 0 ? fields.join(",") : undefined;
}

// --- Archival access -----------------------------------------------------

/**
 * Fetches an endpoint and returns the response **exactly as Mailchimp sent it**.
 *
 * This exists for one caller — `scripts/mailchimp/fetch-api.ts`, which writes
 * the raw payload into the export vault — and the reason is provenance. The
 * archive's whole audit mechanism is a sha256 over the stored bytes, and a
 * sha256 over a MAPPED object proves nothing about what the API said: it proves
 * what this file's mappers chose to keep. That distinction cost real data once
 * already. `getGrowthHistory()` was written from the published docs, which list
 * `existing`, `imports` and `optins`; the us3 shard sends those as hard zeroes
 * and puts the actual series in seven fields the docs do not mention. A vault
 * written through the mapper stored 86 months of zeroes and a correct-looking
 * checksum over them.
 *
 * **Never call this for `/lists/{id}/members` or `/reports/{id}/email-activity`.**
 * The narrow projections on `listMembers()` and the `ip` exclusion on
 * `getEmailActivity()` are the guard that keeps signup IPs and read-location
 * records out of reach; this function goes around that guard by definition. The
 * archive script pulls those two through the mapped accessors on purpose, and
 * records in the manifest that they are filtered rather than verbatim.
 *
 * @param path - API path with a leading slash.
 * @param collectionKey - The envelope property holding the array, or undefined
 *   for a single-object endpoint that is returned whole.
 * @param query - Extra query parameters.
 * @returns The verbatim rows, or the verbatim object when `collectionKey` is
 *   undefined.
 */
export async function fetchRawForArchive(
  path: string,
  collectionKey: string | undefined,
  query: Record<string, string | number | undefined> = {}
): Promise<unknown> {
  if (collectionKey === undefined) {
    return mailchimpFetch<unknown>({ path, query });
  }
  return paginate<unknown>(path, collectionKey, query);
}

// --- Lists ---------------------------------------------------------------

/** An audience, with the summary statistics Mailchimp keeps against it. */
export interface MailchimpList {
  id: string;
  webId: number;
  name: string;
  dateCreated: string;
  memberCount: number;
  unsubscribeCount: number;
  cleanedCount: number;
  campaignCount: number;
  openRate: number;
  clickRate: number;
  lastSubDate: string | null;
  lastUnsubDate: string | null;
}

/** Raw `/lists` row. Only the fields mapped below are declared. */
interface RawList {
  id: string;
  web_id?: number;
  name?: string;
  date_created?: string;
  stats?: {
    member_count?: number;
    unsubscribe_count?: number;
    cleaned_count?: number;
    campaign_count?: number;
    open_rate?: number;
    click_rate?: number;
    last_sub_date?: string | null;
    last_unsub_date?: string | null;
  };
}

/**
 * Maps one raw list row.
 *
 * Everything below `stats` is optional in the mapper because a caller passing a
 * narrower `fields` projection gets a partial object back, and a missing count
 * should read as 0 rather than crash the mapper.
 *
 * @param raw - The API row.
 * @returns The camelCase list.
 */
function mapList(raw: RawList): MailchimpList {
  const stats = raw.stats ?? {};
  return {
    id: raw.id,
    webId: raw.web_id ?? 0,
    name: raw.name ?? "",
    dateCreated: raw.date_created ?? "",
    memberCount: stats.member_count ?? 0,
    unsubscribeCount: stats.unsubscribe_count ?? 0,
    cleanedCount: stats.cleaned_count ?? 0,
    campaignCount: stats.campaign_count ?? 0,
    openRate: stats.open_rate ?? 0,
    clickRate: stats.click_rate ?? 0,
    lastSubDate: stats.last_sub_date ?? null,
    lastUnsubDate: stats.last_unsub_date ?? null,
  };
}

/**
 * Lists every audience on the account.
 *
 * Ref: https://mailchimp.com/developer/marketing/api/lists/get-lists-info/
 * Envelope: `{ lists: [...], total_items }`.
 *
 * Used to verify `MAILCHIMP_LIST_ID` against the live account rather than
 * trusting the environment — `She#` is the only audience, but a wrong id
 * silently reports another list's numbers.
 *
 * @returns Every audience.
 */
export async function getLists(): Promise<MailchimpList[]> {
  const raw = await paginate<RawList>("/lists", "lists");
  return raw.map(mapList);
}

/**
 * Fetches one audience by id.
 *
 * Ref: https://mailchimp.com/developer/marketing/api/lists/get-list-info/
 *
 * @param listId - The audience id (`MAILCHIMP_LIST_ID`).
 * @returns The audience.
 */
export async function getList(listId: string): Promise<MailchimpList> {
  const raw = await mailchimpFetch<RawList>({ path: `/lists/${listId}` });
  return mapList(raw);
}

// --- Members -------------------------------------------------------------

/** A subscriber status as Mailchimp reports it. */
export type MailchimpMemberStatus =
  | "subscribed"
  | "unsubscribed"
  | "cleaned"
  | "pending"
  | "transactional"
  | "archived";

/**
 * One audience member.
 *
 * `id` is the **md5 of the lowercased email address** — Mailchimp's subscriber
 * hash. It is a per-person identifier and reverses trivially against any list
 * of candidate addresses, so it is vault-and-memory only: it must never reach
 * `lib/data/json/` or any other committed file. See
 * `docs/development/MAILCHIMP_ARCHIVE.md`.
 */
export interface MailchimpMember {
  id: string;
  emailAddress: string;
  status: MailchimpMemberStatus | string;
  timestampOpt: string | null;
  lastChanged: string | null;
  memberRating: number;
  unsubscribeReason: string | null;
  tags: string[];
}

/** Raw `/lists/{id}/members` row, restricted to the default projection. */
interface RawMember {
  id: string;
  email_address?: string;
  status?: string;
  timestamp_opt?: string | null;
  last_changed?: string | null;
  member_rating?: number;
  unsubscribe_reason?: string | null;
  tags?: { id?: number; name?: string }[];
}

/**
 * The default `fields` projection for member reads.
 *
 * This is a **guard, not an optimisation**. The full member object carries
 * `ip_signup`, `ip_opt`, `location{latitude,longitude,country_code,timezone}`
 * and `merge_fields` (name, phone, street address) — the `person-network` and
 * `person-sensitive` classes this archive exists to keep out of the
 * repository. Narrowing by default means asking for that data back has to be
 * typed out on purpose, at a call site a reviewer can see.
 */
const DEFAULT_MEMBER_FIELDS = [
  "members.id",
  "members.email_address",
  "members.status",
  "members.timestamp_opt",
  "members.last_changed",
  "members.unsubscribe_reason",
  "members.member_rating",
  "members.tags",
  "total_items",
] as const;

/**
 * Lists audience members, paging to exhaustion.
 *
 * Ref: https://mailchimp.com/developer/marketing/api/list-members/list-members-info/
 * Envelope: `{ members: [...], list_id, total_items }`.
 *
 * @param listId - The audience id.
 * @param opts - Status/date filters, sort, page size, and an optional `fields`
 *   override (see `DEFAULT_MEMBER_FIELDS` before widening it).
 * @returns Every matching member.
 */
export async function listMembers(
  listId: string,
  opts: {
    status?: MailchimpMemberStatus | string;
    sinceLastChanged?: string;
    beforeLastChanged?: string;
    sinceTimestampOpt?: string;
    sortField?: "timestamp_opt" | "timestamp_signup" | "last_changed" | string;
    sortDir?: "ASC" | "DESC";
    fields?: readonly string[];
    pageSize?: number;
  } = {}
): Promise<MailchimpMember[]> {
  const raw = await paginate<RawMember>(
    `/lists/${listId}/members`,
    "members",
    {
      fields: projection(opts.fields ?? DEFAULT_MEMBER_FIELDS),
      status: opts.status,
      since_last_changed: opts.sinceLastChanged,
      before_last_changed: opts.beforeLastChanged,
      since_timestamp_opt: opts.sinceTimestampOpt,
      sort_field: opts.sortField,
      sort_dir: opts.sortDir,
    },
    opts.pageSize
  );

  return raw.map((member) => ({
    id: member.id,
    emailAddress: member.email_address ?? "",
    status: member.status ?? "",
    timestampOpt: member.timestamp_opt ?? null,
    lastChanged: member.last_changed ?? null,
    memberRating: member.member_rating ?? 0,
    unsubscribeReason: member.unsubscribe_reason ?? null,
    // Tags arrive as `{ id, name }`; only the name carries meaning downstream
    // and the numeric id is account-local, so the objects are flattened here.
    tags: (member.tags ?? []).map((tag) => tag.name ?? "").filter(Boolean),
  }));
}

// --- Growth history ------------------------------------------------------

/**
 * One month of audience growth.
 *
 * `subscribed` is the count of subscribed members **at the end of that month**,
 * not that month's additions. Verified 2026-08-27: the final row returned
 * `subscribed=1555, unsubscribed=806, cleaned=550`, which is exactly what
 * `GET /lists` reported for the same audience in the same minute. The series is
 * therefore a stock, not a flow, and it is not monotonic — people leave.
 *
 * This is the list-size-over-time series `docs/development/MAILCHIMP_ARCHIVE.md`
 * records as unrecoverable from the CSV export. It is recoverable, from here: a
 * status-partitioned export is a snapshot, and Mailchimp kept the monthly
 * snapshot server-side the whole time.
 */
export interface MailchimpGrowthMonth {
  month: string;
  subscribed: number;
  unsubscribed: number;
  cleaned: number;
  pending: number;
  reconfirm: number;
  deleted: number;
  transactional: number;
  /**
   * Legacy counters, kept only so a reader who finds them in the raw payload
   * knows they were seen and rejected.
   *
   * Mailchimp still emits `existing`, `imports` and `optins` on every row and
   * every one of them is **hard zero** — all 86 months of this audience, back
   * to 2019-07. They are the documented fields, which is the trap: a mapper
   * written from the docs alone (this one was) reads three zeros and reports a
   * flat line, and a flat line looks like data. Never chart these.
   */
  legacyZeroes: { existing: number; imports: number; optins: number };
}

interface RawGrowthMonth {
  month?: string;
  subscribed?: number;
  unsubscribed?: number;
  cleaned?: number;
  pending?: number;
  reconfirm?: number;
  deleted?: number;
  transactional?: number;
  existing?: number;
  imports?: number;
  optins?: number;
}

/**
 * Fetches the audience's month-by-month growth history.
 *
 * Ref: https://mailchimp.com/developer/marketing/api/list-growth-history/list-growth-history-data/
 * Envelope: `{ history: [...], list_id, total_items }`; `month` is `YYYY-MM`.
 *
 * Verified against a live us3 call on 2026-08-27: the shard sends BOTH the
 * three documented fields (`existing`, `imports`, `optins` — all zero, always)
 * and the seven undocumented ones that actually carry the data. See
 * `MailchimpGrowthMonth` for why the zeroes are kept rather than dropped.
 *
 * @param listId - The audience id.
 * @param opts - Sort and page size.
 * @returns Every month on record, in server order.
 */
export async function getGrowthHistory(
  listId: string,
  opts: {
    sortField?: "month" | string;
    sortDir?: "ASC" | "DESC";
    fields?: readonly string[];
    pageSize?: number;
  } = {}
): Promise<MailchimpGrowthMonth[]> {
  const raw = await paginate<RawGrowthMonth>(
    `/lists/${listId}/growth-history`,
    "history",
    {
      fields: projection(opts.fields),
      sort_field: opts.sortField,
      sort_dir: opts.sortDir,
    },
    opts.pageSize
  );

  return raw.map((row) => ({
    month: row.month ?? "",
    subscribed: row.subscribed ?? 0,
    unsubscribed: row.unsubscribed ?? 0,
    cleaned: row.cleaned ?? 0,
    pending: row.pending ?? 0,
    reconfirm: row.reconfirm ?? 0,
    deleted: row.deleted ?? 0,
    transactional: row.transactional ?? 0,
    legacyZeroes: {
      existing: row.existing ?? 0,
      imports: row.imports ?? 0,
      optins: row.optins ?? 0,
    },
  }));
}

// --- Campaigns -----------------------------------------------------------

/**
 * One campaign.
 *
 * **`settings.from_name` and `settings.reply_to` are deliberately not mapped.**
 * `reply_to` is an email address, and the only downstream consumer of this type
 * is a committed file that a CI leak guard greps for `@`. Not mapping the field
 * is cheaper — and far more reliable — than remembering to strip it at every
 * point where a campaign is written out.
 */
export interface MailchimpCampaign {
  id: string;
  webId: number;
  type: string;
  status: string;
  createTime: string;
  sendTime: string | null;
  emailsSent: number;
  listId: string | null;
  listName: string | null;
  recipientCount: number;
  archiveUrl: string | null;
  title: string;
  subjectLine: string;
  previewText: string;
}

interface RawCampaign {
  id: string;
  web_id?: number;
  type?: string;
  status?: string;
  create_time?: string;
  send_time?: string | null;
  emails_sent?: number;
  archive_url?: string | null;
  recipients?: { list_id?: string; list_name?: string; recipient_count?: number };
  settings?: { title?: string; subject_line?: string; preview_text?: string };
}

/**
 * Maps one raw campaign row, dropping the sender identity fields.
 *
 * @param raw - The API row.
 * @returns The camelCase campaign.
 */
function mapCampaign(raw: RawCampaign): MailchimpCampaign {
  const recipients = raw.recipients ?? {};
  const settings = raw.settings ?? {};
  return {
    id: raw.id,
    webId: raw.web_id ?? 0,
    type: raw.type ?? "",
    status: raw.status ?? "",
    createTime: raw.create_time ?? "",
    sendTime: raw.send_time ?? null,
    emailsSent: raw.emails_sent ?? 0,
    listId: recipients.list_id ?? null,
    // The audience name ("She#"), not a person — safe to commit.
    listName: recipients.list_name ?? null,
    recipientCount: recipients.recipient_count ?? 0,
    archiveUrl: raw.archive_url ?? null,
    title: settings.title ?? "",
    subjectLine: settings.subject_line ?? "",
    previewText: settings.preview_text ?? "",
  };
}

/**
 * Lists campaigns, paging to exhaustion.
 *
 * Ref: https://mailchimp.com/developer/marketing/api/campaigns/list-campaigns/
 * Envelope: `{ campaigns: [...], total_items }`.
 *
 * @param opts - Audience/status/type filters, send-time window, sort, page size.
 * @returns Every matching campaign.
 */
export async function listCampaigns(
  opts: {
    listId?: string;
    status?: "save" | "paused" | "schedule" | "sending" | "sent" | string;
    type?: "regular" | "plaintext" | "absplit" | "rss" | "variate" | string;
    sinceSendTime?: string;
    beforeSendTime?: string;
    sortField?: "create_time" | "send_time" | string;
    sortDir?: "ASC" | "DESC";
    fields?: readonly string[];
    pageSize?: number;
  } = {}
): Promise<MailchimpCampaign[]> {
  const raw = await paginate<RawCampaign>(
    "/campaigns",
    "campaigns",
    {
      fields: projection(opts.fields),
      list_id: opts.listId,
      status: opts.status,
      type: opts.type,
      since_send_time: opts.sinceSendTime,
      before_send_time: opts.beforeSendTime,
      sort_field: opts.sortField,
      sort_dir: opts.sortDir,
    },
    opts.pageSize
  );
  return raw.map(mapCampaign);
}

// --- Reports -------------------------------------------------------------

/** Aggregate performance for one sent campaign. No per-person data. */
export interface MailchimpReport {
  campaignId: string;
  campaignTitle: string;
  subjectLine: string;
  previewText: string;
  sendTime: string | null;
  emailsSent: number;
  abuseReports: number;
  unsubscribed: number;
  forwards: number;
  hardBounces: number;
  softBounces: number;
  syntaxErrors: number;
  opensTotal: number;
  uniqueOpens: number;
  openRate: number;
  lastOpen: string | null;
  clicksTotal: number;
  uniqueClicks: number;
  uniqueSubscriberClicks: number;
  clickRate: number;
  lastClick: string | null;
}

interface RawReport {
  id: string;
  campaign_title?: string;
  subject_line?: string;
  preview_text?: string;
  send_time?: string | null;
  emails_sent?: number;
  abuse_reports?: number;
  unsubscribed?: number;
  forwards?: { forwards_count?: number; forwards_opens?: number };
  bounces?: { hard_bounces?: number; soft_bounces?: number; syntax_errors?: number };
  opens?: {
    opens_total?: number;
    unique_opens?: number;
    open_rate?: number;
    last_open?: string | null;
  };
  clicks?: {
    clicks_total?: number;
    unique_clicks?: number;
    unique_subscriber_clicks?: number;
    click_rate?: number;
    last_click?: string | null;
  };
}

/**
 * Maps one raw report row.
 *
 * `forwards` is flattened from `forwards.forwards_count`: Mailchimp nests a
 * count and an opens figure there, and only the count is a forward.
 *
 * @param raw - The API row.
 * @returns The camelCase report.
 */
function mapReport(raw: RawReport): MailchimpReport {
  const bounces = raw.bounces ?? {};
  const opens = raw.opens ?? {};
  const clicks = raw.clicks ?? {};
  return {
    campaignId: raw.id,
    campaignTitle: raw.campaign_title ?? "",
    subjectLine: raw.subject_line ?? "",
    previewText: raw.preview_text ?? "",
    sendTime: raw.send_time ?? null,
    emailsSent: raw.emails_sent ?? 0,
    abuseReports: raw.abuse_reports ?? 0,
    unsubscribed: raw.unsubscribed ?? 0,
    forwards: raw.forwards?.forwards_count ?? 0,
    hardBounces: bounces.hard_bounces ?? 0,
    softBounces: bounces.soft_bounces ?? 0,
    syntaxErrors: bounces.syntax_errors ?? 0,
    opensTotal: opens.opens_total ?? 0,
    uniqueOpens: opens.unique_opens ?? 0,
    openRate: opens.open_rate ?? 0,
    lastOpen: opens.last_open ?? null,
    clicksTotal: clicks.clicks_total ?? 0,
    uniqueClicks: clicks.unique_clicks ?? 0,
    uniqueSubscriberClicks: clicks.unique_subscriber_clicks ?? 0,
    clickRate: clicks.click_rate ?? 0,
    lastClick: clicks.last_click ?? null,
  };
}

/**
 * Lists campaign reports, paging to exhaustion.
 *
 * Ref: https://mailchimp.com/developer/marketing/api/campaign-reports/list-campaign-reports/
 * Envelope: `{ reports: [...], total_items }`.
 *
 * @param opts - Campaign type filter, send-time window, page size.
 * @returns Every matching report.
 */
export async function listReports(
  opts: {
    type?: "regular" | "plaintext" | "absplit" | "rss" | "variate" | string;
    sinceSendTime?: string;
    beforeSendTime?: string;
    fields?: readonly string[];
    pageSize?: number;
  } = {}
): Promise<MailchimpReport[]> {
  const raw = await paginate<RawReport>(
    "/reports",
    "reports",
    {
      fields: projection(opts.fields),
      type: opts.type,
      since_send_time: opts.sinceSendTime,
      before_send_time: opts.beforeSendTime,
    },
    opts.pageSize
  );
  return raw.map(mapReport);
}

/**
 * Fetches one campaign's report.
 *
 * Ref: https://mailchimp.com/developer/marketing/api/campaign-reports/get-campaign-report/
 *
 * @param campaignId - The campaign id.
 * @returns The report.
 */
export async function getCampaignReport(campaignId: string): Promise<MailchimpReport> {
  const raw = await mailchimpFetch<RawReport>({ path: `/reports/${campaignId}` });
  return mapReport(raw);
}

// --- Email activity ------------------------------------------------------

/** One recorded action a recipient took on a campaign. */
export interface MailchimpActivityEvent {
  action: string;
  timestamp: string;
  url?: string;
  type?: string;
}

/** Per-recipient activity for one campaign. */
export interface MailchimpEmailActivity {
  emailId: string;
  emailAddress: string;
  activity: MailchimpActivityEvent[];
}

interface RawEmailActivity {
  email_id?: string;
  email_address?: string;
  activity?: { action?: string; timestamp?: string; url?: string; type?: string; ip?: string }[];
}

/**
 * Fetches per-recipient open/click/bounce activity for one campaign.
 *
 * Ref: https://mailchimp.com/developer/marketing/api/email-activity-reports/list-email-activity/
 * Envelope: `{ emails: [...], campaign_id, total_items }`.
 *
 * **`activity[].ip` is excluded from the request and dropped by the mapper.**
 * An IP address against an open timestamp is a location record for the moment
 * somebody read a women-in-tech newsletter — precisely the `person-network`
 * class this archive is shaped to refuse. Both halves are deliberate: the
 * `exclude_fields` parameter stops it arriving, and the mapper drops it anyway
 * so a change to that parameter cannot leak it.
 *
 * When only the openers are wanted, `/reports/{id}/open-details` is the cheaper
 * endpoint. This one exists because it is the only place clicks and bounces
 * appear alongside opens on the same recipient.
 *
 * TODO(verify-live): `exclude_fields` on a field nested inside an array
 * (`emails.activity.ip`) is documented but unconfirmed against us3. The mapper
 * is the guarantee; the parameter is the optimisation.
 *
 * @param campaignId - The campaign id.
 * @param opts - Optional `since` timestamp (ISO 8601) and page size.
 * @returns Activity per recipient, with IP addresses removed.
 */
export async function getEmailActivity(
  campaignId: string,
  opts: { since?: string; pageSize?: number } = {}
): Promise<MailchimpEmailActivity[]> {
  const raw = await paginate<RawEmailActivity>(
    `/reports/${campaignId}/email-activity`,
    "emails",
    {
      exclude_fields: "emails.activity.ip",
      since: opts.since,
    },
    opts.pageSize
  );

  return raw.map((row) => ({
    emailId: row.email_id ?? "",
    emailAddress: row.email_address ?? "",
    activity: (row.activity ?? []).map((event) => {
      const mapped: MailchimpActivityEvent = {
        action: event.action ?? "",
        timestamp: event.timestamp ?? "",
      };
      if (event.url !== undefined) mapped.url = event.url;
      if (event.type !== undefined) mapped.type = event.type;
      return mapped;
    }),
  }));
}
