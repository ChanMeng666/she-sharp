/**
 * Per-IP rate limiting for the public chatbot endpoint, backed by Upstash Redis.
 *
 * Uses the shared client in ./redis (which resolves several env-var
 * conventions). If Redis is unconfigured, rate limiting is disabled (requests
 * are allowed) so local development and previews keep working.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { getChatRedis } from "./redis";

let ratelimit: Ratelimit | null = null;
let initialised = false;

function getRatelimit(): Ratelimit | null {
  if (initialised) return ratelimit;
  initialised = true;

  const redis = getChatRedis();
  if (!redis) return null;

  ratelimit = new Ratelimit({
    redis,
    // Allow short bursts but cap sustained abuse.
    limiter: Ratelimit.slidingWindow(15, "60 s"),
    prefix: "chatbot_rl",
    analytics: false,
  });
  return ratelimit;
}

/**
 * Returns whether the request from `identifier` (typically the client IP) is
 * within the rate limit. On any failure or when disabled, returns success so the
 * chatbot never breaks because of the limiter.
 */
export async function checkChatRateLimit(
  identifier: string
): Promise<{ success: boolean }> {
  const rl = getRatelimit();
  if (!rl) return { success: true };

  try {
    const { success } = await rl.limit(identifier);
    return { success };
  } catch (error) {
    console.error("[Chat] Rate limit check failed, allowing request:", error);
    return { success: true };
  }
}
