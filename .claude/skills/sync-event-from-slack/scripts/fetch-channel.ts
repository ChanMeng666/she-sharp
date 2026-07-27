/**
 * Dump what the She Sharp Event Collector bot can see in a channel.
 *
 * Emits a single JSON object on stdout. Runs from the repo root and reads
 * SLACK_BOT_TOKEN from .env via dotenv.
 *
 * Usage:
 *   # Full fetch (default — back-compatible)
 *   npx tsx .../fetch-channel.ts <channelNameOrId>
 *
 *   # Incremental: only messages/threads new since a watermark ts
 *   npx tsx .../fetch-channel.ts <channelNameOrId> --since 1717300000.123456
 *
 *   # Incremental using the watermark stored in the manifest for this channel
 *   npx tsx .../fetch-channel.ts <channelNameOrId> --state
 *
 *   # Reuse a same-session cached payload when the channel hasn't changed
 *   npx tsx .../fetch-channel.ts <channelNameOrId> --use-cache
 *
 * Output shape:
 * {
 *   _meta:     { mode, since, newWatermarkTs, threadState, newCount, priorDigest, fromCache },
 *   channel:   { id, name, purpose, topic, num_members, created, is_archived },
 *   pinned:    [ NormalizedMessage ],   // always included (canonical)
 *   bookmarks: [ { title, link, emoji, type, rank } ],
 *   users:     { [user_id]: { real_name, display_name } },
 *   messages:  [ NormalizedMessage ]    // in incremental mode: only new/changed
 * }
 *
 * `_meta.threadState` is the full current per-thread { replyCount, latestReplyTs }
 * map — feed it (with newWatermarkTs) to update-state.ts so the next run reads
 * only the delta. In incremental mode `messages[]` carries only new top-level
 * messages plus any older thread that gained replies (with just its new replies).
 */

import "dotenv/config";
import { WebClient } from "@slack/web-api";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { CACHE_DIR, loadManifest, type ThreadState } from "./state-lib";

const token = process.env.SLACK_BOT_TOKEN;
if (!token) {
  console.error("SLACK_BOT_TOKEN is not set in .env");
  process.exit(1);
}
const slack = new WebClient(token);

// ---- arg parsing ----------------------------------------------------------
const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith("--")).map((a) => a.split("=")[0]));
const sinceFlag = argv.find((a) => a.startsWith("--since"));
const positional = argv.filter((a) => !a.startsWith("--"));
const raw = positional[0];
if (!raw) {
  console.error("Usage: fetch-channel.ts <channelNameOrId> [--since <ts>] [--state] [--use-cache]");
  process.exit(2);
}
let sinceArg: string | undefined;
if (sinceFlag) {
  sinceArg = sinceFlag.includes("=") ? sinceFlag.split("=")[1] : argv[argv.indexOf(sinceFlag) + 1];
}
const useState = flags.has("--state");
const useCache = flags.has("--use-cache");

async function resolveChannel(nameOrId: string): Promise<string> {
  if (/^[CGD][A-Z0-9]+$/i.test(nameOrId)) return nameOrId; // looks like an ID
  const clean = nameOrId.replace(/^#/, "");
  let cursor: string | undefined;
  do {
    const r = await slack.conversations.list({
      types: "public_channel,private_channel",
      limit: 1000,
      cursor,
      exclude_archived: false,
    });
    for (const c of r.channels ?? []) {
      if (c.name === clean) return c.id!;
    }
    cursor = r.response_metadata?.next_cursor || undefined;
  } while (cursor);
  throw new Error(`Channel "${clean}" not found (or bot lacks visibility)`);
}

/** Expand Slack link markup like <url|label> plus bare http(s) links. */
function extractLinks(text: string): string[] {
  const out = new Set<string>();
  const slackFmt = /<((?:https?:\/\/|mailto:)[^|>\s]+)(?:\|[^>]+)?>/g;
  let m: RegExpExecArray | null;
  while ((m = slackFmt.exec(text))) out.add(m[1]);
  const bare = /(?<!<)(https?:\/\/[^\s<>"]+)/g;
  while ((m = bare.exec(text))) out.add(m[1]);
  return [...out];
}

interface NormalizedMessage {
  ts: string;
  iso: string;
  user_id: string | undefined;
  user_name: string;
  text: string;
  subtype: string | undefined;
  reactions: { name: string; count: number }[];
  files: {
    id: string;
    name: string;
    title: string;
    filetype: string;
    mimetype: string;
    size: number;
    url_private: string;
    url_private_download: string;
    permalink: string;
  }[];
  links: string[];
  thread: NormalizedMessage[];
}

const userCache = new Map<string, { real_name: string; display_name: string }>();

async function resolveUser(id: string | undefined): Promise<string> {
  if (!id) return "";
  const cached = userCache.get(id);
  if (cached) return cached.display_name || cached.real_name || id;
  try {
    const r = await slack.users.info({ user: id });
    const real = (r.user as any)?.real_name ?? "";
    const disp = (r.user as any)?.profile?.display_name ?? "";
    const entry = { real_name: real, display_name: disp };
    userCache.set(id, entry);
    return disp || real || id;
  } catch {
    userCache.set(id, { real_name: "", display_name: "" });
    return id;
  }
}

function normalize(m: any, userName: string): NormalizedMessage {
  const text = (m.text ?? "") as string;
  return {
    ts: m.ts,
    iso: new Date(Number(m.ts) * 1000).toISOString(),
    user_id: m.user,
    user_name: userName,
    text,
    subtype: m.subtype,
    reactions: (m.reactions ?? []).map((r: any) => ({ name: r.name, count: r.count })),
    files: (m.files ?? []).map((f: any) => ({
      id: f.id,
      name: f.name ?? "",
      title: f.title ?? "",
      filetype: f.filetype ?? "",
      mimetype: f.mimetype ?? "",
      size: f.size ?? 0,
      url_private: f.url_private ?? "",
      url_private_download: f.url_private_download ?? f.url_private ?? "",
      permalink: f.permalink ?? "",
    })),
    links: extractLinks(text),
    thread: [],
  };
}

/**
 * Fetch thread replies for a parent. When `sinceReplyTs` is given, only replies
 * strictly newer than it are returned — this is what lets us pick up a fresh
 * reply on an OLD thread (whose parent ts is below the top-level watermark)
 * without re-reading the whole thread.
 */
async function fetchThread(
  channelId: string,
  parent: NormalizedMessage,
  rawCount: number,
  sinceReplyTs?: string,
): Promise<void> {
  if (!rawCount || rawCount <= 0) return;
  let cursor: string | undefined;
  do {
    const r = await slack.conversations.replies({ channel: channelId, ts: parent.ts, limit: 200, cursor });
    const rest = (r.messages ?? []).slice(1); // drop parent duplicate
    for (const m of rest) {
      if (sinceReplyTs && Number((m as any).ts) <= Number(sinceReplyTs)) continue;
      const uname = await resolveUser((m as any).user);
      parent.thread.push(normalize(m, uname));
    }
    cursor = r.response_metadata?.next_cursor || undefined;
  } while (cursor);
}

function cachePath(channelId: string): string {
  return resolve(CACHE_DIR, `${channelId}.json`);
}

/** One-message peek to learn the channel's current latest ts cheaply. */
async function peekLatestTs(channelId: string): Promise<string> {
  const r = await slack.conversations.history({ channel: channelId, limit: 1 });
  return (r.messages?.[0] as any)?.ts ?? "0";
}

async function main() {
  const channelId = await resolveChannel(raw);

  // Resolve the incremental watermark + prior thread state.
  let since = sinceArg;
  let priorThreads: Record<string, ThreadState> = {};
  let priorDigest = "";
  if (useState) {
    const manifest = loadManifest();
    const cs = manifest.channels[channelId];
    if (cs) {
      since = since ?? cs.watermarkTs;
      priorThreads = cs.threads ?? {};
      priorDigest = cs.digest ?? "";
    }
  }
  const incremental = !!since;

  // Session cache: skip the full fetch when the channel hasn't moved.
  if (useCache && existsSync(cachePath(channelId))) {
    try {
      const cached = JSON.parse(readFileSync(cachePath(channelId), "utf8"));
      const latest = await peekLatestTs(channelId);
      if (cached._meta?.newWatermarkTs === latest && !incremental) {
        cached._meta.fromCache = true;
        process.stdout.write(JSON.stringify(cached, null, 2));
        return;
      }
    } catch {
      /* fall through to a live fetch */
    }
  }

  // channel metadata
  const infoRes = await slack.conversations.info({ channel: channelId, include_num_members: true });
  const c: any = infoRes.channel;
  const channel = {
    id: channelId,
    name: c?.name ?? "",
    purpose: c?.purpose?.value ?? "",
    topic: c?.topic?.value ?? "",
    num_members: c?.num_members ?? 0,
    created: c?.created ? new Date(c.created * 1000).toISOString() : "",
    is_archived: !!c?.is_archived,
  };

  // pinned (always — canonical regardless of watermark)
  const pinnedItems: NormalizedMessage[] = [];
  try {
    const p = await slack.pins.list({ channel: channelId });
    for (const item of p.items ?? []) {
      const msg = (item as any).message;
      if (!msg) continue;
      const uname = await resolveUser(msg.user);
      pinnedItems.push(normalize(msg, uname));
    }
  } catch {}

  // bookmarks
  let bookmarks: any[] = [];
  try {
    const b = await (slack as any).bookmarks.list({ channel_id: channelId });
    bookmarks = (b.bookmarks ?? []).map((bk: any) => ({
      title: bk.title,
      link: bk.link,
      emoji: bk.emoji ?? "",
      type: bk.type,
      rank: bk.rank ?? "",
    }));
  } catch {}

  // Full raw history (cheap API). Threads are expanded selectively below.
  const rawMessages: any[] = [];
  let cursor: string | undefined;
  do {
    const r = await slack.conversations.history({ channel: channelId, limit: 200, cursor });
    for (const m of r.messages ?? []) rawMessages.push(m);
    cursor = r.response_metadata?.next_cursor || undefined;
  } while (cursor);
  rawMessages.sort((a, b) => Number(a.ts) - Number(b.ts));

  // Build the full current thread-state map (every parent that has replies),
  // independent of what we choose to emit — the next run needs the complete map.
  const threadState: Record<string, ThreadState> = {};
  for (const rm of rawMessages) {
    if ((rm.reply_count ?? 0) > 0) {
      threadState[rm.ts] = {
        replyCount: rm.reply_count,
        latestReplyTs: rm.latest_reply ?? rm.ts,
      };
    }
  }

  const newWatermarkTs = rawMessages.length ? rawMessages[rawMessages.length - 1].ts : (since ?? "0");

  // Decide which parents to emit.
  const messages: NormalizedMessage[] = [];
  for (const rm of rawMessages) {
    const isNewTopLevel = !incremental || Number(rm.ts) > Number(since);
    const prior = priorThreads[rm.ts];
    const threadGrew =
      incremental &&
      (rm.reply_count ?? 0) > 0 &&
      prior != null &&
      ((rm.reply_count ?? 0) > prior.replyCount || Number(rm.latest_reply ?? 0) > Number(prior.latestReplyTs));

    if (!isNewTopLevel && !threadGrew) continue;

    const uname = await resolveUser(rm.user);
    const n = normalize(rm, uname);
    // New top-level → full thread. Old-but-grown thread → only the new replies.
    const sinceReplyTs = isNewTopLevel ? undefined : prior?.latestReplyTs;
    await fetchThread(channelId, n, rm.reply_count ?? 0, sinceReplyTs);
    messages.push(n);
  }

  const users: Record<string, { real_name: string; display_name: string }> = {};
  for (const [id, v] of userCache.entries()) users[id] = v;

  const payload = {
    _meta: {
      mode: incremental ? "incremental" : "full",
      since: since ?? null,
      newWatermarkTs,
      threadState,
      newCount: messages.length,
      // What was understood last sync — read this FIRST to re-orient, then read
      // only the new messages below rather than re-deriving from scratch.
      priorDigest,
      fromCache: false,
    },
    channel,
    pinned: pinnedItems,
    bookmarks,
    users,
    messages,
  };

  // Always refresh the session cache with the latest full/delta payload.
  try {
    mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(cachePath(channelId), JSON.stringify(payload, null, 2));
  } catch {}

  process.stdout.write(JSON.stringify(payload, null, 2));
}

main().catch((e) => {
  console.error("FATAL:", e?.data ?? e?.message ?? e);
  process.exit(1);
});
