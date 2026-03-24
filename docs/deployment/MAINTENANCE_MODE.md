# Maintenance Mode

## Overview

The She Sharp website supports a maintenance mode that returns a branded **503 Service Unavailable** page for all incoming requests. This was implemented to allow the site to be temporarily taken offline while preserving all Vercel deployment data, environment variables, and configuration — enabling seamless restoration when ready to go live again.

## How It Works

The maintenance mode logic lives in `proxy.ts` (the project's Next.js proxy/middleware file). When the environment variable `MAINTENANCE_MODE` is set to `"true"`, the proxy intercepts **all requests** before they reach any page or API route and returns a self-contained HTML maintenance page with HTTP status 503.

### Key implementation details

- **File**: `proxy.ts` (project root)
- **Trigger**: `process.env.MAINTENANCE_MODE === 'true'`
- **Response**: Inline HTML page with 503 status code and `Retry-After: 3600` header
- **Scope**: All routes including pages and API endpoints are intercepted
- **Exclusions**: Static assets (`_next/static`, `_next/image`, `logos/`, `favicon.ico`) are excluded via the `config.matcher` pattern so the maintenance page can load the She Sharp logo

### Maintenance page features

- She Sharp brand logo (`/logos/she-sharp-logo-purple-dark-130x130.svg`)
- Brand colors: Purple Dark `#9b2e83`, Navy Dark `#1f1e44`, Purple Light `#f7e5f3`
- Decorative blurred background circles (consistent with the 404 page aesthetic)
- Fully self-contained: inline CSS, no external dependencies, no JavaScript required
- SEO-appropriate 503 status code signals to search engines that the downtime is temporary

## How to Enable (Take Site Offline)

### Option A: Vercel CLI

```bash
# Add the environment variable (use printf to avoid trailing newline)
printf 'true' | vercel env add MAINTENANCE_MODE production

# Redeploy to apply
vercel --prod --force
```

### Option B: Vercel Dashboard

1. Go to **Vercel Dashboard → Project Settings → Environment Variables**
2. Add `MAINTENANCE_MODE` with value `true` for the **Production** environment
3. Trigger a redeployment (Vercel may auto-redeploy on env var changes, or manually redeploy)

### Verification

```bash
# Should return HTTP 503 with the maintenance HTML page
curl -s -o /dev/null -w "HTTP Status: %{http_code}" https://she-sharp-zeta.vercel.app/

# API routes should also return 503
curl -s -o /dev/null -w "HTTP Status: %{http_code}" https://she-sharp-zeta.vercel.app/api/events
```

## How to Disable (Restore Site)

### Option A: Vercel CLI

```bash
# Remove the environment variable
vercel env rm MAINTENANCE_MODE production -y

# Redeploy to apply
vercel --prod --force
```

### Option B: Vercel Dashboard

1. Go to **Vercel Dashboard → Project Settings → Environment Variables**
2. Delete the `MAINTENANCE_MODE` variable (or change its value to anything other than `true`)
3. Trigger a redeployment

## Important Notes

- **No code changes needed** to toggle maintenance mode — it is purely controlled by the environment variable
- **All Vercel data is preserved** during maintenance mode (deployments, domains, other env vars, serverless functions)
- The Vercel Hobby plan does not have a "Pause Project" feature, which is why this application-level approach was implemented
- When setting the env var via CLI with `echo`, use `printf 'true'` instead of `echo "true"` to avoid a trailing newline character that would cause the string comparison to fail
- The `config.matcher` in `proxy.ts` was updated from the original pattern to include `logos` in the exclusion list (for the maintenance page logo) and to include API routes in the proxy scope (so they also return 503 during maintenance)

## Local Development Testing

```bash
# Start dev server with maintenance mode enabled
MAINTENANCE_MODE=true pnpm dev
```

Visit `http://localhost:3000` to see the maintenance page locally.
