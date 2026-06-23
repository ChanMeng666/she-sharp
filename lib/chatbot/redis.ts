/**
 * Shared Upstash Redis client for the chatbot (rate limiting + analytics).
 *
 * Resolves credentials from several common env-var conventions so it works
 * regardless of how Upstash was provisioned:
 * - UPSTASH_REDIS_URL / UPSTASH_REDIS_TOKEN  (this project's convention, see lib/matching/cache.ts)
 * - UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN  (Upstash native / @upstash/redis fromEnv)
 * - KV_REST_API_URL / KV_REST_API_TOKEN  (Vercel Marketplace Upstash / Vercel KV)
 *
 * Returns null (and the chatbot degrades gracefully) when none are configured.
 */

import { Redis } from "@upstash/redis";

let redis: Redis | null = null;
let initialised = false;

function resolveCreds(): { url: string; token: string } | null {
  const url =
    process.env.UPSTASH_REDIS_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_TOKEN;
  return url && token ? { url, token } : null;
}

/** Lazily create the shared Redis client, or null if unconfigured. */
export function getChatRedis(): Redis | null {
  if (initialised) return redis;
  initialised = true;

  const creds = resolveCreds();
  if (!creds) {
    console.warn(
      "[Chat] Upstash Redis not configured (rate limiting & analytics disabled)"
    );
    return null;
  }

  redis = new Redis(creds);
  return redis;
}
