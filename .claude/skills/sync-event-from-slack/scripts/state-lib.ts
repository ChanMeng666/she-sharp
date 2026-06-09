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
/** events file, relative to the repo root (two levels above .claude) */
export const EVENTS_PATH = resolve(SKILL_ROOT, "..", "..", "..", "lib", "data", "json", "events-custom.json");

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
    ordered.channels[id] = {
      name: c.name,
      type: c.type,
      mapping: c.mapping,
      watermarkTs: c.watermarkTs,
      threads: sortThreads(c.threads),
      fingerprint: c.fingerprint,
      lastSyncedAt: c.lastSyncedAt,
      lastSyncedCommit: c.lastSyncedCommit,
    };
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
