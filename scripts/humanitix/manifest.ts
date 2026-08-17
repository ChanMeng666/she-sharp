/**
 * Builds and verifies `lib/data/json/humanitix/manifest.json`.
 *
 * The manifest is the reason the archive can be trusted on a machine that does
 * not hold the raw data — which is every machine except the one that ran the
 * export, and every CI run. It records, per raw file, what report it is, when
 * Humanitix produced it, its sha256, its shape, how much of a person it
 * exposes, and what it is authoritative for. It also records what is MISSING:
 * the hand-written export note ticks "Event summary" as exported and the file
 * is not in the folder, and that discrepancy would become invisible the moment
 * the download folder was tidied up.
 *
 * It is append-only across exports. A re-export adds an `exports[]` entry; old
 * entries are never rewritten, so an earlier export's hashes stay auditable
 * long after its vault directory is gone.
 *
 * Usage:
 *   npx tsx scripts/humanitix/manifest.ts --export 2026-08-17 --append
 *   npx tsx scripts/humanitix/manifest.ts --export 2026-08-17            # verify
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type {
  HumanitixManifest,
  HumanitixManifestExport,
  HumanitixManifestFile,
  HumanitixPiiClass,
} from "../../types/humanitix";
import { readCsvHeader, readHeaderlessCsv, readCsv } from "./csv";
import {
  ARCHIVE_DIR,
  argValue,
  fileBytes,
  listVaultCsvs,
  parseExportStamp,
  resolveVaultDir,
  sha256File,
  vaultFilePath,
} from "./vault";

const MANIFEST_PATH = join(ARCHIVE_DIR, "manifest.json");

const PII_CLASSES: Record<HumanitixPiiClass, string> = {
  none: "No personal data of any kind.",
  aggregate: "Counts and totals only; no row describes one person.",
  "email-only": "Email addresses, with no other identifying attribute.",
  "person-identifying": "Name, email or mobile — enough to identify someone.",
  "person-sensitive":
    "Identity plus attributes a person would not expect published: address, date of birth, dietary and accessibility needs, photo consent, job title.",
  "financial-secret": "Bank or payout details, even when partly masked.",
  "access-secret":
    "Live access or discount codes. A leaked code grants free entry and cannot be un-leaked — it must be rotated. See the 2026-06-11 incident.",
};

/**
 * Classifies one vault file.
 *
 * Deliberately driven by the report's shape and content rather than an
 * exact-filename table: the next export will carry different timestamps in its
 * filenames, and a table keyed on those would need hand-editing every time.
 * The PII class and role are judgements, so they are stated here in one place
 * rather than inferred.
 */
function classify(
  exportId: string,
  file: string
): Omit<HumanitixManifestFile, "file" | "exportedAt" | "bytes" | "sha256" | "rows" | "columns"> {
  const lower = file.toLowerCase();

  if (lower.startsWith("attendee-report")) {
    // The two attendee exports are distinguished by their own Status column,
    // not by their filename — the filenames differ only by export timestamp.
    const rows = readCsv(exportId, file);
    const cancelled = rows.length > 0 && rows[0]["Status"] === "cancelled";
    return cancelled
      ? {
          report: "attendee-details",
          scope: "all-events",
          eventName: null,
          filter: "cancelled",
          hasHeaderRow: true,
          piiClass: "person-sensitive",
          role: "primary",
          redundantWith: null,
          note: "Cancelled tickets. Authoritative for the per-instance `cancelled` count and for invariant 2.",
        }
      : {
          report: "attendee-details",
          scope: "all-events",
          eventName: null,
          filter: "complete",
          hasHeaderRow: true,
          piiClass: "person-sensitive",
          role: "spine",
          redundantWith: null,
          note: "THE SPINE. One row per valid ticket. Authoritative for registered, checked-in, ticket type, sales channel, code-use counts, organisations and every audience aggregate.",
        };
  }

  if (lower.startsWith("order-report")) {
    const single = !/^order-report-\(exported/.test(lower);
    if (single) {
      const rows = readCsv(exportId, file);
      return {
        report: "orders",
        scope: "single-event",
        eventName: rows[0]?.["Event"]?.trim() ?? null,
        filter: "complete",
        hasHeaderRow: true,
        piiClass: "person-identifying",
        role: "redundant",
        redundantWith: "order-report (all events, complete)",
        note: "A single-event test export taken before the account-level one. A strict subset of the complete orders file; feeds nothing, and invariant 5 proves it.",
      };
    }

    const rows = readCsv(exportId, file);
    const statuses = new Set(rows.map((row) => row["Status"]));
    if (statuses.has("Incomplete")) {
      return {
        report: "orders",
        scope: "all-events",
        eventName: null,
        filter: "incomplete",
        hasHeaderRow: true,
        piiClass: "person-identifying",
        role: "primary",
        redundantWith: null,
        note: "Abandoned checkouts. Authoritative for the incomplete order count; deliberately excluded from every attendance figure.",
      };
    }
    const everyRowDonates = rows.every(
      (row) => (row["Donations"] ?? "").replace(/[$,\s]/g, "") !== "0.00"
    );
    if (everyRowDonates && rows.length < 500) {
      return {
        report: "orders",
        scope: "all-events",
        eventName: null,
        filter: "donation",
        hasHeaderRow: true,
        piiClass: "person-identifying",
        role: "primary",
        redundantWith: null,
        note: "Complete orders that included a donation. A subset of the complete orders file, kept because it is the cleanest source for the donation total.",
      };
    }
    return {
      report: "orders",
      scope: "all-events",
      eventName: null,
      filter: "complete",
      hasHeaderRow: true,
      piiClass: "person-identifying",
      role: "primary",
      redundantWith: null,
      note: "All completed orders. Authoritative for order counts, net earnings, refunds and the marketing opt-in flag, and it carries invariants 1, 2 and 3.",
    };
  }

  if (lower.startsWith("guest-list-report")) {
    return {
      report: "guest-list",
      scope: "all-events",
      eventName: null,
      filter: null,
      // Humanitix exports this one without a header row, so it can only be
      // read positionally. Recorded here so no reader guesses wrong.
      hasHeaderRow: false,
      piiClass: "person-identifying",
      role: "redundant",
      redundantWith: "attendee-report (all events, complete)",
      note: "A 19-column projection of the spine, one row per ticket, with no header row. Feeds nothing; invariant 4 proves it adds nothing.",
    };
  }

  if (lower.startsWith("events-report") || lower.startsWith("event-summary")) {
    return {
      report: "event-summary",
      scope: "all-events",
      eventName: null,
      filter: null,
      hasHeaderRow: true,
      piiClass: "none",
      role: "primary",
      redundantWith: null,
      note: "One row per event, and the only report carrying the Humanitix Event ID, organiser and venue for all of them. Exported separately on 2026-08-17 after the first pass missed it. Independently confirms sold and checked-in per event, which is what turned the archive's check-in definition from a choice into a checked one.",
    };
  }

  if (lower.startsWith("earnings-by-ticket-type")) {
    return {
      report: "earnings-by-ticket-type",
      scope: "all-events",
      eventName: null,
      filter: null,
      hasHeaderRow: true,
      piiClass: "aggregate",
      role: "primary",
      redundantWith: null,
      note: "The only source of capacity and per-ticket-type earnings. Covers 60 of the 62 instances, which is why capacity is nullable.",
    };
  }

  if (lower.startsWith("payout-report")) {
    return {
      report: "payouts",
      scope: "all-events",
      eventName: null,
      filter: null,
      hasHeaderRow: true,
      // The `Paid to account` column is a partly-masked bank account. It is
      // never read into the archive.
      piiClass: "financial-secret",
      role: "primary",
      redundantWith: null,
      note: "Settlement records, and the ONLY file carrying the Humanitix Event ID. It yields a usable id for 38 of 62 instances: one value in that column, attached to ten unrelated 2021-22 events, is an account-level identifier rather than an event one and is discarded. The `Paid to account` column is never read.",
    };
  }

  if (lower.startsWith("access-codes-report")) {
    return {
      report: "access-codes",
      scope: "all-events",
      eventName: null,
      filter: null,
      hasHeaderRow: true,
      piiClass: "access-secret",
      role: "reference",
      redundantWith: null,
      note: "Live access codes. COUNTS ONLY are derived; no code value enters the repository, including docs and commit messages. Its event attribution looks offset and is not relied on.",
    };
  }

  if (lower.startsWith("discount-report")) {
    return {
      report: "discounts",
      scope: "all-events",
      eventName: null,
      filter: null,
      hasHeaderRow: true,
      piiClass: "access-secret",
      role: "reference",
      redundantWith: null,
      note: "Discount codes. COUNTS ONLY are derived, on the same rule as the access codes.",
    };
  }

  if (lower.startsWith("top-purchasers-report")) {
    return {
      report: "top-purchasers",
      scope: "all-events",
      eventName: null,
      filter: null,
      hasHeaderRow: true,
      piiClass: "email-only",
      role: "redundant",
      redundantWith: "attendee-report (all events, complete)",
      note: "A ranked email list. Feeds nothing — the spine already carries per-person data, and this file is a mailing list in all but name.",
    };
  }

  if (lower.startsWith("additional-donation-report")) {
    return {
      report: "additional-donations",
      scope: "all-events",
      eventName: null,
      filter: null,
      hasHeaderRow: true,
      piiClass: "person-identifying",
      role: "primary",
      redundantWith: null,
      note: "Per-donor additional donations. Its total independently confirms the donation component of invariant 3.",
    };
  }

  if (lower.startsWith("affiliatecodesorders")) {
    const rows = readCsv(exportId, file);
    return {
      report: "affiliate-codes-orders",
      scope: "single-event",
      eventName: null,
      filter: null,
      hasHeaderRow: true,
      piiClass: "person-identifying",
      role: "redundant",
      redundantWith: "order-report (all events, complete)",
      note: `Affiliate attribution for one event (${rows.length} orders). Feeds nothing; the underlying orders are all in the account-level export.`,
    };
  }

  throw new Error(
    `Unclassified vault file: ${file}\n` +
      `  Add a rule to classify() rather than letting it into the manifest unlabelled.`
  );
}

/** Data rows and column count, honouring the guest list's missing header. */
function measure(exportId: string, file: string, hasHeaderRow: boolean) {
  if (!hasHeaderRow) {
    const rows = readHeaderlessCsv(exportId, file);
    return { rows: rows.length, columns: rows[0]?.length ?? 0 };
  }
  const header = readCsvHeader(exportId, file);
  return { rows: readCsv(exportId, file).length, columns: header.length };
}

function buildExportEntry(exportId: string): HumanitixManifestExport {
  const dir = resolveVaultDir(exportId);
  const files = listVaultCsvs(exportId);

  const entries: HumanitixManifestFile[] = files.map((file) => {
    const classified = classify(exportId, file);
    const path = vaultFilePath(exportId, file);
    const { rows, columns } = measure(exportId, file, classified.hasHeaderRow);
    return {
      file,
      ...classified,
      exportedAt: parseExportStamp(file) ?? `${exportId}T00:00:00`,
      bytes: fileBytes(path),
      sha256: sha256File(path),
      rows,
      columns,
    };
  });

  const stamps = entries.map((entry) => entry.exportedAt).sort();

  return {
    exportId,
    source: "Humanitix → Reports (account level), Filter by events = All events",
    exportedAtLocal: stamps[0] ?? `${exportId}T00:00:00`,
    timezone: "Pacific/Auckland",
    vaultPath: dir.includes("private")
      ? `private/humanitix/${exportId}/`
      : dir,
    fileCount: entries.length,
    files: entries,
  };
}

const KNOWN_GAPS: HumanitixManifest["knownGaps"] = [
  {
    report: "event-summary",
    scope: "all-events",
    claimedExported: true,
    present: true,
    reason:
      "CLOSED 2026-08-18. It was absent from the first export even though the operator's note ticked it as taken — recorded here rather than deleted, because the discrepancy between what an export session believes it captured and what it captured is the thing worth remembering.",
    impact:
      "While it was missing, the Humanitix Event ID was recoverable only from the payout report — a usable id for 38 of 62 instances — and no instance had a first-party venue or organiser. The report supplies all three, for all 63 events it lists.",
    action: "None. Re-exported and imported.",
  },
  {
    report: "event-sales-update",
    claimedExported: false,
    present: false,
    reason: "A rolling 24-hour sales snapshot. Deliberately skipped.",
    impact: "None — it has no archival value.",
    action: "None.",
  },
  {
    report: "paid-by-invoice",
    claimedExported: false,
    present: false,
    reason: "Empty in Humanitix — there is nothing to export.",
    impact: "None.",
    action: "None.",
  },
  {
    report: "gift-cards",
    claimedExported: false,
    present: false,
    reason: "Empty in Humanitix — there is nothing to export.",
    impact: "None.",
    action: "None.",
  },
  {
    report: "add-ons",
    claimedExported: false,
    present: false,
    reason: "Empty in Humanitix — there is nothing to export.",
    impact: "None.",
    action: "None.",
  },
  {
    report: "affiliate-codes-orders",
    scope: "single-event",
    claimedExported: true,
    present: "partial",
    reason:
      "Exported for 3 of the events that used affiliate codes; the rest were skipped deliberately.",
    impact:
      "None for any figure in this archive — the underlying orders are all in the account-level orders export.",
    action: "None unless per-affiliate attribution is ever needed.",
  },
];

/** CRLF, for the reason given on `render` in build-archive.ts. */
function render(manifest: HumanitixManifest): string {
  return (JSON.stringify(manifest, null, 2) + "\n").replace(/\n/g, "\r\n");
}

function loadManifest(): HumanitixManifest | null {
  if (!existsSync(MANIFEST_PATH)) return null;
  return JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as HumanitixManifest;
}

function main() {
  const argv = process.argv.slice(2);
  const exportId = argValue(argv, "--export");
  const append = argv.includes("--append");

  if (!exportId) {
    console.error(
      "Usage: npx tsx scripts/humanitix/manifest.ts --export <YYYY-MM-DD> [--append]"
    );
    process.exit(1);
  }

  if (append) {
    const existing = loadManifest();
    const entry = buildExportEntry(exportId);
    const others = (existing?.exports ?? []).filter(
      (item) => item.exportId !== exportId
    );

    const manifest: HumanitixManifest = {
      metadata: {
        note:
          "Provenance for the raw Humanitix exports. The raw CSVs are never committed (see /private/ in .gitignore); this file exists so their provenance stays auditable when the data itself is not present, which is the normal case and always the case on CI.",
        vaultEnvVar: "HUMANITIX_VAULT_DIR",
        piiClasses: PII_CLASSES,
      },
      exports: [...others, entry].sort((a, b) =>
        a.exportId.localeCompare(b.exportId)
      ),
      knownGaps: existing?.knownGaps ?? KNOWN_GAPS,
    };

    writeFileSync(MANIFEST_PATH, render(manifest), "utf8");
    console.log(
      `Wrote ${MANIFEST_PATH}\n  export ${exportId}: ${entry.fileCount} files`
    );
    for (const file of entry.files) {
      console.log(
        `    ${file.role.padEnd(9)} ${String(file.rows).padStart(5)} rows  ${file.piiClass.padEnd(19)} ${file.file}`
      );
    }
    return;
  }

  // Verify mode: every recorded file must still hash to what it hashed to.
  const manifest = loadManifest();
  if (!manifest) {
    console.error(`No manifest at ${MANIFEST_PATH}. Run with --append first.`);
    process.exit(1);
  }
  const entry = manifest.exports.find((item) => item.exportId === exportId);
  if (!entry) {
    console.error(`Manifest has no export ${exportId}.`);
    process.exit(1);
  }

  let failures = 0;
  for (const file of entry.files) {
    const path = vaultFilePath(exportId, file.file);
    if (!existsSync(path)) {
      failures++;
      console.error(`  FAIL - missing from the vault: ${file.file}`);
      continue;
    }
    const hash = sha256File(path);
    if (hash !== file.sha256) {
      failures++;
      console.error(
        `  FAIL - sha256 changed: ${file.file}\n    manifest ${file.sha256}\n    on disk  ${hash}`
      );
      continue;
    }
    console.log(`  ok - ${file.file}`);
  }

  console.log(
    failures === 0
      ? `\nok - all ${entry.files.length} files match the manifest`
      : `\n${failures} file(s) do not match the manifest`
  );
  process.exit(failures === 0 ? 0 : 1);
}

main();
