/**
 * Turns one event record into a ready-to-render marketing `MessageSpec`.
 *
 * She Sharp had no way to tell its mailing list about an upcoming event.
 * `send-event-emails` refuses on purpose — its audience is registrants, who are
 * fulfilment-only and were never asked to receive promotion — and
 * `email-the-community` can send it, but knows nothing about events, so every
 * date, time, venue and link would be retyped by hand into a broadcast. Retyped
 * facts are exactly how an email comes to contradict the website.
 *
 * This script is the missing bridge and nothing more. It reads the repo's own
 * event record through `scripts/events/resolve-event.ts` — the same resolver the
 * stage emails and the posters use, so a date cannot drift between them — and
 * writes the JSON that `scripts/email/render-message.ts` renders and gates. It
 * sends nothing, talks to no network, and writes nothing outside `--out`.
 *
 * Usage:
 *   npx tsx scripts/email/event-announcement-spec.ts --slug <event-slug>
 *   npx tsx scripts/email/event-announcement-spec.ts "les mills panel"
 *
 *   --slug <slug>          Exact slug. Without it, the positional words are
 *                          fuzzy-matched by the shared resolver.
 *   --strapline "<text>"   One framing sentence, placed above the description.
 *                          It belongs on the artefact, not in the event record.
 *   --subject "<text>"     Override the default subject (the event title).
 *   --preheader "<text>"   Override the default preview text.
 *   --cta "<text>"         Override the button label (default "Register").
 *   --allow-past           Build for an event whose date has passed.
 *   --out <path>           Default tmp/specs/announce-<slug>.json
 *   --json                 Machine-readable report on stdout.
 *   --help
 *
 * Exit codes mirror the resolver so a caller can branch on them:
 *   0 resolved · 1 no match · 2 ambiguous · 3 refused (event already past)
 */

import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
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
// Cover discovery
// ---------------------------------------------------------------------------

/**
 * Artwork stems worth using as an email cover, best first.
 *
 * `humanitix` leads because the announcement template renders the cover at the
 * container's full width with `height="auto"`: a 2:1 ticketing banner lands as a
 * 600x300 slab, while the 4:5 feed post is 600x750 and pushes the date, the
 * venue and the button below the first screen. Speaker files are excluded by
 * construction — none of them begins with a stem listed here.
 */
const COVER_STEMS = [
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
  ctaIsFallback: boolean;
  redactions: string[];
  omissions: string[];
  when: string | null;
  where: string | null;
}

/**
 * Assembles the whole announcement from one resolved event.
 *
 * Short on purpose. The email's job is to make someone click through, and the
 * event page already carries the bios, the agenda and the full description —
 * duplicating them here spends kilobytes against the 100KB Gmail clip budget,
 * and blowing that budget is what hides the unsubscribe link.
 *
 * @param event The resolved event, with local-safe dates.
 * @param raw The same event's record, for the fields the resolver does not flatten.
 * @param options Author overrides from the CLI.
 * @returns The validated spec plus everything the summary needs to report.
 */
function build(
  event: ResolvedEvent,
  raw: EventV3,
  options: BuildOptions
): BuiltSpec {
  const origin = new URL(event.eventPageUrl).origin;
  const identity = getSenderIdentity("marketing");

  // --- CTA -----------------------------------------------------------------
  const redactions: string[] = [];
  let ctaUrl = event.eventPageUrl;
  let ctaIsFallback = true;
  if (event.registrationUrl) {
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

  let where: string | null = event.locationLabel;
  if (where && event.format === "hybrid") where = `${where}, and online`;
  if (!where && event.format === "online") where = "Online";

  const rows: { label: string; value: string }[] = [];
  if (when) rows.push({ label: "When", value: when });
  if (where) rows.push({ label: "Where", value: where });

  const speakers = speakerNames(raw);
  if (speakers.length > 0 && speakers.length <= 4) {
    rows.push({ label: "Speaking", value: joinNames(speakers) });
  } else if (speakers.length > 4) {
    rows.push({
      label: "Speaking",
      value: `${speakers.length} speakers — the full line-up is on the event page`,
    });
  }

  const partners = partnerNames(raw);
  if (partners.length > 0) {
    rows.push({ label: "With", value: joinNames(partners) });
  }

  // --- blocks --------------------------------------------------------------
  const blocks: Block[] = [];
  if (event.subtitle) blocks.push({ type: "heading", text: event.subtitle });
  if (options.strapline) {
    blocks.push({ type: "paragraph", text: options.strapline });
  }
  if (raw.shortDescription?.trim()) {
    blocks.push({ type: "paragraph", text: raw.shortDescription.trim() });
  }
  if (rows.length > 0) blocks.push({ type: "details", rows });

  // Exactly one button. A second CTA trips the `single-cta` warning and splits
  // the clicks between them, so the "read more" link goes inline below instead.
  blocks.push({ type: "button", text: options.cta ?? "Register", url: ctaUrl });

  blocks.push({
    type: "paragraph",
    text:
      `The full description, the line-up and the running order are on the ` +
      `[event page](${event.eventPageUrl}).\n\nNgā mihi,\nThe She Sharp team`,
  });

  // --- subject and preheader ----------------------------------------------
  const omissions: string[] = [];
  let subject = options.subject ?? event.title;
  if (!options.subject && subject.length > SUBJECT_MAX) {
    const alternative = event.subtitle;
    if (alternative && alternative.length <= SUBJECT_MAX) {
      subject = alternative;
      omissions.push(
        `subject fell back to the subtitle — the title is ${event.title.length} ` +
          `chars and truncates on a phone. Override with --subject.`
      );
    } else {
      subject = truncate(subject, SUBJECT_MAX);
      omissions.push(
        `subject was truncated to ${SUBJECT_MAX} chars. Write a shorter one with --subject.`
      );
    }
  }

  // The preheader is the second hook beside the subject, so it carries the facts
  // the subject cannot: when, and where. Never an echo of the subject.
  let preheader = options.preheader;
  if (!preheader) {
    const parts = [when, event.venueName ?? event.city].filter(Boolean);
    preheader = parts.length > 0 ? `${parts.join(" · ")}.` : null;
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
      `with: npx tsx scripts/events/build-event-poster.ts ${event.slug} --only social`;
    omissions.push(coverNote);
  }

  const key = `announce-${event.slug}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const draft: MessageSpec = {
    key,
    // The single most important line here. `react` is the ONLY engine that emits
    // {{{RESEND_UNSUBSCRIBE_URL}}}; `layout` is the transactional design with no
    // opt-out footer and fails the `unsubscribe` gate on marketing mail.
    engine: "react",
    // Makes the gates strict, and makes render-message.ts print a
    // `broadcasts create` skeleton rather than a single-recipient send command.
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
    "the full description, the speaker bios and the agenda — they live on the event page"
  );

  return {
    // Validating here means the generator can never leave an unrenderable file
    // on disk: a bad spec is an exception now, not a confusing failure later.
    spec: parseMessageSpec(draft),
    cover,
    coverNote,
    ctaUrl,
    ctaIsFallback,
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
  strapline: string | null;
  subject: string | null;
  preheader: string | null;
  cta: string | null;
  out: string | null;
  allowPast: boolean;
  json: boolean;
  help: boolean;
}

const USAGE = [
  "Usage: npx tsx scripts/email/event-announcement-spec.ts (--slug <slug> | <fuzzy words>)",
  '         [--strapline "<text>"] [--subject "<text>"] [--preheader "<text>"]',
  '         [--cta "<text>"] [--allow-past] [--out <path>] [--json] [--help]',
  "",
  "Writes a marketing MessageSpec for one event to tmp/specs/announce-<slug>.json.",
  "Sends nothing. Render and gate it next with scripts/email/render-message.ts.",
  "",
  "  --slug <slug>        Exact event slug.",
  "  <fuzzy words>        Any words from the title, venue or city instead.",
  "  --strapline <text>   One framing sentence above the description.",
  "  --subject <text>     Override the subject (default: the event title, max 50 chars).",
  "  --preheader <text>   Override the preview text (default: when + where, max 120).",
  '  --cta <text>         Override the button label (default: "Register").',
  "  --allow-past         Build for an event that has already happened.",
  "  --out <path>         Where to write the spec.",
  "  --json               Machine-readable report on stdout.",
  "",
  "Exit codes: 0 resolved · 1 no match · 2 ambiguous · 3 refused (event is past).",
].join("\n");

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
    strapline,
    subject,
    preheader,
    cta,
    out,
    allowPast,
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

  if (args.help || !args.query) {
    console.error(USAGE);
    process.exit(args.help ? 0 : EXIT_NO_MATCH);
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
    console.error("  · /send-event-emails   — thank-you + feedback to the people who came");
    console.error("  · /email-the-community — a free-form announcement, written by hand");
    console.error("");
    console.error("Genuinely meant it (a recap, a re-run)? Re-run with --allow-past.");
    process.exit(EXIT_PAST);
  }

  const built = build(event, raw, {
    strapline: args.strapline,
    subject: args.subject,
    preheader: args.preheader,
    cta: args.cta,
  });

  const displayOut = args.out ?? `tmp/specs/announce-${event.slug}.json`;
  const outPath = resolvePath(process.cwd(), displayOut);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(built.spec, null, 2)}\n`, "utf8");

  const nextCommand = `npx tsx scripts/email/render-message.ts ${displayOut} --mode broadcast`;

  // Everything human goes to stderr: stdout belongs to --json so the report can
  // be piped without the summary contaminating it.
  const line = (label: string, text: string): void =>
    console.error(`  ${label.padEnd(11)}${text}`);
  const button = built.spec.blocks.find((block) => block.type === "button");

  console.error("");
  console.error("Event announcement spec");
  console.error("===================================");
  line("Event", `${event.title}  (${event.slug})`);
  line(
    "Matched",
    outcome.match === "exact-slug" ? "exact slug" : `fuzzy — ${outcome.hits.join(" + ")}`
  );
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
          specPath: outPath,
          key: built.spec.key,
          subject: built.spec.subject,
          preheader: built.spec.preheader ?? null,
          ctaUrl: built.ctaUrl,
          ctaIsFallback: built.ctaIsFallback,
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
