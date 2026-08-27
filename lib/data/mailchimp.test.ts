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
  campaignsSentBetween,
  listSizeByMonth,
  mailchimpAggregates,
  mailchimpCampaigns,
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

// A CSV is measured in rows and a JSON document in items, so one check cannot
// read both fields. `file.rows >= 0` on a JSON file would be `undefined >= 0`
// — `false` at runtime and legal to the compiler, which is a silent failure
// rather than a caught one. Branch on the format instead.
check(
  "every recorded file has a sha256 and a count of what it holds",
  mailchimpManifest.exports.every((entry) =>
    entry.files.every(
      (file) =>
        /^[0-9a-f]{64}$/.test(file.sha256) &&
        ((file.format ?? "csv") === "csv" ? (file.rows ?? -1) >= 0 : (file.items ?? -1) >= 0)
    )
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

// The spine rule is about the manual CSV export, where one file per session IS
// the mailing list. An API pull has no spine — it is scoped by endpoint, not by
// status — so scoping this by method is not a weakening, it is the rule finally
// saying which export shape it was ever about.
const csvExports = mailchimpManifest.exports.filter(
  (entry) => (entry.method ?? "manual-csv") === "manual-csv"
);
const spine = csvExports.flatMap((entry) =>
  entry.files.filter((file) => file.role === "spine")
);
check(
  "exactly one file per CSV export is the spine, and it is the subscribed list",
  spine.length === csvExports.length && spine.every((file) => file.status === "subscribed")
);

// An API export is exempted from the spine rule above, and an exemption with no
// replacement is a hole. These four say what an API entry must carry instead:
// the audience it was pulled from, and per file the endpoint that is its only
// statement of what the numbers inside are counts of.
const apiExports = mailchimpManifest.exports.filter((entry) => entry.method === "api-v3");

check(
  "every API export names the audience it was pulled from",
  apiExports.every((entry) => typeof entry.api?.listId === "string" && entry.api.listId.length > 0),
  apiExports
    .filter((entry) => !entry.api?.listId)
    .map((entry) => entry.exportId)
    .join(", ")
);

check(
  "every file in an API export names the endpoint it is the response to",
  apiExports.every((entry) =>
    entry.files.every((file) => typeof file.endpoint === "string" && file.endpoint.startsWith("/"))
  )
);

// `rows: 0` on a JSON file would read as "the pull returned nothing", which is
// a different claim from "rows are not a thing this file has". Absence is the
// only way to say the second.
check(
  "an API file declares no CSV-only shape",
  apiExports.every((entry) =>
    entry.files.every(
      (file) =>
        file.hasHeaderRow === undefined &&
        file.rows === undefined &&
        file.columns === undefined
    )
  )
);

// The manifest is append-only, so the exportId is the key every other file and
// script joins on. A duplicate would make "the 2026-08-17 export" ambiguous and
// silently hand the first match to whichever lookup ran.
const exportIds = mailchimpManifest.exports.map((entry) => entry.exportId);
check(
  "no exportId is recorded twice",
  new Set(exportIds).size === exportIds.length,
  exportIds.filter((id, index) => exportIds.indexOf(id) !== index).join(", ")
);

// A gap is closed by annotation, never by deletion — so the two things that can
// go wrong are pointing at an export that does not exist, and quietly emptying
// the record of what was missing while marking it closed.
const closedGaps = mailchimpManifest.knownGaps.filter((gap) => gap.closedBy !== undefined);

check(
  "a closed gap names an export that exists",
  closedGaps.every((gap) => exportIds.includes(gap.closedBy as string)),
  closedGaps
    .filter((gap) => !exportIds.includes(gap.closedBy as string))
    .map((gap) => `${gap.report} -> ${gap.closedBy}`)
    .join(", ")
);

check(
  "closing a gap never erases what was missing",
  closedGaps.every(
    (gap) => gap.impact.length > 0 && gap.action.length > 0 && typeof gap.closedAt === "string"
  )
);

// --- Campaigns ---------------------------------------------------------------
console.log("\n--- Campaigns ---");

const campaigns = mailchimpCampaigns.campaigns;
const campaignTotals = mailchimpCampaigns.totals;

check("the campaign archive declares a floor of at least 5", campaigns.floor >= 5);

check(
  "no named campaign sits below the floor",
  campaigns.sent.every((campaign) => campaign.emailsSent >= campaigns.floor),
  campaigns.sent
    .filter((campaign) => campaign.emailsSent < campaigns.floor)
    .map((campaign) => campaign.id)
    .join(", ")
);

// The three buckets are a partition of the pull. If they stopped adding up, a
// campaign would have gone missing between the vault and the archive with
// nothing saying so — which is indistinguishable from the floor eating it.
check(
  "the named, suppressed and unsent campaigns account for every campaign",
  campaigns.distinct === campaigns.sent.length + campaigns.belowFloor + campaigns.unsent,
  `${campaigns.distinct} vs ${campaigns.sent.length} + ${campaigns.belowFloor} + ${campaigns.unsent}`
);

check(
  "the send total counts the suppressed campaigns too",
  campaignTotals.campaignsSent === campaigns.sent.length + campaigns.belowFloor,
  `${campaignTotals.campaignsSent} vs ${campaigns.sent.length} + ${campaigns.belowFloor}`
);

// The units check, and the reason this file has a Campaigns section at all.
// Mailchimp returns `open_rate` as a FRACTION and `unique_opens` as a COUNT.
// Reading one as the other produces a number that looks entirely plausible in a
// funder report — 0.37 opens, or 500 percent — so the impossible direction is
// asserted rather than trusted. `uniqueClicks` is the same trap twice over:
// Mailchimp's `unique_clicks` counts clicks per link and legitimately exceeds
// the recipient count, which is why the builder commits
// `unique_subscriber_clicks` instead.
const overOpened = campaigns.sent.filter((entry) => entry.uniqueOpens > entry.emailsSent);
check(
  "no campaign was opened by more people than it was sent to",
  overOpened.length === 0,
  overOpened.map((entry) => `${entry.id} ${entry.uniqueOpens}/${entry.emailsSent}`).join(", ")
);

const overClicked = campaigns.sent.filter((entry) => entry.uniqueClicks > entry.emailsSent);
check(
  "no campaign was clicked by more people than it was sent to",
  overClicked.length === 0,
  overClicked.map((entry) => `${entry.id} ${entry.uniqueClicks}/${entry.emailsSent}`).join(", ")
);

check(
  "total opens are never fewer than unique opens",
  campaigns.sent.every((entry) => entry.opensTotal >= entry.uniqueOpens),
  campaigns.sent
    .filter((entry) => entry.opensTotal < entry.uniqueOpens)
    .map((entry) => entry.id)
    .join(", ")
);

check(
  "total clicks are never fewer than unique clicks",
  campaigns.sent.every((entry) => entry.clicksTotal >= entry.uniqueClicks),
  campaigns.sent
    .filter((entry) => entry.clicksTotal < entry.uniqueClicks)
    .map((entry) => entry.id)
    .join(", ")
);

// Proxy-excluded opens are a subset of opens by definition. If the pair ever
// inverted, Mailchimp's MPP correction would be reading as an inflation.
check(
  "proxy-excluded opens never exceed unique opens",
  campaigns.sent.every((entry) => entry.proxyExcludedUniqueOpens <= entry.uniqueOpens),
  campaigns.sent
    .filter((entry) => entry.proxyExcludedUniqueOpens > entry.uniqueOpens)
    .map((entry) => entry.id)
    .join(", ")
);

check(
  "departures and failures never exceed the send",
  campaigns.sent.every(
    (entry) => entry.unsubscribed + entry.hardBounces + entry.softBounces <= entry.emailsSent
  ),
  campaigns.sent
    .filter((entry) => entry.unsubscribed + entry.hardBounces + entry.softBounces > entry.emailsSent)
    .map((entry) => entry.id)
    .join(", ")
);

// A campaign id is ten hex characters. A MEMBER id is the 32-character md5 of a
// lower-cased address — pseudonymous, but one per person. Both are hex, so the
// LENGTH is the whole difference between a record of a send and a record of a
// person, and checking it is what stops a future mapper writing the wrong one
// into a file whose every other value is a legitimate count.
const badIds = campaigns.sent.filter((entry) => !/^[0-9a-f]{6,16}$/.test(entry.id));
check(
  "every campaign id is campaign-shaped, not member-shaped",
  badIds.length === 0,
  badIds.map((entry) => `${entry.id} (${entry.id.length} chars)`).join(", ")
);

check(
  "named campaigns are ordered oldest first",
  campaigns.sent.every((entry, index) => index === 0 || campaigns.sent[index - 1].sentAt <= entry.sentAt)
);

check(
  "the per-year buckets sum to the whole-account totals",
  mailchimpCampaigns.bySendYear.reduce((acc, year) => acc + year.emailsSent, 0) ===
    campaignTotals.emailsSent &&
    mailchimpCampaigns.bySendYear.reduce((acc, year) => acc + year.campaigns, 0) ===
      campaignTotals.campaignsSent
);

check(
  "the campaign archive ships its caveats with the data",
  mailchimpCampaigns.caveats.length >= 5
);

// --- The list-size series ----------------------------------------------------
const growth = mailchimpCampaigns.growth;

check("the growth series is not empty", growth.length > 0);

check(
  "every growth point is a YYYY-MM month",
  growth.every((point) => /^\d{4}-(0[1-9]|1[0-2])$/.test(point.month))
);

// Monthly, ordered and gapless is the whole contract of a time series. A chart
// drawn from a series with a hole in it draws a straight line across the hole,
// and nothing on the chart says so.
const monthGaps: string[] = [];
for (let index = 1; index < growth.length; index++) {
  const [year, month] = growth[index - 1].month.split("-").map(Number);
  const expected =
    month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, "0")}`;
  if (growth[index].month !== expected) {
    monthGaps.push(`${growth[index - 1].month} → ${growth[index].month}`);
  }
}
check(
  "the growth series is monthly, ordered and gapless",
  monthGaps.length === 0,
  monthGaps.join(", ")
);

check(
  "listSizeByMonth reports the same series",
  listSizeByMonth().length === growth.length &&
    listSizeByMonth()[0].subscribed === growth[0].subscribed
);

check(
  "no month claims more subscribers than the audience has ever held",
  growth.every((point) => point.subscribed <= totals.contacts),
  growth
    .filter((point) => point.subscribed > totals.contacts)
    .map((point) => point.month)
    .join(", ")
);

// Cross-file, and a BAND rather than an equality on purpose: the API pull and
// the CSV export are ten days apart, so people joined and left in between. An
// equality here would fail on the next pull for an entirely healthy reason,
// which is how a check gets deleted instead of read.
const latestListSize = growth[growth.length - 1].subscribed;
const drift = Math.abs(latestListSize - totals.subscribed) / totals.subscribed;
check(
  "the newest growth point is within 10% of the CSV export's list size",
  drift <= 0.1,
  `${latestListSize} (API ${mailchimpCampaigns.metadata.exportId}) vs ${totals.subscribed} (CSV), ${(drift * 100).toFixed(1)}% apart`
);

// The accessor is a floor by construction, and a caller who forgets that reads
// a period figure as a total. The window below covers every send there is, and
// it still returns fewer campaigns than were sent.
const everySend = campaignsSentBetween("2000-01-01", "2999-12-31");
check(
  "campaignsSentBetween over all time returns the named campaigns and no more",
  everySend.length === campaigns.sent.length && everySend.length < campaignTotals.campaignsSent,
  `${everySend.length} named vs ${campaignTotals.campaignsSent} sent`
);

check(
  "campaignsSentBetween excludes campaigns outside the window",
  campaignsSentBetween("2019-01-01", "2019-12-31").every((entry) =>
    entry.sentAt.startsWith("2019")
  ) && campaignsSentBetween("1999-01-01", "1999-12-31").length === 0
);


// Where the raw files live is the only statement a committed manifest makes
// about a directory nobody can see from here, and it has to survive being read
// on another machine.
//
// The rule is "not anywhere THIS repository tracks" — not "under private/".
// The attendee and member records belong in the private archive repository,
// which is the master; private/ is only a cache of it. A check that insisted on
// the cache would fail the moment somebody did the right thing.
const MC_TRACKED_ROOTS = ["lib/", "app/", "components/", "docs/", "scripts/", "public/", "types/", "hooks/"];
const mcVaultIsOutsideTheTree = (vaultPath: string): boolean => {
  if (vaultPath.startsWith("private/")) return true;
  return !MC_TRACKED_ROOTS.some((root) => vaultPath.startsWith(root));
};
check(
  "no API export writes member records anywhere this repository tracks",
  apiExports.every((entry) => mcVaultIsOutsideTheTree(entry.vaultPath)),
  apiExports
    .filter((entry) => !mcVaultIsOutsideTheTree(entry.vaultPath))
    .map((entry) => `${entry.exportId} -> ${entry.vaultPath}`)
    .join(", ")
);

// An absolute path is true on one machine and wrong on every other. This one is
// not hypothetical: the 2026-08-28 pull recorded `D:\github_repository\…`
// because the running process had loaded manifest.ts before the portable-path
// helper was added to it, and nothing would have noticed.
const isAbsolutePath = (value: string): boolean =>
  /^[A-Za-z]:/.test(value) || value.startsWith('/') || value.startsWith(String.fromCharCode(92));
check(
  "no vault path is absolute",
  apiExports.every((entry) => !isAbsolutePath(entry.vaultPath)),
  apiExports
    .filter((entry) => isAbsolutePath(entry.vaultPath))
    .map((entry) => `${entry.exportId} -> ${entry.vaultPath}`)
    .join(", ")
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
