# Domain Migration — Official Domain Cutover (2026-06-19)

> Production moved from the Vercel default domain `https://she-sharp-zeta.vercel.app/`
> to the official custom domain **`https://www.shesharp.org.nz/`**.
> This document records every change made so the migration is fully auditable and
> reproducible. It complements [`MIGRATION_TO_SHESHARP_ORG.md`](./MIGRATION_TO_SHESHARP_ORG.md)
> (the earlier 2026-03-24 org/account migration).

## TL;DR

| Layer | What changed | Status |
|-------|--------------|--------|
| App code | `metadataBase` + `og:url`, README, showcase, QR assets | ✅ deployed |
| Vercel env (production) | `BASE_URL`, `AUTH_URL`, `NEXTAUTH_URL` → official domain | ✅ verified |
| Stripe (live) | Webhook endpoint URL → official domain | ✅ updated |
| GitHub OAuth | Homepage + callback URL → official domain | ✅ updated |
| Google OAuth | JS origin + redirect URI added for official domain | ✅ done by owner |
| Docs / scripts | Operator-facing example URLs → official domain | ✅ committed |

The DNS/domain itself was already attached to the Vercel `she-sharp` project before
this work began; the apex `shesharp.org.nz` 308-redirects to `www`. The old
`she-sharp-zeta.vercel.app` host still serves the same deployment (HTTP 200), so legacy
links and integrations are **not** broken — this migration is a canonicalization, not a
hard cutover.

## Git commits

| Commit | Scope |
|--------|-------|
| `1816972` | `chore(domain): migrate hardcoded URLs to www.shesharp.org.nz` — functional code + QR assets |
| `d36f1ef` | `docs: update operator-facing URLs to www.shesharp.org.nz` — scripts + docs examples |

Both pushed to `main`; deployed automatically via the "Deploy to Vercel" GitHub Actions
workflow.

## 1. Application code (repo)

- **`app/layout.tsx`** — `metadata.metadataBase` and `metadata.openGraph.url` were
  hardcoded to the Vercel domain. Changed to `https://www.shesharp.org.nz`. This drives
  the SEO canonical base and the absolute `og:image` URL for social share cards. All
  other user-facing URL construction already flows through `getBaseUrl()` in
  `lib/email/service.ts` (reads `BASE_URL`), so no other source files needed editing.
- **`README.md`** — 7 live-site links.
- **`docs/showcase/showcase.scenario.json`** — showcase target URL (drives README
  screenshot regeneration).
- **`public/qr-her-waka-apply.svg` / `.png`** — the HER WAKA mentee-application QR code.
  The QR **graphically encodes** the URL, so the bitmap had to be regenerated, not just
  the caption text. Regenerated with the `qrcode` package (errorCorrectionLevel `H`,
  brand colour `#9b2e83`) encoding `https://www.shesharp.org.nz/mentorship/mentee/apply`,
  re-wrapped in the existing branded SVG template (41-module / version-6 QR), and
  rasterised to a 2048×2560 print PNG via `sharp`. These static assets are print-only
  (the live site generates QR codes dynamically through `app/api/qr/route.ts`, which
  already uses the correct base URL).

## 2. Vercel environment variables (production)

`BASE_URL`, `AUTH_URL`, `NEXTAUTH_URL` were all still set to `https://she-sharp-zeta.vercel.app`
(87 days old). Updated to `https://www.shesharp.org.nz` and verified via `vercel env pull`.

> **CLI gotcha (important for next time):** this Vercel CLI reads `vercel env add` values
> from `/dev/tty`, so `printf '…' | vercel env add NAME production` silently writes an
> **empty** value. Use the explicit flag form instead:
> ```bash
> vercel env add BASE_URL production --value "https://www.shesharp.org.nz" --no-sensitive --force -y
> ```
> Production env vars also default to **sensitive** (un-readable; `vercel env pull` shows
> `""`). Pass `--no-sensitive` for non-secret values like URLs so they stay verifiable.

## 3. Stripe (live mode)

- She Sharp's production Stripe account is **`acct_…51NHkCP…`** (publishable key prefix
  `pk_live_51NHkCP…`) — this is **not** the account the local Stripe CLI defaults to
  (`chanmeng.org` / `acct_1RneKW…`). The live webhook was found and updated by passing the
  production `STRIPE_LIVE_SECRET_KEY` explicitly via `--api-key`.
- Live webhook endpoint **`we_1TA2WMFH4SQKCLLp5sEDV94h`** URL changed from
  `…vercel.app/api/stripe/webhook` to `https://www.shesharp.org.nz/api/stripe/webhook`.
  Changing the URL does **not** rotate the signing secret, so `STRIPE_LIVE_WEBHOOK_SECRET`
  was left unchanged.
- The test-mode webhook was **not** updated — the local `STRIPE_TEST_SECRET_KEY` is
  expired and test mode only affects local development, not the production domain.

## 4. GitHub OAuth

- Production app: OAuth App **"She Sharp" under the NZ-SheSharp organization**, client ID
  **`Ov23liRdxL8WNposxJV9`** (matches the production `GITHUB_CLIENT_ID`). Updated:
  - Homepage URL → `https://www.shesharp.org.nz`
  - Authorization callback URL → `https://www.shesharp.org.nz/api/auth/callback/github`
- ⚠️ **Do not confuse** with a separate personal OAuth App also named "She Sharp" under
  `ChanMeng666` (client ID `Ov23liX6wkCcjLXsHNvR`, homepage `she-sharp.vercel.app`) — that
  one is unrelated to production and must be left alone. Always verify the client ID against
  `GITHUB_CLIENT_ID` before editing.

## 5. Google OAuth

- OAuth 2.0 client **`146130765065-r55469gm1cgpmdp31f6nqik1tcogoiah.apps.googleusercontent.com`**
  in GCP project `146130765065` (owned by `website@shesharp.org.nz`). Added (keeping the
  existing Vercel-domain entries alongside, for a zero-downtime transition):
  - Authorized JavaScript origin → `https://www.shesharp.org.nz`
  - Authorized redirect URI → `https://www.shesharp.org.nz/api/auth/callback/google`
- This step was completed by the project owner directly, because the GCP project is owned
  by `website@shesharp.org.nz` and could not be edited from a different Google account.
- Google notes new OAuth settings can take 5 minutes to a few hours to propagate.

## 6. Docs & scripts cleanup

Operator-facing, copy-pasteable example URLs were updated so nobody reintroduces the old
domain by copying an example:

- `scripts/*.ts` (`send-url-update`, `send-mentor-reminder`, `send-mentee-reminder`,
  `send-admin-invitation`, `resend-mentor-invitations`, `preview-all-emails`) — header/usage
  `BASE_URL=…` examples.
- `CLAUDE.md` — the `BASE_URL` rule example.
- `docs/`: `VERCEL_ENV_VARIABLES_GUIDE.md`, `QR_CODE_GENERATION.md`, `MAINTENANCE_MODE.md`,
  `SLACK_EVENT_EXTRACTION.md`, `SLACK_APP_DEVELOPMENT_GUIDE.md`, `QA_REPORT_FIXES.md`.

`MIGRATION_TO_SHESHARP_ORG.md` deliberately **keeps** its historical Vercel URLs (it is a
point-in-time record of the 2026-03-24 migration) and got a dated note at the top pointing
to the current domain.

## Verification performed

- `https://www.shesharp.org.nz/` returns the homepage with
  `og:url = https://www.shesharp.org.nz` and `og:image = https://www.shesharp.org.nz/og-cover.png`;
  zero `she-sharp-zeta` strings remain in the rendered HTML.
- `https://shesharp.org.nz/` → **HTTP 308** → `https://www.shesharp.org.nz/`.
- `https://www.shesharp.org.nz/api/auth/providers` → `{"providers":{"google":true,"github":true}}`.
- Repo-wide grep: the only remaining `she-sharp-zeta` reference is the intentional historical
  table inside `MIGRATION_TO_SHESHARP_ORG.md`.

## Remaining OPTIONAL items (intentionally not done)

Neither is a breakage — the old Vercel host still serves the app, so existing integrations
keep working. Defer until the Vercel domain is actually retired:

1. **Slack app Request URLs** (configured at api.slack.com — e.g. `…/api/slack/events`,
   `…/api/slack/events/interactive`) still point at `she-sharp-zeta.vercel.app`. Events still
   arrive because that host stays live.
2. **Old `she-sharp-zeta` entries** in the Google and GitHub OAuth apps can be removed once
   sign-in on the official domain is confirmed stable.

## Quick reference (non-secret identifiers)

| Thing | Value |
|-------|-------|
| Official domain | `https://www.shesharp.org.nz` |
| Vercel project | `she-sharp` (team `she-sharp1` / `shesharpnz`) |
| GitHub OAuth client (prod) | `Ov23liRdxL8WNposxJV9` (NZ-SheSharp org) |
| Google OAuth client (prod) | `146130765065-r55469gm…apps.googleusercontent.com` |
| GCP project | `146130765065` (owner `website@shesharp.org.nz`) |
| Stripe live account | `acct_…51NHkCP…` (pub key `pk_live_51NHkCP…`) |
| Stripe live webhook | `we_1TA2WMFH4SQKCLLp5sEDV94h` → `…/api/stripe/webhook` |
