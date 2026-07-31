/**
 * Svix webhook signature verification for Resend deliverability events.
 *
 * Resend signs its webhooks with Svix. The scheme is small and stable, so it is
 * implemented here rather than pulling in the `svix` package and its dependency
 * tree — for a repo with one maintainer, forty lines of well-specified HMAC is
 * the smaller long-term liability.
 *
 * The scheme:
 *   signed payload = `${svix-id}.${svix-timestamp}.${raw body}`
 *   signature      = base64(HMAC-SHA256(signed payload, key))
 *   key            = base64-decoded portion of the `whsec_…` secret
 *   `svix-signature` carries one or more space-separated `v1,<sig>` values
 *   (more than one during a secret rotation), any of which may match.
 *
 * The raw body must be the exact bytes received — re-serialising parsed JSON
 * changes key order and whitespace and the signature will never match. Callers
 * must therefore `await request.text()` before any parsing.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

/** Reject anything older or further in the future than this. */
const TOLERANCE_SECONDS = 5 * 60;

export interface SvixHeaders {
  id: string | null;
  timestamp: string | null;
  signature: string | null;
}

/**
 * Constant-time comparison that tolerates length mismatches.
 *
 * `timingSafeEqual` throws when the buffers differ in length, which would leak
 * length through an exception; comparing lengths first and returning false
 * keeps the failure uniform.
 */
function safeEqual(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Verifies a Svix-signed webhook request.
 *
 * @param rawBody The exact request body text, unparsed.
 * @param headers The `svix-id`, `svix-timestamp` and `svix-signature` values.
 * @param secret The endpoint secret from the Resend dashboard (`whsec_…`).
 * @returns True when the signature is valid and the timestamp is within
 *   tolerance.
 */
export function verifySvixSignature(
  rawBody: string,
  headers: SvixHeaders,
  secret: string | undefined
): boolean {
  const { id, timestamp, signature } = headers;
  if (!secret || !id || !timestamp || !signature) return false;

  // Replay window. Svix sends seconds since the epoch.
  const sentAt = Number(timestamp);
  if (!Number.isFinite(sentAt)) return false;
  if (Math.abs(Date.now() / 1000 - sentAt) > TOLERANCE_SECONDS) return false;

  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key)
    .update(`${id}.${timestamp}.${rawBody}`)
    .digest();

  return signature.split(" ").some((part) => {
    const [version, value] = part.split(",");
    if (version !== "v1" || !value) return false;
    return safeEqual(expected, Buffer.from(value, "base64"));
  });
}

/**
 * Pulls the Svix headers off an incoming request.
 *
 * @param request Any request-like object exposing a `headers.get`.
 * @returns The three header values, each null when absent.
 */
export function readSvixHeaders(request: {
  headers: { get(name: string): string | null };
}): SvixHeaders {
  return {
    id: request.headers.get("svix-id"),
    timestamp: request.headers.get("svix-timestamp"),
    signature: request.headers.get("svix-signature"),
  };
}
