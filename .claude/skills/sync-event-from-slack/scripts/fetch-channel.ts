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
 *   # Write straight to a file instead of stdout — ATOMIC, no shell redirect
 *   npx tsx .../fetch-channel.ts <channelNameOrId> --out raw/C123.json
 *
 *   # Many conversations in ONE process, resumable
 *   npx tsx .../fetch-channel.ts --many ids.txt --out-dir <archive>/raw --skip-existing
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

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  announceIdentity,
  conversationName,
  CONVERSATION_TYPES,
  loadUserNames,
  slack,
  USING_USER_TOKEN,
} from "./slack-client";
import {
  CACHE_DIR,
  loadManifest,
  mergeThreadState,
  threadHasUnread,
  type ThreadState,
} from "./state-lib";

announceIdentity();

// ---- arg parsing ----------------------------------------------------------
const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith("--")).map((a) => a.split("=")[0]));
const sinceFlag = argv.find((a) => a.startsWith("--since"));
function argValue(name: string): string | undefined {
  const eq = argv.find((a) => a.startsWith(`${name}=`));
  if (eq) return eq.slice(name.length + 1);
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}
const manyFile = argValue("--many");
const outDir = argValue("--out-dir");
const outPath = argValue("--out");
const skipExisting = flags.has("--skip-existing");

/* Values consumed by --many/--out/--out-dir must not be mistaken for the
   channel argument, or `--out foo.json` would try to fetch a channel called
   "foo.json". */
const consumed = new Set([manyFile, outDir, outPath].filter(Boolean) as string[]);
const positional = argv.filter((a) => !a.startsWith("--") && !consumed.has(a));
const raw = positional[0];
if (!raw && !manyFile) {
  console.error(
    "Usage: fetch-channel.ts <channelNameOrId> [--since <ts>] [--state] [--use-cache] [--out <path>]\n" +
      "       fetch-channel.ts --many <ids.txt> --out-dir <dir> [--skip-existing]",
  );
  process.exit(2);
}
let sinceArg: string | undefined;
if (sinceFlag) {
  sinceArg = sinceFlag.includes("=") ? sinceFlag.split("=")[1] : argv[argv.indexOf(sinceFlag) + 1];
}
const useState = flags.has("--state");
const useCache = flags.has("--use-cache");

/**
 * Accepts a channel ID, `#channel`, a bare channel name, or — on a user token —
 * a DM addressed as `dm:name`, `@name` or the person's display name.
 */
async function resolveChannel(nameOrId: string): Promise<string> {
  if (/^[CGD][A-Z0-9]+$/i.test(nameOrId)) return nameOrId; // looks like an ID
  const clean = nameOrId.replace(/^[#@]/, "");
  // `dm:someone` / `@someone` addresses a person, not a channel name.
  const dmTarget = /^dm:/i.test(nameOrId)
    ? nameOrId.replace(/^dm:/i, "")
    : nameOrId.startsWith("@")
      ? clean
      : "";
  const users = USING_USER_TOKEN ? await loadUserNames() : undefined;

  let cursor: string | undefined;
  do {
    const r = await slack.conversations.list({
      types: CONVERSATION_TYPES,
      limit: 1000,
      cursor,
      exclude_archived: false,
    });
    for (const c of r.channels ?? []) {
      const anyC = c as any;
      if (!anyC.is_im && c.name === clean) return c.id!;
      if (dmTarget && anyC.is_im) {
        const who = users?.get(anyC.user) ?? "";
        if (who.toLowerCase() === dmTarget.toLowerCase() || anyC.user === dmTarget)
          return c.id!;
      }
      // Bare name that happens to match a DM partner, e.g. `fetch-channel "Nikita Kumari"`.
      if (!dmTarget && anyC.is_im && users) {
        if (conversationName(anyC, users).toLowerCase() === `dm:${clean.toLowerCase()}`)
          return c.id!;
      }
    }
    cursor = r.response_metadata?.next_cursor || undefined;
  } while (cursor);

  const hint = USING_USER_TOKEN
    ? "not found in any channel or DM you can see"
    : "not found — a DM or an uninvited private channel needs SLACK_USER_TOKEN (xoxp-)";
  throw new Error(`Conversation "${nameOrId}" ${hint}`);
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

/**
 * The workspace directory, seeded once and shared across runs via the disk
 * cache in `slack-client.ts`.
 *
 * Without it every message author cost a `users.info` call, and `userCache` is
 * module-scoped — so fetching 105 conversations in 105 processes re-resolved the
 * same people 105 times over. The directory answers almost all of them from one
 * cached read; `users.info` stays as the fallback for ids the directory does not
 * carry (bots, deactivated accounts, external users in shared channels).
 *
 * Deliberately lazy: a run that resolves nobody should not pay for it either.
 */
let directory: Promise<Map<string, string>> | undefined;

async function resolveUser(id: string | undefined): Promise<string> {
  if (!id) return "";
  const cached = userCache.get(id);
  if (cached) return cached.display_name || cached.real_name || id;

  directory ??= loadUserNames();
  const known = (await directory).get(id);
  if (known) {
    userCache.set(id, { real_name: known, display_name: "" });
    return known;
  }

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

/** One conversation, fetched. Returns null only when `--use-cache` served it. */
async function fetchOne(nameOrId: string): Promise<any> {
  const channelId = await resolveChannel(nameOrId);

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
        return cached;
      }
    } catch {
      /* fall through to a live fetch */
    }
  }

  // channel metadata
  const infoRes = await slack.conversations.info({ channel: channelId, include_num_members: true });
  const c: any = infoRes.channel;
  // A 1:1 DM has no `name` — label it after the other person so the delta
  // header and the state manifest both read as `dm:<who>` rather than blank.
  const dmLabel = c?.is_im ? `dm:${await resolveUser(c.user)}` : "";
  const channel = {
    id: channelId,
    name: c?.name ?? dmLabel,
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

  const newWatermarkTs = rawMessages.length ? rawMessages[rawMessages.length - 1].ts : (since ?? "0");

  // Decide which parents to emit.
  const messages: NormalizedMessage[] = [];
  const delivered = new Set<string>();
  for (const rm of rawMessages) {
    const isNewTopLevel = !incremental || Number(rm.ts) > Number(since);
    const prior = priorThreads[rm.ts];
    // Shared with the triage peek — see `threadHasUnread` for why an absent
    // prior must mean "zero replies seen" rather than "skip". The cost of that
    // rule is that a channel whose stored state predates thread tracking
    // re-emits its old threads once: noisy, recoverable, and far cheaper than
    // the alternative.
    const threadGrew = incremental && threadHasUnread(rm, prior);

    if (!isNewTopLevel && !threadGrew) continue;

    const uname = await resolveUser(rm.user);
    const n = normalize(rm, uname);
    // New top-level → full thread. Old-but-grown thread → only the new replies.
    const sinceReplyTs = isNewTopLevel ? undefined : prior?.latestReplyTs;
    await fetchThread(channelId, n, rm.reply_count ?? 0, sinceReplyTs);
    delivered.add(rm.ts);
    messages.push(n);
  }

  /*
   * THREAD STATE RECORDS WHAT WAS DELIVERED, NOT WHAT EXISTS.
   *
   * This map used to be built from the full history before the emit loop, on
   * the reasoning that "the next run needs the complete map". That reasoning is
   * inverted: the map is a READ RECEIPT, and `update-state.ts` writes it
   * straight into the committed manifest. Recording the current reply count for
   * a thread this run chose not to emit tells every future run that six replies
   * nobody has seen were read — which is exactly how the 4 August deck review
   * came within one command of being erased instead of merely missed.
   *
   * So: a delivered thread advances, and an undelivered one keeps whatever it
   * had before (nothing, if it was never seen). Any future bug in the emit
   * decision above therefore leaves a thread looking unread and gets caught on
   * the next run, instead of covering its own tracks.
   */
  const threadState = mergeThreadState(rawMessages, delivered, priorThreads);

  /*
   * The users map carries THIS conversation's people, not everyone the process
   * happens to have resolved.
   *
   * `userCache` is module-scoped, so under `--many` it accumulates across every
   * conversation in the batch — dumping it wholesale made a payload's user map
   * depend on what had been fetched before it in the run. Same messages, same
   * names, different bytes on every reordering, in files whose whole purpose is
   * to be a stable verbatim record under git.
   *
   * Collected from the payload itself: message authors, thread reply authors,
   * pinned-message authors, anyone `<@U…>`-mentioned in any body, and the DM
   * partner (who authors nothing in a one-sided DM but still names the file).
   */
  const referenced = new Set<string>();
  if (c?.is_im && c.user) referenced.add(c.user);
  const collect = (m: NormalizedMessage) => {
    if (m.user_id) referenced.add(m.user_id);
    for (const hit of (m.text ?? "").matchAll(/<@([A-Z0-9]+)/g)) referenced.add(hit[1]);
    for (const r of m.thread ?? []) collect(r);
  };
  messages.forEach(collect);
  pinnedItems.forEach(collect);

  const users: Record<string, { real_name: string; display_name: string }> = {};
  for (const id of [...referenced].sort()) {
    const v = userCache.get(id);
    if (v) users[id] = v;
  }

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

  return payload;
}

/**
 * Write a payload where the caller asked for it, atomically.
 *
 * `npx tsx fetch-channel.ts <id> > raw/<id>.json` truncates the target BEFORE
 * the script runs, so a crash — or a rate-limit abort forty minutes into a
 * refresh — replaces a good full transcript with an empty file. The shell does
 * that, not this script, and the only way to stop it is to not use the shell.
 * Write to a sibling temp file and rename: a reader either sees the old file or
 * the new one, never a half-written one.
 */
function writePayload(path: string, payload: any): void {
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, JSON.stringify(payload, null, 2));
  renameSync(tmp, path);
}

async function main() {
  /*
   * `--many` fetches a list of conversations in ONE process.
   *
   * The saving is not the process startup, though 207 × ~1.5s is real. It is
   * that `resolveUser`'s directory, the user cache and the Slack client are all
   * module-scoped: a process per conversation re-pays for them every time, and
   * a full ingest re-resolved the same 3,000 authors over and over.
   *
   * It also removes the loop that every caller was writing by hand around this
   * script — temp file, validate mode, move, log, continue on error — which is
   * the kind of thing that is correct in the copy that was tested and subtly
   * wrong in the next one.
   *
   * A failure never aborts the batch: a conversation that throws is logged and
   * skipped, its output file is left untouched rather than truncated, and the
   * exit code counts the failures so a caller can just re-run. Re-running is
   * free for anything already written, because `--skip-existing` checks for a
   * complete payload first.
   */
  if (manyFile) {
    if (!outDir) {
      console.error("--many requires --out-dir <dir>");
      process.exit(2);
    }
    mkdirSync(outDir, { recursive: true });
    const ids = readFileSync(manyFile, "utf8")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"));

    let ok = 0;
    let skipped = 0;
    const failed: string[] = [];
    for (const [i, id] of ids.entries()) {
      const dest = resolve(outDir, `${id}.json`);
      if (skipExisting && existsSync(dest)) {
        try {
          const p = JSON.parse(readFileSync(dest, "utf8"));
          if (p?._meta?.mode === "full") {
            skipped++;
            console.error(`[${i + 1}/${ids.length}] skip ${id} (already full)`);
            continue;
          }
        } catch {
          /* unreadable or truncated — refetch over it */
        }
      }
      try {
        const payload = await fetchOne(id);
        writePayload(dest, payload);
        ok++;
        console.error(
          `[${i + 1}/${ids.length}] ok   ${id}  ${payload.messages.length} msg, ` +
            `${Object.keys(payload._meta.threadState ?? {}).length} threads`,
        );
      } catch (e: any) {
        failed.push(id);
        console.error(`[${i + 1}/${ids.length}] FAIL ${id}: ${e?.data?.error ?? e?.message ?? e}`);
      }
    }
    console.error(
      `\n${ok} fetched, ${skipped} skipped, ${failed.length} failed` +
        (failed.length ? `: ${failed.join(" ")}` : "") +
        `\nRe-run the same command to retry only what failed.`,
    );
    process.exit(Math.min(failed.length, 250));
  }

  const payload = await fetchOne(raw);
  if (outPath) writePayload(outPath, payload);
  else process.stdout.write(JSON.stringify(payload, null, 2));
}

main().catch((e) => {
  console.error("FATAL:", e?.data ?? e?.message ?? e);
  process.exit(1);
});
