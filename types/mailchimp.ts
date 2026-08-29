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

/**
 * How a recorded file is encoded.
 *
 * Absent means `"csv"`, because every file recorded before this field existed
 * is a hand-downloaded Mailchimp CSV and the manifest is append-only — an old
 * entry is a snapshot of what was true, and is never rewritten to carry a field
 * invented later.
 *
 * `"binary"` is an image: the gallery files an API pull inventories but does not
 * contain, and the images a campaign body referenced from somewhere else. A
 * binary row has no header, no rows and no columns; its `items` is `1`, because
 * one file is one image and `0` would read as "the pull returned nothing".
 */
export type MailchimpFileFormat = "csv" | "json" | "binary";

/**
 * What an archived image is, and what a re-host should do with it.
 *
 * Written by `scripts/mailchimp/campaign-images.ts`. `content-not-in-gallery`
 * is the one that carries information beyond bookkeeping: it says the file
 * manager's inventory is NOT a complete list of the account's images, so
 * "we downloaded the gallery" was never the same claim as "we have the
 * newsletters' images".
 */
export type MailchimpImageClass =
  | "gallery-original"
  | "mailchimp-chrome"
  | "content-not-in-gallery"
  | "third-party";

export interface MailchimpManifestFile {
  /** Filename exactly as Mailchimp produced it, including the export hash. */
  file: string;
  /** Which export this is: `audience` or `archived`. */
  report: string;
  /** The audience it came from. There is only one: `She#`. */
  scope: string;
  /**
   * The subscription status this file holds, or `n/a`.
   *
   * A manual export partitions the audience *by status*, so for a CSV the
   * status IS the file. An API response is scoped by *endpoint* instead —
   * `/lists/<id>/growth-history` has no status at all — and inventing one for
   * it would make the shape claim something the data does not support.
   */
  status: MailchimpStatus | "n/a";
  /**
   * Encoding of this file. Absent means `"csv"`.
   *
   * Optional rather than required so the 2026-08-17 entry stays valid
   * unchanged: widening the manifest must not force a rewrite of a snapshot.
   */
  format?: MailchimpFileFormat;
  /**
   * JSON only — the API path this file is the verbatim response to.
   *
   * Recorded because for an API pull the endpoint is the provenance: it is the
   * only thing that says what the numbers inside are counts *of*, the way a
   * CSV's status filename does.
   *
   * Deliberately absent on a `"binary"` row. An image is not the response to an
   * endpoint — its bytes came from a CDN — and naming one anyway would be the
   * same lie as `rows: 0` on a JSON document.
   */
  endpoint?: string;
  /**
   * JSON and binary — the length of the collection, or `1` for one file.
   *
   * The JSON analogue of `rows`, kept as its own field rather than reusing
   * `rows` so that a reader cannot silently treat an item count as a CSV row
   * count and compare the two.
   */
  items?: number;
  /**
   * Binary only — the host the bytes were fetched from. **Never the URL.**
   *
   * The rule, not a habit. Four of the images a newsletter embedded are Slack
   * emoji whose filenames end `1f49c@2x.png`, and the archive's leak guard
   * (`lib/data/mailchimp.test.ts`) matches an `@` between word characters as an
   * email address. A URL in this file would fail CI with a masked message
   * indistinguishable from a real address leak, on a check whose whole value is
   * that it never cries wolf. The full URL lives in the vault's
   * `campaign-images.json`, which is never committed.
   */
  sourceHost?: string;
  /** Binary only — see {@link MailchimpImageClass}. */
  imageClass?: MailchimpImageClass;
  /**
   * Binary only — how many times the sent campaigns reference this image.
   *
   * `0` is meaningful and common: a third of the gallery was never used by any
   * surviving campaign, and this is the only place that is written down.
   */
  referencedBy?: number;
  /**
   * Optional: a JSON document has no header row.
   *
   * `false` would be a claim about the file's shape; absent is the honest
   * statement that header rows are not a thing this file has.
   */
  hasHeaderRow?: boolean;
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
  /** CSV only — data rows, excluding the header. Use `items` for JSON. */
  rows?: number;
  /** CSV only — a JSON document has no columns. */
  columns?: number;
}

/**
 * How an export session got its files.
 *
 * Absent means `"manual-csv"`: somebody logged in and downloaded the five
 * files. Recorded as a field rather than inferred from the file extensions
 * because it is the session that was manual or automated, and the rules that
 * key off it — the spine rule, above all — are about the session's shape.
 */
export type MailchimpExportMethod = "manual-csv" | "api-v3";

export interface MailchimpManifestExport {
  /** `YYYY-MM-DD` of the export session. Names the vault directory. */
  exportId: string;
  source: string;
  exportedAtLocal: string;
  timezone: string;
  /** Path relative to the repo root, for the in-repo cache. */
  vaultPath: string;
  fileCount: number;
  /** How the files were obtained. Absent means `"manual-csv"`. */
  method?: MailchimpExportMethod;
  /**
   * API pulls only — enough to re-run the pull, and nothing more.
   *
   * Deliberately three fields: the host the API key's datacentre suffix
   * resolved to, the audience id that was *verified* against `GET /lists`
   * rather than pasted from a dashboard, and the endpoints actually touched.
   * No key and no address, ever — the same rule as everywhere else in this
   * archive, and the reason this field can be committed at all.
   */
  api?: {
    baseUrl: string;
    listId: string;
    endpoints: string[];
  };
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
  /**
   * The `exportId` that finally supplied what was missing.
   *
   * A closed gap is annotated, never deleted: `report`, `reason`, `impact` and
   * `action` stay exactly as they were written. The record of what was absent,
   * and for how long, is the expensive thing to have learned — deleting the
   * entry would leave the archive looking as though it had always been
   * complete, which is the one shape it must never claim.
   */
  closedBy?: string;
  /** ISO date the gap was closed. Meaningless without `closedBy`. */
  closedAt?: string;
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
 * The account has 243 distinct tags and zero saved segments, so the tag column
 * carries all of the audience's structure — but it was written by two sources
 * with four different conventions over seven years: people typing tags by hand,
 * and a live Humanitix→Mailchimp integration writing them automatically. The
 * kinds below are the shape that fell out of reading all of them.
 *
 * The integration matters for more than provenance. It is connected to the
 * `She#` audience, set to sync ALL events, and has "sync contacts who haven't
 * opted-in" ENABLED, so **the audience grows between exports without anybody
 * touching Mailchimp**. Every count in this archive is therefore a reading at
 * `exportId`, not a current figure, and the gap widens on its own.
 */
export type MailchimpTagKind =
  /**
   * `Event: <title>` — the person is associated with one event.
   *
   * Written by the Humanitix→Mailchimp integration, not pasted in by hand:
   * Humanitix pushes each event's registrants into the audience and tags them.
   * That is the origin of the `nonsubscribed` contacts, who reached the
   * audience by buying a ticket and never opting in to anything.
   *
   * It still does NOT say they attended — Humanitix is authoritative for that.
   * A registration is what the integration syncs; turning up is not.
   */
  | "event"
  /**
   * `Ticket Type: <name>` — which ticket they held. NOT proof of attendance.
   *
   * Same origin as `event`: the integration, not a hand-pasted ticket list.
   */
  | "ticket-type"
  /** `Campaign Pasted Segment - <date>` — Mailchimp's own artefact of a one-off paste. */
  | "campaign-segment"
  /** A bare year (`2022`) marking a bulk import cohort. */
  | "cohort-year"
  /**
   * A hand-typed label from before the `Event:` convention.
   *
   * One bucket on purpose. These 32 strings name events, partners, campaigns
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
   * cell. 14 of the 243 distinct strings in the 2026-08-17 export are the
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

// ---------------------------------------------------------------------------
// Campaigns — what was sent, and how the list moved
// ---------------------------------------------------------------------------

/**
 * One campaign, reduced to counts and its two already-public labels.
 *
 * The CSV export could not produce any of this: it records the campaign a
 * person left through, so a campaign nobody left was invisible. These come from
 * `GET /campaigns?status=sent` joined to `GET /reports`, and they are a total
 * rather than a floor.
 *
 * `title` and `subjectLine` are the only free text in the committed archive.
 * Both are already published — every subject line here appears on the account's
 * public campaign archive — and `build-campaigns.ts` re-runs the CI leak
 * guard's own email and IP patterns over both before writing.
 */
export interface MailchimpCampaign {
  /**
   * Mailchimp's campaign id: ten hex characters.
   *
   * A campaign id and a member id are both hex, and telling them apart is the
   * whole difference between a send and a person: a member id is the 32-char
   * md5 of a lower-cased address. Nothing in this archive may hold one, so the
   * length is checked rather than assumed.
   */
  id: string;
  /** Send time, verbatim from the API. UTC, with its offset. */
  sentAt: string;
  /** The internal campaign name. `"untitled"` for three early sends. */
  title: string;
  /** The subject line as recipients saw it. */
  subjectLine: string;
  /**
   * What Mailchimp ATTEMPTED, not what arrived.
   *
   * The bounces below come out of this number, not on top of it. Named
   * `emailsSent` after Mailchimp's own field — note that `emails` is a key the
   * archive leak guard forbids, and this is one keystroke away from it.
   */
  emailsSent: number;
  /**
   * Recipients who opened at least once.
   *
   * **A count, not a rate.** Mailchimp also returns `open_rate` as a fraction
   * between 0 and 1, and reading one as the other yields a number that looks
   * entirely plausible in a funder report.
   *
   * Inflated after 2021 by Apple Mail Privacy Protection, which pre-fetches
   * images and so registers an open nobody performed. Use
   * {@link proxyExcludedUniqueOpens} for anything that crosses that boundary.
   */
  uniqueOpens: number;
  /**
   * The same count with proxy pre-fetches removed — Mailchimp's own correction.
   *
   * Equal to `uniqueOpens` for every campaign sent before 2022, because there
   * was no proxy to exclude yet. That equality is why the pair is committed
   * rather than just the corrected figure: the two series diverging IS the
   * evidence of where the boundary falls.
   */
  proxyExcludedUniqueOpens: number;
  /** Every open, including repeats by the same recipient. */
  opensTotal: number;
  /**
   * Recipients who clicked at least once — Mailchimp's `unique_subscriber_clicks`.
   *
   * Deliberately NOT its `unique_clicks`, which counts unique clicks per link
   * summed across links and can therefore exceed the number of recipients: a
   * two-person send in this account reports three of them, and the one variate
   * campaign reports zero while 47 people clicked. Only this field is a count
   * of people, and only a count of people may be divided by `emailsSent`.
   */
  uniqueClicks: number;
  /** Every click, including repeats and multiple links. */
  clicksTotal: number;
  /** Permanent failures. These become `cleaned` contacts. */
  hardBounces: number;
  /** Temporary failures. The address stays on the list. */
  softBounces: number;
  /** Recipients who left through this campaign. */
  unsubscribed: number;
  /** Spam complaints. Four in the account's whole history. */
  abuseReports: number;
}

/** One calendar year of sending, bucketed by the UTC year of `sentAt`. */
export interface MailchimpCampaignYear {
  year: string;
  campaigns: number;
  emailsSent: number;
  uniqueOpens: number;
  proxyExcludedUniqueOpens: number;
  uniqueClicks: number;
  unsubscribed: number;
}

/**
 * One month of the audience's size, from `GET /lists/{id}/growth-history`.
 *
 * **`subscribed` is a STOCK, not a flow** — subscribed members at the END of
 * that month, not that month's additions. The series is therefore not
 * monotonic: it peaks in November 2025 and declines through 2026.
 *
 * Three fields out of the twelve Mailchimp returns. `existing`, `imports` and
 * `optins` — the documented growth fields, and the ones a reader would reach
 * for first — are hard zero in all 86 months of this account and are dropped
 * rather than committed, because a committed zero gets charted.
 */
export interface MailchimpGrowthPoint {
  /** `YYYY-MM`. The series is gapless and monthly. */
  month: string;
  /** Subscribed members at month end. The list size. */
  subscribed: number;
  /** Contacts in `unsubscribed` status at month end. Also a stock. */
  unsubscribed: number;
  /** Contacts removed after a hard bounce, at month end. Also a stock. */
  cleaned: number;
}

export interface MailchimpCampaigns {
  metadata: {
    generatedBy: string;
    exportId: string;
    definitionsDoc: string;
    /** Why free text is committed here at all, and what guards it. */
    labels: string;
  };
  /**
   * Whole-account figures, over every campaign that reached at least one person.
   *
   * INCLUDES the campaigns held below the k-anonymity floor. A total is not a
   * re-identification vector, and suppressing them would understate the
   * account's real reach — the opposite of what the floor is for. So this, not
   * a sum over `campaigns.sent`, is the number for "how much mail went out".
   */
  totals: {
    campaignsSent: number;
    emailsSent: number;
    uniqueOpens: number;
    proxyExcludedUniqueOpens: number;
    opensTotal: number;
    uniqueClicks: number;
    clicksTotal: number;
    hardBounces: number;
    softBounces: number;
    unsubscribed: number;
    abuseReports: number;
    /** ISO timestamp of the first send. */
    firstSend: string;
    /** ISO timestamp of the last send in this pull. */
    lastSend: string;
  };
  campaigns: {
    /** Minimum recipients before a campaign is named. Five. */
    floor: number;
    /** Every campaign in the pull: `sent.length + belowFloor + unsent`. */
    distinct: number;
    /**
     * Campaigns Mailchimp calls sent that reached nobody.
     *
     * Zero in this account. The field exists so that a rebuild where it is not
     * zero cannot be mistaken for campaigns quietly dropped by the floor.
     */
    unsent: number;
    /**
     * Campaigns sent to one to four people: counted, never named.
     *
     * Reported rather than hidden, mirroring `aggregates.domains.belowFloor`.
     * A send to fewer than five people is a description of those people, and in
     * this account such campaigns are usually titled after one of them.
     */
    belowFloor: number;
    /** Named campaigns, oldest first. */
    sent: MailchimpCampaign[];
  };
  bySendYear: MailchimpCampaignYear[];
  /** The list-size series, oldest first, monthly and gapless. */
  growth: MailchimpGrowthPoint[];
  /** Plain-English traps, shipped inside the data so a reader cannot miss them. */
  caveats: string[];
}
