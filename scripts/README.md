# `scripts/`

90 tracked TypeScript files (96 on disk — `slack-recommendations/` is
gitignored): 17 loose at the top level, the rest in subsystem directories. Everything here is run by hand with `npx tsx <file>` from the repo
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
| `email/probe-mailboxes.ts` | Sends one message to each of ~21 She Sharp mailboxes to find out which exist. | Real send, but only ever to the organisation's own addresses, and dry run is the default (`--send` to send). In production every hard bounce becomes an `email_optouts` row; `email/suppression.ts sync` now skips She Sharp's own mailboxes by hash so they can never reach the committed register. |
| `newsletter/send-test.ts` | Real one-off sends. | Needs `RESEND_API_KEY` in the environment at `npx tsx` start or it reports success while sending nothing. |
| `email/import-mailchimp-subscribers.ts` | Writes real people into `newsletter_subscribers`. | **Dry run is the default** — `--apply` must be spelled out. Refuses the `unsubscribed`/`cleaned`/`nonsubscribed` exports outright. |
| `email/import-optin-subscribers.ts` | Writes real people into `newsletter_subscribers` — the ones who ticked a registration form's marketing opt-in (consent route 2). | **Dry run is the default** — `--apply` must be spelled out. You cannot un-import consent, only delete rows and lose the provenance. Refuses outright when the file has no opt-in column, and when `--event-name`/`--event-date` are missing, because those are what the consent sentence is composed from. `confirmedAt` stays null: nobody clicked a link of ours. |

`email/build-batch.ts` and `email/render-message.ts` deliberately do **not**
send: they write files and print the `resend` command a human runs.

**`humanitix/fetch-api.ts` is the sensitive one that is not in the table**,
because nothing it does is irreversible — it mails nobody and writes only to the
gitignored vault. What it *writes* is the hazard. Events and tags come down on
every run and are safe; `--include orders,tickets` adds, per event, names, email
addresses, mobiles, street addresses, dates of birth, the free-text
dietary/accessibility/photo-consent answers, a working `qrCodeData` admission
token, and a **live `accessCode` on nearly every row**. Those land under
`private/humanitix/<exportId>/` and nothing derived from them may be summarised
into `lib/data/json/`. Three access codes reached a committed file on 2026-06-11
and needed a git history rewrite plus rotation; a leaked code cannot be
un-leaked by a later edit.

**`humanitix/export-optins.ts` writes a file of real names and addresses**, and
is the head of the consent chain rather than an archive pull. Dry run is its
default and `--write` writes, matching `email/import-optin-subscribers.ts`,
because every writing step of that chain is opt-in. It refuses any `--out-dir`
outside `tmp/` — `.gitignore` covers nothing else that would do, and it is not a
vault candidate either, because a vault stores verbatim payloads and this CSV is
a six-column projection. Its sibling `humanitix/check-optin-switch.ts` writes
nothing at all.

## Subsystem directories

| Directory | For | Entry point |
| --- | --- | --- |
| `assets/` | Moving image assets without breaking the ~1,400 references to them. `refs.ts` is the single definition of "a reference", shared with the CI gate so the two cannot drift; `event-assets.ts` decides which event owns a file and has its own adversarial test. | `plan-move.ts --scope events\|scraped` to generate a map, `apply-move.ts --plan <file>` (dry run; `--apply` to execute). |
| `lib/` | Shared helpers for scripts. | `destructive.ts` — the dry-run / host-confirmation gate the two database-wiping scripts go through. |
| `data/` | One-off corrections to `events-custom.json` / `shesharp_events_v3.json`, each carrying its finding id and its authority. | `json-format.ts` is the shared safe read/write; each fix script is its own entry point and is idempotent. |
| `deck/` | Building and checking `/present/<slug>` slide decks. | `new-deck.ts` to scaffold, `lint-deck.ts` for the organiser-readable report, `sync-registry.ts` to regenerate `registry.ts` + `index-meta.ts`. |
| `email/` | The outbound-mail pipeline behind the four email skills: audience inventory, recipient normalisation, render, gate, batch. | `render-message.ts` (spec → HTML), `build-batch.ts` (list → chunked JSON). `suppression.ts` is the do-not-contact register; its `pull-mailchimp` subcommand syncs new unsubscribes and cleaned addresses straight from the Mailchimp API rather than waiting for the next manual export — run it before any import. `probe-mailboxes.ts` answers which `@shesharp.org.nz` addresses exist — it found seven published ones that did not. Two scripts write **into** `newsletter_subscribers` and both are in the danger table above: `import-mailchimp-subscribers.ts` (the one-off 2026-08-29 carry-over) and `import-optin-subscribers.ts`, which takes a `normalize-recipients.ts --for-import` file and writes the rows that ticked a registration form's opt-in — consent route 2, the only one of routes 2–4 whose evidence is a column rather than a recollection. Its rules live in `optin-rows.ts` with no database attached so they can be tested; `optin-rows.test.ts` covers them. `content-lint.ts` is the pre-send copy check — see its own row below. |
| `events/` | The event lifecycle report, event poster generation (plate → the event's five layouts, or a per-speaker campaign set) and feedback tooling. | `event-status.ts` — offline, read-only, writes nothing: for each event it prints where the Slack channel, event record, artwork, deck, feedback code, announcement, attendee emails and photos have got to, and names the command or skill that fixes every gap (`--slug`, `--upcoming`, `--past [N]`, `--all`, `--json`; CI runs `event-status.test.ts`). Then `generate-poster-plate.ts` → `build-event-poster.ts` (`--speaker`/`--lineup` for the campaign set); design lives in `poster-formats.ts`, `poster-speaker-formats.ts` and `poster-type.ts`; `poster-speaker.test.ts` checks the layouts without a plate. |
| `humanitix/` | Reducing the gitignored ticketing vault to committed aggregates, and — since 2026-08-27 — reading the live account over the Public API. | `verify-export.ts` → `manifest.ts --append` → `build-archive.ts`. For the API: `fetch-api.ts` pulls events and tags on every run, with `--include orders,tickets,check-ins` for the rest (**see the note above the subsystem table — those two carry live access codes**); `api-counts.ts` is the scripts-only ticket-count reader, asking for `pageSize=1` and reading only the pagination envelope's `total`, so exactly one real ticket crosses the wire and the body is parsed with a reviver that drops it; `verify-live-events.ts` prints where the site's event records and the live listings disagree and **never edits**, with `--offline` for a run that needs no key; `orders-api.ts` is the scripts-only `/orders` reader whose required `keep` allowlist means an access code, a mobile and an address never enter the process; `export-optins.ts` turns one event's checkout ticks into the CSV `email/normalize-recipients.ts` already understands (**dry run by default, `tmp/` only** — see the note above); `check-optin-switch.ts` prints which upcoming events have the checkout opt-in switch off, enumerating from the live account rather than the site's records, and **exits 2 for a finding and 1 for a failure to run**, so "the API is down" never reads as "the switch is off". |
| `mailchimp/` | The same split for the audience export: addresses in the vault, counts in the repo — plus the Marketing API pull that answers what a CSV export structurally cannot. | `verify-export.ts` → `build-archive.ts`. For the API: `fetch-api.ts --export <YYYY-MM-DD>-api` pulls campaigns, reports and growth in tiers (`content`, `engagement`, `assets`, `templates`, `members`, `recipients`, `activity`), writing to the vault and, into the repo, nothing but a new append-only `exports[]` entry in `lib/data/json/mailchimp/manifest.json`; `fetch-assets.ts` then downloads the 677 gallery images (547 MB) that pull only inventoried, resumable — a file already on disk at its recorded byte size is skipped; `campaign-images.ts` builds the crosswalk from every image URL in every sent newsletter to the file this archive holds for it, fetches the 64 objects the gallery does not cover, and is the only thing that could have found the one image that is already lost — `manifest.ts --export <id>-api --assets` then records all 741 with their sha256, merging rather than rebuilding, because `--append` is the CSV builder and would overwrite the API entry with `files: []`; `build-campaigns.ts` regenerates the committed `campaigns.json` and `--check` immediately afterwards proves the build is deterministic; `recent-openers.ts` writes the ramp cohort to `tmp/` as `hashEmail()` digests only, intersected with the `subscribed` CSV before anything is serialised — a send-order filter, never a consent source. The one thing here that puts *content* into the repo rather than counts is `extract-archive.ts`, which sanitises all 179 sent bodies out of the vault into `lib/data/newsletter-archive/` — the hedge against the Mailchimp cancellation, since 51 newsletter cards on the site open a Mailchimp-hosted page and nothing documents whether those survive a downgrade. It reads `archive_html`, never `html`; `archive-html.ts` holds every sanitisation rule; `archive-index.ts` holds the card-to-campaign join; and `archive-guard.test.ts` re-checks the committed files on CI, because the vault is private and CI can never regenerate them. `withheld-images.ts` is the one AUTHORED file in that set: five images containing school-age children that must never be given a permanent URL, marked `data-mc-asset-withheld` so the re-host cannot select them. |
| `newsletter/` | Monthly newsletter: start an issue, photo strip, local preview, test send, approve. | `new-issue.ts <YYYY-MM>` writes the month's issue file from the repo alone — no API key, no `CRON_SECRET`, no network call — and refuses to overwrite an existing one without `--force`, because that file is hand-edited all month. It replaced a Vercel cron that drafted the copy with OpenAI, which was rewritten by hand every month. `preview.ts` for review, `approve.ts` to ship. The NZ Tech Pulse is a three-step loop with **no OpenAI key**: `pulse-candidates.ts <YYYY-MM>` fetches the month's sources and writes `tmp/newsletter/pulse-candidates-<issue>.json`; the AI agent running the skill writes the headlines and summaries into a draft JSON; `pulse-apply.ts <YYYY-MM>` re-runs every guard on that draft — url-must-be-one-we-fetched, `assertNumbersVerbatim`, the full house style — and REFUSES to write on violation, touching only `editorial.pulse`. Dry run by default; `--apply` writes. (These replaced `refresh-pulse.ts`, which called the model.) `lint-pulse.ts` is the Pulse's house-style checker — the counterpart of `deck/lint-deck.ts`, run after curating an issue by hand, since a hand-written headline breaks the style as easily as one an agent wrote; `--preflight` prints the feeds and where the writing and checking each happen. |
| `seo/` | Post-deploy on-page metadata crawl (~121 live requests). | `verify-page-metadata.ts --base <origin>`. |
| `slack-recommendations/` | Four-phase LinkedIn recommendation generator over Slack history. **Untracked — see gotchas.** | `01-discover.ts` → `02-build-context.ts` → `03-generate.ts` → `04-generate-invitations.ts`. |

## Before a newsletter goes out

| Script | Purpose | Status |
| --- | --- | --- |
| `email/content-lint.ts` | Reads an issue's subject line and every string in its file, and refuses the send on anything that reads as an unfinished draft: version and draft labels (`v0.2`, `DRAFT`, `rev2`, a trailing `- copy`), a month that disagrees with the issue's own id, placeholder text, Mailchimp merge tags (`*|FNAME|*`) the Resend path does not substitute, `{{ }}` / `${}` / `[INSERT …]` template variables, and dead, `example.com` or `localhost` links. `--issue <YYYY-MM>` (default: the newest issue), `--all`, `--file <path>` for an uncommitted draft, `--json`. Exits 1 on any error; warnings print and do not block. | Ongoing — CI gate. Written because two subject lines had already gone out wrong (`Newsletter - April 2026 v0.2` to 1,657 people on 2026-04-13, and a June issue saying "May 2026" on 2026-06-23) and nothing automated read either of them. `content-lint.test.ts` feeds it both, verbatim. |

## Loose top-level scripts

| Script | Purpose | Status |
| --- | --- | --- |
| `verify-image-paths.ts` | Three checks over `public/img/`: `--forward` (every referenced path resolves), `--reverse` (every file is referenced, allow-list in `KNOWN_UNREFERENCED`), `--ownership` (every event image belongs to an event). No flag runs all three. | Ongoing — CI gate. |
| `check-hackathon-facts.ts` | Asserts this repo still contains every shared fact the Q&A assistant repo also asserts. | Ongoing — CI gate; added 2026-08-04, event-scoped. |
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
- **`audit-event-images.ts` was deleted on 2026-08-19**, along with its
  `audit-report.json` output. Every heuristic in it assumed the flat
  `<event-slug>-<name>.ext` layout, so after the move to per-event folders it
  reported all 83 event images as "legacy named" and proposed 83 renames that
  would have undone the migration. Its orphan and broken-path checks are now in
  `verify-image-paths.ts`, over a much wider corpus. A tool that answers
  confidently and wrongly is worse than no tool.
- **`scripts/.cache/old-site-html/` is 17 MB of 88 scraped Webflow pages**,
  gitignored, and nothing in the tracked tree reads or writes it. The scraper
  that produced it is gone.
- **`collect-event-from-slack.py` + `requirements-slack.txt` are gitignored**
  (`.gitignore:85-86`) and superseded twice over: by the hosted `/event` Slack
  bot (`lib/slack-bot/`, `app/api/slack/events`) and by the
  `sync-event-from-slack` skill. `docs/development/SLACK_EVENT_EXTRACTION.md`
  keeps the Python path documented as a bulk-import fallback only.
- The `humanitix/` and `mailchimp/` scripts need the gitignored `/private/`
  vault. `--allow-missing-vault` exists on the two verify scripts and must be
  asked for — a verify that passes with nothing to verify is worse than none.

## What CI runs

`.github/workflows/verify.yml`, on pull requests to `main`:

| Job | Runs |
| --- | --- |
| `verify-image-paths` | `scripts/verify-image-paths.ts`, `scripts/newsletter/email-covers.ts --check`, `scripts/assets/event-assets.test.ts`, `scripts/check-hackathon-facts.ts`, `.claude/skills/sync-event-from-slack/scripts/state-lib.test.ts`, `.claude/skills/sync-event-from-slack/scripts/audit-read-state.ts`, `scripts/events/event-status.test.ts`, `lib/docs/playbook.test.ts`, `scripts/events/poster-assets.test.ts`, `lib/data/humanitix.test.ts`, `lib/data/mailchimp.test.ts`, `scripts/mailchimp/archive-guard.test.ts`, `scripts/email/content-lint.ts --all`, `scripts/email/content-lint.test.ts` |
| `typecheck-scripts` | `pnpm typecheck:scripts` — covers this directory and `.claude/`, which the root tsconfig skips |
| `typecheck` | `pnpm typecheck` |
| `lint` | `pnpm lint` (errors only) |
| `deck-checks` | `lib/deck/deck.test.ts` |

Nothing else here runs automatically. Run these locally before pushing:
`npx tsx lib/email/hardening.test.ts`, `npx tsx lib/deck/deck.test.ts`,
`npx tsx lib/data/sponsors.test.ts`, `for f in lib/newsletter/*.test.ts; do npx tsx "$f"; done`,
`npx tsx scripts/email/mailable.test.ts`, `npx tsx scripts/email/optin-rows.test.ts`,
`npx tsx scripts/deck/lint-deck.ts [slug]`, `npx tsx scripts/verify-image-paths.ts`,
`npx tsx scripts/mailchimp/verify-export.ts --export 2026-08-17` (needs the vault),
and `npx tsx scripts/seo/verify-page-metadata.ts --base http://localhost:3100`
against a running `next start` — kill any orphan server on the port first, or a
stale build makes fixes look broken.
