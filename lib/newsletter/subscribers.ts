/**
 * The newsletter subscriber list: the marketing consent record.
 *
 * Until this module existed, Resend's segment and topic membership was the only
 * record of who had opted in, and `consent-rules.md` said so in as many words.
 * It now lives in `newsletter_subscribers`, which means two things Resend used
 * to guarantee for us have to be guaranteed here instead:
 *
 * 1. **Only a confirmed row is mailable.** `listSubscribed()` is the single
 *    enumeration point, and it returns `status = 'subscribed'` and nothing else.
 * 2. **Every exit route lands here.** A one-click unsubscribe, a hard bounce and
 *    a spam complaint all reach the list through `unsubscribeByHash()`,
 *    `markBouncedByHash()` and `markComplainedByHash()`, keyed on the hash,
 *    because a hash is all the unsubscribe token and the webhook can give us.
 *
 * The account-wide complaint ceiling is 0.08% — about 1.25 complaints on a full
 * send — and breaching it takes password resets down with the newsletter. That
 * is why `complained` is terminal here, and why every ambiguous case in this
 * file resolves towards not sending.
 */

import { randomBytes } from "node:crypto";
import { and, eq, gt, isNotNull, lt } from "drizzle-orm";

import { db } from "@/lib/db/drizzle";
import { newsletterSubscribers } from "@/lib/db/schema";
import { hashEmail } from "@/lib/email/hash";
import { findOptout } from "@/lib/email/optouts";

/** How long a confirmation link stays valid. */
export const CONFIRM_TTL_DAYS = 7;

/** Bytes of randomness in a confirmation token (43 base64url characters). */
const CONFIRM_TOKEN_BYTES = 32;

/** Where a subscription came from. Free prose goes in `consentSource`. */
export type SubscriberSource =
  | "website-form"
  | "mailchimp-import"
  | "event-optin"
  | "written-request";

/** Why a subscriber stopped being mailable. */
export type UnsubscribeReason =
  | "one-click"
  | "page"
  | "bounce"
  | "complaint"
  | "admin";

export interface SubscribeInput {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  source: SubscriberSource;
  /** The sentence someone would have to stand behind. See consent-rules.md. */
  consentSource: string;
  consentDate?: Date;
  consentIp?: string | null;
  consentUserAgent?: string | null;
}

/**
 * What a subscribe attempt did.
 *
 * `blocked` deliberately carries no reason: the public endpoint must answer
 * identically whether or not an address is known, or it becomes an
 * address-enumeration oracle.
 */
export type SubscribeOutcome =
  | { outcome: "confirmation-sent"; email: string; token: string }
  | { outcome: "already-subscribed"; email: string }
  | { outcome: "blocked" };

export type ConfirmOutcome =
  | { outcome: "confirmed"; email: string }
  | { outcome: "invalid" };

/**
 * Trims and lowercases an address so it hashes and compares consistently.
 *
 * Matches `hashEmail()` exactly. If the two ever diverged, one person would
 * occupy two rows and one of those rows would be unreachable by unsubscribe.
 *
 * @param email A raw address, as typed or as exported.
 * @returns The normalized address.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Mints a fresh single-use confirmation token. */
export function mintToken(): string {
  return randomBytes(CONFIRM_TOKEN_BYTES).toString("base64url");
}

/**
 * The expiry stamp for a token minted at a given moment.
 *
 * @param from The mint time.
 * @returns When the token stops working.
 */
export function confirmExpiry(from: Date): Date {
  return new Date(from.getTime() + CONFIRM_TTL_DAYS * 24 * 60 * 60 * 1000);
}

/** The statuses a row can hold. Mirrors `subscriberStatusEnum`. */
export type SubscriberStatus =
  | "pending"
  | "subscribed"
  | "unsubscribed"
  | "bounced"
  | "complained";

/** What `subscribe()` should do, before any row is written. */
export type SubscribeDecision = "blocked" | "already-subscribed" | "proceed";

/**
 * Decides whether a subscription request may proceed.
 *
 * Extracted from `subscribe()` so the rule can be tested without a database,
 * because it is the rule most expensive to get wrong in either direction:
 * blocking too much silently breaks the only legitimate way back onto the list,
 * and blocking too little re-mails someone who filed a spam complaint.
 *
 * @param optoutReason The reason from `email_optouts`, if the address is on it.
 * @param currentStatus The existing row's status, if there is a row.
 * @returns Whether to proceed, report an existing subscription, or refuse.
 */
export function decideSubscribe(
  optoutReason: string | null | undefined,
  currentStatus: SubscriberStatus | null | undefined
): SubscribeDecision {
  // Terminal in both stores. A complaint is never reversed, by any route,
  // including the person's own form submission.
  if (optoutReason === "complaint") return "blocked";
  if (currentStatus === "complained") return "blocked";

  if (currentStatus === "subscribed") return "already-subscribed";

  // `unsubscribed` and `bounced` fall through deliberately: consent-rules.md
  // names the website form as the one way back onto the list, so refusing here
  // would contradict the rule this table exists to enforce.
  return "proceed";
}

/**
 * Decides whether an exit event should move a row.
 *
 * @param currentStatus The row's status now.
 * @param target The state the event wants to move it to.
 * @returns True when the row should be written.
 */
export function shouldApplyExit(
  currentStatus: SubscriberStatus,
  target: "unsubscribed" | "bounced" | "complained"
): boolean {
  // Nothing downgrades a complaint: it is the strongest signal we ever get and
  // a later bounce or unsubscribe must not overwrite the reason we hold.
  if (currentStatus === "complained") return false;
  // Providers retry the one-click POST and Resend retries webhooks, so a repeat
  // must leave the original timestamp alone.
  if (currentStatus === target) return false;
  return true;
}

/**
 * Records a subscription request and returns the token to email.
 *
 * Never writes a mailable row: the result is always `pending` until the person
 * clicks the link. Re-requesting for an address that is already pending replaces
 * the token, so unclicked links cannot pile up into several live tokens.
 *
 * Blocking is narrow on purpose. A spam complaint is terminal, because a second
 * complaint from the same address is the most expensive email She Sharp can
 * send. A previous *unsubscribe* is not blocked: `consent-rules.md` says the way
 * back onto the list is the person themselves through this very form, so
 * refusing here would contradict the rule this table exists to enforce.
 *
 * @param input The address, names and the consent provenance.
 * @returns What happened, plus the token when one was minted.
 */
export async function subscribe(input: SubscribeInput): Promise<SubscribeOutcome> {
  const email = normalizeEmail(input.email);
  const emailHash = hashEmail(email);

  const optout = await findOptout(emailHash);

  const existing = await db
    .select()
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.emailHash, emailHash))
    .limit(1);

  const current = existing[0];
  const decision = decideSubscribe(optout?.reason, current?.status);
  if (decision === "blocked") return { outcome: "blocked" };
  if (decision === "already-subscribed") {
    return { outcome: "already-subscribed", email };
  }

  const token = mintToken();
  const now = new Date();
  const values = {
    email,
    emailHash,
    firstName: input.firstName ?? null,
    lastName: input.lastName ?? null,
    status: "pending" as const,
    source: input.source,
    consentSource: input.consentSource,
    consentDate: input.consentDate ?? now,
    consentIp: input.consentIp ?? null,
    consentUserAgent: input.consentUserAgent ?? null,
    confirmToken: token,
    confirmSentAt: now,
    confirmExpiresAt: confirmExpiry(now),
    updatedAt: now,
  };

  if (current) {
    // Re-requesting from `unsubscribed` or `bounced` is the documented way back
    // onto the list, so the provenance is refreshed along with the token: the
    // row must record the act that just happened, not the one from years ago.
    await db
      .update(newsletterSubscribers)
      .set(values)
      .where(eq(newsletterSubscribers.id, current.id));
  } else {
    await db.insert(newsletterSubscribers).values(values);
  }

  return { outcome: "confirmation-sent", email, token };
}

/**
 * Completes double opt-in against a token.
 *
 * One guarded UPDATE: a token that has expired, been spent, or never existed all
 * fail the same `WHERE`, so no caller can distinguish them and none has to. The
 * token is cleared on success, which is what makes it single-use.
 *
 * @param token The `t` query parameter from the confirmation link.
 * @returns The outcome, with the address on success so the page can show it.
 */
export async function confirmSubscription(token: string): Promise<ConfirmOutcome> {
  if (!token) return { outcome: "invalid" };

  const now = new Date();
  const confirmed = await db
    .update(newsletterSubscribers)
    .set({
      status: "subscribed",
      confirmedAt: now,
      confirmToken: null,
      confirmExpiresAt: null,
      // Confirming after a previous exit is a fresh subscription, so the old
      // departure must not stay on the row and read as current.
      unsubscribedAt: null,
      unsubscribeReason: null,
      updatedAt: now,
    })
    .where(
      and(
        eq(newsletterSubscribers.confirmToken, token),
        gt(newsletterSubscribers.confirmExpiresAt, now)
      )
    )
    .returning({ email: newsletterSubscribers.email });

  if (confirmed.length > 0) {
    return { outcome: "confirmed", email: confirmed[0].email };
  }

  return { outcome: "invalid" };
}

/**
 * Marks a subscriber as having left, by hash.
 *
 * Keyed on the hash because that is all the RFC 8058 token carries — the address
 * deliberately never travels in an unsubscribe URL. Idempotent: providers retry
 * the one-click POST, and a repeat must be indistinguishable from the first.
 *
 * @param emailHash sha256 of the normalized address.
 * @param reason What produced the exit.
 * @returns True when a row moved; false when there was nothing to move.
 */
export async function unsubscribeByHash(
  emailHash: string,
  reason: UnsubscribeReason
): Promise<boolean> {
  return setExitStatus(emailHash, "unsubscribed", reason);
}

/**
 * Marks a subscriber's address as hard-bouncing.
 *
 * @param emailHash sha256 of the normalized address.
 * @returns True when a row moved.
 */
export async function markBouncedByHash(emailHash: string): Promise<boolean> {
  return setExitStatus(emailHash, "bounced", "bounce");
}

/**
 * Marks a subscriber as having filed a spam complaint.
 *
 * The terminal state: `subscribe()` refuses to bring them back by any route,
 * including their own form submission.
 *
 * @param emailHash sha256 of the normalized address.
 * @returns True when a row moved.
 */
export async function markComplainedByHash(emailHash: string): Promise<boolean> {
  return setExitStatus(emailHash, "complained", "complaint");
}

/**
 * The shared write behind the three exit routes.
 *
 * A `complained` row is never downgraded, and a row already in the target state
 * is left alone, so the record says when someone actually left rather than when
 * a provider's retry arrived.
 *
 * @param emailHash sha256 of the normalized address.
 * @param status The state to move to.
 * @param reason What produced the exit.
 * @returns True when a row moved.
 */
async function setExitStatus(
  emailHash: string,
  status: "unsubscribed" | "bounced" | "complained",
  reason: UnsubscribeReason
): Promise<boolean> {
  const rows = await db
    .select({ id: newsletterSubscribers.id, status: newsletterSubscribers.status })
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.emailHash, emailHash))
    .limit(1);

  const row = rows[0];
  if (!row) return false;
  if (!shouldApplyExit(row.status, status)) return false;

  const now = new Date();
  await db
    .update(newsletterSubscribers)
    .set({
      status,
      unsubscribedAt: now,
      unsubscribeReason: reason,
      // A pending confirmation must not survive an exit: clicking a stale link
      // afterwards would silently resurrect the subscription.
      confirmToken: null,
      confirmExpiresAt: null,
      updatedAt: now,
    })
    .where(eq(newsletterSubscribers.id, row.id));

  return true;
}

/** One mailable subscriber, in the shape the batch builder consumes. */
export interface MailableSubscriber {
  email: string;
  firstName: string | null;
  lastName: string | null;
}

/**
 * Every address that may receive marketing mail.
 *
 * The single enumeration point for the list, and deliberately the only exported
 * function that returns addresses in bulk. Suppression is applied on top of this
 * by the recipient builder, not here: this answers "who consented?", not "who
 * may receive this particular message?".
 *
 * @returns Confirmed subscribers, oldest first.
 */
export async function listSubscribed(): Promise<MailableSubscriber[]> {
  return db
    .select({
      email: newsletterSubscribers.email,
      firstName: newsletterSubscribers.firstName,
      lastName: newsletterSubscribers.lastName,
    })
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.status, "subscribed"))
    .orderBy(newsletterSubscribers.createdAt);
}

/**
 * Every confirmed subscriber, with the fields a send needs to decide about them.
 *
 * Separate from {@link listSubscribed} because a send needs two things that a
 * plain recipient list does not: the hash, to check both suppression registers
 * without ever comparing addresses, and `confirmedAt`, to apply the
 * re-subscription rule — a confirmation later than a suppression entry is the
 * person coming back through the form, which `consent-rules.md` permits.
 *
 * The rule itself lives in `scripts/email/mailable.ts`, so the recipient builder
 * and the drift report cannot implement it differently.
 *
 * @returns Confirmed subscribers, oldest first.
 */
export async function listMailableCandidates(): Promise<
  {
    email: string;
    firstName: string | null;
    lastName: string | null;
    emailHash: string;
    confirmedAt: Date | null;
  }[]
> {
  return db
    .select({
      email: newsletterSubscribers.email,
      firstName: newsletterSubscribers.firstName,
      lastName: newsletterSubscribers.lastName,
      emailHash: newsletterSubscribers.emailHash,
      confirmedAt: newsletterSubscribers.confirmedAt,
    })
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.status, "subscribed"))
    .orderBy(newsletterSubscribers.createdAt);
}

/**
 * Counts subscribers by status, for the roster report and the pre-send plan.
 *
 * @returns A count per status, omitting statuses with no rows.
 */
export async function countByStatus(): Promise<Record<string, number>> {
  const rows = await db
    .select({ status: newsletterSubscribers.status })
    .from(newsletterSubscribers);

  const counts: Record<string, number> = {};
  for (const row of rows) counts[row.status] = (counts[row.status] ?? 0) + 1;
  return counts;
}

/**
 * Every confirmed subscriber's hash, for reconciliation against the suppression
 * registers.
 *
 * Returns hashes rather than addresses so a drift report can be printed, logged
 * and pasted into Slack without carrying PII — the same reason the batch
 * manifests hold hashes only.
 *
 * @returns Hash and confirmation date for each mailable row.
 */
export async function listSubscribedHashes(): Promise<
  { emailHash: string; confirmedAt: Date | null }[]
> {
  return db
    .select({
      emailHash: newsletterSubscribers.emailHash,
      confirmedAt: newsletterSubscribers.confirmedAt,
    })
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.status, "subscribed"));
}

/**
 * Clears confirmation tokens that were never used.
 *
 * A `pending` row is never mailed, so an expired one is harmless — but leaving
 * the token in place leaves a dead link that looks live to whoever finds it in
 * an old inbox months later.
 *
 * @param now Injectable clock, for tests.
 * @returns How many tokens were cleared.
 */
export async function sweepExpiredTokens(now: Date = new Date()): Promise<number> {
  const cleared = await db
    .update(newsletterSubscribers)
    .set({ confirmToken: null, confirmExpiresAt: null, updatedAt: now })
    .where(
      and(
        eq(newsletterSubscribers.status, "pending"),
        isNotNull(newsletterSubscribers.confirmToken),
        lt(newsletterSubscribers.confirmExpiresAt, now)
      )
    )
    .returning({ id: newsletterSubscribers.id });

  return cleared.length;
}
