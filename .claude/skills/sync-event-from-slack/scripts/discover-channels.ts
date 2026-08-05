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
  detectEventSignal,
  findEventBySlug,
  fingerprintForMapping,
  isSignalScanned,
  loadManifest,
  nowIso,
  saveManifest,
  loadPublishedEvents,
  parseEventDateMs,
  SIGNAL_THRESHOLD,
  threadHasUnread,
  type ChannelType,
  type Mapping,
  type PublishedEvent,
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
): Promise<{ count: number; texts: string[]; hasImage: boolean; latestTs: string }> {
  const texts: string[] = [];
  let hasImage = false;
  let count = 0;
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
        if (count >= cap) break;
      }
      cursor = count >= cap ? undefined : r.response_metadata?.next_cursor || undefined;
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

  return { count, texts, hasImage, latestTs };
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

interface Row {
  type: ChannelType;
  name: string;
  id: string;
  member: boolean;
  readable: boolean;
  archived: boolean;
  mapping: Mapping | null;
  hasNew: boolean;
  newCount: number;
  latestTs: string;
  signalScore: number;
  signalHits: string[];
  evidence: string;
  /** New content is thread replies only — no parent moved, so no ts changed. */
  repliesOnly: boolean;
  /** Grown threads this run actually read. Only quiet rows record them. */
  grownThreads: GrownThread[];
  fingerprintStale: boolean;
  staleStatus: string; // non-empty when a mapped event's date has passed but status is still future
  published: { slug: string; score: number; source: string; custom: boolean } | null;
  digest: string;
  action: string;
}

/** Settled: nothing for a human or the model to do. Also gates watermark advance. */
function isQuiet(action: string): boolean {
  return action.startsWith("no-op") || action === "archived" || action === "skip";
}

function decideAction(r: Row): string {
  if (r.archived) return "archived";
  if (r.type === "event") {
    if (!r.readable) return r.archived ? "archived" : "join+sync";
    if (r.mapping?.kind === "skip") return r.hasNew ? "skip→review (new msgs)" : "skip";
    if (!r.mapping || r.mapping.kind === "none") {
      // Unseen or "scanned, no site event": only resurface on new activity.
      if (!r.hasNew) return "no-op";
      // A page may already exist in a NON-skill source (scraped/legacy). Don't
      // propose creating a duplicate — point at the published slug to map/skip.
      if (r.published && !r.published.custom)
        return `exists? (≈${r.published.slug} @${r.published.source})`;
      return r.published ? `create? (≈${r.published.slug})` : "create?";
    }
    // mapped to an event
    if (r.fingerprintStale) return "fingerprint-stale (event edited)";
    if (r.staleStatus) return `stale-status (${r.staleStatus})`;
    // Say WHY when nothing at the top level moved. A reader who checks Slack
    // by eye will see no new message in the channel and conclude the table is
    // wrong, unless it tells them the new content is inside a thread.
    if (r.repliesOnly) return "incremental (thread replies)";
    return r.hasNew ? "incremental" : "no-op";
  }
  // general + dm — scanned for event signal, never auto-created from.
  if (!r.readable) return "no-op (not readable)";
  // A skip here must be stickier than on an event channel. #contact-form-
  // notifications and every DM receive routine traffic forever, so resurfacing
  // on "any new message" would put them in the table every single run and train
  // the reader to ignore it. Only a delta that actually scores as event content
  // is worth a second look.
  if (r.mapping?.kind === "skip")
    return r.signalScore >= SIGNAL_THRESHOLD ? "skip→review (event signal)" : "skip";
  if (r.signalScore >= SIGNAL_THRESHOLD)
    return r.type === "dm" ? "create? (dm-signal)" : "create? (general-signal)";
  return r.hasNew ? "no-op (no signal)" : "no-op";
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
    const watermark = cs?.watermarkTs;

    let hasNew = false;
    let newCount = 0;
    let signalScore = 0;
    let signalHits: string[] = [];
    let evidence = "";
    let latestTs = watermark ?? "0";
    let repliesOnly = false;
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
       * A page of 200 costs the same one call and carries `reply_count` and
       * `latest_reply` for every parent on it, which is an exact comparison
       * against what the manifest says was read. Threads older than 200 parents
       * back are still out of view here — `fetch-channel.ts --state` walks the
       * whole history and is the backstop for those.
       */
      let peek = "0";
      const grown: GrownThread[] = [];
      try {
        const r = await slack.conversations.history({ channel: c.id, limit: 200 });
        const page = (r.messages ?? []) as any[];
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
  writeFileSync(triagePath, JSON.stringify({ generatedAt: new Date().toISOString(), rows }, null, 2));

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
    for (const r of rows) {
      if (!isQuiet(r.action)) continue;
      if (!r.readable && !r.archived) continue;
      const prev = manifest2.channels[r.id];
      const ts = r.latestTs && r.latestTs !== "0" ? r.latestTs : prev?.watermarkTs ?? "0";
      if (ts === "0") continue;
      /*
       * Thread replies this run READ and scored as nothing to act on.
       *
       * Same rule as the watermark, and it has to be: without it a grown thread
       * on a settled channel is re-fetched and re-scored on every run forever,
       * because nothing else ever records it. Only quiet rows reach here — an
       * actionable row keeps its threads untouched so the per-channel fetch
       * still sees them as unread.
       *
       * Note the asymmetry with `fetch-channel.ts`, which records only what it
       * DELIVERED to the model. Triage records what it SCORED. That is a
       * weaker guarantee, and it is the reason SKILL.md says a quiet DM is not
       * the same as a DM the model has read.
       */
      const threads = { ...(prev?.threads ?? {}) };
      for (const t of r.grownThreads) {
        threads[t.ts] = { replyCount: t.replyCount, latestReplyTs: t.latestReplyTs };
      }
      const threadsChanged = r.grownThreads.length > 0;
      if (prev && prev.watermarkTs === ts && !threadsChanged) continue;
      manifest2.channels[r.id] = {
        name: r.name,
        type: r.type,
        mapping: prev?.mapping ?? { kind: "none" },
        watermarkTs: ts,
        threads,
        fingerprint: prev?.fingerprint ?? "",
        lastSyncedAt: nowIso(),
        lastSyncedCommit: prev?.lastSyncedCommit ?? "",
        ...(prev?.digest ? { digest: prev.digest, digestAt: prev.digestAt ?? "" } : {}),
      };
      advanced++;
    }
    if (advanced) {
      saveManifest(manifest2);
      console.error(
        `read position advanced for ${advanced} quiet conversation(s) — commit state/sync-state.json`,
      );
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
