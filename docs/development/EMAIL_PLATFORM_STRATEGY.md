# Email Platform Strategy — what we pay for, what we build, and why

**Decision date:** 2026-08-28
**Status (2026-08-29):** decided, and **built**. The consent record and the
suppression seam, the subscribe funnel with double opt-in, the send path off the
batch API, and now **the import**: `newsletter_subscribers` holds **1,545** rows
carried over from the 2026-08-17 Mailchimp export. The code that read Resend's
Marketing objects is deleted. **What has not happened is the send.** Nothing has
gone out from this system, the live newsletter **still goes out from Mailchimp**,
and the two Resend objects and their two Vercel env vars still exist in the
accounts. Section 5 marks each item.

> **The decision, in one line.** She Sharp keeps **Resend Transactional Pro
> ($20/month)**, does **not** buy Marketing Pro, and **builds its own newsletter
> subscriber list and bulk-send pipeline** on top of Resend's transactional batch
> API. AWS SES direct is recorded below as a future option, not a plan.

Everything in this document was measured or quoted on **2026-08-28**, the day the
sending domain moved to the She Sharp–owned Resend team (see
[`../deployment/EMAIL_AUTHENTICATION.md`](../deployment/EMAIL_AUTHENTICATION.md)
§ "Resend account migration"). Figures rot. Where a number came from a live
query, the query is named so it can be re-run.

---

## 1. What the $20 actually buys

Read from the Resend billing dashboard of the `shesharp` team on 2026-08-28.
Transactional and Marketing are **two separate subscriptions that sum into one
total** — the billing page lists them as separate lines with a `Total` row, and
the plan chooser has an independent tab and slider for each.

| | Transactional **Free** | Transactional **Pro** ($20/mo) |
|---|---|---|
| Monthly emails | 3,000 | 50,000 (extra $0.90 / 1,000) |
| **Daily emails** | **100 / day** | **no daily limit** |
| Domains | 3 | 10 |
| Webhook endpoints | not stated | 5 |
| Automation runs | 10,000 | 10,000 |
| Data retention | 30 days | 30 days |
| Ticket support | yes | yes |
| AI credits | — | 100 / month |

Of the five things Pro adds, **She Sharp would use exactly one: the removal of
the 100-per-day cap.** One domain is in use (Free allows three, enough to add a
`news.` subdomain later); one webhook endpoint is in use; the AI credits are
irrelevant.

### Measured transactional volume

Queried against the production database on 2026-08-28:

| Table | Total rows | Last 90 days |
|---|---|---|
| `users` | 43 | 8 |
| `mentor_form_submissions` | 26 | 0 *(applications paused)* |
| `mentee_form_submissions` | 11 | 2 |
| `volunteer_form_submissions` | 8 | 2 |
| `donations` | 0 | 0 |
| `event_registrations` | 0 | 0 *(Humanitix owns registration)* |
| `contact_form_submissions` | 14 | — *(no `created_at` column)* |
| `email_optouts` | 10 | — *(bounces + complaints ever recorded)* |

Generously estimated, the site sends **tens of transactional emails per month**.
Free's 3,000/month is roughly sixty times more headroom than needed.

**So the monthly allowance was never the reason to be on Pro. The daily cap is.**

### Where the daily cap actually bites

1. **The newsletter.** 1,563 recipients in one send is impossible under
   100/day, and spreading a monthly newsletter across sixteen days is not a
   newsletter.
2. **Event fulfilment mail.** ~~`/send-event-emails` mails a Humanitix
   registrant list.~~ **No longer true since 2026-08-30.** That skill was
   retired; mail to an event's registrants is now sent from Humanitix's own
   Email campaigns tool, which is free on the NZ charity rate and does not touch
   the Resend quota at all. The volume argument is recorded for the shape of it:
   the ticketing archive holds 5,156 tickets across 62 ticketed instances — an
   **average of ~83 per event**, so a typical event squeezed under 100 and a
   hackathon did not.

**This changes the conclusion, so read it rather than the sentence it replaces.**
Point 2 used to be the reason Pro was not obviously droppable, because it bit
even in a world with no newsletter. It no longer bites: nothing outside the
newsletter now needs more than 100 Resend emails in a day. **The newsletter is
the whole case for Pro today** — and it has not been sent from Resend yet, so the
plan is currently paying for a capability nothing is using. That is a decision to
take deliberately, not a gap to fix; the switch-over is what makes it earn its
keep.

---

## 2. Why not Marketing Pro

Marketing is priced by **contacts stored**, not emails sent ("Marketing plans are
not limited by the number of emails sent — only by the number of contacts").

| Marketing tier | Price | Contacts |
|---|---|---|
| Free | $0 | 1,000 |
| Pro | $40 | 5,000 |
| Pro | $80 | 10,000 |

Buying Marketing Pro would make the total **$20 + $40 = $60/month**.

### The Free tier cannot hold the list, and no cohort trick fixes that

The consented list is **~1,560** subscribers, above Free's 1,000 cap.

The idea of importing only an engaged subset was tested against real data — 180
campaigns of Mailchimp email-activity from the archive vault, intersected with
the `subscribed` CSV spine, on 2026-08-28:

| Window | ≥1 open | ≥3 | ≥5 | ≥10 |
|---|---|---|---|---|
| Last 2 months | 982 | 573 | 324 | 72 |
| Last 6 months | 1,315 | 1,077 | 894 | 553 |
| Last 12 months | 1,372 | 1,207 | 1,067 | 798 |

Only very narrow definitions fit under 1,000, and a further **228 recent openers
are not on the consented spine at all** (excluded by construction — engagement is
never evidence of consent; see
`.claude/skills/update-mailing-list/references/consent-rules.md`).

> **Correction to an existing repo figure.** The docstring of
> `scripts/mailchimp/recent-openers.ts` describes "picking 412 of 1,560 to email
> first". That number is **not reproducible** from the vault data — the lowest
> ≥1-open cohort measured was 982 (two months). The 412 appears to be
> illustrative rather than computed, and the docstring should not be read as a
> measurement. Open-rate figures in this domain are also inflated by Apple Mail
> Privacy Protection auto-opens, which is the likely source of the gap.

The measurement is reproducible: read `2026-08-28-api/activity/*.json` and
`2026-08-17/subscribed_email_audience_export_*.csv` from the private archive
repo, count distinct addresses with an `open` action after a cutoff, and
intersect with the subscribed spine. Note that
`scripts/mailchimp/recent-openers.ts` cannot be pointed at the archive repo in
one command: `MAILCHIMP_VAULT_DIR` resolves to a **single** export directory
(`exportDir()` only honours the override when its basename equals the export id),
and this computation needs two different exports at once.

**Conclusion: a ramped first send is a deliverability tactic, not a way to stay
on the free tier. Marketing Free can never hold the real list.**

---

## 3. Is self-hosting the newsletter permitted?

This was the make-or-break question, and the answer is **yes, with one grey
edge**.

Third-party review sites assert that sending marketing email on a transactional
plan violates Resend's terms. **That claim is not supported by Resend's own
documents.** Checked on 2026-08-28:

- [Acceptable Use Policy](https://resend.com/legal/acceptable-use) contains **no
  clause** distinguishing marketing from transactional use, and **no clause**
  restricting bulk or promotional sending to a particular plan.
- [Terms of Service](https://resend.com/legal/terms-of-service) contains no such
  clause either; it incorporates the AUP by reference.
- The [pricing knowledge base](https://resend.com/docs/knowledge-base/what-is-resend-pricing)
  describes the split as a billing model. Its only restriction —
  *"Broadcasts can only be sent to existing contacts"* — governs the Marketing
  product's own feature.

What the AUP **does** require applies identically whichever plan is used:

> "All mail must be sent to recipients who have **explicitly opted in** to
> receive communications from you."

> "Provide a frictionless way to opt-out (unsubscribe) and **honor their wish
> within 7 days**."

> "Your complaint rate must be lower than **0.08%**. Your bounce rate must be
> lower than **4%**." … "If complaint or bounce rates go above these thresholds,
> **your account may be shut down without warning**."

### The grey edge, stated honestly

The AUP also says:

> "Users are expressly forbidden from creating or using an account **or multiple
> accounts** with the aim of **circumventing any quotas or limits** imposed by
> our service."

In context this targets multi-accounting to dodge free-tier limits. There is a
strong argument that it does not reach us: the Marketing quota is a
**contact-storage** quota, and a system that stores no contacts in Resend is not
circumventing it — it is paying for exactly what it consumes, which is
transactional send volume. But the sentence is broad enough to be read the other
way by someone at Resend.

**Open action:** ask Resend support directly, in writing, from
`website@shesharp.org.nz`. It is free, and it converts a judgement call into a
documented answer. Record the reply in this file.

---

## 4. Is it technically feasible?

Comfortably. The constraints are nowhere near binding.

| Constraint | Value | Our need | Verdict |
|---|---|---|---|
| Batch endpoint | **100 emails / request** | 1,563 → **16 requests** | fine |
| API rate limit | **10 requests/second per team**, raisable on request | 16 requests ≈ **2 seconds** | fine |
| Monthly allowance (Pro) | 50,000 | ~1,600 | fine |
| Daily allowance (Pro) | unlimited | 1,563 in one burst | fine |

**Since measured, not just projected.** On 2026-08-29 the builder was run against
the imported list: 1,545 recipients produced exactly **16 chunk files** and 1,545
distinct signed unsubscribe URLs. The estimate above held. Nothing was sent.

Batch specifics worth knowing before building:

- **Attachments are not supported** on the batch endpoint.
- `tags` and `scheduled_at` **are** supported.
- `Idempotency-Key` is supported: unique per request, **expires after 24 hours**,
  max 256 characters. This is a per-*request* key; the per-*message*
  de-duplication hook is the `X-Entity-Ref-ID` header, which
  `scripts/email/build-batch.ts` already sets deterministically.

---

## 5. What already exists, and what has to be built

An audit of the codebase on 2026-08-28. The gap is **much smaller than expected**
— most of a self-hosted bulk sender is already in the repo, because the
event-mail tooling needed the same machinery.

### Already exists — no work needed

| Capability | Where |
|---|---|
| **RFC 8058 one-click unsubscribe**, HMAC-signed, stateless, PII-free, and **completely independent of Resend** | `lib/email/unsubscribe-token.ts` |
| Unsubscribe endpoint — GET never mutates (link scanners prefetch), POST is idempotent | `app/api/email/unsubscribe/route.ts` |
| **Batch builder**: renders per recipient, chunks at 100, sets a deterministic `X-Entity-Ref-ID`, runs the strict gates on the first message, skips anyone in a previous run's manifest (`--exclude-hashes`), writes a manifest of recipient **hashes** only | `scripts/email/build-batch.ts` |
| Recipient normalisation: dedupe, drop refunded/cancelled, strip suppressed addresses, `--for-import` refuses to run without a recorded consent source and date | `scripts/email/normalize-recipients.ts` |
| Bounce/complaint capture into `email_optouts` via Svix-verified webhook | `app/api/webhooks/resend/route.ts`, `lib/email/webhook-verify.ts` |
| Pre-send gates including the unsubscribe-link check | `lib/email/gates.ts` |
| Audience tiering (`assertSendAllowed`) | `lib/email/audience.ts` |

> **A correction worth recording.** It was previously believed — and stated in
> conversation — that `lib/email/gates.ts` **requires** the
> `{{{RESEND_UNSUBSCRIBE_URL}}}` merge tag for `category: "marketing"`, and that
> this blocked self-hosting. It does not. `gateUnsubscribe()` passes on **any of
> three** conditions:
>
> ```ts
> const hasMergeTag = html.includes("{{{RESEND_UNSUBSCRIBE_URL}}}");
> const hasHrefUnsubscribe = /href\s*=\s*["']https:\/\/[^"']*unsubscrib/i.test(html);
> const hasLabelledLink = /<a\b[^>]*href=…>[^<]*unsubscrib/i.test(html);
> if (hasMergeTag || hasHrefUnsubscribe || hasLabelledLink) return [];
> ```
>
> A self-hosted `https://www.shesharp.org.nz/api/email/unsubscribe?t=…` link
> passes as written. **No change to this gate is required.**

### Must change — small — **done 2026-08-29**

- ~~**`buildStreamHeaders()` in `lib/email/service.ts`** currently reads
  `if (stream !== 'notification') return {};`.~~ The `marketing` stream received
  **no** `List-Unsubscribe` / `List-Unsubscribe-Post` headers, because Resend
  attached them for broadcasts. Self-hosted marketing mail must emit them itself.
  **Fixed:** the stream test now reads
  `if (stream !== 'notification' && stream !== 'marketing') return {};`, and the
  header construction moved out to `lib/email/unsubscribe-headers.ts` so the
  batch builder and the single-send path produce the identical pair.

  The same widening was needed one layer down and was **not** in the original
  audit: `isSuppressed()` in `lib/email/optouts.ts` tested only `notification`
  too. Harmless while Resend broadcasts honoured their own unsubscribes;
  self-hosted it meant a one-click opt-out recorded in `email_optouts` would be
  ignored by the very stream the recipient opted out of. It now covers
  `marketing` as well, with the reason written at the site.

### Must be built — the real work

Items 1–4 are **built as of 2026-08-29**; item 5 is not, and was never required.
Item 6 was not in the original audit and is the one that has actually *run*.
For items 1–4, built means the code exists, is typechecked and has its own tests
— **not** that anything has been sent. Nothing has been sent.

1. ~~**A subscribers table.**~~ **Done.** `newsletter_subscribers` in
   `lib/db/schema/system.ts`, migration `0032_sweet_maria_hill.sql`, **applied to
   the production database**. It holds the address, its `hashEmail()` digest, a
   `subscriber_status` enum (`pending` / `subscribed` / `unsubscribed` /
   `bounced` / `complained`), and the consent evidence — `consent_source`,
   `consent_date`, `consent_ip`, `consent_user_agent`. The table holds **1,545
   rows** since the 2026-08-29 import (see item 6 below).
   All reads and writes go through `lib/newsletter/subscribers.ts`, whose
   `listSubscribed()` is the single enumeration point and returns
   `status = 'subscribed'` and nothing else.

   `email_optouts` remains hash-only (`emailHash` PK, `stream`, `reason`,
   `createdAt`) — you can *check* a hash, you cannot *enumerate* recipients from
   it, which is why a second table was needed rather than a column on that one.

   > **Correction to this document.** The column that "exists but its own schema
   > comment says it is explicitly **not** consent to marketing email" is
   > `eventFeedbackSubmissions.interestedInNewsletter`, **not**
   > `eventRegistrations.interestedInNewsletter` — see
   > `lib/db/schema/events.ts:160` and migration `0029_bored_warpath.sql`.
   > `eventRegistrations` has no email column at all, so it could not have
   > carried a subscription flag in the first place. The point being made was
   > correct; only the table name was wrong.

2. ~~**A subscribe funnel that is actually wired up.**~~ **Done.**
   `POST /api/newsletter/subscribe` no longer writes to Resend — it writes a
   `pending` row and sends the confirmation mail. The public pages are
   `app/(site)/newsletter/subscribe/` and `app/(site)/newsletter/confirm/`. The
   **six** `MAILCHIMP_CONFIG.subscribeUrl` links (footer, newsletters page, and
   four mentorship surfaces) now point at `/newsletter/subscribe`, and
   `subscribeUrl` has been **deleted** from `MAILCHIMP_CONFIG` in
   `lib/data/newsletters.ts` so no seventh one can appear. `archiveUrl` remains —
   it is still the only route to the pre-2026-08 back catalogue.
3. ~~**Double opt-in**~~ **Done**, and it is what produces the evidence the AUP's
   "explicitly opted in" requires. A subscribe request never writes a mailable
   row: the row is `pending` until the person presses the button on
   `/newsletter/confirm`, which posts to `/api/newsletter/confirm`. Tokens are
   single-use, replaced on re-request, and expire after `CONFIRM_TTL_DAYS` (7).
   The confirmation is a **button press, not a link visit** — a link scanner
   prefetching a GET must not be able to manufacture consent, the same reason
   the unsubscribe endpoint's GET never mutates.
4. ~~**A DB → recipients bridge**~~ **Done.** `scripts/email/recipients-from-db.ts`
   reads `status = 'subscribed'`, applies both suppression registers through
   `selectMailable()`, and writes the same recipients-file shape
   `normalize-recipients.ts` produces — so `build-batch.ts` needed no change to
   be fed from the database. The newsletter itself, which is a React Email
   template rather than a `MessageSpec`, goes through
   `scripts/newsletter/build-newsletter-batch.ts`, which reuses build-batch's
   idempotency key, hash ledger, manifest shape and chunk-file naming and swaps
   only the renderer. **Neither script sends.** They write files and print the
   `resend emails batch --file` commands a human runs.
5. ~~**Open/click analytics** — not built, and not required.~~ **Built
   2026-08-29, and the framing above was wrong.** What is not required is
   open/click; what turned out to be *load-bearing* is the rest of the same
   table, and this item had it filed as optional analytics.

   Risk 2 below names the 0.08% ceiling as the single largest operational risk
   in the plan — and nothing was watching it. The webhook suppressed the odd
   bouncing address and stored no per-send record at all, so the complaint rate
   had a numerator arriving one complaint at a time and **no denominator
   anywhere**. `email_events` (migration `0033_crazy_morg`, applied to
   production 2026-08-29) fixes that: the webhook now records `email.sent`,
   `delivered`, `opened`, `clicked`, `bounced`, `complained` and `failed`,
   idempotent on the `svix-id` header because the route returns 500 *so that*
   Resend retries. `scripts/email/send-stats.ts --tag newsletter:<YYYY-MM>`
   reports the complaint rate against 0.08% and the hard-bounce rate against 4%,
   naming this repo's own stricter triggers (0.10% / 2%) beside them.

   Two details worth carrying:

   - **`bounce_type` is a column, not a derived flag.** `email.bounced` covers
     hard *and* transient bounces, and a ramped send to 1,545 people produces
     routine transient ones. Folding them together reported OVER against the 2%
     trigger on a healthy send — a monitor that cries wolf on its first outing
     is one nobody reads by the third batch. `isTransientBounce()` in
     `lib/email/events.ts` is the single classifier, used by both the
     suppression branch and the rate query, so what is excluded from the rate is
     exactly what was not suppressed.
   - **Open and click tracking is still off, deliberately**, and it is not two
     flags: it requires a verified `tracking_subdomain` and a Cloudflare CNAME,
     and the API accepts a write enabling it while silently doing nothing. The
     decision and the no-op are recorded in `../deployment/EMAIL_AUTHENTICATION.md`
     → "Open and click tracking". So opens and clicks are the one part of this
     item that remains genuinely optional — which is where the original
     framing was right.
6. **A bulk importer, so the existing list could move in.** **Done, and run,
   2026-08-29.** This was the item the whole plan stalled on: double opt-in
   through the form was the only route to `status = 'subscribed'`, and 1,560
   people who had already consented years ago were never going to click a fresh
   confirmation. `scripts/email/import-mailchimp-subscribers.ts` writes them with
   their existing provenance instead — `source = 'mailchimp-import'`, a
   `consentSource` sentence naming the audience and the export, and a real
   `confirmedAt` from the export's `CONFIRM_TIME`, which every one of the 1,560
   rows carried. Recording that timestamp is not manufacturing a consent act; the
   act happened, in Mailchimp, and we have its date.

   **1,560 read, 15 held back by the suppression register, 0 malformed → 1,545
   rows.** Six of the fifteen were found only because
   `suppression.ts pull-mailchimp` was run first and moved the register
   2,138 → **2,144**: they had unsubscribed or hard-bounced in the twelve days
   since the export was taken. An import trusting the frozen file would have
   mailed them. `reconcile` reports no drift afterwards. No sign-up IPs were
   imported — the export carries them, and they were left where they are.

   The script defaults to a dry run and needs `--apply` spelled out, refuses the
   `unsubscribed` / `cleaned` / `nonsubscribed` exports by filename, and prints
   counts and truncated hashes but never an address. That is deliberate
   asymmetry: every other script here defaults to doing the thing, because every
   other thing can be undone.

   The full path was then exercised against the real list — 1,545 recipients →
   **16 chunks** → 1,545 distinct signed unsubscribe URLs. **The chunk files were
   not handed to `resend`.**

### What this decision retires

Self-hosting makes the Resend **Marketing** objects dead weight: the segment
`Newsletter` and topic `Monthly Newsletter` created during the 2026-08-28 account
migration, the `RESEND_NEWSLETTER_SEGMENT_ID` / `RESEND_NEWSLETTER_TOPIC_ID`
environment variables, and the broadcast wrapper `lib/newsletter/resend-api.ts`.

**Half done, 2026-08-29 — and the halves are not interchangeable.**

| | State |
|---|---|
| `lib/newsletter/resend-api.ts` | **Deleted** |
| `scripts/newsletter/setup-resend.ts`, `seed-pilot-contacts.ts` + its example CSV | **Deleted** |
| `RESEND_NEWSLETTER_SEGMENT_ID` / `_TOPIC_ID` in `.env.example` | **Removed** |
| Segment `Newsletter`, topic `Monthly Newsletter` in the Resend account | **Deleted 2026-08-29** (both held 0 contacts; the team-default segment `General` was left alone) |
| The same two vars on **Vercel production** | **Removed 2026-08-29** with `vercel env rm`; `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET` and `EMAIL_UNSUBSCRIBE_SECRET` confirmed untouched |

The code half was the urgent half, and the reason is the shape of the risk. The
danger was never a dormant object sitting in a console; it was a script in this
repo that would run, read the two env vars, print a segment id and a topic id,
and present dead configuration as current. Deleting the scripts removed that.
What is left is inert: nothing in the repo can reach those ids, so the worst a
leftover env var can now do is confuse a reader — which is what the table above
is for. Do not read the ids' continued existence as evidence the migration was
reverted, and do not re-add a wrapper "just to check them".

**The consent record moves from Resend to our database.** This overturns a rule
currently stated in `CLAUDE.md`, `docs/development/EMAIL_OPERATIONS.md` and
`consent-rules.md` — *"Resend's segment + topic membership is the only record of
who opted in"*. Those three places must be updated together with the schema, or
the repo will assert a rule its own code no longer implements. **The schema
landed on 2026-08-29** (`newsletter_subscribers`), so that window is open now.

---

## 6. The risks this decision accepts

**1. Compliance responsibility moves in-house.** What the Marketing plan is
really selling is not sending capacity — it is the consent, preference and
unsubscribe machinery that keeps complaint rates low. Building it means owning
it. A broken unsubscribe link for one day converts unsubscribes into spam
complaints.

**2. The complaint ceiling is account-wide and unforgiving.** 0.08% of 1,563
recipients is **1.25 complaints**. Two "mark as spam" clicks on a single send
exceeds the per-send rate. Transactional volume dilutes the account-wide
denominator, but the consequence of breaching it — *"your account may be shut
down without warning"* — would take **password resets and donation receipts down
with the newsletter**. This is the single largest operational risk in the plan.

**3. A 1,563-recipient send trips our own documented subdomain trigger.**
`EMAIL_AUTHENTICATION.md` lists a single send above ~1,000 recipients as a
trigger for splitting marketing onto `news.shesharp.org.nz`.

That same document, however, also says the From address **must not change**
(`She Sharp <newsletter@shesharp.org.nz>`), for the deliverability-continuity
reason that recipients have received it from that address for years. Both rules
cannot hold at once, and the tension is real.

**Recommended sequencing:** keep `newsletter@shesharp.org.nz` for the first
sends. Switching ESP, moving the list in-house *and* changing the From domain in
one month is three simultaneous variables, which the same document already warns
against in its "do not tighten DMARC and switch ESP in the same month" rule.
Revisit the subdomain once the send is boring. Pro allows 10 domains, so nothing
is foreclosed.

**Resolved 2026-08-29: the decision was taken not to split**, on exactly that
reasoning, and it is **recorded in `EMAIL_AUTHENTICATION.md`** under
"Sending-domain architecture" so a future session reads it as a decision rather
than as an unmet obligation. The trigger itself stays: the complaint-rate
(>0.10%) and hard-bounce-rate (>2%) arms are untouched and still fire, and the
recipient-count arm is to be revisited once the send is boring.

**4. Our unsubscribe endpoint becomes availability-critical.** Resend's hosted
unsubscribe page disappears from the picture. If `www.shesharp.org.nz` is down —
including during `MAINTENANCE_MODE=true`, which returns 503 for the whole site —
unsubscribe requests fail, against an AUP that requires honouring them within
seven days.

**Partly closed 2026-08-29.** `/api/email/unsubscribe` is now the single
`MAINTENANCE_EXEMPT_PATH` in `proxy.ts` — an exact-match single path, not a
prefix, so nothing else under `/api/` is exempt and a sibling route cannot widen
the hole by accident. That removes maintenance mode as a cause. A genuine outage
of `www.shesharp.org.nz` is not covered and cannot be, which is the residual
risk.

**5. The pre-send gates were doing no work, and nobody could tell.** Discovered
while building phase 3, and worth recording because the shape of it will recur.

The newsletter's event cover images were **WebP**, which Outlook on the desktop
cannot decode — every issue would have rendered a broken-image placeholder for
every Outlook reader. Worse, the committed issue fixtures still used the **flat
`/img/events/<slug>-cover.webp` naming that stopped existing at the 2026-08-19
one-folder-per-event migration**, so the covers were not merely unrenderable in
Outlook, they 404'd everywhere.

Two independent guards should have caught this and neither did:

- **The old Resend-broadcast path ran none of `lib/email/gates.ts`.** The
  approve route's only pre-send check was the renderer's own >100KB size throw;
  nothing called the gates. Both defects were found the first time the batch
  builder put the rendered message through the strict gates — i.e. they were
  found by phase 3 existing, not by anyone looking.
- **`scripts/assets/refs.ts` deliberately excludes absolute URLs** from its
  reference corpus, and the newsletter's `auto` block stores absolute URLs
  because email requires them. So the image guard that checks every reference
  resolves has never been able to see the newsletter fixtures.

Both defects are fixed — a committed email-safe JPEG twin (`cover-email.jpg`)
beside each cover, generated and verified by
`scripts/newsletter/email-covers.ts` (`--check`), with the six twins registered
in `KNOWN_UNREFERENCED` in `scripts/verify-image-paths.ts` and the reason written
at each entry. `email-covers.ts --check` **runs in CI** — a step in the
`verify-image-paths` job, immediately after the image-path gate it completes.

**Decided: the CI step is the permanent answer; `refs.ts` keeps its exclusion.**

The tempting alternative was to teach the corpus that
`https://www.shesharp.org.nz/img/...` is a `public/` reference, on the grounds
that the fixtures are now the live source for a real send rather than test data.
It does not survive contact with the repo. Six files hold an absolute
`shesharp.org.nz/img/...` URL. The three issue fixtures hold six such URLs and
all six resolve under `public/` — they are the `cover-email.jpg` twins. But
`lib/newsletter/render.test.ts` holds absolute URLs on fourteen lines resolving
to **eleven distinct paths, none of which exists** — `/img/events/june.jpg`,
`/img/newsletter/cover-june.jpg`, `/img/events/one.jpg` and so on, deliberate
invented fixtures, and exactly the "eleven invented fixture paths" the comment at
`scripts/assets/refs.ts` names. One regex cannot tell the two apart, so widening
the corpus turns eleven fixtures into eleven broken images. `NON_USE_SOURCES`
does not rescue it: `verify-image-paths.ts` applies `isNonUseSource` to the
**reverse** pass only, so the fix would need a new forward-exemption for a test
file. And `Reference.form` is a `"site" | "repo"` union that
`scripts/assets/apply-move.ts` consumes to decide what to substitute; an absolute
URL is neither.

The exclusion is therefore load-bearing, and the residual risk it leaves is
sharper than "the gate cannot see the fixtures". **A bare rename does fail**
`verify-image-paths.ts` — the twin becomes an orphan and its `KNOWN_UNREFERENCED`
entry goes stale. The dangerous case is a rename done properly. Those six paths
have exactly one source in the reference corpus: the allow-list entry in
`verify-image-paths.ts` itself. `apply-move.ts` rewrites that entry along with
the file, and the issue fixture — invisible to the corpus — is left pointing at a
path that no longer exists. All three checks then pass while the cover is dead.
So the corpus is blind to the fixtures in both directions: it neither guards them
nor moves them.

`email-covers.ts --check` closes it because it reads the fixtures themselves. It
is pure filesystem — `existsSync`/`readFileSync`/`statSync`; the
`execFileSync("ffmpeg", …)` call is only reached on the non-`--check` branch — so
it needs no network, no database and no image toolchain on the runner. It also
fails when the **source** image behind a twin has gone, which a reference corpus
can never see, because the twin's source is derived from the twin's name rather
than referenced anywhere.

---

## 7. Future option — AWS SES direct

Recorded as a real alternative, not a plan. **No action.**

Resend is a layer over Amazon SES; the proof is in our own DNS, where the
Return-Path MX is `feedback-smtp.us-east-1.amazonses.com`. "Replacing Resend"
therefore realistically means *using SES directly* — the same infrastructure and
the same IP reputation — not self-hosting an MTA.

| | Cost | Notes |
|---|---|---|
| Resend Transactional Pro | $20 / month | current |
| **AWS SES direct** | **~$0.16 / month** | $0.10 per 1,000, flat, **charged per recipient**; (1,563 + ~50) ≈ 1,613 |

Accounts created on or after 2025-07-15 get **no SES free tier**; SES is covered
by up to $200 of AWS credits, then standard rates. New accounts start in
**sandbox** — production access is requested through Service Quotas and typically
granted in 1–3 business days.

**The switching cost in code is genuinely low.** There is exactly **one**
`resend.emails.send` call site in the entire repository —
`lib/email/service.ts:152` — so a provider adapter is a small change.
`lib/newsletter/resend-api.ts` would be retired under this decision anyway.

**What you would give up:** Resend's dashboard, logs UI and delivery timeline;
the Svix webhook shape we already verify (SES uses SNS, a different signature
scheme, so `lib/email/webhook-verify.ts` would need a sibling); and the
convenience of a single vendor. You would gain: essentially-zero marginal cost,
and no daily cap to reason about.

**Do not attempt to self-host an MTA.** Vercel is serverless — there is no static
IP and no PTR/rDNS record to publish, so it would require a separate always-on
server (not free); most providers block outbound port 25 by default; and a new IP
carries no reputation, meaning weeks of warming during which password resets are
deferred or junked. Deliverability is a reputation asset maintained by people
over time, not a code artefact. This is the one part of the email system that
cannot be replaced by writing more code.

---

## 8. Open questions

| Question | Why it matters | Owner |
|---|---|---|
| Does Resend consider self-hosted bulk sending on Transactional to be "circumventing quotas"? | The only unresolved legal question | ask support from `website@shesharp.org.nz` |
| Does Resend maintain an **account-level suppression** that also blocks transactional sends? | Would be a safety net under a self-built list; the `email.suppressed` webhook event suggests one exists | verify in docs/support |
| Does Resend offer non-profit or education pricing? | She Sharp is registered charity **CC57025**; a third-party source reports the pricing FAQ mentions it, but it could **not** be confirmed on the page | ask support |
| How many webhook endpoints does Transactional **Free** allow? | Only Pro's "5" is published. Relevant only if downgrading is ever reconsidered | check before any downgrade |

---

## Related documents

- [`../deployment/EMAIL_AUTHENTICATION.md`](../deployment/EMAIL_AUTHENTICATION.md) — SPF/DKIM/DMARC, the account migration, the subdomain-split trigger
- [`EMAIL_OPERATIONS.md`](EMAIL_OPERATIONS.md) — the four sending streams and what currently lives in Resend vs the database
- [`EMAIL_ADDRESSES.md`](EMAIL_ADDRESSES.md) — every sending identity
- `.claude/skills/update-mailing-list/references/consent-rules.md` — the four consent routes and the tier model
- [`MAILCHIMP_ARCHIVE.md`](MAILCHIMP_ARCHIVE.md) — where the 1,560 figure and the campaign history come from
