/**
 * Resolves a slug or a half-remembered event name to the one event record every
 * stage email is written from.
 *
 * The repo is the only truth about what an event IS — its title, date, venue and
 * registration link all live in the merged event data (`lib/data/events.ts`,
 * which folds `lib/data/json/events-custom.json` over the historical
 * `shesharp_events_v3.json` archive). Recipients come from somewhere else
 * entirely (a Humanitix export), so this script is the half of the pipeline that
 * guarantees the wording in the email matches the page the attendee will land on.
 *
 * Nobody remembers slugs. "the AUT hackathon", "aotearoa ai hackathon" and
 * "hackathon in august" all have to land on the same record, and landing on the
 * WRONG record is how a room number gets sent to the wrong hundred people — so a
 * near-tie is reported as a list to choose from rather than resolved by luck.
 *
 * Dates are read from LOCAL calendar fields, never `toISOString()`. The repo has
 * had a real day-drift incident from UTC-formatting a locally-constructed Date
 * (see `toDateOnly` in `lib/seo/schema.ts`); an email that says the wrong day is
 * the same bug with a worse blast radius.
 *
 * Usage:
 *   npx tsx .claude/skills/send-event-emails/scripts/resolve-event.ts <slug-or-fuzzy-name> [--json]
 *   npx tsx .claude/skills/send-event-emails/scripts/resolve-event.ts --list [--limit 12] [--json]
 *
 * Flags:
 *   <slug-or-fuzzy-name>  Exact slug, or any words from the title/venue/city.
 *   --list                Skip matching; list recent + upcoming events to pick from.
 *   --limit <n>           How many events each half of --list shows (default 8).
 *   --json                Machine-readable output instead of prose.
 *
 * Exit codes: 0 on a single confident match (or --list), 1 on no match, 2 when
 * several events are plausible and a human has to name one.
 */

import { getAllEvents, parseDateString, type EventV3 } from "../../../../lib/data/events";
import { googleCalendarUrl } from "../../../../emails/utils";

/** Exit code used when the query matched several events and cannot be resolved. */
const EXIT_AMBIGUOUS = 2;

/** A match must clear this score, and beat the runner-up by this ratio, to be confident. */
const MIN_SCORE = 3;
const CONFIDENT_RATIO = 1.6;

// ---------------------------------------------------------------------------
// Local-calendar date handling (never toISOString — see the file header)
// ---------------------------------------------------------------------------

/**
 * Formats a Date as `YYYY-MM-DD` from its LOCAL calendar fields.
 *
 * `parseDateString` builds the Date at local midnight, so reading local fields
 * keeps the calendar day stable on any server timezone. Mirrors `toDateOnly` in
 * `lib/seo/schema.ts` — kept local rather than imported because that helper is
 * private to the SEO module.
 */
function toDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** UTC date (ms) of the given local calendar day, for daylight-saving maths. */
function utcDay(year: number, month: number, day: number): number {
  return Date.UTC(year, month, day);
}

/** Day-of-month of the last Sunday in the given month (0-indexed month). */
function lastSunday(year: number, month: number): number {
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const weekday = new Date(Date.UTC(year, month, lastDay)).getUTCDay();
  return lastDay - weekday;
}

/** Day-of-month of the first Sunday in the given month (0-indexed month). */
function firstSunday(year: number, month: number): number {
  const weekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  return weekday === 0 ? 1 : 8 - weekday;
}

/**
 * UTC offset for a New Zealand calendar day.
 *
 * NZ daylight time (NZDT, +13) runs from the last Sunday in September to the
 * first Sunday in April; the rest of the year is NZST (+12). The event records
 * almost never fill the `timezone` field — the abbreviation lives inside the
 * human-readable `time` string, and sometimes nowhere at all — so an explicit
 * hint wins and the calendar is the fallback. Getting this wrong shifts every
 * "add to calendar" link by an hour.
 *
 * @param dateOnly Local calendar day as `YYYY-MM-DD`.
 * @param hint An `NZST`/`NZDT` abbreviation found in the record, if any.
 * @returns `{ abbreviation, offset }`.
 */
function nzZoneFor(dateOnly: string, hint: string | null): { abbreviation: string; offset: string } {
  if (hint === "NZST") return { abbreviation: "NZST", offset: "+12:00" };
  if (hint === "NZDT") return { abbreviation: "NZDT", offset: "+13:00" };

  const [year, month, day] = dateOnly.split("-").map(Number);
  const instant = utcDay(year, month - 1, day);
  const dstStart = utcDay(year, 8, lastSunday(year, 8)); // last Sunday of September
  const dstEnd = utcDay(year, 3, firstSunday(year, 3)); // first Sunday of April
  const isDaylight = instant >= dstStart || instant < dstEnd;
  return isDaylight
    ? { abbreviation: "NZDT", offset: "+13:00" }
    : { abbreviation: "NZST", offset: "+12:00" };
}

/** Parses a "7:30pm" / "6pm" / "17:00" clock time to 24h `HH:MM`, or null. */
function parseClockTime(time: string | undefined | null): string | null {
  const match = time?.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*([ap]\.?m\.?)?$/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = match[2] ?? "00";
  const meridiem = match[3]?.toLowerCase().replace(/\./g, "");
  if (meridiem === "pm" && hours < 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;
  if (hours > 23) return null;
  return `${String(hours).padStart(2, "0")}:${minutes}`;
}

/**
 * Pulls the clock times out of a human-readable time string.
 *
 * The dedicated `startTime`/`endTime` fields exist in the type but are empty on
 * every event this skill will realistically touch — "5:00pm - 7:30pm NZST" is
 * the actual storage format. Splitting on the dash is not enough either: some
 * records use an en dash, some spell the second day out. Matching clock shapes
 * anywhere in the string survives all of it.
 */
function extractClockTimes(time: string | null): { start: string | null; end: string | null } {
  if (!time) return { start: null, end: null };
  const matches = time.match(/\b\d{1,2}(?::\d{2})?\s*[ap]\.?m\.?/gi) ?? [];
  return { start: matches[0] ?? null, end: matches[1] ?? null };
}

/** Finds an `NZST`/`NZDT` abbreviation anywhere in the record's time strings. */
function extractZoneHint(...values: (string | undefined | null)[]): string | null {
  for (const value of values) {
    const match = value?.match(/\bNZ(?:ST|DT)\b/i);
    if (match) return match[0].toUpperCase();
  }
  return null;
}

/**
 * Detects a `time` string that spans more than one calendar day.
 *
 * The event record carries a single `date`, but a hackathon's human-readable
 * `time` ("Fri 7 Aug, 5:00pm – Sat 8 Aug 2026") is the only place the second day
 * appears. Emails must quote that string verbatim rather than compute an end
 * date that would be wrong.
 */
function looksMultiDay(time: string | undefined): boolean {
  if (!time) return false;
  const dayNumbers = time.match(/\b\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/gi);
  return (dayNumbers?.length ?? 0) > 1;
}

// ---------------------------------------------------------------------------
// The resolved shape every downstream step reads
// ---------------------------------------------------------------------------

interface ResolvedEvent {
  slug: string;
  /** Listing title — what the site calls the event. */
  title: string;
  /** Longer detail-page title when it differs; often carries the partners. */
  detailTitle: string | null;
  subtitle: string | null;
  status: string;
  category: string;
  /** Human-readable date exactly as the site prints it, e.g. "August 7, 2026". */
  date: string;
  /** Same day as `YYYY-MM-DD`, from local calendar fields. */
  dateOnly: string | null;
  /** Single-day events end the day they start; multi-day ones say so via `multiDay`. */
  endDateOnly: string | null;
  multiDay: boolean;
  /** Human-readable time range, quoted verbatim in emails. */
  time: string | null;
  startTime: string | null;
  endTime: string | null;
  timezone: string | null;
  /** Offset-bearing start instant, for the calendar link. */
  startIso: string | null;
  daysUntil: number;
  venueName: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  /** `Venue, Address` — what the calendar link and the "Where" row show. */
  locationLabel: string | null;
  format: string | null;
  registrationUrl: string | null;
  /** Public detail page on the canonical origin. */
  eventPageUrl: string;
  galleryUrl: string | null;
  addToCalendarUrl: string | null;
}

/** Canonical origin — matches `SITE_URL` in `lib/seo/site.ts`. */
const SITE_URL = "https://www.shesharp.org.nz";

/** Returns the value when it is a non-empty string, else null. */
function orNull(value: string | undefined | null): string | null {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

/**
 * Flattens one `EventV3` into the fields the email stages actually use.
 *
 * @param event The merged event record.
 * @returns Everything a stage template needs, with dates already local-safe.
 */
function resolve(event: EventV3): ResolvedEvent {
  const data = event.detailPageData;
  const parsed = parseDateString(event.date);
  const dateOnly = Number.isNaN(parsed.getTime()) ? null : toDateOnly(parsed);
  const multiDay = looksMultiDay(data.time);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDay = Number.isNaN(parsed.getTime()) ? null : new Date(parsed);
  eventDay?.setHours(0, 0, 0, 0);
  const daysUntil = eventDay
    ? Math.round((eventDay.getTime() - today.getTime()) / 86_400_000)
    : Number.NaN;

  const venueName = orNull(data.location?.venueName);
  const address = orNull(data.location?.address);
  const locationLabel = [venueName, address].filter(Boolean).join(", ") || null;

  const time = orNull(data.time);
  const fromString = extractClockTimes(time);
  const startTime = orNull(data.startTime) ?? fromString.start;
  const endTime = orNull(data.endTime) ?? fromString.end;

  const zone = dateOnly
    ? nzZoneFor(dateOnly, extractZoneHint(data.timezone, time, data.dateTime))
    : null;
  const startClock = parseClockTime(startTime);
  const startIso = dateOnly && startClock && zone ? `${dateOnly}T${startClock}:00${zone.offset}` : null;

  const eventPageUrl = `${SITE_URL}/events/${event.slug}`;

  const detailTitle = orNull(data.title);

  return {
    slug: event.slug,
    title: event.title,
    detailTitle: detailTitle && detailTitle !== event.title ? detailTitle : null,
    subtitle: orNull(data.subtitle),
    status: data.status || "unknown",
    category: data.category || "unknown",
    date: event.date,
    dateOnly,
    endDateOnly: multiDay ? null : dateOnly,
    multiDay,
    time,
    startTime,
    endTime,
    timezone: zone?.abbreviation ?? null,
    startIso,
    daysUntil,
    venueName,
    address,
    city: orNull(data.location?.city),
    country: orNull(data.location?.country),
    locationLabel,
    format: orNull(data.location?.format),
    registrationUrl: orNull(data.registrationUrl) ?? orNull(data.humanitixUrl),
    eventPageUrl,
    galleryUrl: orNull(data.galleryUrl),
    // `googleCalendarUrl` writes a 2-hour block when it has only a start. That
    // is right for a single evening and wrong for a festival: a two-day
    // hackathon would land in every attendee's calendar as finishing at 7pm on
    // day one, and someone who trusts it leaves halfway through. With no
    // machine-readable end on multi-day records, no button beats a wrong one.
    addToCalendarUrl: multiDay
      ? null
      : googleCalendarUrl({
          title: event.title,
          startIso,
          locationLabel,
          url: eventPageUrl,
        }),
  };
}

// ---------------------------------------------------------------------------
// Fuzzy matching
// ---------------------------------------------------------------------------

/** Words too common in She Sharp event titles to carry any signal. */
const STOP_WORDS = new Set([
  "the", "a", "an", "and", "of", "for", "with", "to", "in", "on", "at", "by",
  "event", "events", "she", "sharp", "shesharp",
]);

/** Splits a phrase into lowercase alphanumeric tokens, stop words removed. */
function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

interface Candidate {
  event: EventV3;
  score: number;
  /** Which fields the query hit, for the "why did you pick this" line. */
  hits: string[];
}

/**
 * Bonus for events near today.
 *
 * Stage emails are only ever sent around an event: a welcome after registration
 * opens, reminders in the fortnight before, a thank-you the day after. Nobody
 * mails the registrants of a 2022 hackathon. She Sharp has run a same-named
 * festival almost every year, so without this the archive drowns the one event
 * the user could plausibly mean.
 */
function recencyBonus(event: EventV3): number {
  const time = parseDateString(event.date).getTime();
  if (Number.isNaN(time)) return 0;
  const days = Math.abs(time - Date.now()) / 86_400_000;
  if (days <= 90) return 6;
  if (days <= 400) return 2;
  return 0;
}

/**
 * Scores one event against the query tokens.
 *
 * Weighting reflects how people actually name events: the slug is the most
 * deliberate identifier, the title is what they read on the site, and the
 * venue/city is what they remember when they remember nothing else ("the AUT
 * one"). A partial token match (prefix) counts for less than an exact one so
 * that "ai" doesn't score the same as "aotearoa".
 */
function score(event: EventV3, tokens: string[]): Candidate {
  const data = event.detailPageData;
  const fields: { name: string; text: string; weight: number }[] = [
    { name: "slug", text: event.slug, weight: 3 },
    { name: "title", text: `${event.title} ${data.title ?? ""} ${data.subtitle ?? ""}`, weight: 2 },
    {
      name: "venue",
      text: `${data.location?.venueName ?? ""} ${data.location?.city ?? ""}`,
      weight: 2,
    },
    { name: "category", text: `${data.category ?? ""} ${event.date}`, weight: 1 },
  ];

  let total = 0;
  const hits = new Set<string>();

  for (const token of tokens) {
    for (const field of fields) {
      const words = tokenize(field.text);
      if (words.includes(token)) {
        total += field.weight;
        hits.add(field.name);
      } else if (words.some((word) => word.startsWith(token) || token.startsWith(word))) {
        total += field.weight / 2;
        hits.add(field.name);
      }
    }
  }

  // Only reward recency once the query actually matched something, so an
  // unrelated query cannot resolve to "whatever is on next".
  if (total > 0) total += recencyBonus(event);

  return { event, score: total, hits: [...hits] };
}

/** Sorts candidates by score, then by whichever event is nearest to today. */
function rank(candidates: Candidate[]): Candidate[] {
  const now = Date.now();
  return [...candidates].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const distance = (event: EventV3): number => {
      const time = parseDateString(event.date).getTime();
      return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : Math.abs(time - now);
    };
    return distance(a.event) - distance(b.event);
  });
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

/** Pads a label so the values line up in the console block. */
function row(label: string, value: string | null): string {
  return `  ${label.padEnd(17)}${value ?? "—"}`;
}

/**
 * Relative timing derived from the date, e.g. "in 11 days" / "2 years ago".
 *
 * Deliberately NOT `detailPageData.status`: the historical archive is full of
 * finished events still marked "upcoming", and a candidate list that labels a
 * 2023 hackathon "upcoming" invites exactly the wrong pick.
 */
function relativeWhen(event: EventV3): string {
  const time = parseDateString(event.date).getTime();
  if (Number.isNaN(time)) return "date unknown";
  const days = Math.round((time - Date.now()) / 86_400_000);
  const magnitude = Math.abs(days);
  const unit =
    magnitude >= 365
      ? `${Math.round(magnitude / 365)} year${Math.round(magnitude / 365) === 1 ? "" : "s"}`
      : magnitude >= 60
        ? `${Math.round(magnitude / 30)} months`
        : `${magnitude} day${magnitude === 1 ? "" : "s"}`;
  if (days === 0) return "today";
  return days > 0 ? `in ${unit}` : `${unit} ago`;
}

/** One-line summary used in candidate lists and `--list`. */
function summarize(event: EventV3): string {
  const data = event.detailPageData;
  const where = data.location?.venueName || data.location?.city || "location TBA";
  return `${event.slug}\n      ${event.title}\n      ${event.date} (${relativeWhen(event)}) · ${where}`;
}

function printResolved(resolved: ResolvedEvent): void {
  const when =
    Number.isNaN(resolved.daysUntil)
      ? ""
      : resolved.daysUntil === 0
        ? " (today)"
        : resolved.daysUntil > 0
          ? ` (in ${resolved.daysUntil} day${resolved.daysUntil === 1 ? "" : "s"})`
          : ` (${Math.abs(resolved.daysUntil)} day${resolved.daysUntil === -1 ? "" : "s"} ago)`;

  console.log("Event resolved");
  console.log("===================================");
  console.log(row("Slug", resolved.slug));
  console.log(row("Title", resolved.title));
  if (resolved.detailTitle) console.log(row("Detail title", resolved.detailTitle));
  if (resolved.subtitle) console.log(row("Subtitle", resolved.subtitle));
  console.log(row("Status", `${resolved.status}${when}`));
  console.log(row("Date", `${resolved.date}${resolved.dateOnly ? `  (${resolved.dateOnly})` : ""}`));
  console.log(row("Time", resolved.time));
  console.log(
    row("Starts (ISO)", resolved.startIso ? `${resolved.startIso}  (${resolved.timezone})` : null)
  );
  console.log(row("Venue", resolved.venueName));
  console.log(row("Address", resolved.address));
  console.log(row("City", [resolved.city, resolved.country].filter(Boolean).join(", ") || null));
  console.log(row("Format", resolved.format));
  console.log(row("Registration", resolved.registrationUrl));
  console.log(row("Event page", resolved.eventPageUrl));
  console.log(row("Add to calendar", resolved.addToCalendarUrl));
  console.log("===================================");
  console.log("");

  if (resolved.multiDay) {
    console.log(
      "  ! This event spans more than one day. The record carries a single date, so\n" +
        `    quote the time string verbatim ("${resolved.time}") instead of computing\n` +
        "    an end date. There is deliberately NO 'add to calendar' link for multi-day\n" +
        "    events — a generated one would finish on day one and mislead attendees.\n" +
        "    Put the dates in the copy instead, or link the event page."
    );
    console.log("");
  }
  if (!resolved.startIso) {
    console.log(
      "  ! No start time in the record, so there is no add-to-calendar link. Either\n" +
        "    leave the calendar button out or ask the user for the start time."
    );
    console.log("");
  }

  console.log("Read the title, date and venue back to the user and get a yes before");
  console.log("writing any copy — everything downstream quotes these exact strings.");
}

function printCandidates(query: string, candidates: Candidate[]): void {
  console.error(`"${query}" matches ${candidates.length} events. Which one?`);
  console.error("");
  candidates.forEach((candidate, index) => {
    console.error(`  ${index + 1}. ${summarize(candidate.event)}`);
    console.error("");
  });
  console.error("Re-run with the exact slug:");
  console.error(
    `  npx tsx .claude/skills/send-event-emails/scripts/resolve-event.ts ${candidates[0].event.slug}`
  );
}

function printNoMatch(query: string): void {
  console.error(`Nothing in the event data matches "${query}".`);
  console.error("");
  console.error("Two likely reasons:");
  console.error("  1. The event is not in the repo yet. Events reach the site through the");
  console.error("     sync-event-from-slack skill — run that first, then come back.");
  console.error("  2. The wording is too far off. Try a distinctive word from the title,");
  console.error("     the venue, or the city.");
  console.error("");
  console.error("To browse instead:");
  console.error("  npx tsx .claude/skills/send-event-emails/scripts/resolve-event.ts --list");
}

/**
 * Prints the upcoming events, then the most recent past ones.
 *
 * Both halves matter: the upcoming list drives welcome/reminder stages, and the
 * past list drives the thank-you stage the day after.
 */
function printList(events: EventV3[], limit: number, json: boolean): void {
  const now = Date.now();
  const withTime = events
    .map((event) => ({ event, time: parseDateString(event.date).getTime() }))
    .filter((entry) => !Number.isNaN(entry.time));

  const upcoming = withTime
    .filter((entry) => entry.time >= now)
    .sort((a, b) => a.time - b.time)
    .slice(0, limit)
    .map((entry) => entry.event);
  const past = withTime
    .filter((entry) => entry.time < now)
    .sort((a, b) => b.time - a.time)
    .slice(0, limit)
    .map((entry) => entry.event);

  if (json) {
    console.log(
      JSON.stringify(
        {
          mode: "list",
          upcoming: upcoming.map(resolve),
          recentlyPast: past.map(resolve),
        },
        null,
        2
      )
    );
    return;
  }

  console.log(`Upcoming events (${upcoming.length})`);
  console.log("");
  for (const event of upcoming) console.log(`  · ${summarize(event)}\n`);
  console.log(`Recently finished (${past.length}) — the thank-you stage lives here`);
  console.log("");
  for (const event of past) console.log(`  · ${summarize(event)}\n`);
  console.log("Pick one and re-run with its slug.");
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

interface Args {
  query: string | null;
  list: boolean;
  limit: number;
  json: boolean;
}

function parseArgs(argv: string[]): Args {
  const positional: string[] = [];
  let limit = 8;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--limit") {
      const value = argv[index + 1];
      index += 1;
      const parsed = Number(value);
      if (!Number.isInteger(parsed) || parsed < 1) {
        console.error(`Error: --limit must be a positive integer (got "${value ?? ""}").`);
        process.exit(1);
      }
      limit = parsed;
      continue;
    }
    if (arg.startsWith("--")) continue;
    positional.push(arg);
  }

  return {
    query: positional.length > 0 ? positional.join(" ") : null,
    list: argv.includes("--list"),
    limit,
    json: argv.includes("--json"),
  };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const events = getAllEvents();

  if (args.list || !args.query) {
    if (!args.query && !args.list) {
      console.error("No event named. Listing what is available instead.");
      console.error("");
    }
    printList(events, args.limit, args.json);
    return;
  }

  // An exact slug is unambiguous by construction — no scoring, no second guess.
  const exact = events.find((event) => event.slug === args.query);
  if (exact) {
    const resolved = resolve(exact);
    if (args.json) console.log(JSON.stringify({ mode: "resolved", match: "exact-slug", event: resolved }, null, 2));
    else printResolved(resolved);
    return;
  }

  const tokens = tokenize(args.query);
  if (tokens.length === 0) {
    printNoMatch(args.query);
    process.exit(1);
  }

  const ranked = rank(events.map((event) => score(event, tokens))).filter(
    (candidate) => candidate.score >= MIN_SCORE
  );

  if (ranked.length === 0) {
    if (args.json) {
      console.log(JSON.stringify({ mode: "no-match", query: args.query, candidates: [] }, null, 2));
    } else {
      printNoMatch(args.query);
    }
    process.exit(1);
  }

  const best = ranked[0];
  const runnerUp = ranked[1];
  const confident = !runnerUp || best.score >= runnerUp.score * CONFIDENT_RATIO;

  if (confident) {
    const resolved = resolve(best.event);
    if (args.json) {
      console.log(
        JSON.stringify(
          { mode: "resolved", match: "fuzzy", score: best.score, hits: best.hits, event: resolved },
          null,
          2
        )
      );
    } else {
      console.log(`Matched "${args.query}" on ${best.hits.join(" + ")} (score ${best.score}).`);
      console.log("");
      printResolved(resolved);
    }
    return;
  }

  const shortlist = ranked.slice(0, 5);
  if (args.json) {
    console.log(
      JSON.stringify(
        {
          mode: "ambiguous",
          query: args.query,
          candidates: shortlist.map((candidate) => ({
            score: candidate.score,
            hits: candidate.hits,
            event: resolve(candidate.event),
          })),
        },
        null,
        2
      )
    );
  } else {
    printCandidates(args.query, shortlist);
  }
  process.exit(EXIT_AMBIGUOUS);
}

void main().catch((error: unknown) => {
  console.error(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
