/**
 * Audience tiers and the consent rules that govern who may be emailed.
 *
 * She Sharp holds several address lists that were collected for different
 * reasons, and consent does not transfer between them: someone who registered
 * for one event did not ask for our newsletter, and someone who wrote to us
 * asked for a reply, not a campaign. `assertSendAllowed` encodes that as a hard
 * precondition every sending script must call before its first send, so the
 * rule is enforced in code rather than remembered by whoever runs the script.
 *
 * Tiers:
 *  0 — Confirmed newsletter subscribers. Anything may be sent. The record is
 *      the `newsletter_subscribers` table in our own database — a `subscribed`
 *      row, reached by double opt-in — not membership of a Resend segment,
 *      which is no longer consulted for consent.
 *  1 — People who wrote to us. 1:1 replies only.
 *  2 — Event registrants / active mentorship participants. Fulfilment mail for
 *      the thing they signed up for, only.
 *  3 — Off-limits. Scraped, inherited, or otherwise unconsented addresses.
 */

export type AudienceTier = 0 | 1 | 2 | 3;

export interface Recipient {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  /** Extra per-recipient merge values, e.g. { eventTitle: "…" }. */
  fields?: Record<string, string>;
}

/** Short labels for logs, plan blocks and CLI output. */
export const TIER_LABELS: Record<AudienceTier, string> = {
  0: "Tier 0 — confirmed newsletter subscribers (double opt-in)",
  1: "Tier 1 — people who wrote to us (1:1 replies only)",
  2: "Tier 2 — event registrants / active participants (fulfilment only)",
  3: "Tier 3 — off-limits (no consent)",
};

/** One-line explanation of what a tier permits. */
const TIER_RULES: Record<AudienceTier, string> = {
  0: "Transactional and marketing sends are both allowed.",
  1: "Transactional 1:1 replies only — never a campaign.",
  2: "Only mail that fulfils what they signed up for.",
  3: "No sending, ever, for any reason.",
};

/**
 * Throws unless the category/tier combination is allowed.
 *
 * @param opts.category The sending intent of the message.
 * @param opts.tier The audience tier the recipient list came from.
 * @throws Error explaining the rule and the correct alternative.
 */
export function assertSendAllowed(opts: {
  category: "transactional" | "marketing";
  tier: AudienceTier;
}): void {
  const { category, tier } = opts;

  if (tier === 3) {
    throw new Error(
      `Blocked: ${TIER_LABELS[3]}. These addresses have given no consent to be ` +
        `contacted, so no email — transactional or marketing — may be sent to them. ` +
        `If you believe an address belongs on a lower tier, move it there ` +
        `deliberately with a record of where the consent came from.`
    );
  }

  if (category === "marketing" && tier >= 1) {
    throw new Error(
      `Blocked: cannot send a marketing email to ${TIER_LABELS[tier]}. ` +
        `Registering for an event or writing to us is not a newsletter ` +
        `subscription — consent does not transfer between lists. The correct ` +
        `path is to invite these people to subscribe themselves (a one-line ` +
        `link to /newsletter/subscribe inside mail they DID ask for), let them ` +
        `confirm, and then send the campaign to Tier 0 — which is read from the ` +
        `newsletter_subscribers table, so nobody lands there without a ` +
        `confirmed opt-in on record. Alternatively, re-scope this send as ` +
        `transactional fulfilment for the thing they actually signed up for.`
    );
  }
}

/**
 * Describes a tier for a plan block or a log line.
 *
 * @param tier The audience tier.
 * @returns The tier label followed by what it permits.
 */
export function describeTier(tier: AudienceTier): string {
  return `${TIER_LABELS[tier]} — ${TIER_RULES[tier]}`;
}
