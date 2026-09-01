/**
 * Where on the site a newsletter sign-up came from.
 *
 * The website used to have exactly one sign-up form, so the consent record it
 * wrote could be a single hardcoded sentence in the route. With the form now
 * appearing in eight places, "which form did they use" becomes a real question
 * — and the answer belongs in `consentSource`, the sentence someone would have
 * to stand behind if a recipient ever asked why they were mailed.
 *
 * The client sends a KEY from this closed list and never prose. That is the
 * same shape as `composeConsentSource()` in `scripts/email/optin-rows.ts`: the
 * wording is composed server-side, so a public endpoint cannot be used to write
 * arbitrary text into the audit record. Adding a placement means adding it here
 * and nowhere else — the `Record` below will not compile until it has a
 * sentence.
 *
 * `source` on the row stays `"website-form"` for every placement:
 * `SubscriberSource` in `./subscribers.ts` is a closed union describing the
 * *mechanism*, and "which form on the website" is not a new mechanism.
 */

/** Every place on the site that can ask for a newsletter sign-up. */
export const NEWSLETTER_PLACEMENTS = [
  "newsletter-page",
  "footer",
  "home",
  "events-index",
  "event-page",
  "event-feedback",
  "newsletter-archive",
  "mentorship",
] as const;

export type NewsletterPlacement = (typeof NEWSLETTER_PLACEMENTS)[number];

/**
 * What the route wrote before placements existed.
 *
 * Every row already in `newsletter_subscribers` with `source = 'website-form'`
 * carries this exact string, so it stays the value for a request that names no
 * placement — an older cached bundle, or a hand-rolled POST. Changing it would
 * make new rows look different from old ones for no reason.
 */
const DEFAULT_CONSENT_SOURCE = "Website newsletter subscribe form";

/**
 * One fixed sentence per placement.
 *
 * Each reads as an answer to "where did this person opt in?", because that is
 * the question the record has to answer. `newsletter-page` keeps the original
 * wording: that placement *is* the form the string was written for, and
 * rewording it would split one form's history across two sentences.
 */
const CONSENT_SOURCE_BY_PLACEMENT: Record<NewsletterPlacement, string> = {
  "newsletter-page": DEFAULT_CONSENT_SOURCE,
  footer: "Website newsletter signup form — site footer",
  home: "Website newsletter signup form — home page",
  "events-index": "Website newsletter signup form — events listing page",
  "event-page": "Website newsletter signup form — event detail page",
  "event-feedback":
    "Website newsletter signup form — post-event feedback confirmation",
  "newsletter-archive": "Website newsletter signup form — newsletter archive",
  mentorship: "Website newsletter signup form — mentorship page",
};

/**
 * The consent sentence for a placement.
 *
 * @param placement The placement the client named, or undefined when it named
 *   none.
 * @returns The sentence to store in `newsletter_subscribers.consent_source`.
 */
export function consentSourceForPlacement(
  placement?: NewsletterPlacement,
): string {
  return placement
    ? CONSENT_SOURCE_BY_PLACEMENT[placement]
    : DEFAULT_CONSENT_SOURCE;
}
