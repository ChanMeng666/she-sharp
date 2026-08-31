/**
 * The do-not-contact register for every She Sharp email script.
 *
 * Once someone has bounced, complained, or asked to be left alone, that
 * decision has to outlive the CSV it came from — otherwise the next event
 * export silently re-adds them and we email them again. This file is that
 * memory, and `normalize-recipients.ts` consults it on every import.
 *
 * It stores ONLY `sha256(lowercased, trimmed email)` — never the address
 * itself. A hash is enough to answer "is this person suppressed?" (the only
 * question we ever ask of the list) while carrying no PII, so the file is safe
 * to commit and safe to hand to a contractor. `.gitignore` therefore whitelists
 * `lib/data/json/email-suppression-hashes.json` explicitly. The trade-off is
 * deliberate and one-way: nothing here can be turned back into an address, so
 * `list` shows truncated hashes and a reason, and never pretends otherwise.
 *
 * Usage:
 *   npx tsx scripts/email/suppression.ts list
 *   npx tsx scripts/email/suppression.ts add <email> [--reason "bounced"]
 *   npx tsx scripts/email/suppression.ts add-file <csv> --column "Email Address" [--reason "…"] [--dry-run]
 *   npx tsx scripts/email/suppression.ts remove <email>
 *   npx tsx scripts/email/suppression.ts check <email>
 *   npx tsx scripts/email/suppression.ts sync [--dry-run]
 *   npx tsx scripts/email/suppression.ts pull-mailchimp [--since <ISO>] [--full] [--list-id <id>] [--dry-run]
 *   npx tsx scripts/email/suppression.ts reconcile
 *
 * Output:
 *   list     — one line per entry: `<hash[0:12]>…  <reason>  <YYYY-MM-DD>`, then a total.
 *   add      — confirms, or reports the address was already suppressed (exit 0 either way).
 *   add-file — reads one column of a CSV and suppresses every address in it, for
 *              the case `add` cannot serve: an ESP export of everyone who has
 *              unsubscribed or hard-bounced. Mailchimp's is 2,129 rows across
 *              three files, and typing that by hand is not a plan. Prints counts
 *              and never an address.
 *   remove   — confirms, or exits 1 if the address was not on the list.
 *   check    — prints SUPPRESSED / not suppressed; exit 0 if suppressed, 1 if not,
 *              so it can be used in a shell conditional.
 *   reconcile
 *          — the drift report, and the live size of the list. Prints
 *            `Subscribed rows` (the table's own count) and `Mailable after
 *            suppression` (what a send reaches); quote the second. Exits 1
 *            when they differ. Needs POSTGRES_URL.
 *   sync   — folds the runtime `email_optouts` table (one-click unsubscribes,
 *            bounces and spam complaints captured by the Resend webhook) into
 *            this file. Both sides key on the same `hashEmail()`, so it is a
 *            plain set union — no matching logic and no PII crossing over.
 *            Needs POSTGRES_URL. Run it monthly.
 *   pull-mailchimp
 *          — the same union, for the platform She Sharp used to send from and
 *            has NOT switched off. The newsletter moved to Resend on 2026-08-31,
 *            but the Mailchimp account is still open: it sends event campaigns
 *            and still carries its own sign-up and unsubscribe links. So someone
 *            who unsubscribes there exists ONLY in Mailchimp's record, and
 *            `sync` cannot see them. Pulls the `unsubscribed` and
 *            `cleaned` members changed since the last pull and folds them in.
 *            Needs MAILCHIMP_API_KEY (+ MAILCHIMP_LIST_ID). Run it monthly,
 *            beside `sync`.
 *
 * Importable API (used by normalize-recipients.ts):
 *   hashEmail(email)          → lowercase sha256 hex of the normalized address
 *   loadSuppressionHashes()   → Set<string> of every suppressed hash
 */

import { readFileSync, writeFileSync } from "node:fs";
import { parse } from "csv-parse/sync";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { hashEmail } from "../../lib/email/hash";
// Statically imported, unlike `sync`'s database modules: `lib/mailchimp/client.ts`
// reads MAILCHIMP_API_KEY lazily inside each fetch and throws nothing at module
// load, so `list`/`add`/`remove`/`check` keep working on a machine that has no
// Mailchimp key. (`lib/db/drizzle.ts` does throw at load, which is the whole
// reason `commandSync` imports dynamically; that reason does not apply here.)
import { getLists, listMembers, type MailchimpList } from "../../lib/mailchimp/client";
import { ownMailboxAddresses } from "./own-mailboxes";

export { hashEmail };

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
/** Repo root — this file lives at <root>/scripts/email/suppression.ts. */
const REPO_ROOT = resolve(SCRIPT_DIR, "..", "..");
/** The committed, PII-free suppression register. */
export const SUPPRESSION_PATH = resolve(
  REPO_ROOT,
  "lib",
  "data",
  "json",
  "email-suppression-hashes.json"
);

export interface SuppressionEntry {
  /** sha256 hex of the lowercased, trimmed address. */
  hash: string;
  /** Why they are suppressed, e.g. "bounced", "unsubscribed", "complained". */
  reason: string;
  /** ISO timestamp of when the entry was added. */
  at: string;
}

export interface SuppressionFile {
  version: number;
  updatedAt: string;
  entries: SuppressionEntry[];
}

const EMPTY_FILE: SuppressionFile = {
  version: 1,
  updatedAt: new Date(0).toISOString(),
  entries: [],
};

/**
 * Reads the suppression file from disk.
 *
 * @returns The parsed file, or an empty skeleton if it is missing/unreadable.
 * @throws Error if the file exists but is not valid JSON of the expected shape.
 */
export function readSuppressionFile(): SuppressionFile {
  let raw: string;
  try {
    raw = readFileSync(SUPPRESSION_PATH, "utf8");
  } catch {
    return { ...EMPTY_FILE, entries: [] };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`${SUPPRESSION_PATH} is not valid JSON: ${message}`);
  }

  if (typeof parsed !== "object" || parsed === null || !Array.isArray((parsed as SuppressionFile).entries)) {
    throw new Error(
      `${SUPPRESSION_PATH} must be an object with an "entries" array. ` +
        `Restore it from git, or reset it to {"version":1,"updatedAt":"…","entries":[]}.`
    );
  }

  const file = parsed as SuppressionFile;
  return {
    version: typeof file.version === "number" ? file.version : 1,
    updatedAt: typeof file.updatedAt === "string" ? file.updatedAt : EMPTY_FILE.updatedAt,
    entries: file.entries.filter(
      (entry): entry is SuppressionEntry =>
        typeof entry === "object" &&
        entry !== null &&
        typeof entry.hash === "string" &&
        entry.hash.length > 0
    ),
  };
}

/**
 * Loads every suppressed hash for fast membership tests.
 *
 * @returns A set of lowercase sha256 hex digests; empty if the file is absent.
 */
export function loadSuppressionHashes(): Set<string> {
  return new Set(readSuppressionFile().entries.map((entry) => entry.hash.toLowerCase()));
}

/** Writes the register back, stamping `updatedAt` and keeping entries sorted. */
function writeSuppressionFile(file: SuppressionFile): void {
  const next: SuppressionFile = {
    version: file.version,
    updatedAt: new Date().toISOString(),
    entries: [...file.entries].sort((a, b) => a.hash.localeCompare(b.hash)),
  };
  writeFileSync(SUPPRESSION_PATH, `${JSON.stringify(next, null, 2)}\n`, "utf8");
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

/** Basic shape check — enough to catch "you passed the reason as the email". */
function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(value.trim());
}

/** `--flag value` lookup, matching the hand-rolled convention used across scripts/. */
function argValue(argv: string[], flag: string): string | undefined {
  const index = argv.indexOf(flag);
  return index === -1 ? undefined : argv[index + 1];
}

/** Reads `--reason "…"`, defaulting to a neutral value. */
function readReason(argv: string[]): string {
  const index = argv.indexOf("--reason");
  if (index === -1) return "unspecified";
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) {
    console.error('Error: --reason requires a value, e.g. --reason "bounced".');
    process.exit(1);
  }
  return value;
}

function usage(): void {
  console.error("Usage:");
  console.error("  npx tsx scripts/email/suppression.ts list");
  console.error('  npx tsx scripts/email/suppression.ts add <email> [--reason "bounced"]');
  console.error(
    '  npx tsx scripts/email/suppression.ts add-file <csv> --column "Email Address" [--reason "…"] [--dry-run]'
  );
  console.error("  npx tsx scripts/email/suppression.ts remove <email>");
  console.error("  npx tsx scripts/email/suppression.ts check <email>");
  console.error("  npx tsx scripts/email/suppression.ts sync [--dry-run]");
  console.error(
    "  npx tsx scripts/email/suppression.ts pull-mailchimp [--since <ISO>] [--full] [--list-id <id>] [--dry-run]"
  );
  console.error("  npx tsx scripts/email/suppression.ts reconcile");
}

/** Validates and returns the address argument for add/remove/check. */
function requireEmailArg(command: string, value: string | undefined): string {
  if (!value || value.startsWith("--")) {
    console.error(`Error: "${command}" requires an email address.`);
    usage();
    process.exit(1);
  }
  if (!looksLikeEmail(value)) {
    console.error(`Error: "${value}" does not look like an email address.`);
    process.exit(1);
  }
  return value;
}

function commandList(): void {
  const file = readSuppressionFile();
  if (file.entries.length === 0) {
    console.log("Suppression list is empty.");
    console.log(`File: ${SUPPRESSION_PATH}`);
    return;
  }

  const reasonWidth = Math.max(6, ...file.entries.map((entry) => entry.reason.length));
  console.log(`HASH            ${"REASON".padEnd(reasonWidth)}  ADDED`);
  console.log(`------------    ${"-".repeat(reasonWidth)}  ----------`);
  for (const entry of file.entries) {
    const date = entry.at ? entry.at.slice(0, 10) : "unknown";
    console.log(`${entry.hash.slice(0, 12)}…   ${entry.reason.padEnd(reasonWidth)}  ${date}`);
  }
  console.log("");
  console.log(
    `${file.entries.length} suppressed address(es). Hashes cannot be reversed — ` +
      `to test one address, run \`suppression.ts check <email>\`.`
  );
}

function commandAdd(email: string, reason: string): void {
  const file = readSuppressionFile();
  const hash = hashEmail(email);
  const existing = file.entries.find((entry) => entry.hash === hash);
  if (existing) {
    console.log(`Already suppressed (${hash.slice(0, 12)}… — ${existing.reason}). Nothing to do.`);
    return;
  }
  file.entries.push({ hash, reason, at: new Date().toISOString() });
  writeSuppressionFile(file);
  console.log(`Suppressed ${hash.slice(0, 12)}… (${reason}).`);
  console.log(`${file.entries.length} entr(ies) now in ${SUPPRESSION_PATH}`);
}

/**
 * Suppresses every address in one column of a CSV.
 *
 * Exists for the migration case `add` cannot serve. Moving off an ESP means
 * importing the subscriber list and, far more importantly, importing the list
 * of everyone that ESP had already STOPPED mailing — years of unsubscribes,
 * hard bounces and spam complaints that do not travel with the subscriber
 * export. Mailchimp's is 2,129 addresses across three files. Adding them one
 * command at a time is not something anyone would finish, and a half-finished
 * suppression list is worse than none: it reads as complete.
 *
 * Deliberate constraints, both matching the rest of this file:
 *  - **No address is ever printed**, not even on error. Output is counts and
 *    truncated hashes, so a pasted terminal log carries nothing.
 *  - **No address is ever written.** Only `hashEmail()` output reaches disk.
 *
 * The CSV is read with the repo's `csv-parse` rather than split on commas: a
 * Mailchimp export quotes fields and embeds commas inside them, and a naive
 * split silently shifts every column after the first quoted one.
 *
 * @param path CSV to read.
 * @param column Header of the column holding the addresses.
 * @param reason Recorded against every address added, e.g. `mailchimp-cleaned`.
 * @param dryRun Report what would be added and write nothing.
 */
function commandAddFile(path: string, column: string, reason: string, dryRun: boolean): void {
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    console.error(`Error: cannot read ${path}`);
    process.exit(1);
  }

  const rows = parse(raw, {
    columns: true,
    bom: true,
    skip_empty_lines: true,
    relax_column_count: false,
    trim: false,
  }) as Record<string, string>[];

  if (rows.length === 0) {
    console.error(`Error: ${path} has no data rows.`);
    process.exit(1);
  }
  if (!(column in rows[0])) {
    console.error(
      `Error: no column named ${JSON.stringify(column)} in ${path}.\n` +
        `  Columns are: ${Object.keys(rows[0]).join(", ")}`
    );
    process.exit(1);
  }

  const file = readSuppressionFile();
  const known = new Set(file.entries.map((entry) => entry.hash.toLowerCase()));

  let added = 0;
  let already = 0;
  let blank = 0;
  let malformed = 0;
  const seen = new Set<string>();
  const at = new Date().toISOString();

  for (const row of rows) {
    const value = (row[column] ?? "").trim();
    if (!value) {
      blank++;
      continue;
    }
    if (!looksLikeEmail(value)) {
      malformed++;
      continue;
    }
    const hash = hashEmail(value);
    // Duplicates within the file are not "already suppressed" — counting them
    // as such would overstate how much of the list was already on file.
    if (seen.has(hash)) continue;
    seen.add(hash);

    if (known.has(hash)) {
      already++;
      continue;
    }
    known.add(hash);
    file.entries.push({ hash, reason, at });
    added++;
  }

  console.log(`${path}`);
  console.log(`  ${rows.length} row(s), column ${JSON.stringify(column)}`);
  console.log(`  ${seen.size} distinct address(es)`);
  if (blank > 0) console.log(`  ${blank} blank, skipped`);
  if (malformed > 0) console.log(`  ${malformed} not address-shaped, skipped`);
  console.log(`  ${already} already suppressed`);
  console.log(`  ${added} to add, reason ${JSON.stringify(reason)}`);

  if (dryRun) {
    console.log(`\n--dry-run: nothing written.`);
    return;
  }
  if (added === 0) {
    console.log(`\nNothing to add. ${file.entries.length} entr(ies) in ${SUPPRESSION_PATH}`);
    return;
  }

  writeSuppressionFile(file);
  console.log(`\nAdded ${added}. ${file.entries.length} entr(ies) now in ${SUPPRESSION_PATH}`);
}

function commandRemove(email: string): void {
  const file = readSuppressionFile();
  const hash = hashEmail(email);
  const before = file.entries.length;
  file.entries = file.entries.filter((entry) => entry.hash !== hash);
  if (file.entries.length === before) {
    console.error(`Not on the suppression list (${hash.slice(0, 12)}…). Nothing removed.`);
    process.exit(1);
  }
  writeSuppressionFile(file);
  console.log(`Removed ${hash.slice(0, 12)}… from the suppression list.`);
  console.log(`${file.entries.length} entr(ies) remain in ${SUPPRESSION_PATH}`);
}

function commandCheck(email: string): void {
  const hash = hashEmail(email);
  const hashes = loadSuppressionHashes();
  if (hashes.has(hash)) {
    const entry = readSuppressionFile().entries.find((candidate) => candidate.hash === hash);
    console.log(`SUPPRESSED — ${hash.slice(0, 12)}… (${entry?.reason ?? "unspecified"})`);
    process.exit(0);
  }
  console.log(`not suppressed — ${hash.slice(0, 12)}…`);
  process.exit(1);
}

/**
 * Merges runtime opt-outs into the committed register.
 *
 * The two stores answer the same question for different callers: the table
 * serves live sends, this file serves the offline import scripts. Keeping them
 * in step is what stops `normalize-recipients.ts` from re-adding someone who
 * unsubscribed or bounced since the last CSV.
 *
 * The imports are dynamic so that `list`/`add`/`remove`/`check` keep working
 * with no POSTGRES_URL set — `lib/db/drizzle.ts` throws at module load without
 * it. The connection is closed explicitly at the end: the module-level pool is
 * built for a long-lived server, and left open it keeps this CLI process alive
 * forever after the output has been printed.
 *
 * @param dryRun When true, report what would be added and write nothing.
 */
async function commandSync(dryRun: boolean): Promise<void> {
  const { listOptouts } = await import("../../lib/email/optouts");
  const { client } = await import("../../lib/db/drizzle");

  try {
    await syncFromDatabase(listOptouts, dryRun);
  } finally {
    await client.end();
  }
}

/**
 * Reports mailable subscribers who are also on a do-not-contact register.
 *
 * The newsletter list and the two suppression registers are written by different
 * code paths at different times — a form submission here, a Resend webhook there,
 * a monthly Mailchimp pull somewhere else — and nothing but this command notices
 * when they disagree. A `subscribed` row whose hash sits in a register is a
 * person the list believes it may email and the register says it may not, and
 * the register is always right.
 *
 * It is also where the live size of the list is read from, so it prints two
 * totals rather than one: `Subscribed rows` is the table's own count and
 * `Mailable after suppression` is what a send would actually reach. Quote the
 * second. They differ by exactly the drift count below them.
 *
 * Prints hashes only, like everything else here, so the output is safe to paste
 * into Slack or a plan block. Exits 1 when there is drift, so it can gate a send
 * from a shell conditional.
 */
async function commandReconcile(): Promise<void> {
  /** How many drifted hashes to print before summarising the rest. */
  const PREVIEW = 20;

  const { listMailableCandidates } = await import("../../lib/newsletter/subscribers");
  const { listOptouts } = await import("../../lib/email/optouts");
  const { formatMailableCounts, selectMailable } = await import("./mailable");
  const { client } = await import("../../lib/db/drizzle");

  try {
    const candidates = await listMailableCandidates();
    const optouts = await listOptouts();
    const committed = readSuppressionFile();

    // The same function the recipient builder uses. Reimplementing the rule here
    // would let the report and the send disagree, and the disagreement would be
    // invisible: the report would say "clean" while the builder dropped people,
    // or the report would cry drift about rows the builder happily mails.
    const result = selectMailable(candidates, optouts, committed.entries);
    const { excluded, returned } = result;

    // "Mailable after suppression" is the figure to quote as the size of the
    // list: it is what the recipient builder would hand to a send. The
    // subscribed total above it is the table's own count, before the registers
    // are applied, and the two differ by exactly the drift reported below.
    for (const line of formatMailableCounts(result, optouts.length, committed.entries.length)) {
      console.log(line);
    }
    console.log("");

    if (returned.length > 0) {
      console.log(`Re-subscribed after suppression (allowed): ${returned.length}`);
      for (const row of returned.slice(0, PREVIEW)) {
        console.log(`  ${row.emailHash.slice(0, 12)}…  ${row.reason}`);
      }
      if (returned.length > PREVIEW) {
        console.log(`  … and ${returned.length - PREVIEW} more`);
      }
      console.log("");
    }

    if (excluded.length === 0) {
      console.log("No drift: every mailable subscriber is clear of both registers.");
      return;
    }

    console.log(`DRIFT — subscribed but suppressed: ${excluded.length}`);
    for (const row of excluded.slice(0, PREVIEW)) {
      console.log(`  ${row.emailHash.slice(0, 12)}…  ${row.reason}`);
    }
    if (excluded.length > PREVIEW) {
      console.log(`  … and ${excluded.length - PREVIEW} more`);
    }
    console.log("");
    console.log("These rows are stripped by the recipient builder, so nothing will be");
    console.log("mailed — but a persistent count here means a write path is not updating");
    console.log("the subscriber table. Find it rather than living with the strip.");
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}


/**
 * She Sharp's own mailboxes, by hash.
 *
 * Nine of them do not exist, so anything sent to one hard-bounces and the
 * bounce webhook records an opt-out — correct for the runtime table, wrong for
 * this register, which means "a member of the public asked us to stop". The
 * organisation cannot opt out of its own mail. Without this, one run of
 * `probe-mailboxes.ts` would fold nine of She Sharp's own addresses into a
 * committed do-not-contact list.
 */
const OWN_MAILBOX_HASHES = new Set(
  ownMailboxAddresses().map((address) => hashEmail(address).toLowerCase())
);

/** The body of `sync`, split out so the connection close can be guaranteed. */
async function syncFromDatabase(
  listOptouts: () => Promise<
    { emailHash: string; stream: string; reason: string; createdAt: Date }[]
  >,
  dryRun: boolean
): Promise<void> {
  const file = readSuppressionFile();
  const known = new Set(file.entries.map((entry) => entry.hash.toLowerCase()));

  const rows = await listOptouts();
  const own = rows.filter((row) => OWN_MAILBOX_HASHES.has(row.emailHash.toLowerCase()));
  const missing = rows
    .filter((row) => !known.has(row.emailHash.toLowerCase()))
    .filter((row) => !OWN_MAILBOX_HASHES.has(row.emailHash.toLowerCase()));

  console.log(`${rows.length} opt-out(s) in the database, ${file.entries.length} in the file.`);
  if (own.length > 0) {
    console.log(
      `Skipping ${own.length} row(s) for She Sharp's own mailboxes — mostly the
` +
        `hard bounces from scripts/email/probe-mailboxes.ts. They belong in the
` +
        `runtime table, never in the register.`
    );
  }

  if (missing.length === 0) {
    console.log("Already in sync — nothing to add.");
    return;
  }

  for (const row of missing) {
    console.log(`  + ${row.emailHash.slice(0, 12)}…  ${row.reason}  ${row.createdAt.toISOString().slice(0, 10)}`);
  }

  if (dryRun) {
    console.log(`\n--dry-run: would add ${missing.length} entr(ies). Nothing written.`);
    return;
  }

  for (const row of missing) {
    file.entries.push({
      hash: row.emailHash.toLowerCase(),
      reason: row.reason,
      at: row.createdAt.toISOString(),
    });
  }
  writeSuppressionFile(file);
  console.log(`\nAdded ${missing.length} entr(ies). ${file.entries.length} total in ${SUPPRESSION_PATH}`);
}

// ---------------------------------------------------------------------------
// pull-mailchimp
// ---------------------------------------------------------------------------

/**
 * The reason strings written by a Mailchimp pull.
 *
 * These are not new vocabulary: the 2026-08-17 CSV import wrote exactly
 * `mailchimp-unsubscribed` (803) and `mailchimp-cleaned` (544) into the
 * register, and reusing them is what lets the watermark below find the last
 * pull. `mailchimp-never-subscribed` (782) also exists in the file but has no
 * live counterpart — the API has no such status, it was a CSV artefact.
 */
const MAILCHIMP_UNSUBSCRIBED_REASON = "mailchimp-unsubscribed";
const MAILCHIMP_CLEANED_REASON = "mailchimp-cleaned";

/** Identifies every entry that came from Mailchimp, whichever pull wrote it. */
const MAILCHIMP_REASON_PREFIX = "mailchimp-";

/**
 * How far back before the last recorded decision the default window reaches.
 *
 * Deliberately generous, because `since_last_changed` **over-returns**: a bulk
 * tag operation moves `last_changed` for thousands of contacts who did nothing
 * (trap 8 in `docs/development/MAILCHIMP_ARCHIVE.md`). The two failure modes
 * are not symmetric — over-returning costs a re-hash of somebody already
 * suppressed, which is a no-op, while under-returning emails somebody who
 * asked us to stop. So err long.
 */
const MAILCHIMP_WATERMARK_OVERLAP_DAYS = 7;

/**
 * The field projection for the pull.
 *
 * Narrower than the client's own default, which is already a PII guard. This
 * command needs an address to hash, the status that decides the reason, and
 * the date the decision was made. `members.id` is excluded on purpose: it is
 * the md5 of the address, a per-person identifier that reverses against any
 * candidate list, and nothing in a script that writes to a committed file
 * should be holding one. `total_items` stays because `paginate()` reads it to
 * know when to stop.
 */
const MAILCHIMP_PULL_FIELDS = [
  "members.email_address",
  "members.status",
  "members.last_changed",
  "members.unsubscribe_reason",
  "total_items",
] as const;

/**
 * Finds the start of the default pull window: the newest Mailchimp decision
 * already on file, less an overlap.
 *
 * Deliberately NOT the file's `updatedAt`. That field moves on any write —
 * `add`, `add-file`, `sync` — so an unrelated `sync` run on Tuesday would
 * advance the cursor past Monday's unsubscribes and they would never be
 * pulled. `max(entry.at)` over Mailchimp entries only is a cursor over the
 * data this command actually owns, which is the property a watermark needs.
 *
 * @param file The register as read from disk.
 * @returns An ISO timestamp for `since_last_changed`, or undefined when no
 *   Mailchimp entry exists yet (in which case the caller should ask for
 *   `--full`, since there is nothing to resume from).
 */
function mailchimpWatermark(file: SuppressionFile): string | undefined {
  let newest = Number.NEGATIVE_INFINITY;
  for (const entry of file.entries) {
    if (typeof entry.reason !== "string" || !entry.reason.startsWith(MAILCHIMP_REASON_PREFIX)) {
      continue;
    }
    const ms = typeof entry.at === "string" ? Date.parse(entry.at) : Number.NaN;
    if (!Number.isNaN(ms) && ms > newest) newest = ms;
  }
  if (newest === Number.NEGATIVE_INFINITY) return undefined;
  return new Date(newest - MAILCHIMP_WATERMARK_OVERLAP_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Runs one Mailchimp call, naming the step in whatever it throws.
 *
 * `main()` prints `err.message` and nothing else — deliberately, so no stack
 * trace or response body can carry a fragment of an address into a pasted
 * terminal log. The cost is that a bare transport failure surfaces as
 * "fetch failed", naming neither the API nor the step it died on. This puts
 * that back without widening what gets printed.
 *
 * @param what The step, e.g. "list lookup".
 * @param run The call.
 * @returns Whatever the call returns.
 */
async function mailchimpStep<T>(what: string, run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (err) {
    throw new Error(`Mailchimp ${what} failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Resolves the audience to pull, and verifies it exists on the account.
 *
 * The id is never trusted on its own. `MAILCHIMP_LIST_ID` is a constant in a
 * `.env` that outlives the account it was copied from, and Mailchimp answers a
 * request for an unknown list with a 404 but a request for *another* list of
 * the same account with data — so pulling the wrong audience is silent, and it
 * would write real people's decisions in under the wrong provenance. Checking
 * against `GET /lists` costs one request and makes that failure loud.
 *
 * @param explicit The `--list-id` argument, if given.
 * @returns The matching audience.
 */
async function resolveMailchimpList(explicit: string | undefined): Promise<MailchimpList> {
  const lists = await mailchimpStep("audience lookup (GET /lists)", getLists);
  if (lists.length === 0) {
    console.error("Error: this Mailchimp account has no audiences. Nothing to pull.");
    process.exit(1);
  }

  const configured = process.env.MAILCHIMP_LIST_ID?.trim();
  // The sole-audience fallback exists because She Sharp has exactly one (`She#`)
  // and a fresh checkout should not need an env var to do the safe thing. It
  // only applies when there is no ambiguity to resolve.
  const wanted = explicit?.trim() || configured || (lists.length === 1 ? lists[0].id : undefined);

  if (!wanted) {
    console.error(
      `Error: the account has ${lists.length} audiences and none was chosen. ` +
        "Pass --list-id, or set MAILCHIMP_LIST_ID.\n" +
        `  Audiences: ${lists.map((list) => `${list.id} (${list.name})`).join(", ")}`
    );
    process.exit(1);
  }

  const match = lists.find((list) => list.id === wanted);
  if (!match) {
    console.error(
      `Error: audience ${JSON.stringify(wanted)} is not on this Mailchimp account.\n` +
        `  The account returned: ${lists.map((list) => `${list.id} (${list.name})`).join(", ")}\n` +
        "  Refusing to run rather than pull an audience nobody asked for."
    );
    process.exit(1);
  }
  return match;
}

/** One member's decision, reduced to what the register stores. */
interface MailchimpDecision {
  hash: string;
  reason: string;
  /** The member's own `last_changed`, ISO. */
  at: string;
}

/**
 * Folds Mailchimp's own unsubscribe and cleaned records into the register.
 *
 * **The hole this closes.** The newsletter left Mailchimp on 2026-08-31, but the
 * Mailchimp account did not close with it — it still sends event campaigns and
 * still serves its own unsubscribe links, and Resend holds no contact list at
 * all. So a person who unsubscribes over there exists only in Mailchimp's
 * record. `normalize-recipients.ts` consults this register on every import, and
 * until that unsubscribe is in it, the next import of any list containing them
 * puts them straight back — the exact trap
 * `.claude/skills/update-mailing-list/references/consent-rules.md` describes,
 * and the reason the register exists at all. Before this command the only way
 * to learn about it was a manual CSV export, which is to say: nobody did it.
 *
 * `sync` is the same idea for the Resend webhook's `email_optouts` table; the
 * two are siblings and should be run together.
 *
 * The same two constraints as `add-file` hold, and matter more here because
 * the input is live: **no address is ever printed** — not on success, not on
 * error — and **no address is ever written**. Only `hashEmail()` output
 * reaches disk. `unsubscribe_reason` is fetched but never printed either: it
 * is free text the member typed and can contain anything, including their own
 * address or somebody else's.
 *
 * @param listIdArg `--list-id`, overriding MAILCHIMP_LIST_ID.
 * @param since `--since`, an explicit ISO window start.
 * @param full `--full`, dropping the cursor entirely — for the first run.
 * @param dryRun Report what would be added and write nothing.
 */
async function commandPullMailchimp(
  listIdArg: string | undefined,
  since: string | undefined,
  full: boolean,
  dryRun: boolean
): Promise<void> {
  // Loaded here rather than at module scope: `normalize-recipients.ts` imports
  // this file as a library, and a library should not read `.env` as a side
  // effect of being imported. `sync` gets the same thing for free because
  // `lib/db/drizzle.ts` calls `dotenv.config()` itself.
  await import("dotenv/config");

  if (since && full) {
    console.error("Error: --since and --full are alternatives; pass one or neither.");
    process.exit(1);
  }
  if (since && Number.isNaN(Date.parse(since))) {
    console.error(`Error: --since ${JSON.stringify(since)} is not a date. Use ISO 8601, e.g. 2026-08-01.`);
    process.exit(1);
  }

  // Checked before the first request so a machine without the key gets one
  // clear sentence instead of an API error phrased for a different problem.
  if (!process.env.MAILCHIMP_API_KEY?.trim()) {
    console.error(
      "Error: MAILCHIMP_API_KEY is not set, so there is nothing to pull from.\n" +
        "  Add it to .env (Mailchimp → Account → Extras → API keys). The key ends\n" +
        "  in its data-centre suffix, e.g. …-us3, which IS the hostname; keep it.\n" +
        "  Every other suppression subcommand works without it."
    );
    process.exit(1);
  }

  const file = readSuppressionFile();
  const watermark = mailchimpWatermark(file);
  const sinceLastChanged = full ? undefined : (since ?? watermark);

  if (!full && !sinceLastChanged) {
    console.error(
      "Error: no Mailchimp entry on file to resume from, so there is no window.\n" +
        "  Run with --full for the first pull, or give an explicit --since."
    );
    process.exit(1);
  }

  const list = await resolveMailchimpList(listIdArg);
  console.log(`Audience ${list.id} (${list.name})`);
  console.log(
    `  Mailchimp reports ${list.memberCount} subscribed, ` +
      `${list.unsubscribeCount} unsubscribed, ${list.cleanedCount} cleaned.`
  );
  if (full) {
    console.log("  Window: none (--full) — every unsubscribed and cleaned member.");
  } else {
    const source = since ? "--since" : `watermark (newest ${MAILCHIMP_REASON_PREFIX}* entry, less ${MAILCHIMP_WATERMARK_OVERLAP_DAYS}d)`;
    console.log(`  Window: last_changed >= ${sinceLastChanged}  [${source}]`);
  }

  const pulls: { status: string; reason: string }[] = [
    { status: "unsubscribed", reason: MAILCHIMP_UNSUBSCRIBED_REASON },
    { status: "cleaned", reason: MAILCHIMP_CLEANED_REASON },
  ];

  const decisions: MailchimpDecision[] = [];
  let blank = 0;
  let malformed = 0;
  let ownMailbox = 0;
  let undated = 0;
  const runAt = new Date().toISOString();

  for (const pull of pulls) {
    const members = await mailchimpStep(`${pull.status} member pull`, () =>
      listMembers(list.id, {
        status: pull.status,
        ...(sinceLastChanged ? { sinceLastChanged } : {}),
        fields: MAILCHIMP_PULL_FIELDS,
      })
    );
    console.log(`  ${members.length} ${pull.status} member(s) in window`);

    for (const member of members) {
      const address = member.emailAddress.trim();
      if (!address) {
        blank++;
        continue;
      }
      if (!looksLikeEmail(address)) {
        malformed++;
        continue;
      }
      const hash = hashEmail(address).toLowerCase();
      // She Sharp's own mailboxes never enter a committed do-not-contact list —
      // see OWN_MAILBOX_HASHES. Several of them are on the audience and several
      // hard-bounce, so Mailchimp has them `cleaned`.
      if (OWN_MAILBOX_HASHES.has(hash)) {
        ownMailbox++;
        continue;
      }
      // `at` is the member's OWN last_changed, not now: the register's `at`
      // means "when the decision was made", which is what `sync` records with
      // `row.createdAt` and what makes the watermark above a real cursor.
      // Stamping the run time would make every pull look like a fresh decision
      // and push the cursor past dates nothing was ever pulled for.
      //
      // Normalised to `Z` because Mailchimp sends `2026-08-20T10:00:00+00:00`
      // and every other writer here uses `toISOString()`; one format in the
      // file keeps `list`'s ten-character date slice honest. A member with no
      // parseable date falls back to the run time — an entry dated today is a
      // small inaccuracy, an entry missing is somebody we email again.
      const parsed = member.lastChanged ? Date.parse(member.lastChanged) : Number.NaN;
      if (Number.isNaN(parsed)) undated++;
      decisions.push({
        hash,
        reason: pull.reason,
        at: Number.isNaN(parsed) ? runAt : new Date(parsed).toISOString(),
      });
    }
  }

  const known = new Set(file.entries.map((entry) => entry.hash.toLowerCase()));
  const seen = new Set<string>();
  const missing: MailchimpDecision[] = [];
  let already = 0;

  for (const decision of decisions) {
    // A member can only hold one status, so a hash seen twice means the two
    // pulls overlapped mid-run; keep the first and do not count it as "already".
    if (seen.has(decision.hash)) continue;
    seen.add(decision.hash);
    if (known.has(decision.hash)) {
      already++;
      continue;
    }
    missing.push(decision);
  }

  console.log("");
  console.log(`  ${seen.size} distinct address(es) considered`);
  if (blank > 0) console.log(`  ${blank} with no address, skipped`);
  if (malformed > 0) console.log(`  ${malformed} not address-shaped, skipped`);
  if (ownMailbox > 0) console.log(`  ${ownMailbox} She Sharp mailbox(es), skipped`);
  if (undated > 0) console.log(`  ${undated} with no usable last_changed, dated as of this run`);
  console.log(`  ${already} already suppressed`);
  console.log(`  ${missing.length} to add`);

  if (missing.length === 0) {
    console.log(`\nAlready in sync. ${file.entries.length} entr(ies) in ${SUPPRESSION_PATH}`);
    return;
  }

  // Truncated hashes and dates only, matching `sync`. A --full run on a fresh
  // register would list thousands, so the listing is capped: it is there to
  // make a small delta reviewable, not to reproduce the file.
  const PREVIEW = 20;
  for (const decision of missing.slice(0, PREVIEW)) {
    console.log(`  + ${decision.hash.slice(0, 12)}…  ${decision.reason}  ${decision.at.slice(0, 10)}`);
  }
  if (missing.length > PREVIEW) console.log(`  … and ${missing.length - PREVIEW} more`);

  if (dryRun) {
    console.log(`\n--dry-run: would add ${missing.length} entr(ies). Nothing written.`);
    return;
  }

  file.entries.push(...missing);
  writeSuppressionFile(file);
  console.log(`\nAdded ${missing.length}. ${file.entries.length} entr(ies) now in ${SUPPRESSION_PATH}`);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const command = argv[0];

  switch (command) {
    case "list":
      commandList();
      return;
    case "add":
      commandAdd(requireEmailArg("add", argv[1]), readReason(argv));
      return;
    case "add-file": {
      const path = argv[1];
      if (!path || path.startsWith("--")) {
        console.error('Error: "add-file" requires a path to a CSV.');
        usage();
        process.exit(1);
      }
      const column = argValue(argv, "--column");
      if (!column) {
        console.error(
          'Error: "add-file" requires --column, naming the header of the address column.\n' +
            "  It is not guessed: picking the wrong column would suppress the wrong people,\n" +
            "  and hashes cannot be read back to find out who."
        );
        process.exit(1);
      }
      commandAddFile(path, column, readReason(argv), argv.includes("--dry-run"));
      return;
    }
    case "remove":
      commandRemove(requireEmailArg("remove", argv[1]));
      return;
    case "check":
      commandCheck(requireEmailArg("check", argv[1]));
      return;
    case "sync":
      await commandSync(argv.includes("--dry-run"));
      return;
    case "reconcile":
      await commandReconcile();
      return;
    case "pull-mailchimp":
      await commandPullMailchimp(
        argValue(argv, "--list-id"),
        argValue(argv, "--since"),
        argv.includes("--full"),
        argv.includes("--dry-run")
      );
      return;
    default:
      console.error(command ? `Unknown command: ${command}` : "Error: no command given.");
      usage();
      process.exit(1);
  }
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
}
