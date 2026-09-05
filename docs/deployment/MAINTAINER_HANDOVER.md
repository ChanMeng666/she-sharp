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
3. **Move the production database off a personal account.** This was checked on
   2026-09-05 and is no longer an open question — it is confirmed, and it cannot
   be fixed by clicking "transfer". §10 is the runbook. The production database
   holds every mentor and mentee application, the donations table and the
   mailing-list consent record, and it is the one thing here that cannot be
   rebuilt from this repository.
4. **Deal with Cloudinary** — §11. It was assumed dead and is not: it still takes
   every profile photo and CV upload, and 41 live records point at a personal
   account.
5. Read §7. Three decisions are recorded as *made and not done*, and each one
   needs a founder-console action nobody else can take.
6. Work through §6 before touching anything. Each rule there is attached to a
   dated incident that cost real money, real inboxes, or a history rewrite.

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
authoritative *list* is `npx vercel env ls production` (66 variables as at
2026-09-05), not this table and not `.env.example`, which documents local
tooling variables that production does not have.

| Service | What breaks without it | Held under | Handover action |
|---|---|---|---|
| **Vercel** | Everything | `shesharpnz`, team `she-sharp1`, Pro | Rotate on departure |
| **GitHub org** `NZ-SheSharp` | Deploys, the `/event` Slack bot's PRs | Org | Remove the departing member; the bot's PAT (`GITHUB_BOT_TOKEN`) is issued against a person and must be reissued |
| **Neon (PostgreSQL)** | The whole dashboard, applications, donations, the subscriber list | **A personal account** — project `she-sharp-database` (`red-silence-55665683`), in the Vercel-managed Neon org "Vercel: Chan Meng's projects" | Data migration, not a transfer. **§10** |
| **Stripe** | Donations and membership payments | She Sharp | Rotate keys on departure; re-point the webhook only if the domain changes |
| **Resend** | All outbound mail — transactional *and* the newsletter | Signed in via `website@shesharp.org.nz` | Rotate that Google password, then the API key |
| **Cloudinary** | Profile photos and CVs uploaded through the forms and the dashboard — **still live, not replaced by Blob** | **A personal account** | Migrate the 41 stored files, or accept broken images. **§11** |
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
deliberately, not as part of a sweep.

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

Two ways to close this, in preference order:

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
