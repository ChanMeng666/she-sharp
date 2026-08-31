/**
 * Locates the Mailchimp export vault and reads files out of it.
 *
 * The vault holds the raw audience exports — 3,689 contacts with names,
 * employers, opt-in IP addresses, 162 phone numbers and 115 street addresses.
 * The IP column is `OPTIN_IP`, populated on 1,586 of those 3,689 counting CSV
 * records rather than lines (1,591 if the separate five-row `archived` export
 * is included); `CONFIRM_IP` — what the API calls `ip_signup` — is empty in all
 * five files, so none of these is a *sign-up* IP. It is gitignored (`/private/`), which means git will not back it
 * up and `git clean -xdf` will delete it. **The in-repo copy is a cache, not
 * the archive of record.**
 *
 * The master copy lives in the private `she-sharp-slack-archive` repository,
 * under `mailchimp/<export-id>/` — the same repository that holds the verbatim
 * Slack transcripts and the Humanitix exports, chosen because it is already the
 * one place the organisation's unredacted record is allowed to be kept, and
 * because being a repository it is versioned and backed up. Point at it with:
 *
 *   MAILCHIMP_VAULT_DIR=…/she-sharp-slack-archive/mailchimp/2026-08-17
 *
 * Either copy works: every file's sha256 is in the committed manifest, so the
 * two can be proved identical without either trusting the other.
 *
 * This is a near-twin of `scripts/humanitix/vault.ts` and deliberately not
 * shared with it. The two vaults hold different data under different rules and
 * a single module would have to be parameterised on the one thing that must
 * never be got wrong — which directory the PII is in.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

export const REPO_ROOT = resolve(__dirname, "..", "..");

/** Where the committed, derived, PII-free archive lives. */
export const ARCHIVE_DIR = join(REPO_ROOT, "lib", "data", "json", "mailchimp");

/** The default in-repo vault root. Gitignored — see `/private/` in .gitignore. */
/**
 * Where the raw exports are looked for when MAILCHIMP_VAULT_DIR is unset.
 *
 * This used to be `private/mailchimp/` inside this repository. That directory was
 * removed on 2026-09-01: of its 401 files, 400 were byte-identical to a file
 * already in the private `she-sharp-slack-archive` repo, so it was a cache
 * pretending to be a source — and a 37 MB one that `git clean -xdf` could
 * silently destroy. The archive is now the only copy, and the default points
 * straight at a sibling checkout of it.
 *
 * An in-repo `private/mailchimp/` still wins if one exists, because someone
 * mid-task with a fresh pull should not have it ignored.
 */
export const DEFAULT_VAULT_ROOT = (() => {
  const inRepo = join(REPO_ROOT, "private", "mailchimp");
  if (existsSync(inRepo)) return inRepo;
  return join(REPO_ROOT, "..", "she-sharp-slack-archive", "mailchimp");
})();

export class VaultMissingError extends Error {
  constructor(public readonly path: string) {
    super(
      `Mailchimp vault not found at ${path}\n` +
        `  Set MAILCHIMP_VAULT_DIR to the directory holding the raw exports, or\n` +
        `  place them in private/mailchimp/<export-id>/.\n` +
        `  The raw CSVs are never committed — see docs/development/MAILCHIMP_ARCHIVE.md.`
    );
    this.name = "VaultMissingError";
  }
}

/**
 * Resolves the directory holding one export's raw CSVs.
 *
 * Throws rather than returning null: every caller needs the vault, and a null
 * that flows onward turns "I could not read the data" into "the data says
 * zero" — which for a mailing list would read as "nobody is subscribed".
 */
export function resolveVaultDir(exportId: string): string {
  const override = process.env.MAILCHIMP_VAULT_DIR?.trim();
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
 * an empty directory reports "0 contacts" instead of "the data is not here".
 * Only a script that is about to write an export has any business creating one.
 *
 * It mirrors `resolveVaultDir`'s override precedence rather than reimplementing
 * it at the call site, so `MAILCHIMP_VAULT_DIR` cannot mean one directory to
 * the writer and another to the reader.
 *
 * @param exportId - The export id, which names the directory by default.
 * @returns The absolute directory path.
 */
export function ensureVaultDir(exportId: string): string {
  const override = process.env.MAILCHIMP_VAULT_DIR?.trim();
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
 * Recurses exactly one level, for the `activity/` sub-directory an API pull
 * writes its per-campaign responses into. One level rather than a full walk on
 * purpose: an unbounded walk would quietly pick up whatever else somebody left
 * in the vault, and the manifest's rule is that an unclassified file throws
 * rather than being absorbed.
 *
 * Paths come back **relative to the export directory, with forward slashes**,
 * because they are written verbatim into the committed manifest. `join()` on
 * Windows would put `activity\\x.json` in a file that CI reads on Linux, so the
 * recorded `file` string would depend on who ran the pull.
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

/** Image extensions the archive stores. Anything else is not an asset. */
const ASSET_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"];

/**
 * Every image in one named sub-directory of the vault.
 *
 * DELIBERATELY SEPARATE FROM {@link listVaultFiles}, which is not an oversight.
 * That function is the sole input to `buildApiExportEntry`, and every path it
 * returns is handed to `classifyApiFile`, which throws on anything it does not
 * recognise. Widening its extension union would break every `fetch-api.ts` run
 * on the 678th file; teaching the classifier about images instead would put
 * 550 MB of hashing in the path of every retry-after-network-failure, which is
 * the exact case that design exists to survive. It also feeds `refuseApiVault`,
 * whose refusal triggers on that function returning nothing.
 *
 * It does not recurse at all. The caller names the directory, so nothing a
 * human happens to leave in the vault can be absorbed into a committed file.
 *
 * @param exportId - The export id.
 * @param subdir - The sub-directory, e.g. `assets` or `campaign-images`.
 * @returns `<subdir>/<name>` paths with forward slashes, sorted by code unit.
 */
export function listVaultAssets(exportId: string, subdir: string): string[] {
  const dir = join(resolveVaultDir(exportId), subdir);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return [];

  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const lower = entry.name.toLowerCase();
    // The vault really does hold `4165797-Dave_Wild.PNG`, so the match is
    // case-insensitive while the recorded name stays verbatim.
    if (ASSET_EXTENSIONS.some((extension) => lower.endsWith(extension))) {
      found.push(`${subdir}/${entry.name}`);
    }
  }

  // Plain code-unit sort, NOT `localeCompare`. ICU collation depends on the
  // Node build (small-icu vs full-icu), and 677 names mixing case, dots,
  // hyphens and underscores would order differently on two machines. Nothing
  // verifies `manifest.json` for determinism, so that drift would land as an
  // unexplainable whole-file diff.
  return found.sort();
}

export function vaultFilePath(exportId: string, file: string): string {
  return join(resolveVaultDir(exportId), file);
}

export function readVaultFile(exportId: string, file: string): string {
  return readFileSync(vaultFilePath(exportId, file), "utf8");
}

/** sha256 of the file exactly as Mailchimp produced it. */
export function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

export function fileBytes(path: string): number {
  return statSync(path).size;
}

/** `--flag value` lookup, matching the hand-rolled convention used across scripts/. */
export function argValue(argv: string[], flag: string): string | undefined {
  const index = argv.indexOf(flag);
  return index === -1 ? undefined : argv[index + 1];
}
