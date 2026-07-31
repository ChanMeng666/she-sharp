/**
 * Signed, stateless one-click unsubscribe tokens (RFC 8058).
 *
 * A token is `base64url(emailHash).base64url(truncated HMAC)`. Two properties
 * make this the right shape for a `List-Unsubscribe` URL:
 *
 * - **Stateless.** Nothing is written at send time, so adding the header costs
 *   one HMAC per message rather than a database round-trip per recipient.
 * - **PII-free.** The URL carries the sha256 of the address, never the address.
 *   Unsubscribe links end up in provider logs, link scanners and forwarded
 *   mail; none of those should learn who was emailed.
 *
 * The HMAC is what stops someone from unsubscribing a third party by guessing
 * hashes. It is truncated to 16 bytes — ample against forgery here, and it
 * keeps the URL short enough not to wrap in a header.
 *
 * `EMAIL_UNSUBSCRIBE_SECRET` is deliberately its own secret rather than a reuse
 * of `CRON_SECRET`, so that rotating one never silently invalidates the other.
 * When it is unset the token builder returns null and the caller simply omits
 * the header — a missing unsubscribe link degrades; a broken one does not.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { hashEmail } from "./hash";

/** Bytes of HMAC kept in the token. */
const SIGNATURE_BYTES = 16;

/** Reads the signing secret, or null when unconfigured. */
function getSecret(): string | null {
  return process.env.EMAIL_UNSUBSCRIBE_SECRET || null;
}

/** base64url without padding — safe unescaped in a query string. */
function toBase64Url(buffer: Buffer): string {
  return buffer.toString("base64url");
}

/** Computes the truncated HMAC over an email hash. */
function sign(emailHash: string, secret: string): Buffer {
  return createHmac("sha256", secret)
    .update(emailHash)
    .digest()
    .subarray(0, SIGNATURE_BYTES);
}

/**
 * Builds an unsubscribe token for a recipient.
 *
 * @param email The recipient address.
 * @returns The token, or null when `EMAIL_UNSUBSCRIBE_SECRET` is unset.
 */
export function buildUnsubscribeToken(email: string): string | null {
  const secret = getSecret();
  if (!secret) return null;

  const emailHash = hashEmail(email);
  const signature = sign(emailHash, secret);
  return `${toBase64Url(Buffer.from(emailHash, "hex"))}.${toBase64Url(signature)}`;
}

/**
 * Verifies a token and recovers the email hash it was issued for.
 *
 * @param token The `t` query parameter.
 * @returns The sha256 hex email hash, or null if the token is missing,
 *   malformed, or not signed by the current secret.
 */
export function verifyUnsubscribeToken(token: string | null): string | null {
  const secret = getSecret();
  if (!secret || !token) return null;

  const [encodedHash, encodedSignature] = token.split(".");
  if (!encodedHash || !encodedSignature) return null;

  let hashBuffer: Buffer;
  let signatureBuffer: Buffer;
  try {
    hashBuffer = Buffer.from(encodedHash, "base64url");
    signatureBuffer = Buffer.from(encodedSignature, "base64url");
  } catch {
    return null;
  }

  // A sha256 digest is exactly 32 bytes; anything else is not one of ours.
  if (hashBuffer.length !== 32 || signatureBuffer.length !== SIGNATURE_BYTES) {
    return null;
  }

  const emailHash = hashBuffer.toString("hex");
  const expected = sign(emailHash, secret);
  if (!timingSafeEqual(expected, signatureBuffer)) return null;

  return emailHash;
}
