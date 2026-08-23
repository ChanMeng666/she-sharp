/**
 * The public mailboxes She Sharp publishes, and what each one is for.
 *
 * These are addresses a *visitor* is invited to write to. They are a different
 * thing from the sender identities in `lib/email/senders.ts`, which govern what
 * this site sends mail *as* — do not mix the two. Nothing here should ever be
 * used as a From address, and nothing in senders.ts should be printed on a
 * page as somewhere to write to.
 *
 * **Every address here has been proved to accept mail.** On 2026-08-23 a
 * delivery probe sent one message to each candidate through Resend and read the
 * result back; `scripts/email/probe-mailboxes.ts` reruns it. Before that probe
 * this file exported eight addresses that did not exist — `hello@`, `conduct@`,
 * `governance@`, `security@`, `support@`, `privacy@`, `accessibility@` and
 * `legal@` — every one of which hard-bounced. They had been invented by page
 * templates in 2025 and never created in Google Workspace, and they appear
 * nowhere in eleven years of the organisation's Slack history. On 2026-08-13
 * an external correspondent reported, through the contact form, that mail to
 * She Sharp had bounced back; she did not say which address, so that is a
 * symptom rather than proof. `docs/development/EMAIL_ADDRESSES.md` holds the
 * evidence that matters.
 *
 * Several constants below now share a value. That is deliberate: the *name*
 * records where the organisation wants that traffic to go one day, so standing
 * a real mailbox up later is a one-line change here rather than a hunt through
 * the pages. Do not collapse them.
 *
 * A full inventory, including the internal-only and DNS-reporting addresses,
 * is in `docs/development/EMAIL_ADDRESSES.md`.
 */

/**
 * General enquiries — the organisation's front door.
 *
 * The only mailbox anyone has ever confirmed a human opens: asked directly in
 * October 2025 whether she read it, the volunteer holding it answered "once or
 * twice a week, not daily". It is also the address printed on She Sharp's
 * business cards, so it is what people already use.
 */
export const GENERAL_EMAIL = "info@shesharp.org.nz";

/**
 * Sponsorship and industry partnership enquiries.
 *
 * The 2023 routing decision was explicit: sponsorship material on the website
 * should carry no prices and should direct the reader here rather than to the
 * general inbox.
 */
export const SPONSORSHIP_EMAIL = "industry@shesharp.org.nz";

/** Anything about the mentorship programme — not the general inbox. */
export const MENTORSHIP_EMAIL = "mentoring@shesharp.org.nz";

/**
 * Attendee questions about a specific event.
 *
 * The address every event email has printed for years ("reach out to us at
 * events@"), and the login on the ticketing account. It was missing from this
 * site entirely until 2026-08.
 */
export const EVENTS_EMAIL = "events@shesharp.org.nz";

/** Volunteer, ambassador and committee applications. */
export const PEOPLE_EMAIL = "people@shesharp.org.nz";

/**
 * Code of conduct reports.
 *
 * **This is the weakest link on the site and it is deliberate, not an
 * oversight.** A report of this kind should reach a small, named, accountable
 * group — not a shared inbox several volunteers can open. `conduct@` was
 * supposed to be that group; it never existed. Until one is created this points
 * at the general inbox, because an address that is read weekly is still
 * strictly better than one that bounces. Standing up a real `conduct@` as a
 * restricted group is the first item on
 * `docs/deployment/WORKSPACE_MAILBOX_CHECKLIST.md`; the day it exists, change
 * this line and nothing else.
 */
export const CONDUCT_EMAIL = "info@shesharp.org.nz";

/** Trustee and governance matters — records, not confidential reports. */
export const GOVERNANCE_EMAIL = "info@shesharp.org.nz";

/**
 * Security disclosures — see `/security-policy`.
 *
 * Points at the website mailbox rather than the general inbox because a
 * vulnerability report needs a reader who can triage it. This one is read by
 * the founder and the site developer, and is the Google account behind Resend
 * and the old Webflow site.
 */
export const SECURITY_EMAIL = "website@shesharp.org.nz";

/**
 * Privacy requests, including the photograph-removal route carried on every
 * event page — see `docs/development/PHOTOGRAPHING_MINORS.md`.
 *
 * That route is a published commitment, so it cannot sit on an address that
 * bounces, which is what `privacy@` was doing when the notice shipped.
 */
export const PRIVACY_EMAIL = "info@shesharp.org.nz";

/** Accessibility feedback — see `/accessibility`. */
export const ACCESSIBILITY_EMAIL = "info@shesharp.org.nz";

/** Legal notices — see `/terms-of-service`. */
export const LEGAL_EMAIL = "info@shesharp.org.nz";
