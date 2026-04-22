/**
 * Dump everything the She Sharp Event Collector bot can see in a channel.
 *
 * Emits a single JSON object on stdout. Runs from the repo root and reads
 * SLACK_BOT_TOKEN from .env via dotenv.
 *
 * Usage:
 *   npx tsx .claude/skills/sync-event-from-slack/scripts/fetch-channel.ts <channelNameOrId>
 *
 * Output shape:
 * {
 *   channel:   { id, name, purpose, topic, num_members, created, is_archived },
 *   pinned:    [ { ts, user_id, user_name, text, files[], links[] } ],
 *   bookmarks: [ { title, link, emoji, type, rank } ],
 *   users:     { [user_id]: { real_name, display_name } },
 *   messages:  [ NormalizedMessage ]
 * }
 *
 * NormalizedMessage =
 *   { ts, iso, user_id, user_name, text, subtype, reactions[], files[], links[],
 *     thread: NormalizedMessage[] }
 */

import "dotenv/config";
import { WebClient } from "@slack/web-api";

const token = process.env.SLACK_BOT_TOKEN;
if (!token) {
  console.error("SLACK_BOT_TOKEN is not set in .env");
  process.exit(1);
}
const slack = new WebClient(token);

const raw = process.argv[2];
if (!raw) {
  console.error("Usage: fetch-channel.ts <channelNameOrId>");
  process.exit(2);
}

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

async function fetchThread(channelId: string, parent: NormalizedMessage, rawCount: number): Promise<void> {
  if (!rawCount || rawCount <= 0) return;
  let cursor: string | undefined;
  do {
    const r = await slack.conversations.replies({
      channel: channelId,
      ts: parent.ts,
      limit: 200,
      cursor,
    });
    const rest = (r.messages ?? []).slice(1); // drop parent duplicate
    for (const m of rest) {
      const uname = await resolveUser((m as any).user);
      parent.thread.push(normalize(m, uname));
    }
    cursor = r.response_metadata?.next_cursor || undefined;
  } while (cursor);
}

async function main() {
  const channelId = await resolveChannel(raw);

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

  // pinned
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

  // full history with threads
  const rawMessages: any[] = [];
  let cursor: string | undefined;
  do {
    const r = await slack.conversations.history({ channel: channelId, limit: 200, cursor });
    for (const m of r.messages ?? []) rawMessages.push(m);
    cursor = r.response_metadata?.next_cursor || undefined;
  } while (cursor);
  rawMessages.sort((a, b) => Number(a.ts) - Number(b.ts));

  const messages: NormalizedMessage[] = [];
  for (const rm of rawMessages) {
    const uname = await resolveUser(rm.user);
    const n = normalize(rm, uname);
    await fetchThread(channelId, n, rm.reply_count ?? 0);
    messages.push(n);
  }

  const users: Record<string, { real_name: string; display_name: string }> = {};
  for (const [id, v] of userCache.entries()) users[id] = v;

  // stable serialization
  process.stdout.write(JSON.stringify({ channel, pinned: pinnedItems, bookmarks, users, messages }, null, 2));
}

main().catch((e) => {
  console.error("FATAL:", e?.data ?? e?.message ?? e);
  process.exit(1);
});
