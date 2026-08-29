# Consent rules — who She Sharp may email, and why

This is the shared compliance baseline for every She Sharp email skill
(`update-mailing-list`, `send-event-emails`, `email-the-community`,
`reply-to-contact-messages`). When any of them has to decide "may we send this
to these people?", the answer is here.

It is written for the person who would have to explain the decision afterwards —
to a recipient who is annoyed, to a board member, or to the Privacy
Commissioner. If a rule below feels inconvenient, that is the rule doing its
job.

## The one fact everything follows from

**There is exactly one table in the She Sharp database that records marketing
consent, and it is `newsletter_subscribers`.** A row there says who, when, by
which route, and — for anyone who came through the website form — that they
clicked a confirmation link we sent them. Only a row whose `status` is
`subscribed` may be mailed.

Everything else in the database still records nothing of the kind. There is no
`subscribed` column on `users`, no `opt_in_at` on `event_registrations`, no
consent field on the donation, mentor, mentee, volunteer or contact tables, and
there never was. Look before you doubt it — it is not there.

So the old rule survives its rewrite intact, and this is the sentence to
remember:

> **A database query cannot produce a mailing list. A query of
> `newsletter_subscribers` can, and it is the only one that can.**

`SELECT email FROM event_registrations` returns people who wanted a seat at one
event. Nothing in that row says they wanted anything else, and no amount of SQL
can invent the missing consent. What changed in August 2026 is that the missing
consent now has somewhere to live when it *is* collected — not that it can be
inferred where it was not.

Two supporting registers sit beside the table and are not inverses of it:
`email_optouts` (written by the Resend webhook and the one-click unsubscribe
endpoint) and `lib/data/json/email-suppression-hashes.json` (hash-only,
committed). Both are do-not-contact lists. Neither is a record of consent.

### Where things actually stand

Be precise about this whenever it comes up, because the table's existence
invites the assumption that it is populated:

- The subscriber table holds **1,545** rows, imported from the 2026-08-17
  Mailchimp export on 2026-08-29 (1,560 read, 15 held back by the suppression
  register). Every row carries the export's own `CONFIRM_TIME`, so each one
  double-opted-in — in Mailchimp.
- **Nothing has ever been sent** from it, and the live newsletter still goes out
  from Mailchimp. A populated list is not a cutover.
- The **live newsletter still goes out from Mailchimp.**
- The Resend segment and topic still physically exist and hold nothing. They
  were deleted on 2026-08-29, and are no longer the consent record.

## The four audience tiers

| Tier | Who they are | What may be sent | Channel | How they get out |
|---|---|---|---|---|
| **0** | A row in `newsletter_subscribers` with `status = 'subscribed'` | Anything — newsletters, campaigns, event promotion, transactional | Resend **batch** send, built from the table by `recipients-from-db.ts` | One-click unsubscribe in every send; recorded in `email_optouts` **and** on the subscriber row itself |
| **1** | People who wrote to us (`contact_form_submissions`) | A 1:1 reply to the thing they asked about. Nothing else, ever | Individual transactional email | Not applicable — a reply is a one-off, there is nothing to unsubscribe from |
| **2** | Event registrants, mentor/mentee/volunteer applicants, donors, platform account holders | Only mail that **fulfils what they signed up for**: joining instructions for that event, an update on their own application, a receipt for their own donation | Individual transactional email, or a per-event batch | Not applicable, but every such mail should carry a subscribe link so they can opt UP to Tier 0 |
| **3** | Scraped addresses, inherited spreadsheets, LinkedIn exports, "someone gave me their card", anything whose origin nobody can name | **Nothing. Ever.** | — | — |

`lib/email/audience.ts` encodes this as `assertSendAllowed({ category, tier })`,
which throws before the first send. It is a backstop, not a substitute for
thinking: it can tell you a Tier 2 list may not receive a campaign, but only a
human can say which tier a list actually belongs to.

Only Tier 0's *location* and *exit* changed. Everything the tiers mean, and
every judgement they force, is unchanged.

### The rule the tiers exist to enforce

**Consent does not transfer between lists.** Someone who registered for the AUT
July workshop consented to hear about the AUT July workshop. They did not
consent to the newsletter, to the next event, or to a donation appeal. The same
address can be Tier 2 for one purpose and Tier 0 for another, at the same time,
and the tier is a property of *the permission*, not of *the person*.

Concretely, none of these is a subscription:

- Registering for an event
- Making a donation
- Applying to mentor, to be mentored, or to volunteer
- Filling in the contact form
- Creating a platform account
- Emailing us directly
- Attending and signing a paper sheet with no opt-in wording on it

Having a row in `newsletter_subscribers` is not a subscription either, unless
its status is `subscribed`. A `pending` row is somebody who asked and has not
yet confirmed; mailing them anything but their own confirmation link would
defeat the entire mechanism.

## Consent: pick one of four, or stop

Before **any** row reaches `status = 'subscribed'`, you must be able to say
**where** and **when** that person agreed to receive email from She Sharp. There
are exactly four acceptable answers. If none of them fits, the import does not
happen.

**1. The website subscribe form — now a real, self-service, double opt-in
route.**
This is the strongest evidence the organisation has ever held, and it is worth
understanding what it now produces. Someone fills in the form at
`/newsletter/subscribe`. `POST /api/newsletter/subscribe` writes a **`pending`**
row recording the address, the moment, the source `website-form`, the consent
sentence, their IP and their user agent — and emails them a link. The link opens
a page with a **button**; only pressing it POSTs to `/api/newsletter/confirm`,
and only that sets `confirmedAt` and `status = 'subscribed'`.

Confirmation is deliberately never a GET, because corporate mail gateways and
link scanners fetch every URL in an incoming message before a human sees it. A
scanner-confirmed subscription would be indistinguishable from a real one and
would fabricate the very evidence this system exists to hold.

Record: "Website newsletter subscribe form" + the date — but in practice the row
records itself, which is the point. Six entry points across the site (the
footer, the newsletter archive, and four places in the mentorship pages) send
people here.

**2. A tick-box on a registration form.**
Record: the exact question text, the event name, and the event date — e.g.
`Humanitix checkout question "Can we email you about future She Sharp events?",
AUT July 2026`. Two conditions, both mandatory:
- The form must genuinely have had that question. Look at the CSV column. If
  there is no opt-in column, there was no opt-in — a form that only asked for a
  name and a ticket type cannot retroactively have asked for consent.
- Only rows that answered **yes** may be imported. `--for-import` drops the
  rest automatically; do not override it.

**3. A paper sign-in sheet.**
Record: the event, the date, and confirmation that the sheet carried opt-in
wording. Ask the colleague directly: *"Does the paper sheet have a line saying
they agree to receive emails from She Sharp — and did the people you're adding
tick it?"* A sheet that collected names for a fire-safety headcount is not
consent, however friendly the room was.

**4. The person asked, in writing, to be added.**
Record: who asked, when, and where it is written down (an email, a Slack DM, a
reply to a newsletter). One person at a time — this path never justifies a bulk
import.

### Two grades of consent, and why they stay visibly different

Routes 2, 3 and 4 produce a row with a `consentSource`, a `consentDate` and a
**null `confirmedAt`** — because those people never clicked our confirmation
link. That is honest and it is sufficient. It is also not the same thing as
route 1, and the table refuses to pretend otherwise: writing an import date into
`confirmedAt` would fabricate an act that never happened.

The same applies to the Mailchimp carry-over when it eventually runs. Those rows
will carry that account's `OPTIN_TIME` in `consentDate` and the export's
provenance sentence in `consentSource`, and `confirmedAt` will stay null.

### If you cannot pick one

Say so plainly and stop. Then offer the alternative that always works:

> I can't establish where these people opted in, so I can't add them to the
> mailing list. What I can do is give you a subscribe link to send them — inside
> an email they're already expecting, like the event follow-up — and everyone
> who clicks it lands on the list with consent we can point to.

That link is `https://www.shesharp.org.nz/newsletter/subscribe`, and since
August 2026 it does the whole job by itself, including the confirmation step.
This is not a lesser outcome. A list of 40 people who chose to be there
outperforms 400 who didn't, and it is the only version that survives a
complaint.

## The only two legal ways the list grows

1. **Someone subscribes themselves.** The website form, or a subscribe link they
   clicked in mail they had already asked for. This is now the fully
   self-service path, and it needs nobody's help.
2. **Someone ticks an opt-in box on a form they were filling in anyway**, and
   that tick is recorded with the question and the date.

That is the complete list. There is no third route, and in particular there is
no "they'd probably want it" route. If you find yourself constructing an
argument for why a group would surely be happy to receive the newsletter, you
have already left the rules — that argument is exactly what the tiers exist to
stop.

## Unsubscribed means permanently, everywhere

**Someone who has left is never re-added by an import, by hand, or because their
address appears in a newer file.**

"Has left" now has three shapes, all of them recorded on the subscriber row
itself: `status` is `unsubscribed` (they used the one-click link),
`bounced` (their address is dead), or `complained` (they marked a send as spam).
Alongside those sit the two do-not-contact registers — `email_optouts`, written
by the Resend webhook and by `/api/email/unsubscribe`, and the committed
hash-only file. All three exit routes reach the subscriber table through
`unsubscribeByHash()`, `markBouncedByHash()` and `markComplainedByHash()`, keyed
on a hash, because a hash is all the unsubscribe token carries.

The trap is mechanical and easy to fall into: someone unsubscribes in March. In
July they register for an event, so their address is in the July attendee
export. That export has no idea they unsubscribed. Import it carelessly and
their opt-out is silently overwritten — they get the next newsletter, and the
only thing they learn about She Sharp is that unsubscribing doesn't work.

**The way back is still, and only, the person themselves through the website
form — and the code now enforces that rather than trusting us to.** Two
functions implement it:

- `decideSubscribe()` in `lib/newsletter/subscribers.ts` deliberately does
  **not** block a previously-unsubscribed address from subscribing again. It
  would contradict the rule if it did: this form is the sanctioned way back.
- `selectMailable()` in `scripts/email/mailable.ts` decides who a send actually
  reaches. An address on a suppression register is not automatically dropped:
  **if they confirmed a new subscription later than the suppression was
  recorded, the newer deliberate act wins and they are mailable again.** Without
  that, someone who unsubscribed in 2024 and signed up again this morning would
  get a confirmation email, see themselves on the list, and never receive
  anything — the worst of both worlds, and invisible from the outside.

**A spam complaint is the one thing nothing reverses.** `selectMailable()`
checks for it *before* comparing any timestamps, so no ordering of events can
route around it, and `subscribe()` refuses a complainer outright. The
account-wide complaint ceiling is 0.08% — about 1.25 complaints on a full send —
and breaching it takes password resets down with the newsletter. A second
complaint from an address that already filed one is the most expensive email She
Sharp can send.

Note also what an **import** cannot do: a row with a null `confirmedAt` never
outranks a suppression, because its consent predates the register by
construction. An import can never resurrect someone.

If someone tells you "actually she does want it again", the answer is to send
her the subscribe link, not to flip anything.

To see whether the two sides have drifted apart:

```powershell
npx tsx scripts/email/suppression.ts reconcile
```

It reports mailable subscribers who also sit on a register, and separately the
ones a later confirmation legitimately brought back. A persistent drift count
means a write path is not updating the subscriber table — find it rather than
living with the strip.

## Handling the files

Attendee exports are lists of real people's names, addresses and often their
employers. The subscriber table is the first thing in this repo holding a bulk
list of real addresses whose only purpose is bulk mail. Treat both accordingly.

- **CSVs live in `tmp/` or are named `*.local.csv`.** `.gitignore` covers both
  (`tmp/` and `**/*.local.csv`). Anywhere else and one `git add .` publishes a
  hundred people's addresses to a public repository, where deleting the file
  does not remove it from history.
- **Never paste raw addresses into Slack, a commit message, a plan block or a
  report.** Every script here masks them (`j****@gmail.com`); keep it that way.
  `inspect-subscribers.ts` and `recipients-from-db.ts` print masked addresses
  and truncated hashes for exactly this reason.
- **Never write addresses into `state/roster.json`** or any other committed
  file. Counts, hashes and prose only.
- **Never export the subscriber table into `lib/data/json/`.** CI has leak
  guards for the archive data; this table would sail past them and must not be
  tried.
- **Delete the CSV when the work is done.** The mailing list lives in the
  database; the CSV is scaffolding. Recipients files land in `tmp/` for the same
  reason — they do hold addresses.

## When someone asks "why is this person on our list?"

You must be able to answer, and now the answer is a row rather than a
recollection. Every subscriber carries:

- `source` — the machine-readable route (`website-form`, or the import's name)
- `consentSource` — the sentence a human wrote and would have to stand behind
- `consentDate` — when they agreed
- `confirmedAt` — when they clicked our confirmation button, or null if they
  came from an import with external provenance
- `consentIp` and `consentUserAgent` — captured by the website form only

Read one row with:

```powershell
npx tsx scripts/email/inspect-subscribers.ts --email someone@example.com
```

It masks the address, so the output is safe to paste into a PR or Slack.

If the honest answer is still "I don't know", the person should not have been
added — and the fix is to remove them, not to compose a better-sounding guess.
