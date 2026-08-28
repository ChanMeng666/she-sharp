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
 * - Per-IP sliding-window rate limit (mirrors lib/chatbot/rate-limit.ts),
 *   degrading open when Redis is unconfigured.
 * - Never leaks configuration or backend state: any well-formed non-honeypot
 *   input gets `{ ok: true }`, whatever actually happened.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";
import { getChatRedis } from "@/lib/chatbot/redis";
import { invalidBody } from "@/lib/api/validation";
import { sendNewsletterConfirmationEmail } from "@/lib/email/service";
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
});

let ratelimit: Ratelimit | null = null;
let initialised = false;

/** Lazily build the subscribe limiter, or null when Redis is unconfigured. */
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

/** Rate-limit check that degrades open on any limiter failure. */
async function checkRateLimit(identifier: string): Promise<{ success: boolean }> {
  const rl = getSubscribeRateLimit();
  if (!rl) return { success: true };

  try {
    const { success } = await rl.limit(identifier);
    return { success };
  } catch (error) {
    console.error("[Newsletter] Rate limit check failed, allowing request:", error);
    return { success: true };
  }
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

  const { email, firstName, website } = validation.data;

  // Honeypot tripped: pretend success, do nothing, and don't spend rate budget.
  if (website && website.trim().length > 0) {
    return NextResponse.json({ ok: true });
  }

  const ip = getClientIp(request);
  const { success } = await checkRateLimit(ip ?? "anonymous");
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
      // person was mailed, so it is a constant here and not assembled from parts.
      consentSource: "Website newsletter subscribe form",
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
