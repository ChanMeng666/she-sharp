/**
 * Redis-backed record of where a monthly newsletter issue is in the send
 * pipeline (draft → approved → scheduled → sent).
 *
 * `markStatus` is written by the approve route; `getStatus` is its idempotency
 * guard, so approving the same issue twice is a no-op rather than a second
 * Slack post. Nothing else lives here any more: the draft-staging half
 * (`saveDraft` / `getDraft` / `hasDraft`) went with the cloud generation step,
 * because an issue now starts life as a file on a developer's disk written by
 * `scripts/newsletter/new-issue.ts`, not as a blob in Redis.
 *
 * Every function degrades gracefully — returning false/null rather than
 * throwing — when Redis is unconfigured, mirroring `lib/chatbot/redis.ts`.
 */

import { Redis } from "@upstash/redis";

import type { IssueMeta } from "./schema";

const STATUS_PREFIX = "newsletter:status:";

/** Status outlives an issue's review window, so a sent issue's record survives it. */
const STATUS_TTL_SECONDS = 90 * 24 * 60 * 60;

let redis: Redis | null = null;
let initialised = false;

/**
 * Resolves Upstash credentials from the several env-var conventions this project
 * uses (see `lib/chatbot/redis.ts`), or null when none are configured.
 */
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
function getNewsletterRedis(): Redis | null {
  if (initialised) return redis;
  initialised = true;

  const creds = resolveCreds();
  if (!creds) {
    console.warn("[Newsletter] Upstash Redis not configured (status tracking disabled)");
    return null;
  }

  redis = new Redis(creds);
  return redis;
}

/**
 * Coerces an Upstash `get` result into a plain object. The SDK auto-deserializes
 * JSON strings, but older/edge cases can return the raw string — handle both.
 */
function coerceObject(value: unknown): Record<string, unknown> | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  if (typeof value === "object") return value as Record<string, unknown>;
  return null;
}

/**
 * Merge-writes an issue's lifecycle status under `newsletter:status:<id>` with a
 * 90-day TTL. Existing fields are preserved; `patch` overrides them and an
 * `updatedAt` stamp is refreshed. Returns false when Redis is unavailable.
 */
export async function markStatus(
  id: string,
  patch: { status: IssueMeta["status"]; broadcastId?: string; scheduledAt?: string }
): Promise<boolean> {
  const r = getNewsletterRedis();
  if (!r) return false;

  try {
    const key = `${STATUS_PREFIX}${id}`;
    const existing = coerceObject(await r.get(key)) ?? {};
    const merged = {
      ...existing,
      ...patch,
      id,
      updatedAt: new Date().toISOString(),
    };
    await r.set(key, JSON.stringify(merged), { ex: STATUS_TTL_SECONDS });
    return true;
  } catch (error) {
    console.error("[Newsletter] Failed to mark status:", error);
    return false;
  }
}

/** Reads the raw lifecycle-status record for `id`, or null when absent / no Redis. */
export async function getStatus(id: string): Promise<Record<string, unknown> | null> {
  const r = getNewsletterRedis();
  if (!r) return null;

  try {
    return coerceObject(await r.get(`${STATUS_PREFIX}${id}`));
  } catch (error) {
    console.error("[Newsletter] Failed to read status:", error);
    return null;
  }
}
