# `scripts/`

Loaded when you read a file under `scripts/`. **`scripts/README.md` is the
index** — it lists every script, and its "DANGER — read before running" table
names the ones that wipe a database, mail a real list, or write live access
codes into the vault. Read that table before running anything here; this file
carries the conventions and the traps that are not about one particular script.

## How a script runs

Everything is run by hand with `npx tsx <file>` from the repo root. **Exactly
one is wired into `package.json`** (`pnpm db:seed-profiles`), so the rest are
found by reading `README.md`. There is no test runner: tests are plain
`node:assert` scripts run the same way, and they live **beside the code they
cover** in `lib/`, not here.

Scripts read **`.env`** — they use `import "dotenv/config"`, which does **not**
load `.env.local`. `.env.local` is the Next.js dev server's file. Both are
gitignored, and the difference is the reason a script can report a missing key
while `pnpm dev` works fine.

`lib/db/drizzle.ts` reads **`POSTGRES_URL`** through `dotenv.config()`, so on a
machine that has ever run `vercel env pull` the default target of every script
here is **production**.

```bash
pnpm db:generate      # Drizzle migration from schema changes
pnpm db:migrate       # apply migrations  (on pnpm 11: npx drizzle-kit migrate)
pnpm db:studio        # Drizzle Studio
pnpm db:seed          # seed sample data
```

## A script that builds a URL or sends mail

Use **`getBaseUrl()`** from `lib/email/service.ts`. Never inline
`process.env.BASE_URL || 'http://localhost:3000'` — duplicated fallback logic
put `localhost:3000` into 25 real mentor invitation emails on 2026-03-19. A
script must **require an explicit `BASE_URL`** and guard against localhost at
startup; `scripts/resend-mentor-invitations.ts` is the pattern.

Before any script that mails a list, the gate is
`.claude/skills/update-mailing-list/references/consent-rules.md`. Three tools
exist so nobody hand-rolls a worse one:

- `email/import-optin-subscribers.ts` is the **only** way to write consent
  route 2 (a registration-form opt-in). Dry-run by default, and `--apply` also
  demands `--event-unsubscribers-checked`, because Humanitix keeps a per-event
  unsubscriber list that no API and no export reaches.
- `email/normalize-recipients.ts --for-import` **refuses a file with no opt-in
  column**. Until 2026-08-30 it passed such a file through whole and reported
  `Excluded 0`, which reads as a clean file.
- `--restrict-to-hashes`, on both recipient builders, ramps by engagement rather
  than row order. It is a **send-order filter, never a consent route**, and can
  only ever remove rows.

Read the live mailable count from the **`Mailable after suppression`** line of
`npx tsx scripts/email/suppression.ts reconcile` — never from prose. That
command prints four lines and the first, `Subscribed rows`, is the count
*before* `selectMailable()` strips the two registers.

## Moving an image is a tooling job, not a `git mv`

**2,506** references across **54** files point into the site image tree, and they
are not all where you would look for them: `scripts/`, `docs/`, `.claude/` skill
instructions, and the generated `index.ts` manifests that sit *inside* the asset
tree.

**Three different numbers describe this, and they are not interchangeable.**
Measured 2026-09-01 through the repo's own `collectReferences()`:

| | | what it is |
|---:|---|---|
| **2,506** | occurrences | every place a path is spelled — what a move has to rewrite |
| **1,647** | distinct paths | the same images, deduplicated |
| **1,621** | what the gate checks | 1,647 minus the paths whose only references are `isForwardExempt` (test fixtures asserting behaviour for paths that do not exist) |

`verify-image-paths.ts` prints the last of these, so do not read its forward-pass
figure as a reference count. The "~1,400 references across 37 files" this
paragraph carried until 2026-09-01 was simply stale.

Use `scripts/assets/plan-move.ts` then `apply-move.ts`, and let
`scripts/verify-image-paths.ts` confirm it — it checks that every reference
resolves, that every file is referenced, and that the events layout holds.

`scripts/assets/refs.ts` is the **single definition of "an image reference"**,
imported by both the gate and the mover so they cannot drift. Its `SCAN_ROOTS`
deliberately covers `public` with `.ts` only, because those generated manifests
are the sole reference for ~143 images. Do not widen the corpus casually; do not
narrow it at all — and do **not** re-add the `report` root that was dropped when
the Typst projects left for `NZ-SheSharp/she-sharp-reports` on 2026-09-01.

## The working directories are gitignored, not invisible

They are gitignored — so `git ls-files` and `git status` never mention them —
but Grep, Glob and `find` read them exactly like source. **Nothing under these
paths is ever a source of truth.** Do not cite one, edit one, or infer current
behaviour from one. Four of the five were moved out of the tree on 2026-09-01
pending sign-off of the restructure; every tool that writes them is still here,
so treat the list as live rather than historical.

| Path | Written by | Holds |
|---|---|---|
| `tmp/` | `scripts/email/*`, `scripts/events/*`, `scripts/*/propose-crosswalk.ts`, `build-event-archive.mts`, and four email/poster skills | `emails/`, `specs/`, `plates/`, `poster-review/`, `humanitix/`, `mailchimp/`, `event-archive-harvest/` |
| `.cache/` | `sync-event-from-slack`, `reply-to-contact-messages` | Slack channel dumps, `triage.json`, `contact-notifications.json`, plus dead 2026-04 audit leftovers |
| `scripts/.cache/` | the old-site scrape | cached Webflow HTML; nothing tracked reads it any more |
| `.recommendations/` | `scripts/slack-recommendations/` (itself gitignored, though present on disk) | generated LinkedIn recommendations, named after real people |
| `.playwright-cli/` | browser automation | session scratch |

The trap is concrete: `.cache/` accumulated April-2026 files named
`events-custom-final.json`, `final-with-all-updates.json`, `current.json` and
`planned.json`, **none of which was ever the live event data**, and `tmp/` holds
loose `.ts` that reads as real source — a stray `build-hackathon-digest.ts` there
was compiled locally and invisible to CI until `tsconfig.json` excluded the
directory on 2026-09-01.

`tmp/` is a **contract**, not litter — those exact paths appear in skill
instructions and script defaults, so do not relocate or rename it. Do clear it
before a local `CI=true npx next build`: stray files under `tmp/` break the
build.

**A vault stores verbatim payloads, never mapped objects.** A sha256 over a
mapped object proves what the mapper kept, not what the API said —
`getGrowthHistory` was written from Mailchimp's documentation, `us3` sends the
three documented fields as hard zero, and the vault held 86 months of zeroes
under a valid checksum. `scripts/mailchimp/manifest.ts --append` is the **CSV**
builder and refuses an API vault, but only because it overwrote one once.

Separately, the **vault** holds the raw Humanitix and Mailchimp exports: real
names, addresses, opt-in IPs and live access codes. Read it only when a task
requires it, and **never copy its contents into `lib/data/json/`** — CI has leak
guards for exactly that.

It no longer lives in this repo. `private/` was deleted on 2026-09-01 because
400 of its 401 files were byte-identical to the private `she-sharp-slack-archive`
repo and the 401st is now committed there, so a 37 MB cache was buying nothing.
`scripts/{humanitix,mailchimp}/vault.ts` now resolve, in order: an explicit
`MAILCHIMP_VAULT_DIR` / `HUMANITIX_VAULT_DIR`, then an in-repo `private/<platform>/`
if somebody has one, then a **sibling `she-sharp-slack-archive` checkout**. Raw
API pulls are written to the archive repo, never here.

## Before you push

Run these locally — they are not in CI. The full list, and why `check-facts.ts`
is deliberately excluded, is in `docs/development/TESTING.md`.

```bash
npx tsx lib/email/hardening.test.ts       # unsubscribe tokens, senders, gates, Svix
npx tsx lib/email/events.test.ts          # delivery telemetry — needs POSTGRES_URL to LOAD, not to run
npx tsx lib/deck/deck.test.ts             # slide schema, copy + rhythm, feedback codes
npx tsx lib/data/sponsors.test.ts         # sponsor registry
for f in lib/newsletter/*.test.ts; do npx tsx "$f"; done
npx tsx scripts/newsletter/check-facts.test.ts   # the fact-pool check itself (no network)
npx tsx scripts/newsletter/check-facts.ts        # the fact pool, against live sources
npx tsx scripts/deck/lint-deck.ts [slug]  # organiser-readable deck report
npx tsx scripts/verify-image-paths.ts
npx tsx scripts/mailchimp/verify-export.ts --export 2026-08-17   # needs the vault
npx tsx scripts/seo/verify-page-metadata.ts --base http://localhost:3100
```

**A guard is not verified until you have broken the thing it guards.** Reading
one and agreeing with it is not a test — hand it the input it was supposed to
refuse. Two gates here read as correct and gated nothing until 2026-08-30, and
`--limit` on `recipients-from-db.ts` looked like "the first N in order" when
every row shares one `created_at` from a single import, so the order was
whatever Postgres felt like and the ramp was not reproducible.

A scratch script that contains a regular expression should be written with the
Write tool, not a heredoc: `cat <<'EOF'` collapses one backslash level, so the
pattern silently matches nothing and reports a false all-clear.
