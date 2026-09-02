# Testing and CI

What runs, what does not, and which checks only ever run because somebody
remembers to. Split out of the root `CLAUDE.md` on 2026-09-01, which keeps only
the four facts that bind before any file is opened; everything else is here.

`docs/ARCHITECTURE.md` §8 gives the same CI steps as a table alongside the rest
of the architecture. This file is the one to change when a check moves.

---

## There is no test runner

Tests are plain `node:assert` scripts run directly with `npx tsx <file>`. Each
prints `ok - …` lines and exits non-zero on failure. There is no `describe`, no
watch mode and no coverage report, and adding a runner has never been worth the
dependency for a repo this shape.

Tests live **beside the code they cover** — `lib/deck/deck.test.ts`,
`lib/email/hardening.test.ts`, `lib/data/sponsors.test.ts` — not in a `tests/`
tree, and not under `scripts/` unless the thing under test is a script.

Test new work at each small milestone rather than at the end, and prefer the
minimum assertion that would actually catch the failure over one that restates
the implementation.

## What CI runs

`.github/workflows/verify.yml`, on PRs to `main`. **One job, `verify`**, whose
steps run in this order behind a single checkout and a single install:

| Step | Runs |
|---|---|
| `typecheck` | `pnpm typecheck` — `app/`, `components/`, `lib/`, `hooks/`, `types/`, `proxy.ts` |
| `typecheck-scripts` | `pnpm typecheck:scripts` — `scripts/` and `.claude/`, both skipped by the root tsconfig |
| `lint` | `pnpm lint` — ESLint 9 flat config. **Errors gate**; legacy violations are demoted to warnings in `eslint.config.mjs` and paid down separately |
| `deck-checks` | `lib/deck/deck.test.ts` — slide schema, the copy and rhythm linter, feedback codes |
| the offline checks | `scripts/verify-image-paths.ts` **and every other offline check** |

### Why one job and not five

It was five jobs until 2026-09-01, one per row above. Actions bills **each job
rounded up to the next whole minute**, and each job re-paid the same ~21s of
checkout, pnpm, Node and install: 105s of duplicated setup wrapped around 147s
of actual work, billing 8 minutes. As one job it measures 148–186s over five
runs — mean 173s, **mean billed 3.4 minutes**, straddling the 180-second
boundary, so do not quote a flat 3. `Verify` was 66% of this private repo's
entire Actions spend while the org sat about 30% over its 2,000-minute monthly
allowance — and exhausting that allowance stops `Deploy to Vercel` too.

The money side of all this — the plan, the per-workflow measurements, why
`deploy.yml` cannot get under four billed minutes, and the DNS record that must
survive — is `docs/deployment/GITHUB_ACTIONS_AND_ACCOUNT.md`.

**Do not split this back into a job per check.** Losing the five separate check
names cost nothing: the repo cannot use required status checks anyway (branch
protection needs a paid plan on a private repo), and the one thing five jobs did
give for free is bought back by `if: ${{ !cancelled() && steps.install.outcome
== 'success' }}` on every check step, so a failing typecheck no longer hides a
failing lint. The install is in that condition too, so a failed install skips
the checks rather than printing the same error 22 times.

**Adding a check that needs neither a database nor the network belongs as a step
in the `verify` job**, not in a second one. Those checks are pure data and ride
the shared checkout for free, which is why they were all put there: the newsletter
email-safe covers, the poster fonts (`scripts/events/fonts.test.ts`), event- and
poster-asset ownership, event status, the two docs-page checks, the hackathon
facts, the two Slack read-state checks, the event-announcement stages, the
marketing frequency cap, `scripts/mailchimp/archive-guard.test.ts`, the
Humanitix opt-in exporter's column contract and field allowlist
(`scripts/humanitix/optin-orders.test.ts`), and the Humanitix and Mailchimp
archive checks.

Those last two are **leak guards** as much as data checks — they fail the build
if an address, an IP or a code-shaped value reaches `lib/data/json/`.

## Not in CI — run these locally before pushing

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
npx tsx scripts/verify-storage-blocked.ts --base http://localhost:3100   # needs a running site AND a global Playwright
npx tsx scripts/humanitix/check-optin-switch.ts   # needs HUMANITIX_API_KEY
```

### Why `check-optin-switch.ts` is not in CI, and not in a hook either

It needs `HUMANITIX_API_KEY` and a live round-trip, and `verify.yml` is one
offline job with no secrets. There is no pre-push hook in this repo to wire it
into either — `.githooks/` holds only `install.sh` and a `pre-commit` secrets
grep — so it is documented rather than automated. **Run it when an event goes on
sale**, which is the only window in which the finding is still fixable.

Its exit codes deliberately diverge from `verify-live-events.ts`, which uses 1
for both "could not run" and "--strict found a problem". This one reserves **1
for "could not run" and uses 2 for a finding**, because the thing it finds is
silent: an unset opt-in switch collects nothing and reports nothing, so
"somebody else's API is down" must never produce the same exit code as "the
switch is off". Its offline half — the `/orders` field allowlist — is checked in
CI by `scripts/humanitix/optin-orders.test.ts`, and by `--self-test` for anyone
about to trust the live run.

### Why `verify-storage-blocked.ts` is not in CI, and cannot be

Two reasons, and either alone would be enough. It needs a **running site**, so
like `verify-page-metadata.ts` it tests a deployment rather than a diff. And it
needs a **real browser**, because the read it is about happens during hydration
— before anything a server-rendered HTML fetch can see. Playwright is
deliberately absent from `package.json`: adding it puts a ~500 MB browser
download into every install and every CI run, to serve a check that still could
not run there.

It is resolved at runtime instead — `PLAYWRIGHT_MODULE_PATH`, then the bare
specifier, then `npm root -g` — and says so in one sentence when it finds
nothing, rather than throwing.

Like `verify-page-metadata.ts`, it is only as honest as the build underneath it:
see "Clearing a stale build, on Windows, for real" above before believing a run
of it, and especially before believing that reverting something made it pass.

Run it against a local `next start` on port 3100, and **kill any orphan server
on the port first**, exactly as for `verify-page-metadata.ts`.

Its exit codes follow `check-optin-switch.ts`: **1 for "could not run", 2 for a
finding**. What it finds is invisible to everyone testing normally — the people
a blocked store breaks the site for are the only people who see it broken, and
they are not the people running this — so "no browser" and "the site is blank
for anyone with site data blocked" must never share an exit code.

### Why `check-facts.ts` is deliberately not in CI

It fetches the real source pages, and four of them are bot-walled or JS-only on
any given day, so as a gate it would be red on a good day — and a check that is
red on a good day is one people stop running. It exits non-zero **only** on a
dead URL or a number the fetched page contradicts; "could not be checked" and
"review due" are reported and exit 0.

Run it before a newsletter send.

### Why `verify-page-metadata.ts` is not in CI

It needs a running site and makes ~121 live requests, so it tests a deployment
rather than a diff. Run it after a deploy, or before a PR that touches metadata,
against a local `next start` on port 3100.

**Kill any orphan `next start` first — and on Windows, not by port.** A stale
server serves an OLD build, which makes a correct fix look broken and has cost
more than one afternoon. See the next section for what actually clears it: this
paragraph used to say "on the port", and that turned out not to be enough.

### Clearing a stale build, on Windows, for real

Both checks above run against a local `next start`, so both have this exposure.
On 2026-09-02 it caught **two people independently, on the same step**, and the
remedy this file had been prescribing was part of the reason.

Two failures the obvious commands hide:

- **Killing by port reports success while the server is still alive.** The port
  lookup finds no listener and you conclude it is gone.
- **`rm -rf .next` in Git Bash silently leaves files behind** that a running
  process holds. What you get is not a clean tree and not an error — it is a
  **half-replaced build**, where one function carries your change and another
  does not, and it will happily serve both.

What actually works, from PowerShell:

```powershell
Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
  Where-Object { $_.CommandLine -like '*next start*' } | Stop-Process -Force
Remove-Item "<repo>\.next" -Recurse -Force
Test-Path "<repo>\.next"          # must print False before you rebuild
```

Then rebuild, and **grep the built output for the change you are expecting**
before you trust the run:

```bash
grep -rho 'try{return localStorage.getItem' .next/static/chunks/*.js
```

That last step is the only self-verifying one. Every other step asks the machine
to confirm it did what you told it; the grep asks the artefact what it contains.
It is the same principle as `verify-storage-blocked.ts` asking the page whether
`localStorage.getItem` really throws before it judges anything.

**And it is always the same step that gets you: "I reverted the bug, and now it
passes."** That is the only move in the cycle where a stale artefact produces
the answer you were hoping for. A run that *fails* in the specific way you
predicted cannot be a leftover — so break-it evidence is safe, and restore-it
evidence is not. Re-verify the restore, or do not claim it.

### `verify-export.ts` needs the vault

`scripts/mailchimp/verify-export.ts` reads the raw Mailchimp CSVs, which carry
real addresses and opt-in IPs. CI has neither the files nor any business having
them, so this one can only ever be a local check. Since 2026-09-01 the vault is
not in this repo at all — `scripts/mailchimp/vault.ts` resolves
`MAILCHIMP_VAULT_DIR` first, then an in-repo `private/mailchimp/` if one exists,
then a sibling `she-sharp-slack-archive` checkout.

## The tests nobody was running

Audited 2026-09-01, because a teammate reached for a live database row to
exercise a branch that a committed test already covered. Of the **34** committed
`*.test.ts` files, **19** were not steps in `verify.yml`. Eleven of those are the
local list above and belong there — they want a database, a running site, the
private vault or the live web.

**Eight were in neither list.** Nothing ran them, on any machine, ever:

| File | What it decides |
|---|---|
| `scripts/email/mailable.test.ts` | `selectMailable()` — **who may be sent a marketing email** |
| `scripts/email/optin-rows.test.ts` | which rows a route-2 import may write into the consent record |
| `scripts/email/restrict-hashes.test.ts` | narrowing a recipients file by hash |
| `scripts/email/published-addresses.test.ts` | every address the site prints resolves to a real mailbox |
| `lib/email/events.test.ts` | delivery telemetry — **needs a database-shaped env; now in the local list, not CI** |
| `lib/email/newsletter-reviewers.test.ts` | the reviewer roster |
| `.claude/skills/monthly-newsletter/scripts/issue-ledger.test.ts` | the approval chain |
| `scripts/events/poster-speaker.test.ts` | poster layout — **and it was red** |

The first two are the rules this repository is most careful about, and they were
tested by files that gated nothing. **Seven are now steps in the `verify` job**;
the eighth, `lib/email/events.test.ts`, joins the local list above. They are
steps rather than a job for the reason given earlier: a step costs seconds, a
job costs a whole billed minute.

### Checking "does this run without secrets?" with `env -u` does not check it

The seven were first cleared by re-running them with every secret unset:

```bash
env -u POSTGRES_URL -u DATABASE_URL -u RESEND_API_KEY … npx tsx <file>   # WRONG
```

All eight passed, and one then failed in CI on `POSTGRES_URL environment
variable is not set`. **`lib/db/drizzle.ts` calls `dotenv.config()` itself**, so
it re-read `.env` off disk and put the variable straight back. The check
reported green for a condition it had never created — the same shape as the two
gates below, and as the marker-keyed checks that inherit an earlier pass's blind
spot.

What actually reproduces CI is removing the file:

```bash
mv .env .env.off && npx tsx <file>; mv .env.off .env
```

Under that, exactly one of the eight failed — the honest answer, and the reason
`events.test.ts` is a local check. Its assertions are pure, but importing
`lib/email/events.ts` pulls in `lib/db/drizzle.ts`, which throws at module load
without a connection string.

### The eighth: `poster-speaker.test.ts` was failing on `main`

```
not ok - the line-up carries a panel and refuses a crowd
    5 !== 4
```

It is **not** a layout limit and **not** bad data. `buildLineup()` in
`scripts/events/poster-speaker-formats.ts` places one portrait per person and
throws only below two people or when the faces would be smaller than a
thumbnail — there is no cap at four. The Les Mills roster the test builds from
grew from four speakers to five, the builder correctly laid out five, and the
assertion's hardcoded `4` went stale.

The property the check is *for* is "everyone on the roster gets a face, nobody
is silently cropped", which is `copy.length` and never drifts. It now asserts
that, the two `assert.throws` beside it are untouched, and the fix was verified
by breaking it — asserting `copy.length - 1` turns the step red. The test's own
header predicted this exact shape of failure — *"every one of these failures
arrives as a data change, not a code change"* — and it was right; it simply had
nowhere to report it.

**A committed test that nothing runs is worse than no test**: it reads as
coverage, and it rots without saying so. When adding one, add its step in the
same commit — and if it genuinely needs a database, a running site, the vault or
the network, add it to the local list above instead, with the reason. Those are
the only two homes.

## A guard is not verified until you have broken the thing it guards

Reading a guard and agreeing with it is not a test. Hand it the input it was
supposed to refuse.

Two were caught on 2026-08-30, both reading as correct and gating nothing:

- **`normalize-recipients.ts --for-import`** promised to drop rows with no
  marketing opt-in, and passed the whole file through when the opt-in column was
  **absent** — reporting `Excluded 0`, which reads as a clean file rather than
  as a check that never ran.
- **`--limit` on `recipients-from-db.ts`** looked like "the first N in order",
  but every row shares one `created_at` from a single import, so the order was
  whatever Postgres felt like and the ramp was not reproducible.

Both were found by handing the guard the input it was supposed to refuse, and
neither would have been found by reading.

A third, on 2026-09-01, was found the other way round — by a **person opening
their inbox**. Six newsletter confirmations left `noreply@shesharp.org.nz`
carrying `http://localhost:3000/newsletter/confirm` links, from an end-to-end
test against a local server holding the production Resend key. The batch path
had guarded loopback URLs since the 2026-03-19 incident; `sendEmail()`, the
single Resend call site and the one that sends the double opt-in confirmation,
had no guard at all. `lib/email/localhost-links.ts` is that guard, and its test
is built from the real message rather than a paraphrase of it — **a guard
written from a paraphrase stops the paraphrase.** Writing it also caught a bug
in the guard itself: the first regex refused `https://localhost.example/x`,
a perfectly ordinary host, which would have made the guard cause the harm it
exists to prevent.

The same failure has a sibling worth naming: **a check keyed on an annotation
inherits the annotating pass's blind spot** and exits 0. Key a check on the
independent source of truth, not on a marker some earlier pass wrote.

## Things that are not tests but behave like them

- **Run every step of a CI job locally, not only the one the job is named
  after.** `verify-image-paths` carries a dozen unrelated checks; running the
  image scan alone proves nothing about the other eleven.
- **Do not diff deck screenshots.** Two runs of the same build differ by around
  65%. Capture layout geometry with Playwright instead, and detect a mid-word
  break with `getClientRects().length > 1`.
- **Clear `.next` if you see phantom module errors** — a stale cache produces
  type errors for code that no longer exists. Clear `tmp/` before a local
  `CI=true npx next build`; stray files there break the build.
