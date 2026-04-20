/**
 * Slack slash command entry point for `/event`.
 *
 * Flow:
 *   1. Verify Slack HMAC signature (rejects unsigned requests with 401)
 *   2. Verify user is in SLACK_ALLOWED_USER_IDS
 *   3. Acknowledge within Slack's 3-second deadline
 *   4. Use Next.js `after()` to run long-lived extraction async, posting
 *      the Block Kit preview to the request's response_url when done.
 */

import { after } from "next/server";

import {
  buildAckMessage,
  buildClarifyMessage,
  buildErrorMessage,
  buildPreviewMessage,
} from "@/lib/slack-bot/block-kit";
import { assertAllowed } from "@/lib/slack-bot/allowlist";
import { conventionsBlock } from "@/lib/slack-bot/conventions";
import { createDraftBranch } from "@/lib/slack-bot/draft-branch";
import { extractEventPatch, summariseEventsForPrompt } from "@/lib/slack-bot/ai-extractor";
import { applyPatch } from "@/lib/slack-bot/event-merger";
import { buildPreview } from "@/lib/slack-bot/diff-preview";
import { fetchChannelSnapshot } from "@/lib/slack-bot/channel-fetcher";
import { getSponsorSlugs } from "@/lib/slack-bot/sponsor-registry";
import { respondToSlack } from "@/lib/slack-bot/slack-client";
import { SlackBotError, InvalidSignatureError } from "@/lib/slack-bot/errors";
import { verifySlackSignature } from "@/lib/slack-bot/verify";
import { nanoid } from "nanoid";
// Importing the JSON file directly is the Next.js-safe way: webpack bundles it
// into the serverless function. Using readFileSync() from lib/ at runtime is
// unreliable on Vercel because those files are only bundled if webpack traces
// them via import.
import eventsCustomData from "@/lib/data/json/events-custom.json";

export async function POST(request: Request): Promise<Response> {
  const rawBody = await request.text();
  const ts = request.headers.get("x-slack-request-timestamp");
  const sig = request.headers.get("x-slack-signature");

  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  if (!signingSecret) {
    return Response.json({ response_type: "ephemeral", text: "Server misconfiguration: SLACK_SIGNING_SECRET missing." });
  }

  try {
    verifySlackSignature(rawBody, ts, sig, signingSecret);
  } catch (e) {
    if (e instanceof InvalidSignatureError) {
      return new Response("invalid signature", { status: 401 });
    }
    throw e;
  }

  const params = new URLSearchParams(rawBody);
  const userId = params.get("user_id") ?? "";
  const channelId = params.get("channel_id") ?? "";
  const text = params.get("text") ?? "";
  const responseUrl = params.get("response_url") ?? "";

  try {
    assertAllowed(userId);
  } catch (e) {
    const msg = e instanceof SlackBotError ? e.userMessage : "Forbidden";
    return Response.json({ response_type: "ephemeral", text: msg });
  }

  if (!text.trim()) {
    return Response.json({
      response_type: "ephemeral",
      text: "Usage: `/event <free-form description of the update>`",
    });
  }

  // Kick off background work that will post the preview via response_url.
  after(() => processCommand({ channelId, userId, userCommand: text, responseUrl }));

  return Response.json(buildAckMessage());
}

async function processCommand(params: {
  channelId: string;
  userId: string;
  userCommand: string;
  responseUrl: string;
}): Promise<void> {
  try {
    const snapshot = await fetchChannelSnapshot(params.channelId);

    const currentJsonText = JSON.stringify(eventsCustomData, null, 2);

    const patch = await extractEventPatch({
      userCommand: params.userCommand,
      channelName: snapshot.name,
      channelTopic: snapshot.topic,
      channelMessages: snapshot.messageText,
      currentEventsJson: summariseEventsForPrompt(currentJsonText),
      sponsorInventory: getSponsorSlugs(),
      conventions: conventionsBlock(),
    });

    if (patch.op === "clarify") {
      await respondToSlack(params.responseUrl, buildClarifyMessage(patch.question));
      return;
    }

    const updatedJsonText = applyPatch(currentJsonText, patch);

    const draftId = nanoid(10);
    const { branch } = await createDraftBranch({
      draftId,
      updatedJsonText,
      commitSummary: patch.summary,
      adminUserId: params.userId,
    });

    const preview = buildPreview(currentJsonText, updatedJsonText, patch);
    const repo = process.env.GITHUB_REPO ?? "";
    const draftBranchUrl = `https://github.com/${repo}/tree/${branch}`;

    await respondToSlack(
      params.responseUrl,
      buildPreviewMessage({
        preview,
        confirmPayload: {
          draftId,
          channelId: params.channelId,
          userId: params.userId,
          summary: patch.summary,
        },
        draftBranchUrl,
      }),
    );
  } catch (e) {
    const detail = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    const message = e instanceof SlackBotError
      ? e.userMessage
      : `Unexpected error — ${detail}`;
    await respondToSlack(params.responseUrl, buildErrorMessage(message));
    console.error("[slack-bot] processCommand failed:", e);
  }
}
