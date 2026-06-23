/**
 * Lightweight chatbot question analytics, backed by Upstash Redis.
 *
 * Written from a Next.js `after()` callback so it never blocks the streamed
 * response. Stores a frequency sorted-set of questions plus a capped list of the
 * most recent questions, to inform improvements to the assistant and the preset
 * questions. No database migration required; degrades silently if Redis is
 * unconfigured.
 */

import { getChatRedis } from "./redis";

const QUESTIONS_KEY = "chatbot:questions"; // sorted set: question -> count
const RECENT_KEY = "chatbot:recent"; // list of recent {q,t}
const RECENT_MAX = 200;

/** Record a visitor question. Safe to call fire-and-forget; never throws. */
export async function logChatQuestion(question: string): Promise<void> {
  const r = getChatRedis();
  if (!r) return;

  const q = question.trim().slice(0, 500);
  if (!q) return;

  try {
    await r.zincrby(QUESTIONS_KEY, 1, q.toLowerCase());
    await r.lpush(RECENT_KEY, JSON.stringify({ q, t: Date.now() }));
    await r.ltrim(RECENT_KEY, 0, RECENT_MAX - 1);
  } catch (error) {
    console.error("[Chat] Failed to log question analytics:", error);
  }
}
