/**
 * Guards for the committed Humanitix archive.
 *
 * Run: npx tsx lib/data/humanitix.test.ts   (CI: .github/workflows/verify.yml)
 *
 * Everything here reads only the committed JSON — no vault, no network, no
 * database — which is the point: the raw exports carry 5,156 people's names and
 * 124 live access codes and can never be on CI, so the invariants that CI *can*
 * hold have to be the ones internal to the archive. The vault-dependent
 * reconciliation lives in `scripts/humanitix/verify-export.ts` and runs locally.
 *
 * The leak guard at the bottom is the reason this file is in CI at all. On
 * 2026-06-11 three internal access codes reached a committed JSON file and had
 * to be rotated. This archive is built from a source that contains 124 more of
 * them plus every attendee's email address, so "no address and no code reaches
 * lib/data/json/humanitix/" needs to be a test rather than a habit.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { getEventBySlug } from "./events";
import {
  canonicalOrganisationId,
  humanitixAggregates,
  humanitixCrosswalk,
  humanitixEvents,
  humanitixInstanceKey,
  humanitixManifest,
  humanitixOrganisations,
  humanitixSegments,
  resolveSegment,
} from "./humanitix";

let failures = 0;

function check(label: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  ok - ${label}`);
  } else {
    failures++;
    console.error(`  FAIL - ${label}${detail ? `: ${detail}` : ""}`);
  }
}

const instances = humanitixEvents.instances;
const totals = humanitixAggregates.totals;
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
/** Compares money in integer cents — a float sum of 62 amounts will not land. */
const cents = (amount: number) => Math.round(amount * 100);

// --- Internal consistency ----------------------------------------------------
console.log("\nInternal consistency");

check(
  "instance count matches the aggregate total",
  instances.length === totals.instances,
  `${instances.length} vs ${totals.instances}`
);
check(
  "registrations sum to the aggregate total",
  sum(instances.map((i) => i.registered)) === totals.registered,
  `${sum(instances.map((i) => i.registered))} vs ${totals.registered}`
);
check(
  "check-ins sum to the aggregate total",
  sum(instances.map((i) => i.checkedIn)) === totals.checkedIn
);
check(
  "cancellations sum to the aggregate total",
  sum(instances.map((i) => i.cancelled)) === totals.cancelled
);
check(
  "earnings sum to the aggregate ticket total",
  sum(instances.map((i) => cents(i.earnings))) === cents(totals.earnings.tickets),
  `${sum(instances.map((i) => cents(i.earnings)))}c vs ${cents(totals.earnings.tickets)}c`
);
check(
  "ticket earnings plus donations equal total earnings",
  cents(totals.earnings.tickets) + cents(totals.earnings.donations) ===
    cents(totals.earnings.total),
  `${cents(totals.earnings.tickets)}c + ${cents(totals.earnings.donations)}c vs ${cents(totals.earnings.total)}c`
);

const duplicateKeys = instances
  .map((i) => i.key)
  .filter((key, index, all) => all.indexOf(key) !== index);
check("every instance key is unique", duplicateKeys.length === 0, duplicateKeys.join(", "));

const badKeyFormat = instances.filter((i) => !/^\d{4}-\d{2}-\d{2}--[a-z0-9-]+$/.test(i.key));
check(
  "every instance key is well formed",
  badKeyFormat.length === 0,
  badKeyFormat.map((i) => i.key).join(", ")
);

// The key is DERIVED, not authored. Recomputing it here means nobody can
// hand-edit one out of agreement with the name and date beside it.
const driftedKeys = instances.filter(
  (i) => i.key !== humanitixInstanceKey(i.eventName, i.eventDate)
);
check(
  "every key is exactly what its own name and date derive",
  driftedKeys.length === 0,
  driftedKeys.map((i) => i.key).join(", ")
);

const overCounted = instances.filter((i) => i.checkedIn > i.registered);
check(
  "no instance checked in more people than registered",
  overCounted.length === 0,
  overCounted.map((i) => `${i.key} ${i.checkedIn}/${i.registered}`).join(", ")
);

// The trap this archive exists to prevent: 0 check-ins means "nobody scanned",
// not "nobody came". Anything reading `checkedIn` must read this flag first.
const falseZeroes = instances.filter((i) => i.checkInDataPresent && i.checkedIn === 0);
check(
  "no instance claims check-in data while recording none",
  falseZeroes.length === 0,
  falseZeroes.map((i) => i.key).join(", ")
);
check(
  "the instances without check-in data match the recorded coverage",
  instances.filter((i) => !i.checkInDataPresent).length ===
    humanitixAggregates.checkInCoverage.withZeroCheckIns
);
check(
  "every zero-check-in instance is listed by key",
  humanitixAggregates.checkInCoverage.zeroInstanceKeys.length ===
    humanitixAggregates.checkInCoverage.withZeroCheckIns
);

// An Event ID may cover several instances — a Humanitix event that ran on
// several dates is one event with one id, which is what the two 2020
// STORYTELLERS series are. It may NOT cover several event NAMES: the export
// contains one identifier spanning twelve unrelated 2021-22 events, and the
// builder discards it rather than recording a wrong id twelve times.
const namesPerEventId = new Map<string, Set<string>>();
for (const instance of instances) {
  if (!instance.humanitixEventId) continue;
  namesPerEventId.set(
    instance.humanitixEventId,
    (namesPerEventId.get(instance.humanitixEventId) ?? new Set()).add(instance.eventName)
  );
}
const idsSpanningNames = [...namesPerEventId].filter(([, names]) => names.size > 1);
check(
  "no Humanitix Event ID covers two different events",
  idsSpanningNames.length === 0,
  idsSpanningNames.map(([id]) => id).join(", ")
);
check(
  "the recorded Event ID coverage matches the instances that carry one",
  instances.filter((i) => i.humanitixEventId).length === totals.instancesWithEventId,
  `${instances.filter((i) => i.humanitixEventId).length} vs ${totals.instancesWithEventId}`
);
// Every instance sharing an id must also share a seriesKey, or the id is being
// reused across things the archive does not model as one event.
const sharedIdWithoutSeries = [...namesPerEventId.keys()].filter((id) => {
  const holders = instances.filter((i) => i.humanitixEventId === id);
  return holders.length > 1 && holders.some((i) => !i.seriesKey);
});
check(
  "every shared Event ID belongs to a multi-date series",
  sharedIdWithoutSeries.length === 0,
  sharedIdWithoutSeries.join(", ")
);

const badCapacity = instances.filter(
  (i) =>
    i.capacity !== null &&
    i.sold !== null &&
    i.available !== null &&
    i.available !== i.capacity - i.sold
);
check(
  "available equals capacity minus sold wherever all three exist",
  badCapacity.length === 0,
  badCapacity.map((i) => i.key).join(", ")
);

// --- Year and segment rollups ------------------------------------------------
console.log("\nRollups");

check(
  "yearly registrations sum to the total",
  sum(humanitixAggregates.byYear.map((y) => y.registered)) === totals.registered
);
check(
  "yearly check-ins sum to the total",
  sum(humanitixAggregates.byYear.map((y) => y.checkedIn)) === totals.checkedIn
);
check(
  "yearly earnings sum to the ticket total",
  sum(humanitixAggregates.byYear.map((y) => cents(y.earnings))) ===
    cents(totals.earnings.tickets)
);
check(
  "yearly instance counts sum to the total",
  sum(humanitixAggregates.byYear.map((y) => y.instances)) === totals.instances
);

// A check-in rate over a year that ran no check-ins would be a fabricated zero.
const fabricatedRates = humanitixAggregates.byYear.filter(
  (y) => !y.checkInDataPresent && y.checkInRate !== null
);
check(
  "no year without check-in data reports a check-in rate",
  fabricatedRates.length === 0,
  fabricatedRates.map((y) => y.year).join(", ")
);

check(
  "segment tickets sum to the total",
  sum(humanitixAggregates.bySegment.map((s) => s.tickets)) === totals.registered
);
const shareSum = sum(humanitixAggregates.bySegment.map((s) => s.share));
check(
  "segment shares sum to 1",
  Math.abs(shareSum - 1) < 0.001,
  `sums to ${shareSum.toFixed(4)}`
);
check(
  "ticket-type tickets sum to the total",
  sum(humanitixAggregates.byTicketType.map((t) => t.tickets)) === totals.registered
);

// --- Vocabulary coverage -----------------------------------------------------
console.log("\nVocabulary");

const declaredSegments = new Set(humanitixSegments.segments.map((s) => s.id));
const undeclaredInInstances = new Set(
  instances.flatMap((i) => i.ticketTypes.map((t) => t.segment)).filter((s) => !declaredSegments.has(s))
);
check(
  "every segment used by an instance is declared",
  undeclaredInInstances.size === 0,
  [...undeclaredInInstances].join(", ")
);

const undeclaredRuleTargets = humanitixSegments.rules
  .map((rule) => rule.segment)
  .filter((segment) => !declaredSegments.has(segment));
check(
  "every rule points at a declared segment",
  undeclaredRuleTargets.length === 0,
  undeclaredRuleTargets.join(", ")
);

// Re-resolving proves the rules still produce what was recorded — a reordered
// rule list would otherwise change the mix silently on the next build.
const misresolved = humanitixAggregates.byTicketType.filter(
  (entry) => resolveSegment(entry.ticketType) !== entry.segment
);
check(
  "every ticket type still resolves to the segment recorded beside it",
  misresolved.length === 0,
  misresolved
    .slice(0, 3)
    .map((e) => `${e.ticketType} -> ${resolveSegment(e.ticketType)} not ${e.segment}`)
    .join("; ")
);

const declaredOrgs = new Set(humanitixOrganisations.canonical.map((entry) => entry.id));
const badOrgKinds = humanitixAggregates.organisations.top.filter(
  (entry) => entry.kind !== "unlisted" && !declaredOrgs.has(entry.id)
);
check(
  "every named organisation in the ranking is declared",
  badOrgKinds.length === 0,
  badOrgKinds.map((e) => e.id).join(", ")
);
check(
  "no organisation below the reporting floor is listed",
  humanitixAggregates.organisations.top.every(
    (entry) => entry.tickets >= humanitixAggregates.organisations.minTickets
  )
);
// Otherwise "NA", "Student" and "-" become the archive's largest employers.
check(
  "the nullish employer strings resolve to no organisation",
  humanitixOrganisations.nullish.every(
    (value) => canonicalOrganisationId(value) === null
  )
);

// --- Crosswalk ---------------------------------------------------------------
console.log("\nCrosswalk");

const instanceKeys = new Set(instances.map((i) => i.key));
const mapped = new Map<string, number>();
for (const link of humanitixCrosswalk.links) {
  mapped.set(link.humanitixKey, (mapped.get(link.humanitixKey) ?? 0) + 1);
}
for (const series of humanitixCrosswalk.series) {
  for (const key of series.sessionKeys) {
    mapped.set(key, (mapped.get(key) ?? 0) + 1);
  }
}
for (const entry of humanitixCrosswalk.unmatched) {
  mapped.set(entry.humanitixKey, (mapped.get(entry.humanitixKey) ?? 0) + 1);
}

const unaccounted = [...instanceKeys].filter((key) => !mapped.has(key));
check(
  "every instance appears in the crosswalk",
  unaccounted.length === 0,
  unaccounted.join(", ")
);
const doubleCounted = [...mapped].filter(([, count]) => count > 1).map(([key]) => key);
check(
  "no instance appears in the crosswalk twice",
  doubleCounted.length === 0,
  doubleCounted.join(", ")
);
const phantom = [...mapped.keys()].filter((key) => !instanceKeys.has(key));
check(
  "the crosswalk names no instance that does not exist",
  phantom.length === 0,
  phantom.join(", ")
);

const unresolvableSlugs = [
  ...humanitixCrosswalk.links.map((link) => link.siteSlug),
  ...humanitixCrosswalk.series.map((series) => series.siteSlug),
].filter((slug) => slug && !getEventBySlug(slug));
check(
  "every site slug in the crosswalk resolves to a real event",
  unresolvableSlugs.length === 0,
  unresolvableSlugs.join(", ")
);

// This is the assertion that keeps the two STORYTELLERS series correct. Their
// site figures are the SUM of their sessions; compared session by session they
// look like errors, and "fixing" them would break two correct numbers.
const badSeriesSums = humanitixCrosswalk.series.filter((series) => {
  const members = instances.filter((i) => series.sessionKeys.includes(i.key));
  return sum(members.map((m) => m.registered)) !== series.exportRegistered;
});
check(
  "every series total equals the sum of its own sessions",
  badSeriesSums.length === 0,
  badSeriesSums.map((s) => s.seriesKey).join(", ")
);

const unexplained = [
  ...humanitixCrosswalk.links.filter((l) => l.status !== "agrees" && !l.note.trim()),
  ...humanitixCrosswalk.series.filter((s) => s.status !== "agrees" && !s.note.trim()),
];
check(
  "every row that is not `agrees` explains itself",
  unexplained.length === 0,
  unexplained.length ? `${unexplained.length} row(s) with an empty note` : undefined
);
const unexplainedMatches = humanitixCrosswalk.links.filter(
  (link) => link.match === "hand-verified" && !link.note.trim()
);
check(
  "every hand-verified match says why it was accepted",
  unexplainedMatches.length === 0,
  unexplainedMatches.map((l) => l.humanitixKey).join(", ")
);

const staleFigures = humanitixCrosswalk.links.filter((link) => {
  const instance = instances.find((i) => i.key === link.humanitixKey);
  return (
    instance !== undefined && link.figures.export.registered !== instance.registered
  );
});
check(
  "the crosswalk's export figures match the archive",
  staleFigures.length === 0,
  staleFigures.map((l) => l.humanitixKey).join(", ")
);

// --- Manifest ----------------------------------------------------------------
console.log("\nManifest");

check("the manifest records at least one export", humanitixManifest.exports.length > 0);

// The block below is about the MANUAL CSV export, where one account-wide
// attendee table is the spine every headline number is counted from and every
// primary file is credited in `events.json`. An API pull has neither: it is
// scoped by endpoint, its 59 per-event files feed nothing yet, and calling any
// of them a spine would make the word mean two things. Selecting the CSV export
// rather than `exports.at(-1)` is what keeps these assertions pointed at the
// export shape they were written for once an API entry is appended after it.
const csvExports = humanitixManifest.exports.filter(
  (entry) => (entry.method ?? "manual-csv") === "manual-csv"
);
const exportEntry = csvExports.at(-1);
check("the manifest records at least one CSV export", exportEntry !== undefined);

if (exportEntry) {
  check(
    "the file count matches the recorded files",
    exportEntry.files.length === exportEntry.fileCount,
    `${exportEntry.files.length} vs ${exportEntry.fileCount}`
  );
  const badHashes = exportEntry.files.filter((f) => !/^[0-9a-f]{64}$/.test(f.sha256));
  check(
    "every recorded sha256 is 64 lowercase hex",
    badHashes.length === 0,
    badHashes.map((f) => f.file).join(", ")
  );
  const undeclaredPii = exportEntry.files.filter(
    (f) => !(f.piiClass in humanitixManifest.metadata.piiClasses)
  );
  check(
    "every file declares a described PII class",
    undeclaredPii.length === 0,
    undeclaredPii.map((f) => f.piiClass).join(", ")
  );
  check(
    "exactly one file is the spine",
    exportEntry.files.filter((f) => f.role === "spine").length === 1
  );
  const missingProvenance = exportEntry.files
    .filter((f) => f.role === "spine" || f.role === "primary")
    .filter((f) => !humanitixEvents.metadata.generatedFrom.includes(f.file));
  check(
    "every spine and primary file is credited as a source",
    missingProvenance.length === 0,
    missingProvenance.map((f) => f.file).join(", ")
  );
  const uncredited = exportEntry.files.filter((f) => !f.note.trim());
  check(
    "every recorded file says what it is",
    uncredited.length === 0,
    uncredited.map((f) => f.file).join(", ")
  );
}

// The export note ticks Event summary as exported and it is not in the folder.
// Losing that fact would cost the Humanitix Event ID for 23 instances.
const eventSummaryGap = humanitixManifest.knownGaps.find(
  (gap) => gap.report === "event-summary"
);
check(
  "the Event summary report's own history is still recorded",
  eventSummaryGap !== undefined,
  "the entry was deleted rather than closed — it records that an export session believed it had taken a report it had not"
);

// It was absent from the first pass and re-exported on 2026-08-18. Once present,
// every instance should carry a venue unless the event was held online.
if (eventSummaryGap?.present === true) {
  check(
    "the Event summary supplies a venue for all but the online events",
    instances.filter((i) => !i.venue).length <= 3,
    `${instances.filter((i) => !i.venue).length} instance(s) without one`
  );
  check(
    "the Event summary supplies an organiser for every instance",
    instances.every((i) => i.organiser)
  );
}

// --- API pulls ---------------------------------------------------------------
console.log("\nAPI pulls");

// An API export is exempted from the spine and provenance rules above, and an
// exemption with no replacement is a hole. These say what an API entry must
// carry instead — and, because these files are the most sensitive this project
// writes, what it must never claim about them.
const apiExports = humanitixManifest.exports.filter((entry) => entry.method === "api-v1");
const apiFiles = apiExports.flatMap((entry) => entry.files);

check(
  "every API export names the host and the event population it was pulled from",
  apiExports.every(
    (entry) =>
      typeof entry.api?.baseUrl === "string" &&
      entry.api.baseUrl.startsWith("https://") &&
      typeof entry.api.events === "number" &&
      entry.api.events > 0
  ),
  apiExports
    .filter((entry) => !entry.api?.baseUrl || !entry.api.events)
    .map((entry) => entry.exportId)
    .join(", ")
);

// The key is the whole of the account's authority. It is never recorded, and
// `baseUrl` is the one field close enough to a credential to be worth asserting.
check(
  "no API export records anything that looks like a credential",
  apiExports.every((entry) => !/[?&:@]/.test(entry.api?.baseUrl.replace("https://", "") ?? "")),
  apiExports.map((entry) => entry.api?.baseUrl ?? "").join(", ")
);

check(
  "every file in an API export names the endpoint it is the response to",
  apiFiles.every((file) => typeof file.endpoint === "string" && file.endpoint.startsWith("/v1/")),
  apiFiles
    .filter((file) => !file.endpoint?.startsWith("/v1/"))
    .map((file) => file.file)
    .join(", ")
);

// `rows: 0` on a JSON file would read as "the pull returned nothing", which is
// a different claim from "rows are not a thing this file has". Absence is the
// only way to say the second.
check(
  "an API file declares its JSON shape and no CSV-only shape",
  apiFiles.every(
    (file) =>
      file.format === "json" &&
      (file.items ?? -1) >= 0 &&
      file.hasHeaderRow === undefined &&
      file.rows === undefined &&
      file.columns === undefined
  ),
  apiFiles
    .filter((file) => file.format !== "json" || (file.items ?? -1) < 0)
    .map((file) => file.file)
    .join(", ")
);

// The assertion this whole section exists for. `orders/` and `tickets/` carry a
// LIVE accessCode on nearly every row, plus names, mobiles, addresses, dates of
// birth and free-text health answers. A manifest entry understating one of them
// is how a file gets handled as though it were a summary — so the class is
// checked, not trusted to whoever adds the next case to classifyApiFile().
const attendeeFiles = apiFiles.filter(
  (file) => file.file.startsWith("orders/") || file.file.startsWith("tickets/")
);
check(
  "every attendee-bearing API file declares an access-secret or person-sensitive class",
  attendeeFiles.every(
    (file) => file.piiClass === "access-secret" || file.piiClass === "person-sensitive"
  ),
  attendeeFiles
    .filter((file) => file.piiClass !== "access-secret" && file.piiClass !== "person-sensitive")
    .map((file) => `${file.file} -> ${file.piiClass}`)
    .join(", ")
);

check(
  "every attendee-bearing API file says in its note what it holds",
  attendeeFiles.every((file) => /accessCode/.test(file.note)),
  attendeeFiles
    .filter((file) => !/accessCode/.test(file.note))
    .map((file) => file.file)
    .join(", ")
);

// The vault path is the only statement in a committed file about where this
// data lives, and the rule it has to express is "not anywhere THIS repository
// tracks" — not "under private/".
//
// The first version of this check said private/ and it was too narrow. The
// attendee records are supposed to live in the private archive repository,
// which is the master copy; private/ is only a cache of it. A check that
// insists on the cache fails the moment somebody does the right thing.
//
// So: a path is acceptable if it is the gitignored cache, or if it names a
// different repository. It is NOT acceptable if it points at a directory this
// repository tracks — that would mean the pull wrote names, emails and live
// access codes somewhere git can see.
const TRACKED_ROOTS = ["lib/", "app/", "components/", "docs/", "scripts/", "public/", "types/", "hooks/"];
const vaultIsOutsideTheTree = (vaultPath: string): boolean => {
  if (vaultPath.startsWith("private/")) return true;
  return !TRACKED_ROOTS.some((root) => vaultPath.startsWith(root));
};
check(
  "no API export writes attendee records anywhere this repository tracks",
  apiExports.every((entry) => vaultIsOutsideTheTree(entry.vaultPath)),
  apiExports
    .filter((entry) => !vaultIsOutsideTheTree(entry.vaultPath))
    .map((entry) => `${entry.exportId} -> ${entry.vaultPath}`)
    .join(", ")
);

// An absolute path is true on one machine and wrong on every other. A committed
// manifest that carries one has stopped being a record and become a note to
// self.
const ABSOLUTE = /^([A-Za-z]:|\/|\\)/;
check(
  "no vault path is absolute",
  apiExports.every((entry) => !ABSOLUTE.test(entry.vaultPath)),
  apiExports
    .filter((entry) => ABSOLUTE.test(entry.vaultPath))
    .map((entry) => `${entry.exportId} -> ${entry.vaultPath}`)
    .join(", ")
);

// `orders/` and `tickets/` must never become a source of the committed archive.
// `generatedFrom` is how a file earns that status, so an API filename appearing
// in it is the first visible symptom of the rule having been broken.
const creditedApiFiles = apiFiles.filter((file) =>
  humanitixEvents.metadata.generatedFrom.includes(file.file)
);
check(
  "no API file is credited as a source of the committed archive",
  creditedApiFiles.length === 0,
  creditedApiFiles.map((file) => file.file).join(", ")
);

// The manifest is append-only, so the exportId is the key every other file and
// script joins on. A duplicate would make "the 2026-08-17 export" ambiguous and
// silently hand the first match to whichever lookup ran.
const exportIds = humanitixManifest.exports.map((entry) => entry.exportId);
check(
  "no exportId is recorded twice",
  new Set(exportIds).size === exportIds.length,
  exportIds.filter((id, index) => exportIds.indexOf(id) !== index).join(", ")
);

// A gap is closed by annotation, never by deletion — so the two things that can
// go wrong are pointing at an export that does not exist, and quietly emptying
// the record of what was missing while marking it closed.
const closedGaps = humanitixManifest.knownGaps.filter((gap) => gap.closedBy !== undefined);

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

// --- Leak guard --------------------------------------------------------------
console.log("\nLeak guard");

const ARCHIVE_DIR = join(__dirname, "json", "humanitix");
const archiveFiles = readdirSync(ARCHIVE_DIR).filter((name) => name.endsWith(".json"));

check("the archive directory is not empty", archiveFiles.length > 0);

// Humanitix stamps its own filenames `(exported-2026-08-17@10.02.37)`, so a bare
// `@` is not the signal. An address is.
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const MASKED_ACCOUNT = /\b\d{2}X{6,}\d{3}X{3,}\b/;
/**
 * Field names that would mean an answer, not a count, had reached the archive.
 *
 * `questionsAnswered` is exempt and checked separately: it is keyed by question
 * (`dietary`, `address`, `dateOfBirth`) but holds only how many people answered,
 * and asserting its values are integers is a stronger guarantee than banning the
 * words would be. `name` is exempt on organisation records, which are the names
 * of employers rather than of people.
 */
const FORBIDDEN_KEYS = new Set([
  "email",
  "emails",
  "mobile",
  "phone",
  "firstName",
  "lastName",
  "name",
  "address",
  "dob",
  "dateOfBirth",
  "dietary",
  "accessibility",
  "discountCode",
  "accessCode",
  "buyerEmail",
]);

const isOrganisationRecord = (node: Record<string, unknown>) =>
  "tickets" in node || "aliases" in node || "kind" in node;

for (const file of archiveFiles) {
  const raw = readFileSync(join(ARCHIVE_DIR, file), "utf8");
  const email = raw.match(EMAIL);
  check(
    `${file} contains no email address`,
    email === null,
    email ? `found ${email[0].replace(/./g, "*")}` : undefined
  );
  check(`${file} contains no masked bank account`, !MASKED_ACCOUNT.test(raw));

  const offendingKeys = new Set<string>();
  const nonNumericAnswers = new Set<string>();

  const walk = (node: unknown) => {
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (!node || typeof node !== "object") return;

    const record = node as Record<string, unknown>;
    for (const [key, value] of Object.entries(record)) {
      if (key === "questionsAnswered") {
        // Counts only. An integer cannot be somebody's dietary requirement.
        for (const [question, count] of Object.entries(
          (value ?? {}) as Record<string, unknown>
        )) {
          if (!Number.isInteger(count)) nonNumericAnswers.add(question);
        }
        continue;
      }
      if (
        FORBIDDEN_KEYS.has(key) &&
        !(key === "name" && isOrganisationRecord(record))
      ) {
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
  check(
    `${file} records question completion as counts, never answers`,
    nonNumericAnswers.size === 0,
    [...nonNumericAnswers].join(", ")
  );
}

// A code is 5-12 uppercase characters with at least one digit or a run of
// letters, sitting in a value position. The Humanitix Event ID is the one
// legitimate token of that shape, so it is matched and skipped by name.
const CODE_SHAPED = /"(?!humanitixEventId")[A-Za-z]+"\s*:\s*"([A-Z0-9]{5,12})"/g;
for (const file of archiveFiles) {
  const raw = readFileSync(join(ARCHIVE_DIR, file), "utf8");
  const hits = [...raw.matchAll(CODE_SHAPED)].map((match) => match[1]);
  check(
    `${file} carries no code-shaped value`,
    hits.length === 0,
    hits.slice(0, 3).join(", ")
  );
}

console.log(
  failures === 0
    ? "\nok - the Humanitix archive agrees with itself and carries no personal data"
    : `\n${failures} check(s) failed`
);
process.exit(failures === 0 ? 0 : 1);
