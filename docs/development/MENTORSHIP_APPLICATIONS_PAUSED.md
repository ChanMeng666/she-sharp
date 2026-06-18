# Mentorship Applications — Temporarily Paused

**Status:** PAUSED
**Date paused:** 2026-06-19
**Commit:** `1d26970` — `feat(mentorship): temporarily pause applications behind a coming-soon page`

## Why

The mentorship programme is not onboarding new mentees or mentors at the moment.
The two application forms were put out of reach **without deleting their code**, so
the pause is fully reversible. This document is the runbook for re-opening
applications later.

## What changed

| # | Change | File(s) |
|---|--------|---------|
| 1 | New "coming soon" placeholder page at `/mentorship/coming-soon` | `app/(site)/mentorship/coming-soon/page.tsx` (new file) |
| 2 | The 4 direct "apply" buttons now link to `/mentorship/coming-soon` (button **text was intentionally kept unchanged**) | `components/mentorship/mentee/become-mentee-cta-section.tsx`, `components/mentorship/mentor/become-mentor-cta-section.tsx`, `app/(site)/mentorship/mentee/page.tsx` (StickyApplyBar), `app/(site)/mentorship/mentor/page.tsx` (StickyApplyBar) |
| 3 | Direct-URL access to the apply forms 307-redirects to the placeholder | `next.config.ts` (`redirects()` block) |
| 4 | "Join Mentorship" top-nav button hidden (commented out, with TODO) | `lib/config/navigation.ts` |

### Intentionally left unchanged
- The application form pages themselves still exist and work — `app/(site)/mentorship/mentee/apply/page.tsx` and `app/(site)/mentorship/mentor/apply/page.tsx`. They are only made unreachable via the `next.config.ts` redirect.
- The info pages `/mentorship/mentee` and `/mentorship/mentor` remain publicly accessible; only their apply buttons were redirected.
- The Mentorship nav **dropdown** items ("Become a Mentee" / "Become a Mentor"), footer links, how-it-works links, and chatbot links — these point to the info pages, not the apply forms, so they were left as-is.

## How to RE-OPEN applications (revert)

Do all four steps, then restart the dev server / redeploy:

1. **Restore the 4 button hrefs** back to the apply routes:
   - `components/mentorship/mentee/become-mentee-cta-section.tsx` → `href="/mentorship/mentee/apply"`
   - `app/(site)/mentorship/mentee/page.tsx` (StickyApplyBar) → `href="/mentorship/mentee/apply"`
   - `components/mentorship/mentor/become-mentor-cta-section.tsx` → `href="/mentorship/mentor/apply"`
   - `app/(site)/mentorship/mentor/page.tsx` (StickyApplyBar) → `href="/mentorship/mentor/apply"`

2. **Remove the `redirects()` block** from `next.config.ts` (the block commented "Temporarily hide the mentorship application forms"). Redirect changes require a **dev-server restart** to take effect.

3. **Un-comment the "Join Mentorship" button** in `lib/config/navigation.ts` (the block marked `// TODO: Re-enable "Join Mentorship" once the mentorship programme reopens.`).

4. **Delete** `app/(site)/mentorship/coming-soon/page.tsx` (optional — harmless to keep, but no longer linked).

> Tip: the fastest way to find every touched spot is to grep for `/mentorship/coming-soon` across the repo — every hit is a button to restore, plus the placeholder page itself.

## Verification (after re-opening OR re-confirming the pause)

Run `pnpm dev` and check:
- `/mentorship/mentee/apply` and `/mentorship/mentor/apply` — should render the forms (re-opened) or 307-redirect to `/mentorship/coming-soon` (paused).
- `/mentorship/mentee` and `/mentorship/mentor` — the CTA button + bottom sticky bar go to the apply forms (re-opened) or to the placeholder (paused).
- Top nav bar — "Join Mentorship" button is visible (re-opened) or absent (paused).

Verified at pause time (2026-06-19) via local dev server:
`coming-soon` → 200, both `*/apply` routes → 307 → `/mentorship/coming-soon`, `Join Mentorship` absent from rendered home page.
