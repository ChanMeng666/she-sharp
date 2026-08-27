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
 *   npx tsx scripts/humanitix/manifest.ts --close-gap <report> --closed-by <exportId>
 *
 * It is also imported: `scripts/humanitix/fetch-api.ts` builds its own entry
 * with {@link buildApiExportEntry} and writes it with {@link appendExportEntry},
 * so `main()` runs only when this file is the entry point.
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
  listVaultFiles,
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
 * What `classify` decides, before the measured fields are added.
 *
 * `hasHeaderRow` is optional on the manifest type — a JSON file does not have
 * header rows to lack — but it is REQUIRED here, because `measure()` branches on
 * it and every CSV either has one or (the guest list) provably does not.
 */
type CsvFileFacts = Omit<
  HumanitixManifestFile,
  "file" | "exportedAt" | "bytes" | "sha256" | "rows" | "columns" | "hasHeaderRow"
> & { hasHeaderRow: boolean };

/**
 * Classifies one vault file.
 *
 * Deliberately driven by the report's shape and content rather than an
 * exact-filename table: the next export will carry different timestamps in its
 * filenames, and a table keyed on those would need hand-editing every time.
 * The PII class and role are judgements, so they are stated here in one place
 * rather than inferred.
 */
function classify(exportId: string, file: string): CsvFileFacts {
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

  // Refuse to describe an API vault as a CSV export.
  //
  // On 2026-08-28 this was run by mistake against `2026-08-28-api`, a directory
  // of 179 JSON files. It found no CSVs, classified nothing, and wrote an entry
  // with `files: []` and no `method` or `api` — silently replacing a complete
  // record of an attendee pull with an empty one. The archive test caught it,
  // but only because an unrelated assertion about the CSV spine happened to
  // exist.
  //
  // The two builders are one keystroke apart and one of them can erase the
  // other's work, so the cheap fix is to make the wrong one say no.
  if (files.length === 0 && listVaultFiles(exportId, ".json").length > 0) {
    throw new Error(
      `${exportId} holds JSON, not CSV — this is an API pull, and --append would ` +
        `overwrite its manifest entry with an empty one.
` +
        `  Rebuild it with: npx tsx scripts/humanitix/fetch-api.ts --export ${exportId} …`
    );
  }

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
    vaultPath: portableVaultPath(dir, exportId),
    fileCount: entries.length,
    files: entries,
  };
}

// ---------------------------------------------------------------------------
// API pulls
// ---------------------------------------------------------------------------

/** What `classifyApiFile` decides, before the measured fields are added. */
type ApiFileFacts = Pick<
  HumanitixManifestFile,
  "report" | "scope" | "eventName" | "filter" | "endpoint" | "piiClass" | "role" | "redundantWith" | "note"
>;

/** A Humanitix ObjectId: 24 lower-case hex characters. */
const EVENT_ID = "[0-9a-f]{24}";

/**
 * Classifies one JSON file written by `fetch-api.ts`.
 *
 * The twin of {@link classify}, kept separate for the same reason
 * {@link buildApiExportEntry} is: a CSV is identified by the report name
 * somebody clicked and a JSON response by the endpoint it came from, and those
 * are two different provenance stories rather than one with a parameter.
 *
 * The endpoint is concrete, not templated, because per file it is the ONLY
 * statement of which event the rows inside belong to. The 24-hex id is
 * Humanitix's own public identifier and is lower-case, so it neither leaks
 * anything nor trips the uppercase code-shaped guard in
 * `lib/data/humanitix.test.ts`.
 *
 * **The PII judgements here are the load-bearing part.** `orders/` and
 * `tickets/` are the most sensitive files this project has ever written, and
 * both are classed `access-secret` rather than `person-sensitive` even though
 * both descriptions fit. A single field has to name the *worst* thing in the
 * file, and the two harms are not symmetrical: a name written somewhere it
 * should not be can be deleted, whereas a leaked access code has to be rotated
 * in Humanitix and cannot be un-leaked — which is exactly what happened on
 * 2026-06-11. The note then spells out the person-sensitive content in full, so
 * nothing is hidden by the choice.
 *
 * @param relativePath - Path relative to the export directory, forward slashes.
 * @returns The file's provenance and PII judgements.
 * @throws When the file is not one this pull is known to write.
 */
export function classifyApiFile(relativePath: string): ApiFileFacts {
  switch (relativePath) {
    case "events.json":
      return {
        report: "events",
        scope: "account",
        eventName: null,
        filter: null,
        endpoint: "/v1/events",
        // Event metadata, ticket types, capacities and venues. The only
        // person-adjacent value on a raw row is the owning staff account's
        // opaque `userId` — no name, no address, nobody's ticket.
        piiClass: "none",
        role: "primary",
        redundantWith: null,
        note: "Every event on the account, verbatim, including the fields lib/humanitix/client.ts does not map. Authoritative for the 24-hex event id, the per-date ids the check-in endpoint needs, and the ticket-type catalogue. Its ids are NOT the 8-character humanitixEventId in events.json, which came from the CSV export.",
      };

    case "tags.json":
      return {
        report: "tags",
        scope: "account",
        eventName: null,
        filter: null,
        endpoint: "/v1/tags",
        piiClass: "none",
        role: "reference",
        redundantWith: null,
        note: "The account's event tags. EMPTY — GET /v1/tags returns 0, so this account groups nothing inside Humanitix. Kept so that 'we checked, and there was nothing here' is recorded rather than reasoned about again later. Feeds nothing.",
      };

    default: {
      const orders = new RegExp(`^orders/(${EVENT_ID})\\.json$`).exec(relativePath);
      if (orders) {
        return {
          report: "event-orders",
          scope: "single-event",
          // Not read out of the file: naming the event would mean parsing a
          // document full of addresses to get a label the endpoint already
          // pins down. events.json resolves the id.
          eventName: null,
          // No status filter is applied — the pull takes what the endpoint
          // returns, so complete, cancelled and incomplete orders are all here.
          filter: null,
          endpoint: `/v1/events/${orders[1]}/orders`,
          piiClass: "access-secret",
          role: "primary",
          redundantWith: null,
          note: "One event's orders, verbatim. THE MOST SENSITIVE CLASS OF FILE IN THIS PROJECT: purchaser email, first and last name, mobile, the free-text additionalFields answers, financial totals, the organiserMailListOptIn flag, and a LIVE accessCode on nearly every row. Never summarised into lib/data/json/, never quoted in an error message, never left outside private/. A leaked code must be rotated in Humanitix — see the 2026-06-11 incident.",
        };
      }

      const tickets = new RegExp(`^tickets/(${EVENT_ID})\\.json$`).exec(relativePath);
      if (tickets) {
        return {
          report: "event-tickets",
          scope: "single-event",
          eventName: null,
          filter: null,
          endpoint: `/v1/events/${tickets[1]}/tickets`,
          piiClass: "access-secret",
          role: "primary",
          redundantWith: null,
          note: "One event's tickets, verbatim. Attendee first and last name, organisation, the free-text additionalFields answers (dietary, accessibility, photo consent), checkInHistory, qrCodeData and a LIVE accessCode. Same handling as orders/: private/ only, never summarised into lib/data/json/, never quoted. qrCodeData is a working admission token in its own right.",
        };
      }

      const checkIns = new RegExp(`^check-in-counts/(${EVENT_ID})\\.json$`).exec(relativePath);
      if (checkIns) {
        return {
          report: "event-check-in-counts",
          scope: "single-event",
          eventName: null,
          filter: null,
          endpoint: `/v1/events/${checkIns[1]}/check-in-count`,
          // Counts per ticket type. No attendee, which is the whole reason
          // lib/humanitix/client.ts is allowed to implement this endpoint.
          piiClass: "aggregate",
          role: "primary",
          redundantWith: null,
          note: "Check-in totals for one event, one entry per event DATE because the endpoint requires an eventDateId — so a multi-date series has several entries in one file. A 0 here means nobody scanned far more often than it means nobody came; read the checkedIn caveat in docs/development/HUMANITIX_ARCHIVE.md before using it.",
        };
      }

      throw new Error(
        `Unclassified API vault file: ${relativePath}\n` +
          `  Add a case to classifyApiFile() rather than letting it into the manifest unlabelled.`
      );
    }
  }
}

/**
 * The moment this ran, as local wall-clock plus the zone it is wall-clock in.
 *
 * Built from LOCAL calendar fields rather than a `toISOString()` slice, which
 * on a New Zealand evening records yesterday.
 *
 * @returns `exportedAtLocal` and `timezone`, ready to spread into an entry.
 */
function localTimestamp(): { exportedAtLocal: string; timezone: string } {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return {
    exportedAtLocal:
      `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
      `T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
    // Named rather than assumed: the CSV entries say Pacific/Auckland because
    // that is where somebody sat; a pull can be run from anywhere.
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  };
}

/**
 * Counts what one JSON response holds.
 *
 * A single-resource response is one item. `0` would read as "the pull returned
 * nothing", which is a different — and false — claim.
 *
 * The parse is the only time this process holds an orders or tickets body in
 * memory after it was written, and nothing is retained beyond the length.
 *
 * @param path - Absolute path to the JSON file.
 * @returns The collection length, or 1 for a single resource.
 */
function measureApiFile(path: string): number {
  const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
  return Array.isArray(parsed) ? parsed.length : 1;
}

/**
 * Builds the `exports[]` entry for an API pull.
 *
 * Deliberately NOT a parameterisation of `buildExportEntry`. That one hardcodes
 * a `source` describing a sequence of dashboard clicks, an `exportedAt` parsed
 * out of Humanitix's own filename stamp, and `classify()`'s CSV rules. None of
 * the three means anything for a pull that ran at a known instant against known
 * endpoints, and threading a flag through all of them would leave one function
 * telling two stories.
 *
 * @param exportId - The export id, `<YYYY-MM-DD>-api`. Names the vault directory.
 * @param api - The host talked to, the size of the event list the per-event
 *   files were derived from, and the endpoint templates touched. No key, ever.
 * @returns The entry, ready for {@link appendExportEntry}.
 */
/**
 * Where the raw files live, written so a committed manifest stays portable.
 *
 * Three cases. Inside `private/`, it is the gitignored cache and the path is
 * repo-relative. Inside another git repository — which is the normal case now
 * that the private archive is the master copy — it is that repository's own
 * name plus the path within it, so the entry reads the same on every machine
 * and says WHICH archive rather than which laptop. Anywhere else, the absolute
 * path is recorded verbatim, because a manifest that quietly rewrites a path it
 * does not understand is worse than one that admits where the files were.
 *
 * An absolute Windows path in a committed file is the failure being avoided
 * here: it is true on exactly one machine and silently wrong everywhere else.
 *
 * @param dir - The resolved vault directory.
 * @param exportId - The export it belongs to.
 * @returns A path suitable for committing.
 */
export function portableVaultPath(dir: string, exportId: string): string {
  const norm = dir.split("\\").join("/");
  if (norm.includes("/private/")) return `private/humanitix/${exportId}/`;

  const parts = norm.split("/");
  for (let i = parts.length - 1; i > 0; i -= 1) {
    if (existsSync(parts.slice(0, i).concat(".git").join("/"))) {
      return parts.slice(i - 1).join("/") + "/";
    }
  }
  return norm.endsWith("/") ? norm : `${norm}/`;
}

export function buildApiExportEntry(
  exportId: string,
  api: { baseUrl: string; events: number; endpoints: string[] }
): HumanitixManifestExport {
  const dir = resolveVaultDir(exportId);
  const files = listVaultFiles(exportId, ".json");

  const entries: HumanitixManifestFile[] = files.map((file) => {
    const path = vaultFilePath(exportId, file);
    const facts = classifyApiFile(file);
    // Written out field by field rather than spread, so the rendered manifest
    // keeps the same reading order as a CSV entry: what the file is, then what
    // it holds, then how much of a person it exposes, then its measurements.
    return {
      file,
      report: facts.report,
      scope: facts.scope,
      eventName: facts.eventName,
      filter: facts.filter,
      // The date, not the whole export id: `exportedAt` is a date everywhere
      // else in the manifest, and `2026-08-27-api` is not one.
      exportedAt: exportId.slice(0, 10),
      bytes: fileBytes(path),
      sha256: sha256File(path),
      format: "json",
      endpoint: facts.endpoint,
      items: measureApiFile(path),
      // `hasHeaderRow`, `rows` and `columns` are deliberately absent rather
      // than false/0: they are CSV shape, and a JSON document does not have
      // them. `rows: 0` would read as "the pull returned nothing".
      piiClass: facts.piiClass,
      role: facts.role,
      redundantWith: facts.redundantWith,
      note: facts.note,
    };
  });

  return {
    exportId,
    source:
      "Humanitix Public API v1, pulled by scripts/humanitix/fetch-api.ts. Account-scoped by the API key; there is no audience id to verify, so `api.events` records the size of the event list the per-event files were derived from.",
    // A pull knows the instant it ran, unlike a CSV session whose filenames
    // carry only Humanitix's export stamp per file.
    ...localTimestamp(),
    vaultPath: portableVaultPath(dir, exportId),
    fileCount: entries.length,
    method: "api-v1",
    api,
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

const METADATA_NOTE =
  "Provenance for the raw Humanitix exports. The raw CSVs are never committed (see /private/ in .gitignore); this file exists so their provenance stays auditable when the data itself is not present, which is the normal case and always the case on CI.";

function loadManifest(): HumanitixManifest | null {
  if (!existsSync(MANIFEST_PATH)) return null;
  return JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as HumanitixManifest;
}

/**
 * Adds one export entry to the manifest and writes it back.
 *
 * Append-only in the sense that matters: other entries are carried through
 * untouched and `knownGaps` is preserved as it stands on disk. Re-running the
 * same `exportId` replaces only that entry, which is what makes a pull safe to
 * repeat after a failure part-way through.
 *
 * @param entry - The entry to add, from `buildExportEntry` or
 *   {@link buildApiExportEntry}.
 */
export function appendExportEntry(entry: HumanitixManifestExport): void {
  const existing = loadManifest();
  const others = (existing?.exports ?? []).filter(
    (item) => item.exportId !== entry.exportId
  );

  const manifest: HumanitixManifest = {
    metadata: {
      note: METADATA_NOTE,
      vaultEnvVar: "HUMANITIX_VAULT_DIR",
      piiClasses: PII_CLASSES,
    },
    exports: [...others, entry].sort((a, b) =>
      a.exportId.localeCompare(b.exportId)
    ),
    knownGaps: existing?.knownGaps ?? KNOWN_GAPS,
  };

  writeFileSync(MANIFEST_PATH, render(manifest), "utf8");
}

/**
 * Annotates one known gap as closed, changing nothing else about it.
 *
 * The only sanctioned way to edit a gap. `KNOWN_GAPS` above is unreachable once
 * a manifest exists (`existing?.knownGaps ?? KNOWN_GAPS`), so without this the
 * only way to record that a gap had been filled was to hand-edit a file the
 * docs call GENERATED — and a hand edit is exactly how `impact` and `action`
 * get tidied away, leaving the archive looking as though nothing was ever
 * missing.
 *
 * Note what it does NOT do: `present` stays as it was. A report recorded as
 * exported-but-absent is still absent; something else supplied what it held.
 *
 * @param report - The `knownGaps[].report` to annotate.
 * @param closedBy - The `exportId` that supplied what was missing.
 */
export function closeGap(report: string, closedBy: string): void {
  const manifest = loadManifest();
  if (!manifest) {
    throw new Error(`No manifest at ${MANIFEST_PATH}. Run with --append first.`);
  }

  const gap = manifest.knownGaps.find((item) => item.report === report);
  if (!gap) {
    throw new Error(
      `No known gap named ${report}.\n  Gaps: ${manifest.knownGaps.map((item) => item.report).join(", ")}`
    );
  }
  if (!manifest.exports.some((item) => item.exportId === closedBy)) {
    throw new Error(
      `No export ${closedBy} in the manifest — a gap may only be closed by an export that is recorded.`
    );
  }

  gap.closedBy = closedBy;
  gap.closedAt = localTimestamp().exportedAtLocal.slice(0, 10);

  writeFileSync(MANIFEST_PATH, render(manifest), "utf8");
  console.log(`Closed gap ${report} — closedBy ${closedBy}, closedAt ${gap.closedAt}`);
  console.log(`  present stays ${JSON.stringify(gap.present)}; impact and action are unchanged.`);
}

/** One line per file, in whichever shape the file actually has. */
function printEntry(entry: HumanitixManifestExport): void {
  console.log(
    `Wrote ${MANIFEST_PATH}\n  export ${entry.exportId}: ${entry.fileCount} files`
  );
  for (const file of entry.files) {
    const size =
      (file.format ?? "csv") === "csv"
        ? `${String(file.rows).padStart(5)} rows `
        : `${String(file.items).padStart(5)} items`;
    console.log(
      `    ${file.role.padEnd(9)} ${size}  ${file.piiClass.padEnd(19)} ${file.file}`
    );
  }
}

function main() {
  const argv = process.argv.slice(2);
  const exportId = argValue(argv, "--export");
  const append = argv.includes("--append");
  const gapToClose = argValue(argv, "--close-gap");

  if (gapToClose) {
    const closedBy = argValue(argv, "--closed-by");
    if (!closedBy) {
      console.error(
        "Usage: npx tsx scripts/humanitix/manifest.ts --close-gap <report> --closed-by <exportId>"
      );
      process.exit(1);
    }
    try {
      closeGap(gapToClose, closedBy);
    } catch (error) {
      // Every failure here is a typo in one of the two arguments, and the
      // message already names the valid values. A stack trace pushes it off
      // the screen.
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
    return;
  }

  if (!exportId) {
    console.error(
      "Usage: npx tsx scripts/humanitix/manifest.ts --export <YYYY-MM-DD> [--append]\n" +
        "       npx tsx scripts/humanitix/manifest.ts --close-gap <report> --closed-by <exportId>"
    );
    process.exit(1);
  }

  if (append) {
    const entry = buildExportEntry(exportId);
    appendExportEntry(entry);
    printEntry(entry);
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

// Guarded so `fetch-api.ts` can import `buildApiExportEntry` and
// `appendExportEntry` without this file's CLI running as a side effect.
//
// Errors are reported as a sentence, not a stack. Everything this script can
// fail on is a thing the operator did — pointing it at the wrong directory,
// pointing it at an API pull — and a stack trace buries the sentence that says
// which.
if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
