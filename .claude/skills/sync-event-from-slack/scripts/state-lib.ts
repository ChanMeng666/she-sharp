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

export type ChannelType = "event" | "general" | "dm";

export type Mapping =
  // One channel can feed more than one event (e.g. a "13 & 20 June" planning
  // channel, or a month split into multiple sessions), hence an array.
  | { kind: "event"; events: { slug: string; eventId: number }[] }
  /**
   * `skip` answers "does this conversation feed a page on the site?" — and it
   * was being read as "is this conversation worth opening?", which are not the
   * same question.
   *
   * A 1:1 DM with the events lead feeds no page directly, so it is correctly
   * `skip`; it is also where "please update Carolina Lobos' profile" arrives.
   * On 5 Aug 2026 exactly that message was swept past and its read position
   * advanced, in a conversation whose own recorded reason read "carries direct
   * event-page edit requests — read the delta in full every run". Four DMs said
   * something equivalent and all four were hidden.
   *
   * `alwaysRead` separates the two questions. It keeps the conversation out of
   * the `create?` candidate pool while forcing it into the table on any new
   * content, and it stops the triage advancing a read position for content
   * nobody has read.
   */
  | { kind: "skip"; reason: string; alwaysRead?: boolean }
  | { kind: "none" };

export interface ThreadState {
  replyCount: number;
  latestReplyTs: string;
}

/**
 * Reads a `fetch-channel.ts` payload, and says something useful when it is not
 * one.
 *
 * The failure this exists for: the Slack SDK's default logger writes to stdout,
 * and stdout is where the payload goes. It stays quiet until a run hits the
 * rate limit, at which point retry notices land in the middle of the JSON and
 * every downstream script dies on `Unexpected token 'I'`. That reads like a
 * corrupt download; it is a logger pointed at the wrong stream. `slack-client.ts`
 * now routes SDK logs to stderr, and this turns any recurrence — a stray
 * `console.log` in a script, a dependency doing the same thing — into a message
 * that names its own cause instead of a stack trace.
 */
export function readPayload(path: string): any {
  const raw = readFileSync(path, "utf8");
  try {
    return JSON.parse(raw);
  } catch (error) {
    const head = raw.slice(0, 200).replace(/\s+/g, " ");
    const polluted = /^\s*\[(INFO|WARN|DEBUG|ERROR)\]/m.test(raw);
    throw new Error(
      `${path} is not valid JSON.\n` +
        (polluted
          ? "  It contains log lines. Something wrote to STDOUT, which is where the payload goes —\n" +
            "  check for a console.log in a script, or an SDK logger that is not pointed at stderr.\n"
          : "  The fetch may have been interrupted; re-run it.\n") +
        `  starts: ${head}\n` +
        `  parser: ${(error as Error).message}`,
    );
  }
}

/**
 * Where the triage has scored up to. Falls back to the read position for
 * entries written before the two positions were separated.
 */
export function scannedPosition(c: ChannelState | undefined): string {
  return c?.scannedTs || c?.watermarkTs || "0";
}

/**
 * Should a state write KEEP the mapping the channel already has?
 *
 * Yes whenever the caller did not name one and the channel has one. Recording a
 * read is not a statement about mapping, and `update-state.ts` used to treat a
 * missing `--mapping` as `none` — so the ordinary act of writing down "I have
 * read this" silently deleted an event linkage, or a `skip` whose reason was a
 * paragraph of context nobody could reconstruct.
 *
 * It lives here, next to the other read-position rules, because the alternative
 * is a second copy of the question inside a CLI argument parser where no test
 * can reach it. That is the same shape as the `threadHasUnread` split that cost
 * an event owner's deck review: when this question has two implementations they
 * eventually disagree, and the disagreement is silent.
 */
export function shouldInheritMapping(
  prev: ChannelState | undefined,
  explicitKind: string | undefined,
): boolean {
  return explicitKind === undefined && !!prev?.mapping;
}

/**
 * Conversations the triage has scored past content the model was never shown.
 *
 * EVERY conversation counts. This used to exempt anything the signal gate had
 * dismissed — bot channels, chatter, settled history — on the reasoning that a
 * scored-and-dismissed channel is not a backlog. That reasoning assumes the
 * heuristic is right about what matters, and it is a keyword heuristic: it
 * scores "please update Carolina Lobos' profile on the website" at zero, and it
 * cannot know that somebody decided an event date in #random.
 *
 * So the gate now decides PRIORITY, never whether something is read. Anything
 * not delivered to the model by a real fetch is unread, and says so, however
 * chatty the room. `mapping` still records what a conversation feeds; it no
 * longer excuses anyone from reading it.
 */
export function unreadConversations(
  m: Manifest,
): { id: string; name: string; type: ChannelType; watermarkTs: string; scannedTs: string }[] {
  const out = [];
  for (const [id, c] of Object.entries(m.channels)) {
    const scanned = scannedPosition(c);
    /*
     * A read position of "0" means NEVER READ, not "read up to the beginning of
     * time" — and the two were indistinguishable here until `verify-coverage.ts`
     * walked Slack and found a mapped event channel sitting on 173 unread
     * messages and 20 unrecorded threads. It had been mapped without a fetch
     * payload and then archived, and `archived` counts as settled in the triage,
     * so nothing ever looked at it again. Comparing scanned against read cannot
     * catch that on its own: both were "0".
     */
    // `readAt` is the honest test. `watermarkTs` alone cannot answer it for any
    // entry written before the split, because the triage wrote that field too.
    const neverRead = !c.readAt || !c.watermarkTs || c.watermarkTs === "0";
    /*
     * A settled skip is allowed to be scanned past its read position.
     *
     * Bot channels and closed history accumulate traffic forever; counting each
     * new line as backlog would make the audit cry wolf and stop being read,
     * which is the one failure mode a gate cannot survive. The triage already
     * reopens these as `skip→review` when a delta scores for event content.
     *
     * This exemption covers the scan gap ONLY — never `neverRead`. A skip that
     * no payload has ever delivered is still a hole, because the signal gate
     * decides priority and never whether something was read.
     *
     * `alwaysRead` opts back in: those are the conversations where a person
     * sends work, and the 5 August DM is why the flag exists at all.
     */
    const settledSkip =
      c.mapping?.kind === "skip" && !c.mapping.alwaysRead;
    if (neverRead || (!settledSkip && Number(scanned) > Number(c.watermarkTs))) {
      out.push({ id, name: c.name, type: c.type, watermarkTs: c.watermarkTs, scannedTs: scanned });
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

/** The two fields Slack returns on a parent message that has replies. */
export interface ThreadFacts {
  reply_count?: number;
  latest_reply?: string;
  ts: string;
}

/**
 * Does this thread carry replies the manifest has no record of anyone reading?
 *
 * THE ONE PLACE THIS QUESTION IS ANSWERED. It used to be answered twice — once
 * in `fetch-channel.ts`, wrongly, and not at all in `discover-channels.ts` —
 * and on 4 August 2026 the two disagreed badly enough to hide the event owner's
 * entire review of a deck due on a projector three days later.
 *
 * The rules that matter, both learned from that miss:
 *
 * 1. **An ABSENT `known` means zero replies seen, not "skip this one."** A
 *    message posted with no replies is never recorded as a thread, so the first
 *    reply it ever receives arrives on a thread the manifest has never heard
 *    of. Requiring a prior record made exactly that case invisible.
 * 2. **`latestReplyTs` is checked as well as `replyCount`.** A thread that
 *    gains one reply and loses another holds its count while its latest moves.
 */
export function threadHasUnread(
  current: ThreadFacts,
  known: ThreadState | undefined,
): boolean {
  const replies = current.reply_count ?? 0;
  if (replies <= 0) return false;
  return (
    replies > (known?.replyCount ?? 0) ||
    Number(current.latest_reply ?? 0) > Number(known?.latestReplyTs ?? 0)
  );
}

/**
 * The thread half of a read receipt.
 *
 * `delivered` is the set of parents whose replies were actually handed to the
 * caller this run. Everything else keeps whatever the manifest already had —
 * including nothing, when the thread has never been seen.
 *
 * The temptation is to write the *current* state of every thread here, on the
 * reasoning that the next run wants a complete picture. That is what
 * `fetch-channel.ts` did, and it is why a delivery bug did not merely lose six
 * replies but recorded them as read on the way past. A read receipt may only
 * ever describe what was read.
 */
export function mergeThreadState(
  parents: ThreadFacts[],
  delivered: Set<string>,
  prior: Record<string, ThreadState>,
): Record<string, ThreadState> {
  const out: Record<string, ThreadState> = {};
  for (const p of parents) {
    if ((p.reply_count ?? 0) <= 0) continue;
    if (delivered.has(p.ts)) {
      out[p.ts] = {
        replyCount: p.reply_count ?? 0,
        latestReplyTs: p.latest_reply ?? p.ts,
      };
    } else if (prior[p.ts]) {
      out[p.ts] = prior[p.ts];
    }
  }
  return out;
}

export interface ChannelState {
  name: string;
  type: ChannelType;
  mapping: Mapping;
  /**
   * READ position: the newest top-level ts whose content was actually handed to
   * the model. Only `update-state.ts --from <payload>` may move it, because
   * only a fetch payload is evidence that anything was delivered.
   *
   * This used to be the only position in the manifest, written by two actors
   * with completely different levels of scrutiny — the cheap heuristic triage
   * and the real fetch. SKILL.md said "'quiet' is not 'read by the model'" for
   * months while the schema had no way to express the difference, so the
   * sentence was a wish rather than a rule. Four separate misses came out of
   * that, and the fourth was the events lead asking for a page change.
   */
  watermarkTs: string;
  /**
   * SCANNED position: the newest top-level ts the triage has scored. Advanced
   * by `discover-channels.ts` on quiet rows, never by anything else.
   *
   * Always `>= watermarkTs`. The gap between the two IS the unread backlog, and
   * `audit-read-state.ts` reports it. Absent on entries written before the
   * split, where it is read as equal to `watermarkTs` — which is exactly what
   * the old single-position code meant.
   */
  scannedTs?: string;
  /**
   * When a real fetch payload last delivered this conversation's content to the
   * model. Set ONLY by `update-state.ts --from <payload>`.
   *
   * Absent means never read — which is not the same as `watermarkTs: "0"`, and
   * that is the whole reason it exists. Before the scanned/read split, the
   * triage advanced the one position it had, so a conversation the heuristic had
   * merely glanced at ended up with a watermark that looks exactly like a
   * conversation somebody read end to end. No comparison of numbers already in
   * the manifest can tell those apart; only recording the act can.
   */
  readAt?: string;
  /**
   * How this entry's `readAt` was established, when it was NOT a fetch payload.
   *
   * Absent is the normal case and means the ordinary thing: `update-state.ts`
   * saw a payload and recorded the read. It is set only by the one-time
   * `backfill-read-receipts.ts`, for entries whose receipt was destroyed by the
   * `saveManifest` bug rather than never earned — and only after that script
   * walked the conversation in Slack and proved every message and every reply
   * already sits behind the recorded position.
   *
   * It exists so nobody has to take that on trust. A `readAt` with this field
   * set is a weaker claim than one without: "no unread content, verified on
   * this date" rather than "a human was shown this". Anything auditing the
   * manifest should be able to tell the two apart, and before this field it
   * could not.
   */
  readAtSource?: string;
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
    /*
     * The scanned/read split has to survive the write, or it does not exist.
     *
     * This function rebuilds every entry from a fixed key list, and until
     * 2026-08-07 that list omitted `scannedTs` and `readAt`. Both fields were
     * being computed and assigned — `discover-channels.ts` sets `scannedTs`,
     * `update-state.ts` sets `readAt` from a fetch payload — and both were
     * dropped on the way to disk, every run, silently.
     *
     * The visible cost was `audit-read-state.ts`. `unreadConversations()` reads
     * a missing `readAt` as NEVER READ, which is the correct reading, so with
     * nothing ever persisted it reported all 110 conversations unread and
     * exited non-zero on every invocation. A gate that is always red proves
     * nothing and gets ignored — which is exactly the failure it was written to
     * prevent. The quieter cost was the triage re-reading settled history from
     * the old watermark, because its scan position never survived either.
     *
     * Emitted only when set, so entries that genuinely have neither stay
     * byte-identical to their previous serialization.
     */
    if (c.scannedTs) entry.scannedTs = c.scannedTs;
    if (c.readAt) entry.readAt = c.readAt;
    // Same rule, and the same reason it is on this list at all: a field that
    // does not survive the write does not exist.
    if (c.readAtSource) entry.readAtSource = c.readAtSource;
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

/**
 * Event-planning channels are named `event…` by convention in this workspace.
 * Direct and group DMs get their own type: they carry no naming convention, so
 * they can never be classified as event channels, but they are still scanned
 * for event signal exactly like a general channel.
 */
export function classifyChannel(name: string): ChannelType {
  if (/^dm:/.test(name) || /^mpdm-/i.test(name)) return "dm";
  return /^event[-_]?/i.test(name) ? "event" : "general";
}

/** Types whose new messages get scored for event signal (i.e. everything but event channels). */
export function isSignalScanned(type: ChannelType): boolean {
  return type === "general" || type === "dm";
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
