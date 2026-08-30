/**
 * Newsletter re-confirmation — the endpoint that upgrades the consent evidence
 * on an existing subscriber's row.
 *
 * **POST only, and there is deliberately no GET handler at all.** The reasoning
 * from `/api/newsletter/confirm` applies here with more force, because
 * producing evidence is this route's entire purpose: corporate mail gateways
 * and link scanners fetch every URL in an incoming message before a human sees
 * it, so a route that wrote on GET would stamp `confirmedAt` on behalf of a
 * scanner and record, under a valid audit trail, an act nobody performed. The
 * emailed link therefore goes to the page at `/newsletter/reconfirm`, which
 * renders a button; the button POSTs here. An undefined GET on a route handler
 * is a 405 from Next.js, which is the correct answer to a prefetcher.
 *
 * What it will not do is at least as important as what it will. The rule lives
 * in `decideReconfirm()` — see `lib/newsletter/reconfirm.ts` for why it is
 * strictly stricter than `selectMailable()`'s — and this layer only collapses
 * its four refusal reasons into one answer, so that whoever holds a token
 * cannot learn from the response whether that address unsubscribed, bounced,
 * complained, or was never on the list at all.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";

import { getChatRedis } from "@/lib/chatbot/redis";
import { invalidBody } from "@/lib/api/validation";
import { reconfirmByHash } from "@/lib/newsletter/reconfirm";
import { verifyReconfirmToken } from "@/lib/newsletter/reconfirm-token";
import { issueIdSchema } from "@/lib/newsletter/schema";

// node:crypto (token verification) and the Drizzle/Neon client both need the
// Node runtime; the edge runtime would fail at import time.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const reconfirmSchema = z.object({
  /** The `t` value carried over from the emailed link. */
  token: z.string().min(1).max(128),
  /** The `i` value: which issue the link came from. Recorded in the evidence. */
  issue: issueIdSchema.optional(),
});

let ratelimit: Ratelimit | null = null;
let initialised = false;

/** Lazily build the re-confirm limiter, or null when Redis is unconfigured. */
function getReconfirmRateLimit(): Ratelimit | null {
  if (initialised) return ratelimit;
  initialised = true;

  const redis = getChatRedis();
  if (!redis) return null;

  ratelimit = new Ratelimit({
    redis,
    // A real person presses this once per issue. The allowance covers a
    // double-click, a refresh, and a household sharing one connection.
    limiter: Ratelimit.slidingWindow(5, "1 h"),
    prefix: "newsletter_reconfirm_rl",
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
  const rl = getReconfirmRateLimit();
  if (!rl) return { success: true };

  try {
    const { success } = await rl.limit(identifier);
    return { success };
  } catch (error) {
    console.error(
      "[Newsletter] Re-confirm rate limit check failed, allowing request:",
      error
    );
    return { success: true };
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body" },
      { status: 400 }
    );
  }

  const validation = reconfirmSchema.safeParse(body);
  if (!validation.success) {
    return invalidBody(validation.error);
  }

  const { success } = await checkRateLimit(getClientId(request));
  if (!success) {
    return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429 });
  }

  // 400 rather than 409: a forged or expired-secret token says nothing about
  // any person, so distinguishing it leaks nothing and makes a real
  // misconfiguration visible in the logs instead of hiding inside "refused".
  const emailHash = verifyReconfirmToken(validation.data.token);
  if (!emailHash) {
    return NextResponse.json(
      { error: "This confirmation link is not valid." },
      { status: 400 }
    );
  }

  let result;
  try {
    result = await reconfirmByHash(emailHash, validation.data.issue ?? null);
  } catch (error) {
    console.error("[Newsletter] reconfirmByHash() failed:", error);
    return NextResponse.json(
      { error: "We could not record that just now. Please try again shortly." },
      { status: 500 }
    );
  }

  if (result.outcome === "reconfirmed") {
    return NextResponse.json({ ok: true, email: result.email });
  }

  // The reason is logged as a truncated hash and a category — never an address,
  // because this line ends up in Vercel's log drain.
  console.warn(
    `[Newsletter] Re-confirmation refused for ${emailHash.slice(0, 12)}…: ${result.reason}`
  );

  // 409 Conflict, with one sentence for all four refusals. "Never on the list",
  // "unsubscribed", "bounced" and "on a do-not-contact register" are kept
  // indistinguishable on purpose: anyone holding a forwarded newsletter would
  // otherwise be able to read another person's status off this endpoint. The
  // copy points at the one route that is always correct for someone who does
  // want the newsletter — the subscribe form.
  return NextResponse.json(
    {
      error:
        "This link can no longer be used. If you would like to receive the " +
        "newsletter, you can sign up at /newsletter/subscribe.",
    },
    { status: 409 }
  );
}
