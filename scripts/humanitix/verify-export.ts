/**
 * Reconciles a raw Humanitix export against itself.
 *
 * This is the step that proves the data before anything is built from it. The
 * Humanitix account exports overlap heavily — the same tickets are counted by
 * the attendee report, the order report, the earnings report, the guest list
 * and the payout report — and that redundancy is worth something only if
 * somebody checks it. Every invariant below is an equality the account's own
 * reports must satisfy, so a truncated download or a half-finished export
 * fails here rather than becoming a plausible wrong number six months later.
 *
 * Two of them deliberately assert a DIFFERENCE rather than an equality: the
 * earnings report counts 49 fewer tickets than the spine, and 21 more rows
 * carry a check-in timestamp than carry the check-in flag. Pinning a real gap
 * is more useful than an invariant that pretends there isn't one.
 *
 * Needs the vault, so it never runs on CI. `lib/data/humanitix.test.ts` holds
 * the invariants that survive without the raw data.
 *
 * Usage:
 *   npx tsx scripts/humanitix/verify-export.ts --export 2026-08-17
 *   npx tsx scripts/humanitix/verify-export.ts --export 2026-08-17 --allow-missing-vault
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  humanitixCrosswalk,
  humanitixInstanceKey,
  isPersonalName,
  normalizeHumanitixText,
  personNameKey,
} from "../../lib/data/humanitix";
import type { HumanitixManifest, HumanitixManifestFile } from "../../types/humanitix";
import {
  parseDmyToIso,
  parseIntStrict,
  parseMoneyCents,
  readCsv,
  readHeaderlessCsv,
} from "./csv";
import { ARCHIVE_DIR, argValue, sha256File, vaultExists, vaultFilePath } from "./vault";

let failures = 0;

function check(label: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  ok - ${label}`);
  } else {
    failures++;
    console.error(`  FAIL - ${label}${detail ? `: ${detail}` : ""}`);
  }
}

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

function main() {
  const argv = process.argv.slice(2);
  const exportId = argValue(argv, "--export");
  const allowMissing = argv.includes("--allow-missing-vault");

  if (!exportId) {
    console.error(
      "Usage: npx tsx scripts/humanitix/verify-export.ts --export <YYYY-MM-DD> [--allow-missing-vault]"
    );
    process.exit(1);
  }

  if (!vaultExists(exportId)) {
    // A verify script that passes with no data to verify is worse than no
    // verify script, so the silence has to be asked for explicitly.
    if (allowMissing) {
      console.log("SKIP - vault not present; the export invariants were not run");
      process.exit(0);
    }
    console.error(
      `Vault not found for export ${exportId}.\n` +
        `  Set HUMANITIX_VAULT_DIR, or place the raw CSVs in private/humanitix/${exportId}/.\n` +
        `  Pass --allow-missing-vault to skip instead of failing.`
    );
    process.exit(1);
  }

  const manifest = JSON.parse(
    readFileSync(join(ARCHIVE_DIR, "manifest.json"), "utf8")
  ) as HumanitixManifest;
  const entry = manifest.exports.find((item) => item.exportId === exportId);
  if (!entry) {
    console.error(`Manifest has no export ${exportId}.`);
    process.exit(1);
  }

  const one = (predicate: (file: HumanitixManifestFile) => boolean) => {
    const matches = entry.files.filter(predicate);
    if (matches.length !== 1) {
      throw new Error(`Expected one matching file, found ${matches.length}`);
    }
    return matches[0];
  };

  const spineFile = one((f) => f.role === "spine");
  const cancelledFile = one(
    (f) => f.report === "attendee-details" && f.filter === "cancelled"
  );
  const ordersFile = one(
    (f) => f.report === "orders" && f.scope === "all-events" && f.filter === "complete"
  );
  const incompleteFile = one((f) => f.report === "orders" && f.filter === "incomplete");
  const earningsFile = one((f) => f.report === "earnings-by-ticket-type");
  const payoutFile = one((f) => f.report === "payouts");
  const donationsFile = one((f) => f.report === "additional-donations");
  const guestListFile = one((f) => f.report === "guest-list");
  const singleEventOrders = entry.files.filter(
    (f) => f.report === "orders" && f.scope === "single-event"
  );

  const spine = readCsv(exportId, spineFile.file);
  const cancelled = readCsv(exportId, cancelledFile.file);
  const orders = readCsv(exportId, ordersFile.file);
  const incomplete = readCsv(exportId, incompleteFile.file);
  const earnings = readCsv(exportId, earningsFile.file);
  const payouts = readCsv(exportId, payoutFile.file);
  const donations = readCsv(exportId, donationsFile.file);
  const guestList = readHeaderlessCsv(exportId, guestListFile.file);

  console.log(`\nReconciling Humanitix export ${exportId}\n`);

  // --- 1 & 2. Tickets ------------------------------------------------------
  console.log("Tickets");
  const validTickets = orders.reduce(
    (total, row) => total + parseIntStrict(row["Valid tickets"]),
    0
  );
  check(
    "1. the attendee report has one row per valid ticket in the order report",
    spine.length === validTickets,
    `${spine.length} rows vs ${validTickets} valid tickets`
  );
  const cancelledTickets = orders.reduce(
    (total, row) => total + parseIntStrict(row["Cancelled tickets"]),
    0
  );
  check(
    "2. the cancelled attendee report matches the order report's cancellations",
    cancelled.length === cancelledTickets,
    `${cancelled.length} rows vs ${cancelledTickets}`
  );

  // --- 3. Money ------------------------------------------------------------
  console.log("\nMoney");
  const orderEarnings = orders.reduce(
    (total, row) => total + parseMoneyCents(row["Your earnings"]),
    0
  );
  const ticketEarnings = earnings.reduce(
    (total, row) => total + parseMoneyCents(row["Earnings"]),
    0
  );
  const orderDonations = orders.reduce(
    (total, row) => total + parseMoneyCents(row["Donations"]),
    0
  );
  check(
    "3. order earnings equal ticket earnings plus donations",
    orderEarnings === ticketEarnings + orderDonations,
    `${money(orderEarnings)} vs ${money(ticketEarnings)} + ${money(orderDonations)}`
  );
  const donationReportTotal = donations.reduce(
    (total, row) => total + parseMoneyCents(row["Total"]),
    0
  );
  check(
    "3b. the donation report independently confirms the donation total",
    donationReportTotal === orderDonations,
    `${money(donationReportTotal)} vs ${money(orderDonations)}`
  );
  const spineEarnings = spine.reduce(
    (total, row) => total + parseMoneyCents(row["Your earnings"]),
    0
  );
  const cancelledEarnings = cancelled.reduce(
    (total, row) => total + parseMoneyCents(row["Your earnings"]),
    0
  );
  // Humanitix's earnings report counts a cancelled ticket's earnings. This is
  // why per-instance earnings in the archive include them: one definition, not
  // two that look alike.
  check(
    "3c. valid plus cancelled ticket earnings equal the earnings report",
    spineEarnings + cancelledEarnings === ticketEarnings,
    `${money(spineEarnings)} + ${money(cancelledEarnings)} vs ${money(ticketEarnings)}`
  );

  // --- 4 & 5. The redundant files really are redundant ----------------------
  console.log("\nRedundancy");
  check(
    "4. the guest list has one row per ticket",
    guestList.length === spine.length,
    `${guestList.length} vs ${spine.length}`
  );
  // The guest list has no header row, so its columns are positional: 0 event,
  // 1 first name, 2 last name, 3 order id, 4 order stamp, 5 ticket type.
  const spineOrderIds = new Set(spine.map((row) => row["Order id"]));
  const guestListOrphans = guestList.filter((row) => !spineOrderIds.has(row[3]));
  check(
    "4b. every guest-list row names an order in the attendee report",
    guestListOrphans.length === 0,
    `${guestListOrphans.length} row(s) with no match`
  );

  const orderIds = new Set(orders.map((row) => row["Order id"]));
  let singleEventRows = 0;
  let singleEventOrphans = 0;
  for (const file of singleEventOrders) {
    for (const row of readCsv(exportId, file.file)) {
      singleEventRows++;
      if (!orderIds.has(row["Order id"])) singleEventOrphans++;
    }
  }
  check(
    "5. every single-event order export is a subset of the account-level one",
    singleEventOrphans === 0,
    `${singleEventOrphans} of ${singleEventRows} rows not found`
  );

  // --- 6. A known difference, pinned ---------------------------------------
  console.log("\nKnown differences");
  const soldFromEarnings = earnings.reduce(
    (total, row) => total + parseIntStrict(row["Sold"]),
    0
  );
  const soldGap = spine.length - soldFromEarnings;
  check(
    "6. the earnings report's ticket count sits a known 49 below the spine",
    soldGap === 49,
    `gap is ${soldGap}, not 49 — the earnings report's coverage has changed`
  );

  const earningsGroups = new Set(
    earnings.map((row) =>
      humanitixInstanceKey(
        normalizeHumanitixText(row["Event Name"] ?? ""),
        parseDmyToIso(row["Event Date"] ?? "")
      )
    )
  );
  const spineGroups = new Set(
    spine.map((row) =>
      humanitixInstanceKey(
        normalizeHumanitixText(row["Event"] ?? ""),
        parseDmyToIso(row["Event date"] ?? "")
      )
    )
  );
  const missingFromEarnings = [...spineGroups].filter((key) => !earningsGroups.has(key));
  check(
    "6b. exactly two instances are absent from the earnings report",
    missingFromEarnings.length === 2,
    missingFromEarnings.join(", ")
  );
  if (missingFromEarnings.length > 0) {
    console.log(
      `       no capacity available for: ${missingFromEarnings.sort().join(", ")}`
    );
  }

  const timestamps = spine.filter((row) => (row["Checked in date"] ?? "").trim()).length;
  const flags = spine.filter((row) => row["Checked in"] === "Checked in").length;
  // The archive counts the FLAG. It is the definition the site's own published
  // figures match to the digit, so it is what the organisation has been
  // reporting all along.
  check(
    "10. a known 21 rows carry a check-in timestamp without the flag",
    timestamps - flags === 21,
    `difference is ${timestamps - flags}, not 21`
  );

  // --- 7 & 8. Shape --------------------------------------------------------
  console.log("\nShape");
  check(
    "7. the spine describes 62 instances under 59 distinct names",
    spineGroups.size === 62 &&
      new Set(spine.map((row) => normalizeHumanitixText(row["Event"] ?? ""))).size === 59,
    `${spineGroups.size} instances, ${new Set(spine.map((r) => normalizeHumanitixText(r["Event"] ?? ""))).size} names`
  );
  const perYear = new Map<string, number>();
  for (const row of spine) {
    const year = parseDmyToIso(row["Event date"] ?? "").slice(0, 4);
    perYear.set(year, (perYear.get(year) ?? 0) + 1);
  }
  const expectedYears: Record<string, number> = {
    "2020": 739,
    "2021": 333,
    "2022": 733,
    "2023": 1025,
    "2024": 1138,
    "2025": 618,
    "2026": 570,
  };
  const yearDrift = Object.entries(expectedYears).filter(
    ([year, count]) => (perYear.get(year) ?? 0) !== count
  );
  check(
    "7b. the per-year ticket counts are unchanged",
    yearDrift.length === 0,
    yearDrift.map(([y, n]) => `${y}: ${perYear.get(y)} not ${n}`).join(", ")
  );

  const nonComplete = spine.filter((row) => row["Status"] !== "complete");
  check(
    "8. every row in the spine is a complete ticket",
    nonComplete.length === 0,
    `${nonComplete.length} row(s) with another status`
  );
  const incompleteIds = new Set(incomplete.map((row) => row["Order id"]));
  const straddling = [...orderIds].filter((id) => incompleteIds.has(id));
  check(
    "8b. no order is both complete and incomplete",
    straddling.length === 0,
    straddling.join(", ")
  );

  // --- 9. Payouts ----------------------------------------------------------
  console.log("\nPayouts and identifiers");
  const payoutTotal = payouts.reduce(
    (total, row) => total + parseMoneyCents(row["Payout Amount"]),
    0
  );
  check(
    "9. the payout report settles no more than was earned",
    payoutTotal <= orderEarnings,
    `${money(payoutTotal)} paid out against ${money(orderEarnings)} earned`
  );
  const idToInstances = new Map<string, Set<string>>();
  for (const row of payouts) {
    const id = (row["Event ID"] ?? "").trim();
    if (!id) continue;
    const key = humanitixInstanceKey(
      normalizeHumanitixText(row["Event Name"] ?? ""),
      parseDmyToIso(row["Event Date"] ?? "")
    );
    idToInstances.set(id, (idToInstances.get(id) ?? new Set()).add(key));
  }
  // Exactly one value in that column is not an event identifier: it is attached
  // to ten unrelated 2021-22 events. The builder discards anything ambiguous, so
  // this pins the count — a second one appearing means Humanitix has changed
  // what it writes there, and the builder would start silently dropping ids.
  const ambiguous = [...idToInstances].filter(([, keys]) => keys.size > 1);
  check(
    "9b. exactly one payout identifier is not an event id",
    ambiguous.length === 1,
    `${ambiguous.length} ambiguous identifier(s): ${ambiguous.map(([id]) => id).join(", ")}`
  );
  const usableIds = [...idToInstances].filter(([, keys]) => keys.size === 1);
  console.log(
    `       ${usableIds.length} usable Event IDs for ${spineGroups.size} instances`
  );
  const unknownInstances = [...idToInstances.values()]
    .flatMap((keys) => [...keys])
    .filter((key) => !spineGroups.has(key));
  check(
    "9c. every payout names an instance the spine knows",
    unknownInstances.length === 0,
    unknownInstances.join(", ")
  );

  // --- 11. The Event summary as an independent second opinion --------------
  //
  // Every other invariant above checks reports that share a source. The Event
  // summary is Humanitix's own per-event rollup, so it is the one place the
  // archive's own arithmetic can be checked against a number this repository did
  // not compute.
  const summaryFile = entry.files.find((f) => f.report === "event-summary");
  if (!summaryFile) {
    console.log("\nEvent summary");
    console.log("  SKIP - this export has no Event summary report");
  } else {
    console.log("\nEvent summary (independent per-event rollup)");
    const summary = readCsv(exportId, summaryFile.file);
    const byKey = new Map<string, (typeof summary)[number]>();
    for (const row of summary) {
      byKey.set(
        humanitixInstanceKey(
          normalizeHumanitixText(row["Event Name"] ?? ""),
          parseDmyToIso(row["Date"] ?? "")
        ),
        row
      );
    }

    const missing = [...spineGroups].filter((key) => !byKey.has(key));
    check(
      "11. every instance in the spine appears in the Event summary",
      missing.length === 0,
      missing.join(", ")
    );

    // The extra rows are events that sold nothing, so they have no ticket in the
    // spine to be counted from. Real events; simply empty.
    const extra = [...byKey].filter(([key]) => !spineGroups.has(key));
    const nonEmptyExtra = extra.filter(([, row]) => parseIntStrict(row["Sold"]) > 0);
    check(
      "11b. every event absent from the spine sold nothing",
      nonEmptyExtra.length === 0,
      nonEmptyExtra.map(([key]) => key).join(", ")
    );
    if (extra.length > 0) {
      console.log(
        `       ${extra.length} event(s) sold zero tickets: ${extra.map(([k]) => k).join(", ")}`
      );
    }

    const soldDrift: string[] = [];
    const checkedInDrift: string[] = [];
    for (const key of spineGroups) {
      const row = byKey.get(key);
      if (!row) continue;
      const rows = spine.filter(
        (r) =>
          humanitixInstanceKey(
            normalizeHumanitixText(r["Event"] ?? ""),
            parseDmyToIso(r["Event date"] ?? "")
          ) === key
      );
      if (parseIntStrict(row["Sold"]) !== rows.length) soldDrift.push(key);
      const flagged = rows.filter((r) => r["Checked in"] === "Checked in").length;
      if (parseIntStrict(row["Checked-in"]) !== flagged) checkedInDrift.push(key);
    }
    check(
      "11c. the Event summary's ticket count matches the spine for every instance",
      soldDrift.length === 0,
      soldDrift.join(", ")
    );

    // ONE instance differs, and the reason is exact: Humanitix counts a
    // cancelled ticket that was scanned. Exactly one such row exists in the whole
    // archive — a cancelled AI Enviro Hack ticket checked in on 3 Sep 2022 — which
    // is why 61 of 62 agree to the digit. The archive counts check-ins on VALID
    // tickets, which is the definition the site's own published figures match.
    const cancelledCheckIns = cancelled.filter(
      (row) => row["Checked in"] === "Checked in"
    ).length;
    check(
      "11d. the Event summary's check-in count differs on exactly one instance",
      checkedInDrift.length === cancelledCheckIns,
      `${checkedInDrift.length} instance(s) differ against ${cancelledCheckIns} scanned cancelled ticket(s): ${checkedInDrift.join(", ")}`
    );

    // An Event ID covering several ROWS is fine — a Humanitix event that ran on
    // several dates produces one row per date. An Event ID covering several
    // NAMES is not an event id at all. `JWEASJXE` spans twelve unrelated events
    // across 2021-22; the builder discards ids like it, so this pins the count.
    // A second one appearing means Humanitix changed what it writes there.
    const namesPerId = new Map<string, Set<string>>();
    const rowsPerId = new Map<string, number>();
    for (const row of summary) {
      const id = (row["Event ID"] ?? "").trim();
      if (!id) continue;
      namesPerId.set(
        id,
        (namesPerId.get(id) ?? new Set()).add(
          normalizeHumanitixText(row["Event Name"] ?? "")
        )
      );
      rowsPerId.set(id, (rowsPerId.get(id) ?? 0) + 1);
    }
    check(
      "11e. the Event summary gives every event an Event ID",
      summary.every((row) => (row["Event ID"] ?? "").trim()),
      `${summary.filter((r) => !(r["Event ID"] ?? "").trim()).length} row(s) without one`
    );
    const spanning = [...namesPerId].filter(([, names]) => names.size > 1);
    check(
      "11f. exactly one Event ID spans more than one event name",
      spanning.length === 1,
      `${spanning.length}: ${spanning.map(([id, names]) => `${id} (${names.size} names)`).join(", ")}`
    );
    const multiDate = [...rowsPerId].filter(
      ([id, count]) => count > 1 && (namesPerId.get(id)?.size ?? 0) === 1
    );
    check(
      "11g. every multi-row Event ID with one name is a known multi-date series",
      multiDate.length === humanitixCrosswalk.series.length,
      `${multiDate.length} in the export against ${humanitixCrosswalk.series.length} in the crosswalk`
    );
    if (multiDate.length > 0) {
      console.log(
        `       multi-date events: ${multiDate.map(([id, n]) => `${id} (${n} dates)`).join(", ")}`
      );
    }
  }

  // --- 12. The vault is the data the manifest describes --------------------
  console.log("\nProvenance");
  const hashDrift = entry.files.filter(
    (file) => sha256File(vaultFilePath(exportId, file.file)) !== file.sha256
  );
  check(
    "12. every vault file still hashes to its recorded sha256",
    hashDrift.length === 0,
    hashDrift.map((f) => f.file).join(", ")
  );
  const shapeDrift = entry.files.filter((file) => {
    const rows = file.hasHeaderRow
      ? readCsv(exportId, file.file).length
      : readHeaderlessCsv(exportId, file.file).length;
    return rows !== file.rows;
  });
  check(
    "12b. every vault file still has its recorded row count",
    shapeDrift.length === 0,
    shapeDrift.map((f) => f.file).join(", ")
  );

  // --- 14. No code and no address escaped into the archive ------------------
  console.log("\nLeak guard (against the real values)");
  const archive = ["events.json", "aggregates.json", "crosswalk.json"]
    .map((name) => readFileSync(join(ARCHIVE_DIR, name), "utf8"))
    .join("\n");

  const accessCodes = new Set(
    readCsv(exportId, one((f) => f.report === "access-codes").file)
      .map((row) => (row["Code"] ?? "").trim())
      .filter(Boolean)
  );
  const discountCodes = new Set(
    readCsv(exportId, one((f) => f.report === "discounts").file)
      .map((row) => (row["Code"] ?? "").trim())
      .filter(Boolean)
  );
  const leakedCodes = [...accessCodes, ...discountCodes].filter((code) =>
    archive.includes(code)
  );
  check(
    "14. no access or discount code appears in the committed archive",
    leakedCodes.length === 0,
    // Never print the code itself, even when reporting the leak.
    `${leakedCodes.length} code value(s) found — rotate them`
  );

  const emails = new Set(
    spine
      .flatMap((row) => [row["Email"], row["Buyer email"]])
      .map((value) => (value ?? "").trim().toLowerCase())
      .filter(Boolean)
  );
  const leakedEmails = [...emails].filter((email) => archive.includes(email));
  check(
    "14b. no attendee or buyer address appears in the committed archive",
    leakedEmails.length === 0,
    `${leakedEmails.length} address(es) found`
  );

  const longOrderIds = new Set(
    orders.map((row) => (row["Long order id"] ?? "").trim()).filter(Boolean)
  );
  check(
    "14c. no long order id appears in the committed archive",
    [...longOrderIds].every((id) => !archive.includes(id))
  );

  const bankAccounts = new Set(
    payouts.map((row) => (row["Paid to account"] ?? "").trim()).filter((v) => v && v !== "-")
  );
  check(
    "14d. no payout account appears in the committed archive",
    [...bankAccounts].every((account) => !archive.includes(account))
  );

  // Six attendees typed their own name into the Company/Organisation box. The
  // archive suppresses those, and this is the check that proves it against the
  // real names — which CI cannot do, because CI has no attendee rows.
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
  const personalOrgs = [
    ...new Set(
      spine
        .map((row) => (row["Company/Organisation"] ?? "").trim())
        .filter((raw) => raw && isPersonalName(raw, personNameKeys))
    ),
  ];
  check(
    "14e. no registrant's own name is published as an organisation",
    personalOrgs.every((name) => !archive.includes(name)),
    `${personalOrgs.filter((name) => archive.includes(name)).length} of ${personalOrgs.length} found`
  );
  console.log(
    `       ${personalOrgs.length} employer string(s) are the registrant's own name; all suppressed`
  );

  console.log(
    failures === 0
      ? `\nok - export ${exportId} reconciles against itself on every invariant`
      : `\n${failures} invariant(s) failed for export ${exportId}`
  );
  process.exit(failures === 0 ? 0 : 1);
}

main();
