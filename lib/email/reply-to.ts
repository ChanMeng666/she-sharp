/**
 * Which She Sharp mailbox answers a reply, decided by what the message is
 * about rather than by which stream carried it.
 *
 * **The stream is the wrong key for this, and using it had already gone
 * wrong twice.** A stream decides the From, the unsubscribe header and whether
 * suppression applies — all properties of *how* a message is sent. Who should
 * read a reply is a property of *what it says*, and the two do not line up: a
 * password reset, a donation receipt, a volunteer interview invitation and a
 * newsletter confirmation are one stream and four different desks.
 *
 * The first failure is recorded in `senders.ts`: the marketing Reply-To was
 * `newsletter@`, a mailbox nobody on the team had the password to, so every
 * subscriber who pressed Reply wrote into a void. The second was found on
 * 2026-09-01 — `transactional` and `notification` both replied to
 * `mentoring@`, so somebody answering a newsletter confirmation with "please
 * take me off this list", or a donor replying to a receipt, landed in the
 * mentorship lead's personal contact address.
 *
 * `docs/development/EMAIL_ADDRESSES.md` is the authority on which of these are
 * real and who reads them. Two rules come from it and are load-bearing here:
 *
 * - **`info@` is the default**, because it is the one address anybody has
 *   confirmed on the record that a human opens. A reply that lands there and
 *   belongs elsewhere gets forwarded; a reply that lands on an unread mailbox
 *   is gone. When in doubt, the general desk is the safe wrong answer and a
 *   specialist mailbox is the dangerous one.
 * - **Never route replies to an address in that file's "retired" or
 *   "unmonitored" tables** — `newsletter@`, `governance@`, `marketing@`,
 *   `podcast@`, `hello@`, `conduct@`, `privacy@` and the rest. `noreply@` is
 *   not a Reply-To either: `senders.ts` says a Reply-To must be a monitored
 *   mailbox, and `gates.ts` fails a send whose From is `noreply@` with no
 *   Reply-To at all.
 */

import { SENDING_DOMAIN } from "./senders";

/**
 * What a message is about, from the point of view of whoever answers it.
 *
 * Deliberately coarse. These are desks, not topics — the question each value
 * answers is "if the recipient hits Reply, whose job is the answer?", and the
 * organisation has seven such jobs, not seventy.
 */
export const EMAIL_PURPOSES = [
  "account",
  "newsletter",
  "mentorship",
  "recruitment",
  "events",
  "payments",
  "internal",
] as const;

export type EmailPurpose = (typeof EMAIL_PURPOSES)[number];

/**
 * The mailbox that answers each purpose.
 *
 * A `Record` rather than a lookup with a default, so adding a purpose without
 * deciding its mailbox does not compile. Every value is a mailbox the address
 * audit lists as real and read.
 */
const REPLY_TO_BY_PURPOSE: Record<EmailPurpose, string> = {
  /** Sign-in, verification, password reset, and site-wide notices. */
  account: `info@${SENDING_DOMAIN}`,
  /**
   * Subscription confirmations and anything else about the mailing list.
   * `info@`, not `newsletter@` — see the module header, and the same decision
   * already taken for the marketing stream's Reply-To in `senders.ts`.
   */
  newsletter: `info@${SENDING_DOMAIN}`,
  /** Mentor and mentee applications, matches, reminders, invitation codes. */
  mentorship: `mentoring@${SENDING_DOMAIN}`,
  /** Volunteer and ambassador applications, interviews, onboarding. */
  recruitment: `people@${SENDING_DOMAIN}`,
  /**
   * Attendee questions about a specific event. Nothing in this repository
   * sends registrant mail today — it is composed in Humanitix's own tool, and
   * `EMAIL_RESPONSIBILITY_BOUNDARIES.md` explains why — but `events@` is the
   * address printed in every event email the organisation has ever sent, so
   * anything here that does reach an attendee must answer to it.
   */
  events: `events@${SENDING_DOMAIN}`,
  /** Membership payments and donation receipts. */
  payments: `info@${SENDING_DOMAIN}`,
  /** Mail to She Sharp's own inboxes; a reply is a developer's problem. */
  internal: `website@${SENDING_DOMAIN}`,
};

/**
 * The mailbox that should answer a reply to this message.
 *
 * @param purpose What the message is about.
 * @returns A monitored `shesharp.org.nz` mailbox.
 */
export function replyToForPurpose(purpose: EmailPurpose): string {
  return REPLY_TO_BY_PURPOSE[purpose];
}

/**
 * Every address this module can produce.
 *
 * Exported for the test, which checks each one against the approved list rather
 * than against a second copy of these literals — a test that restates the table
 * it is testing proves only that copy-paste works.
 *
 * @returns The distinct Reply-To addresses, sorted.
 */
export function allReplyToAddresses(): string[] {
  return [...new Set(Object.values(REPLY_TO_BY_PURPOSE))].sort();
}
