# `lib/` — the subsystems

Loaded when you read a file under `lib/`. `docs/ARCHITECTURE.md` §7 is the full
"where does X live" table; this file carries the rules that decide how you write
the code once you are in the right directory.

| Directory | What it owns |
|---|---|
| `api/` | `apiFetch()` + `ApiError` (`client.ts`), `invalidBody()` + `readOptionalJson()` (`validation.ts`) |
| `auth/` | NextAuth 5 OAuth + custom JWT sessions; `withRoles()` and `getUserRoles()` in `role-middleware.ts` |
| `blob/` | user uploads — profile photos, CVs — on Vercel Blob (`uploads.ts`) |
| `chatbot/` | the visitor agent |
| `config/` | nav, footer, sidebar, contact addresses, Blob URLs (`assets.ts`) |
| `data/` | site content: events, team, sponsors, stats, press, podcasts, galleries, the Humanitix and Mailchimp aggregates, the newsletter archive |
| `db/` | schema barrel, client, migrations, seed — has its own `CLAUDE.md` |
| `deck/` | slide types, boilerplate, skins, motion, lint, registry |
| `email/` | streams, senders, the single Resend call site, suppression — has its own `CLAUDE.md` |
| `export/` | `csv.ts` → `toCsv()` |
| `forms/` | contact, volunteer, event feedback services (`'use server'`) |
| `funding/` | funding-opportunity crawler: sources, scoring, dedup, weekly cron |
| `humanitix/` `mailchimp/` | typed API clients — see the PII boundary below |
| `invitations/` | invitation codes |
| `matching/` | GPT-4 mentor↔mentee compatibility, queue, cache, prompts, match emails |
| `mentorship/` | `vocab.ts`, `resolve.ts`, `stats-service.ts` |
| `newsletter/` | assemble / render / generate / schedule / approve, plus `archive.ts` |
| `programmes/` | HER WAKA and the other named programmes |
| `recruitment/` | volunteer pipeline; `stages.ts` is the stage vocabulary, `ai-screening.ts` |
| `seo/` | `site.ts` (canonical origin + org facts), `schema.ts` (JSON-LD builders) |
| `slack/` `slack-bot/` | notification webhooks; the event-sync bot |
| `stripe/` | checkout, donations, webhook handling |
| `user/` | account deletion |

Plus `utils.ts` (`cn()`), `fonts.ts`, `design-system.ts`.

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

Mentorship **applications are currently paused** — what was hidden on 2026-06-19
and the runbook to re-open are in
`docs/development/MENTORSHIP_APPLICATIONS_PAUSED.md`. The matching system itself
is `docs/features/AI_MATCHING_SYSTEM.md`.

## Site content is single-source

Events, team, sponsors, stats, press, podcasts and galleries all live in
`lib/data/` — TypeScript adapters over `lib/data/json/` — and everything on the
site derives from them. Editing one file updates every page.

The event list is **two files merged** in `lib/data/events.ts`:
`shesharp_events_v3.json` (scraped history — **do not hand-edit**) and
`events-custom.json` (the edit target). Which file owns what is in
`lib/data/json/README.md`; how to edit them is
`docs/development/ADD_EVENTS.md`.

Before publishing any number or naming any person, read
`docs/development/CONTENT_RULES.md` — twelve years of counting and naming traps,
each recorded because it was broken at least once — with provenance in
`PUBLIC_CLAIMS_PROVENANCE.md` and background in `SITE_DATA_HISTORY.md`.

## Auth and roles

NextAuth 5 (OAuth) plus custom JWT sessions in httpOnly cookies; bcrypt, account
lock after 5 failures (15 minutes), password strength and history. A user holds
multiple **independent** roles (mentor / mentee / admin) with fine-grained admin
permissions — not a single role column. `withRoles()` resolves the session,
returns 401/403 itself and passes `{ user }` to the handler;
**`requiredAdminPermissions` is default-GRANT**, because every column of
`admin_permissions` defaults to `true`. See `docs/ARCHITECTURE.md` §1–2.

## The PII boundary in the platform clients

**Enforced by absence, not by discipline.** `lib/humanitix/client.ts` implements
`listEvents`, `getEvent`, `getCheckInCount` and `listTags` — and **deliberately
does not implement `/orders` or `/tickets`**, which carry names, emails,
mobiles, addresses and a live `accessCode` on nearly every row. A function that
does not exist here cannot be imported from `app/` by mistake. Scripts may call
those endpoints; nothing under `lib/` may. Same shape on the other side:
`listMembers()` in `lib/mailchimp/client.ts` defaults to a narrow `fields`
projection because the full member object carries `ip_signup`, `ip_opt` and
`location`. Widening either is an explicit act, not a refactor.

`MAILCHIMP_API_KEY` is **local tooling only** — nothing under `app/` may read
it. `HUMANITIX_API_KEY` is the exception and is also set on Vercel production,
because the ticket-status route reads it. Raw API pulls go to the private
archive repo via `MAILCHIMP_VAULT_DIR` / `HUMANITIX_VAULT_DIR`, **never** into
`lib/data/json/` — CI has leak guards for exactly that.
→ `docs/development/PLATFORM_APIS.md`

The aggregates those pulls feed — `lib/data/json/humanitix/` read through
`lib/data/humanitix.ts`, `lib/data/json/mailchimp/` read through
`lib/data/mailchimp.ts` — each carry traps that make a quoted number wrong.
Read `docs/development/HUMANITIX_ARCHIVE.md` and
`docs/development/MAILCHIMP_ARCHIVE.md` before quoting one.

## The rest, in one line each

- **Chatbot.** AI SDK 6 `ToolLoopAgent` on OpenAI `gpt-4o-mini` (direct, not the
  AI Gateway), grounded in live data by tools over `lib/data/*`, with Upstash
  Redis rate limiting and question analytics that degrade gracefully.
  → `docs/development/CHATBOT_AI_AGENT.md`
- **Payments.** Stripe checkout for membership and one-time donations; the
  webhook routes `metadata.type` to the right handler.
- **Slack.** `lib/slack/` is webhook notifications for the contact, volunteer
  and event-feedback forms plus weekly digests; `lib/slack-bot/` is a separate
  event-sync bot that turns a planning channel into a GitHub draft branch.
  → `docs/development/SLACK_INTEGRATION_GUIDE.md`, `SLACK_EVENT_EXTRACTION.md`,
  `SLACK_APP_DEVELOPMENT_GUIDE.md`
- **Event feedback.** She Sharp's own form, reached by a `/f/<code>` QR alias;
  per-device rate limiting, a 3-day Slack digest, and 12-month anonymisation of
  the personal columns. → `docs/development/EVENT_FEEDBACK.md`
- **QR codes.** Two deliberately different paths: web/print
  (`lib/data/qr-codes.ts` + `/api/qr`, error correction level H) and deck slides
  (`components/deck/deck-qr.tsx`, level M, generated in the browser).
  → `docs/features/QR_CODE_GENERATION.md`
- **Neon connections.** Do not `Promise.all` many small queries in a cron or
  serverless handler — Neon throttles concurrent connection attempts and throws
  "Failed to acquire permit". Serial awaits are safer. A cron with multi-step IO
  needs `maxDuration = 300` and per-client timeouts; the OpenAI SDK's default is
  ten minutes.
