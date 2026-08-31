/**
 * Checks for the community skill's side of the cross-skill frequency cap.
 *
 * Run: `npx tsx .claude/skills/email-the-community/scripts/marketing-frequency-check.test.ts`
 *
 * CLAUDE.md's rule is the shape of this file: a guard is not verified until you
 * have broken the thing it guards. The cap was one-directional before this
 * change — the newsletter refused on it and this skill did not — so the
 * assertions that matter are the ones that drive the counter into a state it
 * must refuse:
 *
 *   - three campaigns already this month → a fourth must be refused
 *   - a newsletter ramp of five chunks   → still ONE campaign, not five
 *   - an override with no reason         → must be refused, not recorded
 *   - an override for another key or another month → must not cover this one
 *   - and the happy path, so a gate that refuses everything fails here too
 *
 * Since 2026-08-31 it also guards the cap's OWN blind spot. The count is what
 * this repo has recorded, never what the list received, and every command that
 * prints a figure must print the Mailchimp notice beside it. The assertions
 * that matter there are the CLI ones: a unit test on the constant would still
 * pass if a renderer quietly stopped calling it, so each command is run as a
 * subprocess and its real stdout is read. Delete those tests together with the
 * notice, on the condition the notice itself states.
 *
 * Fixtures go to the OS temp directory, never to the skill's committed state
 * files, so a run leaves nothing a colleague could mistake for a real send.
 */

import assert from "node:assert";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  assessFrequency,
  BLIND_SPOT_DELETE_WHEN,
  BLIND_SPOT_NOTICE,
  blindSpotProse,
  COUNT_LABEL,
  currentNzMonth,
  DEFAULT_MONTHLY_CAP,
  readCommunitySends,
} from "../../monthly-newsletter/scripts/marketing-frequency";
import {
  findOverride,
  loadOverrides,
  MIN_REASON_LENGTH,
  readNewsletterSends,
  saveOverrides,
  validateReason,
  type OverrideFile,
  type OverrideRecord,
} from "./marketing-frequency-check";

const dir = mkdtempSync(join(tmpdir(), "she-sharp-frequency-"));
let failures = 0;

/** Runs one named check, printing `ok - …` or the failure. */
function test(name: string, body: () => void): void {
  try {
    body();
    console.log(`ok - ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`not ok - ${name}`);
    console.error(`    ${error instanceof Error ? error.message : String(error)}`);
  }
}

/** Writes a fixture and returns its path. */
function fixture(name: string, value: unknown): string {
  const path = join(dir, name);
  writeFileSync(path, JSON.stringify(value, null, 2), "utf8");
  return path;
}

/** One sent broadcast, in the community ledger's own shape. */
function broadcast(sentAt: string, digest: string) {
  return {
    broadcastId: "batch-announcement",
    status: "sent",
    segment: "newsletter_subscribers (subscribed)",
    htmlSha256: "0".repeat(64),
    createdAt: sentAt,
    scheduledAt: null,
    sentAt,
    digest,
  };
}

// ---------------------------------------------------------------------------
// Reading the newsletter's ledger from this side
// ---------------------------------------------------------------------------

test("a newsletter ramp of five chunks counts as ONE campaign", () => {
  const path = fixture("issues-ramp.json", {
    version: 1,
    lastRunAt: null,
    frequencyCapPerMonth: 3,
    issues: {
      "2026-08": {
        issueId: "2026-08",
        createdAt: "2026-08-27T22:00:00.000Z",
        test: null,
        review: null,
        approval: null,
        batches: [4, 3, 2, 1, 0].map((offset, index) => ({
          // Deliberately out of order: the earliest chunk must win whatever
          // order the file happens to list them in.
          at: `2026-08-27T2${2 - Math.floor(offset / 3)}:0${index}:00.000Z`,
          chunk: index + 1,
          of: 5,
          recipientCount: 100,
          idempotencyKey: null,
        })),
        frequencyOverride: null,
      },
    },
  });

  const sends = readNewsletterSends(path);
  assert.strictEqual(sends.length, 1, "five chunks must be one send");
  assert.strictEqual(sends[0].source, "monthly-newsletter");
  assert.strictEqual(sends[0].key, "2026-08");
  assert.match(sends[0].what, /5 chunk\(s\)/);
});

test("an issue with no batches has touched nobody and does not count", () => {
  const path = fixture("issues-unsent.json", {
    version: 1,
    issues: {
      "2026-09": {
        issueId: "2026-09",
        createdAt: "2026-09-01T00:00:00.000Z",
        test: { at: "2026-09-01T00:00:00.000Z", recipientCount: 1, recipientHashes: [], note: "" },
        review: null,
        approval: null,
        batches: [],
        frequencyOverride: null,
      },
    },
  });
  assert.deepStrictEqual(readNewsletterSends(path), []);
});

test("a missing or corrupt newsletter ledger reads as empty, never throws", () => {
  assert.deepStrictEqual(readNewsletterSends(join(dir, "does-not-exist.json")), []);
  const broken = join(dir, "issues-broken.json");
  writeFileSync(broken, "{ this is not json", "utf8");
  assert.deepStrictEqual(readNewsletterSends(broken), []);
});

// ---------------------------------------------------------------------------
// The cap itself — break it
// ---------------------------------------------------------------------------

test("three campaigns on the record refuse the fourth", () => {
  const community = fixture("broadcasts-three.json", {
    version: 1,
    lastRunAt: null,
    broadcasts: {
      "announce-x-save-the-date": broadcast("2026-08-05T02:00:00.000Z", "save the date"),
      "announce-x-line-up": broadcast("2026-08-20T02:00:00.000Z", "line-up"),
      "announce-y-line-up": broadcast("2026-08-22T02:00:00.000Z", "another event"),
    },
  });

  const verdict = assessFrequency(readCommunitySends(community), "2026-08", 3, {
    source: "email-the-community",
    key: "announce-x-last-call",
  });
  assert.strictEqual(verdict.existing.length, 3);
  assert.strictEqual(verdict.exceeded, true, "a fourth send must be refused");
});

test("two community sends plus one newsletter still refuse the fourth — the cap is cross-skill", () => {
  const community = fixture("broadcasts-two.json", {
    version: 1,
    broadcasts: {
      "announce-x-save-the-date": broadcast("2026-08-05T02:00:00.000Z", "save the date"),
      "announce-x-line-up": broadcast("2026-08-20T02:00:00.000Z", "line-up"),
    },
  });
  const newsletter = fixture("issues-one.json", {
    version: 1,
    issues: {
      "2026-08": {
        issueId: "2026-08",
        createdAt: "2026-08-27T22:00:00.000Z",
        test: null,
        review: null,
        approval: null,
        batches: [
          { at: "2026-08-27T22:00:00.000Z", chunk: 1, of: 1, recipientCount: 100, idempotencyKey: null },
        ],
        frequencyOverride: null,
      },
    },
  });

  const sends = [...readCommunitySends(community), ...readNewsletterSends(newsletter)];
  const verdict = assessFrequency(sends, "2026-08", DEFAULT_MONTHLY_CAP, {
    source: "email-the-community",
    key: "announce-x-last-call",
  });
  assert.strictEqual(verdict.existing.length, 3);
  assert.strictEqual(verdict.exceeded, true);
  // If this ever counted only one source it would read as 2 and pass, which is
  // exactly the one-directional hole this change closes.
  assert.deepStrictEqual(
    [...new Set(verdict.existing.map((s) => s.source))].sort(),
    ["email-the-community", "monthly-newsletter"]
  );
});

test("a resumed build of the same key does not count itself out of the month", () => {
  const community = fixture("broadcasts-self.json", {
    version: 1,
    broadcasts: {
      "announce-x-save-the-date": broadcast("2026-08-05T02:00:00.000Z", "save the date"),
      "announce-x-line-up": broadcast("2026-08-20T02:00:00.000Z", "line-up"),
      "announce-x-last-call": broadcast("2026-08-28T02:00:00.000Z", "last call"),
    },
  });
  const verdict = assessFrequency(readCommunitySends(community), "2026-08", 3, {
    source: "email-the-community",
    key: "announce-x-last-call",
  });
  assert.strictEqual(verdict.existing.length, 2, "it must exclude itself");
  assert.strictEqual(verdict.exceeded, false);
});

test("last month's sends do not count against this month", () => {
  const community = fixture("broadcasts-old.json", {
    version: 1,
    broadcasts: {
      a: broadcast("2026-07-05T02:00:00.000Z", "july one"),
      b: broadcast("2026-07-15T02:00:00.000Z", "july two"),
      c: broadcast("2026-07-25T02:00:00.000Z", "july three"),
    },
  });
  const verdict = assessFrequency(readCommunitySends(community), "2026-08", 3);
  assert.strictEqual(verdict.existing.length, 0);
  assert.strictEqual(verdict.exceeded, false);
});

// ---------------------------------------------------------------------------
// The override — break it
// ---------------------------------------------------------------------------

test("an override with no reason is refused", () => {
  assert.ok(validateReason(null), "null must be refused");
  assert.ok(validateReason(""), "empty must be refused");
  assert.ok(validateReason("     "), "whitespace must be refused");
});

test("an override with a token reason is refused", () => {
  assert.ok(validateReason("ok"), '"ok" must be refused');
  assert.ok(validateReason("urgent"), '"urgent" must be refused');
  assert.ok(
    validateReason("x".repeat(MIN_REASON_LENGTH - 1)),
    "one character short must be refused"
  );
  assert.strictEqual(
    validateReason("x".repeat(MIN_REASON_LENGTH)),
    null,
    "the floor itself must be accepted"
  );
});

test("an override covers one key in one month, and nothing else", () => {
  const path = join(dir, "overrides.json");
  const record: OverrideRecord = {
    at: "2026-08-30T00:00:00.000Z",
    month: "2026-08",
    key: "announce-x-last-call",
    reason: "The venue moved four days out and the list is the only way to say so.",
    by: "Chan Meng",
    observedCount: 3,
    cap: 3,
  };
  saveOverrides({ version: 1, overrides: [record] }, path);
  const file: OverrideFile = loadOverrides(path);

  assert.ok(findOverride(file, "announce-x-last-call", "2026-08"), "its own key + month");
  assert.strictEqual(
    findOverride(file, "announce-y-last-call", "2026-08"),
    null,
    "another campaign must NOT be covered"
  );
  assert.strictEqual(
    findOverride(file, "announce-x-last-call", "2026-09"),
    null,
    "an override must expire with its month"
  );
});

test("a missing or corrupt override file reads as no overrides", () => {
  assert.deepStrictEqual(loadOverrides(join(dir, "no-such-overrides.json")).overrides, []);
  const broken = join(dir, "overrides-broken.json");
  writeFileSync(broken, "not json at all", "utf8");
  assert.deepStrictEqual(loadOverrides(broken).overrides, []);
});

// ---------------------------------------------------------------------------
// The cap's own blind spot — Mailchimp
//
// These run the CLIs and read their real stdout. Asserting on the exported
// constant alone would keep passing if a renderer stopped printing it, which is
// the failure this whole section exists to catch.
// ---------------------------------------------------------------------------

/**
 * The `--require`/`--import` loader flags this process was started with, so a
 * child can run TypeScript the same way. Falls back to `tsx`, which is how the
 * repo's other scripts are invoked.
 */
function loaderArgs(): string[] {
  const args: string[] = [];
  for (let index = 0; index < process.execArgv.length; index += 1) {
    const arg = process.execArgv[index];
    if (arg === "--require" || arg === "--import") {
      args.push(arg, process.execArgv[index + 1]);
      index += 1;
    } else if (arg.startsWith("--require=") || arg.startsWith("--import=")) {
      args.push(arg);
    }
  }
  return args.length > 0 ? args : ["--import=tsx"];
}

/** Absolute path to a script, from this file. */
function script(relative: string): string {
  return fileURLToPath(new URL(relative, import.meta.url));
}

/**
 * Runs one of the skills' CLIs and returns its stdout.
 *
 * Exit codes are deliberately ignored. `check` exits 2 when the cap is
 * exceeded and 1 when an approval chain is incomplete, and both depend on the
 * committed state files, which move. What must hold whatever they say is that
 * the notice was printed.
 */
function stdoutOf(path: string, argv: string[], env: NodeJS.ProcessEnv = {}): string {
  try {
    return execFileSync(process.execPath, [...loaderArgs(), path, ...argv], {
      stdio: "pipe",
      encoding: "utf8",
      env: { ...process.env, ...env },
    });
  } catch (error) {
    const failure = error as { stdout?: string };
    return failure.stdout ?? "";
  }
}

/** stdout with the hand-wrapping flattened, so a wrapped sentence can match. */
function prose(output: string): string {
  return output.replace(/\s+/g, " ").trim();
}

test("the notice names Mailchimp, the month that proved it, and when to delete it", () => {
  const text = blindSpotProse();
  assert.match(text, /Mailchimp/, "the uncounted pipeline must be named");
  assert.match(text, /August 2026/, "the worked example must be dated");
  assert.match(text, /five marketing emails against a cap of three/);
  assert.ok(
    text.includes(BLIND_SPOT_DELETE_WHEN),
    "a note meant to be deleted must carry the condition for deleting it"
  );
  assert.match(
    text,
    /not what the subscriber list received/,
    "the figure must be disclaimed, not merely footnoted"
  );
});

test("every community-skill command that prints a figure prints the notice", () => {
  const path = script("marketing-frequency-check.ts");
  for (const argv of [
    ["show"],
    ["check", "--key", "blind-spot-test"],
  ]) {
    const output = prose(stdoutOf(path, argv));
    assert.ok(
      output.includes(blindSpotProse()),
      `\`${argv.join(" ")}\` printed no blind-spot notice:\n${output}`
    );
    assert.ok(
      output.includes(COUNT_LABEL),
      `\`${argv.join(" ")}\` did not say the figure is only "${COUNT_LABEL}"`
    );
  }
});

test("the community check's JSON carries the notice too", () => {
  const output = stdoutOf(script("marketing-frequency-check.ts"), [
    "check",
    "--key",
    "blind-spot-test",
    "--json",
  ]);
  const parsed = JSON.parse(output) as { counts?: string; blindSpots?: string[] };
  assert.strictEqual(parsed.counts, COUNT_LABEL);
  assert.deepStrictEqual(parsed.blindSpots, [...BLIND_SPOT_NOTICE]);
});

test("the newsletter ledger prints the notice on a PASS and on a FAIL", () => {
  const path = script("../../monthly-newsletter/scripts/issue-ledger.ts");

  // A complete chain, so the PASS branch is exercised rather than assumed. The
  // ledger is redirected to a fixture; the committed record is never touched.
  const passing = fixture("issues-passing.json", {
    version: 1,
    lastRunAt: null,
    frequencyCapPerMonth: 3,
    issues: {
      "2026-01": {
        issueId: "2026-01",
        createdAt: "2026-01-02T00:00:00.000Z",
        test: { at: "2026-01-02T01:00:00.000Z", recipientCount: 1, recipientHashes: [], note: "" },
        review: { at: "2026-01-02T02:00:00.000Z", recipientCount: 4, people: 4, recipientHashes: [], note: "" },
        approval: { at: "2026-01-02T03:00:00.000Z", by: "Mahsa", evidence: "said so on the call" },
        batches: [],
        frequencyOverride: null,
      },
    },
  });
  const env = { NEWSLETTER_ISSUE_LEDGER_PATH_FOR_TESTS: passing };

  const pass = prose(stdoutOf(path, ["check", "--issue", "2026-01"], env));
  assert.match(pass, /^\s*Approval chain — 2026-01/);
  assert.ok(pass.includes("PASS"), `expected a PASS, got:\n${pass}`);
  assert.ok(pass.includes(blindSpotProse()), "a PASS must still print the notice");
  assert.ok(pass.includes(COUNT_LABEL), "the PASS figure must be qualified");

  // And the FAIL branch: an issue with no record at all.
  const fail = prose(stdoutOf(path, ["check", "--issue", "2026-02"], env));
  assert.ok(fail.includes("FAIL"), `expected a FAIL, got:\n${fail}`);
  assert.ok(fail.includes(blindSpotProse()), "a FAIL must print the notice too");
});

// ---------------------------------------------------------------------------
// The happy path, last — a gate that refuses everything must fail here
// ---------------------------------------------------------------------------

test("an empty month is within the cap", () => {
  const verdict = assessFrequency([], currentNzMonth(), DEFAULT_MONTHLY_CAP);
  assert.strictEqual(verdict.exceeded, false);
  assert.strictEqual(verdict.existing.length, 0);
  assert.deepStrictEqual(
    verdict.blindSpots,
    BLIND_SPOT_NOTICE,
    "even a clean verdict must carry what it could not see"
  );
});

rmSync(dir, { recursive: true, force: true });
if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log("\nAll marketing-frequency checks passed.");
