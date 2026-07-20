/**
 * Public newsletter subscription endpoint (unexposed).
 *
 * No UI links here yet — a future footer swap will POST to it. Adds the
 * submitted email as a Resend contact attached to the newsletter segment/topic.
 *
 * Privacy/abuse posture:
 * - A honeypot `website` field silently absorbs bots (200, no side effects).
 * - Per-IP sliding-window rate limit (mirrors lib/chatbot/rate-limit.ts),
 *   degrading open when Redis is unconfigured.
 * - Never leaks configuration or backend errors: any well-formed input gets
 *   `{ ok: true }`, whether or not the contact was actually created.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";
import { getChatRedis } from "@/lib/chatbot/redis";
import { createContact } from "@/lib/newsletter/resend-api";

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

/** Best-effort client identifier for rate limiting. */
function getClientId(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "anonymous";
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
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }

  const { email, firstName, website } = validation.data;

  // Honeypot tripped: pretend success, do nothing, and don't spend rate budget.
  if (website && website.trim().length > 0) {
    return NextResponse.json({ ok: true });
  }

  const { success } = await checkRateLimit(getClientId(request));
  if (!success) {
    return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429 });
  }

  const segmentId = process.env.RESEND_NEWSLETTER_SEGMENT_ID;
  const topicId = process.env.RESEND_NEWSLETTER_TOPIC_ID;
  const apiKey = process.env.RESEND_API_KEY;

  // If the backend isn't wired up, accept silently — never reveal config state.
  if (!segmentId || !topicId || !apiKey) {
    console.warn(
      "[Newsletter] Subscribe endpoint not fully configured; skipping createContact"
    );
    return NextResponse.json({ ok: true });
  }

  try {
    await createContact({
      email,
      firstName,
      segmentIds: [segmentId],
      topics: [{ id: topicId, subscribed: true }],
    });
  } catch (error) {
    // No enumeration/leakage: log server-side, still report success. A
    // pre-existing contact is already treated as success by createContact.
    console.error(
      "[Newsletter] createContact failed:",
      error instanceof Error ? error.message : error
    );
  }

  return NextResponse.json({ ok: true });
}
