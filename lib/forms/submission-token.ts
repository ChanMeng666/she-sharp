/**
 * Signed, stateless handles for a mentee application submission.
 *
 * The payment page has to show an applicant their own order summary before they
 * have an account, so its lookup cannot require a session. Until 2026-09-06 it
 * addressed the submission by its raw primary key: `?id=3` returned that
 * applicant's real email address and full name to anybody, and the ids are
 * small sequential integers, so the whole cohort of beneficiaries enumerated.
 *
 * A signed token closes that without a schema change. It is
 * `base64url(id).base64url(truncated HMAC)` — deliberately the same shape as
 * the RFC 8058 unsubscribe tokens in `lib/email/unsubscribe-token.ts`, which is
 * the scheme this repo already uses for "a link that proves the holder was
 * given it". Nothing is stored: the id round-trips through the URL and the
 * signature is what makes it unguessable.
 *
 * **Why `AUTH_SECRET` and not `EMAIL_UNSUBSCRIBE_SECRET`.** Not because the
 * other secret is missing — it is set in production. Because of what happens
 * when a secret is *not* set. Every other signing secret here is optional by
 * design: `lib/email/unsubscribe-token.ts` returns null when its secret is
 * unset and the caller simply omits the header, which is survivable for a
 * `List-Unsubscribe` and fatal for a payment link, since the applicant is left
 * on a page that cannot load their order. `AUTH_SECRET` is the one secret that
 * cannot be missing: without it no session can be issued at all, so a link
 * signed with it can never silently dead-end in an environment where a more
 * optional secret was never provisioned. It also needs no new environment
 * variable at handover.
 *
 * The signed message is domain-separated by `TOKEN_PURPOSE`, so a token minted
 * here can never be replayed as, or confused with, any other HMAC taken over
 * the same secret — which is what makes sharing the session secret safe.
 *
 * **Rotating `AUTH_SECRET` invalidates outstanding payment tokens, not just
 * sessions.** An applicant holding a payment link from before the rotation
 * gets "Invalid or missing token" and has to re-submit the form. Harmless
 * while applications are paused and no tokens exist, but real once they
 * reopen: rotate when nobody is mid-application, or accept that the few links
 * in flight will need re-issuing.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

/** Bytes of HMAC kept in the token. Ample against forgery, keeps URLs short. */
const SIGNATURE_BYTES = 16;

/**
 * Domain separator. Nothing is stored, so there is no per-token revocation:
 * bumping the version suffix invalidates every token at once, and rotating
 * `AUTH_SECRET` does the same as a side effect.
 */
const TOKEN_PURPOSE = 'mentee-submission:v1';

/** Reads the signing secret, or null when unconfigured. */
function getSecret(): string | null {
  return process.env.AUTH_SECRET || null;
}

/** Computes the truncated HMAC over a domain-separated submission id. */
function sign(id: number, secret: string): Buffer {
  return createHmac('sha256', secret)
    .update(`${TOKEN_PURPOSE}:${id}`)
    .digest()
    .subarray(0, SIGNATURE_BYTES);
}

/**
 * Builds a payment-page token for a mentee submission.
 *
 * @param id The `mentee_form_submissions.id` of the submission.
 * @returns The token, or null when the id is not a positive integer or
 *   `AUTH_SECRET` is unset. A null must never be papered over with the raw id —
 *   that is the hole this closes.
 */
export function buildMenteeSubmissionToken(id: number): string | null {
  const secret = getSecret();
  if (!secret) return null;
  if (!Number.isSafeInteger(id) || id <= 0) return null;

  const payload = Buffer.from(String(id), 'utf8').toString('base64url');
  return `${payload}.${sign(id, secret).toString('base64url')}`;
}

/**
 * Verifies a payment-page token and recovers the submission id it names.
 *
 * @param token The `t` query parameter.
 * @returns The submission id, or null if the token is missing, malformed, or
 *   not signed by the current secret.
 */
export function verifyMenteeSubmissionToken(token: string | null): number | null {
  const secret = getSecret();
  if (!secret || !token) return null;

  const [payload, encodedSignature] = token.split('.');
  if (!payload || !encodedSignature) return null;

  let signatureBuffer: Buffer;
  let decodedId: string;
  try {
    signatureBuffer = Buffer.from(encodedSignature, 'base64url');
    decodedId = Buffer.from(payload, 'base64url').toString('utf8');
  } catch {
    return null;
  }

  // timingSafeEqual throws on a length mismatch, so the length check has to
  // come first and cannot be folded into the comparison.
  if (signatureBuffer.length !== SIGNATURE_BYTES) return null;

  // Canonical decimal only: no sign, no padding, no whitespace. Keeps one id
  // from having several spellings, each of which would sign differently.
  if (!/^[1-9][0-9]{0,14}$/.test(decodedId)) return null;

  const id = Number(decodedId);
  if (!Number.isSafeInteger(id) || id <= 0) return null;

  if (!timingSafeEqual(sign(id, secret), signatureBuffer)) return null;

  return id;
}
