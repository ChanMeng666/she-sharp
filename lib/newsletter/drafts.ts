/**
 * Redis-backed staging for monthly newsletter drafts and their lifecycle status.
 *
 * The cron routine assembles + AI-drafts an issue and `saveDraft`s it; a human
 * (via an admin endpoint / Claude Code session) later `getDraft`s it to review,
 * edit, and commit as the canonical JSON fixture. `markStatus` records where an
 * issue is in the send pipeline (draft → approved → scheduled → sent) plus the
 * Resend broadcast id once known.
 *
 * Every function degrades gracefully — returning false/null rather than
 * throwing — when Redis is unconfigured, mirroring `lib/chatbot/redis.ts`.
 */

import { Redis } from "@upstash/redis";

import { newsletterIssueSchema, type IssueMeta, type NewsletterIssueData } from "./schema";

const DRAFT_PREFIX = "newsletter:draft:";
const STATUS_PREFIX = "newsletter:status:";

/** Drafts live long enough to span a full month's review window. */
const DRAFT_TTL_SECONDS = 45 * 24 * 60 * 60;
/** Status outlives the draft so a sent issue's record survives draft expiry. */
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
    console.warn(
      "[Newsletter] Upstash Redis not configured (draft staging disabled)"
    );
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
 * Stages a full issue draft under `newsletter:draft:<id>` with a 45-day TTL.
 * Returns false when Redis is unavailable or the write fails.
 */
export async function saveDraft(issue: NewsletterIssueData): Promise<boolean> {
  const r = getNewsletterRedis();
  if (!r) return false;

  try {
    await r.set(`${DRAFT_PREFIX}${issue.id}`, JSON.stringify(issue), {
      ex: DRAFT_TTL_SECONDS,
    });
    return true;
  } catch (error) {
    console.error("[Newsletter] Failed to save draft:", error);
    return false;
  }
}

/**
 * Reads and zod-validates the staged draft for `id`. Returns null when missing,
 * invalid, or Redis is unavailable.
 */
export async function getDraft(id: string): Promise<NewsletterIssueData | null> {
  const r = getNewsletterRedis();
  if (!r) return null;

  try {
    const raw = coerceObject(await r.get(`${DRAFT_PREFIX}${id}`));
    if (!raw) return null;
    const parsed = newsletterIssueSchema.safeParse(raw);
    return parsed.success ? parsed.data : null;
  } catch (error) {
    console.error("[Newsletter] Failed to read draft:", error);
    return null;
  }
}

/** True when a staged draft exists for `id`. False on any error / no Redis. */
export async function hasDraft(id: string): Promise<boolean> {
  const r = getNewsletterRedis();
  if (!r) return false;

  try {
    return (await r.exists(`${DRAFT_PREFIX}${id}`)) === 1;
  } catch (error) {
    console.error("[Newsletter] Failed to check draft existence:", error);
    return false;
  }
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
