/**
 * Imports the Mailchimp `subscribed` export into `newsletter_subscribers`.
 *
 * This is the one script in the repo that writes a large number of real people's
 * addresses into the production database, so it is built to be hard to misuse:
 *
 * - **Dry run is the default.** Writing requires `--apply`, spelled out. Every
 *   other script here defaults to doing the thing; this one defaults to
 *   describing it, because the thing is irreversible in practice — you cannot
 *   un-import consent, you can only delete rows and lose the provenance.
 * - **Only the `subscribed` export may be imported.** Mailchimp exports four
 *   statuses. `unsubscribed`, `cleaned` and `nonsubscribed` belong in the
 *   suppression register, and `nonsubscribed` in particular is not a lapse in
 *   consent but the absence of one. The script refuses a file whose name says
 *   it is one of those.
 * - **Both suppression registers are consulted**, and the committed one must be
 *   fresh: `suppression.ts pull-mailchimp` should have been run immediately
 *   before. Its first run moved the register 2,129 → 2,138, and the run before
 *   this import moved it 2,138 → 2,144 — six people who had unsubscribed or
 *   hard-bounced since the export was taken, every one of whom an import built
 *   on that frozen file would have mailed.
 * - **No address is ever printed.** Counts and truncated hashes only, so the
 *   output is safe in a plan block, a PR or Slack.
 *
 * **On consent, and why `confirmedAt` is set.** Every one of the 1,560 rows
 * carries a `CONFIRM_TIME`: these people completed a double opt-in, in
 * Mailchimp. Recording that timestamp is not fabricating an act — the act
 * happened, and we have its date. What distinguishes them from someone who
 * confirmed through our own form is `source = 'mailchimp-import'` plus the
 * provenance sentence in `consentSource`, which together answer "why is this
 * person on our list?" more completely than a null ever could.
 *
 * Times are recorded as written in the export (`YYYY-MM-DD HH:MM:SS`, no zone).
 * Mailchimp exports in the account's timezone and most rows carry no GMTOFF, so
 * they are read as UTC. A consent timestamp out by a few hours does not change
 * what it evidences, and inventing a zone would be worse than admitting one.
 *
 * Usage:
 *   npx tsx scripts/email/import-mailchimp-subscribers.ts <subscribed.csv> \
 *     --consent-source "..." [--apply] [--limit <n>]
 */

import "dotenv/config";
import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";

import { client, db } from "../../lib/db/drizzle";
import { newsletterSubscribers } from "../../lib/db/schema";
import { parseCsv } from "./normalize-recipients";
import { hashEmail, loadSuppressionHashes } from "./suppression";

/** Statuses whose export must never be imported. */
const FORBIDDEN_EXPORTS = ["unsubscribed", "cleaned", "nonsubscribed"];

/** How many hashes to show in the preview. */
const PREVIEW = 10;

interface Row {
  email: string;
  firstName: string | null;
  lastName: string | null;
  optinTime: string;
  confirmTime: string;
}

interface Skipped {
  emailHash: string;
  reason: string;
}

/** Prints an error and exits. */
function fail(...lines: string[]): never {
  console.error(`Error: ${lines[0]}`);
  for (const line of lines.slice(1)) console.error(`  ${line}`);
  process.exit(1);
}

/** Reads a flag's value from argv. */
function readOption(argv: string[], flag: string): string | null {
  const index = argv.indexOf(flag);
  if (index === -1) return null;
  const value = argv[index + 1];
  return value && !value.startsWith("--") ? value : null;
}

/** Anything that looks like an address; the same shape normalize-recipients uses. */
function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(value);
}

/**
 * Parses a Mailchimp export timestamp.
 *
 * @param value `YYYY-MM-DD HH:MM:SS`, or empty.
 * @returns The date, or null when absent or unparseable.
 */
function parseStamp(value: string | undefined): Date | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const date = new Date(`${trimmed.replace(" ", "T")}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Returns the trimmed value, or null when empty. */
function nullIfEmpty(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const csvPath = argv.find((arg) => !arg.startsWith("--"));
  if (!csvPath) {
    fail(
      "no CSV given.",
      "Usage: npx tsx scripts/email/import-mailchimp-subscribers.ts <subscribed.csv> --consent-source \"...\""
    );
  }

  const name = basename(csvPath).toLowerCase();
  const forbidden = FORBIDDEN_EXPORTS.find((status) => name.includes(status));
  if (forbidden) {
    fail(
      `refusing to import a "${forbidden}" export.`,
      "Only the `subscribed` export may be imported. The other three belong in the",
      "suppression register — and `nonsubscribed` is not a lapse in consent but the",
      "absence of one, so importing it would mail people who never agreed to anything.",
      "Feed it to: scripts/email/suppression.ts add-file"
    );
  }

  const consentSource = readOption(argv, "--consent-source");
  if (!consentSource) {
    fail(
      "--consent-source is required.",
      "Importing addresses means asserting these people opted in. That assertion has",
      "to be recorded WITH the rows — which export, taken when — or nobody can later",
      "prove the consent existed. See consent-rules.md."
    );
  }

  const apply = argv.includes("--apply");
  const limitRaw = readOption(argv, "--limit");
  const limit = limitRaw === null ? null : Number(limitRaw);
  if (limit !== null && (!Number.isInteger(limit) || limit < 1)) {
    fail(`--limit must be a positive integer (got "${limitRaw}").`);
  }

  // ---- read -------------------------------------------------------------
  const records = parseCsv(readFileSync(resolve(csvPath), "utf8"));
  const header = records[0]?.cells ?? [];
  const index = (want: string): number =>
    header.findIndex((cell) => cell.trim().toLowerCase() === want.toLowerCase());

  const iEmail = index("Email Address");
  const iFirst = index("First Name");
  const iLast = index("Last Name");
  const iOptin = index("OPTIN_TIME");
  const iConfirm = index("CONFIRM_TIME");
  if (iEmail === -1) fail('no "Email Address" column in that CSV.');

  const rows: Row[] = [];
  const skipped: Skipped[] = [];
  const seen = new Set<string>();
  let malformed = 0;

  for (const record of records.slice(1)) {
    const cells = record.cells;
    const raw = (cells[iEmail] ?? "").trim().toLowerCase();
    if (!raw || !looksLikeEmail(raw)) {
      malformed += 1;
      continue;
    }
    if (seen.has(raw)) {
      skipped.push({ emailHash: hashEmail(raw), reason: "duplicate in file" });
      continue;
    }
    seen.add(raw);
    rows.push({
      email: raw,
      firstName: nullIfEmpty(cells[iFirst]),
      lastName: nullIfEmpty(cells[iLast]),
      optinTime: cells[iOptin] ?? "",
      confirmTime: cells[iConfirm] ?? "",
    });
  }

  // ---- filter -----------------------------------------------------------
  const suppressed = loadSuppressionHashes();
  const existing = new Set(
    (await db.select({ emailHash: newsletterSubscribers.emailHash }).from(newsletterSubscribers))
      .map((row) => row.emailHash.toLowerCase())
  );

  const importable: Row[] = [];
  for (const row of rows) {
    const hash = hashEmail(row.email);
    if (suppressed.has(hash)) {
      skipped.push({ emailHash: hash, reason: "on the suppression register" });
      continue;
    }
    if (existing.has(hash)) {
      skipped.push({ emailHash: hash, reason: "already a subscriber" });
      continue;
    }
    importable.push(row);
  }

  const selected = limit === null ? importable : importable.slice(0, limit);

  // ---- report -----------------------------------------------------------
  const bySkipReason = new Map<string, number>();
  for (const row of skipped) {
    bySkipReason.set(row.reason, (bySkipReason.get(row.reason) ?? 0) + 1);
  }

  console.log("");
  console.log("  Mailchimp subscriber import");
  console.log("  ---------------------------");
  console.log(`  File                  ${basename(csvPath)}`);
  console.log(`  Consent source        ${consentSource}`);
  console.log(`  Rows read             ${records.length - 1}`);
  console.log(`  Malformed / blank     ${malformed}`);
  for (const [reason, count] of bySkipReason) {
    console.log(`  Skipped (${reason})${" ".repeat(Math.max(1, 12 - reason.length))}${count}`);
  }
  console.log(`  Suppression register  ${suppressed.size} hashes`);
  console.log(`  Already in the table  ${existing.size}`);
  console.log(`  WOULD IMPORT          ${selected.length}`);
  console.log("");

  const withoutConfirm = selected.filter((row) => !parseStamp(row.confirmTime)).length;
  const withoutOptin = selected.filter((row) => !parseStamp(row.optinTime)).length;
  console.log(`  Missing CONFIRM_TIME  ${withoutConfirm}`);
  console.log(`  Missing OPTIN_TIME    ${withoutOptin}`);
  if (skipped.length > 0) {
    console.log("");
    console.log("  A sample of what was held back (hashes only):");
    for (const row of skipped.slice(0, PREVIEW)) {
      console.log(`    ${row.emailHash.slice(0, 12)}…  ${row.reason}`);
    }
  }
  console.log("");

  if (!apply) {
    console.log("  DRY RUN — nothing was written.");
    console.log("  Re-run with --apply to write these rows.");
    console.log("");
    await client.end();
    return;
  }

  // ---- write ------------------------------------------------------------
  const now = new Date();
  let written = 0;
  // Chunked and serial: Neon throttles bursts of concurrent connection attempts,
  // and a half-finished import is much harder to reason about than a slow one.
  const CHUNK = 200;
  for (let start = 0; start < selected.length; start += CHUNK) {
    const chunk = selected.slice(start, start + CHUNK).map((row) => {
      const confirmedAt = parseStamp(row.confirmTime);
      const optinAt = parseStamp(row.optinTime);
      return {
        email: row.email,
        emailHash: hashEmail(row.email),
        firstName: row.firstName,
        lastName: row.lastName,
        status: "subscribed" as const,
        source: "mailchimp-import",
        consentSource,
        // When they asked. Falls back to the confirmation for the one row that
        // has no OPTIN_TIME; the column is NOT NULL and a confirmation is
        // strictly better evidence than a guess.
        consentDate: optinAt ?? confirmedAt ?? now,
        consentIp: null,
        consentUserAgent: null,
        confirmToken: null,
        confirmSentAt: null,
        confirmExpiresAt: null,
        confirmedAt,
        createdAt: now,
        updatedAt: now,
      };
    });

    await db
      .insert(newsletterSubscribers)
      .values(chunk)
      .onConflictDoNothing({ target: newsletterSubscribers.emailHash });
    written += chunk.length;
    console.log(`  written ${written}/${selected.length}`);
  }

  const total = await db
    .select({ emailHash: newsletterSubscribers.emailHash })
    .from(newsletterSubscribers);
  console.log("");
  console.log(`  Import complete. newsletter_subscribers now holds ${total.length} row(s).`);
  console.log("  Next: npx tsx scripts/email/suppression.ts reconcile");
  console.log("");
  await client.end();
}

main().catch((error) => {
  console.error("Failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
