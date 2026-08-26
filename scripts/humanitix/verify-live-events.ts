/**
 * Compares the site's own event records against the live Humanitix account and
 * prints what disagrees.
 *
 * Nothing has ever checked the two against each other. The site's event records
 * carry a Humanitix link, a date and a registration figure; Humanitix carries
 * the listing those three describe. When they drift apart nobody finds out,
 * because the only reader who would notice is a visitor who clicks through —
 * and the drift is worst exactly where it is least visible:
 *
 *   * `lib/seo/schema.ts` emits `registrationUrl` (falling back to
 *     `humanitixUrl`) as `offers.url` in the Event JSON-LD on EVERY event page,
 *     past ones included, and `lib/chatbot/tools.ts` hands the same URL to
 *     visitors who ask. A link copied from an older event is therefore
 *     published as structured data and repeated by the chatbot, not merely sat
 *     in a JSON file.
 *   * Six Humanitix listings are cited by more than one site event. In every
 *     known case an earlier event's listing was pasted onto a later, different
 *     event.
 *   * A published date that disagrees with the listing's own start date is the
 *     failure that put one event on the site 16 days away from its own last
 *     ticket sale (see `scripts/humanitix/propose-crosswalk.ts`).
 *
 * It PRINTS and never edits, for the same reason `report-metrics.ts` does: the
 * event records are authored, several of the disagreements below will be the
 * site being right and Humanitix being stale, and choosing which is which is a
 * judgement a person makes. In particular it never rewrites a citation — the
 * plausible owner of a shared listing is named as a suspicion, not applied.
 * Nothing under `lib/data/json/**` is opened for writing.
 *
 * NOT IN CI, deliberately. `.github/workflows/verify.yml` runs offline with no
 * secrets, and all five of its jobs depend on that; this script needs
 * `HUMANITIX_API_KEY` and a network round-trip to a third party whose
 * availability is not ours. A gate that fails when someone else's API is slow
 * is a gate people learn to re-run until it passes. Run it by hand before
 * publishing an event, or on a schedule outside the PR path with `--strict`.
 *
 * WHAT IT CANNOT CHECK WITHOUT `--with-counts`: **no sold or registered count**.
 * The event object returned by `GET /v1/events` carries `totalCapacity`,
 * `markedAsSoldOut` and a per-ticket-type availability flag, and that is all
 * (checked against the OpenAPI document, read 2026-08-27). So by default the
 * site's `attendees` — which by the convention in
 * `docs/development/CONTENT_RULES.md` holds REGISTRATIONS — cannot be
 * reconciled against a live sold figure, and the Humanitix console and the CSV
 * export remain the only places that number lives. `--check-ins` reaches the
 * one *aggregate* live figure that exists, the check-in count, and compares it
 * only against the site's `checkedIn`, which is the field holding attendance.
 *
 * `--with-counts` closes that gap, and states its price. The sold figure exists
 * on exactly one endpoint, `GET /v1/events/{id}/tickets` — the attendee list,
 * carrying names, emails, mobiles, addresses and live access codes. The count
 * is the pagination envelope's `total`; getting it means asking for a page of
 * attendees and throwing the page away. `scripts/humanitix/api-counts.ts` does
 * that and explains, at length, what it does and does not keep. The flag is OFF
 * by default so that a plain run of this script remains a purely PII-free tool
 * anyone can run at any time.
 *
 * Usage:
 *   npx tsx scripts/humanitix/verify-live-events.ts
 *   npx tsx scripts/humanitix/verify-live-events.ts --upcoming-only
 *   npx tsx scripts/humanitix/verify-live-events.ts --slug <site-slug>   # repeatable
 *   npx tsx scripts/humanitix/verify-live-events.ts --offline            # no API key needed
 *   npx tsx scripts/humanitix/verify-live-events.ts --check-ins
 *   npx tsx scripts/humanitix/verify-live-events.ts --with-counts        # see above
 *   npx tsx scripts/humanitix/verify-live-events.ts --json
 *   npx tsx scripts/humanitix/verify-live-events.ts --strict             # non-zero on a problem
 */
import "dotenv/config";

import { TZDate } from "@date-fns/tz";

import {
  getAllEvents,
  getUpcomingEvents,
  isPastEvent,
  parseDateString,
} from "../../lib/data/events";
import { getCheckInCount, listEvents, type HumanitixEvent } from "../../lib/humanitix/client";
import type { EventV3 } from "../../types/event";
import { getTicketCount } from "./api-counts";

/**
 * Every She Sharp event runs on the New Zealand calendar, and the whole point
 * of this comparison is which CALENDAR DAY each side thinks an event falls on.
 * `toISOString()` answers that question in UTC, which is a different day for
 * most NZ evening events — the drift recorded in
 * `docs/development/CONTENT_RULES.md` and fixed once already in `eventSchema`.
 * Nothing here formats a date any other way.
 */
const NZ_TIME_ZONE = "Pacific/Auckland";

/** The only Humanitix host the site links to; the join key lives in its path. */
const HUMANITIX_HOST = "events.humanitix.com";

const INDENT = "  ";

// ---------------------------------------------------------------------------
// Errors and CLI
// ---------------------------------------------------------------------------

/** A usage or configuration problem — reported as one line, never a stack. */
class VerifyError extends Error {}

interface Options {
  slugs: string[];
  upcomingOnly: boolean;
  offline: boolean;
  checkIns: boolean;
  withCounts: boolean;
  json: boolean;
  strict: boolean;
}

const USAGE = `Compares the site's event records with the live Humanitix account.

Usage:
  npx tsx scripts/humanitix/verify-live-events.ts [selection] [options]

Selection (default: every event that cites a Humanitix listing):
  --slug <slug>     one site event; repeat the flag for several
  --upcoming-only   only events still to come

Options:
  --offline         run only the checks that need no API key (slug extraction
                    and shared listings), from the committed JSON alone
  --check-ins       also fetch check-in counts and compare them with the site's
                    \`checkedIn\`; one extra request per event date
  --with-counts     also fetch the live sold count and compare it with the
                    site's \`attendees\` (REGISTRATIONS). Off by default: the
                    count only exists on the attendee endpoint, so this costs
                    one request per event to a URL that returns names, emails
                    and access codes — the page is discarded unread and only the
                    envelope total is kept. See scripts/humanitix/api-counts.ts.
  --json            machine-readable dump
  --strict          exit non-zero when a PROBLEM finding is reported
  --help            this message

Prints; never edits. Exits 0 whatever the report says unless --strict is given,
and even then informational findings (venue text) do not fail it — a gate that
fires on a free-text venue string is a gate people mute.`;

function parseArgs(argv: string[]): Options {
  const options: Options = {
    slugs: [],
    upcomingOnly: false,
    offline: false,
    checkIns: false,
    withCounts: false,
    json: false,
    strict: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    switch (arg) {
      case "--slug": {
        const value = argv[index + 1];
        if (!value || value.startsWith("--")) {
          throw new VerifyError("--slug requires a site event slug.");
        }
        options.slugs.push(value);
        index += 1;
        break;
      }
      case "--upcoming-only":
        options.upcomingOnly = true;
        break;
      case "--offline":
        options.offline = true;
        break;
      case "--check-ins":
        options.checkIns = true;
        break;
      case "--with-counts":
        options.withCounts = true;
        break;
      case "--json":
        options.json = true;
        break;
      case "--strict":
        options.strict = true;
        break;
      default:
        throw new VerifyError(`Unknown flag: ${arg}\n\n${USAGE}`);
    }
  }

  if (options.offline && options.checkIns) {
    throw new VerifyError("--check-ins needs the API; it cannot be combined with --offline.");
  }
  if (options.offline && options.withCounts) {
    throw new VerifyError("--with-counts needs the API; it cannot be combined with --offline.");
  }

  return options;
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * The calendar day a site event is published under, as `YYYY-MM-DD`.
 *
 * `event.date` is authored prose ("November 21, 2025"), which `parseDateString`
 * turns into local midnight. Reading it back with the local getters returns the
 * day that was written down; `toISOString()` would return the day before for
 * anyone east of UTC, which is everyone running this.
 *
 * @param event - The site event.
 * @returns The ISO calendar date, or null when the prose cannot be parsed.
 */
function siteCalendarDate(event: EventV3): string | null {
  const parsed = parseDateString(event.date);
  if (Number.isNaN(parsed.getTime())) return null;
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
}

/**
 * The New Zealand calendar day of an instant, as `YYYY-MM-DD`.
 *
 * Humanitix returns `startDate` as a UTC instant, and an Auckland evening is
 * routinely the previous day in UTC (6pm NZDT is 05:00Z the same day, but 6am
 * NZDT is 17:00Z the day before). A real timezone database is used rather than
 * a fixed offset because NZDT and NZST differ by an hour and the archive spans
 * six years of both.
 *
 * @param instant - An ISO 8601 instant from the API.
 * @returns The NZ calendar date, or null when the instant is missing or unreadable.
 */
function nzCalendarDate(instant: string | null): string | null {
  if (!instant) return null;
  const ms = Date.parse(instant);
  if (Number.isNaN(ms)) return null;
  const nz = new TZDate(ms, NZ_TIME_ZONE);
  return `${nz.getFullYear()}-${pad(nz.getMonth() + 1)}-${pad(nz.getDate())}`;
}

/**
 * Whole days between two `YYYY-MM-DD` dates.
 *
 * Both are anchored at UTC noon so a daylight-saving transition between them
 * cannot round the difference to the wrong integer.
 *
 * @param from - The reference date.
 * @param to - The other date; the sign follows `to - from`.
 * @returns Signed day difference, or null when either date is unreadable.
 */
function dayDelta(from: string, to: string): number | null {
  const parse = (value: string) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return null;
    return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
  };
  const a = parse(from);
  const b = parse(to);
  if (a === null || b === null) return null;
  return Math.round((b - a) / 86_400_000);
}

// ---------------------------------------------------------------------------
// Citations — which Humanitix listing each site event points at
// ---------------------------------------------------------------------------

type CitationField = "registrationUrl" | "humanitixUrl";

interface Citation {
  event: EventV3;
  /** The Humanitix listing slug — the FIRST path segment, lowercased. */
  humanitixSlug: string;
  /** Which record fields carry this citation. */
  fields: CitationField[];
  urls: string[];
  siteDate: string | null;
}

interface UnreadableUrl {
  siteSlug: string;
  field: CitationField;
  url: string;
  reason: string;
}

/**
 * Pulls the Humanitix listing slug out of one URL.
 *
 * The slug is the FIRST path segment and nothing else: several records link
 * straight to the buy page
 * (`…/she-sharp-and-academyex-international-women-s-day-2026/tickets`), and
 * keying on the whole path would make those look like listings of their own,
 * silently hiding every duplicate they are part of.
 *
 * @param raw - The URL as the record carries it.
 * @returns The slug, an explained failure, or null when the URL is simply not a
 *   Humanitix link and therefore not this script's business.
 */
function extractHumanitixSlug(raw: string): { slug: string } | { reason: string } | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Only complain about URLs that were *trying* to be Humanitix links. A Zoom
  // link or an empty string is not a fault to report.
  if (!/humanitix/i.test(trimmed)) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { reason: "not a parseable absolute URL" };
  }

  const host = parsed.hostname.toLowerCase();
  if (host !== HUMANITIX_HOST) {
    return { reason: `host is ${host}, not ${HUMANITIX_HOST}` };
  }

  const segment = parsed.pathname.split("/").filter(Boolean)[0];
  if (!segment) return { reason: "no path segment to use as a listing slug" };

  return { slug: decodeURIComponent(segment).toLowerCase() };
}

/**
 * Collects every Humanitix citation across the site's events.
 *
 * An event carrying the same listing in both `registrationUrl` and
 * `humanitixUrl` is ONE citation with two fields, not two — otherwise every
 * such record would look like it shared a listing with itself.
 *
 * @param events - The merged site event list.
 * @returns The citations, and any Humanitix-looking URL that could not be read.
 */
function collectCitations(events: EventV3[]): {
  citations: Citation[];
  unreadable: UnreadableUrl[];
} {
  const citations: Citation[] = [];
  const unreadable: UnreadableUrl[] = [];

  for (const event of events) {
    const candidates: [CitationField, string][] = [
      ["registrationUrl", event.detailPageData.registrationUrl ?? ""],
      ["humanitixUrl", event.detailPageData.humanitixUrl ?? ""],
    ];

    const bySlug = new Map<string, { fields: CitationField[]; urls: string[] }>();

    for (const [field, url] of candidates) {
      const result = extractHumanitixSlug(url);
      if (result === null) continue;
      if ("reason" in result) {
        unreadable.push({ siteSlug: event.slug, field, url: url.trim(), reason: result.reason });
        continue;
      }
      const entry = bySlug.get(result.slug) ?? { fields: [], urls: [] };
      entry.fields.push(field);
      entry.urls.push(url.trim());
      bySlug.set(result.slug, entry);
    }

    for (const [humanitixSlug, entry] of bySlug) {
      citations.push({
        event,
        humanitixSlug,
        fields: entry.fields,
        urls: entry.urls,
        siteDate: siteCalendarDate(event),
      });
    }
  }

  return { citations, unreadable };
}

// ---------------------------------------------------------------------------
// Findings
// ---------------------------------------------------------------------------

type FindingType =
  | "unreadable-url"
  | "missing"
  | "date-mismatch"
  | "shared-listing"
  | "figure-drift"
  | "venue-mismatch";

/**
 * `problem` means one of the two sides is wrong and someone has to decide
 * which. `informational` means the two differ in a way that is routinely
 * legitimate — a venue typed twice by two people will differ — and is reported
 * so a human can glance at it, never so a script can fail on it.
 */
type Severity = "problem" | "informational";

interface SharedCitationRow {
  siteSlug: string;
  siteTitle: string;
  siteDate: string | null;
  fields: CitationField[];
  deltaDays: number | null;
}

interface Finding {
  type: FindingType;
  severity: Severity;
  /** One line naming the disagreement. */
  headline: string;
  /** Indented supporting lines, already written as sentences. */
  lines: string[];
  humanitixSlug: string | null;
  siteSlugs: string[];
  /** Structured form of the same finding, for `--json`. */
  data: Record<string, unknown>;
}

/** Printed order, and the order the summary counts appear in. */
const FINDING_ORDER: FindingType[] = [
  "missing",
  "date-mismatch",
  "shared-listing",
  "figure-drift",
  "venue-mismatch",
  "unreadable-url",
];

const SECTION_TITLES: Record<FindingType, string> = {
  missing: "MISSING — the site cites a listing the account did not return",
  "date-mismatch": "DATE MISMATCH — the published date is not the listing's start date",
  "shared-listing": "SHARED LISTING — one Humanitix listing cited by several site events",
  "figure-drift": "FIGURE DRIFT — a number on the site disagrees with the account",
  "venue-mismatch": "VENUE (informational) — free text on both sides, so read, do not act",
  "unreadable-url": "UNREADABLE URL — a Humanitix-looking link this join could not use",
};

// ---------------------------------------------------------------------------
// Check: shared listings (needs no API)
// ---------------------------------------------------------------------------

/**
 * Groups citations by listing slug and reports every slug cited more than once.
 *
 * Sharing is always computed over the WHOLE event corpus, never over the
 * `--slug`/`--upcoming-only` selection: a duplicate you can only see by looking
 * at the event you did not ask about is exactly the duplicate that has been
 * going unnoticed. The selection filters which groups are printed, not which
 * are detected.
 *
 * When the listing's own start date is known, the citation whose published date
 * sits closest to it is named as the probable owner. That is a suspicion and is
 * printed as one — the pattern behind all six known cases is an earlier event's
 * link pasted onto a later one, so the nearest date is usually right, and
 * "usually" is not a mandate to rewrite anything.
 *
 * @param citations - Every citation across the corpus.
 * @param listingBySlug - Live listings; empty when running offline.
 * @param selected - Site slugs in scope; a group is reported if any member is.
 * @returns One finding per shared listing.
 */
function findSharedListings(
  citations: Citation[],
  listingBySlug: Map<string, HumanitixEvent>,
  selected: Set<string>
): Finding[] {
  const groups = new Map<string, Citation[]>();
  for (const citation of citations) {
    groups.set(citation.humanitixSlug, [...(groups.get(citation.humanitixSlug) ?? []), citation]);
  }

  const findings: Finding[] = [];

  for (const [humanitixSlug, members] of [...groups].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (members.length < 2) continue;
    if (!members.some((member) => selected.has(member.event.slug))) continue;

    const listing = listingBySlug.get(humanitixSlug) ?? null;
    const listingDate = listing ? nzCalendarDate(listing.startDate) : null;

    const rows: SharedCitationRow[] = members
      .map((member) => ({
        siteSlug: member.event.slug,
        siteTitle: member.event.title,
        siteDate: member.siteDate,
        fields: member.fields,
        deltaDays:
          listingDate && member.siteDate ? dayDelta(listingDate, member.siteDate) : null,
      }))
      .sort((a, b) => (a.siteDate ?? "").localeCompare(b.siteDate ?? ""));

    const closest = probableOwner(rows);

    const lines: string[] = [];
    lines.push(
      listingDate
        ? `The listing's own start date is ${listingDate} (NZ).`
        : listing
          ? "The listing carries no start date, so no citation can be called the owner."
          : "The listing was not fetched, so no citation can be called the owner."
    );
    for (const row of rows) {
      const distance =
        row.deltaDays === null
          ? null
          : row.deltaDays === 0
            ? "same day as the listing"
            : `${Math.abs(row.deltaDays)} day(s) ${row.deltaDays > 0 ? "after" : "before"} the listing`;
      const mark = closest === row.siteSlug ? "probable owner" : null;
      const notes = [distance, mark].filter(Boolean).join("; ");
      lines.push(
        `${row.siteDate ?? "date unparseable"}  ${row.siteSlug}  [${row.fields.join(", ")}]` +
          (notes ? `  — ${notes}` : "")
      );
    }
    if (closest) {
      lines.push(`Probably legitimate: ${closest}. The others probably copied its link.`);
    }
    lines.push(
      "This URL is published as `offers.url` in each of these pages' Event JSON-LD and " +
        "served by the chatbot, so a wrong one is public, not merely stored. NOTHING WAS " +
        "CHANGED — fix the citation in lib/data/json/events-custom.json by hand."
    );

    findings.push({
      type: "shared-listing",
      severity: "problem",
      headline: `${humanitixSlug} — cited by ${members.length} site events`,
      lines,
      humanitixSlug,
      siteSlugs: rows.map((row) => row.siteSlug),
      data: {
        humanitixSlug,
        listingStartDateNz: listingDate,
        probableOwner: closest,
        citations: rows,
      },
    });
  }

  return findings;
}

/**
 * The citation whose published date sits closest to the listing's start date.
 *
 * Returns null when no citation has a comparable date — offline, or a listing
 * with no start date. A null owner means every member of the group stays a
 * candidate, which is the honest state rather than a default pick.
 *
 * @param rows - The citations sharing one listing.
 * @returns The site slug of the probable owner, or null.
 */
function probableOwner(rows: SharedCitationRow[]): string | null {
  let best: SharedCitationRow | null = null;
  for (const row of rows) {
    if (row.deltaDays === null) continue;
    if (best === null || Math.abs(row.deltaDays) < Math.abs(best.deltaDays ?? Infinity)) {
      best = row;
    }
  }
  return best?.siteSlug ?? null;
}

// ---------------------------------------------------------------------------
// Checks that need the API
// ---------------------------------------------------------------------------

/**
 * Indexes the account's listings by every slug they can be reached under.
 *
 * The `slug` field is the join key, but a listing also carries a public `url`
 * whose first path segment is the slug somebody would have copied. Indexing
 * both means a listing whose slug was later edited is still found under the
 * link pasted a year ago.
 *
 * @param listing - Every event the account returned.
 * @returns Lowercased slug to listing; the first listing claiming a slug keeps it.
 */
function indexListings(listing: HumanitixEvent[]): Map<string, HumanitixEvent> {
  const index = new Map<string, HumanitixEvent>();
  const add = (key: string, event: HumanitixEvent) => {
    const normalised = key.trim().toLowerCase();
    if (!normalised || index.has(normalised)) return;
    index.set(normalised, event);
  };

  for (const event of listing) {
    add(event.slug, event);
    if (event.url) {
      const extracted = extractHumanitixSlug(event.url);
      if (extracted && "slug" in extracted) add(extracted.slug, event);
    }
  }
  return index;
}

/**
 * Reports citations whose listing the account did not return.
 *
 * It deliberately does NOT say the listing is gone. `GET /v1/events` takes no
 * archived filter and the API documentation does not say whether archived
 * events are included, so "absent from the listing" and "deleted" are not the
 * same statement — and this account's events go back to 2020, which is a lot of
 * candidates for archiving. What the response does show is whether ANY archived
 * event came back at all, which is the evidence a reader needs to interpret the
 * absence, so it is printed rather than assumed.
 *
 * @param citations - Citations in scope.
 * @param listingBySlug - Live listings by slug.
 * @param archivedReturned - How many returned listings are marked archived.
 * @param listingCount - How many listings the account returned in total.
 * @returns One finding per missing listing.
 */
function findMissingListings(
  citations: Citation[],
  listingBySlug: Map<string, HumanitixEvent>,
  archivedReturned: number,
  listingCount: number
): Finding[] {
  return citations
    .filter((citation) => !listingBySlug.has(citation.humanitixSlug))
    .map((citation) => ({
      type: "missing" as const,
      severity: "problem" as const,
      headline: `${citation.humanitixSlug} — cited by ${citation.event.slug}, not in the account listing`,
      lines: [
        `Site event: ${citation.event.slug} (${citation.siteDate ?? "date unparseable"}) via ${citation.fields.join(", ")}.`,
        `Link: ${citation.urls[0]}`,
        `The account returned ${listingCount} events and none carries this slug.`,
        archivedReturned === 0
          ? 'No returned event is marked archived, so it is NOT established that this ' +
            'endpoint lists archived events at all. Read this as "not in the listing", ' +
            'not as "the listing was deleted".'
          : `${archivedReturned} returned events are marked archived, so archived events ` +
            "do reach this listing — which makes a deleted listing, an edited slug, or a " +
            "listing owned by another Humanitix account the likelier explanations.",
        `Confirm by opening https://${HUMANITIX_HOST}/${citation.humanitixSlug} in a browser before changing anything.`,
      ],
      humanitixSlug: citation.humanitixSlug,
      siteSlugs: [citation.event.slug],
      data: {
        humanitixSlug: citation.humanitixSlug,
        siteSlug: citation.event.slug,
        siteDate: citation.siteDate,
        fields: citation.fields,
        url: citation.urls[0],
        archivedReturned,
        listingCount,
      },
    }));
}

/**
 * Reports citations whose published date is not the listing's start date.
 *
 * Two things stop this being noisy. A recurring listing is compared against
 * every one of its live occurrence dates, not only the headline `startDate`, so
 * one session of a series is not reported as wrong. And a citation that is a
 * *copy* of a shared listing is skipped, because its date necessarily
 * disagrees — that is what makes it a copy — and reporting it here as well
 * would count one mistake twice and bury the real date errors underneath it.
 *
 * @param citations - Citations in scope.
 * @param listingBySlug - Live listings by slug.
 * @param suppressed - Site slugs already reported as copies of a shared listing.
 * @returns One finding per disagreeing date.
 */
function findDateMismatches(
  citations: Citation[],
  listingBySlug: Map<string, HumanitixEvent>,
  suppressed: Set<string>
): Finding[] {
  const findings: Finding[] = [];

  for (const citation of citations) {
    const listing = listingBySlug.get(citation.humanitixSlug);
    if (!listing || !citation.siteDate) continue;
    if (suppressed.has(citation.event.slug)) continue;

    const headlineDate = nzCalendarDate(listing.startDate);
    if (!headlineDate) continue;

    const occurrenceDates = listing.dates
      .filter((date) => !date.deleted && !date.disabled)
      .map((date) => nzCalendarDate(date.startDate))
      .filter((date): date is string => date !== null);

    if ([headlineDate, ...occurrenceDates].includes(citation.siteDate)) continue;

    const delta = dayDelta(headlineDate, citation.siteDate);
    const lines = [
      `Site says ${citation.siteDate}; the listing starts ${headlineDate} (NZ)` +
        (delta === null
          ? "."
          : ` — ${Math.abs(delta)} day(s) ${delta > 0 ? "later" : "earlier"} on the site.`),
      `Listing: ${listing.name}`,
      `Link: ${citation.urls[0]}`,
    ];
    if (listing.timezone && listing.timezone !== NZ_TIME_ZONE) {
      lines.push(
        `The listing declares timezone ${listing.timezone}; this comparison used ` +
          `${NZ_TIME_ZONE}, because that is the calendar the site publishes on. Open the ` +
          "listing before concluding either side is wrong."
      );
    }
    if (occurrenceDates.length > 1) {
      lines.push(
        `This is a recurring listing with ${occurrenceDates.length} live dates ` +
          `(${occurrenceDates.slice(0, 6).join(", ")}${occurrenceDates.length > 6 ? ", …" : ""}); ` +
          "the site's date matches none of them."
      );
    }
    lines.push(
      "One of the two is wrong. Do not assume it is Humanitix: a listing left at a " +
        "placeholder date and a site record typed from a draft poster are both on record."
    );

    findings.push({
      type: "date-mismatch",
      severity: "problem",
      headline: `${citation.event.slug} — published ${citation.siteDate}, listing ${headlineDate}`,
      lines,
      humanitixSlug: citation.humanitixSlug,
      siteSlugs: [citation.event.slug],
      data: {
        siteSlug: citation.event.slug,
        humanitixSlug: citation.humanitixSlug,
        siteDate: citation.siteDate,
        listingStartDateNz: headlineDate,
        listingOccurrenceDatesNz: occurrenceDates,
        deltaDays: delta,
        listingTimezone: listing.timezone,
      },
    });
  }

  return findings;
}

/**
 * Reports numbers that cannot both be true.
 *
 * The counting convention is load-bearing here and is restated in every line
 * this emits: on the site `attendees` holds REGISTRATIONS and `checkedIn` holds
 * ATTENDANCE (`docs/development/CONTENT_RULES.md`). The two are never compared
 * with each other, and a live figure is never called attendance unless it came
 * from the check-in endpoint.
 *
 * Three comparisons are available:
 *
 *   * `attendees` against the listing's `totalCapacity`. Reported ONLY when
 *     registrations exceed the places the listing offers, because that is a
 *     contradiction rather than a difference — and even then it is not proof:
 *     the H1 2026 archive contains one event that genuinely sold past its
 *     stated capacity.
 *   * `attendees` against the live sold count, under `--with-counts`. Both hold
 *     REGISTRATIONS, so they are directly comparable and any difference is
 *     drift. A live count is never described as attendance, however recent it
 *     is — a sold ticket says somebody paid, not that they came.
 *   * `checkedIn` against the live check-in count, under `--check-ins`. A live
 *     count of 0 is NEVER reported as a disagreement:
 *     `docs/development/HUMANITIX_ARCHIVE.md` records that 26 of 62 archived
 *     instances ran no check-in at all, so 0 means nobody scanned far more
 *     often than it means nobody came.
 *
 * @param citations - Citations in scope.
 * @param listingBySlug - Live listings by slug.
 * @param checkInBySlug - Live check-in totals by listing slug, when fetched.
 * @param ticketCountBySlug - Live sold counts by listing slug, when fetched.
 * @param suppressed - Site slugs already reported as copies of a shared
 *   listing. Their `attendees` describes a different event from the listing's
 *   ticket count, so comparing the two would report the copied link a second
 *   time as if it were a separate counting error.
 * @returns One finding per disagreeing figure.
 */
function findFigureDrift(
  citations: Citation[],
  listingBySlug: Map<string, HumanitixEvent>,
  checkInBySlug: Map<string, number>,
  ticketCountBySlug: Map<string, number>,
  suppressed: Set<string>
): Finding[] {
  const findings: Finding[] = [];

  for (const citation of citations) {
    const listing = listingBySlug.get(citation.humanitixSlug);
    if (!listing) continue;

    const attendees = citation.event.attendees;
    if (attendees !== null && listing.totalCapacity > 0 && attendees > listing.totalCapacity) {
      findings.push({
        type: "figure-drift",
        severity: "problem",
        headline: `${citation.event.slug} — ${attendees} registrations recorded against ${listing.totalCapacity} places offered`,
        lines: [
          `The site's \`attendees\` field holds REGISTRATIONS, and it says ${attendees}.`,
          `The Humanitix listing offers ${listing.totalCapacity} places in total.`,
          "More registrations than places is possible — one H1 2026 event did sell past " +
            "its stated capacity — but it is more often a figure typed from the wrong " +
            "event, or a capacity reduced after the fact. Check the Humanitix console.",
          "This says nothing about how many people came; that is `checkedIn`.",
        ],
        humanitixSlug: citation.humanitixSlug,
        siteSlugs: [citation.event.slug],
        data: {
          siteSlug: citation.event.slug,
          humanitixSlug: citation.humanitixSlug,
          measure: "registrations-vs-capacity",
          siteAttendeesRegistrations: attendees,
          listingTotalCapacity: listing.totalCapacity,
        },
      });
    }

    const liveSold = ticketCountBySlug.get(citation.humanitixSlug);
    if (
      liveSold !== undefined &&
      attendees !== null &&
      attendees !== liveSold &&
      !suppressed.has(citation.event.slug)
    ) {
      const liveDates = listing.dates.filter((date) => !date.deleted && !date.disabled);
      const lines = [
        `The site's \`attendees\` field holds REGISTRATIONS, and it says ${attendees}.`,
        `Humanitix currently holds ${liveSold} complete (non-cancelled) tickets on this ` +
          "listing — the same population the archive counts as `registered`.",
        "Both numbers are registrations, so they should agree. Neither is attendance: " +
          "that is `checkedIn`, and nothing here says how many people came.",
      ];
      if (liveDates.length > 1) {
        lines.push(
          `This listing has ${liveDates.length} live dates and the count spans all of them, ` +
            "while the site record describes one event. Compare per date in the console " +
            "before concluding the site is wrong."
        );
      }
      lines.push(
        isPastEvent(citation.event)
          ? "This event is past, so the live count should be final — a difference is a stale " +
              "or hand-typed figure on one side."
          : "This event is still selling, so the live count moves. A site figure typed a week " +
              "ago being lower is expected; it is still out of date."
      );

      findings.push({
        type: "figure-drift",
        severity: "problem",
        headline: `${citation.event.slug} — site records ${attendees} registrations, Humanitix holds ${liveSold} tickets`,
        lines,
        humanitixSlug: citation.humanitixSlug,
        siteSlugs: [citation.event.slug],
        data: {
          siteSlug: citation.event.slug,
          humanitixSlug: citation.humanitixSlug,
          measure: "registrations-vs-registrations",
          siteAttendeesRegistrations: attendees,
          liveTicketsRegistrations: liveSold,
          deltaTickets: liveSold - attendees,
          listingLiveDates: liveDates.length,
        },
      });
    }

    const liveCheckedIn = checkInBySlug.get(citation.humanitixSlug);
    const siteCheckedIn = citation.event.checkedIn;
    if (
      liveCheckedIn !== undefined &&
      liveCheckedIn > 0 &&
      siteCheckedIn !== null &&
      siteCheckedIn !== liveCheckedIn
    ) {
      findings.push({
        type: "figure-drift",
        severity: "problem",
        headline: `${citation.event.slug} — site checked-in ${siteCheckedIn}, Humanitix scanned ${liveCheckedIn}`,
        lines: [
          `The site's \`checkedIn\` field holds ATTENDANCE, and it says ${siteCheckedIn}.`,
          `Humanitix scanned ${liveCheckedIn} tickets across this listing's live dates.`,
          "Both describe people who turned up, so they should agree. Neither figure is " +
            "registrations — do not reconcile either against `attendees`.",
        ],
        humanitixSlug: citation.humanitixSlug,
        siteSlugs: [citation.event.slug],
        data: {
          siteSlug: citation.event.slug,
          humanitixSlug: citation.humanitixSlug,
          measure: "checked-in-vs-checked-in",
          siteCheckedInAttendance: siteCheckedIn,
          liveCheckedInAttendance: liveCheckedIn,
        },
      });
    }
  }

  return findings;
}

/** Reduces a venue string to comparable words; punctuation and case carry no meaning here. */
function normaliseVenue(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Reports venues that look different on the two sides — informational only.
 *
 * Both strings are free text typed by different people at different times
 * ("Les Mills Auckland City" against "Les Mills — 100 Victoria St W"), so a
 * difference is weak evidence of anything and this never rises above
 * informational. Containment either way counts as agreement, which is what
 * keeps the common "same venue, more detail on one side" case out of the
 * report.
 *
 * @param citations - Citations in scope.
 * @param listingBySlug - Live listings by slug.
 * @returns One finding per differing venue.
 */
function findVenueMismatches(
  citations: Citation[],
  listingBySlug: Map<string, HumanitixEvent>
): Finding[] {
  const findings: Finding[] = [];

  for (const citation of citations) {
    const listing = listingBySlug.get(citation.humanitixSlug);
    if (!listing?.eventLocation) continue;

    // An online event has no venue to disagree about, on either side.
    if (citation.event.detailPageData.location.format === "online") continue;
    if (listing.eventLocation.type.toLowerCase() === "online") continue;

    const siteVenue = citation.event.detailPageData.location.venueName?.trim() ?? "";
    const liveVenue = listing.eventLocation.venueName?.trim() ?? "";
    if (!siteVenue || !liveVenue) continue;

    const a = normaliseVenue(siteVenue);
    const b = normaliseVenue(liveVenue);
    if (!a || !b || a.includes(b) || b.includes(a)) continue;

    const siteCity = citation.event.detailPageData.location.city;
    findings.push({
      type: "venue-mismatch",
      severity: "informational",
      headline: `${citation.event.slug} — "${siteVenue}" vs "${liveVenue}"`,
      lines: [
        `Site: ${siteVenue}${siteCity ? `, ${siteCity}` : ""}`,
        `Humanitix: ${liveVenue}${listing.eventLocation.city ? `, ${listing.eventLocation.city}` : ""}`,
        "Free text on both sides, typed by different people. Read it; do not act on it " +
          "without opening the listing.",
      ],
      humanitixSlug: citation.humanitixSlug,
      siteSlugs: [citation.event.slug],
      data: {
        siteSlug: citation.event.slug,
        humanitixSlug: citation.humanitixSlug,
        siteVenue,
        siteCity,
        listingVenue: liveVenue,
        listingCity: listing.eventLocation.city,
      },
    });
  }

  return findings;
}

/** Turns unreadable Humanitix-looking URLs into findings, so nothing is dropped silently. */
function findUnreadableUrls(unreadable: UnreadableUrl[], selected: Set<string>): Finding[] {
  return unreadable
    .filter((entry) => selected.has(entry.siteSlug))
    .map((entry) => ({
      type: "unreadable-url" as const,
      severity: "problem" as const,
      headline: `${entry.siteSlug} — ${entry.field}: ${entry.reason}`,
      lines: [
        `Value: ${entry.url}`,
        "This link could not be reduced to a listing slug, so the event was left out of " +
          "every check below. It is still published on the page.",
      ],
      humanitixSlug: null,
      siteSlugs: [entry.siteSlug],
      data: { ...entry },
    }));
}

// ---------------------------------------------------------------------------
// Check-in counts
// ---------------------------------------------------------------------------

/**
 * Fetches check-in totals for the listings in scope, summed over live dates.
 *
 * One request per event date, which is why it sits behind `--check-ins`: the
 * default run is a single paginated listing call, and this turns it into
 * dozens. The client's own rate budget spaces them out, so nothing is batched
 * here.
 *
 * A listing whose check-in call fails is skipped rather than recorded as zero —
 * "I could not read it" must never become "nobody came".
 *
 * @param citations - Citations in scope.
 * @param listingBySlug - Live listings by slug.
 * @returns Listing slug to total scanned tickets.
 */
async function fetchCheckIns(
  citations: Citation[],
  listingBySlug: Map<string, HumanitixEvent>
): Promise<Map<string, number>> {
  const totals = new Map<string, number>();
  const wanted = new Set(citations.map((citation) => citation.humanitixSlug));

  for (const slug of wanted) {
    const listing = listingBySlug.get(slug);
    if (!listing) continue;
    const dates = listing.dates.filter((date) => !date.deleted && !date.disabled && date.id);
    if (dates.length === 0) continue;

    let total = 0;
    let complete = true;
    for (const date of dates) {
      try {
        const count = await getCheckInCount(listing.id, date.id);
        total += count.checkedIn;
      } catch (error) {
        complete = false;
        console.error(
          `  ! check-in count unavailable for ${slug} (${date.startDate}): ${
            error instanceof Error ? error.message : String(error)
          }`
        );
        break;
      }
    }
    if (complete) totals.set(slug, total);
  }

  return totals;
}

// ---------------------------------------------------------------------------
// Sold counts
// ---------------------------------------------------------------------------

/**
 * Fetches the live sold count for the listings in scope.
 *
 * One request per LISTING, not per citation — several site events can cite the
 * same listing, and asking twice would double the PII exposure to learn the
 * same number. Each request reaches the attendee endpoint and discards its
 * page; `scripts/humanitix/api-counts.ts` is the only place that endpoint is
 * touched and the only place that fact is worth reading in full.
 *
 * A listing whose count fails is skipped rather than recorded as zero, for the
 * reason `fetchCheckIns` gives: "I could not read it" must never become "nobody
 * registered". The error message is the module's own, which names the status
 * and the event id and quotes nothing from the response.
 *
 * @param citations - Citations in scope.
 * @param listingBySlug - Live listings by slug.
 * @returns Listing slug to complete (non-cancelled) ticket count.
 */
async function fetchTicketCounts(
  citations: Citation[],
  listingBySlug: Map<string, HumanitixEvent>
): Promise<Map<string, number>> {
  const totals = new Map<string, number>();
  const wanted = new Set(citations.map((citation) => citation.humanitixSlug));

  for (const slug of wanted) {
    const listing = listingBySlug.get(slug);
    if (!listing) continue;
    try {
      totals.set(slug, await getTicketCount(listing.id));
    } catch (error) {
      console.error(
        `  ! sold count unavailable for ${slug}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  return totals;
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

/**
 * The four things a reader must not conclude from this report. Printed every
 * run, and carried in `--json`, because a drift report that looks exhaustive is
 * more dangerous than one that names its blind spots.
 */
const STANDING_LIMITS = [
  '`GET /v1/events` has no archived filter and the docs do not say whether archived events ' +
    'are returned, so a MISSING finding means "absent from the listing", never "deleted".',
  "Venue strings are free text on both sides and are informational only.",
  "Nothing was written. Every fix is a hand edit to lib/data/json/events-custom.json (or " +
    "the Humanitix console), decided by a person.",
];

/** The sold-count limit, which `--with-counts` lifts — at a price worth restating. */
const COUNT_LIMIT_OFF =
  "No sold or registered count was fetched. `GET /v1/events` exposes only totalCapacity, " +
  "markedAsSoldOut and per-ticket availability, so the site's `attendees` (REGISTRATIONS) " +
  "was NOT reconciled against a live figure — only against capacity. Pass --with-counts to " +
  "compare it properly; without it this run touched no attendee data at all.";

const COUNT_LIMIT_ON =
  "Sold counts were fetched with --with-counts: one request per listing to " +
  "GET /v1/events/{id}/tickets, the endpoint that returns names, emails, mobiles, addresses " +
  "and access codes. pageSize=1 is the API minimum, so one real attendee record crossed the " +
  "wire per listing and was discarded unread — only the pagination envelope's `total` was " +
  "kept, and nothing was written to disk. The counts are REGISTRATIONS and say nothing about " +
  "how many people came.";

/**
 * The limits to print for one run.
 *
 * The sold-count line comes first because it is the one that changes: a reader
 * who ran without the flag needs to know the figure comparison did not happen,
 * and a reader who ran with it needs to know what the number cost.
 *
 * @param withCounts - Whether sold counts were fetched.
 * @returns The lines to print, in order.
 */
function limitsFor(withCounts: boolean): string[] {
  return [withCounts ? COUNT_LIMIT_ON : COUNT_LIMIT_OFF, ...STANDING_LIMITS];
}

interface ReportContext {
  mode: "live" | "offline";
  eventsConsidered: number;
  citations: number;
  listings: number | null;
  checkIns: boolean;
  withCounts: boolean;
}

function printReport(findings: Finding[], context: ReportContext): void {
  console.log("");
  console.log("She Sharp events vs the live Humanitix account");
  console.log(
    `${INDENT}mode          ${context.mode}` +
      (context.mode === "offline"
        ? "  (committed JSON only — slug extraction and shared listings)"
        : "")
  );
  console.log(`${INDENT}site events   ${context.eventsConsidered} in scope`);
  console.log(`${INDENT}citations     ${context.citations} Humanitix links`);
  if (context.listings !== null) {
    console.log(`${INDENT}account       ${context.listings} listings returned`);
  }
  if (context.checkIns) console.log(`${INDENT}check-ins     fetched`);
  if (context.withCounts) {
    console.log(`${INDENT}sold counts   fetched (one discarded attendee page per listing)`);
  }
  console.log("");
  console.log("This report PRINTS and never edits. Nothing under lib/data/ was written.");
  console.log("");

  for (const type of FINDING_ORDER) {
    const group = findings.filter((finding) => finding.type === type);
    if (group.length === 0) continue;

    console.log(`${SECTION_TITLES[type]}  (${group.length})`);
    console.log("");
    for (const finding of group) {
      console.log(`${INDENT}${finding.headline}`);
      for (const line of finding.lines) console.log(`${INDENT}${INDENT}${line}`);
      console.log("");
    }
  }

  const problems = findings.filter((finding) => finding.severity === "problem").length;
  const informational = findings.length - problems;
  const counts = FINDING_ORDER.filter((type) => findings.some((finding) => finding.type === type))
    .map((type) => `${type} ${findings.filter((finding) => finding.type === type).length}`)
    .join(" · ");

  console.log(
    findings.length === 0
      ? "No findings."
      : `${findings.length} finding(s): ${problems} problem, ${informational} informational — ${counts}`
  );
  console.log("");
  console.log("What this cannot tell you:");
  for (const limit of limitsFor(context.withCounts)) console.log(`${INDENT}- ${limit}`);
  console.log("");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(argv: string[]): Promise<number> {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(USAGE);
    return 0;
  }

  const options = parseArgs(argv);
  const allEvents = getAllEvents();

  // Citations are collected over every event, always. The selection decides
  // what is REPORTED, not what is compared — see findSharedListings.
  const { citations, unreadable } = collectCitations(allEvents);

  const selected = new Set<string>();
  if (options.slugs.length > 0) {
    for (const slug of options.slugs) {
      if (!allEvents.some((event) => event.slug === slug)) {
        throw new VerifyError(
          `No site event has the slug "${slug}".\n` +
            "Slugs come from the merged event list — check lib/data/json/events-custom.json,\n" +
            "or run scripts/events/event-status.ts --all to see every one."
        );
      }
      selected.add(slug);
    }
  } else if (options.upcomingOnly) {
    for (const event of getUpcomingEvents()) selected.add(event.slug);
  } else {
    for (const event of allEvents) selected.add(event.slug);
  }

  const scoped = citations.filter((citation) => selected.has(citation.event.slug));

  let listingBySlug = new Map<string, HumanitixEvent>();
  let listingCount: number | null = null;
  let archivedReturned = 0;
  let checkInBySlug = new Map<string, number>();
  let ticketCountBySlug = new Map<string, number>();

  if (!options.offline) {
    // Checked here rather than left to the client so a missing key is one
    // sentence naming the flag that avoids it, not a thrown API error.
    if (!process.env.HUMANITIX_API_KEY?.trim()) {
      throw new VerifyError(
        "HUMANITIX_API_KEY is not set — put it in .env (local tooling only, never in " +
          "Vercel), or run with --offline for the checks that need no key."
      );
    }

    const listing = await listEvents();
    listingCount = listing.length;
    archivedReturned = listing.filter((event) => event.isArchived).length;
    listingBySlug = indexListings(listing);

    if (options.checkIns) {
      checkInBySlug = await fetchCheckIns(scoped, listingBySlug);
    }

    if (options.withCounts) {
      ticketCountBySlug = await fetchTicketCounts(scoped, listingBySlug);
    }
  }

  const shared = findSharedListings(citations, listingBySlug, selected);

  // A copy of a shared listing disagrees with that listing's date by
  // construction. Suppressing it under date-mismatch keeps one mistake from
  // being counted twice; the shared-listing block already names it.
  const copiedSlugs = new Set<string>();
  for (const finding of shared) {
    const owner = finding.data.probableOwner;
    for (const siteSlug of finding.siteSlugs) {
      if (siteSlug !== owner) copiedSlugs.add(siteSlug);
    }
  }

  const findings: Finding[] = [...findUnreadableUrls(unreadable, selected), ...shared];

  if (!options.offline) {
    findings.push(
      ...findMissingListings(scoped, listingBySlug, archivedReturned, listingCount ?? 0),
      ...findDateMismatches(scoped, listingBySlug, copiedSlugs),
      ...findFigureDrift(scoped, listingBySlug, checkInBySlug, ticketCountBySlug, copiedSlugs),
      ...findVenueMismatches(scoped, listingBySlug)
    );
  }

  const ordered = FINDING_ORDER.flatMap((type) =>
    findings.filter((finding) => finding.type === type)
  );

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          mode: options.offline ? "offline" : "live",
          timeZone: NZ_TIME_ZONE,
          scope: {
            siteEvents: selected.size,
            citations: scoped.length,
            listingsReturned: listingCount,
            archivedReturned: options.offline ? null : archivedReturned,
            checkInsFetched: options.checkIns,
            soldCountsFetched: options.withCounts,
          },
          findings: ordered,
          summary: {
            total: ordered.length,
            problems: ordered.filter((finding) => finding.severity === "problem").length,
            informational: ordered.filter((finding) => finding.severity === "informational")
              .length,
            byType: Object.fromEntries(
              FINDING_ORDER.map((type) => [
                type,
                ordered.filter((finding) => finding.type === type).length,
              ])
            ),
          },
          limits: limitsFor(options.withCounts),
        },
        null,
        2
      )
    );
  } else {
    printReport(ordered, {
      mode: options.offline ? "offline" : "live",
      eventsConsidered: selected.size,
      citations: scoped.length,
      listings: listingCount,
      checkIns: options.checkIns,
      withCounts: options.withCounts,
    });
  }

  // A report, not a gate — the posture of scripts/events/event-status.ts. Only
  // --strict fails, and only on a `problem`: a venue string two people typed
  // differently is not a build failure, and a gate that fires on one gets muted
  // along with everything it would have caught.
  if (options.strict && ordered.some((finding) => finding.severity === "problem")) return 1;
  return 0;
}

main(process.argv.slice(2))
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    if (error instanceof VerifyError) {
      console.error(`Error: ${error.message}`);
      process.exitCode = 1;
      return;
    }
    // A Humanitix failure is one line too: the client's message already names
    // the status and the path, and a stack trace over it helps nobody running
    // this the afternoon before an event.
    if (error instanceof Error && error.name === "HumanitixApiError") {
      console.error(`Humanitix API error: ${error.message}`);
      process.exitCode = 1;
      return;
    }
    throw error;
  });
