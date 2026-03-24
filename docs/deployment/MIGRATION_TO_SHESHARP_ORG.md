# She Sharp Project Migration Documentation

> Migration completed on **2026-03-24**. This document records the full migration process from personal accounts to She Sharp official organization accounts.

## Migration Overview

| Item | Before (Personal) | After (She Sharp Official) |
|------|-------------------|---------------------------|
| **GitHub Repository** | `ChanMeng666/she-sharp` (private) | `NZ-SheSharp/she-sharp` (public) |
| **Vercel Deployment** | `she-sharp.vercel.app` (chanmeng) | `she-sharp-zeta.vercel.app` (shesharpnz) |
| **Vercel Account** | chanmeng (personal) | shesharpnz / she-sharp1 (Pro plan) |
| **GitHub OAuth App** | Personal account | NZ-SheSharp organization |
| **Google OAuth Client** | Personal Google account | website@shesharp.org.nz |
| **Stripe Webhook** | Old domain endpoint | New domain endpoint |
| **Neon Database** | Created under personal Vercel | **Unchanged** (same connection string) |
| **Production URL** | `https://she-sharp.vercel.app` | `https://she-sharp-zeta.vercel.app` |

## What Was Migrated

### 1. GitHub Repository Transfer

- Transferred via `gh api repos/ChanMeng666/she-sharp/transfer` to `NZ-SheSharp`
- Repository changed from **private** to **public** (required for Vercel Pro single-seat deployment without extra cost)
- GitHub automatically redirects old URL (`ChanMeng666/she-sharp`) to new URL (`NZ-SheSharp/she-sharp`)
- All code references updated: `ChanMeng666/she-sharp` → `NZ-SheSharp/she-sharp` (README badges, clone URLs, share links, star history)
- Author profile links (`https://github.com/ChanMeng666`) preserved unchanged

### 2. Vercel Deployment

- New project created under `she-sharp1` (shesharpnz's projects) team on Vercel Pro plan
- GitHub repository connected: `NZ-SheSharp/she-sharp`
- SSO deployment protection disabled (was blocking public access with HTTP 401)
- All environment variables migrated and verified against old production
- Production URL: `https://she-sharp-zeta.vercel.app`

### 3. OAuth Applications

**GitHub OAuth App** — Created under NZ-SheSharp organization:
- Application name: She Sharp
- Homepage URL: `https://she-sharp-zeta.vercel.app`
- Callback URL: `https://she-sharp-zeta.vercel.app/api/auth/callback/github`
- Client ID: `Ov23liRdxL8WNposxJV9`

**Google OAuth Client** — Created under website@shesharp.org.nz Google Cloud account:
- Application name: She Sharp
- Authorized JavaScript origin: `https://she-sharp-zeta.vercel.app`
- Redirect URI: `https://she-sharp-zeta.vercel.app/api/auth/callback/google`
- Client ID: `146130765065-r55469gm1cgpmdp31f6nqik1tcogoiah.apps.googleusercontent.com`

### 4. Stripe Integration

- Stripe account: `shesharp.org.nz` (account ID: `acct_1NHkCPFH4SQKCLLp`)
- Current mode: **test**
- New webhook endpoint created: `https://she-sharp-zeta.vercel.app/api/stripe/webhook`
  - Webhook ID: `we_1TEJb0FH4SQKCLLpIqWfrVsC`
  - Events: `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
- Old webhook endpoint preserved (for old deployment): `https://she-sharp.vercel.app/api/stripe/webhook`
  - Webhook ID: `we_1TA1sCFH4SQKCLLpTujj6QWV`

### 5. Domain URL Updates

All references to `she-sharp.vercel.app` updated to `she-sharp-zeta.vercel.app` in:

| File | Content |
|------|---------|
| `README.md` | Live site links, demo badges |
| `CLAUDE.md` | Script usage examples |
| `scripts/resend-mentor-invitations.ts` | BASE_URL usage comments |
| `scripts/send-admin-invitation.ts` | BASE_URL usage comments |
| `scripts/preview-all-emails.ts` | BASE_URL usage comments |
| `docs/deployment/MAINTENANCE_MODE.md` | Health check URL examples |
| `docs/features/QR_CODE_GENERATION.md` | QR code example URLs |
| `public/qr-her-waka-apply.svg` | URL hint text in QR code asset |

### 6. What Did NOT Change

- **Neon Database**: Same PostgreSQL instance, same connection string, same data
- **Cloudinary**: Same image storage account and credentials
- **OpenAI / Google AI**: Same API keys
- **Resend Email**: Updated to new key (`re_iS4Fjk8a_...`)
- **Slack Webhooks**: Same webhook URLs for notifications
- **AUTH_SECRET / NEXTAUTH_SECRET**: Same JWT encryption key (existing user sessions preserved)

## Environment Variables

### Verified Environment Variable Status

| Category | Variables | Status |
|----------|-----------|--------|
| Database (DATABASE_URL, PG*, POSTGRES_*) | 14 vars | Identical to old production |
| Authentication (AUTH_SECRET, NEXTAUTH_SECRET) | 2 vars | Identical |
| Cloudinary (CLOUDINARY_*) | 3 vars | Identical |
| AI Keys (OPENAI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY) | 2 vars | Identical |
| Slack (SLACK_VOLUNTEER_WEBHOOK_URL, SLACK_CONTACT_WEBHOOK_URL, SLACK_BOT_TOKEN) | 3 vars | Correct |
| URLs (BASE_URL, NEXTAUTH_URL, AUTH_URL) | 3 vars | Updated to new domain |
| OAuth (GITHUB_CLIENT_*, GOOGLE_CLIENT_*) | 4 vars | New She Sharp org credentials |
| Stripe keys (SECRET_KEY, PUBLISHABLE_KEY, ANNUAL_PRICE_ID) | 6 vars | Identical (test + live) |
| Stripe webhook secrets | 2 vars | Updated (new webhook endpoints) |
| Stripe mode | 1 var | `test` |
| Resend | 1 var | Updated to `re_iS4Fjk8a_...` |
| Stack / Neon / Other | 4 vars | Identical |

### Variables Intentionally Removed

- `BLOB_READ_WRITE_TOKEN` — Was from personal Vercel Blob. Need to create new Vercel Blob under She Sharp account and add the new token.

---

## Development & Deployment Guide

### Daily Development Workflow

#### 1. Local Development

```bash
# Clone (if starting fresh)
git clone https://github.com/NZ-SheSharp/she-sharp.git
cd she-sharp
pnpm install

# Start dev server
pnpm dev
```

Local development uses `.env.local` for environment variables. No changes needed for local dev workflow.

#### 2. Pushing Code & Auto-Deployment

**Git push to `main` branch automatically triggers Vercel deployment.**

```bash
git add <files>
git commit -m "feat: description of change"
git push origin main
```

After pushing, Vercel will:
1. Detect the new commit via GitHub integration
2. Automatically start a production build
3. Deploy to `https://she-sharp-zeta.vercel.app`

You can monitor deployment status at:
- Vercel Dashboard: https://vercel.com/she-sharp1/she-sharp/deployments
- Or via CLI: `vercel list --scope she-sharp1`

#### 3. If Auto-Deployment Doesn't Trigger

If a deployment is blocked (e.g., git author not recognized), use the Vercel API to trigger manually:

```bash
# Make sure you're logged into shesharpnz Vercel account
vercel whoami  # Should show: shesharpnz

# Option A: Deploy via CLI
vercel --prod --scope she-sharp1 --yes

# Option B: Deploy via API (if CLI auth issues)
curl -X POST -H "Authorization: Bearer <VERCEL_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"she-sharp","project":"she-sharp","target":"production","gitSource":{"type":"github","org":"NZ-SheSharp","repo":"she-sharp","ref":"main"}}' \
  "https://api.vercel.com/v13/deployments?teamId=she-sharp1"
```

To get a Vercel token: visit https://vercel.com/account/tokens or check `~/.config/com.vercel.cli/Data/auth.json` (or `%APPDATA%/com.vercel.cli/Data/auth.json` on Windows).

#### 4. Switching Vercel Accounts

The Vercel CLI can only be logged into one account at a time.

```bash
# Login to She Sharp official account (for deployment)
vercel logout && vercel login
# → Authenticate with shesharpnz account in browser

# Login to personal account (for old project management)
vercel logout && vercel login
# → Authenticate with chanmeng account in browser

# Verify current account
vercel whoami
```

#### 5. Managing Environment Variables

```bash
# List all env vars
vercel env ls production --scope she-sharp1

# Add/update a variable
printf 'value_here' | vercel env add VAR_NAME production --scope she-sharp1 --force

# Remove a variable
vercel env rm VAR_NAME production --scope she-sharp1 --yes

# Pull all env vars to local file
vercel env pull .env.local --environment production --scope she-sharp1
```

**Important**: After changing environment variables, you must redeploy for changes to take effect.

### Stripe CLI Usage

Stripe CLI is installed at `D:\stripe-cli\stripe.exe`.

```bash
# Login to She Sharp Stripe account
/d/stripe-cli/stripe.exe login

# List webhook endpoints
/d/stripe-cli/stripe.exe webhook_endpoints list

# Create a new webhook endpoint
MSYS_NO_PATHCONV=1 /d/stripe-cli/stripe.exe post /v1/webhook_endpoints \
  -d "url=https://she-sharp-zeta.vercel.app/api/stripe/webhook" \
  -d "enabled_events[0]=checkout.session.completed" \
  -d "enabled_events[1]=customer.subscription.deleted" \
  -d "enabled_events[2]=invoice.payment_succeeded" \
  -d "enabled_events[3]=invoice.payment_failed"

# Listen to webhooks locally (for development)
/d/stripe-cli/stripe.exe listen --forward-to localhost:3000/api/stripe/webhook
```

> **Note**: On Windows Git Bash, use `MSYS_NO_PATHCONV=1` prefix for Stripe API path commands to prevent path conversion issues.

### Running Scripts in Production

Scripts that send emails or generate URLs require explicit `BASE_URL`:

```bash
BASE_URL=https://she-sharp-zeta.vercel.app npx tsx scripts/send-admin-invitation.ts admin@example.com
BASE_URL=https://she-sharp-zeta.vercel.app npx tsx scripts/resend-mentor-invitations.ts --dry-run
BASE_URL=https://she-sharp-zeta.vercel.app npx tsx scripts/preview-all-emails.ts test@example.com
```

---

## Account Access Summary

| Service | Account | Login |
|---------|---------|-------|
| **GitHub** (org owner) | NZ-SheSharp | website@shesharp.org.nz |
| **Vercel** (project host) | shesharpnz / she-sharp1 | website@shesharp.org.nz |
| **Google Cloud** (OAuth) | She Sharp | website@shesharp.org.nz |
| **Stripe** (payments) | shesharp.org.nz | Stripe Dashboard |
| **Neon** (database) | Created via personal Vercel | Accessed via DATABASE_URL env var |
| **Cloudinary** (images) | Shared credentials | Via CLOUDINARY_* env vars |
| **Resend** (email) | She Sharp | Via RESEND_API_KEY env var |

## Pending Cleanup Tasks

These tasks are non-urgent and can be done after confirming the new deployment is stable:

- [ ] **Create Vercel Blob** under She Sharp account and add `BLOB_READ_WRITE_TOKEN` env var
- [ ] **Delete old Stripe webhook** (`we_1TA1sCFH4SQKCLLpTujj6QWV` pointing to `she-sharp.vercel.app`) once old deployment is removed
- [ ] **Remove old Vercel project** from personal chanmeng account
- [ ] **Remove old OAuth callback URLs** from personal Google/GitHub OAuth apps (if they were updated, not replaced)
- [ ] **Consider custom domain**: Bind `shesharp.org.nz` or similar to the Vercel project
- [ ] **Create live mode Stripe webhook** when switching from test to production mode, pointing to `https://she-sharp-zeta.vercel.app/api/stripe/webhook`

## Troubleshooting

### Deployment blocked — "Git author must have access"

This happens when the git commit author is not a Vercel team member. Solutions:
1. Ensure the repository is **public** (currently it is)
2. Use the Vercel API to trigger deployment manually (see section above)
3. As a last resort, add the author as a team member (costs $20/month per seat on Pro plan)

### OAuth login not working

1. Verify callback URLs match in both the OAuth provider console and `NEXTAUTH_URL` env var
2. GitHub OAuth: Check https://github.com/organizations/NZ-SheSharp/settings/applications
3. Google OAuth: Check https://console.cloud.google.com/apis/credentials (logged in as website@shesharp.org.nz)
4. Google OAuth changes may take 5 minutes to several hours to propagate

### Stripe webhook not receiving events

1. Check webhook status: `/d/stripe-cli/stripe.exe webhook_endpoints list`
2. Verify `STRIPE_TEST_WEBHOOK_SECRET` matches the webhook endpoint's signing secret
3. Test locally: `/d/stripe-cli/stripe.exe listen --forward-to localhost:3000/api/stripe/webhook`

### Database connection issues

The Neon database connection is unchanged. If issues occur:
1. Verify `DATABASE_URL` in Vercel matches the Neon dashboard connection string
2. Check Neon dashboard for connection limits or maintenance windows
3. The database was created under the personal Vercel account but is accessed directly via connection string — no dependency on the personal Vercel project

### Vercel CLI auth issues

```bash
# If vercel commands fail with auth errors
vercel logout
vercel login
# Authenticate as shesharpnz in the browser

# If using API directly, get a fresh token from:
# https://vercel.com/account/tokens
# Or read from: %APPDATA%/com.vercel.cli/Data/auth.json
```
