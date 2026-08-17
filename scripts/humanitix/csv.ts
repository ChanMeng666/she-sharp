/**
 * CSV reading for the Humanitix vault.
 *
 * Uses `csv-parse/sync`, which is already a devDependency and already the
 * repo's CSV importer of record (`scripts/batch-import-mentors.ts`). There is
 * a very good hand-rolled RFC-4180 parser in
 * `scripts/email/normalize-recipients.ts`, but it is a CLI module that reads
 * `process.argv` at import time, and coupling two unrelated pipelines through
 * it would be worse than using the library both of them could have used.
 *
 * Two Humanitix quirks are handled here rather than at every call site: the
 * exports carry a UTF-8 BOM, and the guest-list report has no header row at
 * all, so it can only be read positionally.
 */
import { parse } from "csv-parse/sync";

import { readVaultFile } from "./vault";

/** A row keyed by the export's own human-readable column headings. */
export type CsvRow = Record<string, string>;

/**
 * Reads a headed CSV out of the vault.
 *
 * `relax_column_count: false` is deliberate: a Humanitix export with a ragged
 * row means the download truncated, and the loud failure is the useful one.
 */
export function readCsv(exportId: string, file: string): CsvRow[] {
  return parse(readVaultFile(exportId, file), {
    columns: true,
    bom: true,
    skip_empty_lines: true,
    relax_column_count: false,
    trim: false,
  }) as CsvRow[];
}

/** Reads a headerless CSV positionally — the guest list is the only one. */
export function readHeaderlessCsv(exportId: string, file: string): string[][] {
  return parse(readVaultFile(exportId, file), {
    columns: false,
    bom: true,
    skip_empty_lines: true,
    relax_column_count: false,
    trim: false,
  }) as string[][];
}

/** The header row of a headed CSV, in file order. */
export function readCsvHeader(exportId: string, file: string): string[] {
  const rows = parse(readVaultFile(exportId, file), {
    columns: false,
    bom: true,
    skip_empty_lines: true,
    to_line: 1,
  }) as string[][];
  return rows[0] ?? [];
}

/**
 * Parses a Humanitix money string (`$1,234.56`, `-$12.00`, `` ` `` ``) to integer cents.
 *
 * Money is carried as cents everywhere downstream. The account's own
 * reconciliation — ticket earnings plus donations equalling total earnings — is
 * exact to the cent, and comparing that in floating point would turn a real
 * invariant into an approximate one.
 */
export function parseMoneyCents(value: string | undefined | null): number {
  if (!value) return 0;
  const cleaned = value.replace(/[$,\s]/g, "").trim();
  if (!cleaned || cleaned === "-") return 0;
  const amount = Number(cleaned);
  if (!Number.isFinite(amount)) {
    throw new Error(`Unparseable money value: ${JSON.stringify(value)}`);
  }
  return Math.round(amount * 100);
}

/** Cents back to a 2dp number, for serialising into the committed JSON. */
export function centsToAmount(cents: number): number {
  return Math.round(cents) / 100;
}

/** Parses Humanitix's `DD/MM/YYYY` into an ISO `YYYY-MM-DD`. */
export function parseDmyToIso(value: string): string {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) {
    throw new Error(`Unparseable Humanitix date: ${JSON.stringify(value)}`);
  }
  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
}

/** Integer parse that treats blank as zero and rejects anything else. */
export function parseIntStrict(value: string | undefined | null): number {
  if (value === undefined || value === null) return 0;
  const trimmed = value.trim();
  if (!trimmed) return 0;
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed)) {
    throw new Error(`Expected an integer, got ${JSON.stringify(value)}`);
  }
  return parsed;
}
