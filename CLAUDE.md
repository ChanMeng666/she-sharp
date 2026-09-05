# CLAUDE.md

Guidance for Claude Code (claude.ai/code) working in this repository.

**This file is an index, not a manual.** It carries only the rules that bind
*before any file is opened*. Everything else lives in a `CLAUDE.md` beside the
code it governs, or in `docs/`. Where this file disagrees with the filesystem,
the filesystem is right.

A nested `CLAUDE.md` loads when Claude Code **reads** a file in that subtree —
safe for rules about *modifying* code, unsafe for creating a file, running a
command, or trusting a `grep` hit. That is what stayed here.

| Nested file | Carries |
|---|---|
| `app/` | route groups, the four SEO gotchas, static root layout, API conventions |
| `lib/` | subsystem map, the mentor/mentee resolve chain, single-source content |
| `lib/db/` | the schema barrel; why `relations.ts` is a leaf |
| `lib/email/` | the streams, the newsletter, the on-site archive, the sending skills |
| `components/deck/` | decks are typed data — read `DECK_SYSTEM.md` first |
| `styles/` | the four deck CSS rules that fail silently |
| `scripts/` | script conventions, the working directories, the pre-push checks |
| `docs/` | where a `.md` goes and how to write it |

No `public/CLAUDE.md` (binaries are never read) and no `.claude/skills/CLAUDE.md`
(invoking a skill is not a file read); their rules are here or in
`public/img/events/README.md`.

## Overview

She Sharp is a New Zealand non-profit (registered charity **CC57025**, founded
2014) bridging the gender gap in STEM. This repo is its website and platform.
Next.js 15 App Router, strict TypeScript, PostgreSQL (Neon) + Drizzle,
Tailwind v4, on Vercel.

## Commands

```bash
pnpm install / dev / build / start   # pnpm 10 pinned; prefer CI=true npx next build
pnpm lint                      # ESLint 9 flat config; CI gates on errors only
pnpm typecheck                 # app/ components/ lib/ hooks/ types/ proxy.ts
pnpm typecheck:scripts         # scripts/ and .claude/, which the root tsconfig skips
pnpm db:generate / db:migrate / db:studio / db:seed
```

## Directory map

```
app/       (site), (login), (dashboard), present/, f/[code]/, api/
components/  mirrors the site; ui/ is shadcn + custom primitives
lib/       the subsystems — lib/CLAUDE.md, ARCHITECTURE.md §7
hooks/ types/ styles/ emails/
public/    imagery only; img/legacy-site/ is LIVE on pre-2026 event pages
scripts/   run by hand with npx tsx; scripts/README.md indexes them
docs/      docs/README.md indexes every doc; start at ARCHITECTURE.md
proxy.ts   the middleware — there is no middleware.ts
.claude/skills/  guided workflows for non-technical teammates
```

---

# Binding rules

Every one exists because it was broken at least once.

## `proxy.ts` is the middleware

Not `middleware.ts` (Next.js 15 naming). `proxy()` matches the whole site minus
`_next/static`, `_next/image`, `logos`, `favicon.ico`, and does four things in
order: 503 when `MAINTENANCE_MODE=true`; **308-strip legacy Webflow pagination
params** (`/^[0-9a-f]{6,}_page$/i`, GET only, skips `/api/`); redirect
`/dashboard` and `/verify-invitation` without a session cookie; refresh the
rolling cookie. Everything else, `/api` included, passes through.

It checks only that a cookie **exists** — **not an authorisation boundary**. The
real checks are `app/(dashboard)/dashboard/layout.tsx` and `withRoles()`.

## Adding an API route

`app/api/<path>/route.ts` is a **new file**, so `app/CLAUDE.md` has not loaded.

1. Wrap the handler in **`withRoles()`** (`lib/auth/role-middleware.ts`) — it
   resolves the session, returns 401/403, and passes `{ user }` through.
2. Parse every write body with **zod**; return `invalidBody(error)` on failure.
3. Put the work in a service under `lib/<subsystem>/`, not in the route.
4. Call it with **`apiFetch()`** (`lib/api/client.ts`) — no new raw `fetch()`.

**`requiredAdminPermissions` is default-GRANT**: a missing `admin_permissions`
row means "all permissions", every column defaulting to `true`. A route needing
default-DENY checks inline and says so at the site; do not fold one back into the
wrapper. Envelope and query-param conventions: `app/CLAUDE.md`.

## URL construction

All user-facing URLs (emails, redirects, Stripe callbacks) use **`getBaseUrl()`**
from `lib/email/service.ts`. Never inline `process.env.BASE_URL || 'http://localhost:3000'`
— duplicated fallback logic put `localhost:3000` into 25 real mentor invitation
emails (2026-03-19). Scripts under `scripts/` that send mail or build URLs must
require an explicit `BASE_URL` and guard against localhost at startup; see
`scripts/resend-mentor-invitations.ts`.

The one deliberate exception: `feedbackUrlForSlug()` builds from the compile-time
`SITE_URL`, because a projected QR encoding `localhost` fails on every phone in
the room. See `docs/development/EVENT_FEEDBACK.md`.

## Vercel environment variables

- **`--value`, never stdin**: `vercel env add VAR production --value $v --no-sensitive --force --yes`.
  Piping can silently store an **empty string**; `echo` also appends a `\n`.
- **An empty `vercel env pull` does not prove an empty value** — CLI ≥54 defaults
  new vars to Sensitive and returns those as `""`. `--no-sensitive` makes it
  verifiable.
- **Always verify** per-variable: compare byte-for-byte, check for a literal
  `\n`, strip quotes from `.env` values.
- **A new variable needs a new commit** — there is **no Vercel Git connection**,
  and "Redeploy" reuses the old environment.

→ `docs/deployment/VERCEL_ENV_VARIABLES_GUIDE.md`

## pnpm and the build

**pnpm 10 is pinned** by `packageManager`, which CI reads too. **Do not add a
`version:` back to `pnpm/action-setup`** — two sources that agree today can
disagree tomorrow, and the action then fails outright. Overrides live in
**`pnpm-workspace.yaml`**, not `package.json` (pnpm 10.34+ ignores
`pnpm.overrides`); dropping the `baseline-browser-mapping` pin once broke a
production deploy. **On pnpm 11 use `npx drizzle-kit migrate`**, not
`pnpm db:migrate`, which tries to purge `node_modules`. Build locally with
`CI=true npx next build`.

## Consent — before any email goes to a list

The subscription record is **ours**: the `newsletter_subscribers` table
(`lib/db/schema/system.ts`), and since Resend's Marketing objects were deleted on
2026-08-29 it is the only marketing-consent record there is. Only
`status = 'subscribed'` is mailable, and a row reaches it by **double opt-in** —
`POST /api/newsletter/subscribe` writes `pending`, `/newsletter/confirm` needs a
button press, never a GET.

**Registering, donating, applying, giving feedback or writing in is not
subscribing.** The gate is
`.claude/skills/update-mailing-list/references/consent-rules.md`; every sending
skill defers to it. **Marketing sends are capped at three per calendar month**,
counted across all skills, the newsletter included.

**Read the live count from the `Mailable after suppression` line of
`npx tsx scripts/email/suppression.ts reconcile`, never from prose** — this
repo's included. Dated figures: `docs/development/EMAIL_PLATFORM_STATE.md`;
machinery: `lib/email/CLAUDE.md`.

## Consent — before a photograph of a child is published

Do not publish a frame in which **a child is the identifiable subject** — the
frame is about them and their face is readable. A child inside a wide group
shot is not that. Never name a child, in copy, caption, `alt` text or credit.
Youth events (the Youth Tech Series, Superhero Daughter Day) are run under the
host school's media consent and get a procedure rather than an exemption.
Screen at selection, not after: `/img/*` is immutable for a year and the public
album is outside this repo, so removal is a code change plus an album edit.
Every event page carries `EventPhotographyNotice` and routes removal requests to
`PRIVACY_EMAIL` — a notice and a removal route, **not** consent, which would
have to be collected at registration in Humanitix and still is not. Full rule,
and the ten photographs published before any of it existed:
`docs/development/PHOTOGRAPHING_MINORS.md`.

## Assets

`public/` holds site imagery only — **the PDFs and MP4s live on Vercel Blob**,
via constants in `lib/config/assets.ts`. Replacing a Blob asset means a **new
filename and a new constant**, never an overwrite: the cache is immutable for a
year. **User uploads go to the same Blob store** through `lib/blob/uploads.ts`
— profile photos under `profile-photos/`, CVs under `cvs/`, always with
`addRandomSuffix: true`, because a public Blob URL is readable by anyone holding
it and an unguessable path is what keeps that parity with the Cloudinary URLs it
replaced. Cloudinary is gone (2026-09-06): the account was personal, not the
charity's. `docs/ARCHITECTURE.md` §6.

**Moving any image is a tooling job, not a `git mv`** — ~1,400 references across
37 files, a third where the old gate never looked. Use
`scripts/assets/plan-move.ts`, then `apply-move.ts`, then
`scripts/verify-image-paths.ts`. **One folder per event**, slug as directory,
never a filename prefix: `public/img/events/README.md`.

## Working directories are gitignored, not invisible

Five paths hold regenerable scratch — `tmp/`, `.cache/`, `scripts/.cache/`,
`.recommendations/`, `.playwright-cli/` — all gitignored and all still written by
live tooling, whether or not they exist on your checkout today. `git ls-files`
and `git status` never mention them, but **Grep, Glob and `find` read them
exactly like source**: `.cache/` accumulated April-2026 files named
`events-custom-final.json` and `current.json`, neither of which was ever the live
event data.

**Nothing under these paths is ever a source of truth.** Do not cite, edit, or
infer behaviour from one. `tmp/` is a **contract**, not litter — those exact
paths appear in skill instructions and script defaults, so do not relocate it;
clear it before a local `CI=true npx next build`. Who writes what:
`scripts/CLAUDE.md`.

The **vault** of raw Humanitix and Mailchimp exports carries real names,
addresses, opt-in IPs and live access codes. Read it only when a task requires
it, and **never copy it into `lib/data/json/`** — CI has leak guards for exactly
that. It is no longer in this repo: `private/` was deleted on 2026-09-01 and
`scripts/{humanitix,mailchimp}/vault.ts` now fall back to a sibling
`she-sharp-slack-archive` checkout.

## Platform APIs

The Mailchimp and Humanitix keys are **local tooling**; `HUMANITIX_API_KEY` is
the exception, also on Vercel production. **The PII boundary is enforced by
absence** — `lib/humanitix/client.ts` deliberately does not implement `/orders`
or `/tickets`, so a function that does not exist cannot be imported from `app/`
by mistake. Do not add them. **Raw pulls go to the private archive repo via
`MAILCHIMP_VAULT_DIR` / `HUMANITIX_VAULT_DIR`, never to `lib/data/json/`**, and
the vault stores verbatim payloads, never mapped objects. Neither API replaces
the manual export. → `docs/development/PLATFORM_APIS.md`

## Conventions

- **All UI text in English.** No Chinese characters in page content, components
  or user-facing strings. Code strings and comments in English.
- **Conversations with the user in Chinese.**
- **Commits**: Conventional Commits / Angular style, in English. **GitHub**: the
  `gh` CLI; PRs get a description and a clear test plan.
- **Comments**: function-level, Google style, explaining *why* — these rules
  exist because the code alone did not say.
- **No proactive documentation.** No `.md` unless asked; when asked they go under
  `docs/{deployment,development,database,features}/`, never the repo root
  (`ARCHITECTURE.md` is the one exception), and `docs/README.md` gains a row.
- **Focused changes.** Address the request; do not add unrequested features.

---

# Subsystems

**`docs/ARCHITECTURE.md` §7 is the full map** — every subsystem and the doc that
owns it; `docs/README.md` indexes every doc. Most often needed before opening
any file:

| | |
|---|---|
| The event lifecycle, end to end | `development/EVENT_LIFECYCLE_SOP.md` |
| Counting and naming traps — before publishing a number | `development/CONTENT_RULES.md` |
| Editing an event, sponsor or stat | `development/ADD_EVENTS.md` |
| Who may be emailed, and by which system | `development/EMAIL_RESPONSIBILITY_BOUNDARIES.md` |
| Mentorship applications are **paused** | `development/MENTORSHIP_APPLICATIONS_PAUSED.md` |
| Leaving Mailchimp — pause or downgrade, **never delete** | `deployment/MAILCHIMP_CANCELLATION.md` |
| Guided skills for non-technical teammates | `development/AI_SKILLS_GUIDE.md` |

---

# Testing and CI

**No test runner is configured.** Tests are plain `node:assert` scripts run with
`npx tsx <file>`; each prints `ok - …`, exits non-zero on failure, and lives
beside the code it covers.

CI (`.github/workflows/verify.yml`, PRs to `main`) runs **one job**, `verify`,
whose steps are `typecheck`, `typecheck:scripts`, `lint`, the deck checks, and
every other offline check — all sharing one checkout and one install, because
they are pure data and none needs a database or the network. **A check needing
neither belongs as a step in that job**, not in a second job: Actions bills each
job rounded up to the whole minute, so a job per check cost this org more in
setup than in checking (2026-09-01: five jobs, 105s of duplicated setup for 147s
of work).

**A guard is not verified until you have broken the thing it guards.** Reading
one and agreeing with it is not a test — hand it the input it was supposed to
refuse. Two gates were caught on 2026-08-30 reading as correct and gating
nothing.

The local pre-push list, the two gates, and why `check-facts.ts` and
`verify-page-metadata.ts` sit outside CI: **`docs/development/TESTING.md`**.
What a job costs, and the DNS record a workflow depends on:
**`docs/deployment/GITHUB_ACTIONS_AND_ACCOUNT.md`**.

# Environment

Required variables and what each is for: **`.env.example`**.

Scripts read **`.env`** — `import "dotenv/config"` does not load `.env.local`,
which is the Next.js dev server's file. Both are gitignored, and that difference
is why a script can report a missing key while `pnpm dev` works.

`MAILCHIMP_API_KEY` **expires 2027-08-27** (Mailchimp forces a one-year expiry)
and nothing under `app/` may read it. `MAILCHIMP_VAULT_DIR` /
`HUMANITIX_VAULT_DIR` point a pull at a directory in the private archive repo.
`MAINTENANCE_MODE=true` serves a 503 for the whole site, `/f/*` and the feedback
form included — `docs/deployment/MAINTENANCE_MODE.md`.
