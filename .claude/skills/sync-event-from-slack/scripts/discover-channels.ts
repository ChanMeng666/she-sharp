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
 *
 * Full machine-readable triage is always written to .cache/triage.json.
 */

import "dotenv/config";
import { WebClient } from "@slack/web-api";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  CACHE_DIR,
  classifyChannel,
  detectEventSignal,
  findEventBySlug,
  fingerprintForMapping,
  loadManifest,
  loadPublishedEvents,
  parseEventDateMs,
  SIGNAL_THRESHOLD,
  type ChannelType,
  type Mapping,
  type PublishedEvent,
} from "./state-lib.ts";

const token = process.env.SLACK_BOT_TOKEN;
if (!token) {
  console.error("SLACK_BOT_TOKEN is not set in .env");
  process.exit(1);
}
const slack = new WebClient(token);

const flags = new Set(process.argv.slice(2).filter((a) => a.startsWith("--")));
const showAll = flags.has("--all");
const doPropose = flags.has("--propose");
const doJoin = flags.has("--join");

interface SlackChannel {
  id: string;
  name: string;
  is_member: boolean;
  is_archived: boolean;
}

async function listChannels(): Promise<SlackChannel[]> {
  const out: SlackChannel[] = [];
  let cursor: string | undefined;
  do {
    const r = await slack.conversations.list({
      types: "public_channel,private_channel",
      limit: 1000,
      cursor,
      exclude_archived: false,
    });
    for (const c of r.channels ?? []) {
      out.push({
        id: c.id!,
        name: c.name ?? "",
        is_member: !!(c as any).is_member,
        is_archived: !!(c as any).is_archived,
      });
    }
    cursor = r.response_metadata?.next_cursor || undefined;
  } while (cursor);
  return out;
}

/** Messages strictly newer than `oldest` (exclusive). Returns text + file flag. */
async function newMessagesSince(
  channelId: string,
  oldest: string | undefined,
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
  archived: boolean;
  mapping: Mapping | null;
  hasNew: boolean;
  newCount: number;
  latestTs: string;
  signalScore: number;
  signalHits: string[];
  evidence: string;
  fingerprintStale: boolean;
  staleStatus: string; // non-empty when a mapped event's date has passed but status is still future
  published: { slug: string; score: number; source: string; custom: boolean } | null;
  digest: string;
  action: string;
}

function decideAction(r: Row): string {
  if (r.archived) return "archived";
  if (r.type === "event") {
    if (!r.member) return "join+sync";
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
    return r.hasNew ? "incremental" : "no-op";
  }
  // general
  if (!r.member) return "no-op (not member)";
  if (r.signalScore >= SIGNAL_THRESHOLD) return "create? (general-signal)";
  return r.hasNew ? "no-op (no signal)" : "no-op";
}

async function main() {
  const channels = await listChannels();
  const manifest = loadManifest();
  const published = loadPublishedEvents();
  const nowMs = Date.now();

  if (doJoin) {
    for (const c of channels) {
      if (classifyChannel(c.name) === "event" && !c.is_member && !c.is_archived) {
        try {
          await slack.conversations.join({ channel: c.id });
          console.error(`joined #${c.name}`);
        } catch (e: any) {
          console.error(`join failed #${c.name}: ${e?.data?.error ?? e?.message}`);
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

    // Only read history for member, non-archived channels (others are unreadable).
    if (c.is_member && !c.is_archived) {
      // Cheap 1-message peek first: a quiet channel costs a single API call.
      let peek = "0";
      try {
        const r = await slack.conversations.history({ channel: c.id, limit: 1 });
        peek = (r.messages?.[0] as any)?.ts ?? "0";
      } catch {
        /* not_in_channel etc. */
      }
      latestTs = peek;
      const hasWatermark = !!watermark && watermark !== "0";
      const newByTs = !hasWatermark || Number(peek) > Number(watermark);

      if (newByTs) {
        // Only pull bodies when something is actually new. Mapped events don't
        // need bodies here (the per-channel sync reads the delta); general and
        // unmapped channels do, to count + score for event signals.
        const mappedEvent = mapping?.kind === "event" || mapping?.kind === "skip";
        const needBodies = type === "general" || !mappedEvent;
        if (needBodies) {
          const res = await newMessagesSince(c.id, watermark);
          newCount = res.count;
          hasNew = res.count > 0;
          if (Number(res.latestTs) > Number(latestTs)) latestTs = res.latestTs;
          if (type === "general" && res.texts.length) {
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
      archived: c.is_archived,
      mapping,
      hasNew,
      newCount,
      latestTs,
      signalScore,
      signalHits,
      evidence,
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

  // Compact human triage to stdout. Settled states (no-op / archived / skip)
  // are quiet — only genuinely new or unresolved channels need attention.
  const isQuiet = (a: string) => a.startsWith("no-op") || a === "archived" || a === "skip";
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
