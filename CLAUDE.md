# CLAUDE.md

Guidance for Claude Code (claude.ai/code) working in this repository.

**This file is an index, not a manual.** It carries the rules that are binding
everywhere and a pointer to the doc for each subsystem. When a section here
disagrees with the filesystem, the filesystem is right — so this file names
directories and modules, and deliberately avoids file counts, which rot.

Start with `docs/ARCHITECTURE.md` for how a request travels through the repo and
a "where does X live" table covering every `lib/` subsystem.

## Overview

She Sharp is a New Zealand non-profit (registered charity **CC57025**, founded
2014) bridging the gender gap in STEM. This repo is the organisation's website
and platform: a public marketing/events site, a mentorship programme with
AI-assisted matching, a member dashboard, a visitor chatbot, an outbound email
system, and projected slide decks for in-person events. Next.js 15 App Router,
TypeScript strict, PostgreSQL (Neon) + Drizzle, Tailwind v4, deployed on Vercel.

## Commands

```bash
pnpm install          # pnpm 10 is pinned by `packageManager`; do not use pnpm 11 here
pnpm dev              # dev server (Turbopack)
pnpm build            # production build   — locally prefer: CI=true npx next build
pnpm start            # serve a production build
pnpm lint             # ESLint 9 flat config; CI gates on errors only
pnpm typecheck        # tsc --noEmit over app/ components/ lib/ hooks/ types/ proxy.ts
pnpm typecheck:scripts# scripts/ and .claude/, which the root tsconfig skips

pnpm db:generate      # Drizzle migration from schema changes
pnpm db:migrate       # apply migrations   (on pnpm 11: npx drizzle-kit migrate)
pnpm db:studio        # Drizzle Studio
pnpm db:seed          # seed sample data
```

## Directory map

```
app/
  (site)/        public pages — home, about, events/[slug], mentorship, resources,
                 donate, membership, community, contact, sponsors, join-our-team
  (login)/       sign-in, sign-up, password reset, verification  (noindex)
  (dashboard)/   member + admin area, auth-gated by its own layout
  present/       /present/<event-slug> projected slide decks      (noindex)
  f/[code]/      short feedback-code redirector → /events/<slug>/feedback
  api/           route handlers
  robots.ts sitemap.ts manifest.ts llms-full.txt/   generated metadata routes
  + standalone legal pages (accessibility, privacy, terms, code of conduct, …)
components/      mirrors the site: about, admin, chatbot, contact, deck, donate,
                 events, forms, home, join-team, layout, membership, mentorship,
                 resources, seo, sponsors, ui (shadcn/ui + custom primitives)
lib/             api, auth, chatbot, cloudinary, config, data, db, deck, email,
                 export, forms, funding, invitations, matching, mentorship,
                 newsletter, programmes, recruitment, seo, slack, slack-bot,
                 stripe, user  (+ utils.ts, fonts.ts, design-system.ts)
hooks/ types/ styles/ emails/
public/          site imagery; img/scraped/ is LIVE legacy-site content, not
                 leftovers — see public/img/scraped/README.md before touching it
scripts/         ~90 scripts, only one wired to package.json — scripts/README.md
                 indexes them and flags the destructive ones
docs/            docs/README.md indexes every doc; start at docs/ARCHITECTURE.md
proxy.ts         the middleware (see below) — there is no middleware.ts
report/          Typst funder-report project; NOT part of the Next.js build
.claude/skills/  guided workflows for non-technical teammates
```

---

# Binding rules

These apply everywhere and are the reason this file is loaded into every session.

## `proxy.ts` is the middleware

Not `middleware.ts` (Next.js 15 naming). It exports `proxy()`, matching the whole
site minus `_next/static`, `_next/image`, `logos`, `favicon.ico`, and does four
things in order: 503 maintenance page when `MAINTENANCE_MODE=true`; **308-strip
legacy Webflow pagination params** (`/^[0-9a-f]{6,}_page$/i`, GET only, skips
`/api/`); redirect `/dashboard` and `/verify-invitation` without a session
cookie; refresh the rolling session cookie. Everything else, including all of
`/api`, passes straight through.

It checks only that a cookie **exists** — it is not an authorisation boundary.
Real checks live in `app/(dashboard)/dashboard/layout.tsx` and in `withRoles()`.

## Adding an API route

Create `app/api/<path>/route.ts`, then:

1. Wrap the handler in **`withRoles()`** from `lib/auth/role-middleware.ts` —
   the standard wrapper for every protected endpoint. It resolves the session,
   returns 401/403 itself, and passes `{ user }` through to the handler.
2. Parse every write body with a **zod** schema and return
   `invalidBody(error)` from `lib/api/validation.ts` on failure.
3. Put the work in a service under `lib/<subsystem>/`, not in the route.
4. Call it from the browser with **`apiFetch()`** (`lib/api/client.ts`), which
   throws `ApiError` on a non-2xx. Do not add new raw `fetch()` calls.

**There is no universal response envelope.** Success payloads keep their domain
shape (`{ mentors, pagination }`, the report object itself); errors are
`{ error }`, plus `details` when they come from `invalidBody()`.
**Query params have no validation convention** — GET routes read
`request.nextUrl.searchParams` by hand and clamp inline. Follow the nearest
existing route; CSV responses go through `toCsv()` in `lib/export/csv.ts`.

**`requiredAdminPermissions` is default-GRANT.** A missing `admin_permissions`
row means "all permissions", because every column defaults to `true`. Routes that
need default-DENY do the check inline and say so at the site — do not fold one of
those back into the wrapper. `getUserRoles()` has one implementation, in
`role-middleware.ts`.

## Reading mentor/mentee data

Mentor and mentee data is split across `*_form_submissions` (primary) and
`*_profiles` (a subset), with `users` as a last resort. **Every read walks the
chain** `form_submissions.field → profiles.field → users.field → null`, and the
chain is implemented once, in **`lib/mentorship/resolve.ts`**
(`resolveField()`, `resolvePhoto()`). Never resolve an avatar from `users.image`
alone — it is null for most form-imported users, which is what made avatars
invisible across ten endpoints on 2026-03-20. **Writes must update both tables.**
Field-by-field reference: `docs/database/MENTOR_MENTEE_DATA_GUIDE.md`.

Option lists for the mentorship domain (career stage, gender, MBTI, meeting
format, industries, skills, cities) live once in `lib/mentorship/vocab.ts`.

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

- **Use `--value`, never stdin**: `vercel env add VAR production --value $v --no-sensitive --force --yes`.
  Piping — `printf 'x' |`, `< file`, even `cmd /c "... < file"` — can silently
  store an **empty string**, and `echo` additionally appends a `\n` that becomes
  part of the value.
- **An empty `vercel env pull` does NOT prove an empty value**: CLI ≥54 defaults
  new vars to **Sensitive**, and `pull` returns those as `""` — indistinguishable
  from the corruption above. `--no-sensitive` makes the value verifiable, which
  matches every pre-existing secret here.
- **Always verify** per-variable: `vercel env pull <tmp> --environment production --yes`,
  then compare byte-for-byte and check for a literal `\n`.
- **Strip quotes** when copying from `.env` files (`KEY="value"`).
- **A new variable needs a new commit.** This project has **no Vercel Git
  connection** — GitHub Actions prebuilds on push to `main`, and the dashboard's
  "Redeploy" button reuses the previous build's environment.

Full guide: `docs/deployment/VERCEL_ENV_VARIABLES_GUIDE.md`.

## pnpm and the build

**pnpm 10 is pinned** by `packageManager` in `package.json`, so `pnpm install`
and `pnpm dev` use it whatever is installed globally, and CI reads the same field.
**Do not add a `version:` back to the `pnpm/action-setup` steps** — two sources
that agree today can disagree tomorrow, and the action fails outright when they
do. Overrides live in **`pnpm-workspace.yaml`**, not `package.json` (pnpm 10.34+
stops reading `pnpm.overrides`); dropping the `baseline-browser-mapping` pin once
broke a production deploy. On pnpm 11 use `npx drizzle-kit migrate` rather than
`pnpm db:migrate`. Build locally with `CI=true npx next build`.

## Consent — before any email goes to a list

The database has **no** marketing opt-in column, so Resend segments/topics are
the only subscription record. Registering, donating, applying, giving feedback or
writing in is **not** subscribing. The gate is
`.claude/skills/update-mailing-list/references/consent-rules.md`; every sending
skill defers to it.

## SEO: four gotchas that keep recurring

1. **Title template `%s | She Sharp` does not cascade** through a layout that
   sets its own string `title`. Children under `events/layout`,
   `mentorship/mentor/layout`, `mentorship/mentee/layout` need an explicit
   `title: { absolute: "X | She Sharp" }`.
2. **No root-level `alternates.canonical`** — it cascades and canonicalizes
   every page to the homepage. Set canonicals per page.
3. **A `noindex` child under a parent that declares a canonical needs its own
   self-canonical**, or Google can apply the noindex to the *parent*. The
   dangerous case is `/events/[slug]/feedback`, whose parent canonicalises to
   `/events`. **Marking a route `noindex` also means removing it from
   `app/sitemap.ts`** — the two changes travel together.
4. **A `Disallow` stops crawlers reading a `noindex`, so the two are
   alternatives, never a pair.** To keep a page out of search, make it crawlable
   and give it `noindex`. When fixing a page that has both: unblock first, then
   noindex — the reverse leaves the URL stuck in the index.

`lib/seo/site.ts` is the source of truth for the canonical origin and org facts;
keep it in sync with `metadataBase` in `app/layout.tsx` and `footerConfig` in
`lib/config/footer.ts`. After metadata edits run
`npx tsx scripts/seo/verify-page-metadata.ts --base http://localhost:3100`
against a local `next start`.

Docs: `docs/development/GEO_SEO_MONITORING.md` (what is in place, the three
Search Console properties, maintenance notes),
`GEO_SEO_IMPLEMENTATION_GUIDE.md` (reusable how-to),
`GEO_SEO_BACKLOG.md` (live follow-ups and the 2026-08-09 drilldown).

## Rendering: keep the root layout static

The root layout reads no cookies, no headers and no database, which is what lets
the public site prerender and `events/[slug]` build ~97 static pages. **Do not
add a `cookies()`, `headers()` or DB read to `app/layout.tsx`** — it opts the
whole public site out of static rendering, silently. The dashboard is dynamic
because its own layout awaits `getUser()` and `cookies()`; `/present/[deck]` is
server-rendered on demand. See `docs/ARCHITECTURE.md` §3.

## Assets

`public/` holds site imagery only. **The PDFs and MP4s live on Vercel Blob** and
are referenced through constants in `lib/config/assets.ts`; `public/docs/` and
`public/video/` no longer exist. Replacing a Blob asset means a **new filename
and a new constant**, never an overwrite — the cache is immutable for a year.
User uploads (profile photos, CVs) go to Cloudinary. Images are WebP, ≤1600px
(≤2560px where a deck references them); AVIF is enabled in `next.config.ts`.
See `docs/ARCHITECTURE.md` §6.

## Deck CSS: four rules that fail silently

Inside `.deck-stage` (`styles/components/deck.css`):

1. **Never `vw`/`vh`/`dvh`** — they resolve against the real viewport, not the
   scaled stage. Use `cqi`, fixed design px, and the `.deck-*` type classes.
2. The stage is centred with `translate(-50%, -50%) scale()`, **not** flex/grid.
3. Grid tracks must be `minmax(0, 1fr)` before a percentage `max-block-size` on
   a child means anything.
4. **Responsive `--dt-*` overrides go on `.deck-slide`, never `.deck-stage`** —
   the stage *is* the named container and cannot match its own container query.
   Also: `@container deck (max-width: 1000px)` must stay **below** the 1560px
   block.

Everything else about decks — the visual language, the phone fix, the copy and
rhythm linter, skins, motion, host controls — is in
`docs/development/DECK_SYSTEM.md`. Read it before editing a deck or a slide
layout.

## Working directories are gitignored, not invisible

Six paths hold regenerable scratch. They are gitignored — so `git ls-files` and
`git status` never mention them — but Grep, Glob and `find` read them exactly
like source. That asymmetry is the trap: `.cache/` still contains April-2026
files named `events-custom-final.json`, `final-with-all-updates.json`,
`current.json` and `planned.json`, none of which is the live event data, and
`tmp/` holds loose `.ts` that reads as real source.

**Nothing under these paths is ever a source of truth.** Do not cite one, edit
one, or infer current behaviour from one.

| Path | Written by | Holds |
|---|---|---|
| `tmp/` | `scripts/email/*`, `scripts/events/*`, `scripts/*/propose-crosswalk.ts`, `build-event-archive.mts`, and four email/poster skills | `emails/`, `specs/`, `plates/`, `poster-review/`, `humanitix/`, `mailchimp/`, `event-archive-harvest/` |
| `.cache/` | `sync-event-from-slack`, `reply-to-contact-messages` | Slack channel dumps, `triage.json`, `contact-notifications.json`, plus dead 2026-04 audit leftovers |
| `scripts/.cache/` | `audit-event-images.ts` and the old-site scrape | cached Webflow HTML |
| `.recommendations/` | `scripts/slack-recommendations/` (itself gitignored, though present on disk) | generated LinkedIn recommendations, named after real people |
| `.playwright-cli/` | browser automation | session scratch |
| `report/out/` | `report/build.ps1` | the draft PDF and page previews |

`tmp/` is a **contract**, not litter — those exact paths appear in skill
instructions and script defaults, so do not relocate or rename it. Do clear it
before a local `CI=true npx next build`: stray files under `tmp/` break the
build.

Separately, `/private/` is the gitignored vault for the raw Humanitix and
Mailchimp exports. It carries real names, addresses, sign-up IPs and live access
codes. Read it only when a task requires it, and never copy its contents into
`lib/data/json/` — CI has leak guards for exactly that.

## Conventions

- **All UI text in English.** No Chinese characters in page content, components
  or user-facing strings. Code strings and comments in English.
- **Conversations with the user in Chinese.**
- **Commits**: Conventional Commits / Angular style (`feat:`, `fix:`, `docs:`,
  `refactor:`, `chore:`…), in English.
- **GitHub**: use the `gh` CLI. PRs get a description and a clear test plan.
- **Comments**: function-level, Google open-source style. Explain *why*, since
  the rules in these docs exist because the code alone did not say.
- **No proactive documentation.** Do not create `.md` files unless asked. When
  asked, they go under `docs/{deployment,development,database,features}/` — never
  the repo root. `docs/ARCHITECTURE.md` is the deliberate exception: it is the
  entry point and stays at `docs/` root. `docs/README.md` indexes every doc;
  `docs/showcase/` is not prose but the images the root `README.md` embeds, and
  `docs/marketing/` holds dated campaign artifacts.
- **Focused changes.** Address the request; do not add unrequested features.

---

# Subsystems

Each is two to four lines and a pointer. The pointer is the real documentation.

**Database.** PostgreSQL (Neon) + Drizzle. `lib/db/schema.ts` is a barrel over
`lib/db/schema/{enums,users,mentorship,events,engagement,system,relations}.ts` —
37 tables, 32 enums, loaded in dependency order. `relations.ts` is a leaf holding
only `usersRelations`, because it names a table from every other module; the
reason is written in the file. Import sites keep using `@/lib/db/schema`.
→ `docs/database/DATABASE_SCHEMA.md`

**Auth and roles.** NextAuth 5 (OAuth) + custom JWT sessions in httpOnly
cookies; bcrypt, account lock after 5 failures (15 min), password strength and
history. Users hold multiple independent roles (mentor / mentee / admin) with
fine-grained admin permissions. → `lib/auth/`, `docs/ARCHITECTURE.md` §1–2

**Site content.** Events, team, sponsors, stats, press, podcasts, galleries all
live in `lib/data/` (TS adapters over `lib/data/json/`), single-source and
derived everywhere. Editing one file updates every page. The event list is two
files merged in `lib/data/events.ts` — `shesharp_events_v3.json` (scraped
history, do not hand-edit) and `events-custom.json` (the edit target); which
file owns what is in `lib/data/json/README.md`.
→ `docs/development/ADD_EVENTS.md`

**Content and brand rules.** Twelve years of counting traps, naming traps,
decisions not to roll back, and editorial rules — every one recorded because it
was broken at least once. Read before publishing a number or naming a person.
→ `docs/development/CONTENT_RULES.md`, with provenance in
`PUBLIC_CLAIMS_PROVENANCE.md` and background in `SITE_DATA_HISTORY.md`

**Mentorship + AI matching.** GPT-4 compatibility analysis over MBTI, skills,
goals, industry and logistics, with a mentee waiting queue, confidence scoring
and caching. Applications are currently **paused**.
→ `docs/features/AI_MATCHING_SYSTEM.md`,
`docs/development/MENTORSHIP_APPLICATIONS_PAUSED.md`

**Event feedback.** She Sharp's own form, reached by a `/f/<code>` QR alias;
per-device rate limiting, a 3-day Slack digest, and 12-month anonymisation of
the personal columns. → `docs/development/EVENT_FEEDBACK.md`

**Humanitix ticketing archive.** The account export (2020→, 62 ticketed
instances, 5,156 tickets) reduced to aggregates in `lib/data/json/humanitix/`
and read through `lib/data/humanitix.ts`. The raw CSVs carry names, addresses
and **124 live access codes**, so they live in a gitignored vault (`/private/`)
and never in git; a committed manifest keeps their provenance auditable without
them. Three traps before quoting anything: it starts in **2020**, it covers only
**57 of the 97 events**, and a `checkedIn` of 0 usually means nobody scanned —
read `checkInDataPresent`. → `docs/development/HUMANITIX_ARCHIVE.md`

**Mailchimp audience archive.** The `She#` audience export (2019→, 3,689
contacts, 229 tags) reduced to counts in `lib/data/json/mailchimp/` and read
through `lib/data/mailchimp.ts`. Same split as Humanitix: the raw CSVs are
*entirely* addresses — names, phones, and 1,586 sign-up IPs — so they live in the
gitignored vault (`/private/`) and in the private archive repo, never in git.
Three traps before quoting anything: the list is **1,560**, not 3,689 (the rest
left, bounced, or never subscribed); Mailchimp's own dashboard says **3,145**
because it excludes the 544 hard-bounced; and a `Ticket Type:`/`Event:` tag is a
pasted ticket list, **not attendance** — Humanitix is authoritative for that.
The 2,129 non-subscribers are hashed into `email-suppression-hashes.json` so no
future import can re-add them. → `docs/development/MAILCHIMP_ARCHIVE.md`

**Presentation decks.** `/present/<slug>`, built from typed slide data with a
build-failing copy and rhythm linter, per-event skins over a fixed house
sequence, and a fluid 4:3–21:9 stage. Organisers use `/build-event-slides` and
never touch TypeScript. → `docs/development/DECK_SYSTEM.md`

**Email.** Four streams (`transactional`, `notification`, `marketing`,
`internal`) decided in `lib/email/senders.ts`; one Resend call site in
`lib/email/service.ts`; RFC 8058 one-click unsubscribe and Svix-verified
bounce/complaint capture. → `docs/development/EMAIL_OPERATIONS.md`; DNS, DMARC
and the Mailchimp → Resend migration in `docs/deployment/EMAIL_AUTHENTICATION.md`

**Monthly newsletter.** React Email + Resend broadcasts with an AI editorial
draft, run by the `/monthly-newsletter` skill. **The live newsletter still goes
out from Mailchimp** — this is the replacement, piloted but not switched over.
→ `docs/development/EMAIL_OPERATIONS.md`

**Outbound email skills.** Four guided skills let teammates send mail without
writing code: `/reply-to-contact-messages`, `/update-mailing-list`,
`/send-event-emails`, `/email-the-community`. Repo scripts render, the Resend CLI
sends. → `docs/development/AI_SKILLS_GUIDE.md`, `docs/development/EMAIL_OPERATIONS.md`

**Visitor chatbot.** AI SDK 6 `ToolLoopAgent` on OpenAI `gpt-4o-mini` (direct,
not the AI Gateway), grounded in live data via tools over `lib/data/*`, with
Upstash Redis rate limiting and question analytics that degrade gracefully.
→ `docs/development/CHATBOT_AI_AGENT.md`

**Payments.** Stripe checkout for membership and one-time donations; the webhook
routes `metadata.type` to the right handler. → `lib/stripe/`

**Slack.** Webhook notifications for contact, volunteer and event-feedback forms
plus weekly digests (`lib/slack/`), and a separate event-sync bot that turns a
planning channel into a GitHub draft branch (`lib/slack-bot/`).
→ `docs/development/SLACK_INTEGRATION_GUIDE.md`, `SLACK_EVENT_EXTRACTION.md`,
`SLACK_APP_DEVELOPMENT_GUIDE.md`

**SEO / GEO.** Generated `robots.ts`, `sitemap.ts`, `manifest.ts`, `llms.txt` +
`llms-full.txt`, JSON-LD builders in `lib/seo/schema.ts`, and legacy 308s in
`next.config.ts`. → the three `docs/development/GEO_SEO_*.md` files

**QR codes.** Two deliberately different paths: web/print (`lib/data/qr-codes.ts`
+ `/api/qr`, level H) and deck slides (`components/deck/deck-qr.tsx`, level M,
generated in the browser). → `docs/features/QR_CODE_GENERATION.md`

**Funder reports.** `report/` is a Typst project outside the Next.js build; every
metric carries its provenance and a `-Final` build panics on unverified data.
→ `docs/development/FUNDER_REPORTS.md`, `report/PITFALLS.md`

**Deployment.** Vercel, prebuilt by GitHub Actions on push to `main`; no Git
connection. → `docs/deployment/`, `docs/ARCHITECTURE.md` §8

---

# Testing and CI

**No test runner is configured.** Tests are plain `node:assert` scripts run with
`npx tsx <file>`; each prints `ok - …` and exits non-zero on failure.

CI (`.github/workflows/verify.yml`, PRs to `main`) runs five jobs: image-path
verification (plus the hackathon-facts, Slack read-state, and Humanitix and
Mailchimp archive checks), `typecheck`, `typecheck:scripts`, `lint`, and the deck
checks. The two archive checks are leak guards as much as data checks — they
fail the build if an address, an IP or a code-shaped value reaches
`lib/data/json/`.

Not in CI — run these locally before pushing:

```bash
npx tsx lib/email/hardening.test.ts       # unsubscribe tokens, senders, gates, Svix
npx tsx lib/deck/deck.test.ts             # slide schema, copy + rhythm, feedback codes
npx tsx scripts/mailchimp/verify-export.ts --export 2026-08-17   # needs the vault
npx tsx lib/data/sponsors.test.ts         # sponsor registry
for f in lib/newsletter/*.test.ts; do npx tsx "$f"; done
npx tsx scripts/deck/lint-deck.ts [slug]  # organiser-readable deck report
npx tsx scripts/verify-image-paths.ts
npx tsx scripts/seo/verify-page-metadata.ts --base http://localhost:3100
```

`verify-page-metadata` needs a running site and makes ~121 live requests, so it
tests a deployment rather than a diff. Kill any orphan `next start` on the port
first — a stale server serves an OLD build and makes fixes look broken.

Test new work at each small milestone rather than at the end, keep tests beside
the code they cover, and prefer the minimum assertion that would actually catch
the failure.

# Environment

Required variables and what each is for: **`.env.example`** (database, auth +
OAuth, OpenAI, Upstash Redis, Resend + webhook/unsubscribe secrets, Slack
webhooks, Stripe, Cloudinary, `BASE_URL`, `CRON_SECRET`). Setting them on Vercel:
see the Vercel rules above and
`docs/deployment/VERCEL_ENV_VARIABLES_GUIDE.md`. `MAINTENANCE_MODE=true` serves a
503 for the whole site including `/f/*` and the feedback form —
`docs/deployment/MAINTENANCE_MODE.md`.
