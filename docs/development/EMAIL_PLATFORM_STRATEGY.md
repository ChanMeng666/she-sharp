# Email Platform Strategy — what we pay for, what we build, and why

**Decision date:** 2026-08-28
**Status:** decided; implementation not started

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
2. **Event fulfilment mail.** `/send-event-emails` mails a Humanitix
   registrant list. The ticketing archive holds 5,156 tickets across 62 ticketed
   instances — an **average of ~83 per event**. A typical event squeezes under
   100; a large one (the hackathons) does not.

Point 2 matters even in a world with no newsletter, and it is the reason Pro is
not obviously droppable today.

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

### Must change — small

- **`buildStreamHeaders()` in `lib/email/service.ts`** currently reads
  `if (stream !== 'notification') return {};`. The `marketing` stream therefore
  receives **no** `List-Unsubscribe` / `List-Unsubscribe-Post` headers, because
  Resend attached them for broadcasts. Self-hosted marketing mail must emit them
  itself. The token builder and URL construction already exist; only the stream
  test has to widen.

### Must be built — the real work

1. **A subscribers table.** There is currently **no table anywhere in
   `lib/db/schema/` holding an email address together with a subscription
   consent flag.** `email_optouts` is hash-only (`emailHash` PK, `stream`,
   `reason`, `createdAt`) — you can *check* a hash, you cannot *enumerate*
   recipients from it. `eventRegistrations.interestedInNewsletter` exists but its
   own schema comment says it is explicitly **not** consent to marketing email.
2. **A subscribe funnel that is actually wired up.**
   `app/api/newsletter/subscribe/route.ts` exists but **nothing in the codebase
   calls it**, and it writes to Resend. Six components point at
   `MAILCHIMP_CONFIG.subscribeUrl` instead.
3. **Double opt-in**, to produce the evidence the AUP's "explicitly opted in"
   requires.
4. **A DB → recipients bridge** so `build-batch.ts` can be fed from the
   subscribers table rather than a CSV.
5. **Open/click analytics**, if wanted: enable domain-level tracking and capture
   `email.opened` / `email.clicked` webhook events into our own table.

### What this decision retires

Self-hosting makes the Resend **Marketing** objects dead weight. The segment
`Newsletter` and topic `Monthly Newsletter` created during the 2026-08-28 account
migration, the `RESEND_NEWSLETTER_SEGMENT_ID` / `RESEND_NEWSLETTER_TOPIC_ID`
environment variables, and the broadcast wrapper `lib/newsletter/resend-api.ts`
all become unused. They should be decommissioned deliberately rather than left to
rot — a dormant segment id in an env var is exactly the kind of thing a future
session mistakes for live configuration.

**The consent record moves from Resend to our database.** This overturns a rule
currently stated in `CLAUDE.md`, `docs/development/EMAIL_OPERATIONS.md` and
`consent-rules.md` — *"Resend's segment + topic membership is the only record of
who opted in"*. Those three places must be updated together with the schema, or
the repo will assert a rule its own code no longer implements.

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

**4. Our unsubscribe endpoint becomes availability-critical.** Resend's hosted
unsubscribe page disappears from the picture. If `www.shesharp.org.nz` is down —
including during `MAINTENANCE_MODE=true`, which returns 503 for the whole site —
unsubscribe requests fail, against an AUP that requires honouring them within
seven days.

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
