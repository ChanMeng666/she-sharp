/**
 * Turns one event record into a ready-to-render marketing `MessageSpec`.
 *
 * She Sharp had no way to tell its mailing list about an upcoming event. Mail
 * to registrants is a different thing and is sent from Humanitix — its audience
 * is fulfilment-only and was never asked to receive promotion — and
 * `email-the-community` can send it, but knows nothing about events, so every
 * date, time, venue and link would be retyped by hand into a broadcast. Retyped
 * facts are exactly how an email comes to contradict the website.
 *
 * This script is the missing bridge and nothing more. It reads the repo's own
 * event record through `scripts/events/resolve-event.ts` — the same resolver the
 * posters use, so a date cannot drift between them — and
 * writes the JSON that `scripts/email/render-message.ts` renders and gates. It
 * sends nothing, talks to no network, and writes nothing outside `--out`.
 *
 * ONE EVENT, SEVERAL STAGES. A campaign is not one email. The lifecycle SOP's
 * own beat runs a save-the-date, then the line-up, then a last call, and each is
 * a different message to the same people — a different angle, a different
 * subject, a different button, and different facts held back. `--stage` names
 * which one is being built; {@link STAGES} is the whole difference between them,
 * written down once so the marketing department is not composing three emails
 * from a blank page. The spec key carries the stage, so the broadcast ledger
 * records each separately and its `no-op` verdict still stops the SAME stage
 * going out twice.
 *
 * Usage:
 *   npx tsx scripts/email/event-announcement-spec.ts --slug <event-slug>
 *   npx tsx scripts/email/event-announcement-spec.ts "les mills panel" --stage last-call
 *
 *   --slug <slug>          Exact slug. Without it, the positional words are
 *                          fuzzy-matched by the shared resolver.
 *   --stage <name>         save-the-date | line-up | last-call. Default line-up,
 *                          which is the single send this tool used to make.
 *   --list-stages          Print the stage table and exit.
 *   --strapline "<text>"   One framing sentence, placed above the description.
 *                          It belongs on the artefact, not in the event record.
 *   --subject "<text>"     Override the default subject (the event title).
 *   --preheader "<text>"   Override the default preview text.
 *   --cta "<text>"         Override the button label (default "Register").
 *   --allow-past           Build for an event whose date has passed.
 *   --out <path>           Default tmp/specs/announce-<slug>-<stage>.json
 *   --json                 Machine-readable report on stdout.
 *   --help
 *
 * Exit codes mirror the resolver so a caller can branch on them:
 *   0 resolved · 1 no match · 2 ambiguous · 3 refused (event already past)
 *   · 4 refused (the stage does not belong this far from the event)
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve as resolvePath } from "node:path";
import { fileURLToPath } from "node:url";

import { getAllEvents, type EventV3 } from "@/lib/data/events";
import {
  parseMessageSpec,
  type Block,
  type MessageSpec,
} from "@/lib/email/message";
import { getSenderIdentity } from "@/lib/email/senders";
import {
  resolveEventByQuery,
  type ResolveCandidate,
  type ResolvedEvent,
} from "@/scripts/events/resolve-event";

/** No match for the query. Same meaning as the resolver's exit 1. */
const EXIT_NO_MATCH = 1;

/** Several plausible events. Same meaning as the resolver's exit 2. */
const EXIT_AMBIGUOUS = 2;

/** The event has already happened and `--allow-past` was not given. */
const EXIT_PAST = 3;

/** The named stage does not belong this far from the event date. */
const EXIT_STAGE_WINDOW = 4;

/** Inbox-safe limits, mirrored from `gateSubject` / `gatePreheader`. */
const SUBJECT_MAX = 50;
const PREHEADER_MAX = 120;

/** Named so the generated copy never depends on the host's ICU version. */
const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Query parameters that must never reach a broadcast.
 *
 * Deliberately generous. In June 2026 an event page published its registration
 * codes and the fix cost a git history rewrite plus a rotation of every code.
 * An email cannot be rewritten at all: once it is in thousands of inboxes the
 * only remaining control is the code itself. So anything that reads like a
 * secret is stripped and reported, and a false positive costs nothing but a
 * line in the summary.
 */
const SECRET_PARAM =
  /(access|passcode|password|promo|discount|coupon|voucher|invite|invitation|token|secret|auth|key|code|pwd|pass|claim)/i;

/** Words that put a nearby uppercase token under suspicion, as `gates.ts` does. */
const CODE_KEYWORDS = ["code", "promo", "voucher", "discount", "access", "passcode"];

// ---------------------------------------------------------------------------
// Campaign stages
// ---------------------------------------------------------------------------

/** The three mailing-list touches one event campaign is allowed to have. */
export type StageName = "save-the-date" | "line-up" | "last-call";

/** Where a stage's single button points. */
type CtaTarget = "event-page" | "registration";

/**
 * Everything that differs between two stages of the same campaign.
 *
 * Written as data rather than as branches in `build()` so that the answer to
 * "what actually changes between a save-the-date and a last call?" is one table
 * a marketing person can read, and so the window guard and the copy come from
 * the same source. Adding a fourth stage means adding a row, not editing three
 * functions — and it means arguing, in review, for a fourth email to the same
 * 1,549 people against a cap of three marketing sends a month.
 */
export interface Stage {
  name: StageName;
  /** One line for `--list-stages` and for the report header. */
  purpose: string;
  /**
   * Earliest this stage makes sense, as days before the event. `null` = no
   * upper limit; a date can be held months out.
   */
  maxDaysUntil: number | null;
  /** Latest this stage makes sense, as days before the event. */
  minDaysUntil: number;
  /** Default button label. `--cta` still overrides it. */
  cta: string;
  /**
   * Which URL the button carries. A save-the-date points at the event page on
   * purpose: at six weeks out the Humanitix page usually does not exist yet
   * (SOP: the ticket page goes live at T-4w), and the page is the one link that
   * is correct at every point in the campaign.
   */
  ctaTarget: CtaTarget;
  /** Whether the speaker line-up is revealed. It is this campaign's one scoop. */
  includeSpeakers: boolean;
  /** Whether the event record's `shortDescription` is carried. */
  includeDescription: boolean;
  /**
   * Whether the When/Where table comes before the prose. The last call is read
   * by people who already decided; what they still need is the logistics.
   */
  detailsFirst: boolean;
  /** Prefix applied to the default subject. Empty means "the title alone". */
  subjectPrefix: string;
  /** Builds the default preview text from facts the record already carries. */
  preheader: (facts: StageFacts) => string | null;
  /** Lines added to "Left out on purpose", explaining the stage's silences. */
  omissions: string[];
}

/** The few resolved facts a stage's preheader is allowed to use. */
export interface StageFacts {
  /** "Thursday 3 September 2026, 6:00pm – 8:30pm" or just the date. */
  when: string | null;
  /** The same day without the hours: "Thursday 3 September 2026". */
  dayOnly: string | null;
  /** Venue name, else city, else null. */
  place: string | null;
  /** Weekday name of the event, for "This Thursday". */
  weekday: string | null;
  daysUntil: number;
}

/** Joins the non-empty parts of a preheader with the house separator. */
function preheaderParts(parts: (string | null)[]): string | null {
  const kept = parts.filter((part): part is string => Boolean(part));
  return kept.length > 0 ? `${kept.join(" · ")}.` : null;
}

/**
 * The stage table.
 *
 * The windows are the lifecycle SOP's own beat (`docs/development/
 * EVENT_LIFECYCLE_SOP.md` §7), not invented: the event page is live at T-6w,
 * the ticket page and the speaker campaign start at T-4w, the mailing-list
 * announcement sits at T-3w, and the last ten days are when an event actually
 * fills. They overlap because "nothing in the pipeline requires eight weeks" —
 * an event booked three weeks out skips the save-the-date rather than being
 * refused everything.
 */
export const STAGES: Record<StageName, Stage> = {
  "save-the-date": {
    name: "save-the-date",
    purpose: "T-6w → T-2w · the date exists and it is worth holding",
    maxDaysUntil: null,
    minDaysUntil: 14,
    cta: "See the details",
    // Deliberately the event page: tickets are usually not on sale yet.
    ctaTarget: "event-page",
    includeSpeakers: false,
    includeDescription: true,
    detailsFirst: false,
    subjectPrefix: "Save the date: ",
    // The day, not the hour. At six weeks out the start time is the fact most
    // likely to move, and a diary entry does not need it.
    preheader: (facts) => preheaderParts([facts.dayOnly ?? facts.when, facts.place]),
    omissions: [
      "the speaker line-up — it is the line-up stage's news, and at this range " +
        "the record's speakers are usually still being confirmed",
    ],
  },
  "line-up": {
    name: "line-up",
    purpose: "T-4w → T-1w · who is speaking, and the button that sells the ticket",
    maxDaysUntil: 42,
    minDaysUntil: 5,
    cta: "Register",
    ctaTarget: "registration",
    includeSpeakers: true,
    includeDescription: true,
    detailsFirst: false,
    subjectPrefix: "",
    preheader: (facts) => preheaderParts([facts.when, facts.place]),
    omissions: [],
  },
  "last-call": {
    name: "last-call",
    purpose: "T-10d → the day · the logistics, for people who have already decided",
    maxDaysUntil: 10,
    minDaysUntil: 0,
    cta: "Book your seat",
    ctaTarget: "registration",
    includeSpeakers: true,
    includeDescription: false,
    detailsFirst: true,
    subjectPrefix: "Last call: ",
    // "This Thursday" is derived from the record's own date, never asserted:
    // inside a week the weekday is unambiguous, outside it it is not.
    preheader: (facts) =>
      preheaderParts([
        facts.daysUntil <= 6 && facts.weekday ? `This ${facts.weekday}` : facts.when,
        facts.place,
      ]),
    omissions: [
      "the full description — this is the third time these readers have seen " +
        "this event, so the last call carries the logistics and nothing else",
    ],
  },
};

/** Stage names in campaign order, for messages and `--list-stages`. */
export const STAGE_ORDER: readonly StageName[] = [
  "save-the-date",
  "line-up",
  "last-call",
];

/**
 * The stage a bare invocation gets.
 *
 * `line-up` because it is the one mailing-list send the SOP already describes
 * (T-3w, "the announcement to the mailing list"), so a caller who has never
 * heard of stages gets exactly what this script produced before they existed.
 */
export const DEFAULT_STAGE: StageName = "line-up";

/** Narrows a raw `--stage` value, or returns null. */
export function parseStageName(raw: string): StageName | null {
  const normalised = raw.trim().toLowerCase();
  return STAGE_ORDER.find((name) => name === normalised) ?? null;
}

export interface StageWindowVerdict {
  ok: boolean;
  /** "too-early" · "too-late" · null when it fits. */
  problem: "too-early" | "too-late" | null;
  /** The stage that does fit this distance, when one does. */
  suggestion: StageName | null;
  /** Human-readable refusal, empty when `ok`. */
  lines: string[];
}

/**
 * Decides whether a stage belongs at this distance from the event.
 *
 * This is the guard the ledger cannot provide. The ledger knows a stage has not
 * been sent yet; only the event date knows that a "last call" three weeks out is
 * not a last call, and that a "save the date" the day before is a sentence with
 * no meaning. Both are un-recallable once sent, so this refuses in the same
 * shape {@link EXIT_PAST} does — an exit code with an escape hatch named in the
 * message, not a warning nobody reads.
 *
 * @param stage The stage being built.
 * @param daysUntil The resolver's countdown; negative means the event is past.
 * @returns A verdict carrying the refusal text when it does not fit.
 */
export function assessStageWindow(
  stage: StageName,
  daysUntil: number
): StageWindowVerdict {
  const spec = STAGES[stage];
  const fits = (candidate: StageName): boolean => {
    const other = STAGES[candidate];
    return (
      daysUntil >= other.minDaysUntil &&
      (other.maxDaysUntil === null || daysUntil <= other.maxDaysUntil)
    );
  };

  // A past event is EXIT_PAST's business, not this guard's. Saying nothing here
  // keeps one refusal per problem: two refusals for one mistake teaches nobody
  // which rule they actually broke.
  if (!Number.isFinite(daysUntil) || daysUntil < 0) {
    return { ok: true, problem: null, suggestion: null, lines: [] };
  }

  const tooEarly = spec.maxDaysUntil !== null && daysUntil > spec.maxDaysUntil;
  const tooLate = daysUntil < spec.minDaysUntil;
  if (!tooEarly && !tooLate) {
    return { ok: true, problem: null, suggestion: null, lines: [] };
  }

  const suggestion = STAGE_ORDER.find(fits) ?? null;
  const lines: string[] = [];
  if (tooEarly) {
    lines.push(
      `Refusing: "${stage}" belongs in the last ${spec.maxDaysUntil} day(s) before ` +
        `the event, and this one is ${daysUntil} day(s) away.`
    );
    lines.push(
      "  Sent this early it makes a claim about time that is not true yet, and the " +
        "real one, when it comes, reads as a repeat of this."
    );
  } else {
    lines.push(
      `Refusing: "${stage}" belongs at least ${spec.minDaysUntil} day(s) before the ` +
        `event, and this one is ${daysUntil} day(s) away.`
    );
    lines.push(
      "  The stage names a moment in the campaign. Sent at the wrong one it is not " +
        "late — it is untrue."
    );
  }
  lines.push("");
  lines.push(
    suggestion
      ? `At ${daysUntil} days out the stage that fits is:  --stage ${suggestion}`
      : "No stage fits this distance. Check the event date, or use " +
        "/email-the-community for a message the campaign has no shape for."
  );
  return { ok: false, problem: tooEarly ? "too-early" : "too-late", suggestion, lines };
}

/** The broadcast-ledger key one stage of one event's campaign is filed under. */
export function stageKey(slug: string, stage: StageName): string {
  return `announce-${slug}-${stage}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Where `/email-the-community` keeps what it has broadcast. */
const COMMUNITY_LEDGER = [
  ".claude",
  "skills",
  "email-the-community",
  "state",
  "broadcasts.json",
];

/**
 * What the ledger already knows about this event's campaign.
 *
 * ADVISORY ONLY, and deliberately so. `/email-the-community` Step 7.1 owns the
 * duplicate refusal and holds the html hash this script has not computed yet;
 * repeating that decision here would put two answers to one question in two
 * files. What this adds is the thing a single-stage tool never had to show —
 * where in the campaign we are — printed so the operator sees that the line-up
 * went out before they build the last call.
 *
 * A missing or corrupt ledger yields an empty map rather than throwing: this is
 * a printed line, and a spec generator that cannot run because another skill's
 * state file is absent would be a worse tool than one that says nothing.
 *
 * @param slug The event whose stages are wanted.
 * @returns Stage → recorded status, for the stages that have an entry.
 */
function campaignSoFar(slug: string): Partial<Record<StageName, string>> {
  const path = resolvePath(process.cwd(), ...COMMUNITY_LEDGER);
  if (!existsSync(path)) return {};
  let broadcasts: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
    const raw =
      parsed && typeof parsed === "object" && "broadcasts" in parsed
        ? (parsed as { broadcasts?: unknown }).broadcasts
        : null;
    if (!raw || typeof raw !== "object") return {};
    broadcasts = raw as Record<string, unknown>;
  } catch {
    return {};
  }

  const found: Partial<Record<StageName, string>> = {};
  for (const stage of STAGE_ORDER) {
    const entry = broadcasts[stageKey(slug, stage)];
    if (!entry || typeof entry !== "object") continue;
    const status = (entry as { status?: unknown }).status;
    found[stage] = typeof status === "string" ? status : "recorded";
  }
  return found;
}

// ---------------------------------------------------------------------------
// Cover discovery
// ---------------------------------------------------------------------------

/**
 * Artwork stems worth using as an email cover, best first.
 *
 * The shape rule is why anything 2:1 leads: the announcement template renders
 * the cover at the container's full width with `height="auto"`, so a 2:1 banner
 * lands as a 600x300 slab, while the 4:5 feed post is 600x750 and pushes the
 * date, the venue and the button below the first screen. Speaker files are
 * excluded by construction — none of them begins with a stem listed here.
 *
 * `email` beats `humanitix` even though they are the same composition, because
 * the ticketing banner is drawn 3200px wide for a page that displays it that
 * large. Here it is 400 kB to fill a 600px slot, on whatever data plan the
 * reader is on, and no gate would ever say so: `size-100kb` measures the
 * rendered HTML, and a linked image is not in it. `build-event-poster.ts
 * --only email` writes the same artwork at 1200x600.
 */
const COVER_STEMS = [
  "email",
  "humanitix",
  "social",
  "lineup-social",
  "square",
  "poster",
  "cover",
];

/** Formats every major client can decode. `.webp` is a broken box in Outlook. */
const COVER_EXTENSIONS = ["jpg", "jpeg", "png"];

interface CoverChoice {
  /** Absolute https URL on the canonical origin. */
  url: string;
  alt: string;
  /** The file that was chosen, for the summary. */
  file: string;
}

/** Escapes a literal string for use inside a RegExp. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, (match) => `\\${match}`);
}

/**
 * Picks the best inbox-safe cover file sitting in an event's asset folder.
 *
 * Only the filesystem is consulted, never the event record's `coverImage.url` —
 * that field points at the WebP the website uses, and emitting it would fail the
 * `image-format` gate. Returning `null` is a normal outcome, not an error: an
 * event with WebP-only artwork gets no cover and a printed reason.
 *
 * @param slug The event slug, which is also its asset directory name.
 * @param origin Canonical origin the URL is built on.
 * @param alt Alt text taken from the event record.
 * @returns The chosen cover, or null when the folder holds no JPEG or PNG.
 */
function findCover(slug: string, origin: string, alt: string): CoverChoice | null {
  const dir = resolvePath(process.cwd(), "public", "img", "events", slug);
  if (!existsSync(dir)) return null;

  const files = readdirSync(dir);
  for (const stem of COVER_STEMS) {
    const pattern = new RegExp(
      `^${escapeRegExp(stem)}(?:-v(\\d+))?\\.(${COVER_EXTENSIONS.join("|")})$`,
      "i"
    );
    const matches: { file: string; version: number }[] = [];
    for (const file of files) {
      const match = pattern.exec(file);
      if (match) matches.push({ file, version: match[1] ? Number(match[1]) : 1 });
    }
    if (matches.length === 0) continue;
    // Highest -vN wins: a v2 exists precisely because v1 was superseded.
    matches.sort((a, b) => b.version - a.version || a.file.localeCompare(b.file));
    const chosen = matches[0].file;
    return { url: `${origin}/img/events/${slug}/${chosen}`, alt, file: chosen };
  }
  return null;
}

/** True when the folder holds WebP artwork but nothing an email client can show. */
function hasWebpOnly(slug: string): boolean {
  const dir = resolvePath(process.cwd(), "public", "img", "events", slug);
  if (!existsSync(dir)) return false;
  return readdirSync(dir).some((file) => /\.webp$/i.test(file));
}

// ---------------------------------------------------------------------------
// Redaction
// ---------------------------------------------------------------------------

interface RedactedUrl {
  url: string;
  /** Parameter NAMES only — the values are what must never be written down. */
  removed: string[];
}

/**
 * Strips access/promo/discount-shaped query parameters from a public link.
 *
 * The parameter names are kept for the report and the values are dropped on the
 * floor: printing `accesscode=…` into a terminal, a log or a spec file recreates
 * exactly the leak this function exists to prevent.
 *
 * @param raw The registration URL from the event record.
 * @returns The public base URL, and the names of whatever was removed.
 */
export function redactUrl(raw: string): RedactedUrl {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { url: raw, removed: [] };
  }

  const removed: string[] = [];
  for (const name of [...parsed.searchParams.keys()]) {
    if (!SECRET_PARAM.test(name)) continue;
    removed.push(name);
    parsed.searchParams.delete(name);
  }

  // A bare trailing "?" left behind by the deletions reads as a broken link.
  let url = parsed.toString();
  if (parsed.searchParams.toString().length === 0) url = url.replace(/\?$/, "");
  return { url, removed };
}

/**
 * Flags uppercase tokens sitting next to a code word anywhere in the copy.
 *
 * The gates run this same shape at render time, but a code caught here is caught
 * before it is ever written to a file, which is the difference between a warning
 * and an artefact on disk.
 *
 * @param haystack Every string the spec will carry, concatenated.
 * @returns One line per suspicious token.
 */
function scanCopyForCodes(haystack: string): string[] {
  const found: string[] = [];
  const seen = new Set<string>();
  const keywordRe = new RegExp(`\\b(${CODE_KEYWORDS.join("|")})\\b`, "gi");
  const tokenRe = /\b[A-Z0-9]{6,12}\b/g;
  let keyword: RegExpExecArray | null;
  while ((keyword = keywordRe.exec(haystack)) !== null) {
    const window = haystack.slice(
      Math.max(0, keyword.index - 60),
      keyword.index + 60
    );
    tokenRe.lastIndex = 0;
    let token: RegExpExecArray | null;
    while ((token = tokenRe.exec(window)) !== null) {
      const value = token[0];
      if (CODE_KEYWORDS.includes(value.toLowerCase())) continue;
      if (seen.has(value)) continue;
      seen.add(value);
      found.push(`code-shaped token "${value}" near "${keyword[0]}" in the copy`);
    }
  }
  return found;
}

// ---------------------------------------------------------------------------
// Copy
// ---------------------------------------------------------------------------

/**
 * Formats a `YYYY-MM-DD` as "Thursday 3 September 2026".
 *
 * Built from the local calendar fields the resolver already normalised, never
 * from `toISOString()`: UTC-formatting a locally-constructed Date is how this
 * repo has previously shifted a published date by a day.
 *
 * @param dateOnly The resolver's `dateOnly`, or null.
 * @returns The long form, or null when the record has no parseable date.
 */
function longDate(dateOnly: string | null): string | null {
  if (!dateOnly) return null;
  const [year, month, day] = dateOnly.split("-").map(Number);
  if (!year || !month || !day) return null;
  const local = new Date(year, month - 1, day);
  return `${WEEKDAYS[local.getDay()]} ${day} ${MONTHS[month - 1]} ${year}`;
}

/** Trims to a word boundary and marks the cut, for a subject that must fit. */
function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  const cut = value.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

/** Every speaker name across every group on the event record. */
function speakerNames(raw: EventV3): string[] {
  const groups = Object.values(raw.detailPageData.speakers ?? {});
  return groups
    .flatMap((group) => group?.speakers ?? [])
    .map((speaker) => speaker.name?.trim())
    .filter((name): name is string => Boolean(name));
}

/** Named partners from the event's main sponsor slot. */
function partnerNames(raw: EventV3): string[] {
  return (raw.detailPageData.sponsors?.main ?? [])
    .map((sponsor) => sponsor.name?.trim())
    .filter((name): name is string => Boolean(name));
}

/** Joins names as "A, B and C" — house style for a line of people. */
function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

interface BuildOptions {
  stage: StageName;
  strapline: string | null;
  subject: string | null;
  preheader: string | null;
  cta: string | null;
}

interface BuiltSpec {
  spec: MessageSpec;
  cover: CoverChoice | null;
  coverNote: string | null;
  ctaUrl: string;
  /** True when the button points at the event page for want of anything better. */
  ctaIsFallback: boolean;
  /** True when the button points at the event page because the STAGE says so. */
  ctaIsByDesign: boolean;
  redactions: string[];
  omissions: string[];
  when: string | null;
  where: string | null;
}

/**
 * Assembles one stage of the campaign from one resolved event.
 *
 * Short on purpose. The email's job is to make someone click through, and the
 * event page already carries the bios, the agenda and the full description —
 * duplicating them here spends kilobytes against the 100KB Gmail clip budget,
 * and blowing that budget is what hides the unsubscribe link.
 *
 * What varies with the stage — which facts lead, which are withheld, where the
 * button points, what the subject claims — is read from {@link STAGES} rather
 * than branched on here, so no stage can quietly acquire a difference the table
 * does not admit to.
 *
 * @param event The resolved event, with local-safe dates.
 * @param raw The same event's record, for the fields the resolver does not flatten.
 * @param options Author overrides from the CLI, and the stage being built.
 * @returns The validated spec plus everything the summary needs to report.
 */
function build(
  event: ResolvedEvent,
  raw: EventV3,
  options: BuildOptions
): BuiltSpec {
  const origin = new URL(event.eventPageUrl).origin;
  const identity = getSenderIdentity("marketing");
  const stage = STAGES[options.stage];

  // --- CTA -----------------------------------------------------------------
  const redactions: string[] = [];
  let ctaUrl = event.eventPageUrl;
  let ctaIsFallback = true;
  if (event.registrationUrl && stage.ctaTarget === "registration") {
    const redacted = redactUrl(event.registrationUrl);
    ctaUrl = redacted.url;
    ctaIsFallback = false;
    if (redacted.removed.length > 0) {
      redactions.push(
        `stripped ${redacted.removed.length} query parameter(s) from the ` +
          `registration URL — ${redacted.removed.join(", ")} (values withheld ` +
          `on purpose; they are never printed or written to the spec)`
      );
    }
  }

  // --- facts ---------------------------------------------------------------
  const dateLabel = longDate(event.dateOnly) ?? event.date;
  const when = event.time ? `${dateLabel}, ${event.time}` : dateLabel;
  const weekday = longDate(event.dateOnly)?.split(" ")[0] ?? null;

  let where: string | null = event.locationLabel;
  if (where && event.format === "hybrid") where = `${where}, and online`;
  if (!where && event.format === "online") where = "Online";

  const rows: { label: string; value: string }[] = [];
  if (when) rows.push({ label: "When", value: when });
  if (where) rows.push({ label: "Where", value: where });

  const speakers = speakerNames(raw);
  if (stage.includeSpeakers) {
    if (speakers.length > 0 && speakers.length <= 4) {
      rows.push({ label: "Speaking", value: joinNames(speakers) });
    } else if (speakers.length > 4) {
      rows.push({
        label: "Speaking",
        value: `${speakers.length} speakers — the full line-up is on the event page`,
      });
    }
  }

  const partners = partnerNames(raw);
  if (stage.includeSpeakers && partners.length > 0) {
    rows.push({ label: "With", value: joinNames(partners) });
  }

  // --- blocks --------------------------------------------------------------
  // The heading always leads — an email that opens on a bare table reads as a
  // receipt. What moves is everything after it.
  const heading: Block[] = event.subtitle
    ? [{ type: "heading", text: event.subtitle }]
    : [];
  const prose: Block[] = [];
  if (options.strapline) {
    prose.push({ type: "paragraph", text: options.strapline });
  }
  if (stage.includeDescription && raw.shortDescription?.trim()) {
    prose.push({ type: "paragraph", text: raw.shortDescription.trim() });
  }
  const details: Block[] = rows.length > 0 ? [{ type: "details", rows }] : [];

  // The last call puts the table above the prose: its readers have already
  // decided, and what they still need is when and where, not another pitch.
  const blocks: Block[] = stage.detailsFirst
    ? [...heading, ...details, ...prose]
    : [...heading, ...prose, ...details];

  // Exactly one button. A second CTA trips the `single-cta` warning and splits
  // the clicks between them, so the "read more" link goes inline below instead.
  blocks.push({ type: "button", text: options.cta ?? stage.cta, url: ctaUrl });

  blocks.push({
    type: "paragraph",
    text:
      `The full description, the line-up and the running order are on the ` +
      `[event page](${event.eventPageUrl}).\n\nNgā mihi,\nThe She Sharp team`,
  });

  // --- subject and preheader ----------------------------------------------
  const omissions: string[] = [];
  let subject = options.subject;
  if (!subject) {
    // The prefix is what makes three subjects to the same people read as three
    // messages rather than one sent three times, so it is kept and the NAME is
    // shortened around it — never the other way round.
    const budget = SUBJECT_MAX - stage.subjectPrefix.length;
    const candidates = [event.title, event.subtitle].filter(
      (value): value is string => Boolean(value)
    );
    const fits = candidates.find((value) => value.length <= budget);
    if (fits) {
      subject = `${stage.subjectPrefix}${fits}`;
      if (fits !== event.title) {
        omissions.push(
          `subject fell back to the subtitle — the title is ${event.title.length} ` +
            `chars and truncates on a phone. Override with --subject.`
        );
      }
    } else {
      subject = `${stage.subjectPrefix}${truncate(candidates[0] ?? event.title, budget)}`;
      omissions.push(
        `subject was truncated to ${SUBJECT_MAX} chars. Write a shorter one with --subject.`
      );
    }
  }

  // The preheader is the second hook beside the subject, so it carries the facts
  // the subject cannot: when, and where. Never an echo of the subject, and each
  // stage frames it differently — see STAGES.
  let preheader = options.preheader;
  if (!preheader) {
    preheader = stage.preheader({
      when,
      dayOnly: dateLabel,
      place: event.venueName ?? event.city,
      weekday,
      daysUntil: event.daysUntil,
    });
  }
  if (preheader && preheader.length > PREHEADER_MAX) {
    preheader = truncate(preheader, PREHEADER_MAX);
  }

  // --- cover ---------------------------------------------------------------
  const coverAlt =
    raw.coverImage?.alt?.trim() ||
    raw.detailPageData.posters?.[0]?.alt?.trim() ||
    `${event.title} — She Sharp event artwork`;
  const cover = findCover(event.slug, origin, coverAlt);
  let coverNote: string | null = null;
  if (!cover) {
    const reason = hasWebpOnly(event.slug)
      ? `its poster artwork is WebP only, and Outlook renders WebP as a ` +
        `broken-image box (the image-format gate fails on it)`
      : `it holds no poster artwork in an email-safe format`;
    coverNote =
      `no cover: public/img/events/${event.slug}/ — ${reason}. Produce a JPEG ` +
      `with: npx tsx scripts/events/build-event-poster.ts ${event.slug} --only email`;
    omissions.push(coverNote);
  }

  // Stage-aware, so the ledger records three campaign touches separately and its
  // `no-op` verdict still stops the SAME stage being sent twice.
  const key = stageKey(event.slug, options.stage);

  const draft: MessageSpec = {
    key,
    // `react` is the branded announcement design. Both engines now carry an
    // opt-out — `compose.tsx` adds one to any marketing message that lacks it,
    // and the batch builders substitute a signed per-recipient URL — so this is
    // a design choice rather than the only option it used to be.
    engine: "react",
    // Makes the gates strict, and makes render-message.ts print the two-step
    // batch route rather than a single-recipient send command.
    category: "marketing",
    from: identity.from,
    replyTo: identity.replyTo,
    subject,
    ...(preheader ? { preheader } : {}),
    title: event.detailTitle ?? event.title,
    blocks,
    ...(cover ? { cover: { url: cover.url, alt: cover.alt } } : {}),
  };

  // Copy-level scan, on top of the URL redaction above.
  const haystack = [
    draft.subject,
    draft.preheader ?? "",
    draft.title,
    ...blocks.map((block) => {
      if (block.type === "details") {
        return block.rows.map((row) => `${row.label}: ${row.value}`).join("\n");
      }
      if ("text" in block) return block.text;
      if ("html" in block) return block.html;
      return "";
    }),
  ].join("\n");
  redactions.push(...scanCopyForCodes(haystack));

  omissions.push(
    "the speaker bios and the agenda — they live on the event page"
  );
  omissions.push(...stage.omissions);
  if (stage.ctaTarget === "event-page" && event.registrationUrl) {
    omissions.push(
      "the registration link, even though the record has one — a save-the-date " +
        "asks for a diary entry, and the line-up stage is where the ticket is sold"
    );
  }

  return {
    // Validating here means the generator can never leave an unrenderable file
    // on disk: a bad spec is an exception now, not a confusing failure later.
    spec: parseMessageSpec(draft),
    cover,
    coverNote,
    ctaUrl,
    // A stage that chose the event page has not fallen back to anything.
    ctaIsFallback: ctaIsFallback && stage.ctaTarget === "registration",
    ctaIsByDesign: stage.ctaTarget === "event-page",
    redactions,
    omissions,
    when,
    where,
  };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

interface Args {
  query: string | null;
  stage: string | null;
  strapline: string | null;
  subject: string | null;
  preheader: string | null;
  cta: string | null;
  out: string | null;
  allowPast: boolean;
  listStages: boolean;
  json: boolean;
  help: boolean;
}

const USAGE = [
  "Usage: npx tsx scripts/email/event-announcement-spec.ts (--slug <slug> | <fuzzy words>)",
  '         [--stage <name>] [--strapline "<text>"] [--subject "<text>"]',
  '         [--preheader "<text>"] [--cta "<text>"] [--allow-past] [--out <path>]',
  "         [--list-stages] [--json] [--help]",
  "",
  "Writes ONE STAGE of an event's campaign as a marketing MessageSpec, to",
  "tmp/specs/announce-<slug>-<stage>.json. Sends nothing. Render and gate it next",
  "with scripts/email/render-message.ts.",
  "",
  "  --slug <slug>        Exact event slug.",
  "  <fuzzy words>        Any words from the title, venue or city instead.",
  `  --stage <name>       ${STAGE_ORDER.join(" | ")}   (default: ${DEFAULT_STAGE})`,
  "  --list-stages        Print what each stage says, and when it may be sent.",
  "  --strapline <text>   One framing sentence above the description.",
  "  --subject <text>     Override the subject (default: the stage's, max 50 chars).",
  "  --preheader <text>   Override the preview text (default: the stage's, max 120).",
  "  --cta <text>         Override the button label (default: the stage's).",
  "  --allow-past         Build for an event that has already happened.",
  "  --out <path>         Where to write the spec.",
  "  --json               Machine-readable report on stdout.",
  "",
  "Exit codes: 0 resolved · 1 no match · 2 ambiguous · 3 refused (event is past)",
  "            · 4 refused (stage does not belong this far from the event).",
].join("\n");

/** Prints the stage table — the whole campaign shape, on one screen. */
function printStages(): void {
  console.error("");
  console.error("Campaign stages");
  console.error("===================================");
  for (const name of STAGE_ORDER) {
    const stage = STAGES[name];
    const window =
      stage.maxDaysUntil === null
        ? `${stage.minDaysUntil}+ days out`
        : `${stage.minDaysUntil}–${stage.maxDaysUntil} days out`;
    console.error("");
    console.error(`  --stage ${name}${name === DEFAULT_STAGE ? "   (default)" : ""}`);
    console.error(`      ${stage.purpose}`);
    console.error(`      may be sent   ${window}`);
    console.error(`      subject       ${stage.subjectPrefix}<event title>`);
    console.error(
      `      button        "${stage.cta}" → ${
        stage.ctaTarget === "registration" ? "the registration link" : "the event page"
      }`
    );
    console.error(
      `      speakers      ${stage.includeSpeakers ? "named" : "held back"}` +
        `   ·   description ${stage.includeDescription ? "included" : "dropped"}`
    );
  }
  console.error("");
  console.error("Each stage is a separate ledger key, so one stage cannot be sent twice");
  console.error("and three stages do not look like one send repeated.");
  console.error("");
}

/**
 * Parses argv into a fully defaulted {@link Args}.
 *
 * @param argv `process.argv.slice(2)`.
 * @returns The parsed arguments.
 * @throws Error with the usage line when a flag is missing its value.
 */
function parseArgs(argv: string[]): Args {
  const positional: string[] = [];
  let slug: string | null = null;
  let stage: string | null = null;
  let listStages = false;
  let strapline: string | null = null;
  let subject: string | null = null;
  let preheader: string | null = null;
  let cta: string | null = null;
  let out: string | null = null;
  let allowPast = false;
  let json = false;
  let help = false;

  const value = (flag: string, next: string | undefined): string => {
    if (!next || next.startsWith("--")) {
      throw new Error(`${flag} requires a value.\n\n${USAGE}`);
    }
    return next;
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    switch (arg) {
      case "--slug":
        slug = value("--slug", argv[++index]);
        break;
      case "--stage":
        stage = value("--stage", argv[++index]);
        break;
      case "--list-stages":
        listStages = true;
        break;
      case "--strapline":
        strapline = value("--strapline", argv[++index]);
        break;
      case "--subject":
        subject = value("--subject", argv[++index]);
        break;
      case "--preheader":
        preheader = value("--preheader", argv[++index]);
        break;
      case "--cta":
        cta = value("--cta", argv[++index]);
        break;
      case "--out":
        out = value("--out", argv[++index]);
        break;
      case "--allow-past":
        allowPast = true;
        break;
      case "--json":
        json = true;
        break;
      case "--help":
      case "-h":
        help = true;
        break;
      default:
        if (arg.startsWith("--")) throw new Error(`Unknown flag: ${arg}\n\n${USAGE}`);
        positional.push(arg);
    }
  }

  return {
    query: slug ?? (positional.length > 0 ? positional.join(" ") : null),
    stage,
    strapline,
    subject,
    preheader,
    cta,
    out,
    allowPast,
    listStages,
    json,
    help,
  };
}

/** Prints the resolver's near-misses the way the resolver itself does. */
function printCandidates(query: string, candidates: ResolveCandidate[]): void {
  console.error(`"${query}" matched ${candidates.length} events. Name one:`);
  console.error("");
  for (const candidate of candidates) {
    console.error(`  ${candidate.event.slug}`);
    console.error(`      ${candidate.event.title} — ${candidate.event.date}`);
  }
  console.error("");
  console.error("Re-run with --slug <slug>.");
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.listStages) {
    printStages();
    process.exit(0);
  }

  if (args.help || !args.query) {
    console.error(USAGE);
    process.exit(args.help ? 0 : EXIT_NO_MATCH);
  }

  const stageName = args.stage ? parseStageName(args.stage) : DEFAULT_STAGE;
  if (!stageName) {
    console.error(`Unknown stage: "${args.stage}".`);
    console.error("");
    console.error(`Stages are: ${STAGE_ORDER.join(", ")}.`);
    console.error("See what each one says:  --list-stages");
    process.exit(EXIT_NO_MATCH);
  }

  const events = getAllEvents();
  const outcome = resolveEventByQuery(args.query, events);

  if (outcome.mode === "no-match") {
    console.error(`No event matched "${outcome.query}".`);
    console.error("");
    console.error("Browse what exists:  npx tsx scripts/events/resolve-event.ts --list");
    console.error("Not there? The event is not in the repo yet — run /sync-event-from-slack.");
    process.exit(EXIT_NO_MATCH);
  }

  if (outcome.mode === "ambiguous") {
    printCandidates(outcome.query, outcome.candidates);
    process.exit(EXIT_AMBIGUOUS);
  }

  const event = outcome.event;
  const raw = events.find((candidate) => candidate.slug === event.slug);
  if (!raw) {
    throw new Error(`Resolved ${event.slug} but could not read its record back.`);
  }

  // An announcement is a forward-looking artefact: its one button points at a
  // registration page that has closed, and a broadcast about a finished event is
  // both un-actionable and un-recallable. The resolver's recency bonus makes a
  // vague query land on an old event easily, so this is a refusal with an escape
  // hatch rather than a warning nobody reads.
  if (Number.isFinite(event.daysUntil) && event.daysUntil < 0 && !args.allowPast) {
    const ago = Math.abs(event.daysUntil);
    console.error(`Refusing: "${event.title}" was ${ago} day(s) ago (${event.date}).`);
    console.error("");
    console.error("An announcement promotes an event people can still come to. Its button");
    console.error("points at a registration page that has closed, and a broadcast cannot be");
    console.error("recalled. For a past event you almost certainly want one of:");
    console.error("  · Humanitix -> Email campaigns — thank-you + feedback to the people who");
    console.error("    came. Not from this repo, and only within 14 days of the event ending");
    console.error("  · /email-the-community — a free-form announcement, written by hand");
    console.error("");
    console.error("Genuinely meant it (a recap, a re-run)? Re-run with --allow-past.");
    process.exit(EXIT_PAST);
  }

  // The stage guard the ledger cannot give: a "last call" three weeks out and a
  // "save the date" the day before are both un-recallable once sent, and both
  // look perfectly fine to a duplicate check. No --allow-past-style escape hatch
  // here on purpose — the fix is naming the stage that fits, which the refusal
  // prints, not overriding a claim the email would still be making.
  const window = assessStageWindow(stageName, event.daysUntil);
  if (!window.ok) {
    for (const line of window.lines) console.error(line);
    console.error("");
    console.error(`  event    ${event.title}  (${event.slug})`);
    console.error(`  date     ${event.date}`);
    console.error("");
    console.error("See what each stage says:  --list-stages");
    process.exit(EXIT_STAGE_WINDOW);
  }

  const built = build(event, raw, {
    stage: stageName,
    strapline: args.strapline,
    subject: args.subject,
    preheader: args.preheader,
    cta: args.cta,
  });

  const displayOut = args.out ?? `tmp/specs/announce-${event.slug}-${stageName}.json`;
  const outPath = resolvePath(process.cwd(), displayOut);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(built.spec, null, 2)}\n`, "utf8");

  const nextCommand = `npx tsx scripts/email/render-message.ts ${displayOut} --mode broadcast`;

  // Everything human goes to stderr: stdout belongs to --json so the report can
  // be piped without the summary contaminating it.
  const line = (label: string, text: string): void =>
    console.error(`  ${label.padEnd(11)}${text}`);
  const button = built.spec.blocks.find((block) => block.type === "button");

  const stage = STAGES[stageName];
  const priorStages = campaignSoFar(event.slug);

  console.error("");
  console.error("Event announcement spec");
  console.error("===================================");
  line("Event", `${event.title}  (${event.slug})`);
  line(
    "Matched",
    outcome.match === "exact-slug" ? "exact slug" : `fuzzy — ${outcome.hits.join(" + ")}`
  );
  line("Stage", `${stageName} — ${stage.purpose}`);
  line("Key", `${built.spec.key}  (the ledger key: one per stage)`);
  if (built.when) line("When", `${built.when}  (in ${event.daysUntil} days)`);
  if (built.where) line("Where", built.where);
  line("Subject", `${built.spec.subject}  (${built.spec.subject.length} chars)`);
  line(
    "Preheader",
    built.spec.preheader
      ? `${built.spec.preheader}  (${built.spec.preheader.length} chars)`
      : "— none"
  );
  line("From", built.spec.from);
  line("Reply-To", built.spec.replyTo ?? "—");
  line("Engine", "react / marketing — the only pair that emits the unsubscribe tag");
  line("CTA", `${button?.type === "button" ? button.text : "?"} → ${built.ctaUrl}`);
  line("Cover", built.cover ? built.cover.url : "— none (see below)");
  line("Blocks", built.spec.blocks.map((block) => block.type).join(", "));
  line("Spec", displayOut);
  console.error("===================================");
  console.error("");

  console.error(
    built.redactions.length === 0
      ? "Redactions: none"
      : `Redactions: ${built.redactions.length} — declare these on the plan block`
  );
  for (const redaction of built.redactions) console.error(`  · ${redaction}`);
  console.error("");

  if (built.ctaIsFallback) {
    console.error("Note: the event record has no registrationUrl, so the button points at the");
    console.error("event page instead. Add the ticketing link to the record if there is one.");
    console.error("");
  }

  console.error("Campaign so far (from /email-the-community's ledger — advisory):");
  for (const name of STAGE_ORDER) {
    const status = priorStages[name];
    const marker = name === stageName ? "→" : " ";
    console.error(
      `  ${marker} ${name.padEnd(14)}${status ? status : "not recorded"}` +
        `${name === stageName ? "   ← building this one" : ""}`
    );
  }
  if (priorStages[stageName]) {
    console.error("");
    console.error(
      `  This stage is ALREADY on the ledger as "${priorStages[stageName]}". Step 7.1 of`
    );
    console.error("  /email-the-community is the gate; if it says no-op, stop there.");
  }
  console.error("");

  console.error("Left out on purpose:");
  for (const omission of built.omissions) console.error(`  · ${omission}`);
  console.error("");
  console.error("Next — render it and run the gates:");
  console.error(nextCommand);
  console.error("");

  if (args.json) {
    console.log(
      JSON.stringify(
        {
          slug: event.slug,
          title: event.title,
          match: outcome.match,
          daysUntil: event.daysUntil,
          stage: stageName,
          stagePurpose: stage.purpose,
          campaignSoFar: priorStages,
          specPath: outPath,
          key: built.spec.key,
          subject: built.spec.subject,
          preheader: built.spec.preheader ?? null,
          ctaUrl: built.ctaUrl,
          ctaIsFallback: built.ctaIsFallback,
          ctaIsByDesign: built.ctaIsByDesign,
          cover: built.cover,
          coverNote: built.coverNote,
          redactions: built.redactions,
          omissions: built.omissions,
          nextCommand,
        },
        null,
        2
      )
    );
  }
}

// Run only when this file IS the command, so `redactUrl` can be imported and
// exercised on its own. The redaction rule is the one piece of this script that
// cannot be checked by running it against repo data — no event record currently
// carries an access code, which is exactly the state this guard protects.
const invokedDirectly =
  process.argv[1] !== undefined &&
  resolvePath(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  void main().catch((error: unknown) => {
    console.error(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}
