/**
 * Slack Block Kit payload builders.
 *
 * Generates the ephemeral preview shown to the admin after /event,
 * the Confirm/Cancel buttons, and post-confirm status messages.
 */

import { createHmac } from "crypto";

import type { PreviewData } from "./diff-preview";
import type { InteractionPayload } from "./types";

/** Hard-cap on Slack button `value` is 2000 chars. Our payloads are <200. */
const MAX_VALUE = 2000;

export interface PreviewMessageParams {
  preview: PreviewData;
  confirmPayload: InteractionPayload;
  draftBranchUrl: string;
}

export function buildPreviewMessage({
  preview,
  confirmPayload,
  draftBranchUrl,
}: PreviewMessageParams): unknown {
  const signedValue = signPayload(confirmPayload);
  if (signedValue.length > MAX_VALUE) {
    throw new Error(`Button value exceeds Slack's 2000-char limit (got ${signedValue.length})`);
  }

  const blocks: unknown[] = [
    {
      type: "section",
      text: { type: "mrkdwn", text: `*Preview:* ${preview.summary}` },
    },
  ];

  if (preview.diffLines.length) {
    const diffText = preview.diffLines.join("\n");
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: "*Changes to `events-custom.json`:*" },
    });
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: "```" + diffText.slice(0, 2800) + "```" },
    });
  }

  if (preview.imageChecklist.length) {
    const lines = preview.imageChecklist.map((t) =>
      t.alreadyExists
        ? `• ✅ uses existing \`${t.path}\` — ${t.description}`
        : `• 📁 place at \`${t.path}\` — ${t.description}`,
    );
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: "*Image checklist:*\n" + lines.join("\n") },
    });
  }

  blocks.push({
    type: "context",
    elements: [
      { type: "mrkdwn", text: `Draft branch: <${draftBranchUrl}|inspect>` },
    ],
  });

  blocks.push({
    type: "actions",
    elements: [
      {
        type: "button",
        style: "primary",
        text: { type: "plain_text", text: "Confirm & Open PR" },
        value: signedValue,
        action_id: "slack_bot_confirm",
      },
      {
        type: "button",
        style: "danger",
        text: { type: "plain_text", text: "Cancel" },
        value: signedValue,
        action_id: "slack_bot_cancel",
      },
    ],
  });

  return { response_type: "ephemeral", replace_original: true, blocks };
}

export function buildClarifyMessage(question: string): unknown {
  return {
    response_type: "ephemeral",
    replace_original: true,
    blocks: [
      { type: "section", text: { type: "mrkdwn", text: `:thinking_face: *I need clarification:*\n${question}` } },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Please re-run `/event` with more context (include the event's title or slug explicitly).",
        },
      },
    ],
  };
}

export function buildAckMessage(): unknown {
  return {
    response_type: "ephemeral",
    text: "Processing… I'll follow up here in 15–30s.",
  };
}

export function buildErrorMessage(message: string): unknown {
  return {
    response_type: "ephemeral",
    replace_original: true,
    blocks: [
      { type: "section", text: { type: "mrkdwn", text: `:warning: ${message}` } },
    ],
  };
}

export function buildConfirmedMessage(params: {
  prUrl: string;
  prNumber: number;
  imageChecklist: PreviewData["imageChecklist"];
}): unknown {
  const toPlace = params.imageChecklist.filter((t) => !t.alreadyExists);
  const checklistText = toPlace.length
    ? "\n*Images to place locally:*\n" + toPlace.map((t) => `• \`${t.path}\` — ${t.description}`).join("\n")
    : "";

  return {
    response_type: "ephemeral",
    replace_original: true,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text:
            `:white_check_mark: *PR opened:* <${params.prUrl}|#${params.prNumber}>\n\n` +
            `To finish:\n` +
            "```\n" +
            `gh pr checkout ${params.prNumber}\n` +
            `# drop any listed images into the correct paths\n` +
            `git add public/img/events/\n` +
            `git commit -m "chore: add images for PR #${params.prNumber}"\n` +
            `git push\n` +
            "```\n" +
            "Then merge the PR on GitHub — Vercel will auto-deploy." +
            checklistText,
        },
      },
    ],
  };
}

export function buildCancelledMessage(): unknown {
  return {
    response_type: "ephemeral",
    replace_original: true,
    blocks: [
      { type: "section", text: { type: "mrkdwn", text: ":x: Cancelled. Draft branch deleted." } },
    ],
  };
}

/**
 * HMAC-sign the InteractionPayload so we can trust it when it comes back
 * on the Confirm / Cancel click. Prevents payload tampering.
 */
export function signPayload(payload: InteractionPayload): string {
  const secret = process.env.SLACK_SIGNING_SECRET;
  if (!secret) throw new Error("SLACK_SIGNING_SECRET is not set");
  const body = JSON.stringify(payload);
  const sig = createHmac("sha256", secret).update(body).digest("hex");
  return Buffer.from(JSON.stringify({ p: payload, s: sig })).toString("base64");
}

export function verifyPayload(signedValue: string): InteractionPayload {
  const secret = process.env.SLACK_SIGNING_SECRET;
  if (!secret) throw new Error("SLACK_SIGNING_SECRET is not set");
  let decoded: { p: InteractionPayload; s: string };
  try {
    decoded = JSON.parse(Buffer.from(signedValue, "base64").toString("utf8"));
  } catch {
    throw new Error("Invalid signed payload");
  }
  const body = JSON.stringify(decoded.p);
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  if (expected !== decoded.s) throw new Error("Payload signature mismatch");
  return decoded.p;
}
