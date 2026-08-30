/**
 * Re-confirmation: letting a subscriber upgrade the consent evidence on their
 * own row.
 *
 * ## Why this exists
 *
 * `newsletter_subscribers` holds 1,549 mailable people, and a tiering of their
 * evidence done on 2026-08-30 found 1,168 of them with weak or unrecoverable
 * provenance: 752 bought a ticket and ticked nothing, 416 arrived through a
 * Mailchimp `Import` nobody can now trace. The cause is known — the Humanitix →
 * Mailchimp ecommerce store had "sync contacts who haven't opted in" switched on
 * until 2026-08-27 — and it is not an emergency: those rows are `subscribed`,
 * they are Tier 0 by `consent-rules.md`'s own definition, and they have taken
 * four abuse reports across 188,796 emails. What they are is evidence we cannot
 * produce when someone asks "why is this person on our list?", which
 * `consent-rules.md` requires us to answer. This path lets the person answer it
 * for us, one press at a time, over the coming issues.
 *
 * ## Why it is not the subscribe form
 *
 * The obvious design — point them at `/newsletter/subscribe` — is a no-op.
 * `decideSubscribe()` returns `"already-subscribed"` for a `subscribed` row and
 * `subscribe()` short-circuits: no token, no email, `confirmedAt` and `source`
 * untouched. Every one of the 1,168 would be told they were already subscribed
 * and their row would stay exactly as weak. Loosening `decideSubscribe()` to fix
 * that would widen the consent *write* path, which is deliberately narrow, so
 * this is a separate route with its own, stricter rule.
 *
 * ## What it writes, and what it refuses to write
 *
 * On success: `confirmedAt = now`, and a sentence appended to `consentSource`
 * naming the act, the issue it came from and the date.
 *
 * **`source` is left alone.** `consent-rules.md` defines it as the
 * machine-readable route the person *arrived by* — `website-form`,
 * `registration-optin`, or the import's name. A re-confirmation is not a new
 * arrival; it is fresh evidence about an existing one, so rewriting `source`
 * would erase how they actually got onto the list. The question the record has
 * to answer is "why is this person on our list?", and after a re-confirmation
 * the honest answer is *both* facts: they arrived through the Mailchimp import,
 * **and** they pressed a button in a named issue. Keeping `source` and
 * appending to `consentSource` records both; overwriting `source` would record
 * only the second and lose the first.
 *
 * (What `source` is *not* is a way to tell the cohorts apart.
 * `import-mailchimp-subscribers.ts` hardcodes `mailchimp-import`, so all 1,549
 * rows carry it and it distinguishes nobody — the evidence tiering above was
 * computed from the Mailchimp API members dump in the private archive, whose
 * own `source` field carries `Mahsa McCauley NZD`, `Import`, `Embed Form` and
 * the rest. Do not reach for this column to reproduce those numbers.)
 *
 * ## The suppression edge, which is the sharp one
 *
 * `selectMailable()` re-admits a suppressed subscriber when their `confirmedAt`
 * is later than the suppression covering them. This route sets `confirmedAt` to
 * *now*, which is later than everything — so a careless version of it would be a
 * general-purpose resurrection machine for the do-not-contact registers. The
 * concrete sequence is not hypothetical: the September issue goes out on the
 * 1st, someone unsubscribes in Mailchimp (still the live sender) on the 3rd,
 * `suppression.ts pull-mailchimp` stamps their hash on the 5th, and they press
 * the button in that same still-open email on the 6th. Nothing about the row's
 * *status* has changed — the pull writes the register, not the table — so a
 * status check alone would let it through, and their `confirmedAt` would then
 * outrank the register entry for good.
 *
 * So the rule here is deliberately stricter than `selectMailable()`'s: presence
 * on **either** register refuses, whatever the timestamps say. That gives up one
 * harmless case — somebody suppressed years ago who legitimately re-subscribed
 * through the website form is already mailable and simply cannot upgrade
 * evidence they already hold in its strongest form — and buys the invariant that
 * matters:
 *
 * > **This route can only ever refresh the evidence of someone who is already
 * > mailable. It can never make a non-mailable address mailable.**
 *
 * Being strictly stricter is also why the rule is safe to state twice. A rule
 * that merely *duplicated* `selectMailable()` could drift away from it and start
 * mailing someone; this one can only ever drift towards refusing.
 */

import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/drizzle";
import { newsletterSubscribers } from "@/lib/db/schema";
import { findOptout } from "@/lib/email/optouts";
import { isRegisterSuppressed } from "@/lib/email/suppression-register";
import type { SubscriberStatus } from "./subscribers";

/** Why a re-confirmation was refused. Internal — never returned to a caller. */
export type ReconfirmRefusal =
  | "no-row"
  | "not-subscribed"
  | "runtime-suppressed"
  | "register-suppressed";

export type ReconfirmDecision =
  | { decision: "reconfirm" }
  | { decision: "refuse"; reason: ReconfirmRefusal };

/** Everything the rule needs, gathered by the caller so the rule stays pure. */
export interface ReconfirmContext {
  /** The row's status, or null/undefined when there is no row. */
  currentStatus: SubscriberStatus | null | undefined;
  /** The reason from `email_optouts`, if the address is on it. */
  optoutReason: string | null | undefined;
  /** Whether the hash is on the committed do-not-contact register. */
  registerSuppressed: boolean;
}

/**
 * Decides whether a re-confirmation may be written.
 *
 * Extracted from {@link reconfirmByHash} so the rule can be tested without a
 * database, exactly as `decideSubscribe()` is — and because this is the rule
 * whose failure is silent: a wrong answer here does not throw, it writes a
 * timestamp that outranks a suppression forever.
 *
 * @param context The row's status and both suppression answers.
 * @returns Whether to write, and if not, why.
 */
export function decideReconfirm(context: ReconfirmContext): ReconfirmDecision {
  const { currentStatus, optoutReason, registerSuppressed } = context;

  // No row at all. A re-confirmation is not a subscription and must never
  // create one: the way onto the list is the subscribe form, and only that.
  if (!currentStatus) return { decision: "refuse", reason: "no-row" };

  // `unsubscribed`, `bounced`, `complained` and `pending` all land here.
  // A complaint is terminal; an unsubscribe is reversible only by the person
  // through the website form; a `pending` row has never been confirmed at all
  // and confirming it here would skip the double opt-in it is waiting for.
  if (currentStatus !== "subscribed") {
    return { decision: "refuse", reason: "not-subscribed" };
  }

  // Any reason, not just "complaint". A row that is `subscribed` *and* carries
  // an `email_optouts` entry is drift between two stores that disagree, and the
  // one direction drift must never be resolved in is "therefore mail them".
  if (optoutReason) return { decision: "refuse", reason: "runtime-suppressed" };

  if (registerSuppressed) {
    return { decision: "refuse", reason: "register-suppressed" };
  }

  return { decision: "reconfirm" };
}

/** The machine-readable marker that makes a repeat press idempotent. */
function issueMarker(issueId: string | null): string {
  return `[reconfirm:${issueId ?? "unattributed"}]`;
}

/**
 * Composes the sentence appended to `consentSource`.
 *
 * Appended rather than replaced: the existing sentence is the row's origin
 * story — for most of these rows, the Mailchimp export's provenance — and
 * throwing it away to record a newer act would answer "why is this person on
 * our list?" less completely than before, which is the opposite of the point.
 *
 * @param existing The row's current `consentSource`.
 * @param issueId The `YYYY-MM` issue the link came from, or null when the link
 *   carried no issue.
 * @param at When the button was pressed.
 * @returns The new `consentSource`, or null when the act is already recorded
 *   for this issue and nothing should be appended.
 */
export function appendReconfirmSentence(
  existing: string,
  issueId: string | null,
  at: Date
): string | null {
  const marker = issueMarker(issueId);
  if (existing.includes(marker)) return null;

  const day = at.toISOString().slice(0, 10);
  const from = issueId
    ? `the ${issueId} newsletter`
    : "a newsletter email that did not identify its issue";
  const sentence =
    `Re-confirmed by the subscriber from ${from} on ${day} — ` +
    `button press at /newsletter/reconfirm. ${marker}`;

  return existing.trim().length > 0 ? `${existing.trim()} | ${sentence}` : sentence;
}

export type ReconfirmOutcome =
  | { outcome: "reconfirmed"; email: string }
  | { outcome: "refused"; reason: ReconfirmRefusal };

/**
 * Records a re-confirmation against a hash.
 *
 * Keyed on the hash because that is all the signed token carries — the address
 * deliberately never travels in the URL, for the same reason it does not travel
 * in an unsubscribe URL.
 *
 * The UPDATE re-asserts `status = 'subscribed'` in its `WHERE` rather than
 * trusting the row read a moment earlier: a one-click unsubscribe arriving
 * between the read and the write must win, and it is exactly the case where
 * losing would be worst.
 *
 * @param emailHash sha256 of the normalized address.
 * @param issueId The `YYYY-MM` issue the link came from, or null.
 * @param now Injectable clock, for tests.
 * @returns The outcome, with the address on success so the page can show it.
 */
export async function reconfirmByHash(
  emailHash: string,
  issueId: string | null,
  now: Date = new Date()
): Promise<ReconfirmOutcome> {
  const rows = await db
    .select({
      id: newsletterSubscribers.id,
      email: newsletterSubscribers.email,
      status: newsletterSubscribers.status,
      consentSource: newsletterSubscribers.consentSource,
    })
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.emailHash, emailHash))
    .limit(1);

  const row = rows[0];

  // Both registers are consulted even when there is no row, so the decision
  // function sees the same picture the tests give it.
  const optout = await findOptout(emailHash);
  const decision = decideReconfirm({
    currentStatus: row?.status,
    optoutReason: optout?.reason,
    registerSuppressed: isRegisterSuppressed(emailHash),
  });

  if (decision.decision === "refuse" || !row) {
    return {
      outcome: "refused",
      reason: decision.decision === "refuse" ? decision.reason : "no-row",
    };
  }

  const nextConsentSource = appendReconfirmSentence(row.consentSource, issueId, now);

  const updated = await db
    .update(newsletterSubscribers)
    .set({
      // The act being recorded. Everything else on the row is provenance about
      // how they arrived and stays as it is — `source` above all.
      confirmedAt: now,
      ...(nextConsentSource ? { consentSource: nextConsentSource } : {}),
      updatedAt: now,
    })
    .where(
      and(
        eq(newsletterSubscribers.id, row.id),
        eq(newsletterSubscribers.status, "subscribed")
      )
    )
    .returning({ email: newsletterSubscribers.email });

  if (updated.length === 0) {
    // The row moved out of `subscribed` between the read and the write.
    return { outcome: "refused", reason: "not-subscribed" };
  }

  return { outcome: "reconfirmed", email: updated[0].email };
}
