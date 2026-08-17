/**
 * Reconciles a Mailchimp export against itself, the manifest, and the site.
 *
 * Runs BEFORE `build-archive.ts` and needs the vault, so it never runs on CI.
 * Its job is to catch the failures that would otherwise be discovered as a
 * wrong number in a funder report a year later: a truncated download, a status
 * file that overlaps another, a tag nobody has classified, an event slug that
 * has since been renamed.
 *
 * Each check prints `ok - …` or `FAIL - …` and the process exits non-zero if
 * any failed, matching the convention of the repo's other assertion scripts.
 *
 * `--allow-missing-vault` exists for the one case where it is honest: checking
 * only the vault-independent invariants (the crosswalk and the tag rules
 * against the committed archive). It must be ASKED for. A verify script that
 * passes with nothing to verify is worse than no verify script.
 *
 * Usage:
 *   npx tsx scripts/mailchimp/verify-export.ts --export 2026-08-17
 *   npx tsx scripts/mailchimp/verify-export.ts --export 2026-08-17 --allow-missing-vault
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { getEventBySlug } from "../../lib/data/events";
import type {
  MailchimpCrosswalk,
  MailchimpManifest,
  MailchimpStatus,
  MailchimpTagRules,
  MailchimpTags,
} from "../../types/mailchimp";
import { normalizeEmail, parseTagCell, readCsv } from "./csv";
import { ARCHIVE_DIR, argValue, sha256File, vaultExists, vaultFilePath } from "./vault";

const STATUS_ORDER: MailchimpStatus[] = [
  "subscribed",
  "unsubscribed",
  "nonsubscribed",
  "cleaned",
];

let failures = 0;

function check(label: string, passed: boolean, detail = ""): void {
  if (passed) {
    console.log(`  ok - ${label}`);
    return;
  }
  failures++;
  console.error(`  FAIL - ${label}${detail ? `\n         ${detail}` : ""}`);
}

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(ARCHIVE_DIR, name), "utf8")) as T;
}

function main() {
  const argv = process.argv.slice(2);
  const exportId = argValue(argv, "--export");
  const allowMissingVault = argv.includes("--allow-missing-vault");

  if (!exportId) {
    console.error(
      "Usage: npx tsx scripts/mailchimp/verify-export.ts --export <YYYY-MM-DD> [--allow-missing-vault]"
    );
    process.exit(1);
  }

  const manifest = loadJson<MailchimpManifest>("manifest.json");
  const rules = loadJson<MailchimpTagRules>("tag-rules.json");
  const crosswalk = loadJson<MailchimpCrosswalk>("crosswalk.json");
  const tags = loadJson<MailchimpTags>("tags.json");

  const entry = manifest.exports.find((item) => item.exportId === exportId);
  if (!entry) {
    console.error(`Manifest has no export ${exportId}.`);
    process.exit(1);
  }

  const haveVault = vaultExists(exportId);
  if (!haveVault && !allowMissingVault) {
    console.error(
      `The vault for ${exportId} is not present, and --allow-missing-vault was not given.\n` +
        `  Set MAILCHIMP_VAULT_DIR, or populate private/mailchimp/${exportId}/.\n` +
        `  Passing with nothing to verify would be worse than failing.`
    );
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  // Vault-independent: the committed archive against itself and the site
  // -------------------------------------------------------------------------
  console.log("\nCommitted archive");

  const eventTags = tags.tags.filter((tag) => tag.kind === "event").map((tag) => tag.tag);
  const linked = new Set(crosswalk.links.map((link) => link.tag));
  const excused = new Set(crosswalk.unmatched.map((row) => row.tag));
  const missing = eventTags.filter((tag) => !linked.has(tag) && !excused.has(tag));
  check(
    `every Event: tag is in the crosswalk (${eventTags.length} tags)`,
    missing.length === 0,
    missing.map((tag) => JSON.stringify(tag)).join("\n         ")
  );

  const staleSlugs = crosswalk.links.filter((link) => !getEventBySlug(link.siteSlug));
  check(
    `every crosswalk slug resolves to a site event (${crosswalk.links.length} links)`,
    staleSlugs.length === 0,
    staleSlugs.map((link) => `${link.siteSlug} — from ${JSON.stringify(link.tag)}`).join("\n         ")
  );

  const stray = crosswalk.links.filter((link) => !eventTags.includes(link.tag));
  check(
    "the crosswalk has no rows for tags the export no longer contains",
    stray.length === 0,
    stray.map((link) => JSON.stringify(link.tag)).join("\n         ")
  );

  // A tag classified `label` that no rule names would mean the builder's
  // fallback had kicked in — it throws instead, so this is belt and braces.
  const ruleTargets = new Set(rules.rules.map((rule) => rule.pattern));
  const unruled = tags.tags.filter(
    (tag) => tag.kind === "label" && !ruleTargets.has(tag.tag)
  );
  check(
    "every `label` tag is named by an exact rule",
    unruled.length === 0,
    unruled.map((tag) => JSON.stringify(tag.tag)).join("\n         ")
  );

  const deadRules = rules.rules.filter(
    (rule) => rule.match === "exact" && !tags.tags.some((tag) => tag.tag === rule.pattern)
  );
  check(
    "no exact rule matches nothing in the export",
    deadRules.length === 0,
    deadRules.map((rule) => JSON.stringify(rule.pattern)).join("\n         ")
  );

  if (!haveVault) {
    console.log("\n(skipped every vault check — --allow-missing-vault)");
    finish();
    return;
  }

  // -------------------------------------------------------------------------
  // Vault: the raw files against the manifest and against each other
  // -------------------------------------------------------------------------
  console.log("\nVault integrity");

  for (const file of entry.files) {
    const path = vaultFilePath(exportId, file.file);
    if (!existsSync(path)) {
      check(`present: ${file.file}`, false);
      continue;
    }
    check(`sha256 unchanged: ${file.file}`, sha256File(path) === file.sha256);
  }

  console.log("\nExport self-consistency");

  const rows = new Map<MailchimpStatus, ReturnType<typeof readCsv>>();
  for (const status of STATUS_ORDER) {
    const file = entry.files.find((item) => item.status === status);
    if (!file) {
      check(`the export has a ${status} file`, false);
      continue;
    }
    const parsed = readCsv(exportId, file.file);
    rows.set(status, parsed);
    check(
      `${status}: ${parsed.length} rows, as recorded`,
      parsed.length === file.rows,
      `manifest says ${file.rows}`
    );
  }

  // The four status files are a partition of the audience. Mailchimp gives a
  // contact exactly one status, so an address in two files means either a
  // truncated download or a change in Mailchimp's semantics — and every count
  // in the archive assumes it cannot happen.
  const seen = new Map<string, MailchimpStatus>();
  const overlaps: string[] = [];
  for (const status of STATUS_ORDER) {
    for (const row of rows.get(status) ?? []) {
      const email = normalizeEmail(row["Email Address"]);
      if (!email) continue;
      const prior = seen.get(email);
      // Addresses are never printed, here or anywhere: the point of the
      // archive is that no address reaches a file or a terminal log.
      if (prior) overlaps.push(`an address appears in both ${prior} and ${status}`);
      else seen.set(email, status);
    }
  }
  check(
    `the four status files partition the audience (${seen.size} distinct addresses)`,
    overlaps.length === 0,
    [...new Set(overlaps)].join("\n         ")
  );

  const cleaned = rows.get("cleaned")?.length ?? 0;
  const uiCount = seen.size - cleaned;
  check(
    `subscribed + unsubscribed + nonsubscribed = ${uiCount}, the count Mailchimp's UI reports`,
    uiCount ===
      (rows.get("subscribed")?.length ?? 0) +
        (rows.get("unsubscribed")?.length ?? 0) +
        (rows.get("nonsubscribed")?.length ?? 0),
    "The UI figure excludes cleaned contacts. A mismatch means a partial download."
  );

  // Every tag in the vault must be classifiable, or the build will throw.
  // Checking it here reports ALL of them at once instead of the first.
  const known = new Set(tags.tags.map((tag) => tag.tag));
  const unknown = new Set<string>();
  for (const status of STATUS_ORDER) {
    for (const row of rows.get(status) ?? []) {
      for (const tag of parseTagCell(row["TAGS"]).tags) {
        if (!known.has(tag)) unknown.add(tag);
      }
    }
  }
  check(
    "every tag in the vault is in the committed vocabulary",
    unknown.size === 0,
    [...unknown].map((tag) => JSON.stringify(tag)).join("\n         ")
  );

  console.log("\nLeak guard (the committed archive must carry no personal data)");

  const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
  const IPV4 = /\b(?:\d{1,3}\.){3}\d{1,3}\b/;
  for (const name of ["aggregates.json", "tags.json", "crosswalk.json", "manifest.json"]) {
    const raw = readFileSync(join(ARCHIVE_DIR, name), "utf8");
    check(`${name} contains no email address`, !EMAIL.test(raw));
    check(`${name} contains no IP address`, !IPV4.test(raw));
  }

  finish();
}

function finish(): never {
  console.log("");
  console.log(
    failures === 0
      ? "ok - every check passed"
      : `${failures} check(s) failed`
  );
  process.exit(failures === 0 ? 0 : 1);
}

main();
