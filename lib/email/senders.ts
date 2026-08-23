/**
 * The single source of truth for who She Sharp email comes from.
 *
 * Before this file, the sending identity lived in five places that could drift
 * apart: `EMAIL_FROM`, hard-coded literals in `lib/email/service.ts`, a
 * `DEFAULT_FROM` constant in the newsletter approve route, and prose tables in
 * four skill documents. They had already drifted — the monthly *marketing*
 * broadcast was going out from `noreply@` while its own footer invited replies.
 *
 * Everything is keyed on a **stream**, because the stream is what decides all
 * three things that matter downstream: which address it comes from, whether the
 * message may carry a `List-Unsubscribe` header, and whether a suppressed
 * address is still allowed to receive it. A password reset must reach someone
 * who unsubscribed from reminders; a reminder must not.
 *
 * Every address here must stay on `shesharp.org.nz`. Resend DKIM-signs with
 * `d=shesharp.org.nz`, so a From on any other domain loses DMARC alignment and
 * — once the domain moves to `p=reject` — is silently discarded by the
 * receiver. `isApprovedSender()` exists to catch that before a send, and
 * `docs/deployment/EMAIL_AUTHENTICATION.md` records the DNS side.
 */

/** Which reputation and consent stream a message belongs to. */
export type EmailStream =
  | "transactional"
  | "notification"
  | "marketing"
  | "internal";

export interface SenderIdentity {
  /** RFC 5322 From header: `Name <local@domain>`. */
  from: string;
  /**
   * A monitored Google Workspace mailbox — never a no-reply address.
   *
   * "Monitored" is a claim about people, not about DNS, so it is checked
   * against evidence rather than assumed. Every value below was confirmed to
   * accept mail by the 2026-08-23 delivery probe
   * (`scripts/email/probe-mailboxes.ts`) and has a named reader in the
   * organisation's own records — see `docs/development/EMAIL_ADDRESSES.md`.
   */
  replyTo: string;
  stream: EmailStream;
}

/** The one domain every She Sharp From and Reply-To must sit on. */
export const SENDING_DOMAIN = "shesharp.org.nz";

/**
 * What each stream means, and why the unsubscribe rules differ.
 *
 * - `transactional` — triggered by the recipient's own action, expected within
 *   minutes, must never be suppressed (verification, password reset, receipts).
 * - `notification` — system-generated, recurring, not requested per message
 *   (reminders, queue updates, site-wide announcements). Carries a one-click
 *   `List-Unsubscribe` and honours the suppression list.
 * - `marketing` — the monthly newsletter and one-off announcements. Sent as
 *   Resend broadcasts, which attach their own unsubscribe via segments/topics.
 * - `internal` — to She Sharp's own mailboxes; tagged separately so admin
 *   traffic does not distort per-stream deliverability stats.
 */
export const SENDERS: Record<EmailStream, SenderIdentity> = {
  transactional: {
    from: `She Sharp <noreply@${SENDING_DOMAIN}>`,
    replyTo: `mentoring@${SENDING_DOMAIN}`,
    stream: "transactional",
  },
  notification: {
    from: `She Sharp <noreply@${SENDING_DOMAIN}>`,
    replyTo: `mentoring@${SENDING_DOMAIN}`,
    stream: "notification",
  },
  /**
   * `newsletter@` is deliberate, and it is a continuity decision rather than an
   * aesthetic one.
   *
   * The monthly newsletter has been going out from
   * `She Sharp <newsletter@shesharp.org.nz>` through Mailchimp for years, so
   * that address carries the accumulated engagement history — opens, replies,
   * "not spam" — that Gmail and Outlook weight per sending identity. Moving to
   * Resend already changes the sending infrastructure underneath; changing the
   * visible From at the same moment would start a cold bulk identity on exactly
   * the send where reputation matters most, and would make a deliverability
   * drop impossible to attribute. Subscribers also simply recognise it.
   *
   * Use this for anything going to the mailing list, including one-off
   * announcements.
   *
   * **The Reply-To is deliberately not `newsletter@`, and the split is the
   * point.** The From carries the reputation and must not move. The Reply-To
   * carries none of it, and until August 2026 it pointed at a mailbox nobody
   * on the team had the password to — asked outright in Slack whether anyone
   * read it, nobody answered. Every subscriber who pressed Reply was writing
   * into that. Replies now go to the general inbox, which someone opens.
   */
  marketing: {
    from: `She Sharp <newsletter@${SENDING_DOMAIN}>`,
    replyTo: `info@${SENDING_DOMAIN}`,
    stream: "marketing",
  },
  internal: {
    from: `She Sharp <noreply@${SENDING_DOMAIN}>`,
    replyTo: `website@${SENDING_DOMAIN}`,
    stream: "internal",
  },
};

/**
 * Every address allowed to appear in a From header.
 *
 * A superset of the stream identities above, because the skill-driven scripts
 * send as `info@` for one-to-one mail (contact replies, event fulfilment) —
 * an address that is a legitimate sender without being any stream's default.
 * It was `hello@` until August 2026, when a delivery probe established that
 * `hello@` had never been created; keeping it here would let a skill render a
 * reply whose From nobody could answer.
 *
 * Reply-To is checked against the domain instead of this list, so a reply may
 * be routed to any team mailbox without that mailbox ever being a sender. Note
 * what that check does *not* buy you: passing it means the address is on the
 * right domain, not that anybody reads it. The monitored set is small —
 * `info@`, `mentoring@`, `industry@`, `events@`, `website@` — and is listed
 * with its evidence in `docs/development/EMAIL_ADDRESSES.md`.
 */
const APPROVED_FROM_ADDRESSES = new Set<string>([
  ...Object.values(SENDERS).map((identity) => extractAddress(identity.from)),
  `info@${SENDING_DOMAIN}`,
]);

/**
 * Resolves the sending identity for a stream.
 *
 * `EMAIL_FROM` overrides the `transactional` From only. It predates this file
 * and is set in every environment, so honouring it keeps existing deployments
 * byte-identical; letting it override the other streams is what caused the
 * marketing-from-noreply bug in the first place.
 *
 * @param stream The stream the message belongs to.
 * @returns The From/Reply-To pair to send with.
 */
export function getSenderIdentity(stream: EmailStream): SenderIdentity {
  const identity = SENDERS[stream];
  if (stream === "transactional" && process.env.EMAIL_FROM) {
    return { ...identity, from: process.env.EMAIL_FROM };
  }
  return identity;
}

/**
 * Pulls the bare address out of a From header.
 *
 * @param from `Name <local@domain>` or a bare `local@domain`.
 * @returns The lowercased address, or an empty string if none is present.
 */
export function extractAddress(from: string): string {
  const angled = from.match(/<([^<>]+)>/);
  const raw = angled ? angled[1] : from;
  return raw.trim().toLowerCase();
}

/**
 * Splits a From header into its display name and address.
 *
 * @param from `Name <local@domain>` or a bare `local@domain`.
 * @returns The display name (empty when absent) and the lowercased address.
 */
export function parseFromAddress(from: string): { name: string; address: string } {
  const angled = from.match(/^(.*)<([^<>]+)>\s*$/);
  if (!angled) return { name: "", address: from.trim().toLowerCase() };
  return { name: angled[1].trim(), address: angled[2].trim().toLowerCase() };
}

/**
 * Reports whether a From header is one this organisation may send as.
 *
 * A typo like `info@shesharp.co.nz` is invisible in a preview and, once the
 * domain reaches `p=reject`, is dropped without a bounce. This is the check
 * that turns that silent failure into a blocked send.
 *
 * @param from The From header to validate.
 * @returns True when the address is on the approved list.
 */
export function isApprovedSender(from: string): boolean {
  return APPROVED_FROM_ADDRESSES.has(extractAddress(from));
}

/**
 * Reports whether an address sits on the organisation's sending domain.
 *
 * @param address A bare address or a full From/Reply-To header.
 * @returns True when the address ends in `@shesharp.org.nz`.
 */
export function isOnSendingDomain(address: string): boolean {
  return extractAddress(address).endsWith(`@${SENDING_DOMAIN}`);
}

/** Every approved From address, for error messages and docs. */
export function listApprovedSenders(): string[] {
  return [...APPROVED_FROM_ADDRESSES].sort();
}
