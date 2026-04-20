/**
 * Shared Slack Web API client + helpers for inbound API calls.
 *
 * The existing lib/slack/service.ts uses raw fetch for outbound webhooks.
 * This module complements it by owning the richer inbound API surface
 * (conversations.history, chat.postEphemeral via response_url, etc.).
 */

import { WebClient } from "@slack/web-api";

let client: WebClient | null = null;

export function getSlackClient(): WebClient {
  if (client) return client;
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    throw new Error("SLACK_BOT_TOKEN is not set");
  }
  client = new WebClient(token);
  return client;
}

/**
 * Send a Slack-formatted payload to the slash-command's response_url.
 *
 * Using response_url (rather than chat.postMessage) keeps the reply as
 * an ephemeral follow-up tied to the original slash command, visible
 * only to the invoking user.
 */
export async function respondToSlack(responseUrl: string, payload: unknown): Promise<void> {
  const res = await fetch(responseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`response_url POST failed: ${res.status} ${text}`);
  }
}
