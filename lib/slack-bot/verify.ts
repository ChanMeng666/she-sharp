/**
 * Slack request signature verification (HMAC SHA-256).
 *
 * https://api.slack.com/authentication/verifying-requests-from-slack
 */

import { createHmac, timingSafeEqual } from "crypto";

import { InvalidSignatureError } from "./errors";

const SIGNATURE_VERSION = "v0";
/** Reject requests older than 5 minutes (per Slack's recommendation). */
const MAX_TIMESTAMP_SKEW_SECONDS = 5 * 60;

/**
 * Verify a Slack signature against the raw request body.
 * Throws InvalidSignatureError on any failure.
 *
 * @param rawBody  The exact bytes of the request body (before any parsing).
 * @param timestamp  Value of the `X-Slack-Request-Timestamp` header.
 * @param signature  Value of the `X-Slack-Signature` header.
 * @param signingSecret  SLACK_SIGNING_SECRET from env.
 */
export function verifySlackSignature(
  rawBody: string,
  timestamp: string | null,
  signature: string | null,
  signingSecret: string,
): void {
  if (!timestamp || !signature) throw new InvalidSignatureError();

  const tsNum = Number(timestamp);
  if (!Number.isFinite(tsNum)) throw new InvalidSignatureError();
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - tsNum) > MAX_TIMESTAMP_SKEW_SECONDS) {
    throw new InvalidSignatureError();
  }

  const base = `${SIGNATURE_VERSION}:${timestamp}:${rawBody}`;
  const expected = `${SIGNATURE_VERSION}=${createHmac("sha256", signingSecret)
    .update(base)
    .digest("hex")}`;

  const a = Buffer.from(signature, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new InvalidSignatureError();
  }
}
