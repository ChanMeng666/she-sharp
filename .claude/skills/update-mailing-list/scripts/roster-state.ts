/**
 * A local run log of every mailing-list import this skill has performed.
 *
 * READ THIS FIRST: **the `newsletter_subscribers` table is the source of truth
 * for who is subscribed.** This file is not. It cannot tell you whether someone
 * is on the list, whether they unsubscribed yesterday, or whether an import
 * actually succeeded — only the database can, through
 * `npx tsx scripts/email/inspect-subscribers.ts`. (It used to say Resend was the
 * source of truth. That was true until the list moved in-house; a run log that
 * names the wrong system is worse than one that names none.) What it does is
 * remember which FILES have already
 * been pushed, so the same attendee export cannot be imported twice by two
 * different people a fortnight apart.
 *
 * That single job is why the record is keyed by `fileSha256`. Names drift
 * ("attendees.csv", "attendees (1).csv", "final-attendees.csv") and counts
 * repeat, but a byte-identical file is unambiguously the same file. If the
 * digest matches an entry here, the import already happened — short-circuit and
 * tell the user, rather than re-running an operation Resend has no batch undo
 * for.
 *
 * It also records the consent statement that justified each import. Months
 * later, when someone asks "why is this person on our list?", the answer has to
 * exist somewhere a human can read. Resend stores the contact; it does not
 * store why.
 *
 * Usage:
 *   npx tsx .claude/skills/update-mailing-list/scripts/roster-state.ts show [--json]
 *   npx tsx .claude/skills/update-mailing-list/scripts/roster-state.ts record \
 *     --key <k> --import-id <id> --file-sha256 <sha> --count <n> \
 *     --segment <name> --consent "…" --digest "…"
 *   npx tsx .claude/skills/update-mailing-list/scripts/roster-state.ts sha256 <file>
 *
 * Commands:
 *   show     Print every recorded import, newest first. `--json` for the raw file.
 *   record   Add or replace the entry for `--key`. All flags except `--digest`
 *            are required; re-recording the same key overwrites it (an import
 *            that was retried should read as one entry, not two).
 *   sha256   Print the sha256 of a file — the value to pass to `--file-sha256`,
 *            and the value to compare against `show` before importing.
 *
 * State file: `state/roster.json`, resolved from this script's own location so
 * it is stable no matter which directory the command is run from. Committed to
 * git: it holds no addresses, only counts, ids and prose.
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
/** …/.claude/skills/update-mailing-list */
export const SKILL_ROOT = resolve(SCRIPT_DIR, "..");
export const STATE_PATH = resolve(SKILL_ROOT, "state", "roster.json");

// ---------------------------------------------------------------------------
// Shapes
// ---------------------------------------------------------------------------

export interface ImportRecord {
  /** The `contact_import` id Resend returned — look it up with `imports get`. */
  importId: string;
  /** sha256 of the source CSV, the key used to detect a repeat import. */
  fileSha256: string;
  /** How many contacts this run intended to add. */
  count: number;
  /** Segment name the contacts were added to, as a human would say it. */
  segment: string;
  /** Where and when the opt-in was collected, in plain English. */
  consent: string;
  /** ISO timestamp the record was written. */
  at: string;
  /** A few sentences on what this import was and anything left open. */
  digest: string;
}

export interface RosterState {
  version: number;
  /** ISO timestamp of the most recent `record`, or null if never run. */
  lastRunAt: string | null;
  /** key → the one record for that key. */
  imports: Record<string, ImportRecord>;
}

const EMPTY_STATE: RosterState = { version: 1, lastRunAt: null, imports: {} };

// ---------------------------------------------------------------------------
// Load / save
// ---------------------------------------------------------------------------

/**
 * Reads the state file.
 *
 * @returns The parsed state, or an empty skeleton when the file is absent.
 * @throws Error when the file exists but is not the expected shape — a
 *   corrupted log must not be silently replaced with an empty one, or the
 *   duplicate-import guard quietly stops working.
 */
export function loadState(): RosterState {
  if (!existsSync(STATE_PATH)) return structuredClone(EMPTY_STATE);

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(STATE_PATH, "utf8"));
  } catch (error) {
    throw new Error(
      `${STATE_PATH} is not valid JSON: ${error instanceof Error ? error.message : String(error)}. ` +
        "Restore it from git rather than deleting it — it is the duplicate-import guard."
    );
  }

  if (typeof parsed !== "object" || parsed === null || typeof (parsed as RosterState).imports !== "object") {
    throw new Error(
      `${STATE_PATH} must be an object with an "imports" map. ` +
        'Reset it to {"version":1,"lastRunAt":null,"imports":{}} only if you accept losing the log.'
    );
  }

  const state = parsed as RosterState;
  return {
    version: typeof state.version === "number" ? state.version : 1,
    lastRunAt: typeof state.lastRunAt === "string" ? state.lastRunAt : null,
    imports: state.imports ?? {},
  };
}

/**
 * Writes the state deterministically and atomically.
 *
 * Keys are sorted and fields emitted in a fixed order so a re-record produces a
 * minimal git diff; the temp-file rename means a crash mid-write cannot leave a
 * half-parsed log behind.
 *
 * @param state The state to persist.
 */
export function saveState(state: RosterState): void {
  mkdirSync(dirname(STATE_PATH), { recursive: true });

  const ordered: RosterState = {
    version: state.version ?? 1,
    lastRunAt: state.lastRunAt,
    imports: {},
  };
  for (const key of Object.keys(state.imports).sort()) {
    const record = state.imports[key];
    ordered.imports[key] = {
      importId: record.importId,
      fileSha256: record.fileSha256,
      count: record.count,
      segment: record.segment,
      consent: record.consent,
      at: record.at,
      digest: record.digest,
    };
  }

  const tmp = `${STATE_PATH}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(ordered, null, 2)}\n`, "utf8");
  renameSync(tmp, STATE_PATH);
}

/**
 * Finds a previous import of the same bytes.
 *
 * @param state The loaded state.
 * @param sha256 Digest of the CSV about to be imported.
 * @returns The matching key and record, or null when this file is new.
 */
export function findByHash(
  state: RosterState,
  sha256: string
): { key: string; record: ImportRecord } | null {
  for (const [key, record] of Object.entries(state.imports)) {
    if (record.fileSha256.toLowerCase() === sha256.toLowerCase()) return { key, record };
  }
  return null;
}

/** Hashes a file's bytes — the same digest `record --file-sha256` expects. */
export function hashFile(path: string): string {
  return createHash("sha256").update(readFileSync(resolve(path))).digest("hex");
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function fail(message: string, ...details: string[]): never {
  console.error(`Error: ${message}`);
  for (const line of details) console.error(line);
  process.exit(1);
}

function usage(): void {
  console.error("Usage:");
  console.error("  roster-state.ts show [--json]");
  console.error(
    "  roster-state.ts record --key <k> --import-id <id> --file-sha256 <sha> \\"
  );
  console.error('       --count <n> --segment <name> --consent "…" [--digest "…"]');
  console.error("  roster-state.ts sha256 <file>");
}

/** Reads `--flag value`, erroring if the value is missing or is another flag. */
function readOption(argv: string[], flag: string): string | null {
  const index = argv.indexOf(flag);
  if (index === -1) return null;
  const value = argv[index + 1];
  if (value === undefined || value.startsWith("--")) fail(`${flag} requires a value.`);
  return value;
}

/** Reads a required `--flag value`. */
function requireOption(argv: string[], flag: string): string {
  const value = readOption(argv, flag);
  if (value === null) {
    fail(`${flag} is required.`);
  }
  return value;
}

function commandShow(argv: string[]): void {
  const state = loadState();

  if (argv.includes("--json")) {
    console.log(JSON.stringify(state, null, 2));
    return;
  }

  const entries = Object.entries(state.imports).sort((a, b) => b[1].at.localeCompare(a[1].at));

  console.log("");
  console.log("Mailing-list import log");
  console.log("===================================");
  console.log(`  File           ${STATE_PATH}`);
  console.log(`  Last run       ${state.lastRunAt ?? "never"}`);
  console.log(`  Imports        ${entries.length}`);
  console.log("===================================");

  if (entries.length === 0) {
    console.log("");
    console.log("  No import has been recorded yet.");
    console.log("  Remember: this log is NOT the subscriber list. For who is actually");
    console.log("  subscribed right now, run `npx tsx scripts/email/inspect-subscribers.ts`.");
    console.log("");
    return;
  }

  for (const [key, record] of entries) {
    console.log("");
    console.log(`${key}`);
    console.log(`  import id      ${record.importId}`);
    console.log(`  file sha256    ${record.fileSha256}`);
    console.log(`  contacts       ${record.count}`);
    console.log(`  segment        ${record.segment}`);
    console.log(`  consent        ${record.consent}`);
    console.log(`  recorded at    ${record.at}`);
    if (record.digest) console.log(`  digest         ${record.digest}`);
  }

  console.log("");
  console.log("This is a run log, not the roster. The newsletter_subscribers table is the source of truth.");
  console.log("");
}

function commandRecord(argv: string[]): void {
  const key = requireOption(argv, "--key");
  if (!/^[a-z0-9][a-z0-9-]*$/.test(key)) {
    fail(`--key "${key}" must be kebab-case (lowercase letters, digits, hyphens).`);
  }

  const countRaw = requireOption(argv, "--count");
  const count = Number(countRaw);
  if (!Number.isInteger(count) || count < 0) {
    fail(`--count must be a non-negative integer (got "${countRaw}").`);
  }

  const fileSha256 = requireOption(argv, "--file-sha256");
  if (!/^[0-9a-f]{64}$/i.test(fileSha256)) {
    fail(
      `--file-sha256 must be a 64-character hex digest (got "${fileSha256}").`,
      "Get it with: roster-state.ts sha256 <the CSV you imported>"
    );
  }

  const state = loadState();

  const clash = findByHash(state, fileSha256);
  if (clash && clash.key !== key) {
    console.log(
      `Note: the same file was already recorded under key "${clash.key}" ` +
        `(import ${clash.record.importId}, ${clash.record.at}).`
    );
    console.log("Recording it again under a new key — confirm this was a deliberate re-import.");
  }

  const now = new Date().toISOString();
  state.imports[key] = {
    importId: requireOption(argv, "--import-id"),
    fileSha256: fileSha256.toLowerCase(),
    count,
    segment: requireOption(argv, "--segment"),
    consent: requireOption(argv, "--consent"),
    at: now,
    digest: readOption(argv, "--digest") ?? "",
  };
  state.lastRunAt = now;
  saveState(state);

  console.log(`Recorded "${key}" — ${count} contact(s) into ${state.imports[key].segment}.`);
  console.log(`${Object.keys(state.imports).length} import(s) now logged in ${STATE_PATH}`);
  console.log("Commit this file alongside any suppression-list change.");
}

function commandSha256(argv: string[]): void {
  const path = argv[1];
  if (!path || path.startsWith("--")) fail("sha256 requires a file path.");
  try {
    const digest = hashFile(path);
    console.log(digest);

    const previous = findByHash(loadState(), digest);
    if (previous) {
      console.log("");
      console.log(
        `WARNING: these exact bytes were already imported as "${previous.key}" ` +
          `(import ${previous.record.importId}, ${previous.record.at}).`
      );
      console.log("Importing again would re-run an operation with no batch undo. Stop and check.");
    }
  } catch (error) {
    fail(`could not read ${path}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function main(): void {
  const argv = process.argv.slice(2);
  const command = argv[0];

  switch (command) {
    case "show":
      commandShow(argv);
      return;
    case "record":
      commandRecord(argv);
      return;
    case "sha256":
      commandSha256(argv);
      return;
    default:
      console.error(command ? `Unknown command: ${command}` : "Error: no command given.");
      usage();
      process.exit(1);
  }
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
