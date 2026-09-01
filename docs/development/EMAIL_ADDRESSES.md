# She Sharp email addresses

Every `@shesharp.org.nz` address this codebase uses, what it is for, and — new
in August 2026 — **whether it exists and whether a human reads it**.

There are two categories and confusing them causes real problems:

- **Public mailboxes** — addresses a visitor is invited to write to. Defined in
  `lib/config/contact-addresses.ts`.
- **Sending identities** — what this site sends mail *as*. Defined in
  `lib/email/senders.ts`, one per stream, and that file is the single source of
  truth. Never hard-code a From or Reply-To anywhere else.

An address in one category must not be used for the other. `noreply@` should
never be printed on a page as somewhere to write to, and `newsletter@` should
never be the Reply-To on anything.

## The 2026-08-23 audit

Until August 2026 this file ended with a section called "Not verified here",
which said that whether these mailboxes were monitored was an organisational
question rather than a code one, and left it there. It was wrong to leave it
there. **Seven of the eleven addresses this site published did not exist**, and
had never existed.

They were not decisions anybody made. `hello@` was invented on 2025-07-26 by a
contact-page redesign, and invented as `hello@shesharp.co.nz` — a domain the
organisation does not own, so for almost a year the contact page's headline
address could not have worked for anybody. The 2026-07-08 editorial redesign
quietly corrected the domain without anybody creating the mailbox.
`security@`, `support@` and `conduct@` arrived on 2025-08-09 with the security
policy and code of conduct page templates. None of the seven appears anywhere
in eleven years of the organisation's own records.

The cost was not hypothetical. On **2026-08-13** the National Convenor of the
Association for Women in the Sciences filled in the contact form and opened
with the observation that she had tried emailing and got a bounceback.

**How it was settled.** `shesharp.org.nz` is hosted on Google Workspace, which
rejects an unknown recipient at SMTP time. `scripts/email/probe-mailboxes.ts`
sends one message to each candidate through Resend and reads the outcome back;
a `bounced` verdict means no mailbox and no alias. Rerun it whenever this table
matters — that is the point of it existing.

## Monitored — safe to publish

| Address | Exists | Read by | For |
|---|---|---|---|
| `info@` | ✅ 2026-08-23 | a volunteer, once or twice a week | General enquiries. The address on the organisation's business cards, and the only one anybody has ever confirmed on the record that a human opens |
| `mentoring@` | ✅ 2026-08-23 | the mentorship lead, who gives it out as his own contact address | Everything about the mentorship programme. **Only that** — until 2026-09-01 it was the Reply-To on the whole `transactional` and `notification` streams, so password resets, donation receipts, membership payments, volunteer interviews and newsletter confirmations all invited a reply into one person's contact address. `lib/email/reply-to.ts` now routes by what the message is about |
| `industry@` | ✅ 2026-08-23 | no standing owner since 2025; confirmed still receiving 2026-08-07 | Sponsorship and industry partnership |
| `events@` | ✅ 2026-08-23 | shared; also the ticketing account login | Attendee questions about a specific event. Printed in every event email the organisation has sent for years |
| `people@` | ✅ 2026-08-23 | shared; applications arrive here | Volunteer and ambassador applications |
| `website@` | ✅ 2026-08-23 | the founder and the site developer | Technical. Also the Google account behind Resend and the old Webflow site — see the caution below |
| `mahsa@` | ✅ 2026-08-23 | the founder | Her own mailbox. Not published on the site |

## Exists, but nobody is on duty

Mail sent here arrives and then stops. **Do not publish any of these, and do
not use one as a Reply-To.**

| Address | Note |
|---|---|
| `newsletter@` | The `marketing` From, and the visible sender on every newsletter for years. As of 2026-08-17 nobody on the team had its password, and a direct question in Slack about whether anyone read it went unanswered. It was also the Reply-To until this audit, so every subscriber who pressed Reply wrote into it |
| `marketing@` | Asked in August 2025 who had access; never answered, and the address has not been mentioned since |
| `governance@` | Published on `/volunteers/code-of-conduct`, and it does accept mail — but it appears nowhere in the organisation's records and no reader is known. Treated as unmonitored until someone claims it |
| `finance@` | Real; last seen in use 2025 |
| `podcast@` | Real; its password was posted in a public Slack channel in 2023 and has not been rotated |
| `admin@` | A real mailbox. **Not** the same thing as the site's seed admin login of the same name in `scripts/reset-db-and-create-admin.ts` |

## Retired 2026-08-23 — these never existed

Every one hard-bounced. The replacement column is what the page says now.

| Address | Was published on | Replaced by |
|---|---|---|
| `hello@` | `/contact`, the chatbot, the unsubscribe page, and as an approved From | `info@` |
| `conduct@` | `/code-of-conduct`, the event feedback form's private-report line | `info@` (see the caveat below) |
| `security@` | `/security-policy` | `website@` |
| `support@` | `/security-policy` | deleted; the page links to `/contact` |
| `privacy@` | `/privacy-policy`, `/cookie-policy`, and the photography notice on every event page | `info@` |
| `accessibility@` | `/accessibility` | `info@` |
| `legal@` | `/terms-of-service` | `info@` |
| `unsub@` | Nothing — it was the notional value for `EMAIL_UNSUBSCRIBE_MAILTO` | Nothing. **Leave that variable unset**: the HTTPS one-click URL alone satisfies RFC 8058 |
| `workshops@` | Nothing since 2021 | Nothing |

### Two routes that deserved better than a shared inbox

`CONDUCT_EMAIL` and `PRIVACY_EMAIL` both point at `info@` today, and both are
compromises rather than good answers.

A **code of conduct report** should reach a small, named, accountable group.
`info@` is a shared inbox opened about weekly whose contents are mostly
advertising. It is strictly better than an address that bounces, and that is
the entire argument for it. Standing up a real `conduct@` as a restricted group
is the first item on `docs/deployment/WORKSPACE_MAILBOX_CHECKLIST.md`.

The **photograph-removal route** on every event page is a published commitment
made in `docs/development/PHOTOGRAPHING_MINORS.md`, which noted at the time that
someone would have to actually monitor `privacy@`. Nobody could have: it did not
exist. A parent asking for a photograph of their child to be taken down would
have received a bounce.

## Sending identities

Set by stream in `lib/email/senders.ts`; see
`docs/deployment/EMAIL_AUTHENTICATION.md` for the DNS side.

| Stream | From | Reply-To | One-click unsubscribe | Honours opt-outs |
|---|---|---|---|---|
| `transactional` | `noreply@` (overridable by `EMAIL_FROM`) | `mentoring@` | No | Never — a suppressed address must still get a password reset |
| `notification` | `noreply@` | `mentoring@` | Yes (RFC 8058) | Yes |
| `marketing` | `newsletter@` | **`info@`** | Attached by Resend | Via Resend topics |
| `internal` | `noreply@` | `website@` | No | No |

**The `marketing` From and Reply-To are deliberately different.** The From must
stay `newsletter@`: it carries years of accumulated engagement history, and
changing the visible sender during an ESP migration would start a cold bulk
identity on exactly the send where reputation matters most. The Reply-To
carries none of that, and pointed at a mailbox nobody could open.

`info@` is the approved 1:1 sender — contact replies and event fulfilment. It
replaced `hello@` in `APPROVED_FROM_ADDRESSES`, which matters more than it
looks: **sending as a non-existent address works fine**, because Resend signs
at the domain. What breaks is the recipient pressing Reply. That asymmetry is
why the problem stayed invisible for a year.

`dmarc@` and `tlsrpt@` are DNS reporting addresses and appear only in the
deployment docs.

## The one wrong-domain literal, and how it was retired

`lib/db/migrations/0008_add_notifications_table.sql` created an `email_queue`
table whose `from_email` defaulted to `noreply@shesharp.org` — **missing the
`.nz`**. A From on that domain would fail both the `from-identity` gate and
DMARC alignment.

It could never actually send anything. The table is absent from
`lib/db/schema/`, so Drizzle does not know it exists; no route, service or
script reads or writes it; and it is not present in the production database
either. But an inert wrong-domain sender literal is precisely what a future
reader revives by accident, so **`0031_drop_dead_email_queue.sql` drops the
table**.

Two things about the shape of that fix:

- **0008 is left byte-identical.** Drizzle records a hash per migration and
  applies anything it does not recognise, so editing an applied file makes it
  look new and re-runs it — which for 0008 means *creating* this table rather
  than removing it.
- **The drop is `IF EXISTS`.** It is a no-op against production, where the
  table is already gone, and a cleanup in any environment that ever built it.
  It carries no data risk: nothing has ever written a row to it.

## Related

- `lib/config/contact-addresses.ts` — the public mailboxes
- `lib/email/senders.ts` — the sending identities
- `scripts/email/probe-mailboxes.ts` — rerun the audit
- `docs/deployment/WORKSPACE_MAILBOX_CHECKLIST.md` — what only the Workspace
  super-admin can fix
- `docs/deployment/EMAIL_AUTHENTICATION.md` — SPF, DKIM, DMARC and the
  Mailchimp → Resend migration
