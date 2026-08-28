# Email Operations

> Moved from CLAUDE.md 2026-08-13 (the "Monthly Newsletter", "Outbound Email
> Skills" and "Email Authentication & Sending Streams" sections). DNS, DMARC and
> the Mailchimp → Resend migration runbook stay in
> **`docs/deployment/EMAIL_AUTHENTICATION.md`** — read that before touching any
> From address or DNS record. This file covers the code and the operating loops.

## The Resend account

**She Sharp owns it.** Since **2026-08-28** `shesharp.org.nz` lives in the Resend team **shesharp**, owned by **`website@shesharp.org.nz`**, on the **Pro** plan (Transactional 50,000/month, renewing on the 27th; Marketing still Free). It was moved off the maintainer's personal team (`chanmeng6666@gmail.com`) with Resend's Domain Claim flow — one DNS record changed, `resend._domainkey`, and nothing else. Method, ids, and why the swap was safe: `docs/deployment/EMAIL_AUTHENTICATION.md` → "Resend account migration (2026-08-28)".

Live objects in the new team — segments and topics do not travel with a claim, so **every id below changed on 2026-08-28**:

| Object | Name | ID | Env var |
|---|---|---|---|
| Segment | `Newsletter` | `95d452f5-2eed-4ad4-b18e-5ff5a89a576b` | `RESEND_NEWSLETTER_SEGMENT_ID` |
| Segment | `General` (team default — empty, unused) | `9d195cb7-f7fc-49e0-9b88-e47c1741e720` | — |
| Topic | `Monthly Newsletter` (`opt_in`, private) | `08e59693-29dc-4556-8357-866dea047c6f` | `RESEND_NEWSLETTER_TOPIC_ID` |

The webhook is `facbd62e-7c3e-47fa-abf1-0d36b37cd71c` → `https://www.shesharp.org.nz/api/webhooks/resend`, the same four events as before with a new `whsec_` secret. `EMAIL_UNSUBSCRIBE_SECRET`, `EMAIL_FROM` and `lib/email/senders.ts` were deliberately **not** touched: the four streams and every From address are unchanged.

**The list holds 0 contacts.** Nothing has been imported into the new team. The real list — **1,560 subscribers** — is still in Mailchimp, and the live newsletter still goes out from there.

## Sending streams

**Sender identities live in `lib/email/senders.ts` — the single source of truth.** Never hard-code a From or Reply-To anywhere else. Four streams, and the stream decides everything downstream:

| Stream | Meaning | From | `List-Unsubscribe` | Honours opt-outs |
|---|---|---|---|---|
| `transactional` | Recipient-triggered, expected in minutes | `noreply@` (overridable by `EMAIL_FROM`) | No | **Never** |
| `notification` | Recurring, unrequested (reminders, announcements) | `noreply@` | Yes (RFC 8058) | Yes |
| `marketing` | Newsletter + one-off broadcasts | **`newsletter@`** | Resend attaches it | via Resend topics |
| `internal` | To She Sharp's own mailboxes | `noreply@` | No | No |

- `sendEmail()` (`lib/email/service.ts`) takes `stream`, defaulting to `transactional`. It resolves From/Reply-To, attaches one-click unsubscribe headers for `notification` only, tags every send `stream:<name>` for per-stream Resend analytics, and checks `email_optouts` **only** for `notification` — a suppressed address must still receive a password reset.
- `EMAIL_FROM` overrides the **transactional** From only. Letting it reach marketing is what previously sent the monthly newsletter from `noreply@` while its own footer said "just hit reply".
- **`newsletter@` is a continuity decision, not a preference.** The live newsletter still goes out via **Mailchimp** from `She Sharp <newsletter@shesharp.org.nz>` (DKIM `k2`/`k3._domainkey` → `dkim*.mcsv.net`). The founder wants to replace Mailchimp with Resend *to improve deliverability*, so the visible sender must not change across that move — see the Mailchimp → Resend section in the deployment doc, especially the list-hygiene warning (Mailchimp's years of bounce/unsubscribe suppression are **not** in the subscriber CSV export) and the rule to do the ESP migration and the DMARC tightening in **separate months**.
- `info@` is the approved sender for **1:1** mail only (contact replies, event fulfilment). List mail uses `newsletter@`. It replaced `hello@` on 2026-08-23, when a delivery probe found `hello@` had never been created — note that sending *as* a non-existent address works fine, because Resend signs at the domain; what breaks is the recipient pressing Reply.
- **`newsletter@` is never a Reply-To.** It accepts mail, but nobody on the team had its password as of 2026-08-17 and a direct question in Slack about whether anyone read it went unanswered. The `marketing` Reply-To is `info@`; the From stays `newsletter@` for the reason above.
- **One-click unsubscribe**: `lib/email/unsubscribe-token.ts` (stateless HMAC over the email *hash*, never the address) → `app/api/email/unsubscribe/route.ts`. POST is unauthenticated and must return a bare 200 (providers treat 3xx as failure); **GET must never mutate** — link scanners prefetch it.
- **Bounces/complaints**: `app/api/webhooks/resend/route.ts` verifies Svix signatures by hand (`lib/email/webhook-verify.ts`, no `svix` dependency) and writes `email_optouts`; complaints also post to Slack. Needs `RESEND_WEBHOOK_SECRET`.
- **Two suppression stores, one join key**: `email_optouts` (runtime) and `lib/data/json/email-suppression-hashes.json` (committed, read by the offline scripts) both key on `hashEmail()` from `lib/email/hash.ts`. Reconcile monthly with `npx tsx scripts/email/suppression.ts sync`.
- **The committed register is no longer a frozen snapshot.** It was the 2026-08-17 Mailchimp export and nothing else; `npx tsx scripts/email/suppression.ts pull-mailchimp [--since <ISO>] [--full] [--dry-run]` now folds in unsubscribes and cleaned addresses straight from the Mailchimp API, incrementally. **Run it before any import.** The first run, on 2026-08-27, took it from 2,129 to **2,138** — three unsubscribes and six hard bounces that had happened in the ten days since the export, and that an import taken from that export would have emailed.
- **Checks**: `npx tsx lib/email/hardening.test.ts`.
- **One domain on purpose**: transactional and marketing share `shesharp.org.nz`. The pre-committed trigger to split marketing onto `news.` is complaint rate >0.10%, a single send >1,000 recipients, or hard bounces >2% — see the deployment doc.

### The one blocker on DMARC

Enabling Google DKIM needs **Google Workspace super-admin**, and `website@shesharp.org.nz` (the maintainer's account) **cannot open `admin.google.com`**. Without it, **do not go past `p=quarantine`** — at `p=reject` a forwarded message from a team mailbox is destroyed rather than filed in Junk, with no bounce and no way to find out. Stopping permanently at quarantine is a defensible end state; `docs/deployment/EMAIL_AUTHENTICATION.md` has the exact request to send an admin.

What does **not** need a mailbox login: sending *as* `info@`/`newsletter@` (Resend signs at the domain level), Reply-To to team inboxes (the point is that replies reach the team, not the maintainer), and DMARC report collection (Cloudflare receives on its own domain).

## Monthly newsletter

> **Reality check (2026-07-31): the newsletter that subscribers actually receive is still sent from Mailchimp**, from `She Sharp <newsletter@shesharp.org.nz>` (Mailchimp DKIM lives at `k2`/`k3._domainkey` → `dkim*.mcsv.net`). Everything below is the **Resend replacement**, which the founder wants to switch to *in order to improve deliverability*. It has been built and piloted but has not yet taken over a real send.
>
> **Mailchimp also still owns the subscribe funnel.** `MAILCHIMP_CONFIG` in `lib/data/newsletters.ts` (`subscribeUrl` + `archiveUrl`) is referenced across the site — footer, newsletters page, mentorship CTAs — so every new subscriber the website acquires goes into Mailchimp. Meanwhile `POST /api/newsletter/subscribe` writes to the Resend audience but **no component calls it**. Migrating the sending without the funnel leaves two lists drifting apart from day one.
>
> Before migrating, read the Mailchimp → Resend section of `docs/deployment/EMAIL_AUTHENTICATION.md` — list hygiene is the thing most likely to break it (Mailchimp's years of bounce/unsubscribe suppression are **not** in the subscriber CSV export), and the ESP switch must not happen in the same month as a DMARC policy change.
>
> **Update (2026-08-18): the list-hygiene half is done.** The Mailchimp audience was exported and archived — `docs/development/MAILCHIMP_ARCHIVE.md`. The list is **1,560 subscribers**, not the ~3,000 the account's contact count suggests, and the **2,129** people who unsubscribed, hard-bounced or never subscribed as at that export are now sha256 hashes in `lib/data/json/email-suppression-hashes.json`, which `normalize-recipients.ts` consults on every import. What remains is importing the 1,560 through `/update-mailing-list`, and the funnel above.
>
> **Update (2026-08-27): the ramp list is unblocked, and the register has stopped being frozen.** Both because the account now has an API key — `docs/development/PLATFORM_APIS.md`.
>
> - "Ramp, don't switch" wanted the first Resend broadcast to go to recent openers, and could not build that list: per-campaign recipient activity had been recorded as skipped by decision, because getting it out of the UI meant a couple of hundred manual exports. `scripts/mailchimp/recent-openers.ts` now computes it from the API vault as `hashEmail()` digests, intersected with the `subscribed` CSV before anything is written, and `scripts/email/normalize-recipients.ts --restrict-to-hashes` applies it. It **narrows** an already-consented list and grants nothing: it is a send-order filter, not a consent source.
> - **Nothing was sent and nobody was imported.** As at 2026-08-28 the Resend list holds **0 contacts** — the account moved to the She Sharp–owned team that day and not even a test address came across — and the import still goes through `/update-mailing-list` with its plan block and a human approval.
> - Suppression is incrementally syncable (`suppression.ts pull-mailchimp`) and went 2,129 → **2,138** on its first run. Run it before the import, not after.
> - **Campaign performance now exists in the repo**, as `lib/data/json/mailchimp/campaigns.json`: **180 sends**, **188,796 emails**, **37.9% unique open** — **33.1% with Apple's proxy opens excluded**. The two figures are *equal* for every campaign sent before 2022 and diverge after, so **open rates cannot be compared across 2021**, and any Mailchimp-vs-Resend baseline has to pick one of the two and stay on it. It also carries 86 months of list size: a peak of **1,742 in 2025-11**, standing at **1,555** in 2026-08. Until this file existed the only campaign statistics anywhere were figures transcribed into a `.docx`.
> - **Neither API replaces the manual CSV export, on either platform.** Humanitix `/payouts`, `/access-codes` and `/discounts` are all **404**; Mailchimp's API has no equivalent of `CONFIRM_TIME` (1,560 populated in the CSV against 129 for `timestamp_signup`), and the archive's reading of consent rests on it. A key is a second reading of the account, not a replacement for the download.
> - **Retiring Mailchimp is not just the sending and the funnel — there is a live Humanitix → Mailchimp integration too.** Left connected, Humanitix keeps pushing contacts into a dead audience. Its "Sync contacts who haven't opted-in" setting was switched **off** on 2026-08-27, and the checkout opt-in question was switched **on** for the September event; when the audience goes, that integration must be repointed at Resend or switched off, and that is a step in the migration rather than a tidy-up after it.

A monthly email newsletter built on **React Email** + **Resend broadcasts**, with an AI-drafted editorial pass. Each issue is a JSON file at `lib/data/json/newsletter-issues/<YYYY-MM>.json` split into two blocks (`lib/newsletter/schema.ts`): a machine-owned **`auto`** snapshot (events + stats, refreshed freely) and a human-owned **`editorial`** block (founder note, spotlight, photo of the month, subject/preview, CTA) that regeneration must never overwrite.

**Run the monthly loop with the `/monthly-newsletter` skill** (`.claude/skills/monthly-newsletter/SKILL.md`): fetch the staged draft → register the issue in `lib/newsletter/issues-registry.ts` (one import + one map line per month) → edit `editorial` → preview (`scripts/newsletter/preview.ts`) → test-send (`scripts/newsletter/send-test.ts`) → commit + deploy → approve (`scripts/newsletter/approve.ts`).

- **Logic in `lib/newsletter/`**: `assemble.ts` (builds `auto` from `lib/data/*`), `render.tsx` (React Email → HTML/text, `broadcast`/`preview` modes, 100KB Gmail-clip gate), `generate.ts` (OpenAI editorial draft), `drafts.ts` (Redis staging), `resend-api.ts` (typed REST wrapper — segments/topics/broadcasts, the pinned `resend@4.x` SDK predates the 2026 rename), `schedule.ts` (last-Thursday send slot), `notify.ts` (Slack + admin-email review alerts). Email template in `emails/`.
- **Routes**: `GET /api/admin/newsletter/draft/[month]` (pull staged draft), `POST /api/cron/newsletter-draft` (`{month,force}` manual trigger; GET is the Vercel cron), `POST /api/admin/newsletter/[issue]/approve` (create + schedule broadcast; reads the DEPLOYED fixture, never Redis), `GET /(site)/resources/newsletters/[issue]` (on-site "view in browser", `noindex` during pilot), `POST /api/newsletter/subscribe` (honeypot + rate-limited opt-in, unexposed).
- **Env** (see `.env.example`): `RESEND_NEWSLETTER_SEGMENT_ID`, `RESEND_NEWSLETTER_TOPIC_ID`, `NEWSLETTER_ADMIN_EMAIL`, `SLACK_NEWSLETTER_WEBHOOK_URL` (falls back to `SLACK_CONTACT_WEBHOOK_URL`), `CRON_SECRET` (bearer for cron/admin triggers; must match Vercel). Reuses `RESEND_API_KEY` + the chatbot's Upstash Redis.
- **Pilot status**: unlisted — the web version stays `noindex` and issues are NOT added to `lib/data/newsletters-manual.ts` (the public archive) until post-pilot.
- **Checks**: `for f in lib/newsletter/*.test.ts; do npx tsx "$f"; done`.

## Outbound email skills

Four guided skills let non-technical teammates send email without writing code. All four share one pipeline — **repo scripts render, the Resend CLI sends** — so `lib/email/service.ts` (the single `resend.emails.send()` behind every template call site, module-level Resend singleton) stays untouched while `--reply-to`, `--cc`, `--tags`, `--scheduled-at`, batch and broadcasts all come from the CLI.

| Skill | Use it for | Audience |
|---|---|---|
| `/reply-to-contact-messages` | Answering the contact form backlog (DB authoritative, Slack `C0AGVRL0G5A` cross-checked, `reviewed_at` = handled) | Tier 1 — 1:1 only |
| `/update-mailing-list` | Roster reporting + consent-gated CSV import + hashed suppression list | manages Tier 0 |
| `/send-event-emails` | Four stage emails to one event's Humanitix registrants, chunked and resumable | Tier 2 — fulfilment only |
| `/email-the-community` | One-off announcement broadcast to a Resend segment | Tier 0 only |

- **Shared layer**: `lib/email/message.ts` (`MessageSpec` — 9 content blocks, no HTML for the author), `compose.tsx` (dual engine: `layout` reuses `lib/email/layout.ts` for transactional, `react` renders `emails/announcement.tsx` for broadcasts; also exports `withDraftBanner`), `gates.ts` (100KB / absolute-URL / JPEG-only / unsubscribe / merge-tag / secret-scan / **from-identity / reply-to-domain / tag-charset / no-reply-path**, plus an advisory `Redactions to confirm` list), `audience.ts` (`assertSendAllowed` — marketing to Tier ≥1 throws).
- **Shared CLI**: `scripts/email/` — `render-message.ts` (spec → `tmp/emails/*.html` + gates + a paste-able `resend` command), `normalize-recipients.ts` (any-shape CSV: detects headers, reads the guess back in plain English, never asks anyone to edit a CSV), `build-batch.ts` (per-person render, 100/chunk, idempotency keys), `audience-report.ts`, `mark-contact-replied.ts`, `suppression.ts`.
- **Consent is the load-bearing rule**: the database has **no** marketing opt-in column, so Resend segments/topics are the only subscription record. Registering, donating, applying or writing in is **not** subscribing — see `.claude/skills/update-mailing-list/references/consent-rules.md`, which the other three skills defer to.
- **Two-stage confirmation everywhere**: render + gate locally → `resend … --dry-run` prints the full request JSON without calling the API → only then the real send. `resend emails batch` has **no** `--dry-run`; its equivalent preflight is the local render plus `--batch-validation strict`.
- **Zero migrations**: `form_status` has no `replied` value, so contact replies are recorded with the existing `reviewed_at` / `status` / `review_notes` columns.
- **Onboarding a non-technical teammate**: `docs/development/AI_SKILLS_GUIDE.md` walks them from installing Cursor → cloning the repo → typing `/` → prompts for the project skills. Cursor reads `.claude/skills/` as a compatibility path, so no per-tool porting is needed; frontmatter `name` must keep matching its folder name or Cursor drops the skill.

## Email addresses and routing

`industry@` for sponsorship, `mentoring@` for the mentorship programme,
`events@` for a specific event, `people@` for applications, `info@` for
everything else. Held in `lib/config/contact-addresses.ts`.

**Publish nothing that is not in that file.** On 2026-08-23 a delivery probe
found that seven of the eleven addresses this site published had never been
created and hard-bounced everything sent to them; they had been invented by
page templates in 2025. The evidence, the replacements and the rerun command
are in `docs/development/EMAIL_ADDRESSES.md`, and the part only the Workspace
super-admin can fix is in `docs/deployment/WORKSPACE_MAILBOX_CHECKLIST.md`.
