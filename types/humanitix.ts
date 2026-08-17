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

/** Which Humanitix report a vault file came from. */
export type HumanitixReportKind =
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
  | "affiliate-codes-orders";

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
  /** Filename exactly as Humanitix produced it — the sha256 is of that artefact. */
  file: string;
  report: HumanitixReportKind;
  scope: "all-events" | "single-event";
  /** Set only for single-event exports. */
  eventName: string | null;
  /** The report's own status filter, where it has one. */
  filter: "complete" | "cancelled" | "incomplete" | "donation" | null;
  exportedAt: string;
  bytes: number;
  sha256: string;
  /** Data rows, excluding the header. */
  rows: number;
  columns: number;
  /** False for the guest list, which Humanitix exports without a header row. */
  hasHeaderRow: boolean;
  piiClass: HumanitixPiiClass;
  role: HumanitixFileRole;
  /** For `redundant` files, the file they duplicate. */
  redundantWith: string | null;
  note: string;
}

export interface HumanitixManifestExport {
  /** The export date, `YYYY-MM-DD`. Also the vault subdirectory name. */
  exportId: string;
  source: string;
  exportedAtLocal: string;
  timezone: string;
  vaultPath: string;
  fileCount: number;
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
