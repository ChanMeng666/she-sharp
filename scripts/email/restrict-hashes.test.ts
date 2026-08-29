/**
 * Checks for the ramp cohort loader — the filter that decides which already
 * consented subscribers a ramped send reaches first.
 *
 * Run: `npx tsx scripts/email/restrict-hashes.test.ts`
 *
 * Two properties are worth this much attention. The first is that the loader
 * REFUSES a file of email addresses: the cohort is derived from per-recipient
 * open data, and the flag speaks hashes precisely so that a plaintext list of
 * engaged readers never has a reason to exist on disk. A loader that quietly
 * accepted addresses would create that reason. The second is that narrowing can
 * only ever remove rows — if it could grow the recipient list it would be a way
 * of getting an address into a send without consent, which is the one thing it
 * must never be.
 *
 * Fixtures are written to the OS temp directory, never the repo's `tmp/`, so a
 * test run cannot leave behind a file a colleague could mistake for a real ramp
 * cohort.
 */

import assert from "node:assert";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { hashEmail } from "./suppression";
import {
  loadRestrictHashes,
  narrowByHash,
  RestrictHashesError,
  type RestrictSet,
} from "./restrict-hashes";

let failures = 0;

/**
 * Runs one named check.
 *
 * @param name What is being asserted.
 * @param fn The assertion body.
 */
function check(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL - ${name}`);
    console.error(`       ${error instanceof Error ? error.message : String(error)}`);
  }
}

const dir = mkdtempSync(join(tmpdir(), "she-sharp-restrict-test-"));

/**
 * Writes a fixture file and returns its path.
 *
 * @param name File name inside the temp directory.
 * @param contents Raw file contents, written verbatim so malformed JSON can be
 *   tested as well as valid JSON.
 */
function fixture(name: string, contents: string): string {
  const path = join(dir, name);
  writeFileSync(path, contents, "utf8");
  return path;
}

/**
 * Captures the error a load is expected to raise.
 *
 * @param path The fixture to load.
 * @returns The thrown `RestrictHashesError`.
 */
function loadError(path: string): RestrictHashesError {
  try {
    loadRestrictHashes(path);
  } catch (error) {
    assert.ok(error instanceof RestrictHashesError, `expected RestrictHashesError, got ${error}`);
    return error;
  }
  throw new Error("expected the load to throw, but it returned");
}

const HASH_A = hashEmail("a@example.com");
const HASH_B = hashEmail("b@example.com");
const HASH_C = hashEmail("c@example.com");

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

check("a bare array of digests parses", () => {
  const set = loadRestrictHashes(fixture("bare.json", JSON.stringify([HASH_A, HASH_B])));
  assert.strictEqual(set.hashes.size, 2);
  assert.ok(set.hashes.has(HASH_A));
});

check("{ hashes: [...] } parses — the shape recent-openers.ts writes", () => {
  const set = loadRestrictHashes(
    fixture("wrapped.json", JSON.stringify({ export: "2026-08-27-api", hashes: [HASH_A] }))
  );
  assert.strictEqual(set.hashes.size, 1);
  assert.ok(set.hashes.has(HASH_A));
});

check("mixed-case and padded digests normalise to lowercase", () => {
  const set = loadRestrictHashes(
    fixture("messy.json", JSON.stringify([`  ${HASH_A.toUpperCase()}  `]))
  );
  assert.deepStrictEqual([...set.hashes], [HASH_A]);
});

check("the resolved path is recorded, for the audit line", () => {
  const path = fixture("audit.json", JSON.stringify([HASH_A]));
  assert.strictEqual(loadRestrictHashes(path).path, path);
});

check("a file of email addresses is refused, naming the address risk", () => {
  const error = loadError(
    fixture("addresses.json", JSON.stringify(["a@example.com", "b@example.com"]))
  );
  const text = error.lines.join("\n");
  assert.match(text, /not a sha256 hex digest/);
  assert.match(text, /email/i);
  assert.match(text, /addresses/i);
});

check("a digest of the wrong length is refused", () => {
  const error = loadError(fixture("short.json", JSON.stringify([HASH_A.slice(0, 40)])));
  assert.match(error.lines.join("\n"), /not a sha256 hex digest/);
});

check("an empty array is refused rather than excluding everyone", () => {
  const error = loadError(fixture("empty.json", "[]"));
  const text = error.lines.join("\n");
  assert.match(text, /no hashes/);
  assert.match(text, /exclude every row/);
});

check("malformed JSON is refused", () => {
  const error = loadError(fixture("broken.json", "{ hashes: [ "));
  assert.match(error.lines.join("\n"), /not valid JSON/);
});

check("a JSON value that is neither array nor { hashes } is refused", () => {
  const error = loadError(fixture("object.json", JSON.stringify({ openers: 412 })));
  assert.match(error.lines.join("\n"), /must be a JSON array of hashes/);
});

check("a missing file is refused, and the message names recent-openers.ts", () => {
  const error = loadError(join(dir, "does-not-exist.json"));
  const text = error.lines.join("\n");
  assert.match(text, /could not read --restrict-to-hashes/);
  assert.match(text, /recent-openers\.ts/);
});

check("RestrictHashesError.message is the first line, so an uncaught throw reads", () => {
  const error = loadError(fixture("empty2.json", "[]"));
  assert.strictEqual(error.message, error.lines[0]);
});

// ---------------------------------------------------------------------------
// Narrowing
// ---------------------------------------------------------------------------

/** Builds the minimal row shape `narrowByHash()` accepts. */
function row(emailHash: string): { emailHash: string } {
  return { emailHash };
}

/** Builds a cohort set without touching the filesystem. */
function cohort(...hashes: string[]): RestrictSet {
  return { path: "(test)", hashes: new Set(hashes) };
}

check("narrowing partitions without loss", () => {
  const rows = [row(HASH_A), row(HASH_B), row(HASH_C)];
  const { kept, dropped } = narrowByHash(rows, cohort(HASH_B));
  assert.strictEqual(kept.length + dropped.length, rows.length);
  assert.strictEqual(kept.length, 1);
  assert.strictEqual(kept[0].emailHash, HASH_B);
});

check("every kept row came out of the input", () => {
  const rows = [row(HASH_A), row(HASH_B)];
  const { kept } = narrowByHash(rows, cohort(HASH_A, HASH_B));
  for (const entry of kept) assert.ok(rows.includes(entry), "kept a row that was not an input row");
});

check("a hash in the file but absent from the rows adds nobody", () => {
  const rows = [row(HASH_A)];
  const { kept, dropped } = narrowByHash(rows, cohort(HASH_A, HASH_B, HASH_C));
  assert.strictEqual(kept.length, 1);
  assert.strictEqual(dropped.length, 0);
});

check("a cohort matching nothing keeps nothing — the caller's zero guard fires", () => {
  const { kept, dropped } = narrowByHash([row(HASH_A)], cohort(HASH_B));
  assert.strictEqual(kept.length, 0);
  assert.strictEqual(dropped.length, 1);
});

check("row hashes are compared case-insensitively", () => {
  const { kept } = narrowByHash([row(HASH_A.toUpperCase())], cohort(HASH_A));
  assert.strictEqual(kept.length, 1);
});

// ---------------------------------------------------------------------------

rmSync(dir, { recursive: true, force: true });

console.log("");
if (failures > 0) {
  console.error(`${failures} check(s) failed.`);
  process.exit(1);
}
console.log("All restrict-hashes checks passed.");
