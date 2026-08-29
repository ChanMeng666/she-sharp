/**
 * One answer to "which of these already-consented rows is in the ramp cohort?",
 * shared by the CSV recipient builder and the database one.
 *
 * `--restrict-to-hashes` started on `normalize-recipients.ts`, the CSV path.
 * Once a send stopped being built from a CSV — `recipients-from-db.ts` reads
 * `newsletter_subscribers` directly — the flag had to exist on both producers or
 * "ramp to the recent openers" could not be done at all. Two copies of a filter
 * whose entire safety argument is "it can only ever remove rows" is exactly the
 * kind of duplication that drifts, so it is implemented once, here.
 *
 * **This module throws; it never calls `process.exit`.** That is deliberate,
 * for two reasons. The callers' error printers genuinely differ —
 * `normalize-recipients.ts` prints detail lines unindented,
 * `recipients-from-db.ts` indents them two spaces — and the messages are quoted
 * verbatim in `.claude/skills/email-the-community/` and
 * `.claude/skills/update-mailing-list/`, so collapsing the two would change one
 * script's output as a side effect of a refactor. And an exit inside the loader
 * would make the sha256-shape rejection untestable, when that rejection *is*
 * the flag's safety argument.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/** A loaded `--restrict-to-hashes` file: where it came from, and its digests. */
export interface RestrictSet {
  path: string;
  hashes: Set<string>;
}

/**
 * A rejected cohort file, carrying the lines the caller should print.
 *
 * The lines are kept as an array rather than one joined string so each caller
 * can apply its own indentation to the detail lines without re-splitting.
 */
export class RestrictHashesError extends Error {
  readonly lines: string[];

  /**
   * @param lines The message, first line first. `message` is set to `lines[0]`
   *   so an uncaught throw still reads sensibly.
   */
  constructor(lines: string[]) {
    super(lines[0] ?? "invalid --restrict-to-hashes file");
    this.name = "RestrictHashesError";
    this.lines = lines;
  }
}

/**
 * Loads the narrowing filter — a JSON file of `hashEmail()` digests.
 *
 * Accepts either a bare array or `{ hashes: [...] }`, which is what
 * `scripts/mailchimp/recent-openers.ts` writes.
 *
 * Every entry must look like a sha256 digest, and that check is doing real
 * work: it is what stops somebody pointing this flag at a list of email
 * addresses. The ramp cohort is derived from per-recipient engagement data, and
 * the entire reason the flag speaks hashes is so no such address file has a
 * reason to exist. Rejecting one loudly is the point, not pedantry.
 *
 * @param path Path as given on the command line.
 * @returns The resolved path and the digest set.
 * @throws {RestrictHashesError} When the file is unreadable, is not JSON, is
 *   not a list of sha256 digests, or is empty.
 */
export function loadRestrictHashes(path: string): RestrictSet {
  const resolved = resolve(path);

  let raw: string;
  try {
    raw = readFileSync(resolved, "utf8");
  } catch {
    throw new RestrictHashesError([
      `could not read --restrict-to-hashes ${resolved}`,
      "",
      "This file is produced by:",
      "  npx tsx scripts/mailchimp/recent-openers.ts --export <id> \\",
      "    --subscribed-export <id> --since YYYY-MM-DD",
    ]);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new RestrictHashesError([
      `${resolved} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
    ]);
  }

  const list =
    Array.isArray(parsed) ? parsed
    : typeof parsed === "object" && parsed !== null ? (parsed as { hashes?: unknown }).hashes
    : undefined;
  if (!Array.isArray(list)) {
    throw new RestrictHashesError([
      `${resolved} must be a JSON array of hashes, or an object with a "hashes" array.`,
    ]);
  }

  const hashes = new Set<string>();
  for (const entry of list) {
    if (typeof entry !== "string" || !/^[0-9a-f]{64}$/i.test(entry.trim())) {
      throw new RestrictHashesError([
        `${resolved} contains a value that is not a sha256 hex digest.`,
        "",
        "Every entry must be a hashEmail() digest. If this file holds email",
        "addresses, it is the wrong file — this flag takes hashes precisely so a",
        "plaintext list of engaged readers never needs to exist on disk.",
      ]);
    }
    hashes.add(entry.trim().toLowerCase());
  }

  if (hashes.size === 0) {
    throw new RestrictHashesError([
      `${resolved} contains no hashes — that would exclude every row.`,
      "Drop --restrict-to-hashes rather than passing an empty filter.",
    ]);
  }

  return { path: resolved, hashes };
}

/**
 * Partitions rows by whether their hash is in the cohort.
 *
 * Small enough to look pointless, and it is not: this is where "narrowing can
 * only ever remove" becomes testable without a database or a CSV. Every row
 * returned came out of `rows`, and a hash in the file that matches nothing adds
 * nobody, because the file is never iterated — only consulted.
 *
 * @param rows Rows that have already survived every consent and suppression
 *   check. Narrowing runs last precisely so it can never be the reason someone
 *   suppressed looks merely "out of cohort".
 * @param restrict The loaded cohort file.
 * @returns The rows in the cohort and the rows outside it, in input order.
 */
export function narrowByHash<T extends { emailHash: string }>(
  rows: T[],
  restrict: RestrictSet
): { kept: T[]; dropped: T[] } {
  const kept: T[] = [];
  const dropped: T[] = [];
  for (const row of rows) {
    if (restrict.hashes.has(row.emailHash.toLowerCase())) kept.push(row);
    else dropped.push(row);
  }
  return { kept, dropped };
}
