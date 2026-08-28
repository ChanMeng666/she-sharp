/**
 * Newsletter double opt-in confirmation — step two, and the only route that
 * produces a mailable subscriber.
 *
 * **POST only, and that is the whole point.** Confirmation must never happen on
 * a GET: corporate mail gateways, link scanners and inbox previewers fetch every
 * URL in an incoming message before a human sees it. A scanner-confirmed
 * subscription would be indistinguishable, in the database, from a real one —
 * it would fabricate exactly the double opt-in evidence this system exists to
 * hold, and the row's `confirmedAt` would be a lie told under a valid audit
 * trail. So the emailed link goes to the page at `/newsletter/confirm`, which
 * renders a button; the button POSTs here. A prefetcher can load the page all it
 * likes and nothing is confirmed until a person presses something.
 *
 * The endpoint is rate limited on its own prefix. Tokens are 43 base64url
 * characters, so guessing one is infeasible and the limiter is not what makes
 * this safe — but an unlimited endpoint that answers "was this token valid?" is
 * a guessing oracle by construction, and refusing to build one costs nothing.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";
import { getChatRedis } from "@/lib/chatbot/redis";
import { invalidBody } from "@/lib/api/validation";
import { confirmSubscription } from "@/lib/newsletter/subscribers";

// Drizzle/Neon needs the Node runtime.
export const runtime = "nodejs";

const confirmSchema = z.object({
  token: z.string().min(1).max(64),
});

let ratelimit: Ratelimit | null = null;
let initialised = false;

/** Lazily build the confirm limiter, or null when Redis is unconfigured. */
function getConfirmRateLimit(): Ratelimit | null {
  if (initialised) return ratelimit;
  initialised = true;

  const redis = getChatRedis();
  if (!redis) return null;

  ratelimit = new Ratelimit({
    redis,
    // A real person confirms once. The allowance covers a double-click, a
    // refresh and a second address from the same household.
    limiter: Ratelimit.slidingWindow(5, "1 h"),
    prefix: "newsletter_confirm_rl",
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
  const rl = getConfirmRateLimit();
  if (!rl) return { success: true };

  try {
    const { success } = await rl.limit(identifier);
    return { success };
  } catch (error) {
    console.error("[Newsletter] Confirm rate limit check failed, allowing request:", error);
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

  const validation = confirmSchema.safeParse(body);
  if (!validation.success) {
    return invalidBody(validation.error);
  }

  const { success } = await checkRateLimit(getClientId(request));
  if (!success) {
    return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429 });
  }

  const result = await confirmSubscription(validation.data.token);

  if (result.outcome === "confirmed") {
    return NextResponse.json({ ok: true, email: result.email });
  }

  // 410 Gone, not 400 or 404. Expired, already spent, and never existed are
  // indistinguishable by design — `confirmSubscription()` is one guarded UPDATE
  // and cannot tell them apart either — so there is one status and one sentence
  // for all three, and the page shows that sentence without branching.
  return NextResponse.json(
    { error: "This confirmation link has expired or has already been used." },
    { status: 410 }
  );
}
