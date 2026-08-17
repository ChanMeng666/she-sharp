/**
 * CSV reading for the Mailchimp vault.
 *
 * Same library and same reasoning as `scripts/humanitix/csv.ts`: `csv-parse/sync`
 * is already a devDependency and already this repository's CSV importer of
 * record.
 *
 * One quirk is specific to Mailchimp and is the reason this file exists rather
 * than the Humanitix one being reused: **the `TAGS` column is itself a CSV
 * document**, quoted and comma-separated, nested inside a CSV cell. Splitting
 * it on `,` looks correct until a tag contains a comma of its own, at which
 * point one real tag silently becomes two — see `parseTagCell`.
 */
import { parse } from "csv-parse/sync";

import { readVaultFile } from "./vault";

/** A row keyed by the export's own human-readable column headings. */
export type CsvRow = Record<string, string>;

/**
 * Reads a headed CSV out of the vault.
 *
 * `relax_column_count: false` is deliberate: a Mailchimp export with a ragged
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

/** The outcome of reading one `TAGS` cell. */
export interface ParsedTagCell {
  /** Tags in file order, trimmed, with empties dropped. */
  tags: string[];
  /**
   * True when the cell is not valid CSV — see {@link parseTagCell}.
   *
   * The tags recovered before the break are still correct; everything after it
   * is wreckage, and the caller marks it as such rather than discarding the
   * contact, who is a real person either way.
   */
  malformed: boolean;
}

/**
 * Parses the `TAGS` cell into its individual tags.
 *
 * The cell holds a comma-separated list in which each tag is itself quoted:
 *
 *   "Ticket Type: Tickets - Students","2023","Countdown IWD"
 *
 * A naive `split(",")` gets that right until a tag contains a comma, and some
 * of She Sharp's tags do — one event title reads
 * `… A More Diverse, Inclusive & Sustainabl` (truncated by Mailchimp's own
 * 100-character tag limit, comma included). Splitting shatters those into
 * fragments that match no event and inflates the vocabulary.
 *
 * So the cell is parsed as the CSV document it is — but by hand, rather than
 * through `csv-parse`, because **45 of the 3,146 tagged contacts in the
 * 2026-08-17 export have a cell that is not valid CSV at all.** When Mailchimp's
 * truncation lands inside a quoted tag it does not re-close the quote, and the
 * library rejects the whole cell (`CSV_INVALID_CLOSING_QUOTE`, and with
 * `relax_quotes` on, `CSV_NON_TRIMABLE_CHAR_AFTER_CLOSING_QUOTE`). Neither
 * throwing nor skipping is right: those 45 people are real and their earlier
 * tags are correct. The grammar is small enough that recovering deliberately
 * beats configuring a parser to be careless.
 *
 * @param cell The raw `TAGS` cell, possibly empty.
 */
export function parseTagCell(cell: string | undefined | null): ParsedTagCell {
  const raw = (cell ?? "").trim();
  if (!raw) return { tags: [], malformed: false };

  const tags: string[] = [];
  let malformed = false;
  let index = 0;

  while (index < raw.length) {
    let value = "";

    if (raw[index] === '"') {
      index++;
      let closed = false;
      while (index < raw.length) {
        if (raw[index] === '"') {
          // A doubled quote is an escaped quote inside the tag; a single one
          // ends it.
          if (raw[index + 1] === '"') {
            value += '"';
            index += 2;
            continue;
          }
          index++;
          closed = true;
          break;
        }
        value += raw[index++];
      }
      // Ran off the end mid-tag, or found text where a separator belongs —
      // both are Mailchimp's truncation, not a tag anyone typed.
      if (!closed) malformed = true;
      else if (index < raw.length && raw[index] !== ",") malformed = true;
    } else {
      // An unquoted field. Mailchimp quotes every tag it writes, so reaching
      // here at all means the cell has already been corrupted upstream.
      malformed = true;
      while (index < raw.length && raw[index] !== ",") value += raw[index++];
    }

    const trimmed = value.trim();
    if (trimmed) tags.push(trimmed);

    // Skip the separator, plus anything between it and the next field.
    while (index < raw.length && raw[index] !== ",") index++;
    if (raw[index] === ",") index++;
  }

  return { tags, malformed };
}

/**
 * Normalises an address the way every downstream comparison does.
 *
 * Must agree with `hashEmail()` in `lib/email/hash.ts` — the suppression
 * register keys on `sha256(trim().toLowerCase())`, and an archive that grouped
 * addresses any other way would report a different number of people than the
 * register suppresses.
 */
export function normalizeEmail(value: string | undefined | null): string {
  return (value ?? "").trim().toLowerCase();
}

/**
 * Pulls the calendar year out of a Mailchimp timestamp (`YYYY-MM-DD HH:MM:SS`).
 *
 * @returns The four-digit year, or null when the cell is blank or malformed.
 *   Null rather than a fallback year: one subscribed row has no `OPTIN_TIME` at
 *   all, and bucketing it into 1970 or into the export year would both be
 *   inventions.
 */
export function yearOf(value: string | undefined | null): string | null {
  const match = (value ?? "").trim().match(/^(\d{4})-\d{2}-\d{2}/);
  return match ? match[1] : null;
}
