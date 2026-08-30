/**
 * Runtime read access to the committed, hash-only do-not-contact register.
 *
 * `lib/data/json/email-suppression-hashes.json` has until now been read only by
 * the offline scripts, through `scripts/email/suppression.ts`. Nothing under
 * `app/` can import from `scripts/`, so a route that has to answer "is this
 * address on the register?" needs its own reader — this one.
 *
 * Two deliberate choices:
 *
 * - **A static import, not `readFileSync`.** The scripts resolve the path
 *   relative to the repo root, which does not exist inside a Vercel function
 *   bundle: a file is only traced into the bundle when something imports it. An
 *   import that silently resolved to nothing would make this register read as
 *   *empty*, and an empty do-not-contact register fails open — the one
 *   direction that must never happen here.
 * - **Membership only, no timestamps.** Callers get a yes/no. The register's
 *   `at` field exists so `selectMailable()` can let a later confirmation
 *   outrank an earlier suppression; deliberately not exposing it here keeps
 *   this module from growing a second, divergent copy of that comparison. See
 *   `lib/newsletter/reconfirm.ts` for why the consent-upgrade path wants the
 *   stricter membership test rather than the comparison.
 *
 * The file carries no addresses — only `sha256(trimmed, lowercased address)` —
 * which is what makes it committable and what makes this import harmless.
 */

import registerJson from "@/lib/data/json/email-suppression-hashes.json";

interface RegisterEntry {
  hash: string;
  reason: string;
  at: string;
}

let cached: Map<string, string> | null = null;

/**
 * Indexes the register on first use.
 *
 * @returns Lowercased hash to reason.
 */
function index(): Map<string, string> {
  if (cached) return cached;

  const entries = (registerJson as { entries?: RegisterEntry[] }).entries ?? [];
  const map = new Map<string, string>();
  for (const entry of entries) {
    if (typeof entry?.hash === "string" && entry.hash.length > 0) {
      map.set(entry.hash.toLowerCase(), entry.reason ?? "unknown");
    }
  }
  cached = map;
  return map;
}

/**
 * Reports whether an address is on the committed do-not-contact register.
 *
 * @param emailHash sha256 hex of the normalized address, from `hashEmail()`.
 * @returns True when the hash is on the register.
 */
export function isRegisterSuppressed(emailHash: string): boolean {
  return index().has(emailHash.toLowerCase());
}

/**
 * The recorded reason for a suppressed hash.
 *
 * @param emailHash sha256 hex of the normalized address.
 * @returns The reason, or null when the hash is not on the register.
 */
export function registerSuppressionReason(emailHash: string): string | null {
  return index().get(emailHash.toLowerCase()) ?? null;
}

/**
 * How many hashes the register holds. For diagnostics and tests only.
 *
 * @returns The entry count.
 */
export function registerSize(): number {
  return index().size;
}
