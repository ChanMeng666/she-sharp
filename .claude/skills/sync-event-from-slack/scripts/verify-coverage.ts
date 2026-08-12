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
 *   npx tsx .../verify-coverage.ts --all              # every conversation, slow
 *   npx tsx .../verify-coverage.ts --enumerate-only   # is anything MISSING? seconds
 *   npx tsx .../verify-coverage.ts --channel C0…      # one, by id or name
 *   npx tsx .../verify-coverage.ts --json
 *
 * Exit code is the number of conversations with uncovered content PLUS the
 * number Slack has that the manifest has never heard of, capped at 250, so it
 * works as a gate.
 *
 * ## Two questions, and the second one is why 97 conversations hid for a year
 *
 * "Is every message in the conversations I know about behind my read position?"
 * is answered by walking the manifest. That is what this file used to do, and
 * on 12 August 2026 it answered YES while 97 archived Slack channels — twelve
 * years of `events-2021-*` through `events-2024-*` — were absent from the
 * manifest entirely. `audit-read-state.ts` said clean, this said verified, and
 * `diff-archive.ts` skipped them: three green gates over a workspace nobody had
 * fully enumerated.
 *
 * None of them was wrong about the question it asked. They were all asking the
 * same question, and it was the wrong one, because A GATE THAT ITERATES THE
 * RECORD CAN ONLY EVER CONFIRM THE RECORD IS SELF-CONSISTENT. To catch a
 * conversation nobody has enumerated, something must enumerate the source of
 * truth. So `--all` now starts from `conversations.list` with
 * `exclude_archived: false` and reports anything Slack has and the manifest does
 * not as `unenumerated` — one extra listing call, and it is the only check in
 * the skill that can find an unknown unknown.
 *
 * Empty conversations are excluded from that count on purpose: eleven app DMs
 * and two unused group DMs will never be in the manifest, and a gate that is
 * permanently red for a reason nobody can fix gets ignored.
 */

import {
  announceIdentity,
  conversationName,
  CONVERSATION_TYPES,
  loadUserNames,
  slack,
} from "./slack-client";
import { loadManifest, threadHasUnread, type ChannelState } from "./state-lib";

const argv = process.argv.slice(2);
const asJson = argv.includes("--json");
/* `--enumerate-only` answers the unknown-unknown question WITHOUT the walk:
   one listing call plus a one-message peek per unrecorded candidate, seconds
   rather than hours. It exists so the check that found 97 hidden conversations
   can run on every sync instead of only on the rare full sweep — a gate nobody
   can afford to run is a gate that does not protect anything. */
const enumerateOnly = argv.includes("--enumerate-only");
const doAll = argv.includes("--all") || enumerateOnly;
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

interface Unenumerated {
  id: string;
  name: string;
  archived: boolean;
}

/**
 * Conversations Slack has that the manifest has never heard of.
 *
 * `exclude_archived: false` is the whole point — the default listing omits
 * archived channels, which is exactly how 97 of them stayed invisible. A
 * conversation is only reported when it actually holds a message: a one-message
 * `conversations.history` peek per candidate, and only for candidates the
 * manifest is missing, so on a healthy workspace this costs nothing beyond the
 * listing itself.
 *
 * An unreadable candidate is skipped rather than reported. That is an access
 * gap, not a record gap, and the triage already says so.
 */
async function findUnenumerated(known: Set<string>): Promise<Unenumerated[]> {
  const out: Unenumerated[] = [];
  const users = await loadUserNames();
  let cursor: string | undefined;
  const candidates: any[] = [];
  do {
    const r = await slack.conversations.list({
      types: CONVERSATION_TYPES,
      limit: 200,
      exclude_archived: false,
      cursor,
    });
    for (const c of (r.channels ?? []) as any[]) if (!known.has(c.id)) candidates.push(c);
    cursor = r.response_metadata?.next_cursor || undefined;
  } while (cursor);

  for (const c of candidates) {
    let hasContent = false;
    try {
      const r = await slack.conversations.history({ channel: c.id, limit: 1 });
      hasContent = ((r.messages ?? []) as any[]).length > 0;
    } catch {
      continue; // access gap, not a record gap
    }
    if (!hasContent) continue; // genuinely empty — never going to be in the manifest
    out.push({
      id: c.id,
      name: conversationName(c, users),
      archived: !!c.is_archived,
    });
  }
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

  /*
   * Enumerate BEFORE walking. It is one listing call, it is the only check that
   * can find a conversation nobody has recorded, and finding out after a
   * two-hour walk that the target list was incomplete is the wrong order.
   * Scoped to --all: the default run is deliberately about the conversations
   * that matter, and --channel is about one.
   */
  let unenumerated: Unenumerated[] = [];
  if (doAll && !one) {
    console.error("Enumerating Slack (including archived) against the manifest…");
    unenumerated = await findUnenumerated(new Set(Object.keys(manifest.channels)));
    if (unenumerated.length) {
      console.error(
        `  ${unenumerated.length} conversation(s) in Slack are not in the manifest.`,
      );
    }
  }

  const gaps: Gap[] = [];
  if (enumerateOnly) {
    targets = [];
  } else {
    console.error(
      `Walking ${targets.length} conversation(s) in full${doAll ? " (--all: slow, expect rate limiting)" : ""}…`,
    );
    let done = 0;
    for (const [id, c] of targets) {
      const gap = await checkOne(id, c);
      if (gap) gaps.push(gap);
      if (++done % 10 === 0) console.error(`  …${done}/${targets.length}`);
    }
  }

  const failures = gaps.length + unenumerated.length;

  if (asJson) {
    process.stdout.write(
      JSON.stringify({ checked: targets.length, gaps, unenumerated }, null, 2) + "\n",
    );
    process.exit(Math.min(failures, 250));
  }

  const when = (ts: string) =>
    ts ? new Date(parseFloat(ts) * 1000).toISOString().replace("T", " ").slice(0, 16) : "-";

  if (unenumerated.length) {
    console.log(
      `\nUNENUMERATED — Slack holds conversations the manifest has never heard of.` +
        `\nThese are invisible to audit-read-state.ts and to the walk below, because both` +
        `\niterate the manifest. Fetch each one in full, then record it:\n`,
    );
    for (const u of unenumerated) {
      console.log(`  ${u.archived ? "archived" : "active  "} ${u.name}  (${u.id})`);
    }
    console.log(
      `\n  npx tsx .claude/skills/sync-event-from-slack/scripts/fetch-channel.ts <id> > <archive>/raw/<id>.json` +
        `\n  npx tsx .claude/skills/sync-event-from-slack/scripts/update-state.ts --from <archive>/raw/<id>.json --mapping <event|skip|none>\n`,
    );
  }

  if (!gaps.length && !unenumerated.length) {
    console.log(
      enumerateOnly
        ? `\nEnumeration verified: every conversation Slack holds — archived included — is in the` +
            `\nmanifest. This does NOT check read positions; run without --enumerate-only for that.\n`
        : `\nCoverage verified against Slack: every conversation Slack holds is in the manifest,` +
            `\nand ${targets.length} of them were walked in full — every top-level message and every` +
            `\nthread reply is behind the recorded read position.\n`,
    );
    process.exit(0);
  }

  if (!gaps.length) {
    console.log(
      enumerateOnly
        ? `${unenumerated.length} unenumerated conversation(s). Read positions were not checked.\n`
        : `${unenumerated.length} unenumerated conversation(s). The ${targets.length} the manifest` +
            ` does know about are fully read.\n`,
    );
    process.exit(Math.min(failures, 250));
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
      `\nthen record with update-state.ts --from <payload>.` +
      (unenumerated.length
        ? `\nPlus ${unenumerated.length} unenumerated — see above; those are not in the ${targets.length}.`
        : "") +
      `\n`,
  );
  process.exit(Math.min(failures, 250));
}

main().catch((e) => {
  console.error(e);
  process.exit(255);
});
