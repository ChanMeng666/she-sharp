/**
 * ONE-TIME MIGRATION. Restores the read receipts `saveManifest` destroyed.
 *
 * WHY THIS EXISTS
 * `saveManifest` rebuilds every channel entry from a fixed key list, and until
 * 2026-08-07 that list omitted `readAt`. `update-state.ts` had been setting the
 * field from every fetch payload for as long as it existed; every one of those
 * writes was dropped on the way to disk. Commit 2f061338 fixed the write, which
 * meant new reads persisted — and left 109 historical entries with a real
 * `watermarkTs` and no receipt to explain it.
 *
 * `unreadConversations()` reads a missing `readAt` as NEVER READ. That is the
 * correct reading of an empty field, so the audit went red on all 109 and
 * stayed red on every pull request afterwards. A gate that is always red proves
 * nothing and gets ignored, which is precisely the failure it was written to
 * prevent.
 *
 * WHAT THIS DOES NOT DO
 * It does not assert that anybody read anything. It cannot: the evidence was
 * destroyed, and inventing it is the exact failure — a manifest claiming "read"
 * for content nobody was shown — that the scanned/read split exists to stop.
 *
 * WHAT IT DOES INSTEAD
 * For each candidate it walks the conversation in Slack, in full: every
 * top-level message, and every reply on every parent that has replies. If
 * anything at all sits past the recorded position it stamps NOTHING and reports
 * the gap for a human to fetch and read properly. Only a conversation Slack
 * itself says is entirely behind the read position gets a receipt, and that
 * receipt is marked `readAtSource` so it is legible forever as the weaker
 * claim it is: "no unread content, verified on this date", not "a human was
 * shown this".
 *
 * It is idempotent, and it is meant to become useless. An entry that already
 * has a `readAt` is never touched, so a second run does nothing. If it ever
 * finds work again, something has gone wrong with `saveManifest` a second time.
 *
 *   npx tsx .../backfill-read-receipts.ts            # report only, changes nothing
 *   npx tsx .../backfill-read-receipts.ts --apply    # walk, prove, then write
 *
 * Dry run is the default because this writes the committed manifest.
 */

import { slack } from "./slack-client";
import {
  loadManifest,
  saveManifest,
  threadHasUnread,
  type ChannelState,
} from "./state-lib";

const apply = process.argv.includes("--apply");

/** Stamped into `readAtSource`, so the basis is readable without this file. */
const PROVENANCE =
  "backfill-read-receipts.ts — receipt lost to the saveManifest key-list bug " +
  "(fixed in 2f061338); no unread content, verified against Slack on";

/** Every top-level message, oldest first. Pages to the end — no cap. */
async function fullHistory(channelId: string): Promise<any[]> {
  const out: any[] = [];
  let cursor: string | undefined;
  do {
    const r = await slack.conversations.history({
      channel: channelId,
      limit: 200,
      cursor,
    });
    out.push(...((r.messages ?? []) as any[]));
    cursor = r.response_metadata?.next_cursor || undefined;
  } while (cursor);
  return out;
}

/** Every reply on a parent, paged to the end. */
async function fullThread(channelId: string, ts: string): Promise<any[]> {
  const out: any[] = [];
  let cursor: string | undefined;
  do {
    const r = await slack.conversations.replies({
      channel: channelId,
      ts,
      limit: 200,
      cursor,
    });
    for (const m of (r.messages ?? []) as any[]) if (m.ts !== ts) out.push(m);
    cursor = r.response_metadata?.next_cursor || undefined;
  } while (cursor);
  return out;
}

type Verdict =
  | { kind: "covered" }
  | { kind: "uncovered"; topLevel: number; replies: number }
  | { kind: "unreachable" };

/**
 * Asks Slack whether anything in this conversation is past the read position.
 *
 * Deliberately the same question, and the same arithmetic, as
 * `verify-coverage.ts` — including `threadHasUnread`, which is the one place
 * the "does this thread carry unseen replies" rule is allowed to live. Two
 * implementations of that rule disagreed once already and hid an event owner's
 * entire review of a deck.
 */
async function verdictFor(id: string, c: ChannelState): Promise<Verdict> {
  let history: any[];
  try {
    history = await fullHistory(id);
  } catch {
    // Left the channel, archived, scope revoked. Not provable either way, so
    // it does not get a receipt.
    return { kind: "unreachable" };
  }

  const watermark = Number(c.watermarkTs || 0);
  let topLevel = 0;
  let replies = 0;

  for (const m of history) {
    if (Number(m.ts) > watermark) topLevel++;
    if ((m.reply_count ?? 0) > 0) {
      const known = c.threads?.[m.ts];
      if (!threadHasUnread(m, known)) continue;
      try {
        const all = await fullThread(id, m.ts);
        const seen = Number(known?.latestReplyTs ?? 0);
        replies += all.filter((r) => Number(r.ts) > seen).length;
      } catch {
        return { kind: "unreachable" };
      }
    }
  }

  return topLevel || replies
    ? { kind: "uncovered", topLevel, replies }
    : { kind: "covered" };
}

async function main() {
  const manifest = loadManifest();
  const entries = Object.entries(manifest.channels);

  // Only entries that already carry a real position. A watermark of "0" means
  // never fetched, which is a genuine hole and not this script's business.
  const candidates = entries.filter(
    ([, c]) => !c.readAt && c.watermarkTs && c.watermarkTs !== "0",
  );

  if (!candidates.length) {
    console.log(
      "\nNothing to backfill — every conversation with a read position already " +
        "carries its receipt.\n",
    );
    return;
  }

  console.log(
    `\n${candidates.length} conversation(s) carry a read position and no receipt.` +
      `\nWalking each one in Slack before deciding${apply ? "" : " (DRY RUN — nothing will be written)"}…\n`,
  );

  const stamped: string[] = [];
  const gaps: string[] = [];
  const unreachable: string[] = [];
  const stampedAt = new Date().toISOString();

  let n = 0;
  for (const [id, c] of candidates) {
    n += 1;
    if (n % 10 === 0) console.log(`  …${n}/${candidates.length}`);

    const verdict = await verdictFor(id, c);
    if (verdict.kind === "covered") {
      stamped.push(c.name);
      if (apply) {
        c.readAt = stampedAt;
        c.readAtSource = `${PROVENANCE} ${stampedAt.slice(0, 10)}`;
      }
    } else if (verdict.kind === "uncovered") {
      gaps.push(
        `  ${c.name} — ${verdict.topLevel} top-level, ${verdict.replies} thread replies\n` +
          `          npx tsx .claude/skills/sync-event-from-slack/scripts/fetch-channel.ts ${id} --state > /tmp/d.json`,
      );
    } else {
      unreachable.push(c.name);
    }
  }

  if (apply && stamped.length) saveManifest(manifest);

  console.log(
    `\n${apply ? "Stamped" : "Would stamp"} ${stamped.length} receipt(s).`,
  );
  if (unreachable.length) {
    console.log(
      `\n${unreachable.length} conversation(s) could not be read from Slack and were left alone:\n  ` +
        unreachable.join("\n  "),
    );
  }
  if (gaps.length) {
    console.log(
      `\nNOT stamped — Slack holds content past the recorded position. Read these properly:\n` +
        gaps.join("\n"),
    );
  }
  if (!apply) console.log("\nRe-run with --apply to write.\n");
  else console.log("\nRun audit-read-state.ts to confirm.\n");

  // Non-zero when something real is still unread, so this cannot be mistaken
  // for a clean finish.
  if (gaps.length) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
