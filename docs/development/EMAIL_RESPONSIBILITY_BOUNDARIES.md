# Email responsibility boundaries — which system sends what

Two questions decide every She Sharp email, and they are not the same question:

1. **Who is being written to?** A newsletter subscriber, or an event's ticket
   buyers. That is a **consent** question, and it is already answered elsewhere
   — the four audience tiers in
   `.claude/skills/update-mailing-list/references/consent-rules.md`, enforced in
   code by `assertSendAllowed()` in `lib/email/audience.ts`.
2. **Which system sends it?** This repository through Resend, or Humanitix's own
   Email campaigns tool. That is what this document answers, and it is the only
   thing this document answers.

**This file deliberately does not restate the tier rules.** Two copies of a
consent rule is how one of them goes stale. Read `consent-rules.md` for what may
be said to whom; read this for where the send is composed and what leaves the
building.

## The answer in one table

| The people | Their tier | Composed in | Sent by | From |
|---|---|---|---|---|
| Newsletter subscribers | Tier 0 | this repo | Resend | `newsletter@shesharp.org.nz` |
| One event's ticket buyers | Tier 2 | Humanitix console | Humanitix | a Humanitix-owned address |
| Someone who wrote to us | Tier 1 | this repo | Resend | `info@shesharp.org.nz` |
| A person acting on their own account | Tier 2 | this repo | Resend | `noreply@shesharp.org.nz` |

The same human can occupy two rows at once. **The tier is a property of the
permission, not of the person** — a Les Mills ticket buyer who is also a
subscriber gets the joining instructions from Humanitix and the monthly
newsletter from us, and neither send may borrow the other's list.

### Who runs each of these

Recorded because it is not derivable from the code, and because it decides
whether a gap is worth building for.

| Loop | Owned by | Tooling |
|---|---|---|
| The monthly newsletter | the **newsletter team** | `/monthly-newsletter`, in this repo |
| Promoting an event to subscribers | the **marketing team** | `/promote-event` → `/email-the-community`, in this repo — **but the August 2026 campaigns went out from Mailchimp**; see "The frequency cap counts one pipeline" below |
| Fulfilment mail to one event's registrants | the **events team** | **the Humanitix console, by hand** |

The developer's job is the skills, not the sending — every real send is run by
the team that owns the loop, and **only the founder approves a broadcast**.

**The events team's loop is hand-work, and that is a finished answer rather than
a gap to close.** Verified 2026-08-30 by driving the signed-in console: the
campaign editor is a form — campaign name, Reply-To `events@shesharp.org.nz`,
an event picker, `Buyers only` / `All`, a recipient filter — over a
what-you-see-is-what-you-get body with `@FirstName`-style merge codes. A sent
campaign locks, and the console offers **Duplicate** instead. That is visible in
the record: **127 campaigns** carry names like `Internatinoal womens day`,
`eductaors`, `remider` and `intructions`, with the same misspellings reappearing
a year apart because the duplicate carried them, and two pairs sent eleven
minutes apart. No automation produces that. **This repository needs no change
for it**, which is the same conclusion `/send-event-emails` was deleted on.

---

## What this repository sends

Everything here goes through Resend, from `shesharp.org.nz`, and is subject to
the same three things: the sending identity in `lib/email/senders.ts`, the
pre-send checks in `lib/email/gates.ts`, and — for anything marketing — a
one-click unsubscribe plus a row in `email_events`
(`lib/db/schema/system.ts`).

| What | Skill or trigger | Audience |
|---|---|---|
| The monthly newsletter | `/monthly-newsletter` | subscribers |
| Event **promotion** — telling people an event is coming up | `/promote-event`, which hands over to `/email-the-community` | subscribers |
| A one-off announcement to the whole list | `/email-the-community` | subscribers |
| A reply to somebody who used the contact form | `/reply-to-contact-messages` | that one person |
| Transactional mail — verification, password reset, receipts, mentorship application updates | the application itself | that one person |

### The four sending identities

Read from `lib/email/senders.ts`, which is the source of truth; this table is a
convenience, not a second copy to edit.

| Stream | From | Reply-To |
|---|---|---|
| `transactional` | `She Sharp <noreply@shesharp.org.nz>` | `mentoring@shesharp.org.nz` |
| `notification` | `She Sharp <noreply@shesharp.org.nz>` | `mentoring@shesharp.org.nz` |
| `marketing` | `She Sharp <newsletter@shesharp.org.nz>` | `info@shesharp.org.nz` |
| `internal` | `She Sharp <noreply@shesharp.org.nz>` | `website@shesharp.org.nz` |

`info@shesharp.org.nz` is additionally an approved **From** for one-to-one mail
sent by the skills, without being any stream's default. `EMAIL_FROM` overrides
the `transactional` From only — deliberately, because letting it override the
others is what once sent the marketing broadcast from `noreply@`.

Every address must sit on `shesharp.org.nz`: Resend DKIM-signs with
`d=shesharp.org.nz`, so a From anywhere else loses DMARC alignment and is
dropped without a bounce. `gateFromIdentity` blocks that before the send rather
than after. DNS side: `docs/deployment/EMAIL_AUTHENTICATION.md`.

---

## What Humanitix sends

Mail to the people who **registered for one event** — reminders, joining
instructions, room numbers, the thank-you — is composed and sent by hand, in the
Humanitix console, by the She Sharp members who organise events. There is no
skill for it here, no script, and no code path. That is the decision, not an
omission.

Everything below is quoted from Humanitix's own help page, which is the
authority on its own tool:
<https://help.humanitix.com/en/articles/8888873-contact-your-guests-using-the-email-campaign-tool>

- **The audience is that event's registrants and nobody else.** Recipients are
  "registered attendees of your event(s)", segmentable by all buyers, buyers plus
  per-ticket attendees, selected orders, or ticket type. **You do not choose who
  is on the list**, which is the point.
- **It always leaves a Humanitix address.** "Email campaigns are always sent
  from the Humanitix email domain." Linking a host profile changes the sender
  **name** only; with no host profile, the event name appears as the sender name.
- **14 days after the event ends, the tool stops.** "You can send an email
  campaign to any event that has ended within the last 14 days. Once this period
  has passed, you will not be able to send an email campaign."
- **It cannot be pointed at a list of ours.** Campaigns "cannot be sent to
  external databases of email addresses, such as for event invitations, and
  should not be used for promotional or marketing material." The tool is
  "intended for service-level comms related to the event an attendee has
  registered for", and marketing to past attendees about new events is
  explicitly discouraged.

That last bullet is the same fulfilment-only line `lib/email/audience.ts` draws
from our side. **The boundary did not move when the tool did.**

---

## Why the boundary is where it is

`/send-event-emails` was a skill in this repo that mailed an event's
registrants. It was **deleted on 2026-08-30** (PR #224,
`chore/retire-send-event-emails`). Three reasons, in the order they matter:

1. **Its only input was a Humanitix CSV export.** So it could only ever serve an
   event already ticketed on Humanitix — exactly the set Humanitix's own free
   tool already covers. It could not reach one person Humanitix could not.
2. **It had never sent anything.** Its ledger was empty from the day it was
   written.
3. **The team had been doing the job in Humanitix for a year.** The skill was
   competing with a working habit, not replacing a gap.

A code path bringing that mail back into this repo was considered and rejected
on the same grounds. It would need a registrant list, and the only registrant
list is Humanitix's.

### What that knowingly gives up

Both of these are real costs, accepted deliberately. Do not let anyone rediscover
them as bugs.

- **Registrant mail does not come from `shesharp.org.nz`.** None of the SPF,
  DKIM or DMARC work in `docs/deployment/EMAIL_AUTHENTICATION.md` applies to it,
  and none of it ever will while Humanitix sends it. The sender name can say
  "She Sharp"; the address cannot.
- **After 14 days there is no tool for a late follow-up.** A gallery link or a
  write-up that is ready three weeks later has nowhere to go — not Humanitix
  (the window has closed) and not here (registrants are Tier 2, and a gallery
  mail to them from us would be sending to a list we hold for a different
  purpose). Send the thank-you the day after, not when the photographs are
  ready. This is why the T+1d row in `docs/development/EVENT_LIFECYCLE_SOP.md`
  is a deadline rather than a preference.

---

## The frequency cap counts one pipeline, and the list has two

**Recorded 2026-08-31.** Promoting an event to subscribers is the marketing
team's loop, and until it moves to `/promote-event` it runs in **Mailchimp**,
which this repo cannot see. The three-per-month marketing cap counts only the
two ledgers in this repository, so in **August 2026 it reported `0/3` for a
month in which the subscriber list received five marketing emails** — four
Mailchimp event campaigns (18, 22 and twice on 27 August) plus the monthly
newsletter on the 31st. **July 2026 has the same shape.**

The cap was not breached by this repository; every send it made was within the
limit. What was breached is the thing the cap stands for — how often one
person's inbox is touched — and that is split across two pipelines nobody was
counting together. **A subscriber does not experience a boundary between
systems, and the frequency control is the one place that matters.**

The fix is a printed notice rather than a reader: every command that shows the
figure names Mailchimp as uncounted and calls the number *recorded in this
repo*. It is meant to be deleted once event promotion runs through
`/promote-event` and no further campaign is sent from Mailchimp. Full history,
the table of the five sends, and the three alternatives that were refused:
[`EMAIL_PLATFORM_STATE.md`](EMAIL_PLATFORM_STATE.md) § "August 2026 was a
five-email month against a cap of three".

The practical rule for anyone running a send today: **when the cap reports a low
number, ask the marketing team what has gone out from Mailchimp before you use
the headroom.**

---

## The one sanctioned crossing: registrant → subscriber

The two systems hold two lists that must not be merged. There is exactly one
path by which a person moves from the Humanitix side to ours, and it is
**consent route 2** in `consent-rules.md`:

1. At Humanitix checkout, the buyer ticks the built-in, uneditable marketing
   opt-in — *"Keep me updated on the latest news, events, and exclusive offers
   from the event host"*. It is recorded per order as
   `Order.organiserMailListOptIn`.
2. It reaches us as a "marketing opt-in" column in the console's **reports →
   orders → Export CSV** (the orders report, not the attendees one).
3. `scripts/email/normalize-recipients.ts --for-import` reads it, then
   `scripts/email/import-optin-subscribers.ts` writes the ticks into
   `newsletter_subscribers` — dry run by default, `--apply` to write, and
   `--apply` additionally requires `--event-unsubscribers-checked`.

That is the whole crossing. **Nobody re-uses a registrant list as a mailing
list**, and no query over the rest of the database produces one either. The full
rules, including what the script refuses and why `confirmedAt` is null on every
row it writes, are in `consent-rules.md` and in the script's own header.

There is also a **third register** neither system syncs: Humanitix keeps a
per-event unsubscriber list in its console that no API and no export can reach.
It is event-scoped, so it is **not** a general do-not-contact list and is
deliberately not folded into ours. `consent-rules.md` explains what it is
narrowly good for.

---

## Decision table

| I want to… | Where | Who receives it |
|---|---|---|
| Tell people about an upcoming event | **this repo** — `/promote-event`, which hands over to `/email-the-community` | newsletter subscribers |
| Send the monthly newsletter | **this repo** — `/monthly-newsletter` | newsletter subscribers |
| Tell ticket buyers where the room is, or remind them it is on | **Humanitix** → the event → Email campaigns | that event's registrants |
| Thank the people who came, within 14 days | **Humanitix** → Email campaigns | that event's registrants |
| Add ticket buyers who ticked the opt-in to the newsletter | **this repo** — `scripts/email/import-optin-subscribers.ts` | nobody: it writes the consent record, it sends nothing |
| Answer somebody who used the contact form | **this repo** — `/reply-to-contact-messages` | that one person |
| Email everyone who ever attended a She Sharp event | **No.** There is no such send | — |

The last row is not a missing feature. Registering for one event is not
subscribing; consent does not transfer between lists; and a database query cannot
produce a mailing list. `assertSendAllowed()` throws before the first message
leaves the machine, and `consent-rules.md` is the rule it encodes.

---

## One free channel that belongs to neither

Humanitix has a **notify-followers** email, and it is worth knowing about
because it is free, independent of both systems above, and easy to be unaware of.

Per Humanitix's help centre
(<https://help.humanitix.com/en/articles/11131467-notify-your-followers-of-your-new-event>):
when a **public** event is published, the organiser is offered a one-off
template email to everybody following the **host profile linked to that event**,
carrying a "Get Tickets" link. It is **toggled ON by default**, can be sent only
**once per event**, fires at the moment of publication (or at a chosen later
date), and does not appear at all if no host profile is linked.

**The preconditions *appear* met on our events — appear, not are.** Checked
against the Humanitix API on 2026-08-30 (`GET /v1/events`, 59 events): every one
is `published: true` and every one carries the same non-null `organiserId`,
`5e3388f9a912950007fda1c7`. 51 of the 59 are `public: true`, the 8 others
private. The 3 September 2026 Les Mills event (`_id`
`6a422a2d01e463796c170142`) is public, published, and carries that
`organiserId`. That is consistent with a linked host profile and is **not proof
of one** — the API exposes no host-profile object, so the field cannot be matched
to the profile the feature requires, and if no profile is in fact linked the
whole question is moot. `EMAIL_PLATFORM_STATE.md` § "A free channel nobody has
looked at" states it the same way; this sentence used to assert it flatly and
contradicted that file.

Two things that check does **not** establish, stated so nobody over-reads it:

- **`organiserId` is not proven to be the host-profile link.** It is consistent
  with one — a single id across the whole account — but the API exposes no
  host-profile object, so the field cannot be matched to the profile the
  notify-followers feature requires. `consent-rules.md` records that `notify`,
  `follower` and `host profile` appear nowhere in the Humanitix OpenAPI document
  (checked 2026-08-30 against
  <https://api.humanitix.com/v1/documentation/json>). The console is the only
  place the link is visible.
- **Whether the toggle was ever actually left on is not visible at all**, and it
  was deliberately not tested: the control that would show its state is the same
  control that fires the send. Somebody publishing the next event can read the
  toggle in the console at publish time. Nobody should press it to find out.

---

## Related

- `.claude/skills/update-mailing-list/references/consent-rules.md` — the tiers,
  the four consent routes, and the registers. **The authority on who may be
  emailed**; this document only says from where.
- `docs/development/EMAIL_OPERATIONS.md` — the streams, the skills, the
  newsletter loop, the shared render/gate pipeline.
- `docs/deployment/EMAIL_AUTHENTICATION.md` — SPF, DKIM, DMARC, and why none of
  it covers Humanitix-sent mail.
- `docs/development/EVENT_LIFECYCLE_SOP.md` — where each of these sends sits in
  one event's timeline.
- `docs/development/AI_SKILLS_GUIDE.md` §6.3 — the same boundary written for a
  non-technical teammate, with what to put in each Humanitix campaign.
- `docs/development/PLATFORM_APIS.md` — what the Humanitix API reaches, and the
  PII boundary enforced by absence.
