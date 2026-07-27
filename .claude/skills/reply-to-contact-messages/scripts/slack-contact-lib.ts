/**
 * Shared Slack-side helpers for the reply-to-contact-messages skill.
 *
 * Why this exists: both `fetch-contact-notifications.ts` (raw dump) and
 * `reconcile-inbox.ts` (DB ⨝ Slack join) need the exact same understanding of a
 * `#contact-form-notifications` message — how the Block Kit payload written by
 * `lib/slack/service.ts:sendContactSlackNotification` maps back onto a
 * `contact_form_submissions` row. Duplicating that parser would let the two
 * scripts drift apart and silently disagree about who has already been replied
 * to, which is exactly the failure mode this skill is meant to prevent.
 *
 * Block Kit shape produced by the webhook (see lib/slack/service.ts):
 *   blocks[0]  header   "New Contact Form Submission"
 *   blocks[1]  section  fields[]: "*Name:*\n…", "*Email:*\n…", "*Organisation:*\n…"
 *   blocks[2]  section  text: "*Message:*\n…"
 *   blocks[3]  context  "Submission #<id> · contact form|sponsor enquiry"  (NEW — see below)
 *   blocks[-1] divider
 *
 * The `context` block was only added in 2026-07; every message posted before
 * that carries no submission id at all. That is why the reconcile step keeps a
 * fuzzy (email + time-window) fallback rather than relying on the id alone.
 *
 * Reads SLACK_BOT_TOKEN from .env via dotenv. All calls here are READ-ONLY.
 */

import "dotenv/config";
import { WebClient } from "@slack/web-api";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
/** …/.claude/skills/reply-to-contact-messages */
export const SKILL_ROOT = resolve(SCRIPT_DIR, "..");
export const CACHE_DIR = resolve(SKILL_ROOT, ".cache");
export const NOTIFICATIONS_CACHE_PATH = resolve(CACHE_DIR, "contact-notifications.json");
/** repo root (three levels above the skill root: …/.claude/skills/<skill>) */
export const REPO_ROOT = resolve(SKILL_ROOT, "..", "..", "..");

/** #contact-form-notifications. Hard-coded: the bot is already a member here. */
export const CONTACT_CHANNEL_ID = "C0AGVRL0G5A";
export const CONTACT_CHANNEL_NAME = "contact-form-notifications";

/** conversations.history / .replies are Tier 3 (≈50 req/min). Be polite. */
const PAGE_DELAY_MS = 1100;
/** Per-message follow-up calls (replies, permalink). WebClient auto-retries 429. */
const PER_MESSAGE_DELAY_MS = 200;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NotificationSource = "contact" | "sponsor-inquiry";

export interface ParsedNotification {
  /** Slack message ts — doubles as the thread_ts for replies. */
  ts: string;
  permalink: string | null;
  /** From the `context` footer block. null for pre-2026-07 messages. */
  submissionId: number | null;
  source: NotificationSource | null;
  name: string | null;
  email: string | null;
  organisation: string | null;
  message: string | null;
  threadReplyCount: number;
  /** True when at least one thread reply came from a real user (not a bot). */
  hasHumanReply: boolean;
}

export interface FetchOptions {
  /** Only messages strictly newer than this Slack ts. */
  since?: string;
  /** Max top-level messages to consider (newest first). Default 200. */
  limit?: number;
  /** Resolve chat.getPermalink for each message. Default true. */
  withPermalinks?: boolean;
}

export interface FetchResult {
  channelId: string;
  fetchedAt: string;
  since: string | null;
  /** Latest ts seen this run — usable as the next `--since` watermark. */
  newWatermarkTs: string | null;
  /** How many raw messages were read before filtering to notifications. */
  rawMessageCount: number;
  notifications: ParsedNotification[];
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

/**
 * Build a WebClient from SLACK_BOT_TOKEN, exiting with a readable message when
 * the token is missing (the single most common first-run failure).
 */
export function createSlackClient(): WebClient {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    console.error("SLACK_BOT_TOKEN is not set in .env");
    process.exit(1);
  }
  return new WebClient(token);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// Tiny structural accessors — the Slack SDK types message payloads loosely, and
// this skill is strict-mode / no-`any`, so navigate through `unknown`.
// ---------------------------------------------------------------------------

function asRecord(v: unknown): Record<string, unknown> | null {
  return typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function asString(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function asNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

// ---------------------------------------------------------------------------
// Text normalisation
// ---------------------------------------------------------------------------

/**
 * Undo Slack's outbound text mangling: `<mailto:a@b|a@b>` and `<url|label>`
 * become their human-readable form, and the three escaped entities are decoded.
 * Slack linkifies every address it sees, so an un-unwrapped `*Email:*` field
 * would never string-compare equal to the value stored in the database.
 */
export function unwrapSlackMarkup(text: string): string {
  const unlinked = text.replace(
    /<(?:mailto:)?([^|>\s]+)(?:\|([^>]*))?>/g,
    (_match, url: string, label: string | undefined) => {
      const trimmed = (label ?? "").trim();
      return trimmed || url.replace(/^mailto:/, "");
    },
  );
  return unlinked.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

/** `*Label:*\nvalue` → value (already unwrapped). Returns null on no match. */
function fieldValue(fieldText: string, label: string): string | null {
  const re = new RegExp(`^\\*${label}:\\*\\s*\\n?([\\s\\S]*)$`, "i");
  const m = fieldText.match(re);
  if (!m) return null;
  const value = unwrapSlackMarkup(m[1]).trim();
  return value.length ? value : null;
}

// ---------------------------------------------------------------------------
// Block Kit parsing
// ---------------------------------------------------------------------------

interface ParsedBlocks {
  headerText: string | null;
  submissionId: number | null;
  source: NotificationSource | null;
  name: string | null;
  email: string | null;
  organisation: string | null;
  message: string | null;
}

/**
 * Pull the submission fields back out of a Block Kit notification. Every field
 * is independently optional so a partially-changed template degrades to nulls
 * instead of throwing — a message we cannot fully parse must still surface, so
 * the human sees that something is there.
 */
export function parseNotificationBlocks(message: Record<string, unknown>): ParsedBlocks {
  const out: ParsedBlocks = {
    headerText: null,
    submissionId: null,
    source: null,
    name: null,
    email: null,
    organisation: null,
    message: null,
  };

  for (const rawBlock of asArray(message.blocks)) {
    const block = asRecord(rawBlock);
    if (!block) continue;
    const type = asString(block.type);

    if (type === "header") {
      out.headerText = asString(asRecord(block.text)?.text);
      continue;
    }

    if (type === "section") {
      // Field grid: Name / Email / Organisation.
      for (const rawField of asArray(block.fields)) {
        const text = asString(asRecord(rawField)?.text);
        if (!text) continue;
        out.name ??= fieldValue(text, "Name");
        out.email ??= fieldValue(text, "Email");
        out.organisation ??= fieldValue(text, "Organisation");
      }
      // Body section: "*Message:*\n…".
      const sectionText = asString(asRecord(block.text)?.text);
      if (sectionText) out.message ??= fieldValue(sectionText, "Message");
      continue;
    }

    if (type === "context") {
      for (const rawElement of asArray(block.elements)) {
        const text = asString(asRecord(rawElement)?.text);
        if (!text) continue;
        const m = text.match(/Submission\s+#(\d+)\s*·\s*(contact form|sponsor enquiry)/i);
        if (!m) continue;
        out.submissionId = Number(m[1]);
        out.source = m[2].toLowerCase() === "sponsor enquiry" ? "sponsor-inquiry" : "contact";
      }
    }
  }

  // Fall back to the plain-text mirror when blocks are absent or restyled.
  if (out.email === null) {
    const plain = asString(message.text);
    if (plain) {
      const m = unwrapSlackMarkup(plain).match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
      if (m) out.email = m[0];
    }
  }

  return out;
}

/**
 * Does this message look like a contact-form notification at all? Channels also
 * carry joins, human chatter and the reply-notes this skill posts; treating
 * those as submissions would inflate the `slackOnly` bucket with noise.
 */
function isContactNotification(parsed: ParsedBlocks, message: Record<string, unknown>): boolean {
  if (parsed.submissionId !== null) return true;
  if (asString(message.subtype) === "channel_join") return false;
  if (message.thread_ts !== undefined && asString(message.thread_ts) !== asString(message.ts)) return false;
  if (parsed.headerText && /contact form submission|sponsor/i.test(parsed.headerText)) return true;
  return parsed.email !== null && parsed.name !== null;
}

// ---------------------------------------------------------------------------
// Fetching
// ---------------------------------------------------------------------------

/**
 * Did any real person reply in this thread? Only called for parents that
 * already advertise `reply_count > 0`, so the extra API call is spent on the
 * handful of threads that can possibly matter rather than on every message.
 */
async function threadHasHumanReply(client: WebClient, ts: string): Promise<boolean> {
  const res = await client.conversations.replies({ channel: CONTACT_CHANNEL_ID, ts, limit: 200 });
  const replies = asArray(res.messages).slice(1); // drop the duplicated parent
  for (const raw of replies) {
    const reply = asRecord(raw);
    if (!reply) continue;
    const isBot = reply.bot_id !== undefined || asString(reply.subtype) === "bot_message";
    if (!isBot && asString(reply.user)) return true;
  }
  return false;
}

/**
 * Read `#contact-form-notifications` and return one ParsedNotification per
 * contact-form message, oldest first.
 */
export async function fetchContactNotifications(
  client: WebClient,
  options: FetchOptions = {},
): Promise<FetchResult> {
  const limit = options.limit ?? 200;
  const withPermalinks = options.withPermalinks ?? true;
  const since = options.since ?? null;

  const raw: Record<string, unknown>[] = [];
  let cursor: string | undefined;
  do {
    const res = await client.conversations.history({
      channel: CONTACT_CHANNEL_ID,
      limit: Math.min(200, Math.max(1, limit - raw.length)),
      cursor,
      ...(since ? { oldest: since, inclusive: false } : {}),
    });
    for (const m of asArray(res.messages)) {
      const rec = asRecord(m);
      if (rec) raw.push(rec);
    }
    cursor = res.response_metadata?.next_cursor || undefined;
    if (cursor && raw.length < limit) await sleep(PAGE_DELAY_MS);
  } while (cursor && raw.length < limit);

  raw.sort((a, b) => Number(asString(a.ts) ?? "0") - Number(asString(b.ts) ?? "0"));

  const notifications: ParsedNotification[] = [];
  for (const message of raw) {
    const ts = asString(message.ts);
    if (!ts) continue;
    const parsed = parseNotificationBlocks(message);
    if (!isContactNotification(parsed, message)) continue;

    const threadReplyCount = asNumber(message.reply_count) ?? 0;
    let hasHumanReply = false;
    if (threadReplyCount > 0) {
      try {
        hasHumanReply = await threadHasHumanReply(client, ts);
      } catch {
        // A thread we cannot read is reported as "no known human reply" — the
        // reconcile step treats this as advisory only, never as a send gate.
        hasHumanReply = false;
      }
      await sleep(PER_MESSAGE_DELAY_MS);
    }

    let permalink: string | null = null;
    if (withPermalinks) {
      try {
        const res = await client.chat.getPermalink({ channel: CONTACT_CHANNEL_ID, message_ts: ts });
        permalink = asString(res.permalink);
      } catch {
        permalink = null;
      }
      await sleep(PER_MESSAGE_DELAY_MS);
    }

    notifications.push({
      ts,
      permalink,
      submissionId: parsed.submissionId,
      source: parsed.source,
      name: parsed.name,
      email: parsed.email,
      organisation: parsed.organisation,
      message: parsed.message,
      threadReplyCount,
      hasHumanReply,
    });
  }

  const newWatermarkTs = raw.length ? asString(raw[raw.length - 1].ts) : since;

  return {
    channelId: CONTACT_CHANNEL_ID,
    fetchedAt: new Date().toISOString(),
    since,
    newWatermarkTs,
    rawMessageCount: raw.length,
    notifications,
  };
}

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

/** Slack ts ("1717300000.123456") → epoch milliseconds. */
export function tsToMs(ts: string): number {
  return Number(ts) * 1000;
}

/** Mask an address for console/report output: `chanmeng6666@gmail.com` → `c***@gmail.com`. */
export function maskEmail(email: string | null): string {
  if (!email) return "—";
  const at = email.indexOf("@");
  if (at <= 0) return "***";
  return `${email[0]}***${email.slice(at)}`;
}
