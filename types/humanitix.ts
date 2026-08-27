/**
 * Types for the Humanitix ticketing archive.
 *
 * She Sharp has sold tickets through Humanitix since 2020. The raw account
 * exports carry 5,156 attendee rows with names, addresses and dates of birth,
 * plus 124 live access codes, so they live in a gitignored vault and never in
 * git. What IS committed is the derived, aggregate-only archive under
 * `lib/data/json/humanitix/`, and these are its shapes.
 *
 * The split that matters here is GENERATED vs AUTHORED. `HumanitixManifest`,
 * `HumanitixEvents` and `HumanitixAggregates` are rebuilt wholesale from the
 * vault by `scripts/humanitix/build-archive.ts`. `HumanitixCrosswalk`,
 * `HumanitixSegments` and `HumanitixOrganisations` are hand-authored judgements
 * the builder only ever reads. Nothing generated carries a `siteSlug`, because
 * a regeneration would silently overwrite a decision a human made.
 *
 * See docs/development/HUMANITIX_ARCHIVE.md.
 */

// ============================================
// Shared
// ============================================

/**
 * How much of a person a raw export file exposes. Recorded per file in the
 * manifest so the vault's contents can be reasoned about when the vault itself
 * is not present — which is the normal case, including on CI.
 */
export type HumanitixPiiClass =
  | "none"
  | "aggregate"
  | "email-only"
  | "person-identifying"
  | "person-sensitive"
  | "financial-secret"
  | "access-secret";

/**
 * Which Humanitix report a vault file came from.
 *
 * Two families, and the split is the provenance. The first eleven are the CSVs
 * from Humanitix → Reports: a person clicked a report name, and that name is
 * what the file is. The last five are API responses, where the *endpoint* is
 * the file's identity instead — so they are named after the endpoint and not
 * after the nearest-looking report. `event-tickets` is deliberately not folded
 * into `attendee-details`: the CSV is one account-wide table Humanitix
 * assembled, the API file is one event's raw rows, and treating them as the
 * same report would let a reader compare a row count with a ticket count.
 *
 * `/v1/payouts`, `/v1/access-codes` and `/v1/discounts` do not exist — every
 * variant 404s — so `payouts`, `access-codes`, `discounts`,
 * `earnings-by-ticket-type`, `top-purchasers` and `affiliate-codes-orders`
 * stay CSV-only for good, and no API member will ever be added for them.
 */
export type HumanitixReportKind =
  // --- Humanitix → Reports, downloaded as CSV -------------------------------
  | "attendee-details"
  | "orders"
  | "event-summary"
  | "earnings-by-ticket-type"
  | "payouts"
  | "access-codes"
  | "discounts"
  | "top-purchasers"
  | "guest-list"
  | "additional-donations"
  | "affiliate-codes-orders"
  // --- Public API v1, pulled by scripts/humanitix/fetch-api.ts --------------
  /** `GET /v1/events` — the account's event list, verbatim. */
  | "events"
  /** `GET /v1/tags` — the account's event tags. Zero of them exist. */
  | "tags"
  /** `GET /v1/events/{id}/orders` — one event's orders, verbatim. */
  | "event-orders"
  /** `GET /v1/events/{id}/tickets` — one event's tickets, verbatim. */
  | "event-tickets"
  /** `GET /v1/events/{id}/check-in-count` — one entry per event DATE. */
  | "event-check-in-counts";

/**
 * How a recorded file is encoded.
 *
 * Absent means `"csv"`, because every file recorded before this field existed
 * is a hand-downloaded Humanitix CSV and the manifest is append-only — an old
 * entry is a snapshot of what was true, and is never rewritten to carry a field
 * invented later.
 */
export type HumanitixFileFormat = "csv" | "json";

/**
 * What a file is used for. `spine` is the attendee export every headline number
 * is counted from; `primary` files contribute fields; `reference` files
 * contribute counts only (the code reports, whose values must never be read
 * into the repo); `redundant` files contribute nothing and exist so the
 * verifier can prove they are strict subsets of the spine.
 */
export type HumanitixFileRole = "spine" | "primary" | "reference" | "redundant";

// ============================================
// manifest.json — GENERATED, append-only
// ============================================

export interface HumanitixManifestFile {
  /**
   * Filename exactly as Humanitix produced it — the sha256 is of that artefact.
   *
   * For an API pull the name is chosen by `fetch-api.ts` rather than by
   * Humanitix, and it may carry one directory level (`orders/<eventId>.json`).
   * **Always forward slashes**, even when the pull ran on Windows: this string
   * is committed and read on Linux CI, so a backslash would make the manifest
   * depend on who ran it.
   */
  file: string;
  report: HumanitixReportKind;
  /**
   * What population the file covers.
   *
   * `account` is the API's own scope and has no CSV equivalent: `GET /v1/events`
   * and `GET /v1/tags` are scoped by the API key, not by an event filter, so
   * calling either of them `all-events` would claim a filter nobody applied.
   */
  scope: "all-events" | "single-event" | "account";
  /** Set only for single-event exports. */
  eventName: string | null;
  /** The report's own status filter, where it has one. */
  filter: "complete" | "cancelled" | "incomplete" | "donation" | null;
  exportedAt: string;
  bytes: number;
  sha256: string;
  /**
   * Encoding of this file. Absent means `"csv"`.
   *
   * Optional rather than required so the 2026-08-17 entry stays valid
   * unchanged: widening the manifest must not force a rewrite of a snapshot.
   */
  format?: HumanitixFileFormat;
  /**
   * JSON only — the API path this file is the verbatim response to.
   *
   * Concrete, not templated: for an API pull the endpoint is the provenance, and
   * `/v1/events/<a>/orders` and `/v1/events/<b>/orders` are different claims.
   * A reader holding one file should not have to reconstruct which event it is
   * about from anything but the file itself.
   *
   * The 24-hex event id inside it is Humanitix's own public identifier and is
   * **lower-case**, which is also what keeps it past the code-shaped-value leak
   * guard in `lib/data/humanitix.test.ts`. Nothing secret ever goes here — no
   * key, no access code, no address.
   */
  endpoint?: string;
  /**
   * JSON only — the length of the collection in the response.
   *
   * The JSON analogue of `rows`, kept as its own field rather than reusing
   * `rows` so that a reader cannot silently treat an item count as a CSV row
   * count and compare the two.
   */
  items?: number;
  /**
   * CSV only — data rows, excluding the header. Use `items` for JSON.
   *
   * Optional since the manifest learned to record API pulls. `rows: 0` on a
   * JSON document would read as "the pull returned nothing"; absence is the
   * only way to say "rows are not a thing this file has".
   */
  rows?: number;
  /** CSV only — a JSON document has no columns. */
  columns?: number;
  /**
   * CSV only — false for the guest list, which Humanitix exports without one.
   *
   * Absent for JSON: `false` would be a claim about the file's shape, and a
   * JSON document does not have header rows to lack.
   */
  hasHeaderRow?: boolean;
  piiClass: HumanitixPiiClass;
  role: HumanitixFileRole;
  /** For `redundant` files, the file they duplicate. */
  redundantWith: string | null;
  note: string;
}

/**
 * How an export session got its files.
 *
 * Absent means `"manual-csv"`: somebody logged in and downloaded the reports.
 * Recorded as a field rather than inferred from file extensions because it is
 * the SESSION that was manual or automated, and the rules that key off it — the
 * spine rule above all — are about the session's shape. A CSV session has one
 * account-wide attendee table that every headline number is counted from; an
 * API pull has 59 per-event files and no spine at all.
 */
export type HumanitixExportMethod = "manual-csv" | "api-v1";

export interface HumanitixManifestExport {
  /**
   * The export date, `YYYY-MM-DD`. Also the vault subdirectory name.
   *
   * An API pull suffixes it: `YYYY-MM-DD-api`. It is a separate id, and the
   * vault directory is a sibling rather than a folder nested inside the CSV
   * export's — see the header of `scripts/humanitix/fetch-api.ts` for why.
   */
  exportId: string;
  source: string;
  exportedAtLocal: string;
  timezone: string;
  vaultPath: string;
  fileCount: number;
  /** How the files were obtained. Absent means `"manual-csv"`. */
  method?: HumanitixExportMethod;
  /**
   * API pulls only — enough to re-run the pull, and nothing more.
   *
   * No key, ever. Humanitix has no audience id to verify the way Mailchimp
   * does — the key IS the account scope — so what stands in for it is `events`,
   * the size of the event list the per-event files were derived from. That
   * number is the population statement: a later pull covering 61 events is a
   * different reading, not a correction of this one.
   */
  api?: {
    baseUrl: string;
    /** Events `GET /v1/events` returned at pull time. The population. */
    events: number;
    /**
     * The endpoint TEMPLATES touched, e.g. `/v1/events/{eventId}/orders`.
     *
     * Templated here and concrete on each file: this list says what the pull
     * did, `files[].endpoint` says what one file is.
     */
    endpoints: string[];
  };
  files: HumanitixManifestFile[];
}

/**
 * A report that is missing, and what its absence costs. Recorded rather than
 * left implicit: the hand-written export note ticks Event summary as exported
 * and the file is not there, which is exactly the kind of discrepancy that
 * becomes invisible once the download folder is cleaned up.
 */
export interface HumanitixKnownGap {
  report: string;
  scope?: "all-events" | "single-event";
  eventName?: string;
  /** Whether the person who ran the export believed they had exported it. */
  claimedExported: boolean;
  present: boolean | "partial";
  reason?: string;
  impact: string;
  action: string;
  blocks?: string[];
  /**
   * The `exportId` that finally supplied what was missing.
   *
   * A closed gap is annotated, never deleted: `report`, `reason`, `impact` and
   * `action` stay exactly as they were written. The record of what was absent,
   * and for how long, is the expensive thing to have learned — deleting the
   * entry would leave the archive looking as though it had always been
   * complete, which is the one shape it must never claim. `present` is not
   * touched either: a report recorded as exported-but-absent is still absent,
   * something else supplied what it held.
   */
  closedBy?: string;
  /** ISO date the gap was closed. Meaningless without `closedBy`. */
  closedAt?: string;
}

export interface HumanitixManifest {
  metadata: {
    note: string;
    vaultEnvVar: string;
    piiClasses: Record<HumanitixPiiClass, string>;
  };
  exports: HumanitixManifestExport[];
  knownGaps: HumanitixKnownGap[];
}

// ============================================
// events.json — GENERATED
// ============================================

export interface HumanitixTicketTypeBreakdown {
  /** The raw Humanitix ticket-type string, unmodified. */
  ticketType: string;
  /** A `segments.json` id. */
  segment: string;
  /** Ticket rows in the attendee spine. */
  tickets: number;
  /** From the earnings report, which does not cover every instance. */
  capacity: number | null;
  sold: number | null;
  earnings: number;
}

export interface HumanitixEventInstance {
  /** `${eventDate}--${slugify(eventName)}` — see `humanitixInstanceKey`. */
  key: string;
  /** Normalised for display: whitespace collapsed, trimmed. */
  eventName: string;
  /** Every raw spelling seen, so a leading-space variant is never lost. */
  eventNameRaw: string[];
  /** ISO date, `YYYY-MM-DD`. */
  eventDate: string;
  eventTime: string;
  timezone: string;
  /**
   * From the Event summary report, which covers every event. Before that report
   * was exported it was recoverable only from the payout report, and only for
   * 38 of 62 — which is why this is still typed nullable.
   */
  humanitixEventId: string | null;
  /** Venue as recorded in Humanitix. First-party; the site's own is separate. */
  venue: string | null;
  organiser: string | null;
  /** Set on the sessions of a multi-date series. */
  seriesKey: string | null;
  /** 1-based position within the series. */
  sessionOrdinal: number | null;
  /** Valid ticket rows. This is what the site's `attendees` field means. */
  registered: number;
  cancelled: number;
  /**
   * Rows flagged "Checked in". Meaningless where `checkInDataPresent` is
   * false — 26 of the 62 instances ran no check-in worth the name, all of
   * 2020 and 2021 among them. Read the flag, never the bare number.
   */
  checkedIn: number;
  checkInDataPresent: boolean;
  capacity: number | null;
  sold: number | null;
  available: number | null;
  /** Net to She Sharp after Humanitix fees. Not gross, not what attendees paid. */
  earnings: number;
  orders: number;
  firstOrderAt: string;
  lastOrderAt: string;
  ticketTypes: HumanitixTicketTypeBreakdown[];
  salesChannels: Record<string, number>;
  /** COUNT ONLY. No code value may ever appear in this repository. */
  discountCodeUses: number;
  /** COUNT ONLY. See the 2026-06-11 leak. */
  accessCodeUses: number;
  donations: { orders: number; amount: number };
  /** Distinct canonical organisations among the rows that answered. */
  organisationsRepresented: number;
  /** How many people answered each custom question. Never the answers. */
  questionsAnswered: Record<string, number>;
}

export interface HumanitixEvents {
  metadata: {
    generatedBy: string;
    exportId: string;
    generatedFrom: string[];
    instances: number;
    eventNames: number;
    currency: string;
    note: string;
  };
  instances: HumanitixEventInstance[];
}

// ============================================
// aggregates.json — GENERATED
// ============================================

export interface HumanitixYearRollup {
  year: number;
  instances: number;
  registered: number;
  checkedIn: number;
  /** False for 2020 and 2021, where no event ran a check-in. */
  checkInDataPresent: boolean;
  /** Null where no instance that year recorded check-ins. */
  checkInRate: number | null;
  earnings: number;
}

export interface HumanitixSegmentRollup {
  segment: string;
  label: string;
  tickets: number;
  share: number;
}

export interface HumanitixAggregates {
  metadata: {
    generatedBy: string;
    exportId: string;
    currency: string;
    definitionsDoc: string;
    /**
     * How a person is identified when grouping. The hashes themselves are NOT
     * committed — 2,920 unsalted sha256 digests are dictionary-attackable by
     * anyone holding a candidate address list.
     */
    personHash: string;
    saltFingerprint: string;
  };
  totals: {
    instances: number;
    eventNames: number;
    registered: number;
    cancelled: number;
    checkedIn: number;
    checkedInTimestamps: number;
    orders: { complete: number; incomplete: number; donation: number };
    earnings: { tickets: number; donations: number; total: number };
    capacity: number;
    sold: number;
    /** How many instances carry a Humanitix Event ID. */
    instancesWithEventId: number;
    payouts: { count: number; total: number; eventsCovered: number };
  };
  byYear: HumanitixYearRollup[];
  bySegment: HumanitixSegmentRollup[];
  byTicketType: { ticketType: string; segment: string; tickets: number }[];
  people: {
    uniqueEmails: number;
    orgAccountsExcluded: number;
    uniquePeople: number;
    repeatDistribution: { instances: number; people: number }[];
    maxInstancesPerPerson: number;
    caveat: string;
  };
  organisations: {
    distinctRawStrings: number;
    distinctCanonical: number;
    rowsAnswered: number;
    rowsNotAnswered: number;
    rowsNullish: number;
    /**
     * Rows where the "employer" was the registrant's own name. Counted, never
     * treated as an organisation, and never printed — six people did this.
     */
    rowsPersonalName: number;
    /** Only organisations at or above `minTickets`, so a one-person employer
     * string cannot identify an individual. */
    minTickets: number;
    top: { id: string; name: string; tickets: number; kind: string }[];
  };
  codes: {
    accessCodesDistinct: number;
    accessCodeUses: number;
    discountCodesDistinct: number;
    discountCodeUses: number;
    note: string;
  };
  marketingOptIn: {
    orders: number;
    uniqueEmails: number;
    firstOrderDate: string;
    lastOrderDate: string;
    caveat: string;
  };
  checkInCoverage: {
    instances: number;
    withCheckIns: number;
    withZeroCheckIns: number;
    firstInstanceWithCheckIns: string;
    /** Listed in full so a future export cannot quietly add one more unnoticed. */
    zeroInstanceKeys: string[];
    /** The share of registrations a scan must reach to count as a check-in operation. */
    floor: number;
    /**
     * Instances with a non-zero scan count that fell below the floor. Recorded
     * rather than dropped: "we discarded one stray scan" and "nobody scanned"
     * are different facts and the reader is entitled to both.
     */
    discardedAsArtefact: { key: string; scanned: number; registered: number }[];
  };
  salesChannels: Record<string, number>;
  caveats: string[];
}

// ============================================
// crosswalk.json — AUTHORED
// ============================================

/**
 * `agrees` — the site figure and the export figure match.
 * `gap` — the site has no figure and the export supplies one.
 * `disagrees` — both exist and differ; changing one is an editorial act.
 * `held` — a difference deliberately not acted on, with the reason in `note`.
 */
export type HumanitixLinkStatus = "agrees" | "gap" | "disagrees" | "held";

export interface HumanitixLink {
  humanitixKey: string;
  siteSlug: string;
  siteId: number;
  siteFile: "events-custom" | "events-v3";
  match: "exact-date" | "hand-verified" | "series-member";
  confidence: "high" | "medium";
  /**
   * Both sides, so a backfill can be reviewed without re-running anything.
   *
   * `site` is what the site published WHEN THE ROW WAS VERIFIED — it is a
   * historical record, not a live mirror, and after a correction lands it will
   * no longer match the site. That is deliberate: a row reading `disagrees`
   * with both figures beside it is what makes a change reviewable a year later,
   * whereas a self-updating field would quietly erase the evidence for it.
   * `export` is checked against the archive on every test run.
   */
  figures: {
    site: { attendees: number | null; checkedIn: number | null };
    export: { registered: number; checkedIn: number | null };
  };
  status: HumanitixLinkStatus;
  /** Required on every row whose status is not `agrees`. */
  note: string;
}

export interface HumanitixSeries {
  seriesKey: string;
  siteSlug: string;
  siteId: number;
  sessionKeys: string[];
  sessions: number;
  /** The site models the series as one record; its figure is the sum. */
  rule: "sum";
  exportRegistered: number;
  exportCheckedIn: number;
  siteAttendees: number | null;
  siteCheckedIn: number | null;
  status: HumanitixLinkStatus;
  note: string;
}

export interface HumanitixCrosswalk {
  metadata: {
    authored: boolean;
    verifiedAt: string;
    verifiedAgainst: string;
    note: string;
  };
  links: HumanitixLink[];
  series: HumanitixSeries[];
  unmatched: {
    humanitixKey: string;
    reason: string;
    action: string;
    note: string;
  }[];
  /** Recorded when Humanitix renames an event between exports. */
  keyAliases: { from: string; to: string; reason: string }[];
}

// ============================================
// segments.json / organisations.json — AUTHORED
// ============================================

export interface HumanitixSegmentRule {
  match: "exact" | "prefix" | "contains" | "regex";
  pattern: string;
  segment: string;
  note?: string;
}

export interface HumanitixSegments {
  metadata: { authored: boolean; note: string };
  segments: { id: string; label: string; definition: string }[];
  /** Evaluated in order; the first match wins. */
  rules: HumanitixSegmentRule[];
}

export interface HumanitixOrganisations {
  metadata: { authored: boolean; note: string };
  /** Strings that mean "did not answer", not an employer. */
  nullish: string[];
  canonical: {
    id: string;
    name: string;
    kind: "company" | "university" | "school" | "government" | "nonprofit" | "self";
    aliases: string[];
    note?: string;
  }[];
  matching: {
    caseSensitive: boolean;
    collapseWhitespace: boolean;
    stripPunctuation: boolean;
    /** Retry "Student, AUT" as "AUT" — the institution is represented either way. */
    stripStudentPrefix: boolean;
    note: string;
  };
}
