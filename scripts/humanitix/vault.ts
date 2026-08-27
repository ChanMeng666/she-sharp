/**
 * Locates the Humanitix export vault and reads files out of it.
 *
 * The vault holds the raw account exports — 5,156 attendee rows with names,
 * mobiles, addresses and dates of birth, and 124 access codes. It is gitignored
 * (`/private/`), which means git will not back it up and `git clean -xdf` will
 * delete it. **The in-repo copy is a cache, not the archive of record.**
 *
 * The master copy lives in the private `she-sharp-slack-archive` repository,
 * under `humanitix/<export-id>/` — the same repository that holds the verbatim
 * Slack transcripts, chosen because it is already the one place the
 * organisation's unredacted record is allowed to be kept, and because being a
 * repository it is versioned and backed up. Point at it with:
 *
 *   HUMANITIX_VAULT_DIR=…/she-sharp-slack-archive/humanitix/2026-08-17
 *
 * Either copy works: every file's sha256 is in the committed manifest, so the
 * two can be proved identical without either trusting the other.
 *
 * Nothing here parses or interprets. It resolves paths, hashes files and
 * refuses clearly to work when the vault is absent — a vault-dependent script
 * that silently passes with no vault is the failure mode this whole layout
 * exists to avoid.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

export const REPO_ROOT = resolve(__dirname, "..", "..");

/** Where the committed, derived, PII-free archive lives. */
export const ARCHIVE_DIR = join(REPO_ROOT, "lib", "data", "json", "humanitix");

/** The default in-repo vault root. Gitignored — see `/private/` in .gitignore. */
export const DEFAULT_VAULT_ROOT = join(REPO_ROOT, "private", "humanitix");

export class VaultMissingError extends Error {
  constructor(public readonly path: string) {
    super(
      `Humanitix vault not found at ${path}\n` +
        `  Set HUMANITIX_VAULT_DIR to the directory holding the raw exports, or\n` +
        `  place them in private/humanitix/<export-id>/.\n` +
        `  The raw CSVs are never committed — see docs/development/HUMANITIX_ARCHIVE.md.`
    );
    this.name = "VaultMissingError";
  }
}

/**
 * Resolves the directory holding one export's raw CSVs.
 *
 * `HUMANITIX_VAULT_DIR` wins when set, so the same scripts work against a copy
 * on a network drive without anyone editing a path. Throws rather than
 * returning null: every caller needs the vault, and a null that flows onward
 * turns "I could not read the data" into "the data says zero".
 */
export function resolveVaultDir(exportId: string): string {
  const override = process.env.HUMANITIX_VAULT_DIR?.trim();
  const dir = override ? resolve(override) : join(DEFAULT_VAULT_ROOT, exportId);

  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    throw new VaultMissingError(dir);
  }
  return dir;
}

/**
 * Resolves an export's vault directory, creating it when it does not exist.
 *
 * The only sanctioned way to make a vault directory, and separate from
 * {@link resolveVaultDir} because everything else in this archive READS the
 * vault and must fail loudly when it is absent — a reader that silently mkdirs
 * an empty directory reports "0 tickets" instead of "the data is not here".
 * Only a script that is about to write an export has any business creating one.
 *
 * It mirrors `resolveVaultDir`'s override precedence rather than reimplementing
 * it at the call site, so `HUMANITIX_VAULT_DIR` cannot mean one directory to
 * the writer and another to the reader.
 *
 * @param exportId - The export id, which names the directory by default.
 * @returns The absolute directory path.
 */
export function ensureVaultDir(exportId: string): string {
  const override = process.env.HUMANITIX_VAULT_DIR?.trim();
  const dir = override ? resolve(override) : join(DEFAULT_VAULT_ROOT, exportId);
  mkdirSync(dir, { recursive: true });
  return dir;
}

/** True when the export's vault directory is present and readable. */
export function vaultExists(exportId: string): boolean {
  try {
    resolveVaultDir(exportId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Every file of one extension in the vault directory, sorted.
 *
 * Recurses exactly one level, for the `orders/`, `tickets/` and
 * `check-in-counts/` sub-directories an API pull writes its per-event responses
 * into. One level rather than a full walk on purpose: an unbounded walk would
 * quietly pick up whatever else somebody left in the vault, and the manifest's
 * rule is that an unclassified file throws rather than being absorbed.
 *
 * Paths come back **relative to the export directory, with forward slashes**,
 * because they are written verbatim into the committed manifest. `join()` on
 * Windows would put `orders\\<id>.json` in a file that CI reads on Linux, so
 * the recorded `file` string would depend on who ran the pull.
 *
 * @param exportId - The export id.
 * @param extension - The extension to match, lower-case, including the dot.
 * @returns Relative paths, sorted, so output is deterministic.
 */
export function listVaultFiles(exportId: string, extension: ".csv" | ".json"): string[] {
  const dir = resolveVaultDir(exportId);

  const matches = (name: string) => name.toLowerCase().endsWith(extension);
  const found: string[] = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      for (const child of readdirSync(join(dir, entry.name), { withFileTypes: true })) {
        if (child.isFile() && matches(child.name)) found.push(`${entry.name}/${child.name}`);
      }
      continue;
    }
    if (entry.isFile() && matches(entry.name)) found.push(entry.name);
  }

  return found.sort((a, b) => a.localeCompare(b, "en"));
}

/** Every `.csv` in the vault directory, sorted, so output is deterministic. */
export function listVaultCsvs(exportId: string): string[] {
  return listVaultFiles(exportId, ".csv");
}

export function vaultFilePath(exportId: string, file: string): string {
  return join(resolveVaultDir(exportId), file);
}

export function readVaultFile(exportId: string, file: string): string {
  return readFileSync(vaultFilePath(exportId, file), "utf8");
}

/** sha256 of the file exactly as Humanitix produced it. */
export function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

export function fileBytes(path: string): number {
  return statSync(path).size;
}

/**
 * Parses `2026-08-17@10.02.37` out of a Humanitix export filename.
 *
 * Humanitix stamps the export moment into the name, which makes the filename
 * itself a provenance record — worth keeping rather than tidying away, so the
 * manifest can state when each report was taken without a separate note.
 */
export function parseExportStamp(file: string): string | null {
  const match = file.match(/\(exported-(\d{4}-\d{2}-\d{2})@(\d{2})\.(\d{2})\.(\d{2})\)/);
  if (!match) return null;
  const [, date, hh, mm, ss] = match;
  return `${date}T${hh}:${mm}:${ss}`;
}

/** `--flag value` lookup, matching the hand-rolled convention used across scripts/. */
export function argValue(argv: string[], flag: string): string | undefined {
  const index = argv.indexOf(flag);
  return index === -1 ? undefined : argv[index + 1];
}
