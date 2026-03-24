# Vercel Environment Variables Guide

This guide covers how to correctly manage environment variables for the She Sharp Vercel deployment, including common pitfalls and verification procedures.

## Setting Environment Variables

### Via CLI (Recommended)

```bash
# ✅ CORRECT — use printf (no trailing newline)
printf 'your_value_here' | vercel env add VAR_NAME production --scope she-sharp1 --force

# ❌ WRONG — echo appends a trailing \n that corrupts the value
echo "your_value_here" | vercel env add VAR_NAME production --scope she-sharp1 --force
```

> **Why does this matter?** `echo` appends a newline character (`\n`) to its output by default. When piped into `vercel env add`, this newline becomes part of the stored value. The Vercel dashboard displays the value looking normal, but the application receives `your_value_here\n` instead of `your_value_here`. This causes subtle, hard-to-debug failures — especially in API keys, webhook secrets, and URLs.

### Via Vercel Dashboard

Navigate to **Vercel Dashboard → Project Settings → Environment Variables** and add/edit values directly. This method does not have the newline issue.

### Via Vercel API

```bash
# Update an existing env var by ID
curl -X PATCH -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value":"clean_value_here"}' \
  "https://api.vercel.com/v9/projects/she-sharp/env/$ENV_VAR_ID?teamId=she-sharp1"
```

## Bulk Upload from .env Files

When uploading values from a `.env` file, values are often wrapped in double quotes. These quotes must be stripped:

```bash
# Read .env.local and upload each variable (quotes stripped, no trailing newline)
grep -E "^[A-Z]" .env.local | while IFS='=' read -r key value; do
  # Strip surrounding double quotes
  value=$(echo "$value" | sed 's/^"//;s/"$//')
  printf '%s' "$value" | vercel env add "$key" production --scope she-sharp1 --force
done
```

> **Warning:** If the source `.env` file itself contains corrupted values (e.g., values with trailing `\n`), those will be propagated. Always verify the source file first.

## Verification

### After Setting Variables

```bash
# Pull all env vars to a local file
vercel env pull .env.verify --environment production --scope she-sharp1

# Check for trailing \n corruption (uses Perl regex for precise match)
grep -P '\\n"' .env.verify

# If no output → all clean
# If matches found → those variables have trailing \n and need to be re-set
```

### Quick Health Check

```bash
# One-liner: pull and check
vercel env pull /tmp/.env.check --environment production --scope she-sharp1 --yes \
  && grep -P '\\n"' /tmp/.env.check \
  && echo "❌ Issues found" \
  || echo "✅ All clean"
```

## Common Operations

### List All Variables

```bash
vercel env ls production --scope she-sharp1
```

### Remove a Variable

```bash
vercel env rm VAR_NAME production --scope she-sharp1 --yes
```

### Update a Variable

```bash
# --force overwrites if exists
printf 'new_value' | vercel env add VAR_NAME production --scope she-sharp1 --force
```

> **Note:** After changing environment variables, you must redeploy for changes to take effect. Push a commit to trigger the GitHub Actions deploy workflow, or deploy manually with `vercel pull && vercel build --prod && vercel deploy --prebuilt --prod`.

### Pull to Local

```bash
# For local development (must be logged into shesharpnz account)
vercel env pull .env.local --environment production --scope she-sharp1

# Remember to change URLs to localhost after pulling:
# AUTH_URL, BASE_URL, NEXTAUTH_URL → http://localhost:3000
```

## Environment Variable Reference

### Variables That MUST Differ Between Local and Production

| Variable | Local Development | Production |
|----------|------------------|------------|
| `AUTH_URL` | `http://localhost:3000` | `https://she-sharp-zeta.vercel.app` |
| `BASE_URL` | `http://localhost:3000` | `https://she-sharp-zeta.vercel.app` |
| `NEXTAUTH_URL` | `http://localhost:3000` | `https://she-sharp-zeta.vercel.app` |

### Variables That Are Identical Across Environments

All other variables (database, API keys, OAuth credentials, Stripe keys, etc.) use the same values in both local and production, because:
- The database (Neon) is shared
- OAuth apps accept both `localhost:3000` and `she-sharp-zeta.vercel.app` callback URLs
- API keys are account-level, not environment-specific

### Variables Not Present Locally

| Variable | Reason |
|----------|--------|
| `VERCEL`, `VERCEL_ENV`, `VERCEL_URL`, etc. | Auto-injected by Vercel at build time |
| `TURBO_*`, `NX_DAEMON` | Vercel build system variables |
| `VERCEL_OIDC_TOKEN` | Auto-generated per deployment |

## Incident Record

### 2026-03-24: Newline Corruption During Migration

**What happened:** During the migration from personal Vercel to She Sharp Vercel, 10 environment variables in the personal Vercel project were discovered to have trailing `\n` characters in their values. One corrupted value (`STRIPE_LIVE_WEBHOOK_SECRET`) was copied to the She Sharp Vercel project before the issue was detected.

**Root cause:** The original values were set using `echo "value" | vercel env add ...` instead of `printf 'value' | vercel env add ...`.

**Impact:** The `\n` in `STRIPE_LIVE_WEBHOOK_SECRET` would have caused Stripe webhook signature verification to fail when switching to live mode.

**Resolution:** The corrupted value was corrected via the Vercel API. All environment variables across both Vercel projects were verified clean.

**Prevention:** This guide was created, and the rule was added to `CLAUDE.md` to ensure `printf` is always used instead of `echo` for Vercel env var operations.
