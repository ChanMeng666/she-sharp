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

**The She Sharp database has no marketing-consent field.** There is no
`subscribed` column, no `opt_in_at` timestamp, no `subscribers` table. Look for
one before you doubt this — it is not there.

That is not an oversight to route around. It means a database query **cannot**
produce a mailing list, because the information that would make it a mailing
list was never collected. A `SELECT email FROM event_registrations` returns
people who wanted a seat at one event. Nothing in that row says they wanted
anything else, and no amount of SQL can invent the missing consent.

**Resend's segment + topic membership is the only record of who opted in.** It
is the source of truth. This skill's `state/roster.json` is a run log, not a
roster; `lib/data/json/email-suppression-hashes.json` is a do-not-contact
register, not an inverse of one.

## The four audience tiers

| Tier | Who they are | What may be sent | Channel | How they get out |
|---|---|---|---|---|
| **0** | Resend contacts in a segment, opted into the topic | Anything — newsletters, campaigns, event promotion, transactional | Resend **broadcast** against a segment/topic | One-click unsubscribe in every broadcast; Resend records it permanently |
| **1** | People who wrote to us (`contact_form_submissions`) | A 1:1 reply to the thing they asked about. Nothing else, ever | Individual transactional email | Not applicable — a reply is a one-off, there is nothing to unsubscribe from |
| **2** | Event registrants, mentor/mentee/volunteer applicants, donors, platform account holders | Only mail that **fulfils what they signed up for**: joining instructions for that event, an update on their own application, a receipt for their own donation | Individual transactional email, or a per-event batch | Not applicable, but every such mail should carry a subscribe link so they can opt UP to Tier 0 |
| **3** | Scraped addresses, inherited spreadsheets, LinkedIn exports, "someone gave me their card", anything whose origin nobody can name | **Nothing. Ever.** | — | — |

`lib/email/audience.ts` encodes this as `assertSendAllowed({ category, tier })`,
which throws before the first send. It is a backstop, not a substitute for
thinking: it can tell you a Tier 2 list may not receive a campaign, but only a
human can say which tier a list actually belongs to.

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

## Consent: pick one of four, or stop

Before **any** row enters Resend contacts, you must be able to say **where** and
**when** that person agreed to receive email from She Sharp. There are exactly
four acceptable answers. If none of them fits, the import does not happen.

**1. The website subscribe form.**
Record: "Website newsletter subscribe form" + the date. These arrive already
opted in; they are the only self-service path and the cleanest source.

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

### If you cannot pick one

Say so plainly and stop. Then offer the alternative that always works:

> I can't establish where these people opted in, so I can't add them to the
> mailing list. What I can do is give you a subscribe link to send them — inside
> an email they're already expecting, like the event follow-up — and everyone
> who clicks it lands on the list with consent we can point to.

This is not a lesser outcome. A list of 40 people who chose to be there
outperforms 400 who didn't, and it is the only version that survives a
complaint.

## The only two legal ways the list grows

1. **Someone subscribes themselves.** Website form, or a subscribe link they
   clicked in mail they had already asked for.
2. **Someone ticks an opt-in box on a form they were filling in anyway**, and
   that tick is recorded with the question and the date.

That is the complete list. There is no third route, and in particular there is
no "they'd probably want it" route. If you find yourself constructing an
argument for why a group would surely be happy to receive the newsletter, you
have already left the rules — that argument is exactly what the tiers exist to
stop.

## Unsubscribed means permanently, everywhere

**A contact with `unsubscribed: true` in Resend is never re-added. Not by an
import, not by hand, not because their address appears in a newer file.**

The trap is mechanical and easy to fall into: someone unsubscribes in March. In
July they register for an event, so their address is in the July attendee
export. That export has no idea they unsubscribed. Import it with
`--on-conflict upsert` and their opt-out is silently overwritten — they get the
next newsletter, and the only thing they learn about She Sharp is that
unsubscribing doesn't work.

This is why `diff-roster.ts` queries Resend live on every run and reports
`unsubscribed` as its own bucket. Those rows must be removed from the file
before importing.

The only way back onto the list is the person themselves, through the website
form. If someone tells you "actually she does want it again", the answer is to
send her the subscribe link, not to flip the flag.

Alongside this, `lib/data/json/email-suppression-hashes.json` (via
`scripts/email/suppression.ts`) holds hashed addresses that must never be
contacted at all — bounces, complaints, explicit demands to be left alone. It
stores only sha256 digests, so it carries no personal data and is safe to
commit. `normalize-recipients.ts` consults it automatically on every run.

## Handling the files

Attendee exports are lists of real people's names, addresses and often their
employers. Treat them accordingly.

- **CSVs live in `tmp/` or are named `*.local.csv`.** `.gitignore` covers both
  (`tmp/` and `**/*.local.csv`). Anywhere else and one `git add .` publishes a
  hundred people's addresses to a public repository, where deleting the file
  does not remove it from history.
- **Never paste raw addresses into Slack, a commit message, a plan block or a
  report.** Every script here masks them (`j****@gmail.com`); keep it that way.
- **Never write addresses into `state/roster.json`** or any other committed
  file. Counts, hashes and prose only.
- **Delete the CSV when the work is done.** The mailing list lives in Resend;
  the CSV is scaffolding.

## When someone asks "why is this person on our list?"

You must be able to answer. That is the whole point of recording a consent
statement with every import (`roster-state.ts record --consent "…"`) and of
requiring `--consent-source` + `--consent-date` on `--for-import`.

If the honest answer is "I don't know", the person should not have been added —
and the fix is to remove them (`resend contacts delete <email> --yes`), not to
compose a better-sounding guess.
