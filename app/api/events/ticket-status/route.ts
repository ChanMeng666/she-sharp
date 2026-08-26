/**
 * Public ticket status for the site's upcoming events.
 *
 * `GET /api/events/ticket-status` → `{ [siteSlug]: TicketStatus }`, one entry
 * per upcoming event on the site. The client hook (`hooks/use-ticket-status.ts`)
 * turns a `"sold-out"` or `"closed"` into a disabled button; everything else
 * renders the page exactly as it renders today.
 *
 * Three rules this file exists to hold:
 *
 * 1. **No counts, ever.** The response carries three booleans reduced to one
 *    word. Tickets remaining, capacity and headcount are all available upstream
 *    and none of them may cross this boundary — `docs/development/CONTENT_RULES.md`
 *    defines `event.attendees` as a historical registrations snapshot, and a
 *    live number on the page would silently redefine it.
 * 2. **Every failure is a 200 of `"unknown"`.** Missing key, no Redis, a
 *    Humanitix outage, a timeout: the page must degrade to what it looked like
 *    before this feature existed. A 500 here would put a console error on a
 *    marketing page for no gain, and an error body would leak whether the key is
 *    configured. Same posture as `app/api/newsletter/subscribe/route.ts`.
 * 3. **Upcoming events only.** There are two. Fanning out over ~98 past events
 *    would spend the Humanitix rate budget on answers nobody renders.
 *
 * Note the tension with `lib/humanitix/client.ts`, whose header says "LOCAL
 * TOOLING ONLY. Nothing under `app/` reads `HUMANITIX_API_KEY` and nothing may."
 * That rule guards **PII**, and this route is why the client implements only the
 * PII-free half: `listEvents` returns event metadata, no attendee. Do not reach
 * for `/orders` or `/tickets` from here — those functions do not exist, which is
 * the safety mechanism.
 */

import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { getChatRedis } from "@/lib/chatbot/redis";
import { listEvents, type HumanitixEvent } from "@/lib/humanitix/client";
import { getUpcomingEvents } from "@/lib/data/events";
import type { TicketStatus, TicketStatusMap } from "@/hooks/use-ticket-status";

/**
 * Never prerendered at build time. Without this, a build could bake a status
 * into the route's output — and with an empty `HUMANITIX_API_KEY` at build time
 * (which is what production looks like today) that baked answer would be
 * `"unknown"` forever. Freshness comes from the CDN headers below instead.
 */
export const dynamic = "force-dynamic";

/** How long a fetched result is served without going back to Humanitix. */
const SOFT_TTL_MS = 5 * 60_000;

/**
 * How long the cached result survives in Redis — three times the soft TTL, so a
 * Humanitix outage is answered from a slightly stale cache rather than with
 * `"unknown"`. Matches `stale-while-revalidate` below.
 */
const HARD_TTL_SECONDS = 900;

const CACHE_KEY = "events:ticket-status:v1";

/**
 * Upstream budget. `lib/humanitix/client.ts` retries five times with backoff, so
 * a bad day there can run tens of seconds — well past a serverless function's
 * default limit. Six seconds is generous enough for the "first request after a
 * quiet period takes a few seconds" the Humanitix docs warn about, and short
 * enough that the handler returns rather than being killed mid-flight.
 */
const UPSTREAM_TIMEOUT_MS = 6_000;

/** Cached payload, with its own timestamp so staleness is decidable on read. */
interface CachedStatuses {
  statuses: TicketStatusMap;
  fetchedAt: number;
}

// --- Rate limiting -------------------------------------------------------

let ratelimit: Ratelimit | null = null;
let rateLimitInitialised = false;

/** Lazily build the limiter, or null when Redis is unconfigured. */
function getTicketStatusRateLimit(): Ratelimit | null {
  if (rateLimitInitialised) return ratelimit;
  rateLimitInitialised = true;

  const redis = getChatRedis();
  if (!redis) return null;

  ratelimit = new Ratelimit({
    redis,
    // Higher than the newsletter limiter because this fires on page load, not on
    // a deliberate opt-in: a person opening several event tabs is normal.
    limiter: Ratelimit.slidingWindow(60, "1 m"),
    prefix: "events_ticket_status_rl",
    analytics: false,
  });
  return ratelimit;
}

/** Best-effort client identifier for rate limiting. */
function getClientId(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "anonymous";
}

/** Rate-limit check that degrades open on any limiter failure. */
async function checkRateLimit(identifier: string): Promise<boolean> {
  const rl = getTicketStatusRateLimit();
  if (!rl) return true;

  try {
    const { success } = await rl.limit(identifier);
    return success;
  } catch (error) {
    console.error("[TicketStatus] Rate limit check failed, allowing request:", error);
    return true;
  }
}

// --- Joining site events to Humanitix events -----------------------------

/**
 * Extracts the Humanitix event slug from a registration URL.
 *
 * Every link in `lib/data/json/` is flat — `https://events.humanitix.com/<slug>`
 * — with a `/tickets` suffix on some, so the **first** path segment is the slug
 * and later segments are Humanitix's own routing.
 *
 * @param url - A registration or Humanitix URL, possibly for another ticketing
 *   provider entirely.
 * @returns The lower-cased slug, or null when the URL is not a Humanitix event
 *   link (Eventbrite, a Google Form, an empty string).
 */
function humanitixSlugFromUrl(url: string | undefined): string | null {
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (!/(^|\.)humanitix\.com$/i.test(parsed.hostname)) return null;

  const first = parsed.pathname.split("/").filter(Boolean)[0];
  if (!first) return null;

  try {
    return decodeURIComponent(first).toLowerCase();
  } catch {
    return first.toLowerCase();
  }
}

/**
 * The upcoming site events that could possibly have a status, as
 * `siteSlug → humanitixSlug`.
 *
 * An event with no Humanitix link (a partner-hosted registration, or one not on
 * sale yet) is still in the response as `"unknown"` — the map below only decides
 * which ones we can *answer*, not which ones we report on.
 */
function upcomingHumanitixSlugs(): Map<string, string> {
  const pairs = new Map<string, string>();
  for (const event of getUpcomingEvents()) {
    const data = event.detailPageData;
    const slug =
      humanitixSlugFromUrl(data.registrationUrl) ??
      humanitixSlugFromUrl(data.humanitixUrl);
    if (slug) pairs.set(event.slug, slug);
  }
  return pairs;
}

/**
 * Reduces one Humanitix event to the single word the UI renders.
 *
 * Precedence is deliberate: a sold-out event that has also had sales suspended
 * reads better as "Sold out" than "Registration closed", and an organiser who
 * unpublishes a sold-out event has not changed why nobody can buy a ticket.
 *
 * @param event - The API event.
 * @returns Its status. Never a number.
 */
function deriveStatus(event: HumanitixEvent): TicketStatus {
  if (event.markedAsSoldOut) return "sold-out";
  if (event.suspendSales) return "closed";
  if (!event.published || !event.public) return "unpublished";
  return "on-sale";
}

// --- Fetching ------------------------------------------------------------

/**
 * Fetches Humanitix and builds the status map, bounded by a wall-clock timeout.
 *
 * The race does not cancel the upstream request — `listEvents` takes no abort
 * signal and this route may not change it — but it does stop a slow Humanitix
 * from holding a serverless function open until the platform kills it.
 *
 * @param wanted - `siteSlug → humanitixSlug` for the events worth answering.
 * @returns The statuses for the slugs that matched an upstream event.
 * @throws When the key is missing, the API fails, or the timeout wins.
 */
async function fetchStatuses(wanted: Map<string, string>): Promise<TicketStatusMap> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`Humanitix did not answer in ${UPSTREAM_TIMEOUT_MS}ms`)),
      UPSTREAM_TIMEOUT_MS
    );
  });

  try {
    const events = await Promise.race([listEvents({ inFutureOnly: true }), timeout]);

    const byHumanitixSlug = new Map<string, HumanitixEvent>();
    for (const event of events) {
      if (event.slug) byHumanitixSlug.set(event.slug.toLowerCase(), event);
    }

    const statuses: TicketStatusMap = {};
    for (const [siteSlug, humanitixSlug] of wanted) {
      const match = byHumanitixSlug.get(humanitixSlug);
      if (match) statuses[siteSlug] = deriveStatus(match);
    }
    return statuses;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * In-flight request, shared across concurrent handlers in one instance.
 *
 * A cold CDN edge can release a burst of requests at the same instant; without
 * this each would open its own Humanitix call for the same answer.
 */
let inflight: Promise<TicketStatusMap> | null = null;

/** Runs `fetchStatuses` at most once at a time per instance. */
function fetchStatusesOnce(wanted: Map<string, string>): Promise<TicketStatusMap> {
  if (!inflight) {
    inflight = fetchStatuses(wanted).finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

// --- Handler -------------------------------------------------------------

/** Builds the all-`"unknown"` answer: what the UI renders nothing extra for. */
function allUnknown(slugs: Iterable<string>): TicketStatusMap {
  const statuses: TicketStatusMap = {};
  for (const slug of slugs) statuses[slug] = "unknown";
  return statuses;
}

/**
 * Fills in `"unknown"` for every upcoming slug the fetch could not answer, so
 * the response shape does not depend on which events happen to be on Humanitix.
 */
function withUnknowns(slugs: Iterable<string>, known: TicketStatusMap): TicketStatusMap {
  return { ...allUnknown(slugs), ...known };
}

export async function GET(request: NextRequest) {
  // Site data only — cheap, local, and the one part that cannot fail. Computing
  // it first means every early return still has the full response shape.
  const upcoming = getUpcomingEvents().map((event) => event.slug);
  const wanted = upcomingHumanitixSlugs();

  if (!(await checkRateLimit(getClientId(request)))) {
    // Still the real shape, so a client that ignores the status code renders
    // nothing extra rather than breaking. `no-store` so a shared cache never
    // serves one IP's rate-limit answer to everybody.
    return NextResponse.json(allUnknown(upcoming), {
      status: 429,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const headers = {
    "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900",
  };

  if (wanted.size === 0) {
    return NextResponse.json(allUnknown(upcoming), { headers });
  }

  const redis = getChatRedis();

  let cached: CachedStatuses | null = null;
  if (redis) {
    try {
      cached = await redis.get<CachedStatuses>(CACHE_KEY);
    } catch (error) {
      console.error("[TicketStatus] Redis read failed:", error);
    }
  }

  if (cached && Date.now() - cached.fetchedAt < SOFT_TTL_MS) {
    return NextResponse.json(withUnknowns(upcoming, cached.statuses), { headers });
  }

  try {
    const statuses = await fetchStatusesOnce(wanted);

    if (redis) {
      try {
        await redis.set<CachedStatuses>(
          CACHE_KEY,
          { statuses, fetchedAt: Date.now() },
          { ex: HARD_TTL_SECONDS }
        );
      } catch (error) {
        console.error("[TicketStatus] Redis write failed:", error);
      }
    }

    return NextResponse.json(withUnknowns(upcoming, statuses), { headers });
  } catch (error) {
    // The expected production path until `HUMANITIX_API_KEY` is set: log the
    // reason server-side, tell the browser nothing, and let it render the page
    // it would have rendered anyway.
    console.warn(
      "[TicketStatus] Humanitix lookup failed; serving stale or unknown:",
      error instanceof Error ? error.message : error
    );

    // A stale answer beats no answer — a sold-out event that sold out ten
    // minutes ago is still sold out.
    if (cached) {
      return NextResponse.json(withUnknowns(upcoming, cached.statuses), { headers });
    }
    return NextResponse.json(allUnknown(upcoming), { headers });
  }
}
