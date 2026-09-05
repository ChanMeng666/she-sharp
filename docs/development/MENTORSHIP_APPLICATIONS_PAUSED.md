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

---

## 2026-09-05 — wind-down for the rest of 2026

The June pause closed the **application forms**. It left two things still
advertising the programme, and on 2026-09-05 the founder hit both on her phone
and asked for them closed.

| # | Change | File(s) |
|---|--------|---------|
| 5 | Public "Sign In" entry point hidden site-wide for logged-out visitors | `lib/config/auth-entry.ts` (new), `components/layout/user-nav.tsx` |
| 6 | Chatbot no longer quotes a membership price, in any surface | `components/chatbot/preset-questions.ts`, `lib/chatbot/knowledge.ts` |

### Why each

**5 — the Sign In button.** Verbatim: *"For now, I want you to disable Sign up /
sign in button on the landing page. Keep everything else untouched!"* The button
lives in the global site header (`components/layout/user-nav.tsx`, rendered from
`site-header.tsx:304` desktop and `:525` mobile drawer), so there is no
landing-page-only variant that would not leave it showing on every other public
page. It is therefore hidden **site-wide when logged out**, which is the closest
faithful reading. Flip `PUBLIC_SIGN_IN_ENTRY_ENABLED` to `true` to restore —
that is the entire revert.

This is **not** access control. `/sign-in` still renders, `proxy.ts` is
unchanged, and every existing member, mentor and mentee keeps their account and
can sign in via the URL directly. The founder separately approved silently
disabling the mentorship login portal (no notification emails); **that was not
done** — it was not part of the instruction she finally gave.

**6 — the chatbot price.** Verbatim: *"I don't know why you add price to
mentoring without checking with me."* The `$100 NZD/year` figure appeared in
three chatbot surfaces, none gated by `isMentorshipOpen()`:
`preset-questions.ts` id `7` (the card she screenshotted, which also still said
*"Join now"* with live apply links), id `2`, and `knowledge.ts` line 75 in the
LLM's own knowledge base. The price is **removed rather than gated**, because
her objection is that no price was ever approved — so re-opening applications
must not silently restore it. `knowledge.ts` now instructs the model never to
quote a price or call it free, and to refer anyone who needs a definite answer
to the general enquiries address.

### Deliberately left alone

- `app/(site)/mentorship/mentee/payment/page.tsx` still contains `$100 NZD/year`.
  It is client-rendered and needs a submission `id`, so the figure is **not in
  the public HTML** — verified with `curl` on 2026-09-05. Behind the pause.
- `lib/email/service.ts:398,430` lists membership benefits but quotes **no
  price**.
- `lib/config/mentorship.ts` (`registrationDeadline`) is untouched — applications
  were already closed by it.

### Verification performed (2026-09-05, local dev server)

- Sign In absent from the header at 1440px and from the mobile drawer at 430px.
- **The guard was broken to prove it guards**: flipping
  `PUBLIC_SIGN_IN_ENTRY_ENABLED` to `true` made both elements reappear, so the
  flag — not some unrelated change — is what hides them.
- Chatbot → Quick Questions → *"Does it cost anything to take part?"* renders the
  new copy with no `$100` anywhere in the DOM.
- `pnpm typecheck` clean; `pnpm lint` 0 errors.

### Still open — for the Thursday 2026-09-10 meeting

She deferred the wider question: whether to close the mentorship entry point and
landing page outright, with the knock-on edits to the newsletter, other page
copy and the AI assistant's knowledge base. Until that is decided,
`/mentorship`, `/mentorship/mentee` and `/mentorship/mentor` remain public, and
the footer still links "Become a Mentee" / "Become a Mentor" to those info pages.
