# `lib/email/` — sending, streams, consent, the newsletter

Loaded when you read a file under `lib/email/`. The consent **gate** lives in
the root `CLAUDE.md`, because a send can start from a skill or a script that
never opens this directory. Everything below is what you need once you are
editing the sending code itself.

## The four streams

Every message belongs to exactly one stream, decided in `lib/email/senders.ts`:

| Stream | What it carries | Unsubscribe |
|---|---|---|
| `transactional` | password reset, verification, receipts | none — never suppressed |
| `notification` | "your application moved", admin alerts | account-level |
| `marketing` | the newsletter, event promotion | RFC 8058 one-click, mandatory |
| `internal` | to She Sharp's own inboxes | none |

**There is one Resend call site**, in `lib/email/service.ts`. Everything routes
through it, which is what makes the stream gate, the suppression check and the
unsubscribe header impossible to bypass by accident. Do not add a second.
Bounces and complaints come back through a **Svix-verified** webhook and are
written to `email_events`.

All user-facing URLs are built by **`getBaseUrl()`**, exported from this
directory. The one deliberate exception is `feedbackUrlForSlug()`, which builds
from the compile-time `SITE_URL` because a projected QR encoding `localhost`
fails on every phone in the room.

**`getBaseUrl()` defaults to production, not to localhost.** It falls back to
`SITE_URL` from `lib/seo/site.ts`, so an environment that never set `BASE_URL`
produces working links instead of links to the reader's own machine. The old
`|| 'http://localhost:3000'` fallback is what put localhost into 25 mentor
invitations (2026-03-19) and six newsletter confirmations (2026-09-01), and
`.env` now carries the production origin locally for the same reason. Set
`BASE_URL=http://localhost:3000` only while testing a link-bearing page —
`sendEmail()` warns on every message while you do. Local development shares the
production database, so a production link in a locally-triggered email usually
resolves correctly anyway.

**`sendEmail()` refuses a message carrying a loopback link when it is running on
Vercel, and warns when it is not** (`lib/email/localhost-links.ts`). It reads the
rendered body rather than `BASE_URL`, because the env var is a proxy for the harm
and the link in the message *is* the harm — a URL can reach the body without
going through `getBaseUrl()` at all. The batch builders have guarded this since
the 2026-03-19 incident that put `localhost:3000` into 25 real mentor
invitations; the per-message path had no guard until 2026-09-01, when six
newsletter confirmations went out from `noreply@shesharp.org.nz` with
`http://localhost:3000/newsletter/confirm` links because an end-to-end test ran
against a local server holding the production Resend key. They reached only the
tester's mailbox — nothing in the code knew the difference, and the sign-up form
has since gone from one surface to eight.

Deployed refuses and local warns because those are different harms: locally,
somebody is testing the mail path on purpose and the localhost fallback exists
for exactly that. The check keys on `VERCEL`, **not** `NODE_ENV` — a local
`next start` sets `NODE_ENV=production` too, and that is the local case.

## Who answers a reply

**Decided by what the message is about, not by which stream carried it.**
`lib/email/reply-to.ts` maps seven purposes — `account`, `newsletter`,
`mentorship`, `recruitment`, `events`, `payments`, `internal` — onto the
mailboxes `docs/development/EMAIL_ADDRESSES.md` says are real and read. Every
sender passes a `purpose`; a source-scan in `reply-to.test.ts` fails CI if a
`sendEmail()` call names neither a purpose nor an explicit `replyTo`.

The stream is the wrong key for this and had already produced two defects. The
marketing Reply-To was `newsletter@`, a mailbox nobody on the team had the
password to. And until 2026-09-01 `transactional` and `notification` both
replied to `mentoring@`, so a subscriber answering a newsletter confirmation
with "please take me off this list", or a donor replying to a receipt, wrote
into the mentorship lead's personal contact address.

`info@` is the fallback because it is the one address anybody has confirmed on
the record that a human opens. **A specialist mailbox is the dangerous default;
the general desk is the safe one.**

Audience tiers are in `lib/email/audience.ts`: subscribers are **Tier 0**, one
event's registrants are **Tier 2 fulfilment**, and the two are not
interchangeable.

→ `docs/development/EMAIL_OPERATIONS.md`; DNS, DMARC and the Mailchimp → Resend
migration in `docs/deployment/EMAIL_AUTHENTICATION.md`; every
`@shesharp.org.nz` address and which are mailboxes versus sending identities in
`docs/development/EMAIL_ADDRESSES.md`.

## The newsletter is self-hosted

**Decided 2026-08-28, switched over 2026-08-31.** The newsletter goes out on
Resend's **transactional batch API**, not its Marketing product — which is what
moves the marketing-consent record out of Resend and into our own database.
Resend's Marketing segment and topic are **gone**: the code that read them, both
objects in the Resend account, and their two Vercel variables were all deleted
on 2026-08-29.

The path, end to end:

```
newsletter_subscribers (Neon)
  → scripts/email/recipients-from-db.ts     (applies both suppression registers
                                             via scripts/email/mailable.ts)
  → scripts/newsletter/build-newsletter-batch.ts
  → a human runs `resend emails batch`
```

The `newsletter_subscribers` table, the double opt-in funnel, the six site entry
points repointed at `/newsletter/subscribe`, that send path, the Mailchimp
import and the retirement of the Resend Marketing objects were all built by
2026-08-29. On **2026-08-31** the August 2026 issue was broadcast down it to all
1,549 subscribers — 16 chunks, `--batch-validation strict`, 0 failures, after a
three-stage approval chain ending in the founder's. **The July 2026 issue was
the last newsletter ever sent from Mailchimp.**

Two things not to overstate. **One issue is not a routine** — and it was not
ramped, against three places in this repo that asked for a ramp, so one clean
reading is a sample rather than a reason to drop the rule. And the only
established outcome is that Resend *accepted* all 1,549; delivery, opens,
bounces and complaints arrive later through the Svix webhook, so the running
figure is `email_events` and never a number written in prose.

Reasoning, costs and the AWS SES fallback:
`docs/development/EMAIL_PLATFORM_STRATEGY.md`. Which of the three platforms does
what today, the consent tiering and how the list was actually acquired:
`docs/development/EMAIL_PLATFORM_STATE.md`.

## The monthly newsletter loop

React Email rendered in this repo and sent through Resend's batch API — no
broadcasts, no Resend-held contact list — run by the `/monthly-newsletter`
skill.

**It is not generated in the cloud.** An issue starts as a local file:
`scripts/newsletter/new-issue.ts <YYYY-MM>` writes the `auto` snapshot plus an
empty editorial stub, with no API key, no `CRON_SECRET` and no network call, and
a human writes it. The AI draft and its Vercel cron were deleted because every
month's output was rewritten by hand anyway. The one cron that still calls
OpenAI is the weekly funding crawl.

**Approving an issue does not send it.** A human runs the printed batch
commands. Run `npx tsx scripts/newsletter/check-facts.ts` before a send.

The founder's own copy is published **verbatim**. Do not reconcile repo data to
her numbers; flag a mismatch once and drop it.

## The on-site newsletter archive

`lib/data/newsletter-archive/` holds the **179 sent Mailchimp campaigns** as
sanitised HTML plus an `index.json` keyed by 10-hex campaign id, and
`/resources/newsletters/<id>` prerenders every one of them. It is committed
because it comes from the private vault and CI can never regenerate it.

- **The bodies are generated and checksummed, never hand-edited.**
  `scripts/mailchimp/archive-guard.test.ts` (in the `verify-image-paths` job)
  fails on a changed sha256.
- Images are re-hosted on Vercel Blob under `NEWSLETTER_ARCHIVE_IMAGE_PREFIX`
  (`lib/config/assets.ts`), and **five are withheld by decision, not by
  accident** — `scripts/mailchimp/withheld-images.ts` is authored rather than
  generated, and each entry is a judgement about a photograph of a child.
- **A `YYYY-MM` id cannot address a body.** The 179 span 74 months and 55 of
  those hold more than one campaign, so a card carries an explicit `campaign`
  id. The resolution order is in `lib/newsletter/archive.ts`.
- The route is **`noindex` by header**, therefore **absent from
  `app/sitemap.ts`** and deliberately **not** `Disallow`ed — a `Disallow` would
  stop the crawler ever reading the `noindex`.
- `MAILCHIMP_CONFIG.archiveUrl` and `lib/data/newsletters.ts` were deleted with
  it, so nothing on the site links to Mailchimp any more.

→ `docs/deployment/MAILCHIMP_CANCELLATION.md` §4.

## The outbound email skills, and what each reaches

Four guided skills let teammates send mail without writing code:
`/reply-to-contact-messages`, `/update-mailing-list`, `/email-the-community` and
`/promote-event`. Repo scripts render; the Resend CLI sends.

`/promote-event` runs **once per stage** — `save-the-date`, `line-up`,
`last-call` — each a different email about the same event, and it refuses if it
is generated at the wrong distance from the event date.

**Every marketing send from any skill is capped at three per calendar month**,
counted across all of them including the newsletter, because frequency is what
produces the complaints that would take password resets down with the campaign.

**Mail to one event's registrants is not among them.** It is composed and sent
in **Humanitix's own Email campaigns tool**, against the ticket holders
Humanitix already has. `/send-event-emails` did it here until 2026-08-30 and was
retired because its only input was a Humanitix export, so it could never reach
anyone Humanitix could not. Two consequences to state rather than discover: that
mail leaves the **Humanitix** domain, not `shesharp.org.nz`, so none of the
SPF/DKIM/DMARC work applies to it; and Humanitix will not send to an event that
ended more than **14 days** ago, so a late follow-up has no tool at all.

→ `docs/development/EMAIL_RESPONSIBILITY_BOUNDARIES.md` (which system sends to
whom, and why registrant mail is not here),
`docs/development/AI_SKILLS_GUIDE.md`,
`docs/development/INTERNAL_EMAIL_PLAYBOOK.md` (the non-technical version).

## Leaving Mailchimp

The founder is cancelling the **paid subscription**, not closing the account —
two different screens, and only one of them is reversible. Stopping the payment
therefore means **pause or downgrade, never delete**; and because the Free plan
holds sending above **250 contacts** against an audience an order of magnitude
larger, **the last Mailchimp send must precede the downgrade**.

That precondition is now met for the newsletter. **The account itself is
untouched** — not paused, not downgraded, not closed — and it still sends event
campaigns composed by hand in its console, which is the one thing left to decide
before pressing anything. None of it can be done from this repo: every step
needs the Mailchimp account, which only the founder has.

Keep running `npx tsx scripts/email/suppression.ts pull-mailchimp` regardless.
The newsletter left Mailchimp on 2026-08-31, but the account is still live,
still sends event campaigns and still collects unsubscribes we cannot otherwise
see. → `docs/deployment/MAILCHIMP_CANCELLATION.md`,
`docs/deployment/HUMANITIX_INTEGRATION_SHUTDOWN.md`.

## Before you touch a gate here

`npx tsx lib/email/hardening.test.ts` covers unsubscribe tokens, senders, gates
and Svix, and is **not** in CI. Run it. And remember that a guard is not
verified until you have handed it the input it was supposed to refuse — two
gates in this subsystem read as correct and gated nothing until 2026-08-30.

Use `chanmeng6666@gmail.com` for test and preview sends.
