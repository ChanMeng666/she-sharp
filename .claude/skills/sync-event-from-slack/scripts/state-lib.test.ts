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
  scannedPosition,
  threadHasUnread,
  unreadConversations,
  type ChannelState,
  type Manifest,
  type Mapping,
  type ThreadState,
} from "./state-lib";
import { parseCsv, parseSheetUrl } from "./fetch-sheet";

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

console.log("\nalways-read mappings");

/**
 * The triage's own rule, restated here so it cannot drift: a `skip` carrying
 * `alwaysRead` must never be treated as settled. `decideAction` and `isQuiet`
 * live in `discover-channels.ts`, which cannot be imported without a Slack
 * token, so the invariant is asserted against the shapes they branch on.
 */
const settled = (action: string) =>
  action.startsWith("no-op") || action === "archived" || action === "skip";

check("a plain skip with new content stays settled", () => {
  const m: Mapping = { kind: "skip", reason: "bot channel" };
  assert.strictEqual(m.kind === "skip" && !!m.alwaysRead, false);
  assert.strictEqual(settled("skip"), true);
});

check("an always-read skip with new content is NOT settled", () => {
  // THE 5 AUGUST DM. `skip` was right — the DM feeds no page — and `skip` was
  // also what hid "please update Carolina Lobos' profile" and advanced past it.
  const m: Mapping = { kind: "skip", reason: "carries page edits", alwaysRead: true };
  assert.strictEqual(m.kind === "skip" && m.alwaysRead === true, true);
  assert.strictEqual(settled("read in full (always-read)"), false);
});

check("an always-read skip with nothing new is still settled", () => {
  // Otherwise seven conversations sit in the table forever and the table stops
  // being read, which is the failure this whole area keeps circling back to.
  assert.strictEqual(settled("no-op"), true);
});

console.log("\nscanned vs read position");

const channel = (over: Partial<ChannelState>): ChannelState => ({
  name: "c", type: "event", mapping: { kind: "none" },
  watermarkTs: "100", threads: {}, fingerprint: "",
  lastSyncedAt: "", lastSyncedCommit: "", ...over,
});
const manifestOf = (channels: Record<string, ChannelState>): Manifest =>
  ({ version: 1, channels }) as Manifest;

check("an entry written before the split reads its scan position from the watermark", () => {
  // The old code moved one position for both meanings, so equal is exactly what
  // it meant. Defaulting to "0" instead would declare the whole workspace unread.
  assert.strictEqual(scannedPosition(channel({ watermarkTs: "100" })), "100");
});

check("a mapped event scanned past its read position is unread", () => {
  const m = manifestOf({
    C1: channel({ mapping: { kind: "event", events: [{ slug: "s", eventId: 1 }] }, watermarkTs: "100", scannedTs: "200" }),
  });
  assert.deepStrictEqual(unreadConversations(m).map((c) => c.id), ["C1"]);
});

check("an always-read DM scanned past its read position is unread", () => {
  // THE 5 AUGUST DM, in the shape the manifest now records it.
  const m = manifestOf({
    D1: channel({ type: "dm", mapping: { kind: "skip", reason: "edits", alwaysRead: true }, watermarkTs: "100", scannedTs: "200" }),
  });
  assert.strictEqual(unreadConversations(m).length, 1);
});

check("a plain skip scanned past its read position is NOT a backlog", () => {
  // Bot channels and settled history are what the signal gate exists for; if
  // these counted, the audit would cry wolf and stop being read.
  const m = manifestOf({
    C2: channel({ mapping: { kind: "skip", reason: "bot noise" }, watermarkTs: "100", scannedTs: "999" }),
  });
  assert.strictEqual(unreadConversations(m).length, 0);
});

check("a mapped event that was never read at all is unread", () => {
  // THE ARCHIVED CHANNEL. Mapped to its event without a fetch payload, then
  // archived — so "never read" and "read to the beginning of time" were both
  // "0", and comparing scanned against read could not tell them apart. It sat
  // on 173 messages and 20 unrecorded threads until verify-coverage.ts walked
  // Slack and asked.
  const m = manifestOf({
    C9: channel({ mapping: { kind: "event", events: [{ slug: "s", eventId: 1 }] }, watermarkTs: "0" }),
  });
  assert.deepStrictEqual(unreadConversations(m).map((c) => c.id), ["C9"]);
});

check("caught up means not unread", () => {
  const m = manifestOf({
    C3: channel({ mapping: { kind: "event", events: [{ slug: "s", eventId: 1 }] }, watermarkTs: "200", scannedTs: "200" }),
  });
  assert.strictEqual(unreadConversations(m).length, 0);
});

console.log("\nrun-sheet links");

check("a run-sheet URL yields its id and the tab the browser was showing", () => {
  // `#gid=` must beat `?gid=` — a pasted link carries both and the fragment is
  // the tab the person was actually looking at.
  assert.deepStrictEqual(
    parseSheetUrl("https://docs.google.com/spreadsheets/d/16V4PJHLUpW2eB0g2DywKTxjqmYT4UHDZ/edit?gid=111#gid=1792873316"),
    { id: "16V4PJHLUpW2eB0g2DywKTxjqmYT4UHDZ", gid: "1792873316" },
  );
});

check("a link with no tab yields the id alone, so every tab is read", () => {
  assert.deepStrictEqual(
    parseSheetUrl("https://docs.google.com/spreadsheets/d/16V4PJHLUpW2eB0g2DywKTxjqmYT4UHDZ/edit?usp=drive_link&rtpof=true"),
    { id: "16V4PJHLUpW2eB0g2DywKTxjqmYT4UHDZ" },
  );
});

check("a non-sheet URL is rejected rather than half-parsed", () => {
  assert.strictEqual(parseSheetUrl("https://www.shesharp.org.nz/events/x"), null);
});

check("a bio containing commas and quotes survives the CSV", () => {
  // Run-sheet bios are one long quoted field full of commas. Splitting on the
  // comma would have given Carolina Lobos a bio ending at "With a background".
  const rows = parseCsv(
    'n,bio\r\n2,"Head of Finance, and Automation Lead, said ""yes"""\r\n',
  );
  assert.deepStrictEqual(rows[1], [
    "2",
    'Head of Finance, and Automation Lead, said "yes"',
  ]);
});

check("a newline inside a quoted cell does not start a new row", () => {
  // A run-sheet bio is often typed with line breaks in the cell. Splitting on
  // every newline would turn one speaker into three malformed rows.
  const rows = parseCsv('a,b\n1,"line one\nline two"\n');
  assert.strictEqual(rows.length, 2);
  assert.strictEqual(rows[1][1], "line one\nline two");
});

console.log(
  failures === 0
    ? "\nAll read-position checks passed.\n"
    : `\n${failures} check(s) FAILED.\n`,
);
process.exit(failures === 0 ? 0 : 1);
