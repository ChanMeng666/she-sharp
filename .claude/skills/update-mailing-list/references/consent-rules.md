# Consent rules — who She Sharp may email, and why

This is the shared compliance baseline for every She Sharp email skill
(`update-mailing-list`, `email-the-community`, `reply-to-contact-messages`).
When any of them has to decide "may we send this to these people?", the answer
is here.

It also states the rule for mail this repo no longer sends. Tier 2 fulfilment
mail to one event's registrants is now sent from **Humanitix -> Email
campaigns**, and the tier below is what may go in it — the boundary did not move
when the tool did. Humanitix draws the same line from its own side: campaigns
"cannot be sent to external databases of email addresses, such as for event
invitations, and should not be used for promotional or marketing material".

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

### A third register, which is not a do-not-contact list

**Humanitix keeps an unsubscriber list of its own, and almost nobody here knows
it exists.** Console → Email campaigns → **Unsubscriber list**
(<https://console.humanitix.com/console/comms/email-campaigns-unsubscriptions>).
Its own description: attendees and buyers who unsubscribed "will no longer
receive emails sent through email campaigns **for the event**". Observed live on
2026-08-30, paged to the end: **28 rows over 21 distinct addresses**, columns
Email / Event / Unsubscribed at, spanning **2021-08 → 2026-06**, and **no export
control**. One row is She Sharp's own mailbox unsubscribing from a She Sharp
event.

**It has more than one page, and this file said it did not.** The earlier
reading — "roughly 20 rows, 13 addresses, nothing in 2026, one page" — rested on
the next-page arrow appearing to do nothing. Requesting page 2 directly returns
8 more rows, including the two most recent. So when you check a list before an
import, **page to the end and confirm the last page is empty**; an arrow that
does not respond is not an answer. The two 2026 rows belong to the academyEX IWD
2026 and Metlifecare "Own Your Energy" events, which are precisely the recent
events a route-2 import would concern.

**It is event-scoped, so it is emphatically NOT a general do-not-contact list,
and it is deliberately not folded into the two registers above.** Each row says
"stop emailing me about *this event*" — not "stop emailing me". Hashing those
addresses into `email-suppression-hashes.json` would permanently block someone
from the newsletter because they once muted one event's reminders years ago:
over-suppression on weak evidence, into a one-way hash file that cannot
practically be undone.

What it *is* good for is one narrow contradiction. If somebody unsubscribed from
**event X's** communications and then appears in **event X's** opt-in import,
those two facts are about the same event and they disagree; do not add them.
`import-optin-subscribers.ts` enforces exactly that much and no more: `--apply`
refuses without `--event-unsubscribers-checked`, and `--exclude <address>` drops
a hit by hash without ever writing the address anywhere. **The flag is an
acknowledgement, not a verification**, and the reason is not that nobody has
written the client — it is that **no endpoint exists**. The Humanitix public API
is v1.21.0 with 14 endpoints, and `campaign`, `unsubscri`, `notify`, `follower`,
`send` and `host profile` appear **nowhere** in its OpenAPI document (checked
2026-08-30 against <https://api.humanitix.com/v1/documentation/json>). Add the
missing export button and there is still nothing to call. A human looking is the
only check there is.

### Where things actually stand

Be precise about this whenever it comes up, because the table's existence
invites the assumption that it is populated:

- The subscriber table is populated — **1,549 mailable as at 2026-08-30**, and
  it moves; `npx tsx scripts/email/suppression.ts reconcile` prints the live
  figure. **Read the `Mailable after suppression` line**, not the first one —
  `reconcile` prints four, and `Subscribed rows` is the count *before*
  `selectMailable()` applies the two registers. They agreed on 2026-08-30
  (1,549 and 1,549, no drift), which is exactly when the difference is invisible
  and the habit of reading the wrong line forms. Most of it is the 2026-08-17 Mailchimp export, imported on 2026-08-29
  (1,560 read, 15 held back by the suppression register, 1,545 written), and
  every one of those rows carries the export's own `CONFIRM_TIME`. **Recording
  that timestamp is right; reading it as a double opt-in for everybody is not.**
  Measured 2026-08-30 over the export: `CONFIRM_TIME` is populated on all 1,560,
  but it is **equal to `OPTIN_TIME` on 1,431** of them — the same instant, not a
  second act — and differs on only **128**. Mailchimp writes the column either
  way, copying the opt-in time when it never recorded a separate confirmation.
  So the honest claim is that we hold a consent timestamp Mailchimp wrote, not
  that 1,545 people clicked a confirmation link. The four added from the
  Marketing API on 2026-08-30 carry a **null** `confirmedAt`; the API's
  `timestamp_signup` is the same column, and it is empty for exactly those four.
- **The list has been sent to once.** On **2026-08-31** the August 2026
  newsletter went to all 1,549 mailable rows through Resend's batch API — the
  first broadcast in the table's history, and the cutover. Mailchimp's last
  newsletter was the July 2026 issue. Two things that follow, and both matter
  when weighing a consent question: **one send is not a track record**, so
  nothing here has become routine; and **no delivery outcome is established** —
  Resend accepted 1,549 messages, and the complaint rate that would tell us
  whether this list tolerates being mailed has not been read yet
  (`npx tsx scripts/email/send-stats.ts`). Read it before arguing that a weak
  provenance tier is safe to mail.
- **Three quarters of the list cannot answer "why is this person here?"**
  Measured 2026-08-30: **752 of the 1,549** are on it because they bought a
  Humanitix ticket and never ticked any opt-in, and a further **416** have
  unrecoverable provenance (`Import`, `API - Generic`, `Admin Add`, `Unknown`).
  The Humanitix → Mailchimp integration wrote the first group in with its "Sync
  contacts who haven't opted-in" setting on. This is **not** proof they lack
  consent — but the evidence that would establish it does not exist either, and
  that is the same operational answer. The tiering, its limits and what follows
  are in `docs/development/EMAIL_PLATFORM_STATE.md` § "How the list was actually
  acquired". **It changes no rule below.**
- The Resend segment and topic were **deleted on 2026-08-29**, holding nobody at
  the time, and their two env vars came off Vercel production with them. Nothing
  in Resend is the consent record any more; the table is.

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
`Humanitix checkout opt-in "Keep me updated on the latest news, events, and
exclusive offers from the event host" — AUT July Workshop, 2026-07-15`. Two
conditions, both mandatory:
- The form must genuinely have had that question. Look at the CSV column. If
  there is no opt-in column, there was no opt-in — a form that only asked for a
  name and a ticket type cannot retroactively have asked for consent.
  **`--for-import` now refuses to run at all on such a file** (it did not until
  2026-08-30: its row filter only fired when an opt-in column was mapped, so a
  file that had never asked the question passed through whole, reporting
  `Excluded 0`). If the column exists under a name the detector missed, map it
  with `--map "optIn=<that column>"` — do not work around the refusal.
- Only rows that answered **yes** may be imported. `--for-import` drops the
  rest automatically; do not override it.

This is the one of routes 2–4 that has a tool, because it is the only one whose
evidence arrives as a column in a file rather than as somebody's recollection.
**`scripts/email/import-optin-subscribers.ts`** reads the recipients file
`normalize-recipients.ts --for-import` wrote and writes the ticks into the
table. It composes the sentence above from `--event-name`, `--event-date` and
the question text rather than accepting a free-text one, because a sentence
that can omit the event is a rule that can be skipped. **It also refuses a file
with no opt-in column**, independently of the gate in `--for-import`: a
recipients file can reach it without ever having been through that flag — built
for a fulfilment send, produced before the gate existed, or edited by hand — so
it re-checks rather than trusting the file it is handed. Dry run is the
default; `--apply` writes — and `--apply` additionally requires
`--event-unsubscribers-checked`, the acknowledgement that a human has read that
event's Humanitix unsubscriber list (the third register, above).

For **Humanitix**, the opt-in is a built-in, uneditable checkout control
(`organiserMailListOptIn` on the order) whose wording is fixed to the sentence
quoted above. It is not one of the host's own additional questions.

**Start with the script, not the console** (since 2026-09-01):

```bash
npx tsx scripts/humanitix/export-optins.ts --slug <site-event-slug>          # dry run
npx tsx scripts/humanitix/export-optins.ts --slug <site-event-slug> --write
```

It reads that one event's orders through a field allowlist, keeps only the
completed orders carrying a tick, and writes a CSV into `tmp/humanitix/` with
the exact headers `normalize-recipients.ts` detects — then prints the two
commands below with `--event-name` and `--event-date` already filled in from the
listing, so nobody hand-types a date that is a day out. It also states **how
many of the rows are already on the suppression register**, so the real yield is
visible before the import runs rather than after. It prints no address, and it
refuses to write anywhere outside `tmp/`.

It refuses a historic event unless you pass `--allow-historic`, because of the
account-wide shape of the backlog: of the 97 people who ever ticked the box and
are not already on the list, **89 are on the suppression register and only 8 are
importable, all 8 from 2026**. An import can never resurrect somebody who left.

The console's **reports → orders → Export CSV** — the orders report, not the
attendees one, with its "marketing opt-in" column — still works and is the
documented fallback when the API is unavailable or the event predates the
account the key belongs to. Any other platform's wording must be passed
explicitly with `--question "…"`.

**Routes 3 and 4 still have no tool and are not getting one**: a paper sheet and
a written request are one person at a time, and the honest answer to a stack of
them is the subscribe link.

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

**The Mailchimp carry-over is not one of those three, and it already ran.** Its
1,545 rows carry that account's `OPTIN_TIME` in `consentDate`, the export's
provenance sentence in `consentSource`, and — unlike routes 2, 3 and 4 — a
**real `confirmedAt`**, read from the export's own `CONFIRM_TIME`. That is not
fabricating an act: those people did press a confirmation button, in Mailchimp,
and we have the date they pressed it. Writing a null there would have thrown
away evidence, which is the opposite failure. What keeps them visibly distinct
from route 1 is `source = 'mailchimp-import'` plus that provenance sentence, and
between them they answer "why is this person on our list?" more completely than
a null could. The header of `scripts/email/import-mailchimp-subscribers.ts` sets
out the same reasoning at the point where it is enforced.

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

Note also what an **import** cannot do. `selectMailable()` re-admits a
suppressed subscriber only when their `confirmedAt` is **later** than the
suppression covering them, and an import's consent is older than the register by
construction. A row with no confirmation evidence carries a null and loses
outright. The Mailchimp carry-over's `confirmedAt` is *not* null — but it is a
2019–2026 `CONFIRM_TIME`, and the register entry that would block such a person
was stamped by `pull-mailchimp` on the day it was pulled, which is later than
any of them. Either way the suppression is the newer act. An import can never
resurrect someone.

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

- `source` — the machine-readable route: `website-form`, `registration-optin`
  (route 2), or the import's name (`mailchimp-import`). It names the route, not
  the platform — the platform is in the sentence below, beside the question it
  asked
- `consentSource` — the sentence a human wrote and would have to stand behind
- `consentDate` — when they agreed
- `confirmedAt` — when they clicked a confirmation button: ours, or the sending
  platform's where an import carried that date (the Mailchimp carry-over did,
  from `CONFIRM_TIME`). Null only for an import with no such evidence
- `consentIp` and `consentUserAgent` — captured by the website form only

Read one row with:

```powershell
npx tsx scripts/email/inspect-subscribers.ts --email someone@example.com
```

It masks the address, so the output is safe to paste into a PR or Slack.

If the honest answer is still "I don't know", the person should not have been
added — and the fix is to remove them, not to compose a better-sounding guess.
