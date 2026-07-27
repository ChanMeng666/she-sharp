/**
 * Turns an arbitrary ticketing/registration CSV export into the one recipient
 * shape every She Sharp sending script understands.
 *
 * This script exists so that a non-technical colleague NEVER has to hand-edit a
 * CSV. Humanitix, Eventbrite and Google Forms all export different column
 * names, in different orders, with refunded orders and duplicate addresses
 * mixed in. Hand-cleaning that in Excel is how people get emailed twice, how
 * refunded attendees get event instructions, and how a suppressed address comes
 * back from the dead. So: point this at the raw download and it explains what
 * it found, in plain English, before it writes anything.
 *
 * Two modes:
 *   1. Without `--map` it only DETECTS. It prints which column it believes is
 *      the email, the first name, the order status and the marketing opt-in,
 *      with a count of how many rows look valid for each, and asks for
 *      confirmation. No file is written.
 *   2. With `--map` it NORMALIZES: lowercases emails, drops refunded/cancelled
 *      orders, drops duplicates (keeping the first), quarantines malformed
 *      addresses, removes anyone on the hashed suppression list, and writes
 *      `<out-dir>/recipients-<key>.json`.
 *
 * `--for-import` is the stricter mode used when the addresses are destined for
 * the mailing list rather than a one-off fulfilment send: it refuses to run
 * without a recorded consent source and date, and drops every row that did not
 * tick the marketing opt-in.
 *
 * Usage:
 *   npx tsx scripts/email/normalize-recipients.ts <input.csv> --key <k> \
 *     [--map email=<col>,firstName=<col>,lastName=<col>,status=<col>,optIn=<col>] \
 *     [--for-import] [--consent-source "..."] [--consent-date YYYY-MM-DD] \
 *     [--tier 0|1|2|3] [--out-dir tmp/emails] [--json] [--self-test]
 *
 * Flags:
 *   <input.csv>        Path to the raw export (quoted fields and embedded
 *                      commas/newlines are handled).
 *   --key              kebab-case identifier for this list, e.g. "aut-jul-2026".
 *                      Names the output file: recipients-<key>.json.
 *   --map              Confirms the column mapping and switches on writing.
 *                      Comma-separated `field=Column Name` pairs; may be
 *                      repeated. Column names containing commas are fine — the
 *                      split only happens before a known field name.
 *   --for-import       Mailing-list import mode (see above).
 *   --consent-source   Where the opt-in came from, e.g. "Humanitix checkout
 *                      question, AUT July 2026". Required by --for-import.
 *   --consent-date     ISO date the opt-in was collected. Required by --for-import.
 *   --tier             Audience tier recorded in the output (default 2).
 *   --out-dir          Output directory (default tmp/emails).
 *   --json             Print a machine-readable summary instead of prose.
 *   --self-test        Run the CSV parser's built-in assertions and exit.
 *
 * Output (--map mode), written to <out-dir>/recipients-<key>.json:
 *   { key, source, tier, consentSource, consentDate, detected, nameSplitFrom,
 *     recipients: [{ email, firstName, lastName, fields }],
 *     excluded:   [{ email, row, reason }],
 *     duplicates: [{ email, rows }],
 *     malformed:  [{ row, raw, reason }],
 *     counts: { rows, recipients, excluded, duplicates, malformed } }
 *
 * Row numbers in the output are spreadsheet row numbers: the header is row 1,
 * so the first data row is row 2 — the number a colleague can type into Excel.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { hashEmail, loadSuppressionHashes } from "./suppression";
import type { AudienceTier } from "../../lib/email/audience";
import { describeTier } from "../../lib/email/audience";

// ---------------------------------------------------------------------------
// CSV parsing (RFC 4180-ish, hand-rolled — no third-party dependency)
// ---------------------------------------------------------------------------

interface CsvRecord {
  /** 1-based physical line the record starts on (header included). */
  line: number;
  /** The record's exact source text, for error messages. */
  raw: string;
  cells: string[];
}

/**
 * Parses CSV text into records.
 *
 * Handles quoted fields, doubled quotes (`""` → `"`), commas and newlines
 * inside quotes, CRLF line endings, a UTF-8 BOM, and a missing final newline.
 * Blank lines are skipped.
 *
 * @param input Raw file contents.
 * @returns One record per non-blank line, header first.
 */
export function parseCsv(input: string): CsvRecord[] {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  const records: CsvRecord[] = [];

  let cells: string[] = [];
  let field = "";
  let inQuotes = false;
  let index = 0;
  let line = 1;
  let recordLine = 1;
  let recordStart = 0;

  const endRecord = (endIndex: number, nextStart: number): void => {
    cells.push(field);
    field = "";
    const isBlank = cells.length === 1 && cells[0].trim().length === 0;
    if (!isBlank) {
      records.push({
        line: recordLine,
        raw: text.slice(recordStart, endIndex),
        cells: cells.map((cell) => cell.trim()),
      });
    }
    cells = [];
    recordStart = nextStart;
    recordLine = line;
  };

  while (index < text.length) {
    const char = text[index];

    if (inQuotes) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 2;
          continue;
        }
        inQuotes = false;
        index += 1;
        continue;
      }
      if (char === "\n") line += 1;
      field += char;
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      index += 1;
      continue;
    }
    if (char === ",") {
      cells.push(field);
      field = "";
      index += 1;
      continue;
    }
    if (char === "\r") {
      index += 1;
      continue;
    }
    if (char === "\n") {
      line += 1;
      endRecord(index, index + 1);
      index += 1;
      continue;
    }

    field += char;
    index += 1;
  }

  if (field.length > 0 || cells.length > 0) {
    endRecord(text.length, text.length);
  }

  return records;
}

/** Parser assertions — run with `--self-test`. */
function selfTest(): void {
  const checks: { name: string; got: unknown; want: unknown }[] = [];
  const cellsOf = (raw: string): string[][] => parseCsv(raw).map((r) => r.cells);

  checks.push({
    name: "plain rows",
    got: cellsOf("a,b\n1,2"),
    want: [
      ["a", "b"],
      ["1", "2"],
    ],
  });
  checks.push({
    name: "comma inside quotes",
    got: cellsOf('a,b\n"x, y",2'),
    want: [
      ["a", "b"],
      ["x, y", "2"],
    ],
  });
  checks.push({
    name: "doubled quotes",
    got: cellsOf('a\n"he said ""hi"""'),
    want: [["a"], ['he said "hi"']],
  });
  checks.push({
    name: "newline inside quotes",
    got: cellsOf('a,b\n"line1\nline2",2'),
    want: [
      ["a", "b"],
      ["line1\nline2", "2"],
    ],
  });
  checks.push({
    name: "CRLF endings",
    got: cellsOf("a,b\r\n1,2\r\n"),
    want: [
      ["a", "b"],
      ["1", "2"],
    ],
  });
  checks.push({
    name: "trailing empty field",
    got: cellsOf("a,b,c\n1,2,"),
    want: [
      ["a", "b", "c"],
      ["1", "2", ""],
    ],
  });
  checks.push({ name: "BOM stripped", got: cellsOf("﻿a,b\n1,2")[0], want: ["a", "b"] });
  checks.push({ name: "blank lines skipped", got: cellsOf("a\n\n1\n\n").length, want: 2 });
  checks.push({
    name: "line numbers survive quoted newlines",
    got: parseCsv('a\n"x\ny"\nz').map((r) => r.line),
    want: [1, 2, 4],
  });
  checks.push({ name: "email shape accepted", got: looksLikeEmail("A.B+c@Example.co.nz"), want: true });
  checks.push({ name: "email shape rejected", got: looksLikeEmail("not-an-email"), want: false });
  checks.push({ name: "header normalization", got: compact("Attendee  E-Mail_Address"), want: "attendeeemailaddress" });

  let failed = 0;
  for (const check of checks) {
    const ok = JSON.stringify(check.got) === JSON.stringify(check.want);
    if (!ok) failed += 1;
    console.log(
      `${ok ? "✓" : "✗"} ${check.name}${ok ? "" : `\n    got  ${JSON.stringify(check.got)}\n    want ${JSON.stringify(check.want)}`}`
    );
  }
  console.log("");
  console.log(`${checks.length - failed}/${checks.length} parser self-tests passed.`);
  process.exit(failed === 0 ? 0 : 1);
}

// ---------------------------------------------------------------------------
// Column detection
// ---------------------------------------------------------------------------

type FieldName = "email" | "firstName" | "lastName" | "status" | "optIn";

const FIELD_ORDER: FieldName[] = ["email", "firstName", "lastName", "status", "optIn"];

/** Human labels used in the confirmation prompt. */
const FIELD_LABELS: Record<FieldName, string> = {
  email: "Email",
  firstName: "First name",
  lastName: "Last name",
  status: "Order status",
  optIn: "Marketing opt-in",
};

/** Alphanumeric-only form of a header, so case/space/underscore/hyphen stop mattering. */
function compact(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Header aliases, matched on their compact form. */
const ALIASES: Record<FieldName, string[]> = {
  email: ["email", "attendee email", "buyer email", "e-mail", "email address", "e-mail address"],
  firstName: ["first name", "firstname", "given name", "attendee first name"],
  lastName: ["last name", "lastname", "surname", "family name"],
  status: ["order status", "status", "ticket status", "attendee status"],
  optIn: [],
};

/** Headers that hold a whole name and must be split at the first space. */
const FULL_NAME_ALIASES = ["name", "full name", "attendee name"];

/**
 * Recognises a marketing opt-in column by meaning rather than by exact name,
 * because every form asks the question differently.
 */
function isOptInHeader(header: string): boolean {
  const key = compact(header);
  if (key.includes("subscribe")) return true;
  if (key.includes("canweemail")) return true;
  return key.includes("opt") && (key.includes("in") || key.includes("marketing"));
}

interface Detection {
  /** field → header text, or null when nothing matched. */
  columns: Record<FieldName, string | null>;
  /** Header the first/last name were split out of, when there was no dedicated column. */
  nameSplitFrom: string | null;
}

/**
 * Guesses which header holds which field.
 *
 * @param headers The header row, in file order.
 * @returns The detected columns plus the full-name column it fell back to.
 */
function detectColumns(headers: string[]): Detection {
  const columns: Record<FieldName, string | null> = {
    email: null,
    firstName: null,
    lastName: null,
    status: null,
    optIn: null,
  };

  for (const field of FIELD_ORDER) {
    if (field === "optIn") continue;
    const wanted = new Set(ALIASES[field].map(compact));
    const hit = headers.find((header) => wanted.has(compact(header)));
    columns[field] = hit ?? null;
  }
  columns.optIn = headers.find(isOptInHeader) ?? null;

  let nameSplitFrom: string | null = null;
  if (!columns.firstName) {
    const wanted = new Set(FULL_NAME_ALIASES.map(compact));
    const hit = headers.find((header) => wanted.has(compact(header)));
    if (hit) {
      nameSplitFrom = hit;
      columns.firstName = hit;
      if (!columns.lastName) columns.lastName = hit;
    }
  }

  return { columns, nameSplitFrom };
}

// ---------------------------------------------------------------------------
// Row-level rules
// ---------------------------------------------------------------------------

/** Deliberately loose: catches missing @/TLD without rejecting valid oddities. */
function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(value.trim());
}

/** Order states that mean "this person is not coming and must not be emailed". */
const CANCELLED_STATUS_MARKERS = ["cancel", "refund", "declin", "void"];

/** Values that count as a marketing opt-in. */
const OPT_IN_VALUES = new Set(["yes", "y", "true", "1", "checked", "opted in"]);

/** Normalizes a cell for value comparison (case, punctuation, spacing). */
function normalizeValue(value: string): string {
  return value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

function isCancelledStatus(value: string): boolean {
  const key = normalizeValue(value);
  return CANCELLED_STATUS_MARKERS.some((marker) => key.includes(marker));
}

function isOptedIn(value: string): boolean {
  return OPT_IN_VALUES.has(normalizeValue(value));
}

/** Splits "Ada Lovelace" into first/last at the first space. */
function splitFullName(value: string): { firstName: string; lastName: string } {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (trimmed.length === 0) return { firstName: "", lastName: "" };
  const space = trimmed.indexOf(" ");
  if (space === -1) return { firstName: trimmed, lastName: "" };
  return { firstName: trimmed.slice(0, space), lastName: trimmed.slice(space + 1) };
}

// ---------------------------------------------------------------------------
// Output shape
// ---------------------------------------------------------------------------

interface NormalizedRecipient {
  email: string;
  firstName: string | null;
  lastName: string | null;
  fields: Record<string, string>;
}

interface NormalizedOutput {
  key: string;
  source: string;
  tier: AudienceTier;
  consentSource: string | null;
  consentDate: string | null;
  detected: Record<string, string | null>;
  /** Non-standard extra: the column first/last name were split out of, if any. */
  nameSplitFrom: string | null;
  recipients: NormalizedRecipient[];
  excluded: { email: string | null; row: number; reason: string }[];
  duplicates: { email: string; rows: number[] }[];
  malformed: { row: number; raw: string; reason: string }[];
  counts: {
    rows: number;
    recipients: number;
    excluded: number;
    duplicates: number;
    malformed: number;
  };
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

interface Args {
  input: string;
  key: string;
  map: Partial<Record<FieldName, string>> | null;
  forImport: boolean;
  consentSource: string | null;
  consentDate: string | null;
  tier: AudienceTier;
  outDir: string;
  json: boolean;
}

function fail(message: string, ...details: string[]): never {
  console.error(`Error: ${message}`);
  for (const line of details) console.error(line);
  process.exit(1);
}

/** Reads `--flag value`, erroring if the value is missing or is another flag. */
function readOption(argv: string[], flag: string): string | null {
  const index = argv.indexOf(flag);
  if (index === -1) return null;
  const value = argv[index + 1];
  if (value === undefined || value.startsWith("--")) {
    fail(`${flag} requires a value.`);
  }
  return value;
}

/** Collects every occurrence of a repeatable `--flag value`. */
function readAllOptions(argv: string[], flag: string): string[] {
  const values: string[] = [];
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] !== flag) continue;
    const value = argv[index + 1];
    if (value === undefined || value.startsWith("--")) fail(`${flag} requires a value.`);
    values.push(value);
  }
  return values;
}

/**
 * Parses `email=Attendee Email,firstName=Given Name` into a field map.
 *
 * The split only fires immediately before a known field name, so a column
 * called "Can we email you, ever?" survives with its comma intact.
 */
function parseMap(raw: string[]): Partial<Record<FieldName, string>> {
  const map: Partial<Record<FieldName, string>> = {};
  const splitter = /,(?=\s*(?:email|firstName|lastName|status|optIn)\s*=)/;

  for (const chunk of raw) {
    for (const pair of chunk.split(splitter)) {
      const eq = pair.indexOf("=");
      if (eq === -1) {
        fail(
          `--map entry "${pair.trim()}" is not field=column.`,
          "Example: --map email=Attendee Email,firstName=Given Name"
        );
      }
      const field = pair.slice(0, eq).trim() as FieldName;
      const column = pair.slice(eq + 1).trim();
      if (!FIELD_ORDER.includes(field)) {
        fail(
          `--map has unknown field "${field}".`,
          `Known fields: ${FIELD_ORDER.join(", ")}`
        );
      }
      if (column.length === 0) fail(`--map entry for "${field}" has no column name.`);
      map[field] = column;
    }
  }
  return map;
}

/** Flags that consume the next argv entry — everything else is positional. */
const VALUE_FLAGS = new Set([
  "--key",
  "--map",
  "--consent-source",
  "--consent-date",
  "--tier",
  "--out-dir",
]);

function parseArgs(argv: string[]): Args {
  const positional: string[] = [];
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (VALUE_FLAGS.has(arg)) {
      index += 1;
      continue;
    }
    if (arg.startsWith("--")) continue;
    positional.push(arg);
  }

  const input = positional[0];
  if (!input) {
    fail(
      "no input CSV given.",
      "Usage: npx tsx scripts/email/normalize-recipients.ts <input.csv> --key <k> [--map …]"
    );
  }

  const key = readOption(argv, "--key");
  if (!key) fail("--key is required (kebab-case, e.g. --key aut-jul-2026).");
  if (!/^[a-z0-9][a-z0-9-]*$/.test(key)) {
    fail(`--key "${key}" must be kebab-case (lowercase letters, digits, hyphens).`);
  }

  const mapRaw = readAllOptions(argv, "--map");
  const map = mapRaw.length > 0 ? parseMap(mapRaw) : null;

  const tierRaw = readOption(argv, "--tier");
  let tier: AudienceTier = 2;
  if (tierRaw !== null) {
    if (!["0", "1", "2", "3"].includes(tierRaw)) fail(`--tier must be 0, 1, 2 or 3 (got "${tierRaw}").`);
    tier = Number(tierRaw) as AudienceTier;
  }

  const consentDate = readOption(argv, "--consent-date");
  if (consentDate !== null && !/^\d{4}-\d{2}-\d{2}$/.test(consentDate)) {
    fail(`--consent-date must be YYYY-MM-DD (got "${consentDate}").`);
  }

  return {
    input,
    key,
    map,
    forImport: argv.includes("--for-import"),
    consentSource: readOption(argv, "--consent-source"),
    consentDate,
    tier,
    outDir: readOption(argv, "--out-dir") ?? "tmp/emails",
    json: argv.includes("--json"),
  };
}

// ---------------------------------------------------------------------------
// Detection report (mode A)
// ---------------------------------------------------------------------------

/** Column widths of the confirmation block, chosen so the parentheses line up. */
const LABEL_WIDTH = 17;
const COLUMN_WIDTH = 29;

/** Formats `81 completed, 3 refunded → will exclude` from a status column. */
function describeStatusColumn(values: string[]): string {
  const counts = new Map<string, number>();
  for (const value of values) {
    const key = value.trim() || "(blank)";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const entries = [...counts.entries()].map(([value, count]) => ({
    value,
    count,
    excluded: isCancelledStatus(value),
  }));
  entries.sort((a, b) => {
    if (a.excluded !== b.excluded) return a.excluded ? 1 : -1;
    return b.count - a.count;
  });
  const body = entries.map((entry) => `${entry.count} ${entry.value.toLowerCase()}`).join(", ");
  return entries.some((entry) => entry.excluded) ? `${body} → will exclude` : body;
}

/** One aligned `Label ← column "X"  (detail)` line. */
function detectionLine(label: string, column: string, detail: string): string {
  return `  ${label.padEnd(LABEL_WIDTH)}← ${`column "${column}"`.padEnd(COLUMN_WIDTH)}  (${detail})`;
}

/**
 * Prints the plain-English confirmation block and stops.
 *
 * The wording is load-bearing: the email skills quote it back to the user and
 * wait for a "yes" before re-running with `--map`.
 */
function reportDetection(
  args: Args,
  sourcePath: string,
  headers: string[],
  rows: CsvRecord[],
  detection: Detection
): void {
  const { columns, nameSplitFrom } = detection;
  const valuesOf = (column: string): string[] => {
    const index = headers.indexOf(column);
    return rows.map((row) => row.cells[index] ?? "");
  };

  const total = rows.length;
  const lines: string[] = [];

  if (columns.email) {
    const valid = valuesOf(columns.email).filter(looksLikeEmail).length;
    lines.push(detectionLine(FIELD_LABELS.email, columns.email, `${valid}/${total} look like emails`));
  }
  if (columns.firstName) {
    const values = valuesOf(columns.firstName);
    const filled = values.filter((value) => value.trim().length > 0).length;
    const suffix = nameSplitFrom ? ` — split from "${nameSplitFrom}" at the first space` : "";
    lines.push(detectionLine(FIELD_LABELS.firstName, columns.firstName, `${filled}/${total} filled${suffix}`));
  }
  if (columns.lastName && columns.lastName !== nameSplitFrom) {
    const filled = valuesOf(columns.lastName).filter((value) => value.trim().length > 0).length;
    lines.push(detectionLine(FIELD_LABELS.lastName, columns.lastName, `${filled}/${total} filled`));
  }
  if (columns.status) {
    lines.push(detectionLine(FIELD_LABELS.status, columns.status, describeStatusColumn(valuesOf(columns.status))));
  }
  if (columns.optIn) {
    const yes = valuesOf(columns.optIn).filter(isOptedIn).length;
    lines.push(detectionLine(FIELD_LABELS.optIn, columns.optIn, `${yes} yes`));
  }

  const missing = FIELD_ORDER.filter((field) => !columns[field]).map((field) => FIELD_LABELS[field].toLowerCase());

  if (args.json) {
    console.log(
      JSON.stringify(
        {
          mode: "detect",
          source: sourcePath,
          rows: total,
          headers,
          detected: columns,
          nameSplitFrom,
          missing,
        },
        null,
        2
      )
    );
    return;
  }

  console.log(`I read ${sourcePath} — ${total} rows. I think:`);
  for (const line of lines) console.log(line);
  if (missing.length > 0) console.log(`  Not detected: ${missing.join(", ")}`);
  console.log('Is that right? Reply "yes", or tell me which one is wrong.');

  const mapArg = FIELD_ORDER.filter((field) => columns[field])
    .map((field) => `${field}=${columns[field]}`)
    .join(",");
  console.log("");
  console.log("Once confirmed, re-run with the mapping to write the recipient file:");
  console.log(
    `  npx tsx scripts/email/normalize-recipients.ts "${args.input}" --key ${args.key} --map "${mapArg}"`
  );
}

// ---------------------------------------------------------------------------
// Normalization (mode B)
// ---------------------------------------------------------------------------

/** Resolves a mapped column name against the real headers, tolerating spacing/case. */
function resolveColumn(headers: string[], wanted: string): string | null {
  const exact = headers.find((header) => header === wanted);
  if (exact) return exact;
  const loose = headers.find((header) => compact(header) === compact(wanted));
  return loose ?? null;
}

function normalize(
  args: Args,
  sourcePath: string,
  headers: string[],
  rows: CsvRecord[],
  map: Partial<Record<FieldName, string>>
): NormalizedOutput {
  const resolved: Record<FieldName, string | null> = {
    email: null,
    firstName: null,
    lastName: null,
    status: null,
    optIn: null,
  };

  for (const field of FIELD_ORDER) {
    const wanted = map[field];
    if (!wanted) continue;
    const column = resolveColumn(headers, wanted);
    if (!column) {
      fail(
        `--map ${field}="${wanted}" does not match any column in the CSV.`,
        "Columns present:",
        ...headers.map((header) => `  - ${header}`)
      );
    }
    resolved[field] = column;
  }

  if (!resolved.email) {
    fail(
      "--map must include an email column, e.g. --map email=Attendee Email",
      "Nothing can be sent without one."
    );
  }

  // A mapped first-name column that actually holds a whole name gets split, so
  // "Hi Ada Lovelace," never reaches an inbox.
  const nameSplitFrom =
    resolved.firstName && FULL_NAME_ALIASES.map(compact).includes(compact(resolved.firstName))
      ? resolved.firstName
      : null;

  const indexOf = (column: string | null): number => (column ? headers.indexOf(column) : -1);
  const emailIndex = indexOf(resolved.email);
  const firstNameIndex = indexOf(resolved.firstName);
  const lastNameIndex = indexOf(resolved.lastName);
  const statusIndex = indexOf(resolved.status);
  const optInIndex = indexOf(resolved.optIn);

  const suppressed = loadSuppressionHashes();

  const recipients: NormalizedRecipient[] = [];
  const excluded: { email: string | null; row: number; reason: string }[] = [];
  const malformed: { row: number; raw: string; reason: string }[] = [];
  const seen = new Map<string, number[]>();

  rows.forEach((record, offset) => {
    // Spreadsheet row number: header is row 1, so data starts at 2.
    const rowNumber = offset + 2;
    const cell = (index: number): string => (index === -1 ? "" : record.cells[index] ?? "");

    const rawEmail = cell(emailIndex);
    if (rawEmail.trim().length === 0) {
      malformed.push({ row: rowNumber, raw: record.raw, reason: "email cell is empty" });
      return;
    }
    if (!looksLikeEmail(rawEmail)) {
      malformed.push({
        row: rowNumber,
        raw: record.raw,
        reason: `"${rawEmail}" is not a valid email address`,
      });
      return;
    }
    const email = rawEmail.trim().toLowerCase();

    const status = cell(statusIndex);
    if (statusIndex !== -1 && isCancelledStatus(status)) {
      excluded.push({ email, row: rowNumber, reason: `order status "${status.trim()}"` });
      return;
    }

    if (args.forImport && optInIndex !== -1 && !isOptedIn(cell(optInIndex))) {
      excluded.push({ email, row: rowNumber, reason: "no marketing opt-in" });
      return;
    }

    if (suppressed.has(hashEmail(email))) {
      excluded.push({ email, row: rowNumber, reason: "on suppression list" });
      return;
    }

    const previous = seen.get(email);
    if (previous) {
      previous.push(rowNumber);
      return;
    }
    seen.set(email, [rowNumber]);

    let firstName = firstNameIndex === -1 ? "" : cell(firstNameIndex);
    let lastName = lastNameIndex === -1 ? "" : cell(lastNameIndex);
    if (nameSplitFrom) {
      const split = splitFullName(cell(firstNameIndex));
      firstName = split.firstName;
      if (lastNameIndex === firstNameIndex || lastName.trim().length === 0) lastName = split.lastName;
    }

    const fields: Record<string, string> = {};
    headers.forEach((header, index) => {
      const value = record.cells[index] ?? "";
      if (value.trim().length > 0) fields[header] = value.trim();
    });

    recipients.push({
      email,
      firstName: firstName.trim() || null,
      lastName: lastName.trim() || null,
      fields,
    });
  });

  const duplicates = [...seen.entries()]
    .filter(([, rowNumbers]) => rowNumbers.length > 1)
    .map(([email, rowNumbers]) => ({ email, rows: rowNumbers }));
  const droppedDuplicates = duplicates.reduce((sum, entry) => sum + entry.rows.length - 1, 0);

  return {
    key: args.key,
    source: sourcePath,
    tier: args.tier,
    consentSource: args.consentSource,
    consentDate: args.consentDate,
    detected: resolved,
    nameSplitFrom,
    recipients,
    excluded,
    duplicates,
    malformed,
    counts: {
      rows: rows.length,
      recipients: recipients.length,
      excluded: excluded.length,
      duplicates: droppedDuplicates,
      malformed: malformed.length,
    },
  };
}

/** Groups exclusion reasons for the summary, without printing addresses. */
function groupReasons(excluded: { reason: string }[]): { reason: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const entry of excluded) counts.set(entry.reason, (counts.get(entry.reason) ?? 0) + 1);
  return [...counts.entries()]
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  if (argv.includes("--self-test")) {
    selfTest();
    return;
  }

  const args = parseArgs(argv);

  // Consent is checked before any work: an import without a recorded opt-in
  // source has no marketing basis, and finding that out after the file is
  // written invites someone to send it anyway.
  if (args.forImport && (!args.consentSource || !args.consentDate)) {
    fail(
      "--for-import requires both --consent-source and --consent-date.",
      "",
      "Importing addresses onto the mailing list means asserting they opted in.",
      "That assertion has to be recorded WITH the list — which form asked, and when —",
      "or nobody can later prove the consent existed, and the import is not lawful",
      "marketing. Without it the only safe use of this CSV is fulfilment mail for",
      "the event they registered for (drop --for-import).",
      "",
      'Example: --consent-source "Humanitix checkout question, AUT July 2026" --consent-date 2026-07-15'
    );
  }

  const sourcePath = resolve(args.input);
  let raw: string;
  try {
    raw = readFileSync(sourcePath, "utf8");
  } catch {
    fail(`could not read ${sourcePath}`);
  }

  const records = parseCsv(raw);
  if (records.length === 0) fail(`${sourcePath} is empty.`);

  const headers = records[0].cells;
  const rows = records.slice(1);
  if (rows.length === 0) fail(`${sourcePath} has a header row but no data rows.`);

  if (!args.map) {
    const detection = detectColumns(headers);
    if (!detection.columns.email) {
      console.error(`I read ${sourcePath} — ${rows.length} rows, but I cannot find an email column.`);
      console.error("");
      console.error("These are the columns it has:");
      for (const header of headers) console.error(`  - ${header}`);
      console.error("");
      console.error("Tell me which one holds the email address, or — if this export genuinely");
      console.error("has no email column — re-export from Humanitix with \"Include attendee email\"");
      console.error("ticked, because nothing can be sent without it.");
      process.exit(1);
    }
    reportDetection(args, sourcePath, headers, rows, detection);
    return;
  }

  const result = normalize(args, sourcePath, headers, rows, args.map);

  const outDir = resolve(args.outDir);
  mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, `recipients-${args.key}.json`);
  writeFileSync(outPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");

  const reasons = groupReasons(result.excluded);

  if (args.json) {
    console.log(
      JSON.stringify(
        {
          mode: "normalize",
          out: outPath,
          key: result.key,
          tier: result.tier,
          detected: result.detected,
          nameSplitFrom: result.nameSplitFrom,
          counts: result.counts,
          excludedByReason: reasons,
        },
        null,
        2
      )
    );
    return;
  }

  console.log(`Wrote ${outPath}`);
  console.log("");
  console.log(`  Source        ${result.source}`);
  console.log(`  Audience      ${describeTier(result.tier)}`);
  console.log(
    `  Consent       ${result.consentSource ? `${result.consentSource} (${result.consentDate})` : "not recorded (fulfilment send only)"}`
  );
  console.log("");
  console.log(`  Rows read     ${result.counts.rows}`);
  console.log(`  Recipients    ${result.counts.recipients}`);
  console.log(`  Excluded      ${result.counts.excluded}`);
  for (const entry of reasons) console.log(`                  ${entry.count} × ${entry.reason}`);
  console.log(`  Duplicates    ${result.counts.duplicates} (first occurrence kept)`);
  console.log(`  Malformed     ${result.counts.malformed}`);
  for (const entry of result.malformed) console.log(`                  row ${entry.row}: ${entry.reason}`);

  const accounted =
    result.counts.recipients + result.counts.excluded + result.counts.duplicates + result.counts.malformed;
  if (accounted !== result.counts.rows) {
    console.log("");
    console.log(`  ! ${result.counts.rows} rows but ${accounted} accounted for — please report this.`);
  }

  console.log("");
  console.log("Next:");
  console.log(
    `  npx tsx scripts/email/build-batch.ts <spec.json> --recipients "${outPath}" --stage <name>`
  );
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  void main().catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
}
