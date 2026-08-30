# The three email platforms — what each holds, and where the migration stands

**Written 2026-08-30.** She Sharp's email runs across three platforms that were
never designed to work together: **Mailchimp**, which still sends the newsletter;
**Resend**, which is meant to replace it and has not yet sent a single issue; and
**Humanitix**, which is a ticketing product that also turns out to be a mail
system, complete with its own campaigns, its own opt-in and its own unsubscriber
list. A person arriving cold reads about one, assumes it is the whole picture,
and gets the state of the migration wrong.

This file is the **state-and-history layer**: an inventory of what each platform
holds, which parts are live, what has been decided and when, the handful of
places data crosses between them, and an honest list of what nobody has managed
to establish. It exists so that "where are we?" has one answer instead of eight.

## This file does not contain the rules

Four other documents are authoritative, and each is the *only* place its subject
is written down. Two copies of a rule is how one goes stale, so where this file
is tempted to explain a rule it links instead. If this file and one of these ever
disagree, **the other one is right**.

| Question | Authority |
|---|---|
| **May we email this person?** | [`.claude/skills/update-mailing-list/references/consent-rules.md`](../../.claude/skills/update-mailing-list/references/consent-rules.md) — the four audience tiers, the four consent routes, the two ways the list may grow |
| **Which system sends which mail?** | [`EMAIL_RESPONSIBILITY_BOUNDARIES.md`](EMAIL_RESPONSIBILITY_BOUNDARIES.md) — subscribers from this repo through Resend, one event's registrants from Humanitix, and the decision table |
| **How do we stop paying Mailchimp?** | [`../deployment/MAILCHIMP_CANCELLATION.md`](../deployment/MAILCHIMP_CANCELLATION.md) — the bilingual runbook, in order, with the export step first |
| **Why self-host the newsletter at all?** | [`EMAIL_PLATFORM_STRATEGY.md`](EMAIL_PLATFORM_STRATEGY.md) — the costed decision of 2026-08-28, and AWS SES as a future option |

Operational detail — the four sending streams, the webhook, the unsubscribe
token — is in [`EMAIL_OPERATIONS.md`](EMAIL_OPERATIONS.md). The two platform API
integrations are in [`PLATFORM_APIS.md`](PLATFORM_APIS.md).

## A note on numbers

**Every figure below carries the date it was taken, and none of them is current.**
The Mailchimp audience is still live and still accepting sign-ups, so it moves
daily. For the live subscriber count there is one command and it is not this file:

```bash
npx tsx scripts/email/suppression.ts reconcile
```

Where a figure came from a query, the query is named so it can be re-run. The
last section lists every measurement in this file and how to repeat it.

---

## The three platforms at a glance

| | **Mailchimp** | **Resend** | **Humanitix** |
|---|---|---|---|
| Role today | **Sends the newsletter** | Sends transactional mail; newsletter built but never sent | Sells tickets; **also sends registrant mail** |
| Role after cutover | data archive only | sends everything from this repo | unchanged — keeps sending registrant mail |
| Cost | paid monthly, being cancelled | Transactional Pro, $20/month, **kept** | free on the NZ charity rate |
| Consent record | its own audience | **`newsletter_subscribers` in our Neon database** | per-order opt-in flag |
| Driven from code? | read-only pulls, local tooling only | yes, the send path | reads only; **its mail features have no API at all** |
| Opt-out register | its own | `email_optouts` + the committed hash register | a third, **event-scoped**, console-only |

The single most-misread fact: **all three are sending mail today**, and after the
cutover **two** still will. Retiring Mailchimp is not a consolidation onto one
platform — it is a consolidation onto two, deliberately.

---

## Resend — the destination

**Plan.** Transactional **Pro, $20/month**, in the She Sharp-owned `shesharp`
team since 2026-08-28. Marketing stays on Free and is not used at all. Account
ids, the webhook, and the domain-claim history are in
[`EMAIL_OPERATIONS.md`](EMAIL_OPERATIONS.md) § "The Resend account".

**The newsletter is now the entire case for Pro.** Until 2026-08-30 there was a
second argument — event fulfilment mail, which could exceed Resend's Free
100-per-day cap. That argument is gone: `/send-event-emails` was retired and that
mail moved to Humanitix, which does not touch the Resend quota
([`EMAIL_PLATFORM_STRATEGY.md`](EMAIL_PLATFORM_STRATEGY.md) §1, updated for this).
So the plan is currently paying for a capability nothing uses. **The maintainer
has decided not to downgrade**: the cutover is going ahead, and Resend takes over
the functions Mailchimp performs today. Treat "why are we paying for this?" as
answered, not open.

### `newsletter_subscribers` — the consent record

This table, not any vendor's list, is the organisation's marketing-consent
record. What makes a row mailable is `consent-rules.md`'s business, not this
file's. What the table *contains* is:

**Measured 2026-08-30**, via `suppression.ts reconcile` and a direct
`GROUP BY` over the table:

- **1,549 mailable.**
- **Every row is `status = 'subscribed'`.** There are currently **no** `pending`,
  `unsubscribed`, `bounced` or `complained` rows at all — a state worth naming,
  because code that handles those statuses has never been exercised against real
  data.
- **Every row has `source = 'mailchimp-import'`.** The table has grown by exactly
  one mechanism so far.
- **1,545 carry a real `confirmedAt`**, taken from the 2026-08-17 export's
  `CONFIRM_TIME` column. **4 carry `null`** — imported from the Mailchimp
  Marketing API on 2026-08-30, which does not supply a usable `CONFIRM_TIME`
  (see "Two columns, and which one survives an API pull" below).
- **`source` does not separate those two groups.** Both say `mailchimp-import`.
  What separates them is the null `confirmedAt` and the `consentSource` sentence,
  which names the API pull and its date in full. If you need "which rows came
  from the API?", query `confirmed_at IS NULL`, not `source`.

**Nothing has ever been sent from this table.** A populated list is not a
cutover. The live newsletter still goes out from Mailchimp.

### The other two tables, and the committed register

Measured 2026-08-30:

| | Rows | Note |
|---|---|---|
| `email_events` | **6**, for **1 distinct person** | Test sends only. This is the whole send history of the new pipeline |
| `email_optouts` | **10** | Runtime opt-outs, written by the webhook and the one-click endpoint |
| `lib/data/json/email-suppression-hashes.json` | **2,144** hashes | Committed, hash-only, and the reason 15 rows were held back at import |

Both registers are do-not-contact lists and neither is a record of consent —
`consent-rules.md` is explicit about that and about why they are not inverses of
the subscriber table.

### The send path

```
scripts/email/recipients-from-db.ts        → reads the table, applies both registers
   ├─ scripts/newsletter/build-newsletter-batch.ts   the monthly newsletter
   └─ scripts/email/build-batch.ts                   any other announcement
a human runs `resend emails batch`         → the only step that puts mail in inboxes
```

**There are two batch builders and picking the wrong one is a real mistake.**
The newsletter is a React Email template driven by a validated issue file, not a
`MessageSpec`, so `composeMessage` has nothing to compose;
`build-newsletter-batch.ts` reuses `build-batch.ts`'s idempotency key, hash
ledger, manifest shape and chunk-file naming and swaps only the renderer. A
one-off announcement (`/email-the-community`, `/promote-event`) goes through
`build-batch.ts` directly.

Since 2026-08-30 the path can also be narrowed to an engagement cohort with
`--restrict-to-hashes`, which only ever removes rows
(`scripts/email/normalize-recipients.ts`). **Neither builder sends.** They write
files and print the commands; approving an issue does not send it, and every
batch command is run by a person.

---

## Mailchimp — the incumbent, being cancelled but not closed

**It is still the live sender.** As at 2026-08-30 the account's own
`campaign_last_sent` was **2026-08-27 20:37 UTC** — the 28th, New Zealand time.
The same call reports `campaign_count: 217`, which is campaigns in **any**
status referencing this audience, drafts included; it is **not** a send count.
The send history is the committed archive's **180 sends**
([`MAILCHIMP_ARCHIVE.md`](MAILCHIMP_ARCHIVE.md)), and the two must not be quoted
against each other.

### There is exactly one audience, and that constrains everything

`getLists()` on 2026-08-30 returned **one** list: **`She#`**, id `31bd05e8eb`,
data centre `us3`. So every option that begins "point the integration at a
different audience" or "move the newsletter people into their own list" is
**not available**. Whatever writes into Mailchimp writes into the same list the
newsletter is sent from.

### What the audience holds

Read from `/lists/{id}` and `/lists/{id}/members?status=` on **2026-08-30**:

| Status | Count |
|---|---|
| `subscribed` | **1,552** |
| `unsubscribed` | 810 |
| `transactional` (the console calls these *non-subscribed*) | 790 |
| `cleaned` (hard-bounced) | 552 |
| `archived` | 5 |

The console's headline **"3,152 contacts"** is `1,552 + 810 + 790` — subscribed
plus unsubscribed plus non-subscribed, **excluding** the 552 cleaned and the 5
archived. That decomposition is worth keeping, because the account produces at
least three defensible "total contacts" figures and people quote them against
each other. `MAILCHIMP_ARCHIVE.md` § "Eight ways to get a number wrong" is the
place that argument is settled.

### The gap between Mailchimp and our table

**Measured 2026-08-30**, comparing sha256 hashes of Mailchimp's `subscribed`
members against `newsletter_subscribers`:

- **1,552 in Mailchimp** against **1,549 mailable here**.
- Our table is a strict **subset**: **0 people are in ours and not theirs**.
- The **3** in Mailchimp only all carry `source: "Mahsa McCauley NZD"` — the
  string Humanitix's integration writes.

Earlier the same day the gap was 7, of which 4 had `source: "Hosted Signup Form"`
(they subscribed themselves on Mailchimp's hosted form) and were imported that
afternoon. The remaining 3 are still outside the table, pending a route-2 import.

**The asymmetry that produces this gap is structural, not an oversight.**
`suppression.ts pull-mailchimp` pulls people who *leave*. **Nothing pulls in
people who *join*.** While Mailchimp is still the live sender, new subscribers
keep arriving there and a send from our table would silently skip them. That is
now a numbered step — item 6 of **Step 8a** in `.claude/skills/monthly-newsletter/SKILL.md`
— and it is deliberately a *detection* step: it stops and reports, it does not
import.

**Do not remember any of these numbers.** Run the comparison. The audience's
`last_sub_date` on 2026-08-30 was **2026-08-28**, so it moves.

### Two columns, and which one survives an API pull

This matters because it decides whether an import may write `confirmedAt`, which
is the difference between recording a confirmation and inventing one.

**Measured 2026-08-30**, joining the 2026-08-17 vault export against a live API
pull across the 1,545 contacts present in both:

- **`timestamp_opt` *is* `OPTIN_TIME`.** Of the 1,545 shared contacts, **1,544
  have both values and every one differs by exactly the New Zealand offset —
  947 at +12h (NZST) and 597 at +13h (NZDT), with zero at any other offset.**
  The CSV is account-local time; the API is UTC. This retires the "unverified,
  likeliest explanation is account-local time" caveat in
  [`PLATFORM_APIS.md`](PLATFORM_APIS.md) § "Mailchimp — the counts match" — the
  explanation is now measured, not likely. The 1,545th contact has **no opt-in
  time on either side**; it reappears immediately below, and it is the same row
  both times.
- **`timestamp_signup` *is* `CONFIRM_TIME`.** The API populates it on **129** of
  the 1,545. On **128** of those the CSV's `CONFIRM_TIME` also differs from a
  populated `OPTIN_TIME` — the signature of confirmation as a separate act. The
  **129th is the contact with no `OPTIN_TIME` at all** (blank in the CSV, `null`
  in the API), so there is nothing for its `CONFIRM_TIME` to differ *from*; it
  still carries both a `CONFIRM_TIME` and a `timestamp_signup`.
- **Across all 129, the two agree to the New Zealand offset: 125 at +12h, 4 at
  +13h, zero at any other offset.**

> **Two counts, deliberately not merged.** 129 rows have `timestamp_signup`; 128
> rows have a `CONFIRM_TIME` that differs from a populated `OPTIN_TIME`. Writing
> either number as though it were both hides the one row that is in the first set
> and not the second. Restricting the offset table to the 128 gives 125/**3**
> rather than 125/**4** — same shape, one row apart, and it is that row.

**So the API does not withhold the column.** Mailchimp simply never recorded a
separate confirmation for the other **1,416**, where the CSV's `CONFIRM_TIME` is
a copy of `OPTIN_TIME` rather than evidence of a second act.

**Read that carefully before building an API-delta importer, because the obvious
summary of it is wrong.** The API is **not** strictly weaker than the CSV for
everybody: for the 129 it carries a real, correct confirmation timestamp, and an
importer could legitimately write `confirmedAt` from `timestamp_signup` **on
exactly those rows**. It is weaker only for the 1,416 the API leaves empty — and
because a delta pull cannot tell you in advance which group a new contact falls
into, the safe default stands: **an API-sourced import writes `confirmedAt` null,
and a fresh CSV export, not an API delta, is the way to close the joiner gap.**

The four rows imported from the API on 2026-08-30 were checked individually: all
four have `timestamp_signup: null`, so their null `confirmedAt` is **correct on
the facts as well as on the rule** — they fall in the 1,416 group. Their stored
`consentSource` sentence says the API "exposes no `CONFIRM_TIME` equivalent";
strictly it exposes one that is empty for them. **The rows are right and only the
general clause is loose, so this is not a reason to touch production data** — it
is recorded here so nobody reads that sentence as a statement about the API in
general. Whether to reword it is the maintainer's call.

### The archive page shows six months, not the archive

`MAILCHIMP_CONFIG.archiveUrl` — the site's **"Open full archive"** button and the
**"Read past issues"** footer link on every page — returns **HTTP 200** with
exactly **20** `<li class="campaign">` entries across **17 distinct dates**,
oldest **14 February 2026** (fetched 2026-08-30, reproduced for this file).
Mailchimp's own help page says the archive "shows links to the 20 most recent
emails sent to your audience"
(<https://mailchimp.com/help/about-email-campaign-archives-and-pages/>).

The button is therefore **already wrong today, on a paid plan**, and always was.
This is recorded in [`../deployment/MAILCHIMP_CANCELLATION.md`](../deployment/MAILCHIMP_CANCELLATION.md)
§ "The 'Open full archive' button is already wrong" with the two honest fixes.
**Do not re-litigate it here** — it is listed only so nobody discovers it a third
time and files it as a cancellation casualty. It is not one.

### Cancelling: the one fact that constrains everything else

Stopping payment means **pause** or **downgrade to Free**. There is no third
button, and the Free plan holds sending above **250 contacts**. The `She#`
audience is an order of magnitude larger, so **downgrading ends Mailchimp sending
immediately while keeping the data.**

That fixes the order of the whole migration: **the last Mailchimp send comes
before the downgrade, and the exports come before both.** Everything else —
which of pause or downgrade to pick, the one-per-lifetime downgrade, the ~50 live
site links into Mailchimp, what to export first — is in
[`../deployment/MAILCHIMP_CANCELLATION.md`](../deployment/MAILCHIMP_CANCELLATION.md).
**Cancel is not delete**, and that file exists largely to keep those apart.

---

## Humanitix — ticketing, and an email system of its own

The surprise for anyone who has only read `PLATFORM_APIS.md`: Humanitix is not
just a data source. **It sends mail, holds a marketing opt-in, and keeps an
unsubscriber register**, and none of that is reachable from code.

### None of its email features has an API

**Verified 2026-08-30** against <https://api.humanitix.com/v1/documentation/json>:
the Public API is **v1.21.0** with **14 endpoints** and **106 schemas**. The
strings `campaign`, `unsubscri`, `notify`, `follower`, `send` and `host profile`
appear **zero times** in the entire OpenAPI document.

**So no key, no scope and no amount of code can drive Humanitix's email
features.** When a check on one of them is described as manual, that is not an
unwritten client — there is nothing to call. `consent-rules.md` relies on this.

### Email campaigns — free, in the console, and already in use

Humanitix's Email campaigns tool is in **habitual use**, composed by hand in the
console by the people who organise events. What it may be used for, quoted from
Humanitix's own help centre, is in
[`EMAIL_RESPONSIBILITY_BOUNDARIES.md`](EMAIL_RESPONSIBILITY_BOUNDARIES.md)
§ "What Humanitix sends" — registrants only, always from a Humanitix address,
and the tool stops 14 days after the event ends.

**Page 1 of the campaign list**, read from the console on 2026-08-30, spans
**November 2025 to August 2026**:

| Read from the list view | When |
|---|---|
| three HCLTech rows — two reminders and a thank-you | 19, 20 and 24 Nov 2025 |
| `2026 IWD x AcademyEX event` | 5 Mar 2026 |
| a Metlifecare "Own Your Energy" pair, plus its thank-you | 15, 16 and 23 Apr 2026 |
| `Thank You for Joining Us @ MYOB` | Thu 6 Aug 2026, 12:00pm NZST |
| `Reminder I - September 2026 Les …`, subject "Join Us Tomorrow" | **Draft** |

**That is page 1 alone, and the pagination control showed a next arrow** — so
there are more campaigns than these, and **no total should be quoted from this
table**. Several names are truncated by the UI (the Les Mills row above ends in
an ellipsis because the console does); they are not full titles.

The console also carries its own banner above the campaign list:

> Please note, Email Campaigns should never be used for Marketing and
> Promotional material. Email Campaigns should only be used to communicate
> service-level info related to a customer's purchase.

This is a **different string** from the help-centre wording quoted in
`EMAIL_RESPONSIBILITY_BOUNDARIES.md`, not a variant of it — the help centre says
campaigns "cannot be sent to external databases" and are "intended for
service-level comms related to the event an attendee has registered for". Two
sources saying the same thing in different words. The help-centre one is
linkable; this one is only visible to someone signed in. Either way it is the
same fulfilment-only line `lib/email/audience.ts` draws from our side.

> **Provenance — weaker than everything else in this file, and the only part of
> it you could not re-derive yourself.** Everything above in this document was
> re-measured against a live API or the database when it was written. This
> subsection and the next were **not**, and cannot be: there is no API, no export
> and no history view behind them. They come from **the maintainer driving the
> signed-in Humanitix console through browser automation on 2026-08-30**, and
> the figures were read off screenshots by eye. The banner is transcribed rather
> than captured byte-for-byte. Treat all of it as evidence that the tool is in
> habitual use — which is what it was collected to show — and **not** as a
> register of what has been sent. If a detail here matters to a decision, open
> the console and look.

**Decided 2026-08-30: this stays in Humanitix, by hand, and is not coming into
this codebase.** `/send-event-emails` was deleted for exactly that reason
(PR #224). The three reasons, and the two costs the decision knowingly accepts,
are in `EMAIL_RESPONSIBILITY_BOUNDARIES.md` § "Why the boundary is where it is".

### A third unsubscribe register, which is not a do-not-contact list

Console → Email campaigns → **Unsubscriber list**
(<https://console.humanitix.com/console/comms/email-campaigns-unsubscriptions>),
columns Email / Event / Unsubscribed at. Its own description on the page:

> Attendees/buyers who have chosen to unsubscribe from receiving your event
> communications will no longer receive emails sent through email campaigns
> **for the event**.

Counted from the same console session on 2026-08-30, from two screenshots rather
than an export, so **read every figure here as approximate and as at that date**:
roughly **20 rows** and **13 distinct addresses**, spanning **2021-08 → 2025-11**
with nothing in 2026, and **no export control visible**. Clicking the next-page
arrow did not change the view — evidence that this is the whole list, **not
proof** of it.

It is **event-scoped** — each row says "stop emailing me about *this event*" —
so it is deliberately **not** folded into our suppression register. What it is
narrowly good for, and the `--event-unsubscribers-checked` acknowledgement that
gates a route-2 import on it, is in `consent-rules.md` § "A third register".
Do not reason about it from here.

### The marketing opt-in is a built-in on the order, not a host question

**Verified 2026-08-30** in the OpenAPI document: `organiserMailListOptIn` appears
**exactly once across all 106 schemas**, as a `boolean` on **`Order`**. It is
absent from `Event` and from `Ticket`. It is **not** one of the host's
`additionalQuestions` (which are defined on `Event`/`EventDate` and land in
`additionalFields`) — it is a built-in, uneditable control worded *"Keep me
updated on the latest news, events, and exclusive offers from the event host"*.

Recorded per order; it reaches us as a "marketing opt-in" column in the console's
**reports → orders → Export CSV** (the orders report, not the attendees one).

### The 2022 claim was wrong, and what replaced it is an open question

Two files in this repo used to say the checkout opt-in stopped being used after
May 2022. **They were corrected in PR #223** and the full working — the
measurement, both surviving readings, and what would settle it — is in
[`EVENT_LIFECYCLE_SOP.md`](EVENT_LIFECYCLE_SOP.md) § "Turn on the mailing-list
opt-in", with a shorter note in [`HUMANITIX_ARCHIVE.md`](HUMANITIX_ARCHIVE.md)
§ `marketingOptIn`.

The part that belongs here, because it is a **state** fact about a live crossing:
writes into Mailchimp with `source: "Mahsa McCauley NZD"` did **not** stop in
2022. Re-measured independently for this file on 2026-08-30, across all four
member statuses, counting arrivals by `timestamp_opt`: **663 with status
`subscribed` after 2022-05**, spiking at 2023-10: 80, 2023-11: 73, 2024-06: 85,
2025-06: 62, 2025-10: 80, spread over **41 of the 51 months from 2022-06 to
2026-08**, and still arriving in 2026 (2026-06: 2, 2026-07: 3, 2026-08: 5).
Counting *all* four statuses rather than
`subscribed` alone gives **996** over the same period. **Crossing 1 below is
live, not historical.**

**Two readings survive and neither is proven** — the opt-in has been collecting
all along and only the export column lapsed, *or* some of those writes are not
the integration but another API write under the same key. **Do not pick one.**
The orders CSV would settle it.

### A free channel nobody has looked at: notify-followers

Humanitix offers a free, one-per-event **notify-followers** email when a public
event is published: a template mail with a "Get Tickets" link, to everybody
following the host profile linked to that event, **toggled on by default**. The
full description, sourced to Humanitix's help centre, is in
`EMAIL_RESPONSIBILITY_BOUNDARIES.md` § "One free channel that belongs to
neither". What is worth separating here is the measured from the inferred,
because this is the shakiest ground in the file.

**Measured.** A host profile named **"She Sharp" exists** — one entry under
Account → Hosts, read from the console on 2026-08-30. And via `GET /v1/events`,
re-run for this file: all **59** events carry the same non-null `organiserId`
`5e3388f9a912950007fda1c7`, including the 3 September 2026 Les Mills event
(`6a422a2d01e463796c170142`, published).

**Inferred, and not established.** That `organiserId` *is* the host-profile
link. It is consistent with one, but the API exposes no host-profile object at
all, so the field cannot be matched to the profile the feature requires. **The
honest line is that the prerequisite appears met**, not that it is met — and if
no profile is in fact linked, the whole question below is moot.

**Not established, in two different ways.** Whether the mail has ever been sent
was **deliberately** not tested: the judgement was that the control which would
reveal the toggle's state is the same one that fires the send, so looking costs a
send to real people. **That is a risk judgement, not something Humanitix
documents.** And follower counts are **not exposed by the API** (`follower`
returns zero hits in the OpenAPI document) — but nobody has checked whether the
**console** shows one. There is a help article, "Manage your host profile
followers", that nobody has read. So: *not exposed by the API, and not checked in
the console* — **not** "not available".

### The PII boundary is unchanged

`/v1/events/{id}/orders` and `/v1/events/{id}/tickets` exist in the API and carry
names, emails, mobiles, addresses and live access codes — the `Order` schema
alone lists `firstName`, `lastName`, `mobile`, `email` and `accessCode`.
**`lib/humanitix/client.ts` deliberately does not implement them.** It exports
`listEvents`, `getEvent`, `getCheckInCount` and `listTags`, and nothing else — a
function that does not exist under `lib/` cannot be imported from `app/` by
mistake. Scripts may call the attendee endpoints; nothing under `lib/` may.
Full reasoning: [`PLATFORM_APIS.md`](PLATFORM_APIS.md) § "The PII boundary".

---

## The four crossings

There are only four places data moves between platforms, and knowing which of
them the cutover ends is most of the value of this file. **Two of them survive
switching the Humanitix → Mailchimp integration off, and one of those is
routinely assumed not to.**

| # | From → To | Mechanism | Ends when |
|---|---|---|---|
| **1** | Humanitix checkout opt-in → **Mailchimp `She#`** | The live Humanitix→Mailchimp integration, writing `source: "Mahsa McCauley NZD"` | The integration is switched off |
| **2** | Humanitix checkout opt-in → **`newsletter_subscribers`** | Orders CSV → `normalize-recipients.ts --for-import` → `import-optin-subscribers.ts` | **Never** — it does not use the integration |
| **3** | Mailchimp → **`newsletter_subscribers`** | `import-mailchimp-subscribers.ts` over an export CSV, plus the 2026-08-30 API delta | The last import before the last Mailchimp send |
| **4** | Mailchimp opt-outs → **the suppression register** | `suppression.ts pull-mailchimp` | The last Mailchimp send |

**Crossing 2 is the one that gets confused with crossing 1.** They start at the
same tick-box on the same checkout page and end in different places by different
routes. Crossing 1 is an integration Humanitix runs; crossing 2 is a human
exporting a CSV and running two scripts. **Switching the integration off does not
end crossing 2**, and describing it as "the Humanitix opt-in path" as though it
were one thing gets this wrong — it was got wrong once already on 2026-08-30.
Crossing 2 is `consent-rules.md`'s **route 2**, and it is the only sanctioned way
a registrant becomes a subscriber; `EMAIL_RESPONSIBILITY_BOUNDARIES.md`
§ "The one sanctioned crossing" is the full description.

**Crossing 4 runs in one direction only.** It takes people *off* the send. There
is no crossing that takes people *on* automatically — closing the joiner gap is
a manual export, every month, until the cutover. See "The gap between Mailchimp
and our table" above.

**What is deliberately not a crossing.** Humanitix's event-scoped unsubscriber
list is not merged into our register; registrant lists are never re-used as
mailing lists; and no query over the rest of the database produces a mailing
list. Each of those is a rule, not an oversight, and each has a home in
`consent-rules.md`.

---

## Decision log

Dated, with what each decision retired. Where a PR is named, the reasoning is in
its diff.

| Date | Decision | What it retired |
|---|---|---|
| **2026-08-28** | Keep **Resend Transactional Pro**; do **not** buy Marketing Pro; self-host the newsletter on the transactional batch API | Buying an ESP's marketing product; the assumption that the consent record lives at a vendor |
| **2026-08-28** | Move `shesharp.org.nz` into the She Sharp-owned Resend team via Domain Claim | The domain living in the maintainer's personal team |
| **2026-08-29** | The consent record is **our database**, not Resend | The Resend segment `95d452f5…` and topic `08e59693…` — both **deleted**, both held 0 contacts; their env vars removed from Vercel; `lib/newsletter/resend-api.ts` and two scripts deleted |
| **2026-08-29** | Import the 2026-08-17 Mailchimp export into `newsletter_subscribers` | The table being empty; 1,560 read, 15 held back by the suppression register, 1,545 written |
| **2026-08-30** | **Registrant mail stays in Humanitix**, composed by hand | `/send-event-emails` (PR #224) — it had never sent anything, its only input was a Humanitix CSV, and the team had done the job in Humanitix for a year |
| **2026-08-30** | The Humanitix event-scoped unsubscriber list is **not** folded into the suppression register; it gates a route-2 import instead | Over-suppressing someone permanently for muting one event years ago (PR #225) |
| **2026-08-30** | Route 2 gets a real tool: opt-in CSV → consent record | Improvising an `INSERT` for routes 2–4 (PR #223) |
| **2026-08-30** | The "checkout opt-in stopped in May 2022" claim is **withdrawn**, replaced by a measurement and an open question | A false statement in two docs (PR #223) |
| **2026-08-30** | Mailchimp is **cancelled, not closed**; the account and its data stay | The reading that cancellation means deletion (PR #229) |
| **2026-08-30** | Live subscriber counts are **not** hardcoded in prose | Stale numbers in eight documents (PR #226) |
| **2026-08-30** | **Do not downgrade Resend Pro** even though the newsletter is now its only justification | The "we could save $20" thread — answered, not open |

**Not yet decided, and blocking the cutover:** the date of the last Mailchimp
send, and whether the Mailchimp exit is a pause or a downgrade. The runbook is
written; nobody has picked a date.

---

## What could not be established

Listed so that the next person spends their time on something else, and so that
nobody mistakes an open question for a settled one.

1. **Whether the Humanitix checkout opt-in has been collecting since 2022.** Two
   readings survive: the opt-in has been collecting all along and only the
   export's `marketingOptIn` column lapsed; or some `Mahsa McCauley NZD` writes
   are not the integration but another API write under the same key. **The
   Humanitix console's reports → orders → Export CSV would settle it** — it
   carries a per-order marketing opt-in column. Nothing in this repository can.

2. **Whether the notify-followers email has ever been sent** — and, before that,
   **whether a host profile is linked to our events at all.** A "She Sharp" host
   profile exists and every event carries an `organiserId`, but nothing ties that
   field to the profile, so the prerequisite only *appears* met. The send itself
   was deliberately not tested on the judgement that the control revealing the
   toggle also fires it. Somebody publishing the next event can read the toggle
   in the console at publish time — **nobody should press it to find out.**
   Cheapest next step: read the "Manage your host profile followers" help
   article and open the host profile, neither of which sends anything.

3. **What happens to Mailchimp's hosted campaign pages after a downgrade.**
   About 50 live links on the public site point at `mailchi.mp` and
   `us3.campaign-archive.com` URLs. **Mailchimp documents nothing** about their
   fate on a downgraded plan. This is why the runbook's order puts the export
   first: it is the one step that does not depend on the answer. See
   `MAILCHIMP_CANCELLATION.md` §3.

4. **How much Humanitix email has actually been sent.** The campaign list above
   is **page 1 of more than one page**, so it is a floor and not a count. There
   is no API, no export and no total in the UI, so the only way to a real figure
   is somebody paging through the console and writing it down.

5. **How many of the 790 Mailchimp `transactional` contacts have a defensible
   consent story.** They are excluded from every send today, which is the safe
   behaviour, so nobody has needed the answer. If someone ever proposes importing
   them, they must go through `consent-rules.md` from the top like anyone else.

---

## Re-taking every measurement in this file

| Claim | How |
|---|---|
| Subscriber count, opt-outs, register size | `npx tsx scripts/email/suppression.ts reconcile` |
| Status / source / `confirmedAt` breakdown | `GROUP BY` over `newsletter_subscribers` |
| Mailchimp audience counts, last send | `GET /lists/{id}` and `/lists/{id}/members?status=…`, dc `us3` |
| Exactly one audience | `getLists()` in `lib/mailchimp/client.ts` |
| The Mailchimp ↔ our-table gap | Hash both sides with `hashEmail()` and diff; **never write addresses to disk** |
| `timestamp_opt` ↔ `OPTIN_TIME` | Join the vault export against a live pull; the difference is 12h or 13h |
| Humanitix API surface | `curl https://api.humanitix.com/v1/documentation/json` and count `paths` |
| `organiserMailListOptIn` placement | Search that OpenAPI document's `components.schemas` |
| `organiserId` across events | `GET /v1/events` with `x-api-key` |
| The archive page's 20 entries | `curl` `MAILCHIMP_CONFIG.archiveUrl`; count `<li class="campaign">` |
| The Humanitix campaign list, its banner, the unsubscriber list, the host profile | **Not re-takeable from code.** Sign in to the Humanitix console and look; there is no API, no export and no history view |

`MAILCHIMP_API_KEY` is **local tooling only** and nothing under `app/` may read
it; it expires **2027-08-27**. Credentials, rate limits and what each pull costs
are in [`PLATFORM_APIS.md`](PLATFORM_APIS.md).

---

## Related

- [`../../.claude/skills/update-mailing-list/references/consent-rules.md`](../../.claude/skills/update-mailing-list/references/consent-rules.md) — who may be emailed. The rule
- [`EMAIL_RESPONSIBILITY_BOUNDARIES.md`](EMAIL_RESPONSIBILITY_BOUNDARIES.md) — which system sends what
- [`EMAIL_PLATFORM_STRATEGY.md`](EMAIL_PLATFORM_STRATEGY.md) — why self-hosting, costed
- [`EMAIL_OPERATIONS.md`](EMAIL_OPERATIONS.md) — streams, webhook, the newsletter loop
- [`../deployment/MAILCHIMP_CANCELLATION.md`](../deployment/MAILCHIMP_CANCELLATION.md) — the exit runbook, bilingual
- [`../deployment/EMAIL_AUTHENTICATION.md`](../deployment/EMAIL_AUTHENTICATION.md) — SPF/DKIM/DMARC and the Resend migration
- [`PLATFORM_APIS.md`](PLATFORM_APIS.md) — the two API integrations and the PII boundary
- [`MAILCHIMP_ARCHIVE.md`](MAILCHIMP_ARCHIVE.md) / [`HUMANITIX_ARCHIVE.md`](HUMANITIX_ARCHIVE.md) — the committed archives and how their numbers go wrong
- [`EVENT_LIFECYCLE_SOP.md`](EVENT_LIFECYCLE_SOP.md) — the opt-in switch, and the 2022 measurement in full
