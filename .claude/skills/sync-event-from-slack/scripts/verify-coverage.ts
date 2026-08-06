/**
 * Walks Slack itself and counts what the manifest has not covered.
 *
 * `audit-read-state.ts` compares two numbers already in the manifest, so it is
 * free and runs in CI — but it can only catch a gap the triage noticed. This
 * asks Slack, message by message and reply by reply, and is therefore the only
 * check that can catch a gap nothing noticed. It is the difference between
 * "I believe nothing is missing" and "here is the count".
 *
 * For each conversation it pages the ENTIRE history, expands EVERY thread that
 * has replies, and reports:
 *
 *   unread top-level  ts > watermarkTs
 *   unread replies    reply ts > threads[parent].latestReplyTs, or every reply
 *                     when the parent has no thread record at all
 *
 * Default targets are the conversations where being behind costs something: a
 * mapped event, or a `skip` marked `alwaysRead`. `--all` covers every readable
 * conversation in the manifest and is the slow, definitive sweep — expect
 * `conversations.replies` rate limiting, and let it grind.
 *
 *   npx tsx .../verify-coverage.ts                    # the ones that matter
 *   npx tsx .../verify-coverage.ts --all              # every conversation
 *   npx tsx .../verify-coverage.ts --channel C0…      # one, by id or name
 *   npx tsx .../verify-coverage.ts --json
 *
 * Exit code is the number of conversations with uncovered content, capped at
 * 250, so it works as a gate.
 */

import { announceIdentity, slack } from "./slack-client";
import { loadManifest, threadHasUnread, type ChannelState } from "./state-lib";

const argv = process.argv.slice(2);
const asJson = argv.includes("--json");
const doAll = argv.includes("--all");
const one = (() => {
  const i = argv.indexOf("--channel");
  return i >= 0 ? argv[i + 1] : undefined;
})();

interface Gap {
  id: string;
  name: string;
  type: string;
  unreadTopLevel: number;
  unreadReplies: number;
  oldestUnreadTs: string;
  threadsNeverRecorded: number;
}

function matters(c: ChannelState): boolean {
  return (
    c.mapping?.kind === "event" ||
    (c.mapping?.kind === "skip" && !!c.mapping.alwaysRead)
  );
}

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
  return out.sort((a, b) => Number(a.ts) - Number(b.ts));
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

async function checkOne(id: string, c: ChannelState): Promise<Gap | null> {
  let history: any[];
  try {
    history = await fullHistory(id);
  } catch {
    // Unreadable now (left the channel, archived, revoked scope). Not a gap in
    // the record — a gap in access, which the triage already reports.
    return null;
  }

  const watermark = Number(c.watermarkTs || 0);
  let unreadTopLevel = 0;
  let unreadReplies = 0;
  let threadsNeverRecorded = 0;
  let oldestUnreadTs = "";

  const note = (ts: string) => {
    if (!oldestUnreadTs || Number(ts) < Number(oldestUnreadTs)) oldestUnreadTs = ts;
  };

  for (const m of history) {
    if (Number(m.ts) > watermark) {
      unreadTopLevel++;
      note(m.ts);
    }
    if ((m.reply_count ?? 0) > 0) {
      const known = c.threads?.[m.ts];
      if (!known) threadsNeverRecorded++;
      if (!threadHasUnread(m, known)) continue;
      const replies = await fullThread(id, m.ts);
      for (const r of replies) {
        // A reply on a parent the model has never been shown is already counted
        // by the parent being unread; counting it twice inflates the number and
        // makes the report harder to act on.
        if (Number(m.ts) > watermark) continue;
        if (!known || Number(r.ts) > Number(known.latestReplyTs)) {
          unreadReplies++;
          note(r.ts);
        }
      }
    }
  }

  if (!unreadTopLevel && !unreadReplies) return null;
  return {
    id,
    name: c.name,
    type: c.type,
    unreadTopLevel,
    unreadReplies,
    oldestUnreadTs,
    threadsNeverRecorded,
  };
}

async function main() {
  announceIdentity();
  const manifest = loadManifest();

  let targets = Object.entries(manifest.channels);
  if (one) {
    targets = targets.filter(([id, c]) => id === one || c.name === one);
    if (!targets.length) {
      console.error(`No conversation matching "${one}" in the manifest.`);
      process.exit(2);
    }
  } else if (!doAll) {
    targets = targets.filter(([, c]) => matters(c));
  }

  console.error(
    `Walking ${targets.length} conversation(s) in full${doAll ? " (--all: slow, expect rate limiting)" : ""}…`,
  );

  const gaps: Gap[] = [];
  let done = 0;
  for (const [id, c] of targets) {
    const gap = await checkOne(id, c);
    if (gap) gaps.push(gap);
    if (++done % 10 === 0) console.error(`  …${done}/${targets.length}`);
  }

  if (asJson) {
    process.stdout.write(
      JSON.stringify({ checked: targets.length, gaps }, null, 2) + "\n",
    );
    process.exit(Math.min(gaps.length, 250));
  }

  const when = (ts: string) =>
    ts ? new Date(parseFloat(ts) * 1000).toISOString().replace("T", " ").slice(0, 16) : "-";

  if (!gaps.length) {
    console.log(
      `\nCoverage verified against Slack: ${targets.length} conversation(s) walked in full,` +
        `\nevery top-level message and every thread reply is behind the recorded read position.\n`,
    );
    process.exit(0);
  }

  console.log(`\nUNCOVERED — Slack holds content the manifest has not recorded as read:\n`);
  for (const g of gaps) {
    console.log(`  ${g.type.padEnd(7)} ${g.name}`);
    console.log(
      `          ${g.unreadTopLevel} top-level, ${g.unreadReplies} thread repl${g.unreadReplies === 1 ? "y" : "ies"}` +
        `, oldest ${when(g.oldestUnreadTs)}` +
        (g.threadsNeverRecorded ? `, ${g.threadsNeverRecorded} thread(s) never recorded` : ""),
    );
    console.log(
      `          npx tsx .claude/skills/sync-event-from-slack/scripts/fetch-channel.ts ${g.id} --state > /tmp/d.json`,
    );
  }
  console.log(
    `\n${gaps.length} of ${targets.length} conversation(s) uncovered. Fetch, read with render-delta.ts,` +
      `\nthen record with update-state.ts --from <payload>.\n`,
  );
  process.exit(Math.min(gaps.length, 250));
}

main().catch((e) => {
  console.error(e);
  process.exit(255);
});
