/**
 * Where every She Sharp event is in its lifecycle, as one offline report.
 *
 * Running an event touches seven separate systems — a Slack planning channel,
 * the event record, the artwork on disk, a slide deck, a feedback code, an
 * announcement broadcast and four stages of attendee email — and each of them
 * keeps its own state in its own place. Nothing has ever been able to answer
 * "what is left to do for Thursday?" in one place, so the answer has been
 * reconstructed by hand every time, from memory, and the thing that gets
 * forgotten is whichever system nobody thought to open.
 *
 * Three properties make this usable as the front door of an automated pipeline:
 *
 *   It writes nothing, opens no socket and touches no database. Everything it
 *   reads is a file already in the repository, which is what lets CI run its
 *   test and what makes the report safe to run at any moment, including
 *   mid-send.
 *
 *   Every `missing` line carries the exact command or skill that fixes it. A
 *   checklist that says only "poster set: missing" moves the work from "what is
 *   left?" to "how do I do that again?", which is the same problem one step
 *   further on.
 *
 *   It always exits 0 on a successful run. This is a report, not a gate — an
 *   event three weeks out is *supposed* to have most of these missing, and a
 *   non-zero exit would make the pipeline treat a healthy early event as a
 *   failure.
 *
 * Usage:
 *   npx tsx scripts/events/event-status.ts                  # upcoming events
 *   npx tsx scripts/events/event-status.ts --slug <slug>    # one event (repeatable)
 *   npx tsx scripts/events/event-status.ts --past 5         # the 5 most recent past events
 *   npx tsx scripts/events/event-status.ts --all --json     # everything, machine-readable
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { eventArchivePhotos } from "@/lib/data/event-archive-photos";
import {
  formatDateString,
  getAllEvents,
  getAllSpeakersFromEvent,
  getPastEvents,
  getUpcomingEvents,
  parseDateString,
} from "@/lib/data/events";
import { feedbackUrlForSlug } from "@/lib/data/feedback-codes";
import { deckForEvent } from "@/lib/deck/index-meta";
import type { EventV3 } from "@/types/event";

import {
  STATE_PATH as SYNC_STATE_PATH,
  scannedPosition,
  type ChannelState,
} from "../../.claude/skills/sync-event-from-slack/scripts/state-lib";
import { FORMATS } from "./poster-formats";
import { LINEUP_FORMATS, SPEAKER_FORMATS } from "./poster-speaker-formats";
import { speakerSlug } from "./poster-type";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
/** repo root — two levels above `scripts/events/`. */
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..", "..");
const PUBLIC_ROOT = path.join(REPO_ROOT, "public");
const EVENT_IMAGES_ROOT = path.join(PUBLIC_ROOT, "img", "events");
const EMAIL_LEDGER_PATH = path.join(
  REPO_ROOT, ".claude", "skills", "send-event-emails", "state", "event-emails.json",
);
const BROADCAST_LEDGER_PATH = path.join(
  REPO_ROOT, ".claude", "skills", "email-the-community", "state", "broadcasts.json",
);

// ---------------------------------------------------------------------------
// Report model
// ---------------------------------------------------------------------------

/**
 * `n/a` is not a softer `missing`, and keeping them apart is the difference
 * between a checklist somebody reads and one they learn to ignore. A past
 * event's poster set is not outstanding work; a past event's photo gallery is.
 */
export type CheckState = "done" | "missing" | "n/a";

export interface StatusCheck {
  /** Stable machine key — `--json` consumers match on this, not on the label. */
  id: string;
  /** Column heading in the printed report. */
  label: string;
  state: CheckState;
  /** One line of evidence: what is there, or precisely what is not. */
  detail: string;
  /** The command or skill that fixes a `missing`. Null for `done` and `n/a`. */
  fix: string | null;
}

export interface EventStatusReport {
  slug: string;
  title: string;
  /** The record's own date string, e.g. "September 3, 2026". */
  date: string;
  /** That date written out, e.g. "Thursday, 3 September 2026". */
  when: string;
  time: string;
  venue: string;
  isUpcoming: boolean;
  /** Whole days until the event; negative once it is past. */
  daysUntil: number;
  attendees: number | null;
  checkedIn: number | null;
  checks: StatusCheck[];
  /** How many of `checks` are `missing`. `n/a` never counts. */
  missingCount: number;
}

/** Thrown for the conditions that make a report impossible rather than empty. */
class StatusError extends Error {}

// ---------------------------------------------------------------------------
// State files
// ---------------------------------------------------------------------------

/**
 * Reads a committed state file, treating unreadable as fatal.
 *
 * The tolerant loaders these files ship with fall back to an empty ledger, which
 * is right for their owners — a corrupt file must not stop a send resuming. It
 * is wrong here: an empty ledger reads as "nothing has been sent", so a report
 * built on one would quietly tell an organiser to send an announcement that has
 * already gone out. Absent is fine and means what it says; present-and-broken
 * stops the run.
 */
function readState<T>(file: string, empty: T): T {
  if (!existsSync(file)) return empty;
  try {
    return JSON.parse(readFileSync(file, "utf8")) as T;
  } catch (error) {
    throw new StatusError(
      `${file} is not valid JSON: ${error instanceof Error ? error.message : String(error)}\n` +
        "This file records what has already been sent or read. Restore it from git rather\n" +
        "than deleting it — an empty one reads as \"nothing has happened yet\".",
    );
  }
}

interface SyncManifest {
  version: number;
  channels: Record<string, ChannelState>;
}

interface EmailStage {
  sentAt: string | null;
  recipientCount: number;
  recipientHashes: string[];
  chunksSent: number;
  chunksTotal: number;
  status: "in-progress" | "complete";
}

interface EmailLedger {
  version: number;
  events: Record<string, { stages: Record<string, EmailStage>; digest: string }>;
}

interface BroadcastEntry {
  broadcastId: string;
  status: "draft" | "scheduled" | "sent";
  segment: string;
  sentAt: string | null;
  digest: string;
}

interface BroadcastLedger {
  version: number;
  broadcasts: Record<string, BroadcastEntry>;
}

let syncManifest: SyncManifest | null = null;
let emailLedger: EmailLedger | null = null;
let broadcastLedger: BroadcastLedger | null = null;

function sync(): SyncManifest {
  syncManifest ??= readState<SyncManifest>(SYNC_STATE_PATH, { version: 1, channels: {} });
  if (!syncManifest.channels) syncManifest.channels = {};
  return syncManifest;
}

function emails(): EmailLedger {
  emailLedger ??= readState<EmailLedger>(EMAIL_LEDGER_PATH, { version: 1, events: {} });
  if (!emailLedger.events) emailLedger.events = {};
  return emailLedger;
}

function broadcasts(): BroadcastLedger {
  broadcastLedger ??= readState<BroadcastLedger>(BROADCAST_LEDGER_PATH, {
    version: 1,
    broadcasts: {},
  });
  if (!broadcastLedger.broadcasts) broadcastLedger.broadcasts = {};
  return broadcastLedger;
}

/** The Slack channel mapped to this slug, with its id, or null. */
function channelForSlug(slug: string): { id: string; channel: ChannelState } | null {
  for (const [id, channel] of Object.entries(sync().channels)) {
    if (channel.mapping?.kind !== "event") continue;
    if (channel.mapping.events.some((entry) => entry.slug === slug)) return { id, channel };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Files on disk
// ---------------------------------------------------------------------------

const folderCache = new Map<string, string[]>();

/** Every filename directly under `public/img/events/<slug>/`; empty when absent. */
function eventFiles(slug: string): string[] {
  let files = folderCache.get(slug);
  if (!files) {
    const dir = path.join(EVENT_IMAGES_ROOT, slug);
    files = existsSync(dir) ? readdirSync(dir) : [];
    folderCache.set(slug, files);
  }
  return files;
}

function hasArchiveFolder(slug: string): boolean {
  return existsSync(path.join(EVENT_IMAGES_ROOT, slug, "archive"));
}

/** `encode` names an encoder; this is the extension it writes. */
function extensionFor(encoding: "webp" | "jpeg"): string {
  return encoding === "jpeg" ? "jpg" : "webp";
}

/**
 * Is `<stem>.<ext>` present, allowing the build's optional `--suffix`?
 *
 * A re-run with `--suffix v2` writes `social-v2.jpg` beside the original, and
 * the newer file is the one that gets posted. Matching the stem exactly would
 * report a complete, freshly rebuilt poster set as missing — which is how a
 * checklist teaches people to stop trusting it.
 */
function hasArtwork(files: string[], stem: string, ext: string): boolean {
  const pattern = new RegExp(`^${stem}(-[a-z0-9]+)?\\.${ext}$`, "i");
  return files.some((file) => pattern.test(file));
}

/** Which encodings of one poster format are missing from the folder. */
function missingEncodings(
  files: string[],
  stem: string,
  encode: readonly ("webp" | "jpeg")[],
): string[] {
  return encode
    .map(extensionFor)
    .filter((ext) => !hasArtwork(files, stem, ext))
    .map((ext) => `.${ext}`);
}

// ---------------------------------------------------------------------------
// The checks
// ---------------------------------------------------------------------------

function done(id: string, label: string, detail: string): StatusCheck {
  return { id, label, state: "done", detail, fix: null };
}

function missing(id: string, label: string, detail: string, fix: string): StatusCheck {
  return { id, label, state: "missing", detail, fix };
}

function notApplicable(id: string, label: string, detail: string): StatusCheck {
  return { id, label, state: "n/a", detail, fix: null };
}

/** A Slack epoch-seconds timestamp as a plain date, for a human reading a report. */
function tsDate(ts: string): string {
  const seconds = Number(ts);
  if (!Number.isFinite(seconds) || seconds <= 0) return "an unknown date";
  return new Date(seconds * 1000).toLocaleDateString("en-NZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function isoDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleDateString("en-NZ", { year: "numeric", month: "short", day: "numeric" });
}

function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}

/** How many names a `missing` line spells out before it starts counting. */
const NAMES_SHOWN = 4;

/** Names, truncated — a line nobody finishes reading names nothing. */
function summarise(names: string[]): string {
  if (names.length <= NAMES_SHOWN) return names.join(", ");
  return `${names.slice(0, NAMES_SHOWN).join(", ")} and ${names.length - NAMES_SHOWN} more`;
}

/**
 * The planning channel, and whether anything in it is still unread.
 *
 * The gap between `scannedTs` (what the triage scored) and `watermarkTs` (what
 * was actually handed to the model) IS the unread backlog — the distinction four
 * separate misses were caused by, one of which was the events lead asking for a
 * page change. So a mapped channel with a gap is outstanding work, not a tick.
 */
function slackCheck(slug: string, upcoming: boolean): StatusCheck {
  const mapped = channelForSlug(slug);
  if (!mapped) {
    const detail = "no Slack planning channel is mapped to this slug";
    if (!upcoming) {
      return notApplicable(
        "slack",
        "Slack",
        `${detail} — the sync skill does not adopt events it never planned`,
      );
    }
    return missing(
      "slack",
      "Slack",
      detail,
      "/sync-event-from-slack  (discover-channels.ts finds it, update-state.ts records the mapping)",
    );
  }

  const { id, channel } = mapped;
  const read = Number(channel.watermarkTs || "0");
  const scanned = Number(scannedPosition(channel));
  const readOn = channel.readAt ? isoDate(channel.readAt) : tsDate(channel.watermarkTs);

  if (scanned > read) {
    return missing(
      "slack",
      "Slack",
      `#${channel.name} — unread backlog: the triage has scanned to ${tsDate(String(scanned))}, ` +
        `but nothing past ${tsDate(String(read))} has been read`,
      `npx tsx .claude/skills/sync-event-from-slack/scripts/fetch-channel.ts ${id} --state`,
    );
  }

  return done("slack", "Slack", `#${channel.name}, read to ${readOn}, no backlog`);
}

/**
 * Is the event record complete enough for everything downstream to build?
 *
 * Every one of these fields is read by something else — the poster reads the
 * date, venue and partner; the deck reads the speakers; the page reads the
 * description — so a hole here fails later, in a different tool, with a message
 * about the tool rather than about the record. A missing speaker headshot is
 * listed for exactly that reason: `build-event-poster.ts` refuses without one.
 *
 * A past event is held to the description alone, deliberately. Forty-seven of
 * the ninety-seven records are scraped history with no start time and no named
 * speakers, and none of that will ever be filled in — flagging them would put
 * fifty `missing` lines carrying a fix nobody can run ("sync it from a Slack
 * channel that does not exist") in front of the handful that are real.
 */
function eventDataCheck(event: EventV3, upcoming: boolean): StatusCheck {
  const data = event.detailPageData;
  const speakers = getAllSpeakersFromEvent(event);
  const sponsors = data.sponsors?.main ?? [];
  const gaps: string[] = [];

  if ((data.fullDescription ?? []).length === 0) gaps.push("description");
  if (upcoming) {
    if (!data.time?.trim()) gaps.push("time");
    if (data.location?.format !== "online" && !data.location?.venueName?.trim()) gaps.push("venue");
    if (speakers.length === 0) gaps.push("speakers");
    if (!data.registrationUrl?.trim()) gaps.push("registration link");
    for (const person of speakers) {
      if (!person.image?.trim()) gaps.push(`headshot for ${person.name}`);
    }
  }

  if (gaps.length > 0) {
    return missing(
      "event-data",
      "Event data",
      `${summarise(gaps)} missing from the event record`,
      upcoming
        ? "/sync-event-from-slack  (or edit lib/data/json/events-custom.json directly)"
        : "edit lib/data/json/events-custom.json",
    );
  }

  const parts = [
    speakers.length > 0 ? plural(speakers.length, "speaker") : null,
    sponsors.length > 0 ? plural(sponsors.length, "sponsor") : null,
    (data.specialSections ?? []).length > 0
      ? plural(data.specialSections.length, "section")
      : null,
    data.registrationUrl?.trim() ? "registration link set" : null,
  ].filter((part): part is string => part !== null);

  return done(
    "event-data",
    "Event data",
    parts.length > 0 ? parts.join(" · ") : "description present",
  );
}

function coverCheck(event: EventV3): StatusCheck {
  const url = event.coverImage?.url?.trim();
  if (!url) {
    return missing(
      "cover",
      "Cover image",
      "the event record carries no coverImage.url",
      "/make-event-poster  (the `social` WebP is the site's cover)",
    );
  }
  const file = path.join(PUBLIC_ROOT, url.replace(/^\//, ""));
  if (!existsSync(file)) {
    return missing(
      "cover",
      "Cover image",
      `${url} is in the record but not on disk`,
      "/make-event-poster  (the `social` WebP is the site's cover)",
    );
  }
  if (!event.coverImage.alt?.trim()) {
    return missing(
      "cover",
      "Cover image",
      `${url} has no alt text`,
      "add coverImage.alt in lib/data/json/events-custom.json",
    );
  }
  return done("cover", "Cover image", url);
}

/**
 * The five upload sizes, judged on the files the build actually writes.
 *
 * Derived from `FORMATS` rather than a list typed out here, so a sixth size
 * added to the poster builder appears in this report the same day instead of
 * being silently exempt from it.
 */
function posterCheck(slug: string, upcoming: boolean): StatusCheck {
  const files = eventFiles(slug);
  const present: string[] = [];
  const absent: string[] = [];

  for (const format of FORMATS) {
    const gaps = missingEncodings(files, format.key, format.encode);
    if (gaps.length === 0) present.push(format.key);
    else absent.push(`${format.key} (${gaps.join(" + ")})`);
  }

  if (absent.length === 0) return done("posters", "Poster set", present.join(", "));

  if (!upcoming) {
    return notApplicable(
      "posters",
      "Poster set",
      present.length > 0
        ? `${present.length} of ${FORMATS.length} sizes on disk (${present.join(", ")}) — the event has been and gone`
        : "no promotional artwork was built, and the event has been and gone",
    );
  }

  return missing(
    "posters",
    "Poster set",
    `${absent.join(", ")} missing${present.length > 0 ? ` (have: ${present.join(", ")})` : ""}`,
    "/make-event-poster",
  );
}

/**
 * One poster per speaker, plus the line-up tile.
 *
 * This is the set that carries an event through the weeks before it — a new
 * face per post rather than the same picture five times — so a half-built set
 * is a real gap, and naming the people who are missing is the whole value.
 */
function speakerPosterCheck(event: EventV3, upcoming: boolean): StatusCheck {
  const slug = event.slug;
  const speakers = getAllSpeakersFromEvent(event);
  if (speakers.length === 0) {
    return notApplicable("speaker-posters", "Speaker set", "the event record lists no speakers");
  }

  const files = eventFiles(slug);
  const covered: string[] = [];
  const incomplete: string[] = [];

  for (const person of speakers) {
    const stemBase = `speaker-${speakerSlug(person.name)}`;
    const gaps = SPEAKER_FORMATS.filter(
      (format) => missingEncodings(files, `${stemBase}-${format.key}`, format.encode).length > 0,
    ).map((format) => format.key);
    if (gaps.length === 0) covered.push(person.name);
    // Naming the sizes only when SOME of them exist: "Ana (story)" is a
    // half-finished poster worth chasing, while "Ana (social, story, square)"
    // for all twenty-two speakers is a wall of text that says one thing.
    else if (gaps.length === SPEAKER_FORMATS.length) incomplete.push(person.name);
    else incomplete.push(`${person.name} (${gaps.join(", ")})`);
  }

  const lineupGaps = LINEUP_FORMATS.filter(
    (format) => missingEncodings(files, `lineup-${format.key}`, format.encode).length > 0,
  ).map((format) => format.key);

  if (incomplete.length === 0 && lineupGaps.length === 0) {
    return done(
      "speaker-posters",
      "Speaker set",
      `${covered.length} of ${speakers.length} speakers + line-up tile`,
    );
  }

  if (!upcoming) {
    return notApplicable(
      "speaker-posters",
      "Speaker set",
      `${covered.length} of ${plural(speakers.length, "speaker")} had a poster` +
        `${lineupGaps.length > 0 ? ", and no line-up tile was built" : ""} — the event has already run`,
    );
  }

  const detail = [
    incomplete.length > 0 ? `no poster for ${summarise(incomplete)}` : null,
    lineupGaps.length > 0 ? "no line-up tile" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return missing(
    "speaker-posters",
    "Speaker set",
    detail,
    `npx tsx scripts/events/build-event-poster.ts ${slug} --plate <plate.png> --speaker all --lineup`,
  );
}

function deckCheck(slug: string, upcoming: boolean): StatusCheck {
  const deck = deckForEvent(slug);
  if (deck) {
    return done("deck", "Deck", `/present/${deck.slug} · ${plural(deck.slideCount, "slide")}`);
  }
  if (!upcoming) {
    return notApplicable("deck", "Deck", "no deck was built, and the event has already run");
  }
  return missing("deck", "Deck", "no deck is registered for this event", "/build-event-slides");
}

/**
 * The feedback link is derived from the slug, so it exists the moment the event
 * does. It is reported anyway because the number nobody can look up is the one
 * that gets mistyped onto a slide.
 */
function feedbackCheck(slug: string): StatusCheck {
  return done("feedback", "Feedback", feedbackUrlForSlug(slug).replace(/^https?:\/\//, ""));
}

/**
 * Has an announcement broadcast gone out for this event?
 *
 * Broadcasts are keyed by a free-form, human-chosen key ("announce-mentoring-
 * round-open"), so nothing in the ledger's shape ties one to an event. A key or
 * digest that names the slug is real evidence; the absence of one is not, which
 * is why a populated ledger with no match reports `n/a` rather than accusing
 * the team of forgetting. An EMPTY ledger has no such ambiguity.
 */
function announcementCheck(slug: string, upcoming: boolean): StatusCheck {
  const ledger = broadcasts();
  const entries = Object.entries(ledger.broadcasts);
  const match = entries.find(
    ([key, entry]) =>
      key.toLowerCase().includes(slug) || (entry.digest ?? "").toLowerCase().includes(slug),
  );

  if (match) {
    const [key, entry] = match;
    const detail = `${key} — ${entry.status}${entry.sentAt ? ` ${isoDate(entry.sentAt)}` : ""} to ${entry.segment}`;
    if (entry.status === "sent") return done("announcement", "Announcement", detail);
    return missing(
      "announcement",
      "Announcement",
      `${detail} — created but not sent`,
      "/email-the-community",
    );
  }

  if (!upcoming) {
    return notApplicable("announcement", "Announcement", "the event has already run");
  }

  if (entries.length > 0) {
    return notApplicable(
      "announcement",
      "Announcement",
      `${plural(entries.length, "broadcast")} recorded, none naming this slug — ` +
        "broadcast keys are free-form, so silence here is not proof of anything",
    );
  }

  return missing(
    "announcement",
    "Announcement",
    "no announcement broadcast has ever been recorded",
    "/email-the-community  (needs a consented Resend segment first)",
  );
}

const EMAIL_STAGES = ["welcome", "week-before", "day-before", "thank-you"] as const;

/**
 * The four attendee-email stages.
 *
 * A half-sent stage is reported ahead of an unsent one, because it is the only
 * state with a wrong way to recover: restarting a stage re-mails everyone who
 * already got it, and the ledger exists precisely so the run can resume instead.
 */
function emailCheck(slug: string, upcoming: boolean): StatusCheck {
  const record = emails().events[slug];
  const stages = record?.stages ?? {};
  const complete: string[] = [];
  const partial: string[] = [];
  const unsent: string[] = [];

  for (const stage of EMAIL_STAGES) {
    const state = stages[stage];
    if (!state) unsent.push(stage);
    else if (state.status === "complete") complete.push(stage);
    else partial.push(`${stage} (${state.chunksSent}/${state.chunksTotal} chunks)`);
  }

  if (partial.length > 0) {
    return missing(
      "emails",
      "Emails",
      `${partial.join(", ")} half-sent — resume, never restart`,
      `/send-event-emails  (npx tsx .claude/skills/send-event-emails/scripts/event-ledger.ts show --slug ${slug})`,
    );
  }

  if (unsent.length === 0) {
    return done("emails", "Emails", `${complete.join(", ")} all sent`);
  }

  if (!upcoming && complete.length === 0) {
    return notApplicable(
      "emails",
      "Emails",
      "nothing recorded in the ledger, and the event has already run",
    );
  }

  return missing(
    "emails",
    "Emails",
    `${unsent.join(", ")} unsent${complete.length > 0 ? ` (sent: ${complete.join(", ")})` : ""}`,
    "/send-event-emails",
  );
}

/**
 * Photos after the fact: the album link, the page's own set, or the harvest.
 *
 * Only ever asked of a past event — an upcoming one has no photographs by
 * definition, and asking would put a permanent `missing` on every event in the
 * pipeline.
 */
function photosCheck(event: EventV3, upcoming: boolean): StatusCheck {
  if (upcoming) {
    return notApplicable("photos", "Photos", "the event has not happened yet");
  }

  const slug = event.slug;
  const albumUrl = event.detailPageData.galleryUrl?.trim();
  const onPage = (event.detailPageData.photos ?? []).length;
  const harvested = (eventArchivePhotos[slug] ?? []).length;

  const parts: string[] = [];
  if (harvested > 0) parts.push(`${plural(harvested, "harvested photo")}`);
  if (onPage > 0) parts.push(`${plural(onPage, "photo")} on the page`);
  if (albumUrl) parts.push("album link set");

  if (harvested > 0 || onPage > 0) return done("photos", "Photos", parts.join(" · "));

  if (albumUrl) {
    return missing(
      "photos",
      "Photos",
      `album link set but nothing harvested${hasArchiveFolder(slug) ? " into the archive folder" : ""}`,
      `npx tsx scripts/build-event-archive.mts --slug ${slug}`,
    );
  }

  return missing(
    "photos",
    "Photos",
    "no album link, no photos on the page, nothing harvested",
    `add detailPageData.galleryUrl to lib/data/json/events-custom.json, then npx tsx scripts/build-event-archive.mts --slug ${slug}`,
  );
}

/**
 * Whole days from `now` to the event, negative once it is past.
 *
 * The same comparison `isUpcomingEvent()` and `getDaysUntilEvent()` make, but
 * against a date the caller supplies rather than the wall clock. Half of this
 * report turns on which side of the event today falls, so a fixed clock is what
 * lets a test pin both branches — otherwise every assertion about an upcoming
 * event silently becomes an assertion about a past one the morning after it
 * runs, and CI starts failing on a date rather than on a change. Mirrors the
 * `asOf` parameter `getEventsHeldCount()` already takes for the same reason.
 */
function daysFrom(event: EventV3, now: Date): number {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const day = parseDateString(event.date);
  day.setHours(0, 0, 0, 0);
  return Math.round((day.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Every check for one event, in the order the work actually happens.
 *
 * Exported as a pure function over the event record so the test can assert on
 * the derivation rather than on printed text — the layout below is meant to be
 * rewritten whenever it reads badly, and no test should stand in the way.
 *
 * @param event The event record, from the merged list.
 * @param now Treated as today. Defaults to the wall clock.
 */
export function statusForEvent(event: EventV3, now: Date = new Date()): EventStatusReport {
  const daysUntil = daysFrom(event, now);
  const upcoming = daysUntil >= 0;
  const slug = event.slug;

  const checks: StatusCheck[] = [
    slackCheck(slug, upcoming),
    eventDataCheck(event, upcoming),
    coverCheck(event),
    posterCheck(slug, upcoming),
    speakerPosterCheck(event, upcoming),
    deckCheck(slug, upcoming),
    feedbackCheck(slug),
    announcementCheck(slug, upcoming),
    emailCheck(slug, upcoming),
    photosCheck(event, upcoming),
  ];

  return {
    slug,
    title: event.title,
    date: event.date,
    when: formatDateString(event.date, "full"),
    time: event.detailPageData.time?.trim() || "time TBA",
    venue:
      event.detailPageData.location?.venueName?.trim() ||
      event.detailPageData.location?.city?.trim() ||
      "venue TBA",
    isUpcoming: upcoming,
    daysUntil,
    attendees: event.attendees,
    checkedIn: event.checkedIn,
    checks,
    missingCount: checks.filter((check) => check.state === "missing").length,
  };
}

// ---------------------------------------------------------------------------
// Printing
// ---------------------------------------------------------------------------

const LABEL_WIDTH = 13;
const STATE_WIDTH = 9;
const INDENT = "  ";

/** "in 13 days" / "13 days ago" / "today", from the signed day count. */
function relativeDay(days: number): string {
  if (days === 0) return "today";
  if (days > 0) return `in ${plural(days, "day")}`;
  return `${plural(-days, "day")} ago`;
}

function printReport(report: EventStatusReport): void {
  console.log(`${report.slug} — ${report.title}`);

  const meta = [report.when, report.time, report.venue, relativeDay(report.daysUntil)];
  if (!report.isUpcoming && report.attendees !== null) {
    meta.push(
      report.checkedIn !== null && report.checkedIn > 0
        ? `${report.attendees} registered, ${report.checkedIn} checked in`
        : `${report.attendees} registered`,
    );
  }
  console.log(`${INDENT}${meta.join(" · ")}`);
  console.log("");

  for (const check of report.checks) {
    const head = `${INDENT}${check.label.padEnd(LABEL_WIDTH)}${check.state.padEnd(STATE_WIDTH)}`;
    console.log(`${head}${check.detail}`);
    if (check.fix) {
      console.log(`${INDENT}${" ".repeat(LABEL_WIDTH + STATE_WIDTH)}→ ${check.fix}`);
    }
  }
  console.log("");
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const USAGE = `Where each She Sharp event is in its lifecycle. Reads only committed files —
no network, no database, nothing written.

Usage:
  npx tsx scripts/events/event-status.ts [selection] [--json]

Selection (default: --upcoming):
  --upcoming        every event still to come
  --slug <slug>     one event; repeat the flag for several
  --past [N]        the N most recent past events (default 5)
  --all             every event on record

Output:
  --json            the same data, machine-readable
  --help            this message

Every "missing" line names the command or skill that fixes it. Exits 0 whatever
the report says — an event three weeks out is meant to have work outstanding.`;

interface Options {
  slugs: string[];
  upcoming: boolean;
  all: boolean;
  past: number | null;
  json: boolean;
}

/** Default when `--past` is given no number. */
const DEFAULT_PAST = 5;

function parseArgs(argv: string[]): Options {
  const options: Options = { slugs: [], upcoming: false, all: false, past: null, json: false };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    switch (arg) {
      case "--slug": {
        const value = argv[index + 1];
        if (!value || value.startsWith("--")) throw new StatusError("--slug requires an event slug.");
        options.slugs.push(value);
        index += 1;
        break;
      }
      case "--past": {
        const value = argv[index + 1];
        if (value && !value.startsWith("--")) {
          const count = Number(value);
          if (!Number.isInteger(count) || count < 1) {
            throw new StatusError(`--past takes a positive whole number (got "${value}").`);
          }
          options.past = count;
          index += 1;
        } else {
          options.past = DEFAULT_PAST;
        }
        break;
      }
      case "--upcoming":
        options.upcoming = true;
        break;
      case "--all":
        options.all = true;
        break;
      case "--json":
        options.json = true;
        break;
      default:
        throw new StatusError(`Unknown flag: ${arg}\n\n${USAGE}`);
    }
  }

  return options;
}

/**
 * The events to report on, deduplicated and left in the order each source
 * returns them — upcoming nearest-first, past most-recent-first.
 */
function select(options: Options): EventV3[] {
  const chosen: EventV3[] = [];
  const seen = new Set<string>();
  const add = (events: EventV3[]) => {
    for (const event of events) {
      if (seen.has(event.slug)) continue;
      seen.add(event.slug);
      chosen.push(event);
    }
  };

  if (options.all) add(getAllEvents());

  for (const slug of options.slugs) {
    const event = getAllEvents().find((candidate) => candidate.slug === slug);
    if (!event) {
      throw new StatusError(
        `No event has the slug "${slug}".\n` +
          "Slugs come from the merged event list — check lib/data/json/events-custom.json,\n" +
          "or run this with --all to see every one.",
      );
    }
    add([event]);
  }

  if (options.upcoming) add(getUpcomingEvents());
  if (options.past !== null) add(getPastEvents(options.past));

  // No selection at all means the everyday question: what is coming up?
  if (chosen.length === 0 && !options.all && options.slugs.length === 0 && options.past === null) {
    add(getUpcomingEvents());
  }

  return chosen;
}

function main(argv: string[]): void {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(USAGE);
    return;
  }

  const options = parseArgs(argv);
  const events = select(options);
  // Not `events.map(statusForEvent)`: map passes the index as the second
  // argument, which would land in `now` and date every report to 1970.
  const reports = events.map((event) => statusForEvent(event));
  const missingTotal = reports.reduce((sum, report) => sum + report.missingCount, 0);

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          events: reports,
          summary: { events: reports.length, missing: missingTotal },
        },
        null,
        2,
      ),
    );
    return;
  }

  if (reports.length === 0) {
    console.log("No events matched. There is nothing upcoming — try --past or --all.");
    return;
  }

  console.log("");
  for (const report of reports) printReport(report);
  console.log(
    `${plural(reports.length, "event")} · ${plural(missingTotal, "check")} missing`,
  );
}

/**
 * Run only when this file IS the command, so `statusForEvent()` can be imported.
 *
 * `event-status.test.ts` asserts on the derivation rather than on stdout;
 * without this guard importing it would run the CLI, print the upcoming report
 * in the middle of the test output, and make the test depend on the printer.
 */
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    if (error instanceof StatusError) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
    throw error;
  }
}
