/**
 * Types for the committed Mailchimp audience archive.
 *
 * Every field here describes a *count* or a *label*. Nothing in this file
 * describes a person, and nothing may be added that does. The raw export is
 * 3,689 rows of names, addresses, phone numbers and sign-up IPs; the committed
 * archive is what survives after all of that is thrown away, which is why it is
 * safe to have in a public repository at all.
 *
 * Field comments carry the trap rather than restating the name, on the same
 * principle as `types/humanitix.ts`: the rules exist because reading the field
 * name alone led someone to the wrong number.
 *
 * See `docs/development/MAILCHIMP_ARCHIVE.md`.
 */

// ---------------------------------------------------------------------------
// Manifest — provenance for files that are never committed
// ---------------------------------------------------------------------------

/**
 * How much of a person a raw file exposes.
 *
 * Deliberately the same vocabulary as `types/humanitix.ts`, minus the classes
 * no Mailchimp report produces (`access-secret`, `financial-secret`) and plus
 * one Humanitix has no equivalent of.
 */
export type MailchimpPiiClass =
  | "none"
  | "aggregate"
  | "email-only"
  | "person-identifying"
  | "person-sensitive"
  | "person-network";

/** Which Mailchimp subscription status a file holds. Mailchimp's own words. */
export type MailchimpStatus =
  | "subscribed"
  | "unsubscribed"
  | "nonsubscribed"
  | "cleaned"
  | "archived";

export interface MailchimpManifestFile {
  /** Filename exactly as Mailchimp produced it, including the export hash. */
  file: string;
  /** Which export this is: `audience` or `archived`. */
  report: string;
  /** The audience it came from. There is only one: `She#`. */
  scope: string;
  /** The subscription status this file holds. The files partition the audience. */
  status: MailchimpStatus;
  hasHeaderRow: boolean;
  piiClass: MailchimpPiiClass;
  /** `spine` for the subscribed list; `primary` for the rest. */
  role: string;
  redundantWith: string | null;
  /** What the file is authoritative for, and what it must not be read as. */
  note: string;
  /**
   * When the export was taken.
   *
   * Unlike Humanitix, Mailchimp does not stamp the moment into the filename —
   * the hex suffix identifies the export *job*, not its time. So this is the
   * export session's date, recorded by hand, and it is a date rather than a
   * timestamp on purpose: claiming a precision the filename cannot support
   * would make a guess look like a measurement.
   */
  exportedAt: string;
  bytes: number;
  sha256: string;
  /** Data rows, excluding the header. */
  rows: number;
  columns: number;
}

export interface MailchimpManifestExport {
  /** `YYYY-MM-DD` of the export session. Names the vault directory. */
  exportId: string;
  source: string;
  exportedAtLocal: string;
  timezone: string;
  /** Path relative to the repo root, for the in-repo cache. */
  vaultPath: string;
  fileCount: number;
  files: MailchimpManifestFile[];
}

/**
 * Something the export does not contain.
 *
 * `claimedExported: true` with `present: false` is the case worth having a
 * field for: the operator believed they took it and the file is not there.
 */
export interface MailchimpKnownGap {
  report: string;
  scope?: string;
  claimedExported: boolean;
  present: boolean | "partial";
  reason?: string;
  impact: string;
  action: string;
  blocks?: string[];
}

export interface MailchimpManifest {
  metadata: {
    note: string;
    vaultEnvVar: string;
    piiClasses: Record<string, string>;
  };
  exports: MailchimpManifestExport[];
  knownGaps: MailchimpKnownGap[];
}

// ---------------------------------------------------------------------------
// Tag vocabulary
// ---------------------------------------------------------------------------

/**
 * What a Mailchimp tag actually records.
 *
 * The account has 250 distinct tags and zero saved segments, so the tag column
 * carries all of the audience's structure — but four different people applied
 * tags over seven years with four different conventions, and the kinds below
 * are the shape that fell out of reading all of them.
 */
export type MailchimpTagKind =
  /** `Event: <title>` — the person is associated with one event. */
  | "event"
  /** `Ticket Type: <name>` — which ticket they held. NOT proof of attendance. */
  | "ticket-type"
  /** `Campaign Pasted Segment - <date>` — Mailchimp's own artefact of a one-off paste. */
  | "campaign-segment"
  /** A bare year (`2022`) marking a bulk import cohort. */
  | "cohort-year"
  /**
   * A hand-typed label from before the `Event:` convention.
   *
   * One bucket on purpose. These 36 strings name events, partners, campaigns
   * and audiences without distinguishing between them, and inventing four
   * kinds to sort them would claim a structure the tagger never applied. Each
   * rule's `note` says which it is.
   */
  | "label"
  /**
   * Not a tag anybody applied — an artefact of Mailchimp's own broken export.
   *
   * Mailchimp truncates a tag at 100 characters, and when the cut lands inside
   * a quoted tag it does not re-close the quote, corrupting the rest of the
   * cell. 21 of the 250 distinct strings in the 2026-08-17 export are the
   * wreckage: bare `online`, `July 16th`, `12-2pm NZT`, and pairs of real tags
   * glued together. All of them trace to the F&P Hackathon workshop ticket
   * names, which are the only ones long enough to hit the limit.
   *
   * Assigned by PROVENANCE, not by pattern: a tag is a fragment when every one
   * of its occurrences came from a cell that failed the round-trip check. That
   * way the classification self-heals if Mailchimp ever fixes the export, and
   * no rule has to guess whether an odd-looking string is real.
   */
  | "fragment";

/** An ordered, first-match-wins classification rule. Hand-authored. */
export interface MailchimpTagRule {
  match: "prefix" | "exact" | "regex" | "contains";
  pattern: string;
  kind: MailchimpTagKind;
  note?: string;
}

export interface MailchimpTagRules {
  metadata: { authored: true; note: string };
  kinds: { id: MailchimpTagKind; label: string; definition: string }[];
  rules: MailchimpTagRule[];
}

export interface MailchimpTag {
  /** The tag string, exactly as Mailchimp holds it. */
  tag: string;
  kind: MailchimpTagKind;
  /** Contacts carrying this tag, across every status. */
  contacts: number;
  /** The same, split by status — a tag can outlive the people who carried it. */
  byStatus: Record<string, number>;
  /**
   * True when every occurrence came from a cell with broken quoting.
   *
   * Always true for `kind: "fragment"` and always false otherwise — the two
   * are the same fact, kept as separate fields so a reader scanning `kind` and
   * a reader scanning provenance both find it.
   */
  fromMalformedCellOnly: boolean;
}

export interface MailchimpTags {
  metadata: { generatedBy: string; exportId: string; note: string };
  /** Distinct strings in the export, artefacts included. */
  distinct: number;
  /** Distinct strings that are real tags — `distinct` minus the fragments. */
  distinctReal: number;
  tags: MailchimpTag[];
}

// ---------------------------------------------------------------------------
// Crosswalk — tag to site event
// ---------------------------------------------------------------------------

export interface MailchimpCrosswalkLink {
  /** The full `Event: …` tag string. */
  tag: string;
  /**
   * The site event slug.
   *
   * The slug alone, deliberately: it is the stable key, `getEventBySlug()`
   * resolves everything else, and hand-copying numeric ids into 64 rows only
   * adds transcription errors that nothing would catch. `verify-export.ts`
   * checks every slug still resolves.
   */
  siteSlug: string;
  match: "hand-verified" | "title-exact" | "title-substring";
  confidence: "high" | "medium" | "low";
  note?: string;
}

export interface MailchimpCrosswalk {
  metadata: {
    authored: true;
    verifiedAt: string;
    verifiedAgainst: string;
    note: string;
  };
  links: MailchimpCrosswalkLink[];
  /** Tags with no site event, each with a reason. Never silently dropped. */
  unmatched: { tag: string; reason: string }[];
  /**
   * Site events carrying more than one tag.
   *
   * Recorded because the obvious mistake is to treat tags as events. Five of
   * She Sharp's events were tagged twice — an early short tag and a later,
   * fuller one — so counting tagged contacts per tag and summing would count
   * those people twice.
   */
  multiTagEvents: { siteSlug: string; tags: number; note: string }[];
}

// ---------------------------------------------------------------------------
// Aggregates
// ---------------------------------------------------------------------------

/** A count keyed by a label, with the k-anonymity floor already applied. */
export interface MailchimpCount {
  key: string;
  label?: string;
  contacts: number;
}

export interface MailchimpAggregates {
  metadata: {
    generatedBy: string;
    exportId: string;
    definitionsDoc: string;
    /** States that no address hash is written here, and why. */
    personHash: string;
  };
  totals: {
    /** Distinct addresses across every status file. */
    contacts: number;
    /**
     * What Mailchimp's own UI reports.
     *
     * It EXCLUDES `cleaned`. 3,689 − 544 = 3,145, which is the number on the
     * dashboard, and the discrepancy is the single most likely way to
     * mis-state this archive.
     */
    contactsPerMailchimpUi: number;
    /** The only figure that is a mailing list: contacts in `subscribed`. */
    subscribed: number;
    /** Everybody who may never be marketed to again. */
    suppressed: number;
    distinctTags: number;
    distinctDomains: number;
    firstOptin: string;
    lastOptin: string;
  };
  byStatus: MailchimpCount[];
  /** Sign-ups per calendar year of `OPTIN_TIME`. Not list size in that year. */
  byOptinYear: MailchimpCount[];
  /** `LAST_CHANGED` per year. A bulk tag operation moves this; a person need not. */
  byLastChangedYear: MailchimpCount[];
  /** Mailchimp's 1–5 engagement star rating, as held at export time. */
  memberRating: MailchimpCount[];
  /** Why people left. Only present for `unsubscribed`; 392 of 803 gave none. */
  unsubReasons: MailchimpCount[];
  /** Country and region codes, present for well under half the audience. */
  geo: { countries: MailchimpCount[]; regions: MailchimpCount[] };
  /** Email domains at or above the k-anonymity floor. */
  domains: { floor: number; distinct: number; belowFloor: number; top: MailchimpCount[] };
  /** Self-reported employers, canonicalised through the shared registry. */
  organisations: {
    floor: number;
    rowsAnswered: number;
    rowsNullish: number;
    distinctCanonical: number;
    top: MailchimpCount[];
  };
  /** How much of the audience carries a tag at all. */
  tagCoverage: { tagged: number; untagged: number; byKind: MailchimpCount[] };
  /**
   * Consent evidence, stated as counts rather than as a verdict.
   *
   * `optinEqualsConfirm` is the number of rows where the two timestamps are
   * identical — the signature of a single-opt-in import, not of a confirmed
   * double opt-in.
   */
  consentSignals: {
    subscribed: number;
    withOptinIp: number;
    optinEqualsConfirm: number;
    withConfirmIp: number;
    taggedEventOrTicketOnly: number;
    untagged: number;
    caveat: string;
  };
  /** Plain-English traps, shipped inside the data so a reader cannot miss them. */
  caveats: string[];
}
