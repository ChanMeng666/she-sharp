# Maintainer handover

Written **2026-09-05** by the outgoing sole maintainer of this repository and of
the production deployment behind `https://www.shesharp.org.nz`.

This is not a tour of the code — `docs/ARCHITECTURE.md` is that, and the layered
`CLAUDE.md` files are the rules. This document exists to answer one question:
**what stops working, silently, when the person who built this stops answering
messages.** Everything below is either an access fact, a scheduled job nobody
watches, a recurring human obligation, or an open loop that belongs to the
organisation rather than to a developer.

Read it with `docs/README.md` open. Where a subject already has a document, this
file points at it rather than restating it; a duplicated rule is a rule that will
disagree with itself within a year.

> **This file carries no credential values, and must not gain any.** It records
> *where* a secret lives and *who* should hold it. The values are in Vercel and in
> the accounts themselves.

---

## 1. The first week

In priority order. Items 1–3 are the ones that make the difference between a
maintained site and a site that merely keeps running until something changes.

1. **Name a maintainer.** Not a committee, not "the website team" — one person
   with the Vercel login and the ability to merge to `main`. Everything in §5 is
   a recurring obligation with a date attached, and an unassigned obligation is
   an unmet one.
2. **Rotate the shared account passwords**, because a leaving maintainer had them.
   The list is §3, "Rotate on departure". This is routine offboarding hygiene and
   implies nothing about anybody; do it for every departure, not just this one.
3. **Read §12 before anything else if you are reading this in the first week
   after 2026-09-06.** Two live credentials were found in this repository's git
   history and rotated on that date. The section says what is still owed.
4. Read §7. Three decisions are recorded as *made and not done*, and each one
   needs a founder-console action nobody else can take.
5. Work through §6 before touching anything. Each rule there is attached to a
   dated incident that cost real money, real inboxes, or a history rewrite.

Two items that were the top of this list on 2026-09-05 are **done**, and are kept
in §10 and §11 as the record of how, because both turned out to be traps rather
than chores:

- **The production database has been moved off a personal account** into the
  organisation's own Neon organisation (§10). Neon refuses to *transfer* a project
  out of a Vercel-managed org, so it had to be a copy.
- **Cloudinary is gone** (§11) — code, data, configuration and credentials. It had
  been assumed dead and was in fact taking every profile photo and CV upload.

---

## 2. What the maintainer actually needs

Access, in the order it is needed:

| # | Access | Why it is not optional |
|---|---|---|
| 1 | **Vercel** — team `she-sharp1`, project `she-sharp`, signed in as `shesharpnz` | Deploys, environment variables, logs, the three crons, Blob storage. Nothing ships without it |
| 2 | **GitHub** — write on `NZ-SheSharp/she-sharp` | `main` is the deploy trigger |
| 3 | **The `website@shesharp.org.nz` Google account** | It is the login for Resend, and the Reply-To identity for the `internal` mail stream. See the warning in §3 |
| 4 | **Stripe dashboard** | Live payments. Confirm `STRIPE_MODE` in production before assuming which key set is in use |
| 5 | **Neon** | Migrations, and the only copy of the mailing-list consent record |
| 6 | **Slack** — workspace member, plus the app-management pages for the four apps in §3 | The bots post nowhere else |

A maintainer who has 1 and 2 can keep the site alive. One who has all six can
actually operate it.

---

## 3. Accounts and services

`.env.example` is the authoritative explanation of every environment variable —
what it does, and the incident that produced the comment above it. The
authoritative *list* is `npx vercel env ls production` (**46** variables as at
2026-09-06, down from 66 that morning — see §10.1 and §11), not this table and not `.env.example`, which documents local
tooling variables that production does not have.

| Service | What breaks without it | Held under | Handover action |
|---|---|---|---|
| **Vercel** | Everything | `shesharpnz`, team `she-sharp1`, Pro | Rotate on departure |
| **GitHub org** `NZ-SheSharp` | Deploys, the `/event` Slack bot's PRs | Org | Remove the departing member; the bot's PAT (`GITHUB_BOT_TOKEN`) is issued against a person and must be reissued |
| **Neon (PostgreSQL)** | The whole dashboard, applications, donations, the subscriber list | **The organisation.** Project `she-sharp-production` (`lively-night-18220962`) in the native Neon org "She Sharp", under `website@shesharp.org.nz`. Moved 2026-09-06 | The superseded personal project is kept read-only until **2026-09-20**, then deleted by its owner. **§10** |
| **Stripe** | Donations and membership payments | She Sharp | Rotate keys on departure; re-point the webhook only if the domain changes |
| **Resend** | All outbound mail — transactional *and* the newsletter | Signed in via `website@shesharp.org.nz` | Rotate that Google password, then the API key |
| ~~Cloudinary~~ | Nothing — **removed 2026-09-06**. Uploads now go to the organisation's Vercel Blob store | — | None. Kept as a row so nobody re-adds it without reading **§11** |
| **OpenAI** | The visitor chatbot and mentor matching | `website@shesharp.org.nz` — organisation-owned, verified 2026-09-05 | Nothing. Rotate the API key on departure like any other |
| **Vercel Blob** | The impact-report PDFs and the event videos `/resources` links | Same Vercel team | Nothing, but read the immutability rule in §6 |
| **Vercel KV / Redis** | Chatbot rate limiting | Same Vercel team | Nothing |
| **Humanitix** | Ticketing, and the "Sold out" badge on event pages | `events@shesharp.org.nz` | The API key is read-only and also set in production |
| **Mailchimp** | Nothing live — archive only since 2026-09-02 | Shared account | See §7; the API key expires **2027-08-27** |
| **Slack apps** (4) | Contact-form alerts, donation alerts, the weekly mentorship digest, the `/event` bot | She Sharp workspace | Tokens live in Vercel; the apps survive a person leaving, the tokens' *scopes* were granted by one |
| **Domain** `shesharp.org.nz` | The site, and DKIM/DMARC alignment for every email | Transferred 2026-06-18 | Confirm the registrar login is org-held. Do not delete the `_gh-…` TXT record — `docs/deployment/GITHUB_ACTIONS_AND_ACCOUNT.md` says what it is for |

**Rotate on departure:** Vercel, the `website@` Google account, Stripe API keys,
Resend API key, `GITHUB_BOT_TOKEN`, `CRON_SECRET`, and the Slack bot tokens.
`AUTH_SECRET` / `NEXTAUTH_SECRET` rotation signs every existing user out — do it
deliberately, not as part of a sweep. **Both were rotated on 2026-09-06** because
the previous value was found in this repository's git history (§12); rotating
them now also invalidates outstanding mentee payment links, not just sessions.

**One warning that is bigger than a password.** The `website@shesharp.org.nz`
account reaches the mailbox, the legacy Webflow back end, *and* Resend, which
sends to the mailing list. One credential, three systems, one of which can mail
1,500 people from a domain they trust. When rotating it, rotate it as the highest
item on the list, not the third.

---

## 4. What runs without anyone pressing anything

Three Vercel crons (`vercel.json`), all protected by `CRON_SECRET`:

| Path | Schedule (UTC) | Posts to | If it dies |
|---|---|---|---|
| `/api/cron/weekly-mentorship-stats` | Sun 20:00 | `#mentorships` | Silence. Nobody is paged |
| `/api/cron/weekly-funding-crawl` | Sun 21:00 | `#funding-opportunities` | Silence, and the funding digest is the one output a committee member notices missing |
| `/api/cron/event-feedback-digest` | daily 21:00 | the feedback channel | Silence |

**All three fail silently.** They post on success and say nothing on failure, so
the only signal is an absence, on a Monday, in a channel nobody owns. Two
historical causes are already documented and will recur: the Neon
connection-burst limit under parallel queries, and the 60-second default
`maxDuration` (the 2026-05-24 funding crawl timed out on it; these routes need
`maxDuration = 300`).

Also unattended: the **Resend webhook** at `/api/webhooks/resend`, which is the
only thing recording bounces and spam complaints. If its signing secret is
rotated in one place and not the other, complaints stop being recorded and
nothing anywhere says so.

GitHub Actions: `verify.yml` (one job, deliberately — read
`docs/deployment/GITHUB_ACTIONS_AND_ACCOUNT.md` before adding a second),
`deploy.yml`, `slack-triage.yml`. The org is on GitHub Free with 2,000
private-repo Actions minutes per month, billed **per job rounded up to the
minute**.

**`main` has no branch protection, and `verify.yml` runs only on pull requests.**
A commit pushed straight to `main` therefore skips every check and deploys itself
to production. This is not hypothetical: `647ae0b6` ("Add registration link for
Xero event") went in that way at 23:04 on 2026-09-05, by a second contributor. It
happened to be one safe line of JSON. Whoever takes this over should decide
whether to require a passing `verify` before merge — the workflow already exists,
it is simply not enforced.

---

## 5. The obligations that are human, not technical

These are the parts that do not survive a maintainer change on their own,
because no script enforces them.

**Consent, before any email reaches a list.** The `newsletter_subscribers` table
is the *only* marketing-consent record the organisation has, since the Resend
Marketing objects were deleted on 2026-08-29. Only `status = 'subscribed'` is
mailable, and a row only reaches that status by double opt-in. Registering for an
event, donating, applying, or writing in **is not subscribing**. The binding text
is `.claude/skills/update-mailing-list/references/consent-rules.md`; every sending
skill defers to it. Marketing sends are capped at **three per calendar month**,
counted across every skill including the newsletter. Read the live subscriber
count from `npx tsx scripts/email/suppression.ts reconcile`, never from prose —
including the prose in this repository.

**Photographs of children.** `docs/development/PHOTOGRAPHING_MINORS.md`. Screening
happens at selection, because `/img/*` is cached immutably for a year and the
public album lives outside this repository: removing a published frame is a code
change *plus* an album edit. Consent is still not collected at registration.

**The newsletter loop and the event loop** each have a skill and a runbook —
`.claude/skills/`, and `docs/development/EVENT_LIFECYCLE_SOP.md`. They are written
for a non-technical operator on purpose (`docs/development/AI_SKILLS_GUIDE.md`);
that was the succession plan, and it only works if somebody is actually pointed at
it.

**Approval.** A broadcast to the list is the founder's call, not the developer's.
That has been the working arrangement throughout and should be stated to whoever
takes over, because the tooling will happily send without asking.

---

## 6. Rules that already cost something

Do not treat these as style. Each has a date attached because each was learned the
expensive way. They are stated in full in the `CLAUDE.md` files; the point of
listing them here is that a new maintainer meets them *before* the first change,
not during the first incident.

- **`proxy.ts` is the middleware**, not `middleware.ts`, and it checks only that a
  session cookie *exists*. It is not an authorisation boundary. The real checks
  are the dashboard layout and `withRoles()`.
- **`requiredAdminPermissions` is default-GRANT.** A missing `admin_permissions`
  row means *all* permissions. A route needing default-deny checks inline.
- **All user-facing URLs come from `getBaseUrl()`.** Inlined fallbacks put
  `localhost:3000` into 25 real mentor invitation emails (2026-03-19) and six
  newsletter confirmations (2026-09-01).
- **Vercel environment variables: use `--value`, never stdin.** Piping can store an
  empty string silently, and `echo` appends a newline. A new variable also needs a
  new commit — there is no Vercel Git connection, and "Redeploy" reuses the old
  environment. → `docs/deployment/VERCEL_ENV_VARIABLES_GUIDE.md`
- **Blob assets are immutable for a year.** Replacing one means a new filename and
  a new constant in `lib/config/assets.ts`, never an overwrite.
- **Moving an image is a tooling job**, not a `git mv` — roughly 1,400 references
  across 37 files. Use `scripts/assets/plan-move.ts`, `apply-move.ts`, then
  `scripts/verify-image-paths.ts`.
- **Never publish an access, promo or discount code** in event JSON or on a page.
  The 2026-06-11 hackathon page leaked registration codes and needed a history
  rewrite plus rotation.
- **A guard is not verified until you have broken the thing it guards.** On
  2026-08-30 two gates read as correct and gated nothing.
- **pnpm 10 is pinned**; on pnpm 11 use `npx drizzle-kit migrate`, not
  `pnpm db:migrate`. Build with `CI=true npx next build`, and clear `tmp/` first.

---

## 7. Open loops handed back

None of these is a code task. Each needs a decision or a console action from
someone with authority the developer never had.

| Item | State as at 2026-09-05 |
|---|---|
| **Membership and mentorship pricing** | The `$100 NZD/year` figure originated from a reference site supplied at the 2025-11-07 meeting. Final pricing documentation was requested repeatedly from January to June 2026 and never supplied, which is why the payment gateway was disabled. The figure was removed from all three surfaces on 2026-09-05 (PR #275) rather than gated, so re-opening applications cannot silently restore it. **A price must be decided and documented before membership can re-open** |
| **Mentorship applications** | Paused since 2026-06-19. The public Sign In entry was hidden site-wide on 2026-09-05 behind `PUBLIC_SIGN_IN_ENTRY_ENABLED`; flipping it to `true` is the whole revert. Existing members can still sign in by URL. The wider question — closing the mentorship landing page, the newsletter copy and the chatbot knowledge base — was deferred to the Thursday meeting and **is unresolved**. Runbook: `docs/development/MENTORSHIP_APPLICATIONS_PAUSED.md` |
| **Humanitix → Mailchimp contact integration** | **Decided and not done.** It wrote 752 non-opted-in ticket buyers into the mailing list. Still connected and still writing. Only the founder's console can switch it off. → `docs/deployment/HUMANITIX_INTEGRATION_SHUTDOWN.md` |
| **Mailchimp subscription** | **Decided and not done.** Archive-only since 2026-09-02; the account is still paid and still live. Pause or downgrade — **never delete**. → `docs/deployment/MAILCHIMP_CANCELLATION.md` |
| **Second Humanitix opt-in harvest** | Owed after the 2026-09-03 event closed. The first pass wrote 9 rows |
| **Slack for Nonprofits** | Brief prepared 2026-09-01, **not submitted**: `my.slack.com/nonprofit` is workspace-owner-only and the founder is the sole owner |
| **GitHub for Nonprofits** | Submitted 2026-09-01, status *Applied*. Seats are for volunteers, not beneficiaries |
| **Mailbox ownership** | A 2026-08 delivery probe found seven of the eleven addresses published on the website did not exist. → `docs/deployment/WORKSPACE_MAILBOX_CHECKLIST.md` |
| **Credential hygiene** | A worked list of credentials that appeared in plain text in Slack, and of personal data now sitting in exports, exists **outside this repository** — see §8. It should be re-created for, or handed to, the committee. Nothing on it has been fixed |

---

## 8. What is *not* in this handover

**The Slack archive repository is personal and is not being transferred.**
`ChanMeng666/she-sharp-slack-archive` holds the verbatim Slack transcripts, the
raw Humanitix and Mailchimp export vaults, the decisions and findings files, and
the credential work list referred to in §7. It was created and maintained
personally, on a personal account, and the other three She Sharp repositories are
on the organisation. That asymmetry has been recorded before and is worth the
committee's attention independently of any handover.

Practical consequences for whoever takes over:

- `scripts/humanitix/vault.ts` and `scripts/mailchimp/vault.ts` fall back to a
  sibling `she-sharp-slack-archive` checkout, and `MAILCHIMP_VAULT_DIR` /
  `HUMANITIX_VAULT_DIR` / `SLACK_ARCHIVE_DIR` point at it. **Without that
  checkout these scripts cannot run.** They are local reporting tooling only —
  nothing the website serves depends on them, and a fresh clone deploys fine.
- To restore that capability, take fresh exports from the Humanitix and Mailchimp
  consoles. Both are re-exportable by anyone with the account. Note the standing
  rule: raw exports never go into `lib/data/json/`, and CI has leak guards for
  exactly that.
- The `sync-event-from-slack` skill still works — it reads Slack directly and
  needs only a token. Refreshing the archive is not a step of syncing an event.

Also not transferred: personal development machines, personal API keys used for
local tooling, and any account registered to a personal address rather than an
`@shesharp.org.nz` one. If §3 leaves an owner "unconfirmed", assume it needs
checking rather than assuming it is fine.

---

## 9. Reading order for whoever is next

1. `CLAUDE.md` in the repository root — the rules that bind before any file is
   opened, and the index to the eight directory-level files.
2. `docs/ARCHITECTURE.md`, especially §7, the subsystem map.
3. `docs/README.md` — every document, with an honest status column.
4. This file, §4 through §7.
5. `docs/development/TESTING.md` — there is no test runner; checks are plain
   `node:assert` scripts, and CI is one job on purpose.
6. `docs/development/AI_SKILLS_GUIDE.md` — because most of the recurring work was
   deliberately packaged for a non-technical operator, and that only pays off if
   somebody is told it exists.

If only one thing from this document survives: **§1.3, the database ownership.**
Everything else can be rebuilt from the repository. That cannot.

---

## 10. Moving the database off a personal account

> **Done, 2026-09-06.** Production now runs on `she-sharp-production`
> (`lively-night-18220962`) in the **native** Neon organisation "She Sharp",
> owned by `website@shesharp.org.nz`. Downtime was 5 minutes 40 seconds at
> 01:11 NZ on a Sunday. What follows is kept as the record of why it had to be a
> copy rather than a transfer, and as the runbook if it is ever done again.
> The outcome, and what was left behind, is in §10.1.

Investigated in the Neon and Vercel consoles on **2026-09-05**. Recorded in full
because the obvious approach does not work, and the next person will otherwise
spend the same hour discovering that.

### What is actually true

- The production database is Neon project **`she-sharp-database`**, id
  `red-silence-55665683`, PostgreSQL 17, **18 MB**, 40 tables across the `public`
  and `drizzle` schemas.
- It sits in the Neon organisation **"Vercel: Chan Meng's projects"**
  (`org-morning-grass-23249597`) — a *Vercel-managed* org, created by the Neon
  Postgres marketplace integration on a **personal Vercel account**.
- **The Vercel team `she-sharp1` has no Neon store at all.** Its only marketplace
  resource is `upstash-kv-cerise-leaf` (Redis). The organisation's Vercel project
  reaches the database purely through connection strings pasted in as ordinary
  environment variables. Nothing on the organisation's side owns the database.
- `website@shesharp.org.nz` already has a **native** Neon organisation, "She
  Sharp" (`org-dark-moon-42071634`, Free), containing an empty project
  `she-sharp` in AWS Sydney.

### Why "just transfer it" does not work

Neon project settings do have a Transfer section — "Move this project to another
organization you belong to. Transfers are instant, with no downtime. Or, create a
claim link so another Neon account can take ownership." **The button is disabled**,
with the tooltip:

> Project transfers are not currently supported for Vercel-managed organizations

The claim-link route is part of the same disabled control, so it is not an escape
hatch. The Vercel-managed org has no unlink option either — its settings page
says only "To manage your Neon subscription, go to the Neon Postgres integration
in Vercel". **The database has to be copied to a new project. There is no
ownership transfer available.**

### Choosing the destination

|  | A — native org "She Sharp" | B — a Neon store created from `she-sharp1` |
|---|---|---|
| Owner | `website@shesharp.org.nz` directly | The `shesharpnz` Vercel account |
| Env vars | Set by hand, once | Injected and maintained by the integration |
| Billing | Neon, separately | Through Vercel |
| Later portability | Transferable — it is a native org | **Not** transferable, same trap again |

**Prefer A.** It is the only option that does not recreate the exact restriction
this section exists because of, and the empty project is already sitting there.
Take B only if the organisation would rather have one bill and no hand-managed
connection strings, and accepts that a future move means another copy.

### The migration

18 MB restores in seconds. The window is not the copy — it is the deploy that
picks up the new connection strings. Do it outside an event.

1. **Freeze writes.** `MAINTENANCE_MODE=true` (`docs/deployment/MAINTENANCE_MODE.md`)
   serves a 503 for the whole site, `/f/*` included, so no form, donation or
   subscription lands mid-copy.
2. **Dump** from the old project: `pg_dump --no-owner --no-acl -Fc` against
   `DATABASE_URL_UNPOOLED`. Keep this file — it is also the pre-migration backup.
3. **Restore** into the destination project with `pg_restore --no-owner --no-acl`.
   Neon's own "Import data" button on the project list does the same thing from a
   source connection string and is fine for a database this size.
4. **Verify before cutting over.** Row counts must match on at least
   `newsletter_subscribers` (1,560 as at 2026-09-05), `email_events` (3,183),
   `users` (43), and the donations table. A short row count is a failed migration,
   not a rounding difference.
5. **Replace the connection variables on Vercel** — `DATABASE_URL`,
   `DATABASE_URL_UNPOOLED`, `NEON_PROJECT_ID`, and the `PG*` / `POSTGRES_*` set.
   Use `--value`, never stdin, and verify each one; §6 says why.
   **`NEXT_PUBLIC_STACK_*` and `STACK_SECRET_SERVER_KEY` are dead** — nothing in
   `app/`, `lib/` or `components/` imports Stack Auth. Do not carry them across;
   delete them.
6. **Deploy through GitHub Actions, not from a workstation.** "Redeploy" in the
   Vercel dashboard reuses the old environment, so it would come back up pointing
   at the old database. And `vercel deploy --prod` from a workstation fails with
   **`Not authorized`** — that command asks Vercel to build remotely, which this
   account cannot do. Every deploy this project has ever made went through
   `.github/workflows/deploy.yml`, which builds in the runner (`vercel build`)
   and uploads the artefacts (`vercel deploy --prebuilt`). Since 2026-09-06 that
   workflow also accepts `workflow_dispatch`, so an environment-only change can
   be shipped with `gh workflow run deploy.yml` instead of an invented commit.
7. **Check, then unfreeze.** Sign in, load the dashboard, submit the contact form,
   and confirm the Slack notification arrives. Then `MAINTENANCE_MODE=false`.
8. **Leave the old project in place, read-only, for a fortnight.** Do not delete
   it on the day. If anything was missed, it is still there; after two weeks it is
   the personal account's to remove.

### 10.1 What actually happened, and what is still owed

Kept because the differences between the plan above and the event are the parts
worth knowing.

- **The destination was rebuilt to match the source.** A `she-sharp` project
  already existed in the She Sharp org on **Postgres 18**, against a source on
  **17.11**. A migration whose purpose is ownership should not also be a major
  version upgrade — if anything then misbehaves, there is no way to tell which
  change caused it. `she-sharp-production` was created instead on **PG 17, AWS
  Asia Pacific 2 (Sydney)**, matching the source region and version exactly. The
  empty PG 18 project `young-field-21803911` is still there and can be deleted.
  Upgrading to 18 remains available as a separate, deliberate change.
- **Only `POSTGRES_URL` ever mattered.** `lib/db/drizzle.ts` connects with it;
  `DATABASE_URL` is read only by `drizzle.config.ts` for migrations. The other
  **fourteen** `PG*` / `POSTGRES_*` / `NEON_PROJECT_ID` variables were injected by
  the old Vercel–Neon integration and **no code reads any of them** — verified by
  grep over `app/`, `lib/`, `components/`, `hooks/`, `types/`, `scripts/` and
  `.claude/`, hidden directories included. They were deleted after the cutover
  was verified, together with three dead `STACK_*` variables (nothing imports
  Stack Auth). Production went from **66 environment variables to 48**, and every
  survivor has a reader. Two of the deleted ones — `DATABASE_URL_UNPOOLED` and
  `POSTGRES_URL_NON_POOLING` — still pointed at the decommissioned database,
  which is worse than useless: a script picking one up would have talked to a
  dead copy and reported success.
- **The verification that counts was a row-count census, not a glance.** Exact
  `count(*)` per table and `last_value` per sequence, taken on the frozen source
  and again on the restored destination: **41 tables, 37 sequences, identical**,
  plus 33 enums / 152 indexes / 120 constraints and a real three-table join
  returning the same 26 rows. The pre-freeze and post-freeze censuses were also
  identical, which is how we know nothing was written and lost while the baseline
  was being taken.
- **Which database production is actually using was proved, not assumed.** Both
  copies hold identical data, so a working page proves nothing. After the
  cutover, `GET /api/mentors` was called and `pg_stat_activity` checked on both:
  a live `postgres.js` session on the new project, **none** on the old.
- **Still owed:** the old project `she-sharp-database` (`red-silence-55665683`)
  is untouched and is the rollback path until **2026-09-20**. After that it is
  the personal account's to delete. Until it is gone, the personal Vercel account
  still carries the organisation's data.

---

## 11. Cloudinary is still live

Checked on 2026-09-05, because it had been assumed that everything had moved to
Vercel Blob. **It has not.** Recording the check so the assumption is not made
again.

- **Vercel Blob is used only by scripts** — `scripts/newsletter/photos.ts` and
  `scripts/mailchimp/rehost-archive-images.ts`. It has never handled user uploads.
- **Cloudinary handles every user upload**, through `/api/upload/photo` and
  `/api/upload/cv` (`lib/cloudinary/config.ts`). Those routes are called by
  `components/forms/photo-upload.tsx` and `cv-upload.tsx`, which are rendered by
  six pages — three public application forms *and* three dashboard pages
  (`account`, `mentor-profile`, `mentee-profile`).
- The dashboard pages are **still reachable**. Hiding the public Sign In entry on
  2026-09-05 hid a link, not a route; existing members sign in by URL. An existing
  mentor who changes their profile photo today uploads to a personal Cloudinary
  account.
- **41 rows in the production database hold `res.cloudinary.com` URLs**:
  `mentor_profiles.photo_url` 9, `mentee_profiles.photo_url` 10,
  `mentor_form_submissions.photo_url` 9, `mentee_form_submissions.photo_url` 11,
  `volunteer_form_submissions.cv_url` 2. If that account is closed, those images
  and CVs 404 in the dashboard.

> **Done, 2026-09-06** (#279, #280). Option 1 below was taken. Both routes write
> to Vercel Blob, `lib/cloudinary/` is gone, the three `CLOUDINARY_*` variables
> are off Vercel, and `res.cloudinary.com` is out of `next.config.ts`. The data
> moved too: `scripts/assets/migrate-cloudinary-to-blob.ts --apply` rehosted
> **39 of 41** rows. The two failures were one image referenced twice, which
> Cloudinary already 404s while a control URL from the same account returns 200 —
> the asset was gone and those rows had been rendering broken for some time; both
> columns were cleared so `resolvePhoto()` takes its own no-photo path. All five
> columns now read zero Cloudinary. **Cloudinary is no longer part of this
> project.**

### 11.1 Uploads are public, and that was decided rather than inherited

`@vercel/blob` takes `access` **per upload, not per store** — `'public'` or
`'private'`, with `presignUrl()` and `issueSignedToken()` for reading a private
object. So profile photos and CVs could have been made private in the same store
that serves the newsletter's public imagery. **A second store was never needed**,
which is worth stating because that was the assumption the question was first
raised under.

**They were deliberately left public on 2026-09-06.** The founder was given the
choice and declined it. The reasoning, recorded so nobody spends another round
re-deriving it:

- The exposure is **unchanged from Cloudinary**, which served these same objects
  from public URLs for as long as they have existed. This was parity, not a new
  decision to expose anything.
- Private objects mean the database column stops holding a usable URL. Every
  place a CV or photo is displayed would have to call an admin-only route that
  mints a short-lived signed URL first. That is one route and a few dozen lines —
  but it is also **one more indirection for whoever inherits this project**, and
  the person deciding was in the middle of handing it over.
- Object paths carry `addRandomSuffix: true`, so a URL is unguessable. That is
  **not access control** and must not be mistaken for it.

**If this is revisited, revisit it for the CVs first.** Profile photos are
already shown on a mentor directory meant to be seen; a CV is a job application
with no audience beyond the people reviewing it. The change is `access: 'private'`
at the `put()` in `lib/blob/uploads.ts` plus a signed-URL route for the
recruitment dashboard, and it does not touch the newsletter's public assets.

---

Two ways this could have been closed, in preference order:

1. **Move the uploads to Vercel Blob**, which the organisation already owns and
   already pays for, and drop the Cloudinary dependency and its three environment
   variables entirely. It is a small change — two routes and a URL rewrite of 41
   rows — and it removes an account from the inventory rather than transferring
   one.
2. **Re-create the Cloudinary account under `website@shesharp.org.nz`**, copy the
   assets, and rewrite the 41 URLs. Same work, and the organisation ends up
   maintaining a service it barely uses.

Whichever is chosen, **rewrite the stored URLs in the same change**. A migration
that moves the files and leaves the rows pointing at the old host is the failure
mode, and nothing in CI can see it.

---

## 12. The 2026-09-06 credential exposure

Found while auditing whether this repository could safely be made public. It
turned out not to be a question about publishing at all: **two live credentials
were already sitting in `origin/main`'s history, and the repository was public
from 2026-03-24 until at least 2026-08-13.** Both have been rotated. This section
exists so the next person knows it happened, why it was not caught sooner, and
what is still owed.

### What was exposed, and what was done

| What | Where | Status |
|---|---|---|
| **`AUTH_SECRET` / `NEXTAUTH_SECRET`** — signs every session cookie, so holding it forges a session for **any account, admin included** | a script added 2025-08-03, removed 2025-11-29, still reachable from `origin/main` | **Rotated 2026-09-06.** New value set on Vercel, read back and compared byte-for-byte, deployed, site verified |
| **The Neon `neondb_owner` password** for the old project (`red-silence-55665683`) — a full, current copy of every mentor, mentee, donation and subscriber record | a git hook added 2025-08-03, replaced 2025-10-31, still reachable from `origin/main` | **Reset 2026-09-06** in the Neon console. Verified by connecting with the leaked password and getting `password authentication failed` |
| A Stripe `sk_live_` key on three stale remote branches | — | **Not She Sharp's.** Production's key fingerprints differently; the two share only `sk_live_51`, and everything after that is the merchant account id. It belongs to another Stripe account in the outgoing maintainer's orbit and is theirs to roll |
| Humanitix codes the 2026-06-11 history rewrite was supposed to remove | still fetchable through GitHub's API | Judged low impact by the founder and deliberately not actioned. `AUT60` was public anyway — it was printed on AUT's own poster |

### The parts worth learning from

- **The repository's tip was clean the whole time.** All 2,880 text blobs at
  `origin/main` were scanned and every credential-shaped hit is a placeholder.
  `.env` and `.env.local` were never committed under any name, and `private/`
  never entered the repository at all. **Every finding was a history finding.**
  Deleting a file does not remove it, and a tip-only scan would have reported all
  clear.
- **The 2026-06-11 history rewrite did not work.** It was recorded as done. One of
  the codes it was supposed to purge was fetched back out of GitHub's API during
  this audit. A rewrite that is not verified against the API afterwards has not
  been verified at all.
- **Nothing had ever scanned this repository.** GitHub secret scanning, code
  scanning and Dependabot are all disabled on it — private repositories on the
  Free plan do not get them. "No alerts" was never evidence of anything. All three
  turn on automatically if the repository is made public.
- **Deleting the stale branches is not remediation.** It unlinks the commits; the
  blobs stay fetchable by SHA through the API until GitHub garbage-collects or
  Support purges them. The credential has to be rolled regardless.

### Rotating `AUTH_SECRET` has a second effect now

Since 2026-09-06 it also signs the mentee payment-link tokens
(`lib/forms/submission-token.ts`). Rotating it invalidates outstanding payment
links as well as sessions. Harmless while applications are paused; once they
reopen, rotate when nobody is mid-application, or expect to re-issue the few
links in flight. The module says so at the call site too.

### Still owed

1. **Roll the leaked Stripe key** — the other account's owner, in the Stripe
   dashboard. There is no CLI or API path: `stripe keys` has no subcommands and
   Stripe exposes no key-management endpoint (`/v1/api_keys`, `/v1/apikeys` and
   `/v1/account/api_keys` all return "Unrecognized request URL"). Dashboard only.
2. **Delete the three stale remote branches**, understanding that this is tidying
   rather than remediation.
3. **Decide about making the repository public.** The audit's verdict was *safe
   after remediation*, and the remediation above is the substance of it. Public
   would bring free branch protection on `main` — impossible today, because
   rulesets on a private repository need a paid plan, and the org is on Free —
   plus unlimited Actions minutes, on an account already running over its 2,000.
   Weigh that against publishing a history that will still contain the rotated
   credentials and the Humanitix codes. They will be dead, but they will be
   readable.
