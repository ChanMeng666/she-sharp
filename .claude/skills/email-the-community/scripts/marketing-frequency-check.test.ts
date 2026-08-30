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
 * Fixtures go to the OS temp directory, never to the skill's committed state
 * files, so a run leaves nothing a colleague could mistake for a real send.
 */

import assert from "node:assert";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  assessFrequency,
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
// The happy path, last — a gate that refuses everything must fail here
// ---------------------------------------------------------------------------

test("an empty month is within the cap", () => {
  const verdict = assessFrequency([], currentNzMonth(), DEFAULT_MONTHLY_CAP);
  assert.strictEqual(verdict.exceeded, false);
  assert.strictEqual(verdict.existing.length, 0);
});

rmSync(dir, { recursive: true, force: true });
if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log("\nAll marketing-frequency checks passed.");
