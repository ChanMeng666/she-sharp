# Email Operations

> Moved from CLAUDE.md 2026-08-13 (the "Monthly Newsletter", "Outbound Email
> Skills" and "Email Authentication & Sending Streams" sections). DNS, DMARC and
> the Mailchimp → Resend migration runbook stay in
> **`docs/deployment/EMAIL_AUTHENTICATION.md`** — read that before touching any
> From address or DNS record. This file covers the code and the operating loops.

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
- `hello@` remains an approved sender but is for **1:1** mail only (contact replies, event fulfilment). List mail uses `newsletter@`.
- **One-click unsubscribe**: `lib/email/unsubscribe-token.ts` (stateless HMAC over the email *hash*, never the address) → `app/api/email/unsubscribe/route.ts`. POST is unauthenticated and must return a bare 200 (providers treat 3xx as failure); **GET must never mutate** — link scanners prefetch it.
- **Bounces/complaints**: `app/api/webhooks/resend/route.ts` verifies Svix signatures by hand (`lib/email/webhook-verify.ts`, no `svix` dependency) and writes `email_optouts`; complaints also post to Slack. Needs `RESEND_WEBHOOK_SECRET`.
- **Two suppression stores, one join key**: `email_optouts` (runtime) and `lib/data/json/email-suppression-hashes.json` (committed, read by the offline scripts) both key on `hashEmail()` from `lib/email/hash.ts`. Reconcile monthly with `npx tsx scripts/email/suppression.ts sync`.
- **Checks**: `npx tsx lib/email/hardening.test.ts`.
- **One domain on purpose**: transactional and marketing share `shesharp.org.nz`. The pre-committed trigger to split marketing onto `news.` is complaint rate >0.10%, a single send >1,000 recipients, or hard bounces >2% — see the deployment doc.

### The one blocker on DMARC

Enabling Google DKIM needs **Google Workspace super-admin**, and `website@shesharp.org.nz` (the maintainer's account) **cannot open `admin.google.com`**. Without it, **do not go past `p=quarantine`** — at `p=reject` a forwarded message from `hello@` is destroyed rather than filed in Junk, with no bounce and no way to find out. Stopping permanently at quarantine is a defensible end state; `docs/deployment/EMAIL_AUTHENTICATION.md` has the exact request to send an admin.

What does **not** need a mailbox login: sending *as* `hello@`/`newsletter@` (Resend signs at the domain level), Reply-To to team inboxes (the point is that replies reach the team, not the maintainer), and DMARC report collection (Cloudflare receives on its own domain).

## Monthly newsletter

> **Reality check (2026-07-31): the newsletter that subscribers actually receive is still sent from Mailchimp**, from `She Sharp <newsletter@shesharp.org.nz>` (Mailchimp DKIM lives at `k2`/`k3._domainkey` → `dkim*.mcsv.net`). Everything below is the **Resend replacement**, which the founder wants to switch to *in order to improve deliverability*. It has been built and piloted but has not yet taken over a real send.
>
> **Mailchimp also still owns the subscribe funnel.** `MAILCHIMP_CONFIG` in `lib/data/newsletters.ts` (`subscribeUrl` + `archiveUrl`) is referenced across the site — footer, newsletters page, mentorship CTAs — so every new subscriber the website acquires goes into Mailchimp. Meanwhile `POST /api/newsletter/subscribe` writes to the Resend audience but **no component calls it**. Migrating the sending without the funnel leaves two lists drifting apart from day one.
>
> Before migrating, read the Mailchimp → Resend section of `docs/deployment/EMAIL_AUTHENTICATION.md` — list hygiene is the thing most likely to break it (Mailchimp's years of bounce/unsubscribe suppression are **not** in the subscriber CSV export), and the ESP switch must not happen in the same month as a DMARC policy change.
>
> **Update (2026-08-18): the list-hygiene half is done.** The Mailchimp audience was exported and archived — `docs/development/MAILCHIMP_ARCHIVE.md`. The list is **1,560 subscribers**, not the ~3,000 the account's contact count suggests, and the **2,129** people who unsubscribed, hard-bounced or never subscribed are now sha256 hashes in `lib/data/json/email-suppression-hashes.json`, which `normalize-recipients.ts` consults on every import. What remains is importing the 1,560 through `/update-mailing-list`, and the funnel above.

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

`industry@` for sponsorship, `mentoring@` for the mentorship programme, `hello@`
for general. Held in `lib/config/contact-addresses.ts`; full list and rationale
in `docs/development/EMAIL_ADDRESSES.md`.
