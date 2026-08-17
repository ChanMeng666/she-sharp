/**
 * Guards for the committed Mailchimp archive.
 *
 * Run: npx tsx lib/data/mailchimp.test.ts   (CI: .github/workflows/verify.yml)
 *
 * Everything here reads only the committed JSON — no vault, no network, no
 * database — which is the point: the raw exports carry 3,689 people's names,
 * phone numbers and sign-up IP addresses and can never be on CI, so the
 * invariants that CI *can* hold have to be the ones internal to the archive.
 * The vault-dependent reconciliation lives in
 * `scripts/mailchimp/verify-export.ts` and runs locally.
 *
 * The leak guard at the bottom is the reason this file is in CI at all, and it
 * matters more here than it does for the Humanitix archive. That archive is
 * derived from a source that *contains* addresses; this one is derived from a
 * source that is *nothing but* addresses — every row of every input file is a
 * real person's contact details. "No address and no IP reaches
 * lib/data/json/mailchimp/" therefore needs to be a test rather than a habit.
 * It has already earned its place once: the first draft of `manifest.json`
 * named the newsletter mailbox in a prose note, and this check caught it.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { getEventBySlug } from "./events";
import {
  mailchimpAggregates,
  mailchimpCrosswalk,
  mailchimpManifest,
  mailchimpTagRules,
  mailchimpTags,
  mailchimpTagsForSlug,
  resolveTagKind,
  signupsByYear,
  subscribedCount,
} from "./mailchimp";

let failures = 0;

function check(label: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  ok - ${label}`);
  } else {
    failures++;
    console.error(`  FAIL - ${label}${detail ? `: ${detail}` : ""}`);
  }
}

const totals = mailchimpAggregates.totals;
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

// --- Internal consistency ----------------------------------------------------
console.log("\nInternal consistency");

check(
  "the status counts sum to the contact total",
  sum(mailchimpAggregates.byStatus.map((entry) => entry.contacts)) === totals.contacts,
  `${sum(mailchimpAggregates.byStatus.map((entry) => entry.contacts))} vs ${totals.contacts}`
);

const cleaned =
  mailchimpAggregates.byStatus.find((entry) => entry.key === "cleaned")?.contacts ?? 0;
check(
  "the Mailchimp UI count is the contact total minus the cleaned",
  totals.contactsPerMailchimpUi === totals.contacts - cleaned,
  `${totals.contactsPerMailchimpUi} vs ${totals.contacts} - ${cleaned}`
);

check(
  "subscribed plus suppressed is the whole audience",
  totals.subscribed + totals.suppressed === totals.contacts,
  `${totals.subscribed} + ${totals.suppressed} vs ${totals.contacts}`
);

const subscribedRow =
  mailchimpAggregates.byStatus.find((entry) => entry.key === "subscribed")?.contacts ?? -1;
check(
  "the subscribed total agrees with the per-status count",
  totals.subscribed === subscribedRow,
  `${totals.subscribed} vs ${subscribedRow}`
);

check(
  "the accessor reports the same list size as the aggregate",
  subscribedCount() === totals.subscribed
);

check(
  "sign-ups never exceed the audience",
  sum(signupsByYear().map((entry) => entry.contacts)) <= totals.contacts
);

check(
  "consent signals are bounded by the subscribed count",
  mailchimpAggregates.consentSignals.subscribed === totals.subscribed &&
    mailchimpAggregates.consentSignals.withOptinIp <= totals.subscribed &&
    mailchimpAggregates.consentSignals.optinEqualsConfirm <= totals.subscribed
);

check(
  "the archive ships its caveats with the data",
  mailchimpAggregates.caveats.length >= 5
);

// --- Tag vocabulary ----------------------------------------------------------
console.log("\nTag vocabulary");

check(
  "the distinct tag count matches the list",
  mailchimpTags.distinct === mailchimpTags.tags.length
);

const fragments = mailchimpTags.tags.filter((tag) => tag.kind === "fragment");
check(
  "distinctReal is distinct minus the export artefacts",
  mailchimpTags.distinctReal === mailchimpTags.distinct - fragments.length
);

check(
  "the aggregate tag total counts only real tags",
  totals.distinctTags === mailchimpTags.distinctReal,
  `${totals.distinctTags} vs ${mailchimpTags.distinctReal}`
);

check(
  "`fragment` and `fromMalformedCellOnly` agree on every tag",
  mailchimpTags.tags.every(
    (tag) => (tag.kind === "fragment") === tag.fromMalformedCellOnly
  )
);

check(
  "every tag's per-status counts sum to its contact count",
  mailchimpTags.tags.every(
    (tag) => sum(Object.values(tag.byStatus)) === tag.contacts
  )
);

check(
  "no tag claims more contacts than the audience holds",
  mailchimpTags.tags.every((tag) => tag.contacts <= totals.contacts)
);

const kinds = new Set(mailchimpTagRules.kinds.map((kind) => kind.id));
check(
  "every tag's kind is one the rules define",
  mailchimpTags.tags.every((tag) => kinds.has(tag.kind)),
  [...new Set(mailchimpTags.tags.map((tag) => tag.kind))].filter((k) => !kinds.has(k)).join(", ")
);

check(
  "the rule file defines no kind it never uses",
  mailchimpTagRules.kinds.every((kind) =>
    mailchimpTags.tags.some((tag) => tag.kind === kind.id)
  )
);

check(
  "resolveTagKind agrees with the vocabulary, and is null off it",
  resolveTagKind(mailchimpTags.tags[0].tag) === mailchimpTags.tags[0].kind &&
    resolveTagKind("Event: an event that does not exist") === null
);

// --- Crosswalk ---------------------------------------------------------------
console.log("\nCrosswalk");

const eventTags = mailchimpTags.tags.filter((tag) => tag.kind === "event");
const linkedTags = new Set(mailchimpCrosswalk.links.map((link) => link.tag));
const excusedTags = new Set(mailchimpCrosswalk.unmatched.map((row) => row.tag));

check(
  `every Event: tag is linked or explicitly unmatched (${eventTags.length} tags)`,
  eventTags.every((tag) => linkedTags.has(tag.tag) || excusedTags.has(tag.tag)),
  eventTags
    .filter((tag) => !linkedTags.has(tag.tag) && !excusedTags.has(tag.tag))
    .map((tag) => tag.tag)
    .join(" | ")
);

check(
  "no tag is both linked and unmatched",
  [...linkedTags].every((tag) => !excusedTags.has(tag))
);

const stale = mailchimpCrosswalk.links.filter((link) => !getEventBySlug(link.siteSlug));
check(
  "every crosswalk slug still resolves to a site event",
  stale.length === 0,
  stale.map((link) => link.siteSlug).join(", ")
);

check(
  "the crosswalk links only tags the export contains",
  mailchimpCrosswalk.links.every((link) =>
    mailchimpTags.tags.some((tag) => tag.tag === link.tag)
  )
);

// The multi-tag record is what stops somebody summing tags as if they were
// events. If it drifted out of step with the links it would stop doing that.
const perSlug = new Map<string, number>();
for (const link of mailchimpCrosswalk.links) {
  perSlug.set(link.siteSlug, (perSlug.get(link.siteSlug) ?? 0) + 1);
}
const actualMulti = [...perSlug.entries()]
  .filter(([, count]) => count > 1)
  .map(([slug]) => slug)
  .sort();
const recordedMulti = mailchimpCrosswalk.multiTagEvents.map((entry) => entry.siteSlug).sort();
check(
  "multiTagEvents lists exactly the events carrying more than one tag",
  JSON.stringify(actualMulti) === JSON.stringify(recordedMulti),
  `actual ${actualMulti.join(",")} vs recorded ${recordedMulti.join(",")}`
);

check(
  "multiTagEvents records the right tag count for each",
  mailchimpCrosswalk.multiTagEvents.every(
    (entry) => perSlug.get(entry.siteSlug) === entry.tags
  )
);

const someSlug = mailchimpCrosswalk.links[0].siteSlug;
check(
  "mailchimpTagsForSlug returns the tags the crosswalk points at",
  mailchimpTagsForSlug(someSlug).length === perSlug.get(someSlug) &&
    mailchimpTagsForSlug("a-slug-that-does-not-exist").length === 0
);

// --- Manifest ----------------------------------------------------------------
console.log("\nManifest");

check("the manifest records at least one export", mailchimpManifest.exports.length > 0);

check(
  "every recorded file has a sha256 and a row count",
  mailchimpManifest.exports.every((entry) =>
    entry.files.every((file) => /^[0-9a-f]{64}$/.test(file.sha256) && file.rows >= 0)
  )
);

check(
  "fileCount matches the files listed",
  mailchimpManifest.exports.every((entry) => entry.fileCount === entry.files.length)
);

check(
  "the manifest names the vault env var, so a reader can find the raw data",
  mailchimpManifest.metadata.vaultEnvVar === "MAILCHIMP_VAULT_DIR"
);

// A gap recorded as exported-but-absent is the one worth keeping: it is the
// difference between what an export session believed it captured and what it
// captured. Losing that distinction is how a gap becomes invisible.
check(
  "known gaps distinguish 'not taken' from 'taken but missing'",
  mailchimpManifest.knownGaps.some(
    (gap) => gap.claimedExported === true && gap.present === false
  )
);

check(
  "every known gap says what it blocks or that it blocks nothing",
  mailchimpManifest.knownGaps.every((gap) => gap.impact.length > 0 && gap.action.length > 0)
);

const spine = mailchimpManifest.exports.flatMap((entry) =>
  entry.files.filter((file) => file.role === "spine")
);
check(
  "exactly one file per export is the spine, and it is the subscribed list",
  spine.length === mailchimpManifest.exports.length &&
    spine.every((file) => file.status === "subscribed")
);

// --- Leak guard --------------------------------------------------------------
console.log("\nLeak guard");

const ARCHIVE_DIR = join(__dirname, "json", "mailchimp");
const archiveFiles = readdirSync(ARCHIVE_DIR).filter((name) => name.endsWith(".json"));

check("the archive directory is not empty", archiveFiles.length > 0);

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
/**
 * Any dotted quad.
 *
 * Deliberately not narrowed to valid octets. A near-miss like `999.1.2.3` is
 * not a real address, but it is also not a number this archive has any reason
 * to contain, so treating it as a hit costs nothing and closes the gap where a
 * malformed IP slips through a stricter pattern.
 */
const IPV4 = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
/** Mailchimp's internal per-contact identifiers. Pseudonymous, but per-person. */
const CONTACT_ID_KEYS = new Set(["leid", "euid"]);

/**
 * Field names that would mean a person, not a count, had reached the archive.
 *
 * `label` is exempt on organisation records: those are the names of employers,
 * and the builder already routes anything that looks like a registrant's own
 * name through `isPersonalName()` and drops it. `key` is exempt because every
 * bucket has one and they are domains, statuses and years.
 */
const FORBIDDEN_KEYS = new Set([
  "email",
  "emails",
  "emailAddress",
  "emailHash",
  "mobile",
  "phone",
  "firstName",
  "lastName",
  "address",
  "birthday",
  "dob",
  "dateOfBirth",
  "ip",
  "optinIp",
  "confirmIp",
  "secondaryEmail",
  "leid",
  "euid",
]);

for (const file of archiveFiles) {
  const raw = readFileSync(join(ARCHIVE_DIR, file), "utf8");

  const email = raw.match(EMAIL);
  check(
    `${file} contains no email address`,
    email === null,
    email ? `found ${email[0].replace(/./g, "*")}` : undefined
  );

  const ip = raw.match(IPV4);
  check(
    `${file} contains no IP address`,
    ip === null,
    ip ? `found ${ip[0].replace(/\d/g, "*")}` : undefined
  );

  const offendingKeys = new Set<string>();
  const walk = (node: unknown) => {
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (!node || typeof node !== "object") return;

    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      if (FORBIDDEN_KEYS.has(key) || CONTACT_ID_KEYS.has(key.toLowerCase())) {
        offendingKeys.add(key);
      }
      walk(value);
    }
  };
  walk(JSON.parse(raw));

  check(
    `${file} carries no person-shaped field`,
    offendingKeys.size === 0,
    [...offendingKeys].join(", ")
  );
}

// The k-anonymity floor is the difference between "an aggregate" and "a list of
// people with extra steps". A bucket of one names somebody.
console.log("\nK-anonymity floor");

const floor = mailchimpAggregates.domains.floor;
check("the archive declares a floor of at least 5", floor >= 5);

check(
  "no named email domain sits below the floor",
  mailchimpAggregates.domains.top.every((entry) => entry.contacts >= floor),
  mailchimpAggregates.domains.top
    .filter((entry) => entry.contacts < floor)
    .map((entry) => entry.key)
    .join(", ")
);

check(
  "no named organisation sits below the floor",
  mailchimpAggregates.organisations.top.every(
    (entry) => entry.contacts >= mailchimpAggregates.organisations.floor
  )
);

check(
  "no named country or region sits below the floor",
  [...mailchimpAggregates.geo.countries, ...mailchimpAggregates.geo.regions].every(
    (entry) => entry.contacts >= floor
  )
);

check(
  "the count of buckets suppressed by the floor is reported, not hidden",
  mailchimpAggregates.domains.belowFloor > 0 &&
    mailchimpAggregates.domains.distinct >
      mailchimpAggregates.domains.top.length
);

console.log("");
if (failures === 0) {
  console.log("ok - every Mailchimp archive check passed");
  process.exit(0);
}
console.error(`${failures} check(s) failed`);
process.exit(1);
