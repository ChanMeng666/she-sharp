# Vercel Environment Variables Guide

This guide covers how to correctly manage environment variables for the She Sharp Vercel deployment, including common pitfalls and verification procedures.

## Setting Environment Variables

### Via CLI (Recommended)

```bash
# ✅ CORRECT — pass the value as a flag, never through stdin
vercel env add VAR_NAME production --value 'your_value_here' --no-sensitive --force --yes

# ❌ WRONG — the pipe is never read; the variable is stored EMPTY
printf 'your_value_here' | vercel env add VAR_NAME production --scope she-sharp1 --force

# ❌ WRONG — same empty-value problem, and echo would append a trailing \n on top of it
echo "your_value_here" | vercel env add VAR_NAME production --scope she-sharp1 --force
```

> **Why does this matter?** There are two separate failure modes, and only the flag form avoids both.
>
> 1. **Any stdin form can store an empty string.** This Vercel CLI reads the value for `vercel env add` from `/dev/tty`, not from standard input, so whatever you pipe in — `printf '…' |`, `< file`, even `cmd /c "... < file"` — is never consumed, and the variable is created with an empty value. The command still reports success. This is the **worse** of the two failures: a corrupted value at least looks wrong once you find it, whereas an empty value looks exactly like a variable nobody ever set, so the investigation starts in the wrong place. Discovered during the 2026-06-19 domain migration — see [`DOMAIN_MIGRATION_2026-06-19.md`](./DOMAIN_MIGRATION_2026-06-19.md).
> 2. **`echo` additionally appends a newline.** `echo` terminates its output with `\n`, which on a CLI that *did* read stdin becomes part of the stored value: the Vercel dashboard displays the value looking normal, but the application receives `your_value_here\n`. This causes subtle, hard-to-debug failures — especially in API keys, webhook secrets, and URLs. It is what corrupted `STRIPE_LIVE_WEBHOOK_SECRET` on 2026-03-24 (see the incident record below).
>
> `--no-sensitive` is not cosmetic either: since CLI ≥54 new production variables default to **Sensitive**, and a Sensitive variable pulls back as `""` — indistinguishable from failure mode 1. Marking non-secret values (URLs, flags) non-sensitive is what makes them verifiable afterwards, and it matches every pre-existing secret in this project.

### Via Vercel Dashboard

Navigate to **Vercel Dashboard → Project Settings → Environment Variables** and add/edit values directly. This method has neither the empty-value nor the newline issue.

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
# Read .env.local and upload each variable (quotes stripped, value passed as a flag)
grep -E "^[A-Z]" .env.local | while IFS='=' read -r key value; do
  # Strip surrounding double quotes
  value=$(echo "$value" | sed 's/^"//;s/"$//')
  vercel env add "$key" production --value "$value" --scope she-sharp1 --force --yes
done
```

> **Warning:** If the source `.env` file itself contains corrupted values (e.g., values with trailing `\n`), those will be propagated. Always verify the source file first.

> **Warning:** A bulk loop is exactly where an empty-value failure hides, because nothing in the output distinguishes thirty successful writes from thirty empty ones. Verify every variable afterwards, per the next section — not a sample of them.

## Verification

Verification means **comparing the stored value against the value you intended**, byte for byte. Grepping for corruption is not enough: an empty value contains no `\n`, no stray quotes and no bad characters, so every pattern-based check passes on it.

### After Setting Variables

```bash
# Pull production values to a scratch file. Only --no-sensitive variables come back
# with a readable value; Sensitive ones pull as "" whatever they actually hold.
vercel env pull .env.verify --environment production --scope she-sharp1 --yes

# Compare the variable you just set against what you meant to set
expected='your_value_here'
actual=$(grep -m1 '^VAR_NAME=' .env.verify | cut -d= -f2- | sed 's/^"//;s/"$//')
[ "$actual" = "$expected" ] && echo "✅ VAR_NAME matches" || echo "❌ VAR_NAME is '$actual'"

# Separately, check the whole file for the trailing-\n corruption (the 2026-03-24 failure)
grep -P '\\n"' .env.verify
```

If `actual` comes back empty, two different things look identical and you must tell them apart before re-setting anything: the write went to `/dev/tty` and stored nothing, **or** the variable is Sensitive and simply cannot be read back. `vercel env ls production --scope she-sharp1` shows which. Re-add non-secret values with `--no-sensitive` so the next check can actually see them.

### Quick Health Check

```bash
# Pull, then flag BOTH failure modes across the whole file
vercel env pull /tmp/.env.check --environment production --scope she-sharp1 --yes

echo "— values carrying a literal \\n (corrupted):"
grep -P '\\n"' /tmp/.env.check

echo "— values that are empty (written empty, or Sensitive and unreadable):"
grep -E '^[A-Z_0-9]+=(""|)$' /tmp/.env.check
```

> **This check cannot say "all clean."** Silence from the second grep proves only that nothing pulled back empty; it says nothing about whether a readable value equals the value you intended, and a Sensitive variable is invisible to both greps. Treat it as a smoke test, and do the byte-for-byte comparison above for anything you actually changed.

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
vercel env add VAR_NAME production --value 'new_value' --no-sensitive --force --yes --scope she-sharp1
```

> **Note:** Changing an environment variable does **not** affect the running deployment. Vercel binds environment variables to a deployment at **build time**, so the live site keeps serving the values that were present when it was built — which is also why the dashboard's "Redeploy" button is no help: it reuses the previous build's environment. A new value only goes live with a new build.
>
> `.github/workflows/deploy.yml` triggers on `push` to `main` and nothing else — there is no `workflow_dispatch`, so it cannot be re-run from the Actions tab. In practice that means **pushing a commit to `main` is how a new value gets rolled out** (re-verified 2026-08-28). The only alternative is building and deploying by hand from your own machine: `vercel pull && vercel build --prod && vercel deploy --prebuilt --prod`.

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
| `AUTH_URL` | `http://localhost:3000` | `https://www.shesharp.org.nz` |
| `BASE_URL` | `http://localhost:3000` | `https://www.shesharp.org.nz` |
| `NEXTAUTH_URL` | `http://localhost:3000` | `https://www.shesharp.org.nz` |

### Variables That Are Identical Across Environments

All other variables (database, API keys, OAuth credentials, Stripe keys, etc.) use the same values in both local and production, because:
- The database (Neon) is shared
- OAuth apps accept both `localhost:3000` and `www.shesharp.org.nz` callback URLs
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

> ⚠️ **Superseded on 2026-06-19 — see the next entry.** The `printf` prevention rule recorded above was itself found to be unsafe: this CLI reads `vercel env add` values from `/dev/tty`, so the `printf` pipe writes an **empty** value. The current rule is `--value`, never stdin. The account above is left as the record of what was believed and done at the time.

### 2026-06-19: The `printf` Rule Was Itself Unsafe

**What happened:** During the domain cutover to `www.shesharp.org.nz`, `BASE_URL`, `AUTH_URL` and `NEXTAUTH_URL` were re-set using the `printf '…' | vercel env add …` form this guide had recommended since 2026-03-24. The command reported success and stored an empty value.

**Root cause:** This Vercel CLI reads the value for `vercel env add` from `/dev/tty`, not from standard input, so piped input is never consumed. The 2026-03-24 fix had traded a corrupted value for no value at all. Compounding it, CLI ≥54 defaults new production variables to **Sensitive**, and a Sensitive variable pulls back as `""` — so `vercel env pull` could not distinguish "written empty" from "written correctly but unreadable".

**Impact:** None observed. The empty write was caught in the same session by pulling the values back, and no deployment was built with an empty `BASE_URL`. Had one been, every generated URL would have fallen back to `http://localhost:3000` — which is not a hypothesis about that fallback but a description of what it did on 2026-03-19, when duplicated fallback logic put `localhost:3000` into 25 real mentor invitation emails.

**Resolution:** The three variables were re-set with the explicit flag form plus `--no-sensitive`, then verified by pulling them back:

```bash
vercel env add BASE_URL production --value "https://www.shesharp.org.nz" --no-sensitive --force -y
```

**Prevention:** `CLAUDE.md` now carries "**use `--value`, never stdin**" as the binding rule, together with the caveat that an empty `vercel env pull` does not prove an empty value, and this guide was rewritten around both. Full narrative: [`DOMAIN_MIGRATION_2026-06-19.md`](./DOMAIN_MIGRATION_2026-06-19.md) §2.
