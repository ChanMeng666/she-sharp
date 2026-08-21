/**
 * Answers one question: is anything in the workspace scored but never read?
 *
 * WHY THIS EXISTS. Four separate misses in this skill had the same shape — the
 * manifest recorded "read" for content nobody had been shown. Each was fixed
 * where it happened, and each time the next one was invisible until a human
 * pasted a Slack permalink. Fixing bugs one at a time was never going to end,
 * because there was no way to ASK the question.
 *
 * The manifest now keeps two positions per conversation: `watermarkTs`, which
 * only a real fetch payload can move, and `scannedTs`, which the triage moves
 * when it scores a conversation and finds nothing worth surfacing. The gap
 * between them is the unread backlog, and this prints it.
 *
 * Only conversations where being behind MATTERS are counted: a mapped event, or
 * a `skip` marked `alwaysRead` (the DMs of the people who send work). A bot
 * channel the triage dismissed is not a backlog — that is what the signal gate
 * is for.
 *
 * Run it at the END of every sync, after `update-state.ts`. Non-zero exit means
 * something is unread, so it also works as a CI or pre-commit gate.
 *
 *   npx tsx .../audit-read-state.ts          # report, exit 1 if anything unread
 *   npx tsx .../audit-read-state.ts --json   # machine-readable
 */

import { loadManifest, unreadConversations } from "./state-lib";

const asJson = process.argv.includes("--json");

const manifest = loadManifest();
const unread = unreadConversations(manifest);
const total = Object.keys(manifest.channels).length;

if (asJson) {
  process.stdout.write(JSON.stringify({ total, unread }, null, 2) + "\n");
  process.exit(unread.length ? 1 : 0);
}

const when = (ts: string) =>
  ts && ts !== "0"
    ? new Date(parseFloat(ts) * 1000).toISOString().replace("T", " ").slice(0, 16)
    : "never";

if (!unread.length) {
  console.log(
    `\nRead state is clean — every mapped event and always-read conversation has been read to its scan position (${total} tracked).\n`,
  );
  process.exit(0);
}

/* Three different problems, and only one is "somebody is behind". A
   never-triaged conversation has an UNKNOWN backlog rather than a measured
   one, and the fix is to run the triage, not to fetch a delta. */
const LABEL = {
  "never-read": "NEVER READ    — no payload has ever been delivered for it",
  "never-triaged": "NEVER TRIAGED — no scan position, so the backlog is UNKNOWN",
  behind: "BEHIND        — the triage scored past content nobody has read",
} as const;

console.log(`\nUNREAD:\n`);
for (const c of unread) {
  console.log(`  ${c.type.padEnd(7)} ${c.name}`);
  console.log(`          ${LABEL[c.reason]}`);
  console.log(`          read to ${when(c.watermarkTs)}   scanned to ${when(c.scannedTs)}`);
  console.log(
    c.reason === "never-triaged"
      ? "          npx tsx .claude/skills/sync-event-from-slack/scripts/discover-channels.ts"
      : `          npx tsx .claude/skills/sync-event-from-slack/scripts/fetch-channel.ts ${c.id} --state > /tmp/d.json`,
  );
}
const counts = unread.reduce<Record<string, number>>((a, c) => {
  a[c.reason] = (a[c.reason] ?? 0) + 1;
  return a;
}, {});
const part = (k: string, s: string) => (counts[k] ? `${counts[k]} ${s}` : null);

console.log(
  `\n${unread.length} of ${total} conversation(s): ` +
    [part("never-triaged", "never triaged"), part("never-read", "never read"), part("behind", "behind")]
      .filter(Boolean)
      .join(" · ") +
    `.` +
    (counts["never-triaged"]
      ? `\nRun discover-channels.ts first — a conversation with no scan position has an` +
        `\nUNKNOWN backlog, not a zero one, and the triage is what measures it.`
      : "") +
    `\nFor the rest: fetch with --state, read it with render-delta.ts, then record it` +
    `\nwith update-state.ts --from <payload>. Nothing else moves the read position.\n`,
);
process.exit(1);
