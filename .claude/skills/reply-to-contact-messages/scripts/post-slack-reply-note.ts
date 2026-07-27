/**
 * Leave a short "replied by email" note in a #contact-form-notifications thread.
 *
 * Why this exists: once an enquiry is answered by email, the Slack notification
 * is the only thing the rest of the team looks at. Without a thread note, a
 * teammate scanning the channel has no way to tell an answered enquiry from an
 * unanswered one and may reply a second time. This is the ONLY write this skill
 * makes to Slack.
 *
 * This step is deliberately last and deliberately non-critical: the email has
 * already been sent and `reviewed_at` has already been written by the time it
 * runs, so a failure here costs visibility, never correctness.
 *
 * Usage:
 *   npx tsx .claude/skills/reply-to-contact-messages/scripts/post-slack-reply-note.ts \
 *     --thread-ts 1753600000.123456 --submission-id 12 [--name "Jane Doe"] [--dry-run]
 *
 *   npx tsx .../post-slack-reply-note.ts --thread-ts <ts> --submission-id <n> \
 *     --note "Custom one-liner replacing the default text"
 *
 * Flags:
 *   --thread-ts <ts>      Slack ts of the notification message (thread parent). Required.
 *   --submission-id <n>   contact_form_submissions.id. Required — appears in the note.
 *   --name "<name>"       Sender's name, used in the default wording.
 *   --note "<text>"       Replace the whole message text with this.
 *   --dry-run             Print the chat.postMessage payload and exit 0.
 *
 * Output: the posted message ts on success; the payload only, on --dry-run.
 */

import { CONTACT_CHANNEL_ID, CONTACT_CHANNEL_NAME, createSlackClient } from "./slack-contact-lib";

// ---- arg parsing ----------------------------------------------------------

const argv = process.argv.slice(2);

function flagValue(name: string): string | undefined {
  const exact = argv.indexOf(name);
  if (exact >= 0) return argv[exact + 1];
  const inline = argv.find((a) => a.startsWith(`${name}=`));
  return inline ? inline.slice(name.length + 1) : undefined;
}

const threadTs = flagValue("--thread-ts");
const submissionIdRaw = flagValue("--submission-id");
const name = flagValue("--name");
const note = flagValue("--note");
const isDryRun = argv.includes("--dry-run");

if (!threadTs || !/^\d+\.\d+$/.test(threadTs)) {
  console.error('ERROR: --thread-ts is required and must look like "1753600000.123456".');
  console.error("Usage: post-slack-reply-note.ts --thread-ts <ts> --submission-id <n> [--name \"…\"] [--note \"…\"] [--dry-run]");
  process.exit(2);
}

const submissionId = Number(submissionIdRaw);
if (!submissionIdRaw || !Number.isInteger(submissionId) || submissionId <= 0) {
  console.error("ERROR: --submission-id is required and must be a positive integer.");
  process.exit(2);
}

// ---- message text ---------------------------------------------------------

/** NZ local time — the team reads this channel in Auckland. */
function nzTimestamp(): string {
  return new Date().toLocaleString("en-NZ", {
    timeZone: "Pacific/Auckland",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const text = note ?? `✅ Replied to ${name ?? "the sender"} by email on ${nzTimestamp()} — submission #${submissionId}`;

const payload = {
  channel: CONTACT_CHANNEL_ID,
  thread_ts: threadTs,
  text,
};

// ---- main -----------------------------------------------------------------

/** Map the three failures we actually expect onto a concrete next action. */
function remediation(errorCode: string): string {
  switch (errorCode) {
    case "missing_scope":
      return "The bot token lacks `chat:write`. Add it in the Slack app's OAuth & Permissions page and reinstall the app.";
    case "not_in_channel":
      return `The bot is not a member of #${CONTACT_CHANNEL_NAME}. Invite it, or grant \`channels:join\` and let it join itself.`;
    case "thread_not_found":
    case "message_not_found":
      return "No message with that ts exists in this channel. Re-run reconcile-inbox.ts to get a current slack.ts.";
    default:
      return "Check the bot token and the channel id, then retry.";
  }
}

async function main(): Promise<void> {
  if (isDryRun) {
    console.log("[DRY RUN] chat.postMessage payload:");
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const client = createSlackClient();
  const res = await client.chat.postMessage(payload);
  console.log(`Posted thread note ${res.ts ?? "(no ts returned)"} on submission #${submissionId}.`);
}

main().catch((error: unknown) => {
  const err = error as { data?: { error?: string }; message?: string };
  const code = err?.data?.error ?? "unknown_error";
  console.error(`ERROR: chat.postMessage failed (${code}).`);
  console.error(`  ${remediation(code)}`);
  console.error("");
  console.error(
    "  This step is cosmetic: the reply email was already sent and reviewed_at was already " +
      "written, so the submission IS correctly handled. Only the Slack thread lacks its note — " +
      "post it manually or re-run this command once the cause above is fixed.",
  );
  process.exit(1);
});
