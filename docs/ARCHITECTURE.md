# Architecture

How a request travels through this repo, where each concern lives, and which of
those placements are decisions rather than accidents. Written 2026-08-13, at the
end of a refactoring program that split the schema, unified the auth wrapper and
moved the large binaries out of `public/`.

`CLAUDE.md` is the index; this file is the map behind it.

---

## 1. Route groups and auth boundaries

```
app/
  layout.tsx              root layout — STATIC. No cookies(), no headers(), no db.
  (site)/                 public marketing site + event pages       — no auth
  (login)/                sign-in, sign-up, password, verification  — no auth, noindex
  (dashboard)/dashboard/  member + admin area                       — auth required
  present/[deck]/         projected slide decks                     — no auth, noindex
  f/[code]/               short feedback-code redirector            — no auth
  api/                    route handlers                            — per-route auth
  robots.ts sitemap.ts manifest.ts llms-full.txt/   metadata routes
  accessibility/ code-of-conduct/ cookie-policy/ privacy-policy/
  security-policy/ terms-of-service/ volunteers/    standalone legal pages
```

Three separate gates, and they do **not** substitute for each other:

| Gate | Where | Covers |
|---|---|---|
| Cookie presence | `proxy.ts` | `/dashboard/*`, `/verify-invitation` — cheap, edge, no DB |
| Real session + verification | `app/(dashboard)/dashboard/layout.tsx` | every dashboard page — `getUser()` then `ensureUserVerified()` |
| Role / permission | `withRoles()` in route handlers | every protected `/api/*` endpoint |

`proxy.ts` only checks that a session **cookie exists**. It never validates the
user against the database, so it is a redirect for logged-out visitors, not an
authorisation boundary. Anything that matters is re-checked in the layout (for
pages) or in `withRoles()` (for API routes).

## 2. Request lifecycle

```
request
  │
  ├─ proxy.ts   (matcher: everything except _next/static, _next/image, logos, favicon.ico)
  │    1. MAINTENANCE_MODE=true       → 503 maintenance HTML, end
  │    2. legacy Webflow ?<hex>_page= → 308 with the param stripped (GET only, skips /api/)
  │    3. /dashboard or /verify-invitation without a session cookie → redirect
  │    4. rolling session-cookie refresh on GET
  │
  ├─ page (app/(site)/…)                    ├─ route handler (app/api/…/route.ts)
  │    server component, mostly prerendered │    withRoles({ requiredRoles, requiredAdminPermissions }, handler)
  │    reads lib/data/* (JSON + TS)         │      → 401 no session / 403 wrong role
  │                                          │    zod schema.safeParse(body) → invalidBody() 400
  │                                          │    lib/<subsystem>/*-service.ts
  │                                          │      → db (lib/db/drizzle.ts) over lib/db/schema
  │                                          │      → lib/email/service.ts, lib/slack/service.ts, …
  │
  └─ response
```

Client components call their own API through `apiFetch()` in `lib/api/client.ts`,
which sets the JSON headers, checks `res.ok` and throws `ApiError` — so a call
site is a plain `try`/`catch`. It deliberately does not decide what the user
sees. Some raw `fetch()` calls survive and are being migrated.

**Validation is the route handler's job, not the service's.** Every write route
parses its body with a zod schema and returns `invalidBody(error)` from
`lib/api/validation.ts` on failure, which produces the `{ error, details }` shape
every client in the repo already reads.

**`withRoles()` and its one sharp edge.** `checkAdminPermissions()` treats a
**missing** `admin_permissions` row as "all permissions granted", because the
table defaults every column to `true`. That is the right default for an admin
who has never had permissions narrowed, and the wrong default for anything where
absence should mean *no*. Routes that need default-DENY do the check inline
instead of through `requiredAdminPermissions`, and say so at the site. Do not
"simplify" one of those back into the wrapper.

`getUserRoles()` has one implementation, in `lib/auth/role-middleware.ts`.
`lib/auth/permissions.ts` re-exports it so either import path works.

## 3. Rendering model

The root layout is **static**: it reads no cookies, no headers and no database,
and `@vercel/analytics` / `@vercel/speed-insights` are client components that
inject a script tag rather than reading request data. That is what allows
everything below it to choose for itself.

| Segment | Mode | Why |
|---|---|---|
| `(site)/*` | Prerendered at build | Content comes from `lib/data/*` — files, not requests |
| `(site)/events/[slug]` | SSG via `generateStaticParams()` (~97 pages) | Every slug is known at build time |
| `(dashboard)/dashboard/*` | Dynamic | Its own layout awaits `getUser()` and `cookies()` |
| `present/[deck]` | Server-rendered on demand | No `generateStaticParams()`; one render of static data, then fully client-side |
| `(site)/resources/newsletters/[issue]` | `dynamic = "force-static"` + `dynamicParams = false` (238 ids: 179 campaign ids plus 59 `YYYY-MM` ids, the three registry issues among them) | A route handler, not a page — it returns the whole HTML document the subscriber received. Prerendering it keeps 8.7 MB of `lib/data/newsletter-archive/` out of any lambda; `dynamicParams = false` 404s every other id without running the handler. `noindex` by `X-Robots-Tag`, so it is **not** in `app/sitemap.ts` and **not** `Disallow`ed |
| `app/llms-full.txt` | `revalidate = 3600` | Cheap to regenerate, should not go stale |
| `api/cron/*`, webhooks, unsubscribe | `force-dynamic` | Must never be cached |

A previous root-level `force-dynamic` made all of this moot; it is gone. **Do not
reintroduce a `cookies()`, `headers()` or database read into the root layout** —
it silently opts the entire public site out of static rendering, and nothing
fails, it just gets slower.

**`app/api/events/ticket-status/` is the first runtime consumer of an external
ticketing API, and it changes none of the above.** It asks Humanitix about the
site's *upcoming* events only, reduces each listing to three flags
(`markedAsSoldOut`, `suspendSales`, `published`/`public`) and returns one word
per slug — cached in Redis and at the CDN (`s-maxage=300`,
`stale-while-revalidate=900`), rate-limited, `force-dynamic` so a build can
never bake an answer in. `/events/[slug]` is still `●` SSG: the page ships
prerendered and `hooks/use-ticket-status.ts` fetches the status afterwards to
disable the registration button on `"sold-out"` / `"closed"`. **No count crosses
the boundary** — tickets remaining and capacity are both available upstream and
neither may be rendered — and every failure, a missing key included, is a 200 of
`"unknown"`, which is exactly what the page looked like before the route
existed.

## 4. The dual-table data model

Mentor and mentee data is split across two tables plus a fallback to `users`.
This is historical (form imports arrived before profiles existed) and is not
going to be normalised away.

```
  mentor_form_submissions        the primary record, richest
   │   city, phone, gender, softSkillsExpert, industrySkillsExpert,
   │   preferredIndustries, preferredMeetingFormat, longTermGoals,
   │   shortTermGoals, whyMentor, currentJobTitle, currentIndustry
   ↓  (field missing / empty)
  mentor_profiles                the platform-managed subset
   │   currentMenteesCount, isAcceptingMentees, verifiedAt,
   │   learningGoals, currentChallenge          (profile-only)
   ↓  (field missing / empty)
  users                          the account, incl. the OAuth avatar
   ↓
  null
```

**Reads walk the whole chain, always.** The chain is implemented once, in
`lib/mentorship/resolve.ts` (`resolveField()`, `resolvePhoto()`) — dependency-free
so server components, route handlers and client components can share it. Never
resolve an avatar from `users.image` alone; it is null for most form-imported
users, and reading a single tier is what made avatars invisible across ten
endpoints in the 2026-03-20 incident.

**Writes update both tables.** A profile-edit endpoint that writes only
`*_profiles` leaves the primary record stale.

Full field-by-field reference: `docs/database/MENTOR_MENTEE_DATA_GUIDE.md`.

### The schema barrel

`lib/db/schema.ts` is an 18-line barrel; the tables live under `lib/db/schema/`
in dependency order:

```
enums.ts → users.ts → { mentorship.ts, events.ts, engagement.ts, system.ts } → relations.ts
```

37 tables, 32 `pgEnum`s. `relations.ts` is a leaf holding exactly one
declaration, `usersRelations`, because it names a table from every other module
while all of them import `users` — defining it beside the `users` table would
make the directory a cycle. The reasoning is written into the file; read it
before moving anything. Every import site still uses `@/lib/db/schema`, and
`drizzle.config.ts` still points at the barrel, so drizzle-kit sees the whole
schema.

The mentorship **vocabulary** (option lists for career stage, gender, MBTI,
meeting format, industries, skills, cities) lives once in
`lib/mentorship/vocab.ts`. Sets backed by a Postgres enum are bound to that
enum's values at compile time via `import type`, so a new enum value without a
label is a type error — and the type-only import keeps the Drizzle schema out of
the browser bundle of a public marketing form.

## 5. Email streams

From `lib/email/senders.ts`, the single source of truth for every From and
Reply-To. The stream decides the rest:

| Stream | Meaning | From | `List-Unsubscribe` | Honours opt-outs |
|---|---|---|---|---|
| `transactional` | Recipient-triggered, expected in minutes | `noreply@` (overridable by `EMAIL_FROM`) | No | **Never** |
| `notification` | Recurring, unrequested | `noreply@` | Yes (RFC 8058) | Yes |
| `marketing` | Newsletter + one-off broadcasts | `newsletter@` | Resend attaches it | via Resend topics |
| `internal` | To She Sharp's own mailboxes | `noreply@` | No | No |

`sendEmail()` in `lib/email/service.ts` is the only call into Resend. It checks
`email_optouts` for `notification` only — a suppressed address must still get a
password reset. Details in `docs/development/EMAIL_OPERATIONS.md`; DNS and DMARC
in `docs/deployment/EMAIL_AUTHENTICATION.md`.

## 6. Asset strategy

Three stores, chosen by who writes the file and how big it is:

| Store | Holds | Referenced by |
|---|---|---|
| `public/` (in the repo, ~154 MB) | Site imagery, logos, brand marks, icons, `llms.txt` | Literal `/img/...` paths |
| **Vercel Blob** | The impact-report/pitch PDFs and the five MP4s (~63 MB), plus the 428 re-hosted newsletter-archive images (342.2 MB of vault originals → 38.3 MB of WebP) | Constants in `lib/config/assets.ts` |
| **Cloudinary** | User uploads — profile photos, CVs | `lib/cloudinary/config.ts` |

`public/docs/` and `public/video/` no longer exist. Those files never change, are
requested by a small fraction of visitors, and were riding along in every build
artifact, clone and deployment upload. Blob serves them from the same edge
network with a one-year immutable cache.

Three rules that follow, all recorded in `lib/config/assets.ts`:

- **The Blob URLs are hard-coded, not built from an env var.** This project has
  no Vercel Git connection, so a new env var needs a fresh commit anyway — it
  would buy no flexibility while adding a failure mode where an unset or
  newline-corrupted base renders a broken `<video>` with no build error.
- **Replacing a Blob asset means a new filename plus a new constant**, never an
  overwrite in place — a one-year immutable cache would ignore it.
- **`/docs/pitch-deck-template-2026.pdf` 308s to Blob** via `next.config.ts`
  `redirects()`, because that URL is projected as a QR code and its length is
  load-bearing: 61 bytes fits a 33×33 code where the 89-byte Blob URL needs
  41×41 in the same physical square. The impact reports have no equivalent —
  nobody reads those URLs off a wall, so they point at Blob directly.

Images are WebP, capped at 1600px (2560px where a deck references them), and
`next.config.ts` enables AVIF. `/img/*` and `/logos/*` carry immutable cache
headers. `npx tsx scripts/verify-image-paths.ts` (in CI) fails on a referenced
path that does not exist.

## 7. Where does X live

| Concern | Directory | Notes |
|---|---|---|
| Auth, sessions, roles, permissions | `lib/auth/` | `withRoles()` and `getUserRoles()` in `role-middleware.ts` |
| Database client, queries, seed, migrations | `lib/db/` | Schema split under `lib/db/schema/` |
| Site content (events, team, sponsors, stats, press, podcasts) | `lib/data/` | JSON sources under `lib/data/json/`; see `docs/development/ADD_EVENTS.md` |
| Mentorship vocabulary + dual-table resolution + stats | `lib/mentorship/` | `vocab.ts`, `resolve.ts`, `stats-service.ts` |
| AI mentor↔mentee matching | `lib/matching/` | GPT-4, queue, cache, prompts, match emails |
| Mentorship programmes (HER WAKA etc.) | `lib/programmes/` | |
| Form submission services | `lib/forms/` | Contact, volunteer, event feedback (+ summary, retention, device id) |
| Volunteer recruitment pipeline | `lib/recruitment/` | `stages.ts` is the stage vocabulary; `ai-screening.ts` |
| Email sending, streams, gates, suppression | `lib/email/` | Single Resend call site in `service.ts` |
| Monthly newsletter | `lib/newsletter/` | Assemble / render / generate / schedule / approve |
| The 179 archived Mailchimp sends | `lib/data/newsletter-archive/` + `lib/newsletter/archive.ts` | Sanitised HTML bodies, `index.json` keyed by 10-hex campaign id, `images.json` naming the Blob object for each. **Generated and checksummed — never hand-edit a body.** `archive.ts` holds the `/resources/newsletters/<id>` resolution order and the reason a `YYYY-MM` id cannot address a body |
| Mailchimp Marketing API v3 | `lib/mailchimp/` | `client.ts`, a typed `fetch` wrapper. **Local tooling only** — nothing under `app/` reads `MAILCHIMP_API_KEY`, and `listMembers()` defaults to a narrow `fields` projection because the full member object carries `ip_signup`/`ip_opt`/`location` |
| Humanitix Public API v1 | `lib/humanitix/` | `client.ts`, same shape. **PII-free endpoints only**: `listEvents`, `getEvent`, `getCheckInCount`, `listTags`. `/orders` and `/tickets` are deliberately unimplemented — that absence is the safety mechanism. `docs/development/PLATFORM_APIS.md` |
| Visitor chatbot | `lib/chatbot/` | AI SDK 6 agent, tools over live data, Redis rate limit |
| Slack webhooks (notifications, digests) | `lib/slack/` | One app per notification stream |
| Slack event-sync bot | `lib/slack-bot/` | AI extraction → GitHub draft branch |
| Funding-opportunity crawler | `lib/funding/` | Sources, scoring, dedup, weekly cron |
| Presentation decks | `lib/deck/` | Types, boilerplate, skins, motion, lint, registry |
| SEO + structured data | `lib/seo/` | `site.ts` is the canonical-origin source of truth |
| Stripe | `lib/stripe/` | Checkout, donations, webhook handling |
| Invitation codes | `lib/invitations/` | |
| Account deletion | `lib/user/` | |
| Cloudinary uploads | `lib/cloudinary/` | |
| Browser → own API | `lib/api/client.ts` | `apiFetch()` / `ApiError` |
| Route-handler body validation | `lib/api/validation.ts` | `invalidBody()`, `readOptionalJson()` |
| CSV export | `lib/export/csv.ts` | |
| Nav, footer, sidebar, contact addresses, Blob URLs | `lib/config/` | |
| Tailwind/design tokens, fonts, `cn()` | `lib/design-system.ts`, `lib/fonts.ts`, `lib/utils.ts` | |

Components mirror the site rather than a taxonomy: `components/{about, admin,
chatbot, contact, deck, donate, events, forms, home, join-team, layout, legal-*,
membership, mentorship, resources, seo, sponsors, ui}`. `components/ui/` is
shadcn/ui plus custom primitives. Admin user management is split across
`components/admin/{use-admin-users.ts, user-list-table, user-list-cards,
user-dialogs, user-filters, user-badges}` — the hook owns the data, the rest are
presentation.

Deck behaviour that used to sit inside `components/deck/deck-viewport.tsx` now
lives in `hooks/use-deck-keyboard.ts`, `use-deck-swipe.ts`, `use-deck-preload.ts`
and `use-wake-lock.ts`.

### Subsystem → the doc that owns it

The table above answers "which directory". This one answers "which document",
for the subsystems whose real complexity is not in the directory listing. It was
absorbed from the root `CLAUDE.md` on 2026-09-01, when that file went back to
being an index; the root now carries a one-line pointer per row.

| Subsystem | In one breath | The doc that owns it |
|---|---|---|
| **Database** | Neon + Drizzle, `lib/db/schema.ts` a barrel over seven modules in dependency order; `relations.ts` is a leaf because `usersRelations` names a table from every other module | `docs/database/DATABASE_SCHEMA.md`, plus `lib/db/CLAUDE.md` |
| **Auth and roles** | NextAuth 5 OAuth + custom JWT in httpOnly cookies; bcrypt, lock after 5 failures for 15 minutes, password strength and history; **multiple independent roles** per user with fine-grained admin permissions | §1–2 above, `lib/auth/` |
| **Site content** | Events, team, sponsors, stats, press, podcasts, galleries in `lib/data/` — TS adapters over `lib/data/json/`, single-source and derived everywhere. The event list is **two files merged** in `lib/data/events.ts`: `shesharp_events_v3.json` (scraped history, do not hand-edit) and `events-custom.json` (the edit target) | `docs/development/ADD_EVENTS.md`, `lib/data/json/README.md` |
| **The event lifecycle** | One regular evening event is ten steps in a fixed order — Slack channel → event record → poster → speaker campaign → announcement → deck → the night → feedback → gallery → newsletter — plus an optional social video, and one job that is **not a step in this repo at all**: the mail to registrants, sent from Humanitix's own Email campaigns tool. Each skill knows only its own job; `npx tsx scripts/events/event-status.ts --slug <slug>` answers "where has this event got to?" offline | `docs/development/EVENT_LIFECYCLE_SOP.md`, `docs/development/EVENT_PLAYBOOK.md` |
| **Slack triage** | `.github/workflows/slack-triage.yml` runs `/sync-event-from-slack`'s triage every weekday morning as the Collector bot and keeps one standing GitHub issue labelled `slack-triage` current — so **check that issue before running the triage yourself**. It reports and never records (`--no-record` moves no read position), so a row stays until a human syncs it. A bot token cannot list **DMs or group DMs at all**, nor a private channel nobody invited it to; those need a `SLACK_USER_TOKEN`. Refreshing the private `she-sharp-slack-archive` (`SLACK_ARCHIVE_DIR`) is **not** a step of a sync — it belongs to whoever holds that checkout, and a sync is complete without it | `.claude/skills/sync-event-from-slack/SKILL.md` |
| **Content and brand rules** | Twelve years of counting traps, naming traps, decisions not to roll back, and editorial rules — every one recorded because it was broken at least once. Read before publishing a number or naming a person | `docs/development/CONTENT_RULES.md`, `PUBLIC_CLAIMS_PROVENANCE.md`, `SITE_DATA_HISTORY.md` |
| **Mentorship + AI matching** | GPT-4 compatibility over MBTI, skills, goals, industry and logistics, with a mentee waiting queue, confidence scoring and caching. Applications are currently **paused** | `docs/features/AI_MATCHING_SYSTEM.md`, `docs/development/MENTORSHIP_APPLICATIONS_PAUSED.md` |
| **Event feedback** | She Sharp's own form behind a `/f/<code>` QR alias; per-device rate limiting, a 3-day Slack digest, 12-month anonymisation of the personal columns | `docs/development/EVENT_FEEDBACK.md` |
| **Humanitix ticketing archive** | The account export (2020→, 62 ticketed instances, 5,156 tickets) reduced to aggregates in `lib/data/json/humanitix/`. Three traps before quoting anything: it starts in **2020**, it covers **57 of the 97 events**, and a `checkedIn` of 0 usually means nobody scanned — read `checkInDataPresent` | `docs/development/HUMANITIX_ARCHIVE.md`, `PLATFORM_APIS.md` |
| **Mailchimp audience archive** | The `She#` audience export (2019→, 3,689 contacts) reduced to counts in `lib/data/json/mailchimp/`, plus `campaigns.json` — the send history the account export never delivered. Three traps: the list is **1,560**, not 3,689; Mailchimp's dashboard says **3,145** because it excludes hard bounces; and a `Ticket Type:`/`Event:` tag says a ticket was **bought**, which is not attendance | `docs/development/MAILCHIMP_ARCHIVE.md`, `PLATFORM_APIS.md` |
| **Leaving Mailchimp** | The founder is cancelling the **paid subscription**, not closing the account. **Pause or downgrade, never delete**, and the last Mailchimp send must precede the downgrade. The account is untouched and still sends event campaigns by hand | `docs/deployment/MAILCHIMP_CANCELLATION.md` |
| **Presentation decks** | `/present/<slug>` from typed slide data, a build-failing copy and rhythm linter, per-event skins over a fixed house sequence, a fluid 4:3–21:9 stage. Organisers use `/build-event-slides` and never touch TypeScript | `docs/development/DECK_SYSTEM.md`, `components/deck/CLAUDE.md`, `styles/CLAUDE.md` |
| **Email** | Four streams decided in `lib/email/senders.ts`; **one** Resend call site in `service.ts`; RFC 8058 one-click unsubscribe and Svix-verified bounce/complaint capture. The newsletter has been **self-hosted** on Resend's batch API since 2026-08-31 | `docs/development/EMAIL_OPERATIONS.md`, `EMAIL_PLATFORM_STATE.md`, `EMAIL_PLATFORM_STRATEGY.md`, `docs/deployment/EMAIL_AUTHENTICATION.md`, `lib/email/CLAUDE.md` |
| **Outbound email skills** | `/reply-to-contact-messages`, `/update-mailing-list`, `/email-the-community`, `/promote-event`. Repo scripts render, the Resend CLI sends. **Three marketing sends per calendar month across all of them**, the newsletter included. Registrant mail is Humanitix's job, not this repo's | `docs/development/EMAIL_RESPONSIBILITY_BOUNDARIES.md`, `AI_SKILLS_GUIDE.md`, `INTERNAL_EMAIL_PLAYBOOK.md` |
| **Visitor chatbot** | AI SDK 6 `ToolLoopAgent` on OpenAI `gpt-4o-mini` (direct, not the AI Gateway), grounded in live data by tools over `lib/data/*`, Upstash Redis rate limiting, analytics that degrade gracefully | `docs/development/CHATBOT_AI_AGENT.md` |
| **Payments** | Stripe checkout for membership and one-time donations; the webhook routes `metadata.type` to the right handler | `lib/stripe/` |
| **Slack** | `lib/slack/` is webhook notifications for the contact, volunteer and event-feedback forms plus weekly digests; `lib/slack-bot/` is the event-sync bot that turns a planning channel into a GitHub draft branch | `docs/development/SLACK_INTEGRATION_GUIDE.md`, `SLACK_EVENT_EXTRACTION.md`, `SLACK_APP_DEVELOPMENT_GUIDE.md` |
| **SEO / GEO** | Generated `robots.ts`, `sitemap.ts`, `manifest.ts`, `llms.txt` + `llms-full.txt`, JSON-LD builders in `lib/seo/schema.ts`, legacy 308s in `next.config.ts` | the three `docs/development/GEO_SEO_*.md`, `app/CLAUDE.md` |
| **QR codes** | Two deliberately different paths: web/print (`lib/data/qr-codes.ts` + `/api/qr`, level H) and deck slides (`components/deck/deck-qr.tsx`, level M, generated in the browser) | `docs/features/QR_CODE_GENERATION.md` |
| **Funder reports** | **Not in this repo.** The two Typst projects moved to `NZ-SheSharp/she-sharp-reports` on 2026-09-01; the data and generators stayed, because an internal record reconciles what the site *claims* against what the platforms *recorded* and so reads `lib/data/{events,sponsors,team,stats}` live. That repo reads this one through `SHESHARP_REPO_DIR`; `scripts/internal-report/build-record.ts` writes into it through `SHESHARP_REPORTS_DIR`. What is left here is the **published** PDFs on Vercel Blob | `docs/development/FUNDER_REPORTS.md` |
| **Deployment** | Vercel, prebuilt by GitHub Actions on push to `main`; **no Vercel Git connection**, so a new env var needs a new commit | `docs/deployment/`, §8 below |

## 8. Testing reality

The summary is here because testing is part of the architecture;
**`docs/development/TESTING.md` is the file to change when a check moves**, and
it carries the reasoning this section only names.

**There is no test runner.** Tests are plain `node:assert` scripts run directly
with `npx tsx <file>`; each prints `ok - …` lines and exits non-zero on failure.

Run by CI (`.github/workflows/verify.yml`, on PRs to `main`) — **one job,
`verify`**, sharing a single checkout and install across these steps:

| Step | Runs |
|---|---|
| `typecheck` | `pnpm typecheck` — `app/`, `components/`, `lib/`, `hooks/`, `types/`, `proxy.ts` |
| `typecheck-scripts` | `pnpm typecheck:scripts` — `scripts/` and `.claude/`, both missed by the root tsconfig |
| `lint` | `pnpm lint` — ESLint 9 flat config, **errors gate**; legacy violations are demoted to warnings in `eslint.config.mjs` and paid down separately |
| `deck-checks` | `lib/deck/deck.test.ts` |
| the offline checks | `scripts/verify-image-paths.ts` **and every other offline check**, because they are pure data: newsletter email-safe covers, the poster fonts (`scripts/events/fonts.test.ts`), event- and poster-asset ownership, event status, the two docs-page checks, the hackathon facts, the two Slack read-state checks, the Humanitix and Mailchimp archive checks, the event-announcement stages, the marketing frequency cap, and `scripts/mailchimp/archive-guard.test.ts`. A new check needing neither a database nor the network belongs here, as another step |

Every check step carries `if: ${{ !cancelled() && steps.install.outcome ==
'success' }}`, so one red check does not hide the next — the run still reports
every failure at once, as it did when these were five jobs.

Not in CI, run by hand:

```bash
npx tsx lib/email/hardening.test.ts            # unsubscribe tokens, senders, gates, Svix
npx tsx lib/data/sponsors.test.ts              # sponsor registry
for f in lib/newsletter/*.test.ts; do npx tsx "$f"; done
npx tsx scripts/seo/verify-page-metadata.ts --base http://localhost:3100
```

`verify-page-metadata` needs a running site and makes ~121 live requests, so it
tests a deployment rather than a diff. Run it after a deploy or before a PR that
touches metadata — and kill any orphan `next start` on the port first, or a
stale server silently serves an OLD build and makes the changes look broken.

`.github/workflows/deploy.yml` prebuilds on push to `main` and caches
`.next/cache`. There is **no Vercel Git connection**, which is why a new
environment variable needs a fresh commit rather than a dashboard "Redeploy".
