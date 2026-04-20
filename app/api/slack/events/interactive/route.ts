/**
 * Interactive components handler — receives Confirm / Cancel button clicks
 * from the Slack ephemeral preview.
 *
 * Payload arrives URL-encoded with a single `payload=<json>` field.
 */

import {
  buildCancelledMessage,
  buildConfirmedMessage,
  buildErrorMessage,
  verifyPayload,
} from "@/lib/slack-bot/block-kit";
import { deleteDraftBranch, promoteDraftToPR } from "@/lib/slack-bot/draft-branch";
import { respondToSlack } from "@/lib/slack-bot/slack-client";
import { SlackBotError, InvalidSignatureError } from "@/lib/slack-bot/errors";
import { verifySlackSignature } from "@/lib/slack-bot/verify";

interface SlackInteractivePayload {
  user: { id: string };
  response_url: string;
  actions: Array<{ action_id: string; value: string }>;
}

export async function POST(request: Request): Promise<Response> {
  const rawBody = await request.text();
  const ts = request.headers.get("x-slack-request-timestamp");
  const sig = request.headers.get("x-slack-signature");

  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  if (!signingSecret) return new Response("misconfigured", { status: 500 });

  try {
    verifySlackSignature(rawBody, ts, sig, signingSecret);
  } catch (e) {
    if (e instanceof InvalidSignatureError) {
      return new Response("invalid signature", { status: 401 });
    }
    throw e;
  }

  const params = new URLSearchParams(rawBody);
  const payloadStr = params.get("payload");
  if (!payloadStr) return new Response("missing payload", { status: 400 });

  let payload: SlackInteractivePayload;
  try {
    payload = JSON.parse(payloadStr);
  } catch {
    return new Response("invalid payload", { status: 400 });
  }

  const action = payload.actions?.[0];
  if (!action) return new Response("no action", { status: 400 });

  try {
    const signed = verifyPayload(action.value);
    if (action.action_id === "slack_bot_confirm") {
      await handleConfirm(signed.draftId, signed.summary, signed.userId, payload.response_url);
    } else if (action.action_id === "slack_bot_cancel") {
      await handleCancel(signed.draftId, payload.response_url);
    } else {
      return new Response("unknown action", { status: 400 });
    }
  } catch (e) {
    const message = e instanceof SlackBotError ? e.userMessage : "Unexpected error.";
    await respondToSlack(payload.response_url, buildErrorMessage(message));
    console.error("[slack-bot] interactive failed:", e);
  }

  return new Response("", { status: 200 });
}

async function handleConfirm(
  draftId: string,
  summary: string,
  adminUserId: string,
  responseUrl: string,
): Promise<void> {
  const { url, number } = await promoteDraftToPR({
    draftId,
    title: `feat(events): ${summary}`,
    body:
      `Opened from Slack by <@${adminUserId}> via \`/event\` command.\n\n` +
      `**Next step:** locally run \`gh pr checkout ${numberPlaceholder()}\`, place any listed images in \`public/img/events/\`, push, then merge.\n`,
  });

  await respondToSlack(
    responseUrl,
    buildConfirmedMessage({ prUrl: url, prNumber: number, imageChecklist: [] }),
  );
}

async function handleCancel(draftId: string, responseUrl: string): Promise<void> {
  await deleteDraftBranch(draftId);
  await respondToSlack(responseUrl, buildCancelledMessage());
}

// The PR body is built before we have the PR number; Slack message uses the
// real number (available after promoteDraftToPR). Placeholder keeps the body
// text useful when read on GitHub.
function numberPlaceholder(): string {
  return "<num>";
}
