/**
 * Shared helpers for the sync-event-from-slack skill's stateful, incremental
 * pipeline. Imported by discover-channels.ts, fetch-channel.ts, and
 * update-state.ts so the manifest schema, fingerprint, channel classification,
 * and event-signal detection stay identical across all three.
 *
 * Path model: every script in this skill is run from the repo root. The skill
 * root is resolved relative to this file (…/.claude/skills/sync-event-from-slack)
 * so the state + cache locations are stable regardless of cwd.
 */

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
/** …/.claude/skills/sync-event-from-slack */
export const SKILL_ROOT = resolve(SCRIPT_DIR, "..");
export const STATE_PATH = resolve(SKILL_ROOT, "state", "sync-state.json");
export const CACHE_DIR = resolve(SKILL_ROOT, ".cache");
/** repo root (three levels above the skill root: …/.claude/skills/<skill>) */
export const REPO_ROOT = resolve(SKILL_ROOT, "..", "..", "..");
/** The one events file this skill WRITES. */
export const EVENTS_PATH = resolve(REPO_ROOT, "lib", "data", "json", "events-custom.json");
/**
 * Every events file the site READS. The public `/events` listing merges the
 * skill-managed file with scraped/legacy sources, so a slug can already be
 * published in one of these even though it is absent from events-custom.json.
 * Cross-checking all of them is what stops discovery from proposing a duplicate
 * "create?" for an event that already has a live page (the 2026-06-22 Aug-2025
 * hackathon false-positive). Same `{ events: [{ slug, title }] }` shape.
 */
export const PUBLISHED_EVENT_FILES = [
  EVENTS_PATH,
  resolve(REPO_ROOT, "lib", "data", "json", "shesharp_events_v3.json"),
];

// ---------------------------------------------------------------------------
// Manifest types
// ---------------------------------------------------------------------------

export type ChannelType = "event" | "general";

export type Mapping =
  // One channel can feed more than one event (e.g. a "13 & 20 June" planning
  // channel, or a month split into multiple sessions), hence an array.
  | { kind: "event"; events: { slug: string; eventId: number }[] }
  | { kind: "skip"; reason: string }
  | { kind: "none" };

export interface ThreadState {
  replyCount: number;
  latestReplyTs: string;
}

export interface ChannelState {
  name: string;
  type: ChannelType;
  mapping: Mapping;
  watermarkTs: string; // latest top-level message ts already processed
  threads: Record<string, ThreadState>; // parentTs -> thread watermark
  fingerprint: string; // sha256:… of the mapped event's salient fields ("" when none)
  lastSyncedAt: string;
  lastSyncedCommit: string;
  // Sediment of what was UNDERSTOOD from this channel last sync: a few sentences
  // on the event state + open items. Carried back into the next run (via
  // fetch-channel's `_meta.priorDigest`) so the model re-orients from the digest
  // + the small new delta instead of re-reading the whole channel. Optional and
  // omitted when empty to keep existing manifest entries byte-stable.
  digest?: string;
  digestAt?: string;
}

export interface Manifest {
  version: number;
  channels: Record<string, ChannelState>;
}

const EMPTY_MANIFEST: Manifest = { version: 1, channels: {} };

export function loadManifest(): Manifest {
  if (!existsSync(STATE_PATH)) return structuredClone(EMPTY_MANIFEST);
  try {
    const parsed = JSON.parse(readFileSync(STATE_PATH, "utf8")) as Manifest;
    if (!parsed.channels) parsed.channels = {};
    if (!parsed.version) parsed.version = 1;
    return parsed;
  } catch {
    return structuredClone(EMPTY_MANIFEST);
  }
}

/**
 * Write the manifest deterministically: channels sorted by id, keys stably
 * ordered, trailing newline. Atomic via temp-file rename so a crash can't leave
 * a half-written manifest. Stable serialization keeps git diffs minimal.
 */
export function saveManifest(m: Manifest): void {
  mkdirSync(dirname(STATE_PATH), { recursive: true });
  const ordered: Manifest = { version: m.version ?? 1, channels: {} };
  for (const id of Object.keys(m.channels).sort()) {
    const c = m.channels[id];
    const entry: ChannelState = {
      name: c.name,
      type: c.type,
      mapping: c.mapping,
      watermarkTs: c.watermarkTs,
      threads: sortThreads(c.threads),
      fingerprint: c.fingerprint,
      lastSyncedAt: c.lastSyncedAt,
      lastSyncedCommit: c.lastSyncedCommit,
    };
    // Only emit digest fields when set — channels never given a digest stay
    // byte-identical to their pre-digest serialization.
    if (c.digest) {
      entry.digest = c.digest;
      entry.digestAt = c.digestAt ?? "";
    }
    ordered.channels[id] = entry;
  }
  const tmp = `${STATE_PATH}.tmp`;
  writeFileSync(tmp, JSON.stringify(ordered, null, 2) + "\n");
  renameSync(tmp, STATE_PATH);
}

function sortThreads(threads: Record<string, ThreadState>): Record<string, ThreadState> {
  const out: Record<string, ThreadState> = {};
  for (const ts of Object.keys(threads ?? {}).sort((a, b) => Number(a) - Number(b))) {
    out[ts] = { replyCount: threads[ts].replyCount, latestReplyTs: threads[ts].latestReplyTs };
  }
  return out;
}

// ---------------------------------------------------------------------------
// Fingerprint — detects whether a mapped event's salient content changed.
// Computed from events-custom.json, not Slack, so a re-sync that produces the
// same event is a no-op even if Slack chatter moved on.
// ---------------------------------------------------------------------------

/** Pull the entry with the given slug out of events-custom.json (or null). */
export function findEventBySlug(slug: string): any | null {
  try {
    const data = JSON.parse(readFileSync(EVENTS_PATH, "utf8"));
    return (data.events ?? []).find((e: any) => e.slug === slug) ?? null;
  } catch {
    return null;
  }
}

export function loadEvents(): any[] {
  try {
    return JSON.parse(readFileSync(EVENTS_PATH, "utf8")).events ?? [];
  } catch {
    return [];
  }
}

export interface PublishedEvent {
  slug: string;
  title: string;
  source: string; // basename of the file it came from
  custom: boolean; // true when from events-custom.json (this skill owns it)
}

/**
 * Union of every slug the site can render, across all published sources (not
 * just the skill-managed events-custom.json). Used by discovery to tell a
 * genuinely-new event channel apart from one whose page already exists in a
 * scraped/legacy file — the latter should be `skip`, not `create?`.
 */
export function loadPublishedEvents(): PublishedEvent[] {
  const out: PublishedEvent[] = [];
  for (const path of PUBLISHED_EVENT_FILES) {
    const base = path.split(/[\\/]/).pop() ?? path;
    const custom = path === EVENTS_PATH;
    try {
      const events = JSON.parse(readFileSync(path, "utf8")).events ?? [];
      for (const e of events) {
        if (e?.slug) out.push({ slug: e.slug, title: e.title ?? "", source: base, custom });
      }
    } catch {
      /* a missing/unreadable source just contributes no slugs */
    }
  }
  return out;
}

/**
 * Best-effort parse of a human-readable event date ("June 20, 2026",
 * "20 June 2026", "Fri 7 Aug, 5:00pm – Sat 8 Aug 2026") to epoch ms, or null
 * when it can't be read. Used only to flag events whose date has passed but
 * whose status is still future — never for anything that must be exact.
 */
export function parseEventDateMs(date: string | undefined): number | null {
  if (!date) return null;
  const MONTH = "jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec";
  const year = date.match(/\b(20\d\d)\b/)?.[1];
  const candidates = [date];
  // "Month Day, Year" — the dominant form ("June 20, 2026").
  const md = date.match(new RegExp(`((?:${MONTH})[a-z]*\\s+\\d{1,2}).*?(20\\d\\d)`, "i"));
  if (md) candidates.push(`${md[1]} ${md[2]}`);
  // "Day Month" (… Year) — ranges like "Fri 7 Aug … Sat 8 Aug 2026". Take the
  // LAST day+month pair (the event's end) and pin the trailing year.
  if (year) {
    const dm = [...date.matchAll(new RegExp(`(\\d{1,2})\\s+(${MONTH})[a-z]*`, "gi"))];
    if (dm.length) {
      const last = dm[dm.length - 1];
      candidates.push(`${last[1]} ${last[2]} ${year}`);
    }
  }
  for (const c of candidates) {
    const t = Date.parse(c);
    if (!Number.isNaN(t)) return t;
  }
  return null;
}

/**
 * Deterministic fingerprint of the fields this skill actually writes. Excludes
 * post-event reconciliation fields (attendees, checkedIn) and editor-only churn
 * we don't want to trigger a re-sync.
 */
export function fingerprintEvent(event: any | null): string {
  if (!event) return "";
  const d = event.detailPageData ?? {};
  const salient = {
    title: event.title ?? "",
    date: event.date ?? "",
    shortDescription: event.shortDescription ?? "",
    cover: event.coverImage?.url ?? "",
    subtitle: d.subtitle ?? "",
    time: d.time ?? "",
    location: d.location ?? {},
    fullDescription: d.fullDescription ?? [],
    speakers: d.speakers ?? {},
    sponsors: d.sponsors ?? {},
    specialSections: d.specialSections ?? [],
    registrationUrl: d.registrationUrl ?? "",
    galleryUrl: d.galleryUrl ?? "",
    category: d.category ?? "",
    status: d.status ?? "",
    isFeatured: d.isFeatured ?? false,
  };
  const hash = createHash("sha256").update(JSON.stringify(salient)).digest("hex");
  return `sha256:${hash}`;
}

/**
 * Combined fingerprint for a mapping. For an event mapping, hashes every mapped
 * event's salient fields together so a change in any of them invalidates the
 * no-op. Non-event mappings have no fingerprint ("").
 */
export function fingerprintForMapping(mapping: Mapping): string {
  if (mapping.kind !== "event") return "";
  const parts = mapping.events
    .map((e) => `${e.slug}:${fingerprintEvent(findEventBySlug(e.slug))}`)
    .sort();
  return `sha256:${createHash("sha256").update(parts.join("|")).digest("hex")}`;
}

// ---------------------------------------------------------------------------
// Channel classification
// ---------------------------------------------------------------------------

/** Event-planning channels are named `event…` by convention in this workspace. */
export function classifyChannel(name: string): ChannelType {
  return /^event[-_]?/i.test(name) ? "event" : "general";
}

// ---------------------------------------------------------------------------
// Event-signal detection for general channels. Runs in-script over message text
// so only channels that actually look like they carry an event reach Claude.
// ---------------------------------------------------------------------------

const SIGNAL_PATTERNS: { name: string; re: RegExp; weight: number }[] = [
  { name: "humanitix", re: /humanitix\.com/i, weight: 3 },
  { name: "eventbrite", re: /eventbrite\.[a-z.]+/i, weight: 3 },
  { name: "luma", re: /\b(?:lu\.ma|luma\.com)\b/i, weight: 3 },
  { name: "register", re: /\b(?:register(?:ed|ing)?|registration|sign[\s-]?up|RSVP)\b/i, weight: 1 },
  { name: "ticket", re: /\b(?:tickets?|book\s+your\s+spot|seats?)\b/i, weight: 1 },
  { name: "speaker", re: /\b(?:speaker|panellist|panelist|keynote|guest\s+speaker)\b/i, weight: 1 },
  { name: "venue", re: /\b(?:venue|doors\s+open|agenda|line[\s-]?up)\b/i, weight: 1 },
  {
    name: "date",
    re: /\b(\d{1,2}(?:st|nd|rd|th)?\s+)?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}?,?\s*20\d\d\b/i,
    weight: 1,
  },
  { name: "time", re: /\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/i, weight: 1 },
];

const SIGNAL_THRESHOLD = 3;

export interface SignalResult {
  score: number;
  hits: string[];
  evidence: string; // single-line snippet of the strongest message
}

/**
 * Score an array of message text bodies for event-likeness. Returns a compact
 * result; callers only surface it to Claude when score >= SIGNAL_THRESHOLD.
 */
export function detectEventSignal(texts: string[]): SignalResult {
  let score = 0;
  const hits = new Set<string>();
  let best = "";
  let bestLocal = 0;
  for (const raw of texts) {
    const text = raw ?? "";
    let local = 0;
    for (const p of SIGNAL_PATTERNS) {
      if (p.re.test(text)) {
        score += p.weight;
        local += p.weight;
        hits.add(p.name);
      }
    }
    if (local > bestLocal) {
      bestLocal = local;
      best = text;
    }
  }
  const evidence = best.replace(/\s+/g, " ").trim().slice(0, 160);
  return { score, hits: [...hits], evidence };
}

export { SIGNAL_THRESHOLD };

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

export function nowIso(): string {
  return new Date().toISOString();
}
