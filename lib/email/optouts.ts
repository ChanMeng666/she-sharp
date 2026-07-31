/**
 * Runtime opt-out lookups and writes for outgoing She Sharp email.
 *
 * Two rules govern every function here:
 *
 * 1. **Transactional mail is never suppressed.** Someone who unsubscribed from
 *    reminders, hard-bounced last month, or hit "report spam" must still be
 *    able to receive a password reset. Only `stream: 'notification'` consults
 *    this table; `isSuppressed()` therefore takes the stream and says no for
 *    everything else rather than leaving that decision to each caller.
 * 2. **Never block a send on a database problem.** If the query throws, the
 *    message goes out. A failed lookup is an infrastructure fault; silently
 *    dropping mail because of one is worse than one extra reminder.
 *
 * Records are keyed on `hashEmail()` — see `lib/email/hash.ts` for why the
 * address itself is never stored.
 */

import { db } from "@/lib/db/drizzle";
import { emailOptouts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hashEmail } from "./hash";
import type { EmailStream } from "./senders";

/** Why an address was opted out. */
export type OptoutReason = "one-click" | "bounce" | "complaint" | "manual";

/**
 * Which streams an opt-out covers.
 *
 * `'notification'` — the recipient used the one-click unsubscribe on a
 * reminder. `'all'` — the address bounced or the recipient filed a spam
 * complaint; stop every non-transactional message to it.
 */
export type OptoutScope = "notification" | "all";

/**
 * Records an opt-out, ignoring a repeat of one already on file.
 *
 * Idempotent by design: mail providers retry the RFC 8058 POST, and Resend
 * retries webhooks, so the second and third delivery of the same event must be
 * indistinguishable from the first.
 *
 * @param emailHash sha256 of the normalized address (from {@link hashEmail}).
 * @param scope Which streams the opt-out covers.
 * @param reason What produced it.
 */
export async function recordOptout(
  emailHash: string,
  scope: OptoutScope,
  reason: OptoutReason
): Promise<void> {
  await db
    .insert(emailOptouts)
    .values({ emailHash, stream: scope, reason })
    .onConflictDoNothing({ target: emailOptouts.emailHash });
}

/**
 * Reports whether a message may be sent to an address.
 *
 * @param email The recipient address.
 * @param stream The stream the message belongs to.
 * @returns True only when the message must be withheld. Returns false on any
 *   lookup failure, so a database outage delays nobody's mail.
 */
export async function isSuppressed(
  email: string,
  stream: EmailStream
): Promise<boolean> {
  if (stream !== "notification") return false;

  try {
    const rows = await db
      .select({ stream: emailOptouts.stream })
      .from(emailOptouts)
      .where(eq(emailOptouts.emailHash, hashEmail(email)))
      .limit(1);
    return rows.length > 0;
  } catch (error) {
    console.error("[email] Opt-out lookup failed; sending anyway:", error);
    return false;
  }
}

/**
 * Lists every opt-out on file, newest first.
 *
 * Used by `scripts/email/suppression.ts sync` to fold runtime bounces and
 * complaints back into the committed register the offline scripts read.
 *
 * @returns Hash, scope, reason and timestamp for each entry.
 */
export async function listOptouts(): Promise<
  { emailHash: string; stream: string; reason: string; createdAt: Date }[]
> {
  return db
    .select({
      emailHash: emailOptouts.emailHash,
      stream: emailOptouts.stream,
      reason: emailOptouts.reason,
      createdAt: emailOptouts.createdAt,
    })
    .from(emailOptouts);
}
