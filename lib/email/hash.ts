/**
 * Address hashing shared by the runtime app and the offline email scripts.
 *
 * The suppression design is deliberately one-way: we store only
 * `sha256(trimmed, lowercased address)`, never the address. A hash answers the
 * only question the suppression list is ever asked ("is this person opted
 * out?") while carrying no PII, which is what makes
 * `lib/data/json/email-suppression-hashes.json` safe to commit.
 *
 * This lives in `lib/` rather than `scripts/` because the app cannot import
 * from `scripts/`; `scripts/email/suppression.ts` re-exports it so both sides
 * normalise identically. If they ever diverged, the same address would hash two
 * different ways and suppression would silently stop working.
 */

import { createHash } from "node:crypto";

/**
 * Hashes an email address for suppression lookup.
 *
 * @param email A raw address, as typed or as exported from a ticketing tool.
 * @returns Lowercase sha256 hex digest of the trimmed, lowercased address.
 */
export function hashEmail(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}
