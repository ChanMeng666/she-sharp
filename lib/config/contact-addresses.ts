/**
 * The public mailboxes She Sharp publishes, and what each one is for.
 *
 * These are addresses a *visitor* is invited to write to. They are a different
 * thing from the sender identities in `lib/email/senders.ts`, which govern what
 * this site sends mail *as* — do not mix the two. Nothing here should ever be
 * used as a From address, and nothing in senders.ts should be printed on a
 * page as somewhere to write to.
 *
 * Until now these were typed literally into whichever page needed one, which is
 * how `industry@` — the organisation's sponsorship address since 2023, and
 * re-confirmed in 2026 — ended up published nowhere at all while sixteen other
 * addresses were scattered across the codebase.
 *
 * A full inventory, including the internal-only and DNS-reporting addresses,
 * is in `docs/development/EMAIL_ADDRESSES.md`.
 */

/** General enquiries. The address the contact page and the chatbot give out. */
export const GENERAL_EMAIL = "hello@shesharp.org.nz";

/**
 * Sponsorship and industry partnership enquiries.
 *
 * The 2023 routing decision was explicit: sponsorship material on the website
 * should carry no prices and should direct the reader here rather than to the
 * general inbox.
 */
export const SPONSORSHIP_EMAIL = "industry@shesharp.org.nz";

/** Anything about the mentorship programme — not `info@`, which is general. */
export const MENTORSHIP_EMAIL = "mentoring@shesharp.org.nz";

/**
 * Code of conduct reports. Deliberately separate and deliberately private: it
 * is the route for someone who had a bad experience and should not have to
 * raise it in a public channel or attached to their name on a feedback form.
 */
export const CONDUCT_EMAIL = "conduct@shesharp.org.nz";

/** Trustee and governance matters. */
export const GOVERNANCE_EMAIL = "governance@shesharp.org.nz";

/** Security disclosures — see `/security-policy`. */
export const SECURITY_EMAIL = "security@shesharp.org.nz";

/** Privacy requests — see `/privacy-policy` and `/cookie-policy`. */
export const PRIVACY_EMAIL = "privacy@shesharp.org.nz";

/** Accessibility feedback — see `/accessibility`. */
export const ACCESSIBILITY_EMAIL = "accessibility@shesharp.org.nz";

/** Legal notices — see `/terms-of-service`. */
export const LEGAL_EMAIL = "legal@shesharp.org.nz";
