/**
 * Checks for the newsletter issue ledger — the gate in front of the first send
 * to 1,549 real people.
 *
 * Run: `npx tsx .claude/skills/monthly-newsletter/scripts/issue-ledger.test.ts`
 *
 * This file exists because of the rule in CLAUDE.md: a guard is not verified
 * until you have broken the thing it guards. Two guards in this repository read
 * as correct all year while gating nothing, and both were found by handing them
 * the input they were supposed to refuse. So every assertion here is of the
 * form "drive the ledger into a state that must be refused, and prove it is":
 *
 *   - each stage missing, one at a time  → check must fail
 *   - an approval with blank evidence    → check must fail
 *   - an approval dated before the review round → check must fail, because that
 *     backwards order IS the bug the whole chain replaces
 *   - a month already at the cap         → check must fail
 *   - and only then, the happy path, so a gate that refuses everything cannot
 *     pass this file either
 *
 * Fixtures go to the OS temp directory, never to the skill's committed
 * `state/issues.json` and never to the repo's `tmp/`, so a test run can leave
 * nothing behind that a colleague could mistake for a real approval record.
 */

import assert from "node:assert";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  assessChain,
  loadLedger,
  maskAddress,
  parseAddresses,
  saveLedger,
  type IssueLedger,
} from "./issue-ledger";
import {
  assessFrequency,
  nzCalendarMonth,
  readCommunitySends,
} from "./marketing-frequency";

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

const dir = mkdtempSync(join(tmpdir(), "she-sharp-issue-ledger-test-"));

/** A ledger in memory, so the committed state file is never touched. */
function ledgerWith(overrides: Partial<IssueLedger["issues"]["x"]> = {}): IssueLedger {
  const now = new Date().toISOString();
  return {
    version: 1,
    lastRunAt: now,
    frequencyCapPerMonth: 3,
    issues: {
      "2026-08": {
        issueId: "2026-08",
        createdAt: now,
        test: null,
        review: null,
        approval: null,
        batches: [],
        frequencyOverride: null,
        ...overrides,
      },
    },
  };
}

const stage = (at: string) => ({
  at,
  recipientCount: 1,
  recipientHashes: [maskAddress("someone@example.com")],
  note: "",
});

/** A community ledger fixture at a chosen path. */
function communityLedger(name: string, entries: Record<string, unknown>): string {
  const path = join(dir, name);
  writeFileSync(path, JSON.stringify({ version: 1, lastRunAt: null, broadcasts: entries }, null, 2));
  return path;
}

/** An empty community ledger, so the frequency count is only what a test sets. */
const NO_COMMUNITY = communityLedger("community-empty.json", {});

// ---------------------------------------------------------------------------
// Address handling — nothing mailable may reach the committed file
// ---------------------------------------------------------------------------

check("maskAddress is a 16-hex-char digest, not the address", () => {
  const masked = maskAddress("Someone@Example.COM ");
  assert.match(masked, /^[0-9a-f]{16}$/);
  assert.ok(!masked.includes("@"));
  // Case and surrounding whitespace must not produce two identities for one
  // mailbox, or "the same person twice" becomes invisible in the record.
  assert.strictEqual(masked, maskAddress("someone@example.com"));
});

check("parseAddresses refuses a value that is not an address", () => {
  assert.throws(() => parseAddresses("not-an-address"), /not a valid email address/);
});

check("parseAddresses deduplicates and lowercases", () => {
  assert.deepStrictEqual(parseAddresses(" A@x.com , b@y.com ,a@x.com"), [
    "a@x.com",
    "b@y.com",
  ]);
});

// ---------------------------------------------------------------------------
// Breaking the chain gate, one stage at a time
// ---------------------------------------------------------------------------

check("BREAK: an issue with no record at all is refused", () => {
  const empty: IssueLedger = { version: 1, lastRunAt: null, frequencyCapPerMonth: 3, issues: {} };
  const v = assessChain(empty, "2026-08", NO_COMMUNITY);
  assert.strictEqual(v.ok, false);
  assert.deepStrictEqual(v.problems, ["no-record"]);
});

check("BREAK: stage 1 recorded but stage 2 missing is refused", () => {
  const v = assessChain(ledgerWith({ test: stage("2026-08-10T00:00:00.000Z") }), "2026-08", NO_COMMUNITY);
  assert.strictEqual(v.ok, false);
  assert.ok(v.problems.includes("missing-review"), v.problems.join(","));
  assert.ok(v.problems.includes("missing-approval"), v.problems.join(","));
});

check("BREAK: stages 1 and 2 recorded but no founder approval is refused", () => {
  const v = assessChain(
    ledgerWith({
      test: stage("2026-08-10T00:00:00.000Z"),
      review: stage("2026-08-11T00:00:00.000Z"),
    }),
    "2026-08",
    NO_COMMUNITY
  );
  assert.strictEqual(v.ok, false);
  assert.deepStrictEqual(v.problems, ["missing-approval"]);
});

check("BREAK: an approval with blank evidence is not an approval", () => {
  const v = assessChain(
    ledgerWith({
      test: stage("2026-08-10T00:00:00.000Z"),
      review: stage("2026-08-11T00:00:00.000Z"),
      approval: { at: "2026-08-12T00:00:00.000Z", by: "Mahsa", evidence: "   " },
    }),
    "2026-08",
    NO_COMMUNITY
  );
  assert.strictEqual(v.ok, false);
  assert.deepStrictEqual(v.problems, ["empty-evidence"]);
});

check("BREAK: an approval dated before the review round is refused", () => {
  // This is the exact inversion the old Step 6b encoded — the founder's gate
  // placed before she was shown the issue.
  const v = assessChain(
    ledgerWith({
      test: stage("2026-08-10T00:00:00.000Z"),
      review: stage("2026-08-12T00:00:00.000Z"),
      approval: { at: "2026-08-11T00:00:00.000Z", by: "Mahsa", evidence: "Slack" },
    }),
    "2026-08",
    NO_COMMUNITY
  );
  assert.strictEqual(v.ok, false);
  assert.deepStrictEqual(v.problems, ["out-of-order"]);
  assert.ok(v.lines.some((l) => l.includes("BEFORE the review round")));
});

check("BREAK: a review round dated before the test send is refused", () => {
  const v = assessChain(
    ledgerWith({
      test: stage("2026-08-12T00:00:00.000Z"),
      review: stage("2026-08-10T00:00:00.000Z"),
      approval: { at: "2026-08-13T00:00:00.000Z", by: "Mahsa", evidence: "Slack" },
    }),
    "2026-08",
    NO_COMMUNITY
  );
  assert.strictEqual(v.ok, false);
  assert.ok(v.problems.includes("out-of-order"));
});

check("PASS: a complete, in-order chain is allowed", () => {
  const v = assessChain(
    ledgerWith({
      test: stage("2026-08-10T00:00:00.000Z"),
      review: stage("2026-08-11T00:00:00.000Z"),
      approval: {
        at: "2026-08-12T00:00:00.000Z",
        by: "Mahsa",
        evidence: "https://shesharp.slack.com/archives/C123/p456",
      },
    }),
    "2026-08",
    NO_COMMUNITY
  );
  assert.deepStrictEqual(v.problems, []);
  assert.strictEqual(v.ok, true);
});

// ---------------------------------------------------------------------------
// Breaking the frequency cap
// ---------------------------------------------------------------------------

/** A complete chain, so only the frequency cap can be what refuses. */
function approvedLedger(): IssueLedger {
  return ledgerWith({
    test: stage("2026-08-10T00:00:00.000Z"),
    review: stage("2026-08-11T00:00:00.000Z"),
    approval: { at: "2026-08-12T00:00:00.000Z", by: "Mahsa", evidence: "Slack permalink" },
  });
}

/** Three community sends dated now, so they land in the current NZ month. */
function communityAtCap(name: string, count: number): string {
  const now = new Date().toISOString();
  const entries: Record<string, unknown> = {};
  for (let i = 0; i < count; i++) {
    entries[`announcement-${i}`] = {
      broadcastId: `bc_${i}`,
      status: "sent",
      segment: "Newsletter",
      htmlSha256: "0".repeat(64),
      createdAt: now,
      scheduledAt: null,
      sentAt: now,
      digest: `test fixture ${i}`,
    };
  }
  return communityLedger(name, entries);
}

check("BREAK: a fourth marketing send in one month is refused", () => {
  const v = assessChain(approvedLedger(), "2026-08", communityAtCap("community-3.json", 3));
  assert.strictEqual(v.ok, false);
  assert.deepStrictEqual(v.problems, ["frequency-cap"]);
  assert.strictEqual(v.existingThisMonth.length, 3);
  assert.ok(v.lines.some((l) => l.includes("0.08%")), "the refusal must say why it matters");
});

check("the third send in a month is still allowed (the cap is 3, not 2)", () => {
  const v = assessChain(approvedLedger(), "2026-08", communityAtCap("community-2.json", 2));
  assert.strictEqual(v.ok, true, v.lines.join("\n"));
});

check("a draft broadcast has reached nobody and does not count", () => {
  const path = communityLedger("community-drafts.json", {
    a: { broadcastId: "b1", status: "draft", createdAt: new Date().toISOString(), sentAt: null },
    b: { broadcastId: "b2", status: "draft", createdAt: new Date().toISOString(), sentAt: null },
    c: { broadcastId: "b3", status: "draft", createdAt: new Date().toISOString(), sentAt: null },
    d: { broadcastId: "b4", status: "draft", createdAt: new Date().toISOString(), sentAt: null },
  });
  assert.deepStrictEqual(readCommunitySends(path), []);
  assert.strictEqual(assessChain(approvedLedger(), "2026-08", path).ok, true);
});

check("a scheduled broadcast DOES count — the inbox is already committed", () => {
  const now = new Date().toISOString();
  const path = communityLedger("community-scheduled.json", {
    a: { broadcastId: "b1", status: "scheduled", createdAt: now, scheduledAt: now },
    b: { broadcastId: "b2", status: "scheduled", createdAt: now, scheduledAt: now },
    c: { broadcastId: "b3", status: "scheduled", createdAt: now, scheduledAt: now },
  });
  assert.strictEqual(readCommunitySends(path).length, 3);
  assert.strictEqual(assessChain(approvedLedger(), "2026-08", path).ok, false);
});

check("a recorded override lets a capped month through, and only that month", () => {
  const now = new Date();
  const month = nzCalendarMonth(now.toISOString());
  const base = approvedLedger();
  base.issues["2026-08"].frequencyOverride = {
    at: now.toISOString(),
    reason: "AGM notice, agreed with the founder",
    observedCount: 3,
    cap: 3,
    month,
  };
  const path = communityAtCap("community-3b.json", 3);
  assert.strictEqual(assessChain(base, "2026-08", path, now).ok, true);

  // An override recorded for a different month must not carry over.
  base.issues["2026-08"].frequencyOverride.month = "1999-01";
  const v = assessChain(base, "2026-08", path, now);
  assert.strictEqual(v.ok, false);
  assert.deepStrictEqual(v.problems, ["frequency-cap"]);
});

check("a ramp counts as ONE send, not one per chunk", () => {
  const now = new Date().toISOString();
  const base = approvedLedger();
  base.issues["2026-07"] = {
    issueId: "2026-07",
    createdAt: now,
    test: stage(now),
    review: stage(now),
    approval: { at: now, by: "Mahsa", evidence: "e" },
    batches: [
      { at: now, chunk: 1, of: 5, recipientCount: 100, idempotencyKey: null },
      { at: now, chunk: 2, of: 5, recipientCount: 100, idempotencyKey: null },
      { at: now, chunk: 3, of: 5, recipientCount: 100, idempotencyKey: null },
      { at: now, chunk: 4, of: 5, recipientCount: 100, idempotencyKey: null },
      { at: now, chunk: 5, of: 5, recipientCount: 100, idempotencyKey: null },
    ],
    frequencyOverride: null,
  };
  const v = assessChain(base, "2026-08", NO_COMMUNITY);
  assert.strictEqual(
    v.existingThisMonth.length,
    1,
    "five chunks of one issue must count as one campaign, not five"
  );
  assert.strictEqual(v.ok, true);
});

check("an issue's own chunks do not lock its own ramp out halfway", () => {
  const now = new Date().toISOString();
  const base = approvedLedger();
  base.issues["2026-08"].batches = [
    { at: now, chunk: 1, of: 3, recipientCount: 100, idempotencyKey: null },
  ];
  const path = communityAtCap("community-2b.json", 2);
  const v = assessChain(base, "2026-08", path);
  assert.strictEqual(v.existingThisMonth.length, 2, "the issue must not count itself");
  assert.strictEqual(v.ok, true);
});

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

check("a corrupt ledger throws rather than reading as 'nothing was approved'", () => {
  const path = join(dir, "corrupt.json");
  writeFileSync(path, "{ this is not json");
  assert.throws(() => loadLedger(path), /not valid JSON/);
});

check("save then load round-trips, with batches sorted by chunk", () => {
  const path = join(dir, "roundtrip.json");
  const now = new Date().toISOString();
  const base = approvedLedger();
  base.issues["2026-08"].batches = [
    { at: now, chunk: 3, of: 3, recipientCount: 49, idempotencyKey: "k3" },
    { at: now, chunk: 1, of: 3, recipientCount: 100, idempotencyKey: "k1" },
  ];
  saveLedger(base, path);
  const back = loadLedger(path);
  assert.deepStrictEqual(
    back.issues["2026-08"].batches.map((b) => b.chunk),
    [1, 3]
  );
  assert.strictEqual(back.issues["2026-08"].approval?.evidence, "Slack permalink");
});

check("no address can reach the saved file", () => {
  const path = join(dir, "no-pii.json");
  const base = approvedLedger();
  base.issues["2026-08"].test = {
    at: new Date().toISOString(),
    recipientCount: 1,
    recipientHashes: [maskAddress("reviewer@shesharp.org.nz")],
    note: "",
  };
  saveLedger(base, path);
  const raw = readFileSync(path, "utf8");
  assert.ok(!raw.includes("@"), "the ledger must never contain an @ from a recipient");
});

// ---------------------------------------------------------------------------
// Month boundaries
// ---------------------------------------------------------------------------

check("months are New Zealand months, not UTC ones", () => {
  // 2026-08-31T21:00Z is 2026-09-01 09:00 in Auckland (NZST, UTC+12).
  assert.strictEqual(nzCalendarMonth("2026-08-31T21:00:00.000Z"), "2026-09");
  assert.strictEqual(nzCalendarMonth("2026-08-31T11:00:00.000Z"), "2026-08");
});

check("an unparseable timestamp does not throw inside the gate", () => {
  assert.strictEqual(nzCalendarMonth("not a date"), "unknown");
  assert.strictEqual(assessFrequency([], "2026-08", 3).exceeded, false);
});

check("a missing community ledger counts as zero rather than crashing", () => {
  assert.deepStrictEqual(readCommunitySends(join(dir, "does-not-exist.json")), []);
});

rmSync(dir, { recursive: true, force: true });

console.log("");
if (failures > 0) {
  console.error(`${failures} check(s) failed.`);
  process.exit(1);
}
console.log("The approval chain refuses every incomplete state it was handed.");
