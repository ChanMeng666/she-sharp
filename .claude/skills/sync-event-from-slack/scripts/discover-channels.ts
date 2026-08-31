/**
 * Triage front door for the sync-event-from-slack skill.
 *
 * Lists every channel the Collector bot can see, cross-references the committed
 * manifest (state/sync-state.json), and prints a COMPACT triage — one row per
 * channel, never message bodies — so Claude learns the whole workspace state
 * from a single cheap read and only drills into channels that actually changed.
 *
 * For each channel it determines: type (event vs general), bot membership,
 * known mapping, whether there's new content past the stored watermark, and —
 * for general channels — an in-script event-signal score (so chatter never
 * reaches Claude). A per-row `action` hint summarizes what to do next.
 *
 * Usage:
 *   npx tsx .../discover-channels.ts            # actionable triage (+ no-op count)
 *   npx tsx .../discover-channels.ts --all      # include no-op rows
 *   npx tsx .../discover-channels.ts --propose   # suggest event matches for unmapped event channels (backfill)
 *   npx tsx .../discover-channels.ts --join      # self-join public event channels the bot isn't in
 *   npx tsx .../discover-channels.ts --no-dms    # skip DMs and group DMs for this run
 *   npx tsx .../discover-channels.ts --no-record # inspect without advancing any read position
 *
 * Full machine-readable triage is always written to .cache/triage.json.
 *
 * The header also reports what this run could NOT see — known conversations the
 * current identity did not list at all. A row can say `readable: false`; a
 * conversation that never appeared cannot say anything, and on a bot token that
 * is every DM and every private channel the bot was not invited to.
 *
 * Conversations that are READ and found quiet have their read position advanced
 * in the committed manifest, so the next run sees a true delta. Actionable rows
 * are never advanced — moving their watermark would mark unread content as read.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  announceIdentity,
  botSlack,
  conversationName,
  CONVERSATION_TYPES,
  isDirectConversation,
  isReadable,
  loadUserNames,
  slack,
  USING_USER_TOKEN,
} from "./slack-client";
import {
  CACHE_DIR,
  classifyChannel,
  decideAction,
  detectEventSignal,
  findEventBySlug,
  fingerprintForMapping,
  isQuiet,
  isSignalScanned,
  loadManifest,
  nowIso,
  saveManifest,
  loadPublishedEvents,
  parseEventDateMs,
  scannedPosition,
  SIGNAL_THRESHOLD,
  threadHasUnread,
  unreadConversations,
  type ChannelType,
  type Mapping,
  type PublishedEvent,
  type TriageRow,
} from "./state-lib";

const flags = new Set(process.argv.slice(2).filter((a) => a.startsWith("--")));
const showAll = flags.has("--all");
const doPropose = flags.has("--propose");
const doJoin = flags.has("--join");
// DMs and group DMs are in scope by default once a user token is installed.
// `--no-dms` drops them for a run where only channel activity matters.
const skipDms = flags.has("--no-dms");
// Quiet conversations have their read position recorded by default, which is
// what keeps the next run a true delta. `--no-record` inspects without writing.
const skipRecord = flags.has("--no-record");

/**
 * How many grown threads one channel's peek will open to score for signal.
 *
 * Triage only has to prove a channel is worth opening; `fetch-channel.ts` reads
 * the rest. Uncapped, a busy channel where every thread moved would cost a call
 * per thread across 220 conversations.
 */
const GROWN_THREAD_PEEK_CAP = 8;

/**
 * How many pages of history the thread check walks for a conversation that
 * matters. 25 × 200 = 5,000 parents, past the full history of every channel in
 * this workspace, so in practice it means "all of it" with a stop built in.
 */
const THREAD_SCAN_MAX_PAGES = 25;

/**
 * A conversation the manifest knows about that this run did not enumerate.
 *
 * The table below is built from `conversations.list`, so a conversation the
 * current identity cannot see does not become a row with `readable: false` — it
 * is absent, and absence is the one thing a reader cannot notice. That matters
 * now that a scheduled workflow runs the triage on the BOT token: `im`/`mpim`
 * are not even listable there, so 28 conversations silently leave the
 * workspace, and 9 of them are `alwaysRead` — the DMs of the people who send
 * work. A private channel nobody invited the bot to disappears the same way,
 * with no `/invite` prompt anywhere.
 *
 * `reason` separates the two cases because only one of them is a problem:
 * `dms-out-of-scope` is this run doing what it was told, `not-visible` is a
 * conversation somebody has to act on (invite the bot, or use a user token).
 */
interface Unenumerated {
  id: string;
  name: string;
  type: ChannelType;
  alwaysRead: boolean;
  reason: "dms-out-of-scope" | "not-visible";
}

/** A thread carrying replies the manifest has no record of anyone reading. */
interface GrownThread {
  ts: string;
  /** Latest reply already recorded as read; undefined when never seen at all. */
  sinceReplyTs?: string;
  replyCount: number;
  latestReplyTs: string;
}

interface SlackChannel {
  id: string;
  name: string;
  is_member: boolean;
  is_archived: boolean;
  is_direct: boolean;
  is_private: boolean;
  /** Can history actually be read? Not the same as membership — see isReadable. */
  readable: boolean;
}

async function listChannels(): Promise<SlackChannel[]> {
  const out: SlackChannel[] = [];
  // Only needed to name 1:1 DMs, which carry a user ID and nothing else.
  const users =
    USING_USER_TOKEN && !skipDms ? await loadUserNames() : undefined;
  let cursor: string | undefined;
  do {
    const r = await slack.conversations.list({
      types: CONVERSATION_TYPES,
      limit: 1000,
      cursor,
      exclude_archived: false,
    });
    for (const c of r.channels ?? []) {
      const direct = isDirectConversation(c);
      if (direct && skipDms) continue;
      out.push({
        id: c.id!,
        name: conversationName(c, users),
        // You are inherently a member of your own DMs; Slack sends no flag.
        is_member: direct ? true : !!(c as any).is_member,
        is_archived: !!(c as any).is_archived,
        is_direct: direct,
        is_private: !!(c as any).is_private,
        readable: isReadable(c as any),
      });
    }
    cursor = r.response_metadata?.next_cursor || undefined;
  } while (cursor);
  return out;
}

/** Messages strictly newer than `oldest` (exclusive). Returns text + file flag. */
/**
 * New content since the watermark: top-level messages, plus the unread replies
 * on any thread that grew.
 *
 * The reply pass is not decoration. Signal scoring is what decides whether a
 * general channel or a DM is worth a human's attention, and it used to see
 * top-level text only — so a channel whose entire event conversation happened
 * inside one thread scored zero and stayed hidden. `grown` is already bounded
 * by the caller's peek, so this costs one extra call per grown thread.
 */
async function newMessagesSince(
  channelId: string,
  oldest: string | undefined,
  grown: GrownThread[] = [],
  cap = 60,
): Promise<{
  count: number;
  texts: string[];
  hasImage: boolean;
  latestTs: string;
  /** The cap stopped the scan before the delta ran out. */
  truncated: boolean;
}> {
  const texts: string[] = [];
  let hasImage = false;
  let count = 0;
  let truncated = false;
  let latestTs = oldest ?? "0";
  let cursor: string | undefined;
  try {
    do {
      const r = await slack.conversations.history({
        channel: channelId,
        oldest: oldest && oldest !== "0" ? oldest : undefined,
        limit: 200,
        cursor,
      });
      for (const m of r.messages ?? []) {
        const ts = (m as any).ts as string;
        if (oldest && Number(ts) <= Number(oldest)) continue;
        count++;
        if ((m as any).text) texts.push((m as any).text);
        if (((m as any).files ?? []).some((f: any) => /^image\//.test(f.mimetype ?? ""))) hasImage = true;
        if (Number(ts) > Number(latestTs)) latestTs = ts;
        if (count >= cap) { truncated = true; break; }
      }
      cursor = truncated ? undefined : r.response_metadata?.next_cursor || undefined;
    } while (cursor);
  } catch {
    /* not_in_channel etc. — treated as no readable content */
  }

  // The unread tail of every thread that grew. A reply never moves its parent,
  // so none of these can have been picked up by the loop above.
  for (const t of grown) {
    try {
      const r = await slack.conversations.replies({ channel: channelId, ts: t.ts, limit: 200 });
      for (const m of (r.messages ?? []) as any[]) {
        if (m.ts === t.ts) continue;
        if (t.sinceReplyTs && Number(m.ts) <= Number(t.sinceReplyTs)) continue;
        count++;
        if (m.text) texts.push(m.text);
        if ((m.files ?? []).some((f: any) => /^image\//.test(f.mimetype ?? ""))) hasImage = true;
      }
    } catch {
      /* thread_not_found — the parent may have been deleted */
    }
  }

  return { count, texts, hasImage, latestTs, truncated };
}

// --- fuzzy event matching for backfill ------------------------------------
const STOP = new Set([
  "event", "events", "she", "sharp", "shesharp", "the", "and", "with", "for", "of", "a", "an",
  "to", "in", "on", "at", "by", "2024", "2025", "2026", "2027",
  "jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "sept", "oct", "nov", "dec",
  "january", "february", "march", "april", "june", "july", "august", "september", "october",
  "november", "december", "series", "talk", "session", "workshop",
]);

function tokens(s: string): Set<string> {
  return new Set(
    (s.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((t) => t.length > 2 && !STOP.has(t)),
  );
}

function bestPublishedMatch(
  channelName: string,
  events: PublishedEvent[],
): { slug: string; score: number; source: string; custom: boolean } | null {
  const ct = tokens(channelName);
  let best: { slug: string; score: number; source: string; custom: boolean } | null = null;
  for (const e of events) {
    const et = tokens(`${e.slug} ${e.title}`);
    let overlap = 0;
    for (const t of ct) if (et.has(t)) overlap++;
    const score = ct.size ? overlap / ct.size : 0;
    if (score > 0 && (!best || score > best.score))
      best = { slug: e.slug, score, source: e.source, custom: e.custom };
  }
  return best && best.score >= 0.34 ? best : null;
}

// --- main ------------------------------------------------------------------

/**
 * One triage row. Extends `TriageRow`, the subset `decideAction()` reads, so
 * the shape the decision is tested against and the shape it runs against are
 * the same declaration rather than two that agree today.
 */
interface Row extends TriageRow {
  name: string;
  id: string;
  member: boolean;
  latestTs: string;
  signalHits: string[];
  evidence: string;
  /** Grown threads this run actually read. Only quiet rows record them. */
  grownThreads: GrownThread[];
  digest: string;
  action: string;
}

async function main() {
  announceIdentity();
  if (!USING_USER_TOKEN && !skipDms) {
    console.error(
      "note: DMs and group DMs are not being scanned — that needs SLACK_USER_TOKEN (xoxp-). See SKILL.md.",
    );
  }
  const channels = await listChannels();
  const manifest = loadManifest();
  const published = loadPublishedEvents();
  const nowMs = Date.now();

  // Which known conversations this identity did not even list. See `Unenumerated`.
  const enumerated = new Set(channels.map((c) => c.id));
  const unenumerated: Unenumerated[] = Object.entries(manifest.channels)
    .filter(([id]) => !enumerated.has(id))
    .map(([id, c]) => ({
      id,
      name: c.name,
      type: c.type,
      alwaysRead: c.mapping?.kind === "skip" && !!c.mapping.alwaysRead,
      reason:
        c.type === "dm" && (skipDms || !USING_USER_TOKEN)
          ? ("dms-out-of-scope" as const)
          : ("not-visible" as const),
    }));

  if (doJoin) {
    // Always join as the BOT. `conversations.join` on a user token would make
    // the human join, posting a visible "has joined the channel" line into a
    // room they never asked to be in — a side effect nobody asked a read-only
    // triage command for.
    const joiner = botSlack;
    if (!joiner) {
      console.error("--join needs SLACK_BOT_TOKEN (joining as a user would post in the channel)");
    } else {
      for (const c of channels) {
        // Only public channels can be self-joined; DMs need no join and private
        // channels reject `conversations.join` outright. `readable` is not the
        // test here — a public channel the user token can already read is still
        // worth having the bot in, so the skill keeps working without the user token.
        if (c.is_direct || c.is_private || c.is_archived) continue;
        if (classifyChannel(c.name) !== "event") continue;
        try {
          await joiner.conversations.join({ channel: c.id });
          console.error(`joined #${c.name}`);
        } catch (e: any) {
          const err = e?.data?.error ?? e?.message;
          if (err !== "already_in_channel") console.error(`join failed #${c.name}: ${err}`);
        }
      }
    }
  }

  const rows: Row[] = [];
  for (const c of channels) {
    const type = classifyChannel(c.name);
    const cs = manifest.channels[c.id];
    const mapping = cs?.mapping ?? null;
    // The triage compares against what IT has scored; whether the model has
    // read it is a separate question, answered by the unread check below.
    const watermark = scannedPosition(cs);

    let hasNew = false;
    let newCount = 0;
    let signalScore = 0;
    let signalHits: string[] = [];
    let evidence = "";
    let latestTs = watermark ?? "0";
    let repliesOnly = false;
    let scanTruncated = false;
    let grownThreads: GrownThread[] = [];

    // Read history wherever it is actually reachable. On a user token that
    // includes public channels nobody joined — membership is not the gate.
    if (c.readable) {
      /*
       * ONE PAGE, NOT ONE MESSAGE — BECAUSE A REPLY DOES NOT MOVE ITS PARENT.
       *
       * This peeked at `limit: 1` and compared the newest top-level ts against
       * the watermark. Slack does not bump a parent's `ts` when someone replies
       * to it, so a channel whose only new activity is thread replies looked
       * identical to a dead one: reported quiet, hidden behind `--all`, and its
       * read position advanced on the way past.
       *
       * That is how the event owner's thirteen-item review of the hackathon deck
       * sat unread for a day. It surfaced only because that channel happened to
       * also have a new top-level message; a channel with replies alone would
       * never have appeared in the table at all.
       *
       * A page of 200 costs one call and carries `reply_count` and
       * `latest_reply` for every parent on it, which is an exact comparison
       * against what the manifest says was read.
       *
       * HOW FAR BACK. One page was the first version, with a note that
       * `fetch-channel.ts --state` was the backstop for older threads. That was
       * circular: the fetch only runs on a conversation the triage surfaced, so
       * a thread older than the window could never surface itself. Conversations
       * where being wrong actually costs something — a mapped event, or a
       * `skip` marked `alwaysRead` — are now walked to the end of their history.
       * Everything else keeps the single cheap page, because 220 conversations
       * paged in full on every run is a rate-limit wall, and `verify-coverage.ts`
       * is the tool that checks those to the last message on demand.
       */
      let peek = "0";
      const grown: GrownThread[] = [];
      // Every conversation, not just the ones that look important. A thread in
      // a chatter channel is where an event date gets decided as easily as
      // anywhere else, and the heuristic cannot know which.
      const deepScan = true;
      try {
        const page: any[] = [];
        let pcur: string | undefined;
        let pages = 0;
        do {
          const r = await slack.conversations.history({
            channel: c.id,
            limit: 200,
            cursor: pcur,
          });
          page.push(...((r.messages ?? []) as any[]));
          pcur = r.response_metadata?.next_cursor || undefined;
          pages++;
        } while (deepScan && pcur && pages < THREAD_SCAN_MAX_PAGES);
        peek = page[0]?.ts ?? "0";
        const knownThreads = cs?.threads ?? {};
        for (const m of page) {
          const known = knownThreads[m.ts];
          if (threadHasUnread(m, known)) {
            // Bounded: a channel with a hundred live threads should cost a
            // handful of calls here, not a hundred. The per-channel fetch reads
            // the rest — this only has to prove the channel is worth opening.
            if (grown.length < GROWN_THREAD_PEEK_CAP) {
              grown.push({
                ts: m.ts,
                sinceReplyTs: known?.latestReplyTs,
                replyCount: m.reply_count,
                latestReplyTs: m.latest_reply ?? m.ts,
              });
            }
          }
        }
      } catch {
        /* not_in_channel etc. */
      }
      latestTs = peek;
      const hasWatermark = !!watermark && watermark !== "0";
      const newByTs = !hasWatermark || Number(peek) > Number(watermark);
      const threadGrew = grown.length > 0;
      grownThreads = grown;
      // A grown thread counts as new even when no parent moved. Recorded on the
      // row so the table can say WHY a channel with no new top-level message is
      // asking for attention.
      repliesOnly = threadGrew && !newByTs;

      if (newByTs || threadGrew) {
        // Only pull bodies when something is actually new. Mapped events don't
        // need bodies here (the per-channel sync reads the delta); general and
        // unmapped channels do, to count + score for event signals.
        const mappedEvent = mapping?.kind === "event" || mapping?.kind === "skip";
        const needBodies = isSignalScanned(type) || !mappedEvent;
        if (needBodies) {
          const res = await newMessagesSince(c.id, watermark, grown);
          newCount = res.count;
          scanTruncated = res.truncated;
          hasNew = res.count > 0 || threadGrew;
          if (Number(res.latestTs) > Number(latestTs)) latestTs = res.latestTs;
          if (isSignalScanned(type) && res.texts.length) {
            const sig = detectEventSignal(res.texts);
            signalScore = sig.score + (res.hasImage ? 1 : 0);
            signalHits = sig.hits;
            evidence = sig.evidence;
          }
        } else {
          hasNew = true;
          newCount = -1; // -1 = "some" (not counted)
        }
      }
    }

    // Fingerprint freshness for mapped events (did events-custom.json change?).
    let fingerprintStale = false;
    let staleStatus = "";
    if (mapping?.kind === "event") {
      const current = fingerprintForMapping(mapping);
      fingerprintStale = !!cs && cs.fingerprint !== "" && current !== "" && current !== cs.fingerprint;
      // A mapped event whose date has passed but whose status is still future is
      // overdue for a post-event pass (flip to past, add the gallery). This is
      // the 20-June Peyvand miss made cheap to catch.
      for (const e of mapping.events) {
        const ev = findEventBySlug(e.slug);
        const status = ev?.detailPageData?.status ?? ev?.status ?? "";
        const dateMs = parseEventDateMs(ev?.date ?? ev?.detailPageData?.date);
        if (dateMs != null && dateMs < nowMs && status && !/past|complete|done|archived/i.test(status)) {
          staleStatus = `${e.slug}: ${status}`;
          break;
        }
      }
    }

    // Cross-source published match for unmapped event channels (always — cheap
    // local read), so an already-live page becomes `exists?`, not `create?`.
    const published_match =
      type === "event" && (!mapping || mapping.kind === "none")
        ? bestPublishedMatch(c.name, published)
        : null;

    const row: Row = {
      type,
      name: c.name,
      id: c.id,
      member: c.is_member,
      readable: c.readable,
      archived: c.is_archived,
      mapping,
      hasNew,
      newCount,
      latestTs,
      signalScore,
      signalHits,
      evidence,
      repliesOnly,
      scanTruncated,
      grownThreads,
      fingerprintStale,
      staleStatus,
      published: published_match,
      digest: cs?.digest ?? "",
      action: "",
    };
    row.action = decideAction(row);
    rows.push(row);
  }

  // Persist full machine triage.
  mkdirSync(CACHE_DIR, { recursive: true });
  const triagePath = resolve(CACHE_DIR, "triage.json");
  writeFileSync(
    triagePath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        // Which identity produced this, so a reader of the file — or
        // `triage-report.ts`, which turns it into a GitHub issue — can say how
        // wide the scan was rather than implying it covered the workspace.
        identity: USING_USER_TOKEN ? "user" : "bot",
        unenumerated,
        rows,
      },
      null,
      2,
    ),
  );

  // Advance the read position for everything this run READ and found quiet.
  //
  // SKILL.md has always promised that "scanned-but-quiet channels still advance
  // their watermark, so they aren't re-scanned" — but nothing implemented it,
  // so every run re-read the same settled channels from the beginning and a
  // reader could not tell a genuinely new message from one triaged months ago.
  //
  // Only quiet rows advance. A row with an action still needs a human or the
  // model to look at it, and moving its watermark here would mark unread
  // content as read — the exact failure this is meant to prevent. Archived
  // conversations advance too: they cannot change, so recording their end is
  // what stops them being re-listed forever.
  if (!skipRecord) {
    const manifest2 = loadManifest();
    let advanced = 0;
    // Rows where Slack is ahead of the read position and the triage could not
    // clear it. Counted separately because they are a backlog, not progress.
    let pending = 0;
    for (const r of rows) {
      if (!r.readable && !r.archived) continue;
      const prev = manifest2.channels[r.id];
      /*
       * AN ACTIONABLE ROW RECORDS WHAT SLACK HELD, AND NOTHING ELSE.
       *
       * Its scan position deliberately does not move — see the block below —
       * which is why `audit-read-state.ts` could compute a zero backlog for the
       * hackathon channel while thirteen messages sat unread in it. `pendingTs`
       * is the one field that answers "how far ahead is Slack?" offline, so the
       * audit stops depending on a gap that cannot open.
       *
       * Existing entries only. A conversation the manifest has never heard of is
       * a different problem with a different tool — `verify-coverage.ts
       * --enumerate-only` — and inventing an entry for it here would assert a
       * mapping and a read position nobody established.
       */
      if (!isQuiet(r.action)) {
        if (!prev) continue;
        // The newest thing Slack showed us, top level or inside a thread. A
        // channel can be behind purely in replies, and a parent's ts does not
        // move when one arrives.
        const observed = r.grownThreads.reduce(
          (max, t) => (Number(t.latestReplyTs) > Number(max) ? t.latestReplyTs : max),
          r.latestTs || "0",
        );
        if (observed === "0") continue;
        // Only when it is genuinely ahead of what was READ. A row can be
        // actionable for a purely local reason (`fingerprint-stale` on its own),
        // and claiming a backlog there would make the audit cry wolf.
        if (Number(observed) <= Number(prev.watermarkTs ?? "0")) continue;
        if (prev.pendingTs === observed) continue;
        prev.pendingTs = observed;
        pending++;
        continue;
      }
      const ts = r.latestTs && r.latestTs !== "0" ? r.latestTs : scannedPosition(prev);
      if (ts === "0") continue;
      /*
       * THE TRIAGE MOVES `scannedTs`. IT NEVER MOVES `watermarkTs`.
       *
       * Scoring a message is not reading it. This block used to write the one
       * position the manifest had, which meant a heuristic that had glanced at a
       * DM could assert the model had read it — and on 5 Aug 2026 it did exactly
       * that to "please update Carolina Lobos' profile on the website", a line
       * that scores zero because it names no venue, date or ticket.
       *
       * Thread state is still recorded here, because without it a grown thread
       * on a settled channel is re-fetched and re-scored on every run forever.
       * That is the one place the triage still claims more than it should, and
       * it is bounded: it only ever happens on a row with no action, and
       * `audit-read-state.ts` reports the top-level gap either way.
       */
      const threads = { ...(prev?.threads ?? {}) };
      for (const t of r.grownThreads) {
        threads[t.ts] = { replyCount: t.replyCount, latestReplyTs: t.latestReplyTs };
      }
      const threadsChanged = r.grownThreads.length > 0;
      /*
       * `prev.scannedTs`, NOT `scannedPosition(prev)` — the fallback seals the
       * blind spot it is meant to paper over.
       *
       * `scannedPosition()` returns `scannedTs || watermarkTs`, so a channel
       * that has never been triaged reports its READ position as its scan
       * position. A quiet one then compares equal to `ts` here and is skipped,
       * so no `scannedTs` is ever written — and it stays never-triaged through
       * every future run. 90 of 207 conversations were in that state, and
       * because the same fallback made the audit compute a zero gap, nothing
       * could report it either. Requiring the field itself is what lets a
       * first triage establish a position at all.
       */
      // `prev.pendingTs` forces the write even when nothing else moved: this
      // literal rebuilds the entry without it, so going quiet is what clears a
      // backlog marker, and skipping the write would strand one forever.
      if (prev?.scannedTs && prev.scannedTs === ts && !threadsChanged && !prev.pendingTs)
        continue;
      manifest2.channels[r.id] = {
        name: r.name,
        type: r.type,
        mapping: prev?.mapping ?? { kind: "none" },
        // Untouched. A conversation nobody has opened keeps its read position
        // wherever the last real fetch left it, however often this runs.
        watermarkTs: prev?.watermarkTs ?? ts,
        scannedTs: ts,
        threads,
        fingerprint: prev?.fingerprint ?? "",
        lastSyncedAt: nowIso(),
        lastSyncedCommit: prev?.lastSyncedCommit ?? "",
        // Carried, for the third time in this codebase. This literal rebuilds
        // the entry from scratch, and `saveManifest` emits `readAt` only when
        // it is set — so a field omitted here is a read receipt DELETED from
        // disk, not merely left alone. Advancing a scan position must never
        // erase the record of a read: `unreadConversations()` treats a missing
        // `readAt` as never-read, so dropping it turns `audit-read-state.ts`
        // red on a conversation that was in fact read. Same failure as
        // 2f061338 and 27410c76, one layer up.
        ...(prev?.readAt ? { readAt: prev.readAt } : {}),
        ...(prev?.readAtSource ? { readAtSource: prev.readAtSource } : {}),
        ...(prev?.digest ? { digest: prev.digest, digestAt: prev.digestAt ?? "" } : {}),
      };
      advanced++;
    }
    if (advanced || pending) {
      saveManifest(manifest2);
      const parts = [
        advanced ? `scan position advanced for ${advanced} quiet conversation(s)` : "",
        pending ? `${pending} conversation(s) recorded as behind Slack` : "",
      ].filter(Boolean);
      console.error(`${parts.join("; ")} — commit state/sync-state.json`);
    }
  }

  // Compact human triage to stdout. Settled states (no-op / archived / skip)
  // are quiet — only genuinely new or unresolved channels need attention.
  const quiet = rows.filter((r) => isQuiet(r.action));
  const actionable = rows.filter((r) => !isQuiet(r.action));
  const shown = showAll ? rows : actionable;
  shown.sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));

  const lines: string[] = [];
  lines.push(`Channels: ${rows.length} total — ${actionable.length} need attention, ${quiet.length} quiet`);
  /*
   * SAY WHAT THIS RUN COULD NOT SEE, DIRECTLY UNDER THE TOTAL.
   *
   * The count above is "conversations this identity listed", and a reader takes
   * it for "conversations there are". Those are the same number only on a user
   * token with DMs in scope; on the bot token the scheduled workflow uses, 28
   * DMs and group DMs are not listable at all and simply vanish — along with any
   * private channel nobody has invited the bot to. Nothing in the table can
   * carry that, because the missing rows are missing.
   */
  const invisible = unenumerated.filter((u) => u.reason === "not-visible");
  const outOfScope = unenumerated.filter((u) => u.reason === "dms-out-of-scope");
  if (outOfScope.length) {
    const always = outOfScope.filter((u) => u.alwaysRead).length;
    lines.push(
      `Not scanned: ${outOfScope.length} known DM(s)/group DM(s) out of scope for this run` +
        (always ? `, ${always} of them always-read` : "") +
        ` — ${skipDms ? "--no-dms" : "needs SLACK_USER_TOKEN"}`,
    );
  }
  if (invisible.length) {
    lines.push(
      `NOT VISIBLE: ${invisible.length} conversation(s) in the manifest this identity could not list —`,
    );
    for (const u of invisible) {
      lines.push(
        `  ${u.name} (${u.id})${u.alwaysRead ? " [always-read]" : ""} — /invite the Collector bot, or run with SLACK_USER_TOKEN`,
      );
    }
  }
  lines.push("");
  lines.push(pad("TYPE", 8) + pad("CHANNEL", 44) + pad("MBR", 5) + pad("NEW", 5) + pad("SIG", 5) + "ACTION / MAPPING");
  for (const r of shown) {
    const map =
      r.mapping?.kind === "event"
        ? `→${r.mapping.events.map((e) => e.slug).join(", ")}`
        : r.mapping?.kind === "skip"
          ? `skip:${r.mapping.reason}`
          : "";
    const newCol = r.newCount === -1 ? "yes" : r.newCount > 0 ? String(r.newCount) : "-";
    const sigCol = r.signalScore > 0 ? String(r.signalScore) : "-";
    lines.push(
      pad(r.type, 8) +
        pad(r.name.slice(0, 42), 44) +
        pad(r.member ? "yes" : "no", 5) +
        pad(newCol, 5) +
        pad(sigCol, 5) +
        `${r.action}${map ? "  " + map : ""}`,
    );
    if (r.evidence && r.signalScore >= SIGNAL_THRESHOLD) {
      lines.push(pad("", 12) + `↳ ${r.signalHits.join(",")}: "${r.evidence}"`);
    }
    // Published-match hint: always for an already-live (non-custom) page; for a
    // custom-source fuzzy guess only when --propose is asked for (backfill).
    if (r.published && (!r.published.custom || doPropose)) {
      const where = r.published.custom ? "events-custom.json" : r.published.source;
      lines.push(pad("", 12) + `↳ match →${r.published.slug} @${where} (${(r.published.score * 100) | 0}%)`);
    }
    // Prior digest — what was understood last sync. Lets the reader re-orient
    // from one line instead of re-reading the channel.
    if (r.digest) lines.push(pad("", 12) + `↳ digest: ${r.digest.replace(/\s+/g, " ").slice(0, 150)}`);
  }
  if (!showAll && quiet.length) lines.push("", `(${quiet.length} quiet channels hidden — pass --all to show)`);
  lines.push("", `Full machine triage: ${triagePath}`);

  process.stdout.write(lines.join("\n") + "\n");
}

function pad(s: string, w: number): string {
  return s.length >= w ? s.slice(0, w - 1) + " " : s + " ".repeat(w - s.length);
}

main().catch((e) => {
  console.error("FATAL:", e?.data ?? e?.message ?? e);
  process.exit(1);
});
