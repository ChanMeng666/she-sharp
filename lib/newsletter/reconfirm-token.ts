/**
 * Signed, stateless per-recipient re-confirmation tokens.
 *
 * Same construction as `lib/email/unsubscribe-token.ts` — the URL carries
 * `base64url(sha256 of the address)` plus a truncated HMAC, never the address —
 * for the same two reasons: nothing is written at send time, and a link that
 * ends up in a provider log, a link scanner or a forwarded message teaches its
 * finder nothing about who was mailed. It reads the same
 * `EMAIL_UNSUBSCRIBE_SECRET`, so there is one email-link secret to rotate rather
 * than two.
 *
 * **What is deliberately different is domain separation.** The message signed
 * here is `newsletter-reconfirm:<hash>`, not the bare hash, so an unsubscribe
 * token is not a valid re-confirmation token and vice versa. That matters
 * because the two endpoints do opposite things and their tokens do not travel
 * with equal care: an unsubscribe URL is published in every message's
 * `List-Unsubscribe` header, so it reaches mail providers, gateways and
 * archives that never see the message body. Without separation, anyone holding
 * a scraped unsubscribe URL could POST it to the re-confirmation endpoint and
 * manufacture consent evidence for that address — the precise fabrication this
 * feature exists to avoid.
 *
 * The separation could not instead be added to `unsubscribe-token.ts`: its
 * tokens are already live in every newsletter and reminder She Sharp has sent,
 * and changing the signed message would invalidate all of them at once, leaving
 * those recipients with an opt-out link that silently fails. So that module
 * keeps its unpurposed scheme and this one is purposed from the start.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

import { hashEmail } from "@/lib/email/hash";

/** Bytes of HMAC kept in the token. Matches the unsubscribe token's budget. */
const SIGNATURE_BYTES = 16;

/**
 * The domain-separation label. Changing it invalidates every re-confirmation
 * link already in an inbox, which is survivable (the link simply stops working
 * and the row keeps the evidence it had) but not free.
 */
const PURPOSE = "newsletter-reconfirm";

/** A sha256 digest is exactly 32 bytes; anything else is not one of ours. */
const HASH_BYTES = 32;

/** Reads the signing secret, or null when unconfigured. */
function getSecret(): string | null {
  return process.env.EMAIL_UNSUBSCRIBE_SECRET || null;
}

/** Computes the purposed, truncated HMAC over an email hash. */
function sign(emailHash: string, secret: string): Buffer {
  return createHmac("sha256", secret)
    .update(`${PURPOSE}:${emailHash}`)
    .digest()
    .subarray(0, SIGNATURE_BYTES);
}

/**
 * Builds a re-confirmation token for a recipient.
 *
 * @param email The recipient address the token is scoped to.
 * @returns The token, or null when `EMAIL_UNSUBSCRIBE_SECRET` is unset — the
 *   caller must then refuse rather than ship a link that cannot be verified.
 */
export function buildReconfirmToken(email: string): string | null {
  const secret = getSecret();
  if (!secret) return null;

  const emailHash = hashEmail(email);
  const signature = sign(emailHash, secret);
  return `${Buffer.from(emailHash, "hex").toString("base64url")}.${signature.toString("base64url")}`;
}

/**
 * Verifies a token and recovers the email hash it was issued for.
 *
 * @param token The `t` query parameter.
 * @returns The sha256 hex email hash, or null if the token is missing,
 *   malformed, signed for a different purpose, or not signed by the current
 *   secret.
 */
export function verifyReconfirmToken(token: string | null | undefined): string | null {
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

  if (hashBuffer.length !== HASH_BYTES || signatureBuffer.length !== SIGNATURE_BYTES) {
    return null;
  }

  const emailHash = hashBuffer.toString("hex");
  const expected = sign(emailHash, secret);
  if (!timingSafeEqual(expected, signatureBuffer)) return null;

  return emailHash;
}
