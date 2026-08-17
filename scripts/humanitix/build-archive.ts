/**
 * Builds the committed Humanitix archive from the gitignored vault.
 *
 * Reads the raw exports plus the three hand-authored files (`crosswalk.json`,
 * `segments.json`, `organisations.json`) and regenerates `events.json` and
 * `aggregates.json` wholesale. It never writes an authored file: that
 * separation is the whole reason they are separate files, because a
 * regeneration must not be able to overwrite a judgement a human made.
 *
 * Output is deterministic — every collection is sorted, money is carried as
 * integer cents, and nothing is stamped with the current time. Re-running
 * against the same vault therefore reproduces the same bytes, which is what
 * `--check` turns into a testable claim: "nothing changed" is proved rather
 * than eyeballed in a diff.
 *
 * Usage:
 *   npx tsx scripts/humanitix/build-archive.ts --export 2026-08-17 --check
 *   npx tsx scripts/humanitix/build-archive.ts --export 2026-08-17 --dry-run
 *   npx tsx scripts/humanitix/build-archive.ts --export 2026-08-17
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  canonicalOrganisationId,
  humanitixInstanceKey,
  isPersonalName,
  normalizeHumanitixText,
  personNameKey,
  resolveSegment,
  segmentLabel,
} from "../../lib/data/humanitix";
import type {
  HumanitixAggregates,
  HumanitixEventInstance,
  HumanitixEvents,
  HumanitixManifest,
  HumanitixManifestFile,
  HumanitixOrganisations,
  HumanitixSegments,
  HumanitixTicketTypeBreakdown,
} from "../../types/humanitix";
import {
  centsToAmount,
  parseDmyToIso,
  parseIntStrict,
  parseMoneyCents,
  readCsv,
  type CsvRow,
} from "./csv";
import { ARCHIVE_DIR, argValue, sha256File, vaultFilePath } from "./vault";

const GENERATED_BY = "scripts/humanitix/build-archive.ts";

/**
 * She Sharp's own shared booking mailbox.
 *
 * It looks like one person who attended 47 events across seven of them. It is
 * not: those 47 tickets carry 38 DIFFERENT attendee names, because staff booked
 * on colleagues' and guests' behalf. Counting it as a person would invent the
 * archive's most loyal attendee and inflate every repeat-attendance figure.
 *
 * Held as a hash so a mailbox does not sit in the repository. This is an opaque
 * constant for exclusion, not a secret.
 */
const ORG_ACCOUNT_HASHES = new Set([
  "f52805032bdd0275b8a8ea2a45f7ebaabd52b7c302a81a182dcd1a24326d5878",
]);

/**
 * The share of registrations that must have been scanned before a check-in
 * count is treated as data rather than as an artefact.
 *
 * The evidence for a floor, from this archive: of the 37 instances with any
 * check-in at all, the lowest genuine operation scanned 24.3% (Google, Oct
 * 2022) and the next 38.1%. Exactly one instance sits below that — Girls Night
 * Out @Xero, Nov 2020, with ONE scan out of 75 — which is somebody testing the
 * scanner, not a door count. Without a floor it reports a 2020 check-in rate of
 * 1.3%, which is worse than reporting nothing.
 */
const CHECK_IN_FLOOR = 0.05;

/** Custom-question columns worth a completion count. Never the answers. */
const QUESTION_COLUMNS: { key: string; header: string; match: "exact" | "prefix" }[] = [
  { key: "company", header: "Company/Organisation", match: "exact" },
  { key: "dietary", header: "Dietary requirements", match: "exact" },
  { key: "mobile", header: "Mobile", match: "exact" },
  { key: "address", header: "Address", match: "exact" },
  { key: "dateOfBirth", header: "Date of Birth", match: "exact" },
  { key: "accessibility", header: "Accessibility requirements", match: "exact" },
  { key: "photoConsent", header: "Do you consent to having photos taken", match: "prefix" },
  { key: "jobTitle", header: "What is your current job title?", match: "exact" },
];

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(ARCHIVE_DIR, name), "utf8")) as T;
}

/**
 * Serialises a generated file.
 *
 * CRLF, matching `scripts/data/json-format.ts` and the rest of
 * `lib/data/json/`. This repository is worked on with `core.autocrlf=true`, so
 * git checks these files out with CRLF on Windows. Rendering LF here would make
 * `--check` report every file as changed immediately after a fresh clone, and
 * the idempotence guarantee this script exists to provide would be a lie.
 */
function render(value: unknown): string {
  return (JSON.stringify(value, null, 2) + "\n").replace(/\n/g, "\r\n");
}

/** The manifest entry for the one file playing a given role and filter. */
function pick(
  manifest: HumanitixManifest,
  exportId: string,
  predicate: (file: HumanitixManifestFile) => boolean
): HumanitixManifestFile {
  const entry = manifest.exports.find((item) => item.exportId === exportId);
  if (!entry) throw new Error(`Manifest has no export ${exportId}`);
  const matches = entry.files.filter(predicate);
  if (matches.length !== 1) {
    throw new Error(
      `Expected exactly one matching file in export ${exportId}, found ${matches.length}`
    );
  }
  return matches[0];
}

/** Identifies the person behind a ticket row: their address, else the buyer's. */
function personKey(row: CsvRow): string | null {
  const email = (row["Email"] || row["Buyer email"] || "").trim().toLowerCase();
  return email || null;
}

/** The date part of Humanitix's `2026-08-17 8:25 pm` order stamp. */
function orderDate(row: CsvRow): string {
  const raw = (row["Order date & time"] || "").trim();
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : "";
}

interface InstanceAccumulator {
  key: string;
  eventName: string;
  eventNameRaw: Set<string>;
  eventDate: string;
  eventTime: string;
  timezone: string;
  registered: number;
  cancelled: number;
  checkedIn: number;
  earningsCents: number;
  cancelledEarningsCents: number;
  discountCodeUses: number;
  accessCodeUses: number;
  ticketTypes: Map<string, { tickets: number; earningsCents: number }>;
  salesChannels: Map<string, number>;
  organisations: Set<string>;
  questionsAnswered: Map<string, number>;
  orderIds: Set<string>;
  orderDates: string[];
}

function main() {
  const argv = process.argv.slice(2);
  const exportId = argValue(argv, "--export");
  const check = argv.includes("--check");
  const dryRun = argv.includes("--dry-run");

  if (!exportId) {
    console.error(
      "Usage: npx tsx scripts/humanitix/build-archive.ts --export <YYYY-MM-DD> [--check|--dry-run]"
    );
    process.exit(1);
  }

  const manifest = loadJson<HumanitixManifest>("manifest.json");
  const segments = loadJson<HumanitixSegments>("segments.json");
  const organisations = loadJson<HumanitixOrganisations>("organisations.json");

  // --- 1. Verify the vault is the data the manifest describes ---------------
  const exportEntry = manifest.exports.find((item) => item.exportId === exportId);
  if (!exportEntry) throw new Error(`Manifest has no export ${exportId}`);
  for (const file of exportEntry.files) {
    const path = vaultFilePath(exportId, file.file);
    if (sha256File(path) !== file.sha256) {
      throw new Error(
        `sha256 mismatch for ${file.file} — the vault is not the data the manifest describes. ` +
          `Re-run scripts/humanitix/manifest.ts --append if the export was legitimately replaced.`
      );
    }
  }

  const spineFile = pick(manifest, exportId, (f) => f.role === "spine");
  const cancelledFile = pick(
    manifest,
    exportId,
    (f) => f.report === "attendee-details" && f.filter === "cancelled"
  );
  const ordersFile = pick(
    manifest,
    exportId,
    (f) => f.report === "orders" && f.scope === "all-events" && f.filter === "complete"
  );
  const incompleteFile = pick(
    manifest,
    exportId,
    (f) => f.report === "orders" && f.filter === "incomplete"
  );
  const donationOrdersFile = pick(
    manifest,
    exportId,
    (f) => f.report === "orders" && f.filter === "donation"
  );
  const earningsFile = pick(
    manifest,
    exportId,
    (f) => f.report === "earnings-by-ticket-type"
  );
  const payoutFile = pick(manifest, exportId, (f) => f.report === "payouts");
  const accessFile = pick(manifest, exportId, (f) => f.report === "access-codes");
  const discountFile = pick(manifest, exportId, (f) => f.report === "discounts");
  const donationsFile = pick(
    manifest,
    exportId,
    (f) => f.report === "additional-donations"
  );

  // --- 2. The spine ---------------------------------------------------------
  const spine = readCsv(exportId, spineFile.file);

  // Six attendees typed their own name into the Company/Organisation box. Each
  // would otherwise be counted as an employer, and would be printed by name in
  // the funder report's organisations table. Indexing the names that actually
  // appear in this export is what turns that into something detectable.
  const personNameKeys = new Set<string>();
  for (const row of spine) {
    for (const [first, last] of [
      [row["First name"], row["Last name"]],
      [row["First Name"], row["Last Name"]],
      [row["Buyer first name"], row["Buyer last name"]],
    ] as [string | undefined, string | undefined][]) {
      const key = personNameKey(first ?? "", last ?? "");
      if (key) personNameKeys.add(key);
    }
  }
  let personalNamesSuppressed = 0;
  const instances = new Map<string, InstanceAccumulator>();
  const unclassifiedTicketTypes = new Set<string>();
  const personInstances = new Map<string, Set<string>>();
  const orgTickets = new Map<string, number>();
  const orgRawStrings = new Set<string>();
  let orgRowsAnswered = 0;
  let orgRowsNullish = 0;
  let checkedInTimestamps = 0;

  for (const row of spine) {
    const rawName = row["Event"] ?? "";
    const eventName = normalizeHumanitixText(rawName);
    const eventDate = parseDmyToIso(row["Event date"] ?? "");
    const key = humanitixInstanceKey(eventName, eventDate);

    let instance = instances.get(key);
    if (!instance) {
      instance = {
        key,
        eventName,
        eventNameRaw: new Set(),
        eventDate,
        eventTime: normalizeHumanitixText(row["Event time"] ?? ""),
        timezone: normalizeHumanitixText(row["Timezone"] ?? ""),
        registered: 0,
        cancelled: 0,
        checkedIn: 0,
        earningsCents: 0,
        cancelledEarningsCents: 0,
        discountCodeUses: 0,
        accessCodeUses: 0,
        ticketTypes: new Map(),
        salesChannels: new Map(),
        organisations: new Set(),
        questionsAnswered: new Map(),
        orderIds: new Set(),
        orderDates: [],
      };
      instances.set(key, instance);
    }

    instance.eventNameRaw.add(rawName);
    instance.registered += 1;
    if (row["Checked in"] === "Checked in") instance.checkedIn += 1;
    if ((row["Checked in date"] ?? "").trim()) checkedInTimestamps += 1;
    instance.earningsCents += parseMoneyCents(row["Your earnings"]);
    if ((row["Discount code used"] ?? "").trim()) instance.discountCodeUses += 1;
    if ((row["Access code used"] ?? "").trim()) instance.accessCodeUses += 1;

    const ticketType = normalizeHumanitixText(row["Ticket type"] ?? "");
    if (resolveSegment(ticketType, segments) === null) {
      unclassifiedTicketTypes.add(ticketType);
    }
    const bucket = instance.ticketTypes.get(ticketType) ?? {
      tickets: 0,
      earningsCents: 0,
    };
    bucket.tickets += 1;
    bucket.earningsCents += parseMoneyCents(row["Your earnings"]);
    instance.ticketTypes.set(ticketType, bucket);

    const channel = normalizeHumanitixText(row["Sales Channel"] ?? "") || "Unknown";
    instance.salesChannels.set(channel, (instance.salesChannels.get(channel) ?? 0) + 1);

    const orgRaw = row["Company/Organisation"] ?? "";
    if (normalizeHumanitixText(orgRaw)) {
      orgRowsAnswered += 1;
      orgRawStrings.add(normalizeHumanitixText(orgRaw));
      const personal = isPersonalName(orgRaw, personNameKeys, organisations);
      if (personal) personalNamesSuppressed += 1;
      const orgId = personal
        ? null
        : canonicalOrganisationId(orgRaw, organisations);
      if (orgId) {
        instance.organisations.add(orgId);
        orgTickets.set(orgId, (orgTickets.get(orgId) ?? 0) + 1);
      } else {
        orgRowsNullish += 1;
      }
    }

    for (const question of QUESTION_COLUMNS) {
      const header =
        question.match === "exact"
          ? question.header
          : Object.keys(row).find((name) => name.startsWith(question.header));
      if (!header) continue;
      if ((row[header] ?? "").trim()) {
        instance.questionsAnswered.set(
          question.key,
          (instance.questionsAnswered.get(question.key) ?? 0) + 1
        );
      }
    }

    const orderId = (row["Order id"] ?? "").trim();
    if (orderId) instance.orderIds.add(orderId);
    const stamp = orderDate(row);
    if (stamp) instance.orderDates.push(stamp);

    const person = personKey(row);
    if (person) {
      const hash = sha256(person);
      if (!ORG_ACCOUNT_HASHES.has(hash)) {
        const seen = personInstances.get(hash) ?? new Set<string>();
        seen.add(key);
        personInstances.set(hash, seen);
      }
    }
  }

  if (unclassifiedTicketTypes.size > 0) {
    console.error(
      `\n${unclassifiedTicketTypes.size} ticket type(s) match no rule in segments.json:`
    );
    for (const type of [...unclassifiedTicketTypes].sort()) {
      console.error(`  ${JSON.stringify(type)}`);
    }
    console.error(
      "\nAdd a rule rather than letting them fall into a bucket — an unclassified\n" +
        "ticket type is a new kind of ticket nobody has looked at yet."
    );
    process.exit(1);
  }

  // --- 3. Cancelled tickets -------------------------------------------------
  for (const row of readCsv(exportId, cancelledFile.file)) {
    const key = humanitixInstanceKey(
      normalizeHumanitixText(row["Event"] ?? ""),
      parseDmyToIso(row["Event date"] ?? "")
    );
    const instance = instances.get(key);
    if (!instance) continue;
    instance.cancelled += 1;
    // Humanitix's own earnings report counts a cancelled ticket's earnings, and
    // so does the order report — which is why $25,090 of valid-ticket earnings
    // plus $90 of cancelled ones is what reconciles to the $25,180 both of them
    // report. Following the platform's definition keeps one number, not two.
    instance.cancelledEarningsCents += parseMoneyCents(row["Your earnings"]);
  }

  // --- 4. Capacity, from the earnings report --------------------------------
  const capacityByInstance = new Map<string, { capacity: number; sold: number }>();
  const capacityByTicketType = new Map<
    string,
    { capacity: number; sold: number; earningsCents: number }
  >();
  let totalCapacity = 0;
  let totalSold = 0;
  let ticketEarningsCents = 0;

  for (const row of readCsv(exportId, earningsFile.file)) {
    const key = humanitixInstanceKey(
      normalizeHumanitixText(row["Event Name"] ?? ""),
      parseDmyToIso(row["Event Date"] ?? "")
    );
    const capacity = parseIntStrict(row["Capacity"]);
    const sold = parseIntStrict(row["Sold"]);
    const earnings = parseMoneyCents(row["Earnings"]);
    totalCapacity += capacity;
    totalSold += sold;
    ticketEarningsCents += earnings;

    const perInstance = capacityByInstance.get(key) ?? { capacity: 0, sold: 0 };
    perInstance.capacity += capacity;
    perInstance.sold += sold;
    capacityByInstance.set(key, perInstance);

    const typeKey = `${key} ${normalizeHumanitixText(row["Ticket Type"] ?? "")}`;
    const perType = capacityByTicketType.get(typeKey) ?? {
      capacity: 0,
      sold: 0,
      earningsCents: 0,
    };
    perType.capacity += capacity;
    perType.sold += sold;
    perType.earningsCents += earnings;
    capacityByTicketType.set(typeKey, perType);
  }

  // --- 5. Identity and venue, from the Event summary ------------------------
  //
  // The Event summary is the only report with one row per event, so it is where
  // the Humanitix Event ID, organiser and venue come from. Before it was
  // exported the id was recoverable only from the payout report, and only for
  // 38 of 62 instances — and one value in that column turned out not to be an
  // event id at all (`JWEASJXE`, attached to ten unrelated 2021-22 events). The
  // payout fallback is kept for exports taken without the Event summary, with
  // the same rule as before: an identifier appearing against more than one
  // instance is discarded, because a wrong id is worse than none.
  const eventIdByInstance = new Map<string, string>();
  const venueByInstance = new Map<string, string>();
  const organiserByInstance = new Map<string, string>();
  const eventIds = new Set<string>();

  const summaryFile = exportEntry.files.find((f) => f.report === "event-summary");
  if (summaryFile) {
    const summaryRows = readCsv(exportId, summaryFile.file).map((row) => ({
      key: humanitixInstanceKey(
        normalizeHumanitixText(row["Event Name"] ?? ""),
        parseDmyToIso(row["Date"] ?? "")
      ),
      name: normalizeHumanitixText(row["Event Name"] ?? ""),
      id: (row["Event ID"] ?? "").trim(),
      venue: normalizeHumanitixText(row["Location"] ?? ""),
      organiser: normalizeHumanitixText(row["Organiser"] ?? ""),
    }));

    // An Event ID may legitimately cover several rows — a Humanitix event that
    // ran on several dates produces one row per date under one id, which is
    // exactly what the two 2020 STORYTELLERS series are. What is NOT legitimate
    // is an id spanning several different event NAMES: `JWEASJXE` covers twelve
    // unrelated events across 2021 and 2022 and is an account-level identifier
    // Humanitix wrote into the column for that era. So the test is names, not
    // rows. Recording it would hand the next person twelve events and no
    // warning — a wrong identifier is worse than none.
    const namesPerId = new Map<string, Set<string>>();
    for (const row of summaryRows) {
      if (!row.id) continue;
      namesPerId.set(row.id, (namesPerId.get(row.id) ?? new Set()).add(row.name));
    }
    const nonEventIds = new Set(
      [...namesPerId]
        .filter(([, names]) => names.size > 1)
        .map(([id]) => id)
    );

    for (const row of summaryRows) {
      if (row.id && !nonEventIds.has(row.id)) {
        eventIdByInstance.set(row.key, row.id);
        eventIds.add(row.id);
      }
      if (row.venue) venueByInstance.set(row.key, row.venue);
      if (row.organiser) organiserByInstance.set(row.key, row.organiser);
    }

    if (nonEventIds.size > 0) {
      console.log(
        `  note: discarded ${nonEventIds.size} non-event identifier(s) from the Event summary ` +
          `(each spanning several unrelated events)`
      );
    }
  }

  const payoutRowsData = readCsv(exportId, payoutFile.file);
  const instancesPerId = new Map<string, Set<string>>();
  let payoutCents = 0;

  for (const row of payoutRowsData) {
    const key = humanitixInstanceKey(
      normalizeHumanitixText(row["Event Name"] ?? ""),
      parseDmyToIso(row["Event Date"] ?? "")
    );
    const id = (row["Event ID"] ?? "").trim();
    if (id) instancesPerId.set(id, (instancesPerId.get(id) ?? new Set()).add(key));
    payoutCents += parseMoneyCents(row["Payout Amount"]);
  }

  const payoutEventIds = new Set<string>();
  const ambiguousEventIds: string[] = [];
  for (const [id, keys] of instancesPerId) {
    if (keys.size > 1) {
      ambiguousEventIds.push(id);
      continue;
    }
    const key = [...keys][0];
    payoutEventIds.add(id);
    if (!eventIdByInstance.has(key)) {
      eventIdByInstance.set(key, id);
      eventIds.add(id);
    }
  }
  if (!summaryFile && ambiguousEventIds.length > 0) {
    console.log(
      `  note: discarded ${ambiguousEventIds.length} non-event identifier(s) from the payout report ` +
        `(each attached to several unrelated events)`
    );
  }
  const payoutRows = payoutRowsData.length;

  // --- 6. Orders ------------------------------------------------------------
  const orders = readCsv(exportId, ordersFile.file);
  const ordersByInstance = new Map<string, number>();
  const donationsByInstance = new Map<string, { orders: number; cents: number }>();
  let orderEarningsCents = 0;
  let orderDonationCents = 0;
  let optInOrders = 0;
  const optInEmails = new Set<string>();
  const optInDates: string[] = [];

  for (const row of orders) {
    const key = humanitixInstanceKey(
      normalizeHumanitixText(row["Event"] ?? ""),
      parseDmyToIso(row["Event date"] ?? "")
    );
    ordersByInstance.set(key, (ordersByInstance.get(key) ?? 0) + 1);
    orderEarningsCents += parseMoneyCents(row["Your earnings"]);

    const donation = parseMoneyCents(row["Donations"]);
    orderDonationCents += donation;
    if (donation !== 0) {
      const bucket = donationsByInstance.get(key) ?? { orders: 0, cents: 0 };
      bucket.orders += 1;
      bucket.cents += donation;
      donationsByInstance.set(key, bucket);
    }

    if (row["Marketing opt-in"] === "Yes") {
      optInOrders += 1;
      const email = (row["Email"] ?? "").trim().toLowerCase();
      if (email) optInEmails.add(sha256(email));
      const date = (row["Order date"] ?? "").trim();
      if (date) optInDates.push(parseDmyToIso(date.split(" ")[0]));
    }
  }

  const incompleteOrders = readCsv(exportId, incompleteFile.file).length;
  const donationOrders = readCsv(exportId, donationOrdersFile.file).length;

  // The additional-donation report is a fourth, independent path to the same
  // donation total. It is reconciled in scripts/humanitix/verify-export.ts
  // rather than summed again here, so the archive keeps one source per figure.
  void donationsFile;

  // --- 7. Code counts. Counts only — no value is ever read into the archive --
  const accessRows = readCsv(exportId, accessFile.file);
  const discountRows = readCsv(exportId, discountFile.file);
  const accessCodesDistinct = new Set(accessRows.map((row) => row["Code"])).size;
  const discountCodesDistinct = new Set(discountRows.map((row) => row["Code"])).size;

  // --- 8. Series ------------------------------------------------------------
  const byName = new Map<string, InstanceAccumulator[]>();
  for (const instance of instances.values()) {
    const list = byName.get(instance.eventName) ?? [];
    list.push(instance);
    byName.set(instance.eventName, list);
  }
  const seriesKeyByInstance = new Map<string, { seriesKey: string; ordinal: number }>();
  for (const [name, list] of byName) {
    if (list.length < 2) continue;
    const sorted = [...list].sort((a, b) => a.eventDate.localeCompare(b.eventDate));
    const seriesKey = humanitixInstanceKey(name, sorted[0].eventDate).split("--")[1];
    sorted.forEach((instance, index) => {
      seriesKeyByInstance.set(instance.key, { seriesKey, ordinal: index + 1 });
    });
  }

  // --- 9. events.json -------------------------------------------------------
  const sortedInstances = [...instances.values()].sort((a, b) =>
    a.eventDate === b.eventDate
      ? a.key.localeCompare(b.key)
      : a.eventDate.localeCompare(b.eventDate)
  );

  const eventInstances: HumanitixEventInstance[] = sortedInstances.map((instance) => {
    const capacity = capacityByInstance.get(instance.key) ?? null;
    const series = seriesKeyByInstance.get(instance.key) ?? null;
    const donations = donationsByInstance.get(instance.key) ?? { orders: 0, cents: 0 };
    const dates = [...instance.orderDates].sort();

    const ticketTypes: HumanitixTicketTypeBreakdown[] = [...instance.ticketTypes]
      .map(([ticketType, value]) => {
        const fromEarnings = capacityByTicketType.get(
          `${instance.key} ${ticketType}`
        );
        return {
          ticketType,
          segment: resolveSegment(ticketType, segments) as string,
          tickets: value.tickets,
          capacity: fromEarnings ? fromEarnings.capacity : null,
          sold: fromEarnings ? fromEarnings.sold : null,
          earnings: centsToAmount(value.earningsCents),
        };
      })
      .sort((a, b) =>
        a.segment === b.segment
          ? a.ticketType.localeCompare(b.ticketType)
          : a.segment.localeCompare(b.segment)
      );

    return {
      key: instance.key,
      eventName: instance.eventName,
      eventNameRaw: [...instance.eventNameRaw].sort(),
      eventDate: instance.eventDate,
      eventTime: instance.eventTime,
      timezone: instance.timezone,
      humanitixEventId: eventIdByInstance.get(instance.key) ?? null,
      venue: venueByInstance.get(instance.key) ?? null,
      organiser: organiserByInstance.get(instance.key) ?? null,
      seriesKey: series?.seriesKey ?? null,
      sessionOrdinal: series?.ordinal ?? null,
      registered: instance.registered,
      cancelled: instance.cancelled,
      checkedIn: instance.checkedIn,
      checkInDataPresent:
        instance.checkedIn > 0 &&
        instance.checkedIn / instance.registered >= CHECK_IN_FLOOR,
      capacity: capacity ? capacity.capacity : null,
      sold: capacity ? capacity.sold : null,
      available: capacity ? capacity.capacity - capacity.sold : null,
      earnings: centsToAmount(
        instance.earningsCents + instance.cancelledEarningsCents
      ),
      orders: ordersByInstance.get(instance.key) ?? 0,
      firstOrderAt: dates[0] ?? "",
      lastOrderAt: dates[dates.length - 1] ?? "",
      ticketTypes,
      salesChannels: Object.fromEntries(
        [...instance.salesChannels].sort((a, b) => a[0].localeCompare(b[0]))
      ),
      discountCodeUses: instance.discountCodeUses,
      accessCodeUses: instance.accessCodeUses,
      donations: { orders: donations.orders, amount: centsToAmount(donations.cents) },
      organisationsRepresented: instance.organisations.size,
      questionsAnswered: Object.fromEntries(
        [...instance.questionsAnswered].sort((a, b) => a[0].localeCompare(b[0]))
      ),
    };
  });

  const events: HumanitixEvents = {
    metadata: {
      generatedBy: GENERATED_BY,
      exportId,
      generatedFrom: exportEntry.files
        .filter((file) => file.role === "spine" || file.role === "primary")
        .map((file) => file.file)
        .sort(),
      instances: eventInstances.length,
      eventNames: byName.size,
      currency: "NZD",
      note: "GENERATED — do not hand-edit; run scripts/humanitix/build-archive.ts. The mapping to site event slugs lives in crosswalk.json, which IS hand-authored and is never written by the builder.",
    },
    instances: eventInstances,
  };

  // --- 10. aggregates.json --------------------------------------------------
  const byYear = new Map<number, HumanitixEventInstance[]>();
  for (const instance of eventInstances) {
    const year = Number(instance.eventDate.slice(0, 4));
    byYear.set(year, [...(byYear.get(year) ?? []), instance]);
  }

  const segmentTickets = new Map<string, number>();
  const ticketTypeTickets = new Map<string, { segment: string; tickets: number }>();
  for (const instance of eventInstances) {
    for (const type of instance.ticketTypes) {
      segmentTickets.set(
        type.segment,
        (segmentTickets.get(type.segment) ?? 0) + type.tickets
      );
      const existing = ticketTypeTickets.get(type.ticketType) ?? {
        segment: type.segment,
        tickets: 0,
      };
      existing.tickets += type.tickets;
      ticketTypeTickets.set(type.ticketType, existing);
    }
  }
  const totalRegistered = eventInstances.reduce(
    (sum, instance) => sum + instance.registered,
    0
  );

  const repeat = new Map<number, number>();
  for (const seen of personInstances.values()) {
    repeat.set(seen.size, (repeat.get(seen.size) ?? 0) + 1);
  }

  const MIN_ORG_TICKETS = 5;
  const zeroCheckIn = eventInstances.filter((instance) => !instance.checkInDataPresent);
  const withCheckIn = eventInstances.filter((instance) => instance.checkInDataPresent);
  const salesChannelTotals = new Map<string, number>();
  for (const instance of eventInstances) {
    for (const [channel, count] of Object.entries(instance.salesChannels)) {
      salesChannelTotals.set(channel, (salesChannelTotals.get(channel) ?? 0) + count);
    }
  }
  const optInDatesSorted = [...optInDates].sort();

  const aggregates: HumanitixAggregates = {
    metadata: {
      generatedBy: GENERATED_BY,
      exportId,
      currency: "NZD",
      definitionsDoc: "docs/development/HUMANITIX_ARCHIVE.md#metric-definitions",
      personHash:
        "sha256(email.trim().toLowerCase()) — used only to GROUP rows while counting. No hash is written to this file: 2,920 unsalted digests of email addresses are dictionary-attackable by anyone holding a candidate address list, and every count below survives without them.",
      saltFingerprint: "n/a — no hash is committed",
    },
    totals: {
      instances: eventInstances.length,
      eventNames: byName.size,
      registered: totalRegistered,
      cancelled: eventInstances.reduce((sum, i) => sum + i.cancelled, 0),
      checkedIn: eventInstances.reduce((sum, i) => sum + i.checkedIn, 0),
      checkedInTimestamps,
      orders: {
        complete: orders.length,
        incomplete: incompleteOrders,
        donation: donationOrders,
      },
      earnings: {
        tickets: centsToAmount(ticketEarningsCents),
        donations: centsToAmount(orderDonationCents),
        total: centsToAmount(orderEarningsCents),
      },
      capacity: totalCapacity,
      sold: totalSold,
      instancesWithEventId: eventInstances.filter((i) => i.humanitixEventId).length,
      payouts: {
        count: payoutRows,
        total: centsToAmount(payoutCents),
        eventsCovered: payoutEventIds.size,
      },
    },
    byYear: [...byYear.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([year, list]) => {
        const recorded = list.filter((instance) => instance.checkInDataPresent);
        const registered = list.reduce((sum, i) => sum + i.registered, 0);
        const recordedRegistered = recorded.reduce((sum, i) => sum + i.registered, 0);
        const checkedIn = list.reduce((sum, i) => sum + i.checkedIn, 0);
        return {
          year,
          instances: list.length,
          registered,
          checkedIn,
          checkInDataPresent: recorded.length > 0,
          checkInRate:
            recorded.length === 0
              ? null
              : Math.round((checkedIn / recordedRegistered) * 10000) / 10000,
          earnings: centsToAmount(
            list.reduce((sum, i) => sum + Math.round(i.earnings * 100), 0)
          ),
        };
      }),
    bySegment: [...segmentTickets.entries()]
      .sort((a, b) => (b[1] === a[1] ? a[0].localeCompare(b[0]) : b[1] - a[1]))
      .map(([segment, tickets]) => ({
        segment,
        label: segmentLabel(segment, segments),
        tickets,
        share: Math.round((tickets / totalRegistered) * 10000) / 10000,
      })),
    byTicketType: [...ticketTypeTickets.entries()]
      .sort((a, b) =>
        b[1].tickets === a[1].tickets
          ? a[0].localeCompare(b[0])
          : b[1].tickets - a[1].tickets
      )
      .map(([ticketType, value]) => ({
        ticketType,
        segment: value.segment,
        tickets: value.tickets,
      })),
    people: {
      uniqueEmails: personInstances.size + ORG_ACCOUNT_HASHES.size,
      orgAccountsExcluded: ORG_ACCOUNT_HASHES.size,
      uniquePeople: personInstances.size,
      repeatDistribution: [...repeat.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([count, people]) => ({ instances: count, people })),
      maxInstancesPerPerson: Math.max(
        ...[...personInstances.values()].map((seen) => seen.size)
      ),
      caveat:
        "Repeat REGISTRATION, not repeat attendance — a person who registered and did not come is counted. It only becomes attendance when restricted to the instances that recorded check-ins, i.e. 2023 onward. One person with two addresses counts twice; a shared household address counts once. She Sharp's own shared booking mailbox is excluded: its 47 tickets carry 38 different attendee names, so the people behind them are unrecoverable and are simply absent from this distribution.",
    },
    organisations: {
      distinctRawStrings: orgRawStrings.size,
      distinctCanonical: orgTickets.size,
      rowsAnswered: orgRowsAnswered,
      rowsNotAnswered: totalRegistered - orgRowsAnswered,
      rowsNullish: orgRowsNullish,
      rowsPersonalName: personalNamesSuppressed,
      minTickets: MIN_ORG_TICKETS,
      top: [...orgTickets.entries()]
        .filter(([, tickets]) => tickets >= MIN_ORG_TICKETS)
        .sort((a, b) => (b[1] === a[1] ? a[0].localeCompare(b[0]) : b[1] - a[1]))
        .map(([id, tickets]) => {
          const declared = organisations.canonical.find((entry) => entry.id === id);
          return {
            id,
            name: declared?.name ?? id,
            tickets,
            kind: declared?.kind ?? "unlisted",
          };
        }),
    },
    codes: {
      accessCodesDistinct,
      accessCodeUses: eventInstances.reduce((sum, i) => sum + i.accessCodeUses, 0),
      discountCodesDistinct,
      discountCodeUses: eventInstances.reduce((sum, i) => sum + i.discountCodeUses, 0),
      note: "Counts only. No code value appears anywhere in this repository, including docs and commit messages — a leaked code grants free entry and can only be fixed by rotating it. See the 2026-06-11 incident.",
    },
    marketingOptIn: {
      orders: optInOrders,
      uniqueEmails: optInEmails.size,
      firstOrderDate: optInDatesSorted[0] ?? "",
      lastOrderDate: optInDatesSorted[optInDatesSorted.length - 1] ?? "",
      caveat:
        "A historical record of a checkout field that stopped being used after 2022, not a sending list. Whether a four-to-six-year-old opt-in is still a permission is decided by .claude/skills/update-mailing-list/references/consent-rules.md, not by this file.",
    },
    checkInCoverage: {
      instances: eventInstances.length,
      withCheckIns: withCheckIn.length,
      withZeroCheckIns: zeroCheckIn.length,
      firstInstanceWithCheckIns: withCheckIn[0]?.key ?? "",
      zeroInstanceKeys: zeroCheckIn.map((instance) => instance.key),
      floor: CHECK_IN_FLOOR,
      discardedAsArtefact: eventInstances
        .filter((instance) => instance.checkedIn > 0 && !instance.checkInDataPresent)
        .map((instance) => ({
          key: instance.key,
          scanned: instance.checkedIn,
          registered: instance.registered,
        })),
    },
    salesChannels: Object.fromEntries(
      [...salesChannelTotals].sort((a, b) => a[0].localeCompare(b[0]))
    ),
    caveats: [
      "Humanitix holds nothing before 2020. Any 'since 2014' figure drawn from this archive is wrong at the start.",
      `This archive is not the event register: ${eventInstances.length} ticketed instances against 97 records in lib/data/json/. Events sold elsewhere or never ticketed — the 2025 AI Hackathon Festival, every expo — are absent by design.`,
      `${zeroCheckIn.length} of ${eventInstances.length} instances never ran a check-in. Their checkedIn is 0 because nobody scanned, not because nobody came; checkInDataPresent is the field that says which.`,
      "checkedIn counts the 'Checked in' flag. A slightly larger number of rows carry a check-in timestamp; the flag is the definition the organisation has reported against since 2020 and the one the site's own figures match.",
      "earnings is net to She Sharp after Humanitix fees — not gross, not what attendees paid.",
      "registered counts TICKETS, not people. It includes the organisation's own booking account.",
      "The employer string is typed freehand at checkout and never verified.",
    ],
  };

  // --- 11. Write, check or report ------------------------------------------
  const outputs: { name: string; body: string }[] = [
    { name: "events.json", body: render(events) },
    { name: "aggregates.json", body: render(aggregates) },
  ];

  if (check) {
    let differences = 0;
    for (const output of outputs) {
      const path = join(ARCHIVE_DIR, output.name);
      const current = existsSync(path) ? readFileSync(path, "utf8") : "";
      if (current === output.body) continue;
      differences++;
      const at = [...output.body].findIndex((char, index) => current[index] !== char);
      console.error(
        `  FAIL - ${output.name} differs from the committed file (first difference at byte ${at})`
      );
    }
    console.log(
      differences === 0
        ? `ok - ${outputs.length} generated files unchanged`
        : `\n${differences} generated file(s) differ.`
    );
    process.exit(differences === 0 ? 0 : 1);
  }

  console.log("=== Humanitix archive build ===");
  console.log(`  export           ${exportId}`);
  console.log(`  instances        ${eventInstances.length}`);
  console.log(`  event names      ${byName.size}`);
  console.log(`  registered       ${aggregates.totals.registered}`);
  console.log(`  checked in       ${aggregates.totals.checkedIn}`);
  console.log(`  cancelled        ${aggregates.totals.cancelled}`);
  console.log(`  earnings         $${aggregates.totals.earnings.total.toFixed(2)}`);
  console.log(`  unique people    ${aggregates.people.uniquePeople}`);
  console.log(`  organisations    ${aggregates.organisations.distinctCanonical}`);
  console.log(
    `  check-in gaps    ${zeroCheckIn.length} of ${eventInstances.length} instances`
  );

  if (dryRun) {
    console.log("\n=== Dry run report ===");
    for (const output of outputs) {
      console.log(`  would write ${output.name} (${output.body.length} bytes)`);
    }
    console.log("Nothing was written.");
    return;
  }

  for (const output of outputs) {
    writeFileSync(join(ARCHIVE_DIR, output.name), output.body, "utf8");
    console.log(`  wrote lib/data/json/humanitix/${output.name}`);
  }
}

main();
