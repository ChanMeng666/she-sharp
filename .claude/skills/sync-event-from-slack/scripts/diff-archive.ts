/**
 * Answers one question: which conversations in the verbatim Slack archive are
 * out of date, so that only those need refetching.
 *
 *   npx tsx .claude/skills/sync-event-from-slack/scripts/diff-archive.ts \
 *     --archive D:/github_repository/she-sharp-slack-archive > stale.json
 *
 * Run from the repo root like every other script in this skill. Diagnostics go
 * to stderr; stdout is the JSON report.
 *
 * WHY THIS EXISTS RATHER THAN REUSING `discover-channels.ts`
 *
 * The triage compares Slack against `state/sync-state.json` — what the MODEL
 * has read. The archive is a different artifact with its own position, and the
 * two drift apart every time the skill runs without the archive being rebuilt.
 * They happen to be nearly identical today, which is exactly the kind of
 * coincidence that turns into a silent miss in a month. This file compares
 * Slack against `raw/*.json` and nothing else.
 *
 * WHY A FULL HISTORY WALK, WHEN ONE PAGE WOULD SHOW THE NEWEST MESSAGE
 *
 * Because a reply does not move its parent. A thread from 2019 can gain a
 * reply today and the conversation's newest top-level ts will not move at all.
 * Seven of the 110 archived payloads already have a thread reply newer than
 * their own `_meta.newWatermarkTs` — `general`, `contact-form-notifications`
 * and `event-aut-linkedin-15-may-2026` among them. A detector that only
 * compared top-level watermarks would call those conversations current while
 * they were missing replies. So every page is walked and every parent is
 * checked against the archive's `_meta.threadState`, using `threadHasUnread`
 * from `state-lib.ts` — the one place in this skill that answers "has this
 * thread grown", deliberately not reimplemented here.
 *
 * THIS SCRIPT WRITES NOTHING. It does not touch `sync-state.json`, it does not
 * touch the archive, and it does not advance any read position. Detecting that
 * something is stale is not the same as having read it.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import {
  slack,
  announceIdentity,
  isReadable,
  CONVERSATION_TYPES,
  loadUserNames,
  conversationName,
} from "./slack-client";
import { threadHasUnread, type ThreadFacts, type ThreadState } from "./state-lib";

interface ArchiveMeta {
  mode?: string;
  since?: string | null;
  newWatermarkTs?: string;
  threadState?: Record<string, ThreadState>;
}

interface StaleEntry {
  id: string;
  name: string;
  reasons: string[];
  archiveWatermarkTs: string;
  slackWatermarkTs: string;
  grownThreads: number;
  archivedThreadCount: number;
  archivedMessageCount: number;
  slackMessageCount: number;
}

interface Report {
  archive: string;
  archivedConversations: number;
  slackConversations: number;
  stale: StaleEntry[];
  fresh: { id: string; name: string }[];
  new: { id: string; name: string; messages: number }[];
  renamed: { id: string; archiveName: string; slackName: string }[];
  deleted: {
    id: string;
    name: string;
    lost: { ts: string; iso: string; preview: string }[];
  }[];
  vanished: { id: string; name: string; reason: string }[];
  empty: { id: string; name: string }[];
}

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

/** Every top-level message, oldest to newest. No server-side filter can help here. */
async function fullHistory(channelId: string): Promise<any[]> {
  const out: any[] = [];
  let cursor: string | undefined;
  do {
    const r: any = await slack.conversations.history({
      channel: channelId,
      limit: 200,
      cursor,
    });
    out.push(...(r.messages ?? []));
    cursor = r.response_metadata?.next_cursor || undefined;
  } while (cursor);
  return out;
}

async function main() {
  announceIdentity();

  const archiveRoot = arg("--archive");
  if (!archiveRoot) {
    console.error("Need --archive <path to she-sharp-slack-archive>");
    process.exit(2);
  }
  const rawDir = resolve(archiveRoot, "raw");
  if (!existsSync(rawDir)) {
    console.error(`No raw/ directory at ${rawDir}`);
    process.exit(2);
  }

  /*
   * Load the archive's own position. A payload that is not `mode: "full"` is
   * not a valid archive file — it is a delta someone redirected into raw/ by
   * mistake, and it would under-report staleness while silently holding a
   * truncated transcript. Loud, not skipped.
   */
  const archived = new Map<
    string,
    { name: string; meta: ArchiveMeta; messages: number; byTs: Map<string, any> }
  >();
  for (const file of readdirSync(rawDir).filter((f) => f.endsWith(".json"))) {
    const id = file.replace(/\.json$/, "");
    let d: any;
    try {
      d = JSON.parse(readFileSync(resolve(rawDir, file), "utf8"));
    } catch {
      console.error(`UNREADABLE archive payload, treating as stale: ${file}`);
      archived.set(id, { name: id, meta: {}, messages: 0, byTs: new Map() });
      continue;
    }
    const meta: ArchiveMeta = d._meta ?? {};
    if (meta.mode !== "full") {
      console.error(
        `WARNING ${file} has _meta.mode="${meta.mode}" — a delta payload in raw/ ` +
          `means the archive is already truncated for this conversation. Refetch it in full.`,
      );
    }
    archived.set(id, {
      name: d.channel?.name ?? id,
      meta,
      messages: (d.messages ?? []).length,
      byTs: new Map((d.messages ?? []).map((m: any) => [m.ts, m])),
    });
  }
  console.error(`archive: ${archived.size} conversation(s) at ${rawDir}`);

  const users = await loadUserNames();

  // Enumerate everything, including archived channels — see the `vanished` note.
  const conversations: any[] = [];
  let cursor: string | undefined;
  do {
    const r: any = await slack.conversations.list({
      types: CONVERSATION_TYPES,
      exclude_archived: false,
      limit: 200,
      cursor,
    });
    conversations.push(...(r.channels ?? []));
    cursor = r.response_metadata?.next_cursor || undefined;
  } while (cursor);
  console.error(`slack: ${conversations.length} conversation(s) listed`);

  const report: Report = {
    archive: archiveRoot,
    archivedConversations: archived.size,
    slackConversations: conversations.length,
    stale: [],
    fresh: [],
    new: [],
    renamed: [],
    deleted: [],
    vanished: [],
    empty: [],
  };

  const seen = new Set<string>();
  let walked = 0;

  for (const c of conversations) {
    const id: string = c.id;
    const name = conversationName(c, users);
    const arch = archived.get(id);

    /*
     * `isReadable()` returns false for an archived channel, which would make a
     * channel archived since the last snapshot look like it vanished. It has
     * not — a user token still reads its history. So a channel we already hold
     * is always probed, and only an unheld unreadable one is skipped.
     */
    if (!isReadable(c) && !arch) continue;

    seen.add(id);
    walked++;
    if (walked % 25 === 0) console.error(`  …${walked} walked`);

    let history: any[];
    try {
      history = await fullHistory(id);
    } catch (e: any) {
      const reason = e?.data?.error ?? String(e);
      if (arch) report.vanished.push({ id, name, reason });
      continue;
    }

    if (!history.length) {
      if (!arch) report.empty.push({ id, name });
      continue;
    }

    const slackWatermarkTs = history.reduce(
      (max, m) => (Number(m.ts) > Number(max) ? m.ts : max),
      "0",
    );

    if (!arch) {
      report.new.push({ id, name, messages: history.length });
      continue;
    }

    if (arch.name !== name) {
      report.renamed.push({ id, archiveName: arch.name, slackName: name });
    }

    const reasons: string[] = [];
    if (arch.meta.mode !== "full") reasons.push("archive payload is not a full fetch");

    if (Number(slackWatermarkTs) > Number(arch.meta.newWatermarkTs ?? "0")) {
      reasons.push("new top-level messages");
    }

    const knownThreads = arch.meta.threadState ?? {};
    let grownThreads = 0;
    for (const m of history) {
      const facts: ThreadFacts = {
        ts: m.ts,
        reply_count: m.reply_count,
        latest_reply: m.latest_reply,
      };
      if (threadHasUnread(facts, knownThreads[m.ts])) grownThreads++;
    }
    if (grownThreads > 0) reasons.push(`${grownThreads} thread(s) grew`);

    /*
     * COMPARE IDENTITY, NOT COUNTS. A message present in the archive and absent
     * from Slack was deleted at source, and the archive is then its only
     * remaining copy — a refetch destroys it. Counting is not enough to see
     * this: on 9 August 2026 `event-feedback-notifications` had eight messages
     * deleted and nine added in the same window, so the count went UP from 11
     * to 12 while eight records quietly stopped existing anywhere. Reported,
     * never acted on; preserving or discarding them is a human's call.
     */
    const lost: { ts: string; iso: string; preview: string }[] = [];
    const liveTs = new Set(history.map((m) => m.ts));
    for (const [ts, m] of arch.byTs) {
      if (!liveTs.has(ts)) {
        lost.push({
          ts,
          iso: m.iso ?? "",
          preview: String(m.text ?? "").replace(/\s+/g, " ").slice(0, 120),
        });
      }
    }
    if (lost.length) report.deleted.push({ id, name, lost });

    const entry: StaleEntry = {
      id,
      name,
      reasons,
      archiveWatermarkTs: arch.meta.newWatermarkTs ?? "",
      slackWatermarkTs,
      grownThreads,
      archivedThreadCount: Object.keys(knownThreads).length,
      archivedMessageCount: arch.messages,
      slackMessageCount: history.length,
    };
    if (reasons.length) report.stale.push(entry);
    else report.fresh.push({ id, name });
  }

  // Held in the archive but never enumerated at all this run.
  for (const [id, a] of archived) {
    if (!seen.has(id)) {
      report.vanished.push({ id, name: a.name, reason: "not returned by conversations.list" });
    }
  }

  console.error(
    `\nstale ${report.stale.length} · fresh ${report.fresh.length} · new ${report.new.length} · ` +
      `renamed ${report.renamed.length} · deleted-at-source ${report.deleted.length} · vanished ${report.vanished.length}`,
  );
  for (const s of report.stale) {
    console.error(`  STALE  ${s.name} — ${s.reasons.join("; ")}`);
  }
  for (const n of report.new) {
    console.error(`  NEW    ${n.name} — ${n.messages} message(s)`);
  }
  for (const r of report.renamed) {
    console.error(`  RENAME ${r.archiveName} → ${r.slackName}`);
  }
  for (const d of report.deleted) {
    console.error(
      `  DELETED ${d.name} — ${d.lost.length} message(s) gone from Slack; the archive is now the only copy:`,
    );
    for (const l of d.lost) console.error(`            ${l.iso}  ${l.preview}`);
  }
  for (const v of report.vanished) {
    console.error(`  GONE   ${v.name} — ${v.reason}`);
  }

  process.stdout.write(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
