/**
 * Public post-event feedback endpoint.
 *
 * Combines the contact route's zod validation with the newsletter route's
 * honeypot + rate-limit apparatus, but the limits themselves are deliberately
 * NOT the newsletter route's — see the rate limiting section below before
 * changing any number in this file.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";
import { getChatRedis } from "@/lib/chatbot/redis";
import { submitEventFeedback } from "@/lib/forms/event-feedback-service";

const feedbackSchema = z.object({
  eventSlug: z.string().min(1).max(200),
  overallRating: z.coerce.number().int().min(1).max(5),
  recommendScore: z.coerce.number().int().min(0).max(10).optional(),
  wouldAttendAgain: z.enum(["yes", "maybe", "no"]).optional(),
  whatWorked: z.string().max(2000).optional(),
  whatToImprove: z.string().max(2000).optional(),
  interests: z.array(z.enum(["mentorship", "volunteering", "newsletter"])).max(3).default([]),
  // Required as of 2026-08-03, and enforced here rather than only in the form:
  // client-side validation is a courtesy, not a control.
  //
  // `required_error` is set explicitly because `.min(1, …)` only fires when the
  // key is present but empty — an absent key falls through to zod's default
  // "Required", and two absent keys produce the uselessly ambiguous
  // "Required, Required".
  name: z.string({ required_error: "Name is required" }).min(1, "Name is required").max(100),
  email: z
    .string({ required_error: "Email is required" })
    .min(1, "Email is required")
    .email("Invalid email address")
    .max(255),
  source: z.enum(["deck_qr", "event_page", "direct_link", "email"]).default("direct_link"),
  /** Honeypot: legitimate clients leave this empty. */
  website: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Rate limiting
//
// This is the part of the file most likely to be "tidied" into something
// broken, so: a hall of a hundred attendees sits behind ONE NAT IP, and they
// all scan the QR within about ninety seconds of each other. The newsletter
// route's `slidingWindow(5, "1 h")` per IP would therefore collect five
// responses out of a hundred and log nothing — the result looks exactly like
// "nobody cared about the event", which is the single most expensive wrong
// conclusion this feature could produce.
//
// Hence two limiters with different jobs, and both degrade OPEN (allow) when
// Redis is missing or the limiter itself throws. Locking a room out of the
// feedback form is far worse than accepting a few junk rows that a human can
// delete afterwards.
// ---------------------------------------------------------------------------

let ipRatelimit: Ratelimit | null = null;
let ipInitialised = false;

/**
 * Limiter A — venue-scale flood guard, not a per-person control. 300/hour is
 * above any real room and still bounds a script. Keyed by IP *and* event so a
 * busy Tuesday event cannot exhaust Wednesday's budget from the same venue.
 */
function getIpRateLimit(): Ratelimit | null {
  if (ipInitialised) return ipRatelimit;
  ipInitialised = true;

  const redis = getChatRedis();
  if (!redis) return null;

  ipRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(300, "1 h"),
    prefix: "event_feedback_ip_rl",
    analytics: false,
  });
  return ipRatelimit;
}

let deviceRatelimit: Ratelimit | null = null;
let deviceInitialised = false;

/**
 * Limiter B — the real per-person control, and the only one immune to NAT.
 * Three per hour per device per event leaves room for the de-dup path (someone
 * correcting their answer) without letting one phone stuff the results.
 */
function getDeviceRateLimit(): Ratelimit | null {
  if (deviceInitialised) return deviceRatelimit;
  deviceInitialised = true;

  const redis = getChatRedis();
  if (!redis) return null;

  deviceRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, "1 h"),
    prefix: "event_feedback_device_rl",
    analytics: false,
  });
  return deviceRatelimit;
}

/** Best-effort client identifier for rate limiting. */
function getClientId(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "anonymous";
}

/**
 * Device id from `x-ss-device` — a UUID the client generates once and keeps in
 * `localStorage`. It is a convenience for the limiter, never an authentication
 * token: anyone can forge or clear it, which is exactly why limiter A still
 * exists. A missing or malformed header must NEVER reject the request; older
 * browsers, privacy modes and cleared storage are all normal in a venue.
 */
function getDeviceId(req: Request): string | null {
  const raw = req.headers.get("x-ss-device");
  if (!raw) return null;

  const sanitised = raw.trim().replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64);
  return sanitised.length > 0 ? sanitised : null;
}

/** Rate-limit check that degrades open on any limiter failure. */
async function checkLimit(rl: Ratelimit | null, identifier: string): Promise<boolean> {
  if (!rl) return true;

  try {
    const { success } = await rl.limit(identifier);
    return success;
  } catch (error) {
    console.error("[EventFeedback] Rate limit check failed, allowing request:", error);
    return true;
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const validation = feedbackSchema.safeParse(body);
  if (!validation.success) {
    const errors = validation.error.errors.map((e) => e.message).join(", ");
    return NextResponse.json({ error: errors }, { status: 400 });
  }

  const {
    eventSlug,
    overallRating,
    recommendScore,
    wouldAttendAgain,
    whatWorked,
    whatToImprove,
    interests,
    name,
    email,
    source,
    website,
  } = validation.data;

  // Honeypot tripped: pretend success, do nothing, and — deliberately before the
  // limiters — spend no rate budget. A bot must not be able to burn the room's
  // allowance on its way to being ignored.
  if (website && website.trim().length > 0) {
    return NextResponse.json({ success: true });
  }

  const clientId = getClientId(request);
  if (!(await checkLimit(getIpRateLimit(), `${clientId}:${eventSlug}`))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const deviceId = getDeviceId(request);
  if (deviceId && !(await checkLimit(getDeviceRateLimit(), `${deviceId}:${eventSlug}`))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const result = await submitEventFeedback({
    eventSlug,
    overallRating,
    recommendScore,
    wouldAttendAgain,
    whatWorked,
    whatToImprove,
    interests,
    name,
    email: email || undefined,
    source,
  });

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || "Failed to submit feedback. Please try again later." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, submissionId: result.submissionId });
}
