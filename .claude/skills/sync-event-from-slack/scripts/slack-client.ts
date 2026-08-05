/**
 * Shared Slack client + token resolution for the sync-event-from-slack scripts.
 *
 * Two tokens can be in play and they see different things:
 *
 *   SLACK_BOT_TOKEN  (xoxb-)  the She Sharp Event Collector bot. Sees public
 *                             channels it has joined, and private channels it
 *                             has been invited to. Can NEVER see a DM between
 *                             two humans.
 *   SLACK_USER_TOKEN (xoxp-)  acts as the authorising human. Sees everything
 *                             that person can see in Slack: their DMs, their
 *                             group DMs, and every private channel they are in
 *                             — without anyone inviting a bot.
 *
 * The user token is preferred whenever it is present, because it is a strict
 * superset for reading. The bot token stays the fallback so the skill keeps
 * working unchanged before the user token is installed.
 *
 * Hard limit worth knowing before anyone asks for "no blind spots": a user
 * token still cannot read DMs between two OTHER people. That needs Slack's
 * Discovery API, which is Enterprise Grid only. This workspace is not Grid.
 */

import "dotenv/config";
import { WebClient, type Logger } from "@slack/web-api";

/**
 * EVERY LOG LINE GOES TO STDERR. STDOUT IS THE PAYLOAD.
 *
 * `fetch-channel.ts` writes its JSON to stdout and every caller redirects it to
 * a file. The Slack SDK's default logger writes to stdout, and it is silent
 * until it is not: it only speaks when a call is retried. So the scripts worked
 * perfectly until a backlog pass hit the `conversations.replies` rate limit,
 * and then ten of eleven payloads came back as JSON with
 * `[INFO] web-api:WebClient:0 API Call failed due to rate limiting` wedged into
 * them. The failure looked like a network problem and was a plumbing one.
 *
 * A logger that writes diagnostics onto the same channel as the data is a bug
 * waiting for load. Retries are worth seeing — they explain a slow run — so
 * they are kept, and merely pointed at stderr where they belong.
 */
const stderrLogger: Logger = {
  /*
   * DEBUG IS DROPPED, NOT REDIRECTED. Supplying a custom logger makes the SDK
   * emit at debug level, and its debug stream is every request header and every
   * full response body. On a workspace whose DMs this token can read, that is
   * private conversation written into a log file — and 220 conversations of it
   * buries the retry notices that are the only reason to keep logging at all.
   */
  debug: () => {},
  info: (...m) => console.error("[slack:info]", ...m),
  warn: (...m) => console.error("[slack:warn]", ...m),
  error: (...m) => console.error("[slack:error]", ...m),
  setLevel: () => {},
  getLevel: () => "info" as never,
  setName: () => {},
};

const userToken = process.env.SLACK_USER_TOKEN?.trim() || "";
const botToken = process.env.SLACK_BOT_TOKEN?.trim() || "";

export const USING_USER_TOKEN = userToken.length > 0;
export const TOKEN = userToken || botToken;

if (!TOKEN) {
  console.error(
    "Neither SLACK_USER_TOKEN nor SLACK_BOT_TOKEN is set in .env — cannot reach Slack.",
  );
  process.exit(1);
}

export const slack = new WebClient(TOKEN, { logger: stderrLogger });

/**
 * The bot client, kept separate even when a user token is driving reads.
 * `conversations.join` on a user token makes the HUMAN join, which posts a
 * visible "has joined the channel" line to the room. Joining is the bot's job.
 */
export const botSlack = botToken
  ? new WebClient(botToken, { logger: stderrLogger })
  : null;

/**
 * A user token reads any PUBLIC channel's history without joining it — verified
 * against #events-ey-2020, which the bot is in and the user is not. So a
 * non-member public channel is not a gap to fix, and `is_member` must not gate
 * reading. Private channels and DMs still require actual membership.
 */
export function isReadable(c: {
  is_member?: boolean;
  is_private?: boolean;
  is_archived?: boolean;
  is_im?: boolean;
  is_mpim?: boolean;
}): boolean {
  if (c.is_archived) return false;
  if (c.is_im || c.is_mpim) return true;
  if (!c.is_private && USING_USER_TOKEN) return true;
  return !!c.is_member;
}

/**
 * Conversation types to enumerate. `im` (DM) and `mpim` (group DM) are only
 * listable on a user token — asking for them with a bot token returns
 * `missing_scope` and aborts the whole listing, so they are gated.
 */
export const CONVERSATION_TYPES = USING_USER_TOKEN
  ? "public_channel,private_channel,mpim,im"
  : "public_channel,private_channel";

/** One-line banner so every script's stderr says which identity it read as. */
export function announceIdentity(): void {
  console.error(
    USING_USER_TOKEN
      ? "auth: SLACK_USER_TOKEN (user identity — includes DMs, group DMs and your private channels)"
      : "auth: SLACK_BOT_TOKEN (bot identity — public + invited private channels only, no DMs)",
  );
}

/**
 * Workspace user directory, fetched once. DM conversations carry only a user
 * ID, so a name map is what turns `D0123ABC` into `dm:nirmala` in the tables.
 */
export async function loadUserNames(): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  let cursor: string | undefined;
  do {
    const r = await slack.users.list({ limit: 500, cursor });
    for (const u of r.members ?? []) {
      const anyU = u as any;
      const name =
        anyU.profile?.display_name || anyU.real_name || anyU.name || anyU.id;
      names.set(anyU.id, name);
    }
    cursor = r.response_metadata?.next_cursor || undefined;
  } while (cursor);
  return names;
}

/**
 * Stable display name for any conversation shape. Public/private channels have
 * a `name`; group DMs have an `mpdm-…` name; 1:1 DMs have neither, so they are
 * named after the other person. The result is used as the human-facing label
 * AND as the `--state` manifest lookup key, so it must be deterministic.
 */
export function conversationName(
  c: any,
  users?: Map<string, string>,
): string {
  if (c.is_im) {
    const who = users?.get(c.user) ?? c.user ?? "unknown";
    return `dm:${who}`;
  }
  return c.name ?? c.id ?? "";
}

/** A DM or group DM — you are always "in" these, there is no membership flag. */
export function isDirectConversation(c: any): boolean {
  return !!(c.is_im || c.is_mpim);
}
