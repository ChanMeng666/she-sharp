/**
 * Fetch a Slack channel's name, topic, and recent message history
 * (including thread replies) as a flat text blob suitable for feeding
 * to OpenAI.
 *
 * Ported from scripts/collect-event-from-slack.py — same API calls,
 * same sort ordering, TypeScript-native.
 */

import { ChannelAccessError } from "./errors";
import { getSlackClient } from "./slack-client";

interface ChannelSnapshot {
  name: string;
  topic: string;
  messageText: string;
  messageCount: number;
}

/** Number of top-level messages to fetch. Keep modest to stay within OpenAI context budget. */
const MESSAGE_LIMIT = 50;

export async function fetchChannelSnapshot(channelId: string): Promise<ChannelSnapshot> {
  const slack = getSlackClient();

  let info;
  try {
    info = await slack.conversations.info({ channel: channelId });
  } catch (e) {
    throw translateSlackError(e, "conversations.info");
  }
  const name = info.channel?.name ?? channelId;
  const topic = info.channel?.topic?.value ?? "";

  let history;
  try {
    history = await slack.conversations.history({ channel: channelId, limit: MESSAGE_LIMIT });
  } catch (e) {
    throw translateSlackError(e, "conversations.history");
  }
  const messages = history.messages ?? [];

  // Fetch thread replies for messages with reply_count > 0
  const threadReplies: NonNullable<typeof messages>[] = [];
  for (const m of messages) {
    if ((m.reply_count ?? 0) > 0 && m.ts) {
      try {
        const replies = await slack.conversations.replies({
          channel: channelId,
          ts: m.ts,
          limit: 50,
        });
        const rest = (replies.messages ?? []).slice(1);
        if (rest.length) threadReplies.push(rest);
      } catch {
        // swallow per-thread failures; partial context is still useful
      }
    }
  }

  const all = [...messages, ...threadReplies.flat()]
    .filter((m) => {
      const subtype = m.subtype ?? "";
      return !["bot_message", "channel_join", "channel_leave", "channel_topic", "channel_purpose"].includes(
        subtype,
      );
    })
    .sort((a, b) => Number(a.ts ?? 0) - Number(b.ts ?? 0));

  const lines: string[] = [];
  for (const m of all) {
    const text = (m.text ?? "").trim();
    if (!text && !(m.files?.length ?? 0)) continue;
    if (text) lines.push(`Message: ${text}`);
    for (const f of m.files ?? []) {
      const fileInfo = {
        name: f.name ?? "unknown",
        type: f.filetype ?? "unknown",
        title: f.title ?? "",
        url: f.url_private ?? "",
      };
      lines.push(`File: ${JSON.stringify(fileInfo)}`);
    }
  }

  if (all.length === 0) {
    throw new ChannelAccessError(
      `channel ${name} (${channelId}) returned 0 usable messages`,
      `No messages found in #${name}. If the bot was just added, wait a moment and retry. Otherwise make sure the channel actually contains event details and that the bot is a member (run \`/invite @She Sharp Event Bot\`).`,
    );
  }

  return { name, topic, messageText: lines.join("\n"), messageCount: all.length };
}

function translateSlackError(e: unknown, api: string): ChannelAccessError {
  const code =
    (e as { data?: { error?: string } })?.data?.error ??
    (e instanceof Error ? e.message : String(e));

  if (code === "not_in_channel" || code === "channel_not_found") {
    return new ChannelAccessError(
      `${api} failed: ${code}`,
      "I'm not a member of this channel. Please run `/invite @She Sharp Event Bot` in the channel, then try again.",
    );
  }
  if (code === "missing_scope") {
    return new ChannelAccessError(
      `${api} failed: missing_scope`,
      "The bot is missing required Slack scopes (`channels:history` / `groups:history`). Reinstall the app from the Slack admin console.",
    );
  }
  return new ChannelAccessError(
    `${api} failed: ${code}`,
    `Could not read channel history (${code}). Check bot membership and scopes.`,
  );
}
