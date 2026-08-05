/**
 * Read-position rules for the Slack sync skill.
 *
 * Run: npx tsx .claude/skills/sync-event-from-slack/scripts/state-lib.test.ts
 *
 * WHAT THIS FILE IS FOR. On 4 August 2026 six replies landed on a thread whose
 * parent already sat below the channel's watermark. The delta fetch returned
 * nothing, the triage table called the channel quiet, and the state writer
 * recorded every one of those replies as read. They carried the event owner's
 * thirteen-item review of a deck due on a projector three days later, and the
 * only reason anyone found them was that a human pasted the Slack permalink.
 *
 * Every assertion below fails against the code as it stood that morning. The
 * two rules they encode — an absent record means unread, and a read receipt may
 * only describe what was actually read — are not obvious from either call site,
 * which is exactly why they live in one function with one test rather than in
 * two hand-written copies that drifted apart.
 */

import assert from "node:assert";

import {
  mergeThreadState,
  threadHasUnread,
  type ThreadState,
} from "./state-lib";

let failures = 0;

function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ok - ${name}`);
  } catch (error) {
    failures++;
    console.log(`  FAIL - ${name}`);
    console.log(`         ${(error as Error).message}`);
  }
}

console.log("\nthreadHasUnread");

check("a thread nobody has ever recorded is unread", () => {
  // THE 4 AUGUST CASE. The parent was posted with no replies, so it was never
  // written to the manifest; requiring a prior record hid it completely.
  assert.strictEqual(
    threadHasUnread({ ts: "1785826569.040569", reply_count: 6, latest_reply: "1785923376.717809" }, undefined),
    true,
  );
});

check("a message with no replies is not a thread at all", () => {
  assert.strictEqual(threadHasUnread({ ts: "1.1", reply_count: 0 }, undefined), false);
  assert.strictEqual(threadHasUnread({ ts: "1.1" }, undefined), false);
});

check("a thread at the recorded count is read", () => {
  const known: ThreadState = { replyCount: 6, latestReplyTs: "1785923376.717809" };
  assert.strictEqual(
    threadHasUnread({ ts: "1.1", reply_count: 6, latest_reply: "1785923376.717809" }, known),
    false,
  );
});

check("one more reply than recorded is unread", () => {
  const known: ThreadState = { replyCount: 6, latestReplyTs: "1785923376.717809" };
  assert.strictEqual(
    threadHasUnread({ ts: "1.1", reply_count: 7, latest_reply: "1785999999.000000" }, known),
    true,
  );
});

check("a newer reply at the same count is unread", () => {
  // One reply added and one deleted holds the count still. Checking the count
  // alone would call this read.
  const known: ThreadState = { replyCount: 6, latestReplyTs: "1785923376.717809" };
  assert.strictEqual(
    threadHasUnread({ ts: "1.1", reply_count: 6, latest_reply: "1785999999.000000" }, known),
    true,
  );
});

console.log("\nmergeThreadState");

const PARENTS = [
  { ts: "100.0", reply_count: 6, latest_reply: "160.0" }, // grew, delivered
  { ts: "200.0", reply_count: 3, latest_reply: "230.0" }, // grew, NOT delivered
  { ts: "300.0", reply_count: 2, latest_reply: "320.0" }, // unchanged
  { ts: "400.0", reply_count: 0 }, // not a thread
];

const PRIOR: Record<string, ThreadState> = {
  "100.0": { replyCount: 1, latestReplyTs: "110.0" },
  "200.0": { replyCount: 1, latestReplyTs: "210.0" },
  "300.0": { replyCount: 2, latestReplyTs: "320.0" },
};

check("a delivered thread advances to its current state", () => {
  const out = mergeThreadState(PARENTS, new Set(["100.0"]), PRIOR);
  assert.deepStrictEqual(out["100.0"], { replyCount: 6, latestReplyTs: "160.0" });
});

check("an undelivered thread keeps the state it had, not the state it is in", () => {
  // THE DANGEROUS ONE. Writing the current state here is what turned a missed
  // delivery into a permanent one: the next run would see nothing to fetch.
  const out = mergeThreadState(PARENTS, new Set(["100.0"]), PRIOR);
  assert.deepStrictEqual(out["200.0"], { replyCount: 1, latestReplyTs: "210.0" });
});

check("an undelivered thread nobody has ever seen is not recorded", () => {
  const out = mergeThreadState(PARENTS, new Set(["100.0"]), {});
  assert.strictEqual(out["200.0"], undefined);
  // …and it still reads as unread on the next run, which is the whole point.
  assert.strictEqual(threadHasUnread(PARENTS[1], out["200.0"]), true);
});

check("a message with no replies never enters the receipt", () => {
  const out = mergeThreadState(PARENTS, new Set(["400.0"]), PRIOR);
  assert.strictEqual(out["400.0"], undefined);
});

check("delivering everything reproduces the full current state", () => {
  const out = mergeThreadState(PARENTS, new Set(["100.0", "200.0", "300.0"]), PRIOR);
  assert.deepStrictEqual(out, {
    "100.0": { replyCount: 6, latestReplyTs: "160.0" },
    "200.0": { replyCount: 3, latestReplyTs: "230.0" },
    "300.0": { replyCount: 2, latestReplyTs: "320.0" },
  });
});

console.log(
  failures === 0
    ? "\nAll read-position checks passed.\n"
    : `\n${failures} check(s) FAILED.\n`,
);
process.exit(failures === 0 ? 0 : 1);
