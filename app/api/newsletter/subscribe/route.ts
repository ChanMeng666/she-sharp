/**
 * Public newsletter subscription endpoint — step one of double opt-in.
 *
 * The form POSTs here; this records a `pending` row in `newsletter_subscribers`
 * and emails a confirmation link. Nothing here ever produces a mailable
 * subscriber — only `/api/newsletter/confirm` does that. Until this route
 * existed, Resend's segment membership was the entire consent record; now the
 * record is ours, which means the provenance written here (`consentSource`, the
 * IP and the user agent) is the evidence She Sharp would show if a recipient
 * ever asked why they were mailed. It is written once, at the moment of the act.
 *
 * Privacy/abuse posture, unchanged from the Resend-era version of this file:
 * - A honeypot `website` field silently absorbs bots (200, no side effects, and
 *   no rate budget spent — a bot must not be able to exhaust a shared NAT's
 *   allowance for the humans behind it).
 * - Sliding-window rate limits (mirrors lib/chatbot/rate-limit.ts), degrading
 *   open when Redis is unconfigured. Per-IP on its own, or per-device under a
 *   per-IP ceiling when the client offers a device id — see the block comment
 *   on the limiters.
 * - Never leaks configuration or backend state: any well-formed non-honeypot
 *   input gets `{ ok: true }`, whatever actually happened.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";
import { getChatRedis } from "@/lib/chatbot/redis";
import { invalidBody } from "@/lib/api/validation";
import { sendNewsletterConfirmationEmail } from "@/lib/email/service";
import {
  NEWSLETTER_PLACEMENTS,
  consentSourceForPlacement,
} from "@/lib/newsletter/placements";
import { subscribe } from "@/lib/newsletter/subscribers";

// node:crypto (token minting) and the Drizzle/Neon client both need the Node
// runtime; the edge runtime would fail at import time.
export const runtime = "nodejs";

/** How much of a user-agent string the consent record keeps. */
const USER_AGENT_MAX = 500;

const subscribeSchema = z.object({
  email: z.string().email().max(254),
  firstName: z.string().max(80).optional(),
  /** Honeypot: legitimate clients leave this empty. */
  website: z.string().optional(),
  /**
   * Which form on the site this came from. A key, never prose: the consent
   * sentence is composed server-side from a closed list, so a public endpoint
   * cannot write arbitrary text into the audit record. Optional because a
   * cached older bundle sends none, and that request is still a valid opt-in.
   */
  placement: z.enum(NEWSLETTER_PLACEMENTS).optional(),
});

// ---------------------------------------------------------------------------
// Rate limiting
//
// One form on one page could be limited by IP alone: five sign-ups an hour from
// an address is generous for real humans and tight on a script. The form is now
// on seven surfaces, one of which is the post-event feedback confirmation — and
// a hall of forty attendees sits behind ONE NAT'd venue IP, all finishing within
// minutes of each other. Under a flat 5/hour the sixth person reads a 429 as
// "the site is broken", which is exactly the failure
// `app/api/event-feedback/route.ts` already had to design around.
//
// So: when the client sends the device id it already mints for the feedback
// form, limit per device per IP, under a much higher per-IP ceiling. When it
// does not, nothing changes.
//
// The device id is client-supplied and therefore NOT a trust boundary — anyone
// can forge or clear it, and a limiter keyed on it alone would be a limiter
// anyone can opt out of. It is a fairness key layered *under* a real ceiling,
// never a replacement for one, which is why the IP limiter below must stay even
// though the device limiter is the one that does the day-to-day work.
//
// Every limiter degrades OPEN when Redis is missing or throws. Locking a room
// out of a sign-up form is worse than a few junk `pending` rows that never get
// confirmed and expire on their own.
// ---------------------------------------------------------------------------

let ratelimit: Ratelimit | null = null;
let initialised = false;

/** Limiter A — the original per-IP limit, used when no device id is offered. */
function getSubscribeRateLimit(): Ratelimit | null {
  if (initialised) return ratelimit;
  initialised = true;

  const redis = getChatRedis();
  if (!redis) return null;

  ratelimit = new Ratelimit({
    redis,
    // Public opt-in — a handful per hour per IP is plenty for real humans.
    limiter: Ratelimit.slidingWindow(5, "1 h"),
    prefix: "newsletter_subscribe_rl",
    analytics: false,
  });
  return ratelimit;
}

let deviceRatelimit: Ratelimit | null = null;
let deviceInitialised = false;

/**
 * Limiter B — per device per IP, the fairness key.
 *
 * Keyed on `${ip}:${device}` rather than the device alone so a forged id
 * cannot be replayed from somewhere else to burn a stranger's allowance.
 * Three an hour covers a mistyped address and a correction.
 */
function getDeviceRateLimit(): Ratelimit | null {
  if (deviceInitialised) return deviceRatelimit;
  deviceInitialised = true;

  const redis = getChatRedis();
  if (!redis) return null;

  deviceRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, "1 h"),
    prefix: "newsletter_subscribe_device_rl",
    analytics: false,
  });
  return deviceRatelimit;
}

let ipCeilingRatelimit: Ratelimit | null = null;
let ipCeilingInitialised = false;

/**
 * Limiter C — the ceiling that makes limiter B safe to trust.
 *
 * 30/hour is above any real venue's sign-up rate and still bounds a script that
 * mints a fresh device id per request. Without this, the device header would be
 * a way to ask for an unlimited allowance.
 */
function getIpCeilingRateLimit(): Ratelimit | null {
  if (ipCeilingInitialised) return ipCeilingRatelimit;
  ipCeilingInitialised = true;

  const redis = getChatRedis();
  if (!redis) return null;

  ipCeilingRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, "1 h"),
    prefix: "newsletter_subscribe_ip_ceiling_rl",
    analytics: false,
  });
  return ipCeilingRatelimit;
}

/**
 * Best-effort client identifier.
 *
 * Doubles as the `consentIp` written to the row, so the address that spent the
 * rate budget is the address the consent record names — one derivation, not two
 * that could disagree.
 *
 * @param req The incoming request.
 * @returns The first forwarded hop, the real-ip header, or null when neither is
 *   present (local requests and any proxy that strips both).
 */
function getClientIp(req: Request): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0].trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip");
  return real && real.trim() ? real.trim() : null;
}

/**
 * Device id from `x-ss-device` — the UUID the feedback form keeps in
 * `localStorage`.
 *
 * Sanitised to the character set an id can legitimately use, so a header can
 * never be shaped into a Redis key of someone else's. A missing or malformed
 * header is normal (older browsers, private mode, cleared storage) and must
 * never reject the request — it just falls back to the per-IP limit.
 */
function getDeviceId(req: Request): string | null {
  const raw = req.headers.get("x-ss-device");
  if (!raw) return null;

  const sanitised = raw.trim().replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64);
  return sanitised.length > 0 ? sanitised : null;
}

/** Rate-limit check that degrades open on any limiter failure. */
async function checkLimit(
  rl: Ratelimit | null,
  identifier: string,
): Promise<boolean> {
  if (!rl) return true;

  try {
    const { success } = await rl.limit(identifier);
    return success;
  } catch (error) {
    console.error("[Newsletter] Rate limit check failed, allowing request:", error);
    return true;
  }
}

/**
 * Applies the right pair of limiters for this request.
 *
 * With a device id: per device per IP, *and* the per-IP ceiling. Both, never
 * either — see the block comment above for why the ceiling is not optional.
 * Without one: the original per-IP limit, unchanged.
 *
 * @param ip The client address, or null when no proxy header was present.
 * @param device The sanitised device id, or null.
 * @returns Whether the request may proceed.
 */
async function checkRateLimit(
  ip: string | null,
  device: string | null,
): Promise<{ success: boolean }> {
  const ipKey = ip ?? "anonymous";

  if (!device) {
    return { success: await checkLimit(getSubscribeRateLimit(), ipKey) };
  }

  // Short-circuits deliberately: a device that has spent its own allowance must
  // not also consume a slot of the shared ceiling on the way to being refused.
  const allowed =
    (await checkLimit(getDeviceRateLimit(), `${ipKey}:${device}`)) &&
    (await checkLimit(getIpCeilingRateLimit(), ipKey));

  return { success: allowed };
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }

  const validation = subscribeSchema.safeParse(body);
  if (!validation.success) {
    return invalidBody(validation.error);
  }

  const { email, firstName, website, placement } = validation.data;

  // Honeypot tripped: pretend success, do nothing, and don't spend rate budget.
  if (website && website.trim().length > 0) {
    return NextResponse.json({ ok: true });
  }

  const ip = getClientIp(request);
  const { success } = await checkRateLimit(ip, getDeviceId(request));
  if (!success) {
    return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429 });
  }

  const userAgent = request.headers.get("user-agent");

  // The form always sends the field, so an untouched "first name" arrives as an
  // empty string rather than as absent. Storing that would put `''` in the
  // column instead of NULL and make "gave us a name" indistinguishable from
  // "left it blank" — normalise at the trust boundary rather than trusting the
  // client to omit it.
  const trimmedFirstName = firstName?.trim();

  try {
    const result = await subscribe({
      email,
      firstName: trimmedFirstName ? trimmedFirstName : null,
      source: "website-form",
      // Route 1 of consent-rules.md. The exact wording is the audit record —
      // it is the sentence someone would have to stand behind if asked why this
      // person was mailed. The client names a placement KEY and the sentence is
      // composed here from a closed list, so the record still cannot be written
      // by the caller; `lib/newsletter/placements.ts` holds every sentence, and
      // a request naming no placement gets the original string verbatim.
      consentSource: consentSourceForPlacement(placement),
      consentIp: ip,
      consentUserAgent: userAgent ? userAgent.slice(0, USER_AGENT_MAX) : null,
    });

    if (result.outcome === "confirmation-sent") {
      try {
        await sendNewsletterConfirmationEmail(result.email, result.token);
      } catch (error) {
        // The row is already written and the token is already live, so a send
        // failure is recoverable by re-submitting the form. Surfacing it would
        // buy the caller nothing and cost us the uniform response below.
        console.error(
          "[Newsletter] Confirmation email failed to send:",
          error instanceof Error ? error.message : error
        );
      }
    }

    // `already-subscribed` and `blocked` send nothing: the first because a
    // confirmed subscriber has no link to click, the second because a spam
    // complaint is terminal and re-mailing it is the most expensive message
    // She Sharp can send.
  } catch (error) {
    console.error(
      "[Newsletter] subscribe() failed:",
      error instanceof Error ? error.message : error
    );
  }

  // One response for every branch, deliberately. Telling the caller whether the
  // address was new, already subscribed, or blocked would turn this public
  // endpoint into an address-enumeration oracle: anyone could test whether a
  // given person is on She Sharp's list. The person who actually owns the
  // address learns the outcome the only way that proves ownership — in their
  // inbox, or by its silence.
  return NextResponse.json({ ok: true });
}
