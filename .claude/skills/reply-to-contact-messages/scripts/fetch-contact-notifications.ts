/**
 * Dump every contact-form notification the bot can see in
 * #contact-form-notifications (C0AGVRL0G5A), parsed back into structured rows.
 *
 * Why this exists: the Slack channel is the only place that records whether a
 * teammate already answered an enquiry in-thread. The database knows what came
 * in; Slack knows what humans did about it. This script is the read side of the
 * Slack half, kept separate from `reconcile-inbox.ts` so the raw parse can be
 * inspected (and cached) on its own when a message fails to match a DB row.
 *
 * Read-only: conversations.history, conversations.replies, chat.getPermalink.
 *
 * Usage:
 *   npx tsx .claude/skills/reply-to-contact-messages/scripts/fetch-contact-notifications.ts
 *   npx tsx .../fetch-contact-notifications.ts --since 1717300000.123456
 *   npx tsx .../fetch-contact-notifications.ts --limit 50
 *   npx tsx .../fetch-contact-notifications.ts --json          # full payload to stdout
 *   npx tsx .../fetch-contact-notifications.ts --no-permalinks # skip chat.getPermalink
 *
 * Output:
 *   Always writes the full payload to .cache/contact-notifications.json (gitignored).
 *   Default stdout is a human-readable summary; --json prints the payload instead.
 *
 * Payload shape:
 * {
 *   channelId, fetchedAt, since, newWatermarkTs, rawMessageCount,
 *   notifications: [{
 *     ts, permalink, submissionId, source, name, email, organisation,
 *     message, threadReplyCount, hasHumanReply
 *   }]
 * }
 */

import { mkdirSync, writeFileSync } from "node:fs";
import {
  CACHE_DIR,
  CONTACT_CHANNEL_NAME,
  NOTIFICATIONS_CACHE_PATH,
  createSlackClient,
  fetchContactNotifications,
  maskEmail,
} from "./slack-contact-lib";

// ---- arg parsing ----------------------------------------------------------

const argv = process.argv.slice(2);

function flagValue(name: string): string | undefined {
  const exact = argv.indexOf(name);
  if (exact >= 0) return argv[exact + 1];
  const inline = argv.find((a) => a.startsWith(`${name}=`));
  return inline ? inline.slice(name.length + 1) : undefined;
}

const since = flagValue("--since");
const limitRaw = flagValue("--limit");
const limit = limitRaw ? Number(limitRaw) : 200;
const asJson = argv.includes("--json");
const withPermalinks = !argv.includes("--no-permalinks");

if (!Number.isFinite(limit) || limit <= 0) {
  console.error("ERROR: --limit must be a positive number.");
  process.exit(2);
}
if (since !== undefined && !/^\d+\.\d+$/.test(since)) {
  console.error('ERROR: --since must be a Slack ts like "1717300000.123456".');
  process.exit(2);
}

// ---- main -----------------------------------------------------------------

async function main(): Promise<void> {
  const client = createSlackClient();
  const result = await fetchContactNotifications(client, { since, limit, withPermalinks });

  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(NOTIFICATIONS_CACHE_PATH, JSON.stringify(result, null, 2) + "\n");

  if (asJson) {
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
    return;
  }

  const withId = result.notifications.filter((n) => n.submissionId !== null).length;
  const withEmail = result.notifications.filter((n) => n.email !== null).length;
  const withHumanReply = result.notifications.filter((n) => n.hasHumanReply).length;

  console.log(`#${CONTACT_CHANNEL_NAME} (${result.channelId})`);
  console.log(`  raw messages read : ${result.rawMessageCount}${since ? ` (since ${since})` : ""}`);
  console.log(`  notifications     : ${result.notifications.length}`);
  console.log(`  with submissionId : ${withId}`);
  console.log(`  with email        : ${withEmail}`);
  console.log(`  human thread reply: ${withHumanReply}`);
  console.log(`  new watermark ts  : ${result.newWatermarkTs ?? "—"}`);
  console.log("");

  for (const n of result.notifications) {
    const when = new Date(Number(n.ts) * 1000).toISOString().slice(0, 16).replace("T", " ");
    const id = n.submissionId !== null ? `#${n.submissionId}` : "#?";
    const src = n.source ?? "?";
    const replied = n.hasHumanReply ? " [human replied in thread]" : "";
    console.log(`  ${when}  ${id.padEnd(5)} ${src.padEnd(15)} ${(n.name ?? "—").padEnd(24)} ${maskEmail(n.email)}${replied}`);
  }

  console.log("");
  console.log(`Full payload written to ${NOTIFICATIONS_CACHE_PATH}`);
}

main().catch((error: unknown) => {
  const err = error as { data?: unknown; message?: string };
  console.error("FATAL:", err?.data ?? err?.message ?? error);
  process.exit(1);
});
