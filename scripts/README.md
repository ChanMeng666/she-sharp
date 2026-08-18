# `scripts/`

70 TypeScript files: 19 loose at the top level, the rest in nine subsystem
directories. Everything here is run by hand with `npx tsx <file>` from the repo
root — **exactly one is wired into `package.json`** (`pnpm db:seed-profiles` →
`seed-profiles.ts`), so the rest are found by reading this file. pnpm 10 is
pinned by `packageManager`; on pnpm 11 use `npx drizzle-kit migrate` rather than
`pnpm db:migrate`. There is no test runner: tests are plain `node:assert`
scripts run the same way (`npx tsx lib/deck/deck.test.ts`), and they live beside
the code they cover in `lib/`, not here. Before any script that mails a list,
the gate is `.claude/skills/update-mailing-list/references/consent-rules.md`.

## DANGER — read before running

`lib/db/drizzle.ts` reads **`POSTGRES_URL`** through `dotenv.config()`, so on a
machine that has ever run `vercel env pull` the default target of every script
below is production. The two wipe scripts are gated by
`scripts/lib/destructive.ts`; the mailers are gated only by their own flags.

| Script | What it does | Why it is irreversible |
| --- | --- | --- |
| `clear-all-data.ts` | `TRUNCATE … RESTART IDENTITY CASCADE` over ~30 named tables, falling back to per-table `DELETE`. | Guarded since 2026-08-19: dry run by default, `--apply` to write, and against a non-local host also `--confirm-host=<host>`. Still nothing is backed up first — the truncate itself is final. |
| `reset-db-and-create-admin.ts` | Same `DELETE` sweep over ~25 tables, then seeds one admin. | Same guard as above. The password is now required in `ADMIN_SEED_PASSWORD` and never defaulted — it used to be the literal `Admin123!`, so every run left a known-credential admin on whichever database it had just wiped. |
| `cleanup-test-users.ts` | Deletes every `users` row with `is_test_user = true` and its dependent records. | Has `--dry-run` and refuses to strand cross-type mentorship relationships, but the deletes themselves cannot be undone. |
| `events/purge-feedback-personal-data.ts` | Anonymises names/emails on feedback past the retention window. | Dry run is the default; `--apply` is the only way past it. The names and addresses are archived nowhere else. |
| `send-url-update.ts` | Emails **every** active mentor in `users`. | Real send via Resend. `--dry-run` and `--test <email>` exist; a non-localhost `BASE_URL` is required. |
| `send-mentor-reminder.ts`, `send-mentee-reminder.ts` | Email every approved-but-unregistered mentor / mentee, and extend their invitation codes by 14 days. | Real send, plus a DB write to `invitation_codes`. Same flags. |
| `resend-mentor-invitations.ts` | Re-sends invitation emails for every unused `mentor_approved` code. | Real send. `--dry-run` only. |
| `send-admin-invitation.ts` | Mints an **admin** invitation code and mails it. | Real send; the code grants admin on redemption. |
| `preview-all-emails.ts` | Sends 18 templates with mock data to one address. | Forces `NODE_ENV=production` so it really sends. Use `chanmeng6666@gmail.com`. |
| `newsletter/approve.ts` | Sends nothing itself — calls the admin approve endpoint, which creates **and schedules** the Resend broadcast. | This is the one script here that can reach the whole newsletter audience. `--send-now` skips the queue. |
| `newsletter/send-test.ts`, `newsletter/seed-pilot-contacts.ts` | Real one-off sends / real contact writes on Resend. | `send-test.ts` needs `RESEND_API_KEY` in the environment at `npx tsx` start or it reports success while sending nothing. |

`email/build-batch.ts` and `email/render-message.ts` deliberately do **not**
send: they write files and print the `resend` command a human runs.

## Subsystem directories

| Directory | For | Entry point |
| --- | --- | --- |
| `assets/` | Moving image assets without breaking the ~1,400 references to them. `refs.ts` is the single definition of "a reference", shared with the CI gate so the two cannot drift; `event-assets.ts` decides which event owns a file and has its own adversarial test. | `plan-move.ts --scope events\|scraped` to generate a map, `apply-move.ts --plan <file>` (dry run; `--apply` to execute). |
| `lib/` | Shared helpers for scripts. | `destructive.ts` — the dry-run / host-confirmation gate the two database-wiping scripts go through. |
| `data/` | One-off corrections to `events-custom.json` / `shesharp_events_v3.json`, each carrying its finding id and its authority. | `json-format.ts` is the shared safe read/write; each fix script is its own entry point and is idempotent. |
| `deck/` | Building and checking `/present/<slug>` slide decks. | `new-deck.ts` to scaffold, `lint-deck.ts` for the organiser-readable report, `sync-registry.ts` to regenerate `registry.ts` + `index-meta.ts`. |
| `email/` | The outbound-mail pipeline behind the four email skills: audience inventory, recipient normalisation, render, gate, batch. | `render-message.ts` (spec → HTML), `build-batch.ts` (list → chunked JSON). `suppression.ts` is the do-not-contact register. |
| `events/` | Event poster generation (plate → five layouts) and feedback tooling. | `generate-poster-plate.ts` then `build-event-poster.ts`; design lives in `poster-formats.ts` / `poster-type.ts`. |
| `humanitix/` | Reducing the gitignored ticketing vault to committed aggregates. | `verify-export.ts` → `manifest.ts --append` → `build-archive.ts`. |
| `mailchimp/` | The same split for the audience export: addresses in the vault, counts in the repo. | `verify-export.ts` → `build-archive.ts`. |
| `newsletter/` | Monthly newsletter: photo strip, local preview, test send, approve. | `preview.ts` for review, `approve.ts` to ship. |
| `seo/` | Post-deploy on-page metadata crawl (~121 live requests). | `verify-page-metadata.ts --base <origin>`. |
| `slack-recommendations/` | Four-phase LinkedIn recommendation generator over Slack history. **Untracked — see gotchas.** | `01-discover.ts` → `02-build-context.ts` → `03-generate.ts` → `04-generate-invitations.ts`. |

## Loose top-level scripts

| Script | Purpose | Status |
| --- | --- | --- |
| `verify-image-paths.ts` | Three checks over `public/img/`: `--forward` (every referenced path resolves), `--reverse` (every file is referenced, allow-list in `KNOWN_UNREFERENCED`), `--ownership` (every event image belongs to an event). No flag runs all three. | Ongoing — CI gate. |
| `check-hackathon-facts.ts` | Asserts this repo still contains every shared fact the Q&A assistant repo also asserts. | Ongoing — CI gate; added 2026-08-04, event-scoped. |
| `audit-event-images.ts` | Read-only orphan/broken/duplicate report over event and sponsor imagery. | Ongoing — writes `audit-report.json`; added 2026-04-21. |
| `build-event-archive.mts` | Harvests a past event's Google Photos album into `public/img/events/archive/<slug>/`, incremental and additive. | Ongoing. |
| `optimize-images.mts` | Builds responsive WebP variants for the curated hero set. | Ongoing, but see gotchas. |
| `smoke-test-funding-sources.ts` | Exercises each funding crawler standalone, prints top 3. | Ongoing debug aid. |
| `create-admin.ts` | Creates or promotes one admin user by email. | Ongoing ops. |
| `seed-profiles.ts` | Test mentor/mentee profiles for AI-matching work. | Ongoing dev seed — the only `package.json` entry. |
| `preview-all-emails.ts` | 18 templates to one address for visual review. | Ongoing dev aid (sends for real). |
| `batch-import-mentors.ts` | Imported 25 offline-confirmed mentors from CSV, with codes and emails. | **One-off, 2026-03-19** — documented in `docs/development/batch-import-mentors-2026.md`. |
| `send-url-update.ts` | Told registered mentors the site had moved. | **One-off, 2026-03-29** — `docs/deployment/DOMAIN_MIGRATION_2026-06-19.md`. |
| `resend-mentor-invitations.ts` | Re-sent invitations whose original emails carried `localhost` URLs. | **One-off, 2026-03-19** — the incident behind the `getBaseUrl()` rule. |
| `send-mentor-reminder.ts` / `send-mentee-reminder.ts` | Reminder sweeps after the deployment URL changed. | **One-off, 2026-03-29 / 2026-04-25** — re-runnable, but the audience is "everyone unregistered". |
| `send-admin-invitation.ts` | Developer-only admin invite. | Rare ops; added 2026-03-23. |
| `cleanup-test-users.ts` | Removes `is_test_user` rows. | Ongoing ops — see `docs/features/TEST_USER_ISOLATION.md`. |
| `clear-all-data.ts` / `reset-db-and-create-admin.ts` | Wipe the database. | Historic dev tooling (2025-11/2026-01). Nothing references them; treat as hazards, not workflow. |
| `collect-event-from-slack.py` | Python Slack → event JSON extractor. | **Superseded** — see gotchas. |

## Gotchas

- **`/scripts/slack-recommendations` is in `.gitignore`** (line 118) but is
  physically present on disk with six TypeScript files. It is greppable locally
  and invisible in the repo; a reader who has cloned fresh will not have it, and
  a reader who has it will not realise it is untracked.
- **`optimize-images.mts:30-31` defaults its input to an absolute scratchpad
  path on one developer's machine** —
  `"D:/Temp/claude/D--github-repository-she-sharp/849ecf8e-.../scratchpad/picks-proposed.json"`.
  The header suggests `scripts/curated-picks.json` as the confirmed file; that
  file does not exist. So the `public/img/legacy-site/` → `public/img/curated/`
  provenance cannot be reproduced from the repo alone.
- **`renew-expired-invitations.ts` was deleted on 2026-08-19.** It renewed five
  named people's invitation codes on 2026-04-14 and was never re-runnable: it
  carried those five real names and email addresses in committed source, keyed
  the rows by hardcoded `invitation_codes.id` values, and its usage line still
  named the pre-migration `shesharpnz.vercel.app` origin. Re-running it would
  have mailed whoever now holds ids 6, 8, 22, 31 and 33. A future renewal should
  select its targets by query, not by literal.
- **`audit-report.json` is generated output sitting beside source.** It is
  gitignored (`.gitignore:106`), so it is untracked litter rather than a
  committed artefact — but it is in the directory listing and looks like input.
- **`scripts/.cache/old-site-html/` is 17 MB of 88 scraped Webflow pages**,
  gitignored, and nothing in the tracked tree reads or writes it. The scraper
  that produced it is gone.
- **`collect-event-from-slack.py` + `requirements-slack.txt` are gitignored**
  (`.gitignore:85-86`) and superseded twice over: by the hosted `/event` Slack
  bot (`lib/slack-bot/`, `app/api/slack/events`) and by the
  `sync-event-from-slack` skill. `docs/development/SLACK_EVENT_EXTRACTION.md`
  keeps the Python path documented as a bulk-import fallback only.
- **`newsletter/pilot-contacts.local.csv` is gitignored real addresses**; the
  committed `pilot-contacts.example.csv` is the shape.
- The `humanitix/` and `mailchimp/` scripts need the gitignored `/private/`
  vault. `--allow-missing-vault` exists on the two verify scripts and must be
  asked for — a verify that passes with nothing to verify is worse than none.

## What CI runs

`.github/workflows/verify.yml`, on pull requests to `main`:

| Job | Runs |
| --- | --- |
| `verify-image-paths` | `scripts/verify-image-paths.ts`, `scripts/check-hackathon-facts.ts`, `.claude/skills/sync-event-from-slack/scripts/state-lib.test.ts`, `.claude/skills/sync-event-from-slack/scripts/audit-read-state.ts`, `lib/data/humanitix.test.ts`, `lib/data/mailchimp.test.ts` |
| `typecheck-scripts` | `pnpm typecheck:scripts` — covers this directory and `.claude/`, which the root tsconfig skips |
| `typecheck` | `pnpm typecheck` |
| `lint` | `pnpm lint` (errors only) |
| `deck-checks` | `lib/deck/deck.test.ts` |

Nothing else here runs automatically. Run these locally before pushing:
`npx tsx lib/email/hardening.test.ts`, `npx tsx lib/deck/deck.test.ts`,
`npx tsx lib/data/sponsors.test.ts`, `for f in lib/newsletter/*.test.ts; do npx tsx "$f"; done`,
`npx tsx scripts/deck/lint-deck.ts [slug]`, `npx tsx scripts/verify-image-paths.ts`,
`npx tsx scripts/mailchimp/verify-export.ts --export 2026-08-17` (needs the vault),
and `npx tsx scripts/seo/verify-page-metadata.ts --base http://localhost:3100`
against a running `next start` — kill any orphan server on the port first, or a
stale build makes fixes look broken.
