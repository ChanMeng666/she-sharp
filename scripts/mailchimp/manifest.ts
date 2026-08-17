/**
 * Builds and verifies `lib/data/json/mailchimp/manifest.json`.
 *
 * The manifest is the reason the archive can be trusted on a machine that does
 * not hold the raw data — which is every machine except the one that ran the
 * export, and every CI run. It records, per raw file, which subscription status
 * it holds, its sha256, its shape, how much of a person it exposes, and what it
 * is authoritative for. It also records what is MISSING: on 2026-08-17 the
 * account-level ZIP was triggered and had not arrived, and that fact would
 * become invisible the moment the download folder was tidied up.
 *
 * It is append-only across exports. A re-export adds an `exports[]` entry; old
 * entries are never rewritten, so an earlier export's hashes stay auditable
 * long after its vault directory is gone. That matters more here than for
 * Humanitix: a Mailchimp export is a **snapshot**, so an old entry is the only
 * evidence of a contact who has since been deleted from the account.
 *
 * Usage:
 *   npx tsx scripts/mailchimp/manifest.ts --export 2026-08-17 --append
 *   npx tsx scripts/mailchimp/manifest.ts --export 2026-08-17            # verify
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type {
  MailchimpManifest,
  MailchimpManifestExport,
  MailchimpManifestFile,
  MailchimpPiiClass,
} from "../../types/mailchimp";
import { readCsv, readCsvHeader } from "./csv";
import {
  ARCHIVE_DIR,
  argValue,
  fileBytes,
  listVaultCsvs,
  resolveVaultDir,
  sha256File,
  vaultFilePath,
} from "./vault";

const MANIFEST_PATH = join(ARCHIVE_DIR, "manifest.json");

const PII_CLASSES: Record<MailchimpPiiClass, string> = {
  none: "No personal data of any kind.",
  aggregate: "Counts and totals only; no row describes one person.",
  "email-only": "Email addresses, with no other identifying attribute.",
  "person-identifying": "Name, email or phone — enough to identify someone.",
  "person-sensitive":
    "Identity plus attributes a person would not expect published: street address, date of birth, employer, and the tags saying which events they came through.",
  "person-network":
    "Network and location metadata: the IP address a person signed up from, their timezone, country and region. An IP plus a timestamp is a location record for the moment someone joined a women-in-tech mailing list, which is not what any of them thought they were giving.",
};

/**
 * Classifies one vault file.
 *
 * Driven by the filename prefix, because Mailchimp names an audience export by
 * status and that prefix is stable across exports — only the trailing hash,
 * which identifies the export job, changes. The PII class and role are
 * judgements, so they are stated here in one place rather than inferred.
 */
function classify(
  file: string
): Omit<MailchimpManifestFile, "file" | "exportedAt" | "bytes" | "sha256" | "rows" | "columns"> {
  const lower = file.toLowerCase();

  if (lower.startsWith("subscribed_")) {
    return {
      report: "audience",
      scope: "audience:She#",
      status: "subscribed",
      hasHeaderRow: true,
      piiClass: "person-network",
      role: "spine",
      redundantWith: null,
      note: "THE LIST. Contacts subscribed at export time — the only file that may ever be imported into Resend, and then only through /update-mailing-list. Authoritative for list size, the tag vocabulary's live half, and every consent signal.",
    };
  }

  if (lower.startsWith("unsubscribed_")) {
    return {
      report: "audience",
      scope: "audience:She#",
      status: "unsubscribed",
      hasHeaderRow: true,
      piiClass: "person-network",
      role: "primary",
      redundantWith: null,
      note: "People who left, with the campaign that prompted it and, for about half, a reason. Feeds the suppression register. A later export showing one of them subscribed again is a new decision by that person; a later file is never a newer permission on its own.",
    };
  }

  if (lower.startsWith("nonsubscribed_")) {
    return {
      report: "audience",
      scope: "audience:She#",
      status: "nonsubscribed",
      hasHeaderRow: true,
      piiClass: "person-network",
      role: "primary",
      redundantWith: null,
      note: "Contacts who NEVER subscribed — transactional-only records Mailchimp holds but may not market to. Not a lapse in consent; an absence of it. Feeds the suppression register.",
    };
  }

  if (lower.startsWith("cleaned_")) {
    return {
      report: "audience",
      scope: "audience:She#",
      status: "cleaned",
      hasHeaderRow: true,
      piiClass: "person-network",
      role: "primary",
      redundantWith: null,
      note: "Hard-bounced addresses, with the campaign that bounced them. `cleaned` is Mailchimp's word for dead. EXCLUDED from the contact count Mailchimp's own UI reports, which is why the dashboard says 3,145 and the files total 3,689.",
    };
  }

  if (lower.startsWith("archived_export")) {
    return {
      report: "archived",
      scope: "audience:She#",
      status: "archived",
      hasHeaderRow: true,
      piiClass: "none",
      role: "reference",
      redundantWith: null,
      note: "Archived contacts. All five are August 2020 test rows (`@getnada.com`, `Test Name`) — kept so that 'we checked, and there was nothing here' is recorded rather than reasoned about again later. Feeds nothing.",
    };
  }

  throw new Error(
    `Unclassified vault file: ${file}\n` +
      `  Add a rule to classify() rather than letting it into the manifest unlabelled.`
  );
}

/** Data rows and column count. Every Mailchimp export carries a header row. */
function measure(exportId: string, file: string) {
  return {
    rows: readCsv(exportId, file).length,
    columns: readCsvHeader(exportId, file).length,
  };
}

function buildExportEntry(exportId: string): MailchimpManifestExport {
  const dir = resolveVaultDir(exportId);
  const files = listVaultCsvs(exportId);

  const entries: MailchimpManifestFile[] = files.map((file) => {
    const classified = classify(file);
    const path = vaultFilePath(exportId, file);
    const { rows, columns } = measure(exportId, file);
    return {
      file,
      ...classified,
      // Mailchimp does not stamp the export moment into the filename the way
      // Humanitix does — the hex suffix identifies the export job, not its
      // time. The session date is all the filenames can honestly support.
      exportedAt: exportId,
      bytes: fileBytes(path),
      sha256: sha256File(path),
      rows,
      columns,
    };
  });

  return {
    exportId,
    source:
      "Mailchimp → Audience → All contacts → Export Contacts (one file per status), plus Audience → Archived contacts → Export",
    exportedAtLocal: `${exportId}T21:00:00`,
    timezone: "Pacific/Auckland",
    vaultPath: dir.includes("private") ? `private/mailchimp/${exportId}/` : dir,
    fileCount: entries.length,
    files: entries,
  };
}

const KNOWN_GAPS: MailchimpManifest["knownGaps"] = [
  {
    report: "account-export-zip",
    scope: "account",
    claimedExported: true,
    present: false,
    reason:
      "Triggered on 2026-08-17 via Settings → Manage my data → Export data, with all 8 categories ticked (Emails, Audiences, Reports, Templates, Gallery, Events, Appointments, Ecommerce) and range = All data. Mailchimp emails a download link to the organisation's newsletter mailbox (named in docs/development/EMAIL_ADDRESSES.md — no address is written into this file, because the leak guard that keeps 3,689 real addresses out of it does not get an exception) and may take up to 24 hours. It had not arrived when this manifest was first written.",
    impact:
      "Campaign-level statistics for the 209 campaigns — sends, opens, clicks, bounces per campaign — exist only inside it. Without it this archive can say who was on the list but nothing about how the list behaved.",
    action:
      "Collect the link from the newsletter mailbox and add it as mailchimp/<date>-account/ in the private repo, then a second exports[] entry here. NOTE: Mailchimp allows one account export per 24 hours, so a link left to expire costs another day.",
    blocks: [
      "campaign send/open/click/bounce statistics",
      "the historical audience-size series",
      "template and landing-page content",
    ],
  },
  {
    report: "per-campaign-recipient-activity",
    scope: "per-campaign",
    claimedExported: false,
    present: false,
    reason:
      "Mailchimp exports per-recipient open and click detail one campaign at a time — 209 manual operations. Skipped by decision on 2026-08-17.",
    impact:
      "No per-person engagement history. This is what would be needed to build the 'most engaged recent openers' sub-segment the Resend migration runbook recommends sending to first.",
    action:
      "Only if the ramped first send is judged to need it. The campaign-level summaries in the account ZIP are the cheaper substitute.",
    blocks: ["a recent-openers segment for the first Resend broadcast"],
  },
  {
    report: "saved-segments",
    scope: "audience:She#",
    claimedExported: false,
    present: false,
    reason:
      "There are none to export. The account has 214 tags and zero saved segments.",
    impact:
      "None. All of the audience's structure is in the TAGS column, which is exported in full.",
    action: "None.",
  },
  {
    report: "automations-forms-landing-pages",
    scope: "account",
    claimedExported: false,
    present: false,
    reason:
      "Mailchimp's export does not include automation workflows, signup-form designs, or landing-page and website content. No export option produces them.",
    impact:
      "If the account is closed, the design of the signup form that collected most of this consent is lost, and with it the wording people agreed to.",
    action:
      "Screenshot or save them by hand BEFORE the Mailchimp account is closed. An export taken afterwards will not bring them back.",
    blocks: ["the exact opt-in wording shown on the website signup form"],
  },
];

/**
 * Serialises a generated file.
 *
 * CRLF, matching `lib/data/json/humanitix/` and the rest of `lib/data/json/`.
 * This repository is worked on with `core.autocrlf=true`, so git checks these
 * files out with CRLF on Windows; rendering LF here would make every rebuild
 * look like a whole-file rewrite.
 */
function render(manifest: MailchimpManifest): string {
  return (JSON.stringify(manifest, null, 2) + "\n").replace(/\n/g, "\r\n");
}

function loadManifest(): MailchimpManifest | null {
  if (!existsSync(MANIFEST_PATH)) return null;
  return JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as MailchimpManifest;
}

function main() {
  const argv = process.argv.slice(2);
  const exportId = argValue(argv, "--export");
  const append = argv.includes("--append");

  if (!exportId) {
    console.error(
      "Usage: npx tsx scripts/mailchimp/manifest.ts --export <YYYY-MM-DD> [--append]"
    );
    process.exit(1);
  }

  if (append) {
    const existing = loadManifest();
    const entry = buildExportEntry(exportId);
    const others = (existing?.exports ?? []).filter(
      (item) => item.exportId !== exportId
    );

    const manifest: MailchimpManifest = {
      metadata: {
        note: "Provenance for the raw Mailchimp audience exports. The raw CSVs are never committed (see /private/ in .gitignore); this file exists so their provenance stays auditable when the data itself is not present, which is the normal case and always the case on CI. Unlike a ticketing report, a Mailchimp export is a SNAPSHOT of subscription status — so an old exports[] entry is not superseded by a newer one, it is the only remaining evidence of anyone deleted from the account since.",
        vaultEnvVar: "MAILCHIMP_VAULT_DIR",
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
        `    ${file.role.padEnd(9)} ${String(file.rows).padStart(5)} rows  ${file.status.padEnd(14)} ${file.file}`
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
