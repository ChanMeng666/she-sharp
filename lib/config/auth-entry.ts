/**
 * Whether the public site advertises the account portal to logged-out visitors.
 *
 * Set to false on 2026-09-05 at the founder's request: "For now, I want you to
 * disable Sign up / sign in button on the landing page. Keep everything else
 * untouched!" The mentorship programme — the only thing a public visitor could
 * sign up FOR — is not running for the rest of 2026, so inviting strangers to
 * create an account advertises a closed programme.
 *
 * This hides the entry point only. It is deliberately NOT an access control:
 * /sign-in still renders and every existing member, mentor and mentee keeps
 * their account and can sign in by going to the URL directly, which is what the
 * founder asked for. Anything that genuinely closes the portal is a separate
 * decision, deferred to the meeting on Thursday 2026-09-10.
 *
 * To restore, flip this to true — that is the whole revert.
 * See docs/development/MENTORSHIP_APPLICATIONS_PAUSED.md.
 */
export const PUBLIC_SIGN_IN_ENTRY_ENABLED = false;
