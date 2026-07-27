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
 *   npx tsx scripts/email/suppression.ts remove <email>
 *   npx tsx scripts/email/suppression.ts check <email>
 *
 * Output:
 *   list   — one line per entry: `<hash[0:12]>…  <reason>  <YYYY-MM-DD>`, then a total.
 *   add    — confirms, or reports the address was already suppressed (exit 0 either way).
 *   remove — confirms, or exits 1 if the address was not on the list.
 *   check  — prints SUPPRESSED / not suppressed; exit 0 if suppressed, 1 if not,
 *            so it can be used in a shell conditional.
 *
 * Importable API (used by normalize-recipients.ts):
 *   hashEmail(email)          → lowercase sha256 hex of the normalized address
 *   loadSuppressionHashes()   → Set<string> of every suppressed hash
 */

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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
 * Hashes an email address for suppression lookup.
 *
 * Normalization (trim + lowercase) must match everywhere, or the same address
 * hashes two different ways and the suppression silently stops working.
 *
 * @param email A raw address, as typed or as exported from a ticketing tool.
 * @returns Lowercase sha256 hex digest of the normalized address.
 */
export function hashEmail(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

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
  console.error("  npx tsx scripts/email/suppression.ts remove <email>");
  console.error("  npx tsx scripts/email/suppression.ts check <email>");
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

function main(): void {
  const argv = process.argv.slice(2);
  const command = argv[0];

  switch (command) {
    case "list":
      commandList();
      return;
    case "add":
      commandAdd(requireEmailArg("add", argv[1]), readReason(argv));
      return;
    case "remove":
      commandRemove(requireEmailArg("remove", argv[1]));
      return;
    case "check":
      commandCheck(requireEmailArg("check", argv[1]));
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
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}
