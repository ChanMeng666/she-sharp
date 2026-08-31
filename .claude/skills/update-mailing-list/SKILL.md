---
name: update-mailing-list
description: Inspect and safely change who is on She Sharp's newsletter mailing list — the `newsletter_subscribers` table, which is now the organisation's marketing-consent record — using `scripts/email/inspect-subscribers.ts`, `scripts/email/audience-report.ts`, `scripts/email/normalize-recipients.ts` and `scripts/email/suppression.ts`. Use whenever the user wants to see or change who is on the list — phrases like "add these attendees to the mailing list", "who's on our email list?", "import this sign-up sheet", "subscribe these people", "take her off the list", "how many subscribers do we have?", "why is this person getting our emails?" — or anything about unsubscribes, bounces, complaints or suppression. Covers roster reporting from the database, any-shape CSV normalisation, the four-way consent gate, and the do-not-contact registers; nothing is changed before an explicit plan approval. Read `references/consent-rules.md` first — registering for an event is not subscribing. The list holds the Mailchimp audience, carried over on 2026-08-29, and `scripts/email/import-optin-subscribers.ts` now imports the people who ticked a registration form's opt-in box (consent route 2); a paper sign-in sheet and a written request (routes 3 and 4) still have no tool and stay one person at a time. It also **owns closing the joiner gap** — the people who sign themselves up on Mailchimp's own forms, which are still live even though the newsletter left Mailchimp on 2026-08-31; `/monthly-newsletter` only detects that gap and hands it here. It is the hard prerequisite for `email-the-community`.
---

# Look after the mailing list

This skill answers two questions for a colleague who does not write code: **who
is on our mailing list?** and **can these people be added to it?**

Hold one idea above everything else:

> **The mailing list is the `newsletter_subscribers` table in our own database.
> A row with `status = 'subscribed'` is a subscriber. Nothing else is.**

Until August 2026 the record lived in Resend's segment and topic membership. It
does not any more. What has **not** changed is the harder half of the old rule:
no other table in the database records consent, so no other query can produce a
mailing list, however it is written. `references/consent-rules.md` is the
standing baseline; read it before your first import and whenever one feels
borderline.

**Say this plainly whenever the list comes up.** The table holds the whole
Mailchimp list, carried over on 2026-08-29 — so the list is real now, and a
question like "how many subscribers do we have?" has a database answer for the
first time. Go and read that answer rather than repeating one from this file:
`npx tsx scripts/email/suppression.ts reconcile` prints it on the
**`Mailable after suppression`** line — the one to quote, because the
`Subscribed rows` line above it is the table's own count before the two
suppression registers are applied (**1,549 mailable as at 2026-08-30**, and it
moves). **A send has now happened**: the August 2026 newsletter went from this
table to all 1,549 on **2026-08-31**, the first and so far only broadcast in its
history, and Mailchimp's last newsletter was July 2026. What has **not** happened
is Mailchimp going away — the account is still live, still sends event campaigns
and still runs its own sign-up and unsubscribe forms. Two consequences to keep
straight. Someone who unsubscribes over there this month does so *in Mailchimp*,
and only `suppression.ts pull-mailchimp` brings that back — so run it before you
quote the list as current. And the Resend segment and topic were **deleted on 2026-08-29**
holding nobody; nothing in Resend is the list, and nothing in this repo reads
one.

**This skill sends no email.** It reads and edits a list. Sending belongs to
`email-the-community` and `reply-to-contact-messages` — and, for the people who
registered for one event, to Humanitix -> Email campaigns rather than to this
repo at all.
Commands are PowerShell-first.

## When to apply

Trigger conditions (examples — don't wait for an exact match):

- "add the July workshop attendees to the mailing list"
- "who's actually on our email list right now?"
- "here's the sign-up sheet from the AUT event, can you import it"
- "how many newsletter subscribers do we have?"
- "please take this person off the list, she asked twice"
- "why did this person get our newsletter?"
- "can we email everyone who registered last month?" — usually **no**, and
  explaining why is part of this skill's job

## What the user gives you

Either **a file** (a CSV from Humanitix, Eventbrite, Google Forms, or typed by
hand — any shape, any headers; you never ask them to clean it up), or **a
question** with no file at all ("who's on the list?"), which is Step 1 alone and
a complete piece of work. A file with no context is not yet a request — ask what
it is and where it came from first.

**Dry-run is the default and is not negotiable.** Until the user has seen the
Step 5 plan and said yes, **nothing is written** — not to the subscriber table,
not to the suppression register. Reads are always fine, and local files under
`tmp/` are working notes.

## Prerequisites

1. **Working directory is the repo root** (contains `scripts/email/` and
   `lib/newsletter/subscribers.ts`).
2. **`POSTGRES_URL` in `.env`.** That name only — `DATABASE_URL` is
   `drizzle-kit`'s and no script here reads it. Scripts read `.env`, not
   `.env.local`. Without it the roster cannot be read at all — say so and stop.
   **Never substitute a guess, or a query of some other table, for the roster.**
3. **CSV readable and in a permitted location** — under `tmp/` or named
   `*.local.csv` (both gitignored). If the user points at their Desktop, copy it
   to `tmp/csv/<name>.local.csv` and work from there.
4. The `resend` CLI is **not** needed by this skill any more. It is still how
   mail is *sent* (`resend emails batch`), which is another skill's job.

## Step 1 — Report the current list

Start here even when a file arrived — the user cannot judge a change without
seeing what exists.

```powershell
npx tsx scripts/email/inspect-subscribers.ts --limit 50
```

It prints one block per subscriber, newest first: masked address, status, and
the provenance columns (`source`, `consent`, `consentDate`, `confirmedAt`,
whether they have unsubscribed). To look one person up:

```powershell
npx tsx scripts/email/inspect-subscribers.ts --email someone@example.com
```

**It lists rows, it does not total them by status.** With `--limit 50` you see
at most 50 rows and the count printed at the bottom is the number of rows
shown, not the size of the list. **This trap is live now that the table holds
the whole imported list** — the default `--limit 20` will confidently print 20.
Raise the limit well past the row count before quoting a number, or say plainly
that you are quoting a sample.

Most rows look the same, and that is expected: every carried-over row has
`source = 'mailchimp-import'`, and all but the four added from the Marketing API
on 2026-08-30 also carry a `confirmedAt` from the export's `CONFIRM_TIME`. Those
four share the same `source`, so `source` does not separate them — a null
`confirmedAt` does.
`website-form` is somebody who subscribed and confirmed here.
`registration-optin` is somebody who ticked an opt-in box on an event's
registration form (Step 6) — those rows carry a **null `confirmedAt`** on
purpose, and the sentence in `consentSource` names the question, the event and
the date.

Do **not** pass `--token`. It prints a live confirmation credential and refuses
to run against a non-localhost `BASE_URL` for that reason.

For the wider picture — every address list She Sharp holds, with its tier:

```powershell
npx tsx scripts/email/audience-report.ts
```

One caveat to state if you quote it: its Tier 0 figure still comes from Resend
(via `--include-resend`), which is empty and is no longer the consent record —
**so it will report 0 while the real list is not empty.** Tiers 1–3 are read from
the database and are current. The subscriber table is not yet one of its sections;
`inspect-subscribers.ts` is.

**Tell the user the real number, plainly and first:**

> The mailing list has about <N> people on it — the Mailchimp list, moved into
> our own database in August. The monthly newsletter now goes out from our own
> system: the first one, the August issue, was sent on 31 August 2026.
> The 3000+ members you may be thinking of are in the database too, but the
> database never recorded who agreed to receive email, so they aren't a list and
> can't be used as one.

Re-read the table before saying a number — fill `<N>` in from the database,
never from this file, and don't do arithmetic on it.

## Step 2 — Read the user's file (any shape)

**No `--map` means detect-only: it writes nothing.**

```powershell
npx tsx scripts/email/normalize-recipients.ts tmp/csv/attendees.local.csv --key aut-jul-2026
```

```
I read D:\…\aut-jul-2026.local.csv — 7 rows. I think:
  Email            ← column "E-Mail Address"        (6/7 look like emails)
  Order status     ← column "Order Status"          (6 completed, 1 refunded → will exclude)
  Marketing opt-in ← column "Can we email you about future She Sharp events?"  (6 yes)
Is that right? Reply "yes", or tell me which one is wrong.
```

**Quote that block back to the user and wait.** It is written for them, not for
you. If they correct a column, re-run with the corrected `--map`.

**If no email column is detected, do not guess.** The script exits 1 and lists
the columns it found — show that list and ask which holds the address, or ask
for a re-export that includes attendee emails.

`--key` is a kebab-case identifier (`aut-jul-2026`) naming the output file and
the state record; pick something recognisable in six months.

## Step 3 — Establish consent

You must be able to state **where and when** these people agreed to receive
email. Four acceptable answers, no fifth: the **website subscribe form** (which
since August 2026 is a full double opt-in and needs nobody's help — see below);
a **tick-box on the registration form** (record the exact question, event and
date — valid only if the CSV really has that column, and only for rows that
answered yes); a **paper sign-in sheet** that carried opt-in wording ("Does the
sheet have a line saying they agree to receive emails from She Sharp — and did
these people tick it?"); or **the person asked in writing**, one at a time.

Ask in their language, not in compliance language:

> Before I add these 40 people — did the registration form ask whether they
> wanted emails from She Sharp about future events? If it did, I'll only add the
> ones who ticked yes. If it didn't, I can't add them, but I can give you a
> subscribe link to send them so they can add themselves.

The link is **https://www.shesharp.org.nz/newsletter/subscribe**. It records the
request, emails a confirmation link, and only counts the person as a subscriber
once they press the button on the page it opens. That is the cleanest consent
evidence the organisation has, and it costs you nothing to offer it.

**If none of the four fits, stop.** Do not import. Offer the subscribe-link path
and mean it — 40 people who chose to be there beat 400 who didn't, and it is the
only version that survives a complaint.

With consent established, write the recipients file:

```powershell
npx tsx scripts/email/normalize-recipients.ts tmp/csv/attendees.local.csv `
  --key aut-jul-2026 `
  --map "email=E-Mail Address,firstName=Given Name,status=Order Status,optIn=Can we email you about future She Sharp events?" `
  --for-import `
  --consent-source "Humanitix checkout question, AUT July 2026" `
  --consent-date 2026-07-15 --tier 0
```

`--for-import` refuses to run without both consent flags (exit 1), **refuses to
run at all if the file has no opt-in column** (exit 1), and drops every row that
did not tick the opt-in, plus refunded orders, duplicates, malformed addresses
and anyone suppressed. Output: `tmp/emails/recipients-<key>.json`.

Note what that file **is**: a cleaned, consent-checked recipients list. It is
not a subscriber import, and writing it changes nothing about who is on the
list. Step 6 is where that happens, and it reads this file.

**If it refuses for want of an opt-in column, that is the answer, not an
obstacle.** It prints the columns the file has and names the one that looks like
the question, if there is one — map it with `--map "optIn=<that column>"`. If
none of them is the question, the form did not ask, and no import is possible
from this file. Offer the subscribe link instead.

Until 2026-08-30 that run *succeeded*: the row filter only dropped a "No" when
an opt-in column had been mapped, so a file that had never asked the question
came through whole, reporting `Excluded 0`, indistinguishable from a file where
everybody said yes. Step 6 checks again for itself, because a recipients file
can reach it without having been through `--for-import` at all.

## Step 4 — Check who is already known, and who must not be added

There is no database equivalent of the old Resend diff yet. Do it with the two
tools that exist.

Anyone the user names individually, or any address that looks like it might
already be known:

```powershell
npx tsx scripts/email/inspect-subscribers.ts --email someone@example.com
npx tsx scripts/email/suppression.ts check someone@example.com
```

`check` prints `SUPPRESSED` / `not suppressed` and exits 0 when suppressed, 1
when not, so it works in a shell conditional. Before any import, make sure the
registers are current, or an un-synced register will happily re-admit someone
who bounced last week:

```powershell
npx tsx scripts/email/suppression.ts sync --dry-run        # runtime opt-outs → committed register
npx tsx scripts/email/suppression.ts pull-mailchimp --dry-run   # Mailchimp's own unsubscribes
npx tsx scripts/email/suppression.ts reconcile             # subscribers who also sit on a register
```

**This is the step the whole flow exists for.** Someone who opted out in March
still appears in July's attendee export — that file has no idea they left. If
`reconcile` or `check` finds anyone, name the count in the plan and exclude
them.

**It has already paid for itself once.** `pull-mailchimp` was run immediately
before the 2026-08-29 Mailchimp import and moved the register 2,138 → **2,144**;
six of the fifteen rows that import then held back were those six people, who had
unsubscribed or hard-bounced in the days since the export was taken. Every file
you are handed is a snapshot of an afternoon, and people leave after it.

**`diff-roster.ts` was deleted on 2026-08-30.** It diffed a recipient file
against the Resend contact roster, which holds nobody and is no longer the list.
Its question is now answered by the two commands above, which are the same two
rows `references/resend-roster-cli.md` gives:

| You want to | Use |
|---|---|
| Look one person up, with their consent provenance | `npx tsx scripts/email/inspect-subscribers.ts --email someone@example.com` |
| See whether the stores have drifted apart | `npx tsx scripts/email/suppression.ts reconcile` |

Those read `newsletter_subscribers` and the committed suppression register — the
same source `selectMailable()` uses on the send path — so there is exactly one
implementation of "who may be mailed" and nothing for a second one to disagree
with.

The repeat-file check still works and is still worth doing:

```powershell
npx tsx .claude\skills\update-mailing-list\scripts\roster-state.ts sha256 tmp\csv\attendees.local.csv
```

A warning here means **stop and tell the user** — these exact bytes have been
processed before.

## Step 5 — Present the plan

Show this block, then **stop and wait**.

```
List          : newsletter_subscribers (our database)
Source file   : tmp/csv/attendees.local.csv (sha256 930614c5…)
Consent       : Humanitix checkout question "Can we email you about future
                She Sharp events?", AUT July 2026 — collected 2026-07-15
Rows read     : 7
Would add     : 2 subscribers (status 'subscribed', confirmedAt null —
                imported provenance, not a confirmation click)
Already there : 1 (no change — checked against the rows already on the list)
Redactions    : 4 rows excluded —
                  1 no marketing opt-in
                  1 order refunded
                  1 duplicate address
                  1 malformed address
                  0 previously unsubscribed or suppressed
Import        : scripts/email/import-optin-subscribers.ts (route 2) — dry run
                shown above; --apply writes, and needs
                --event-unsubscribers-checked (the Humanitix unsubscriber
                list, checked by hand — Step 6)
```

The **`Redactions:` line is mandatory** — every row that will not be imported,
with its reason, even at zero. It lets the user catch a misread column ("wait,
why is Priya excluded?") while it is still cheap; without it the exclusions
surface months later as "why did half the room never hear from us?".

`Would add` comes from the `--for-import` output minus anyone Step 4 found,
never from the raw CSV row count.

Wait for "yes", "go ahead", "import it". Anything ambiguous is a no.

## Step 6 — Import

**There is one importer, it covers one of the four consent routes, and you must
not improvise past it.** No `INSERT`, no ad-hoc `tsx` one-liner, no Drizzle
snippet typed into the terminal. The table is the organisation's consent record,
and every row in it has to have been written by reviewed code that records
provenance the same way every time.

### Route 2 — a tick-box on a registration form

`scripts/email/import-optin-subscribers.ts` takes the recipients file Step 3
wrote and turns the rows that ticked the box into subscribers.

```powershell
npx tsx scripts/email/import-optin-subscribers.ts tmp/emails/recipients-aut-jul-2026.json `
  --event-name "AUT July Workshop" `
  --event-date 2026-07-15
```

Dry run is the default. It prints which column it read the opt-in from, which
column it read each person's consent date from, the sentence every row will
carry, and — by count and truncated hash, never by address — everyone held back.
Show that output to the user.

#### Then check the event's unsubscriber list, by hand

**Humanitix keeps a register this repo cannot read**, and `--apply` refuses to
run until you say you have looked at it. Console → Email campaigns →
**Unsubscriber list** holds the people who unsubscribed from an event's own
communications — *"will no longer receive emails sent through email campaigns
**for the event**"*, in Humanitix's words. Somebody who muted your emails about
an event and then bought a ticket to it is not somebody to add to a marketing
list. That is a contradiction inside one event, not an inference across events,
which is the whole reason this check is narrow:

1. Open
   <https://console.humanitix.com/console/comms/email-campaigns-unsubscriptions>
   — or navigate there: console → **Email campaigns** (top nav) →
   **Unsubscriber list** (tab). Prefer the navigation if the link does not
   land. The console is on `console.humanitix.com`; `events.humanitix.com` is
   the public ticket-buyer site, and a wrong console path renders a plausible
   page title over an empty pane rather than an honest 404.
2. Search it for the event you passed to `--event-name`. The register is a few
   dozen rows spanning several years and it is scoped per event, so the
   realistic overlap with one import is **zero or one**.
3. If nobody from this import is on it, re-run with
   `--event-unsubscribers-checked`.
4. If somebody is, add `--exclude their@address` to the same run — repeatable,
   one address per flag. The address is hashed immediately and **never written
   to a file**; the run reports the row as held back by truncated hash, like
   every other exclusion.
5. **Do not put that person on the suppression register instead.** That
   register is a general do-not-contact list, and this evidence is about one
   event: folding it in would block them from everything She Sharp ever sends
   because they once muted one event's reminders, and the file is one-way
   hashes that cannot practically be undone.

If `--exclude` names an address that is not in the file, the run says so rather
than passing quietly — check the address, or check you are importing the file
you meant to.

**Be honest about what the flag is** if anyone asks: an acknowledgement, not a
verification. Nothing checks that you looked, and a person can type it without
opening the page. It is there because there is no alternative: the Humanitix
public API is 14 endpoints and none of them touches email campaigns at all — the
word does not appear in its spec — and the console page has no export button. If
Humanitix ever exposes the list, the flag goes and the importer drops the
overlap itself.

Only then:

```powershell
npx tsx scripts/email/import-optin-subscribers.ts tmp/emails/recipients-aut-jul-2026.json `
  --event-name "AUT July Workshop" --event-date 2026-07-15 `
  --event-unsubscribers-checked --apply
```

Four things it does that are worth being able to explain:

- **It composes the consent sentence itself** from the question text, the event
  name and the event date — which is why the last two are flags rather than
  optional. A free-text sentence can be typed as "Humanitix opt-in" and pass
  every check in the system; nobody notices until somebody asks which event that
  was. The question defaults to Humanitix's built-in checkout wording (*"Keep me
  updated on the latest news, events, and exclusive offers from the event
  host"*, which the host cannot edit). **For any other platform pass the real
  wording with `--question "…"`** and, if it helps, `--form "Eventbrite
  checkout"`.
- **`confirmedAt` stays null.** These people ticked a box on somebody else's
  checkout; they never clicked a confirmation link of ours. That is honest and
  sufficient, and it is deliberately not the same grade of evidence as the
  website form. Say so if anyone asks why the two look different.
- **`consentDate` is each order's own completion date**, read per row from the
  export — not the day you ran the import. If the file has no date column it
  refuses and asks you to name one with `--date-column "<header>"`.
- **Both do-not-contact registers are consulted** — the committed hash file and
  the runtime `email_optouts` table — and anyone already in the table is
  skipped. An import can never resurrect somebody who left. The event's own
  unsubscriber list is a third register and is *not* one of these: it is
  event-scoped, it lives in Humanitix, and it is the numbered check above.

**If the file has no opt-in column the script refuses and exits 1**, quoting the
rule. Do not work around it, and do not re-run `normalize-recipients.ts` with a
different column mapped in the hope that one of them counts.

That is the second of two gates, and it is not redundant. Step 3's
`--for-import` refuses such a file too — since 2026-08-30, having silently
passed it before — but a recipients file can arrive here without ever having
been through that flag: built for a fulfilment send, produced before the gate
existed, or edited by hand. The importer trusts none of that and re-checks the
opt-in cell on every row.

### Routes 3 and 4 — still no tool, still one person at a time

**A paper sign-in sheet (route 3) and a written request (route 4) have no
importer and are not getting one here.** Their evidence is a colleague's
recollection and a message in somebody's inbox, not a column in a file, and a
bulk tool over that is a bulk tool over a guess. If someone hands you either:
add nobody, and offer the subscribe link.

> That sheet is fine as consent for the people who ticked it, but there's no
> tool for typing them in, and I can't write into the consent record by hand.
> The subscribe link puts them on the list today with better evidence than an
> import gives — shall I write you something to send them?

### The Mailchimp importer is not a second consent route — but it is this skill's job

`scripts/email/import-mailchimp-subscribers.ts` carried the Mailchimp audience
over on 2026-08-29 — 1,560 rows read, 15 held back by the suppression register,
**1,545 written**. It is not a general importer and cannot be pointed at a
sign-up sheet: it reads the Mailchimp export's own columns (`Email Address`,
`First Name`, `Last Name`, `CONFIRM_TIME`) and refuses files whose names say they
are the `unsubscribed`, `cleaned` or `nonsubscribed` exports. Its whole
justification is that every one of those people carried a `CONFIRM_TIME` — a
double opt-in that actually happened, elsewhere, with a date. It adds **no new
consent route**; it carries route 1 evidence that was recorded on another
platform.

**"Do not re-run it" means do not re-import the frozen 2026-08-17 export.** That
file has already been imported; running it again re-offers the same people and
tells you nothing. It does **not** mean the script is retired.

### Closing the joiner gap — a fresh export, and this skill owns it

Mailchimp no longer sends the newsletter — that moved here on 2026-08-31 — but
its **sign-up forms are still live**, which is what keeps this gap open: people
who fill in Mailchimp's own hosted or embedded signup form join *there* and
appear in this table only if somebody brings them across. Closing the gap now
matters more, not less: those people asked for a newsletter that is no longer
sent from where they signed up.
Nothing does that automatically. **Measured 2026-08-30: 3 people were subscribed
in Mailchimp and absent here** — a strict subset, 0 the other way — every one of
them having opted in on 27 or 28 August, after the export was taken. That is
consent route 1, the strongest grade there is, sitting outside the list for want
of a pull.

`/monthly-newsletter` Step 8a **detects** this gap every month and stops; it does
not import, and it hands over to you. **This is the sanctioned operation, and
the order is not optional:**

```powershell
npx tsx scripts/email/suppression.ts pull-mailchimp   # 1. the register moves under a frozen export
npx tsx scripts/email/import-mailchimp-subscribers.ts <the fresh subscribed export>
npx tsx scripts/email/suppression.ts reconcile        # 3. prove the stores agree
```

1. **`pull-mailchimp` first.** Anyone who unsubscribed since the export was taken
   exists only in Mailchimp's record, and an export is a snapshot of an
   afternoon. Run before the 2026-08-29 import it moved the register 2,138 →
   2,144, and six of the fifteen rows the import then held back were those six
   people. Skip it and you re-add someone who has left.
2. **Then the import.** It writes only the new people — it skips
   `already a subscriber` and `on the suppression register`, and ends in
   `onConflictDoNothing` on `emailHash`, so a person who is already here cannot
   be duplicated or have their `confirmedAt` overwritten.
3. **Then `reconcile`**, and quote the **`Mailable after suppression`** line.

**It has to be the CSV export, not an API pull.** The Marketing API exposes no
`CONFIRM_TIME` equivalent — `timestamp_signup` is populated on 129 members
against 1,560 rows in the export — so an API import writes `confirmedAt = null`
and records *weaker* consent evidence than those people actually have. A manual
export step is the cheaper price. That file is real addresses: it goes in the
gitignored vault (`/private/`), never in the repo — "Handling the files" in
`references/consent-rules.md`.

Everything else about this operation is a normal run of this skill: it needs the
Step 5 plan and an explicit yes like any other import, and Step 9 reports it.

`scripts/email/recipients-from-db.ts` is not an importer either. It reads *out
of* the table to build a send; it never writes into it.

## Step 7 — Take one person off the list

When someone asks to be removed, record it so no future file can bring them
back:

```powershell
npx tsx scripts/email/suppression.ts add someone@example.com --reason "asked to be removed"
npx tsx scripts/email/suppression.ts check someone@example.com
```

That is enough to stop mail: `selectMailable()` in `scripts/email/mailable.ts`
applies the committed register to every send built from the database, and a
suppression recorded today is newer than any existing confirmation, so they are
excluded.

**There is no operator command that flips a subscriber row to `unsubscribed`.**
That transition belongs to the one-click unsubscribe link in every send
(`/api/email/unsubscribe` → `unsubscribeByHash()`) and to the Resend webhook for
bounces and complaints. If a row genuinely needs correcting by hand, say so and
stop — that is a code change, not a terminal command.

**Never re-subscribe someone by hand.** If they want back on, they use the
website form, which is the only route that produces evidence. A spam complaint
is never reversed at all, by anything.

## Step 8 — Keep the do-not-contact registers current

```powershell
npx tsx scripts/email/suppression.ts list
npx tsx scripts/email/suppression.ts sync --dry-run   # see what would be added
npx tsx scripts/email/suppression.ts sync             # merge them in
npx tsx scripts/email/suppression.ts pull-mailchimp   # unsubscribes Mailchimp saw
npx tsx scripts/email/suppression.ts reconcile        # drift report
```

`lib/data/json/email-suppression-hashes.json` stores only sha256 hashes, so it
is safe to commit and `list` shows truncated hashes plus a reason — use `check`
to test one address.

`sync` folds the runtime `email_optouts` table (one-click unsubscribes, bounces
and spam complaints captured by the Resend webhook) into that committed file.
Both key on the same `hashEmail()`, so it is a plain set union with no addresses
crossing over. Needs `POSTGRES_URL`.

`pull-mailchimp` does the same for the platform She Sharp still actually sends
from: someone who unsubscribes today exists **only** in Mailchimp's record and
`sync` cannot see them. Needs `MAILCHIMP_API_KEY` (+ `MAILCHIMP_LIST_ID`). Run
both monthly, and always **before** an import.

`reconcile` is the check that the stores agree — it reports subscribers who also
sit on a register (drift, which means a write path is broken) and, separately,
people a later confirmation legitimately brought back (allowed, and expected).
It exits 1 when there is drift.

### Commit a suppression change on its own

`sync`, `pull-mailchimp` and `suppression.ts add` all write
`lib/data/json/email-suppression-hashes.json`, which is **committed**. An
uncommitted change to it is a do-not-contact instruction that exists on one
laptop, and the next person to build a send from a clean checkout will not have
it.

So whenever that file's diff is non-empty:

```powershell
git add lib/data/json/email-suppression-hashes.json
git commit -m "chore(email): sync the suppression register"
```

**Its own commit, nothing else in it.** A register change is a record that
specific people asked not to be contacted; bundled into a feature commit it
cannot be found, reviewed or reverted on its own. Say the before-and-after count
in the commit body if the numbers moved. This applies wherever the commands are
run from — `/monthly-newsletter` Step 8a runs all three and the rule is the
same there.

## Step 9 — Report

Report in the user's terms: how many people are on the list **now** (re-read it,
don't do arithmetic); what you checked; who would be excluded and why (the
`Redactions` list, in words); what the recorded consent says; and anything left
open ("3 people ticked no — if you want them, send them the subscribe link").
Be explicit about anything that did not happen and why.

Then delete the CSV from `tmp/`: the list lives in the database, the CSV was
scaffolding. Delete the recipients file too once the import has run — it holds
addresses. Keep it only if the user chose not to import today, and say where it
is.

After a route-2 import, re-read the list rather than adding up — and check the
stores still agree:

```powershell
npx tsx scripts/email/inspect-subscribers.ts --limit 2000
npx tsx scripts/email/suppression.ts reconcile
```

Do **not** quote `audience-report.ts` for this: its Tier 0 figure still comes
from Resend and reads 0.

`roster-state.ts record` is **not usable for a database import**: it requires
`--import-id`, which was a Resend `contact_import` id and no longer exists.
Neither the Mailchimp carry-over nor `import-optin-subscribers.ts` uses it —
both record their provenance on the rows themselves, which is the better place
for it. Leave `state/roster.json` alone. Commit any suppression change on its
own.

---

## Guardrails (USER-APPROVED — hard rules)

1. **`newsletter_subscribers` is the consent record; no other table ever is.**
   *Why:* a query result from any other table looks exactly like a mailing list
   and is not one — the permission it would need was never collected.
2. **Nothing is written before the Step 5 plan is approved.** *Why:* there is no
   batch undo for a mailing list, and the remedy for 300 wrong subscribers is
   300 corrections.
3. **Never write to the subscriber table by hand.** *Why:* every write into the
   consent record must come from reviewed code that captures provenance
   identically every time. An ad-hoc `INSERT` produces a row nobody can defend —
   and it would now sit indistinguishable among the imported rows, which each
   carry a `source`, a `consentSource` and a consent date.
4. **Every addition needs one of the four consent sources, recorded with the
   row.** *Why:* if nobody can say where the opt-in came from, it did not
   happen — and "I don't know" cannot survive a complaint.
5. **Never re-add someone who unsubscribed, bounced or complained** — not by
   import, not by hand, not because a newer file lists them. *Why:* they receive
   mail they explicitly refused, and learn that unsubscribing doesn't work.
   Re-entry is only ever the person themselves through the website form; a spam
   complaint is never reversed at all.
6. **Registering, donating, applying or writing to us is not subscribing.**
   *Why:* consent attaches to a purpose, not a person; one address can be
   mailable for one thing and off-limits for another at the same moment.
7. **Addresses are masked everywhere they are shown.** *Why:* plans and reports
   get pasted into Slack, a far wider audience than the person who asked.
8. **CSVs live only in `tmp/` or `*.local.csv`, and are deleted afterwards; the
   subscriber table is never exported into `lib/data/json/`.** *Why:* both
   locations are gitignored; anywhere else, one `git add .` publishes real
   addresses into permanent public history.
9. **Report what actually happened, never what you expected.** *Why:* the most
   damaging version of this skill is one that says "added 40 people" when the
   import was a dry run, or when 30 of them were held back. Quote the importer's
   own `WOULD IMPORT` / written counts, and say when a route has no tool at all.
   The same rule governs the
   sending: **one** broadcast has gone out from this list (the August 2026
   newsletter, 2026-08-31, 1,549 recipients) and Resend *accepted* all of it —
   never let "we have N subscribers" drift into "we emailed N people", and never
   let "Resend accepted 1,549" drift into "1,549 people read it".

## Audience tiers — decision table

Consistent with `references/consent-rules.md` and `lib/email/audience.ts`.

| Tier | Who | May receive | Channel | On this list? |
|---|---|---|---|---|
| **0** | `newsletter_subscribers` rows with `status = 'subscribed'` | Anything — newsletters, campaigns, promotion | Resend batch send built by `recipients-from-db.ts` | **Yes — this is the list** |
| **1** | People who wrote to us (`contact_form_submissions`) | A 1:1 reply to what they asked | Individual transactional email | No — never import |
| **2** | Event registrants, mentor/mentee/volunteer applicants, donors, account holders | Only mail fulfilling what they signed up for | Individual or per-event transactional batch | No — unless they separately ticked an opt-in |
| **3** | Scraped, inherited or unexplainable addresses | Nothing, ever | — | No — and remove if found |

A Tier 2 address that ticked an opt-in box becomes Tier 0 **for that opt-in
only**, and the tick is what you record as consent. A `pending` row is not Tier
0 — it is somebody who asked and has not confirmed.

## Common failure modes and how to recover

**`Error: POSTGRES_URL is not set` / a connection failure** — the scripts read
`.env`, not `.env.local`. Check `.env` has the database URL. Report the blocker;
do not substitute a query of another table, or Resend, for the roster.

**`No subscribers yet.`** — this **used** to be the correct answer and is not any
more: the table has been populated since 2026-08-29. If you see it now, you are
pointed at the wrong database (a local or preview `POSTGRES_URL`). Check `.env`
before reporting an empty list to anyone.

**A count that looks too low** — almost always `inspect-subscribers.ts` printing
the number of rows it *showed*, capped by `--limit` (default 20), against a list
of roughly fifteen hundred. Raise the limit past the row count, or say you are
quoting a sample.

**Someone reports getting mail after unsubscribing** — check the row and the
registers (`inspect-subscribers.ts --email`, `suppression.ts check`), then run
`suppression.ts reconcile`. If they appear under "re-subscribed after
unsubscribe", that is the rule working: they used the website form again. If
they appear under DRIFT, a write path is broken — report it rather than
patching around it.

**About to re-add someone who left** — they will be in `suppression.ts check`,
or their row's status will not be `subscribed`. Remove them from the file and
re-run Steps 3–5. If the user pushes back ("she said it's fine now"): *"If she'd
like back on, this link puts her back with a record we can point to — I can't
undo an unsubscribe from this side."*

**Mojibake in names, or a first header reading `﻿Email`** — a UTF-8 BOM or a
non-UTF-8 export. `normalize-recipients.ts` strips the BOM. Ask for a re-export
as UTF-8 CSV rather than repairing by hand.

**The same CSV was processed twice** — `roster-state.ts sha256` warns when bytes
match a recorded run. Nothing is written by this skill today, so a repeat is
harmless; still tell the user.

**Someone asks you to run a Resend contacts command** — `resend contacts`,
`segments`, `topics`, `contacts imports`. Explain that the newsletter list moved
out of Resend; the segment and topic were deleted on 2026-08-29 holding nobody,
and nothing in this repo reads them any more. `references/resend-roster-cli.md` has the detail.

**Someone says "so we've emailed them all now?"** — once, on 2026-08-31: the
August newsletter went to all 1,549. Two corrections to have ready. That is the
*only* send from this system, so it is not a routine; and it says nothing about
whether the mail landed — Resend accepted 1,549 messages, and delivery, bounces
and complaints are reported separately. Every further send needs its own approval
and comes out of the three-per-calendar-month cap, which August's newsletter has
already drawn on.

## What this skill does *not* do

- **Send any email** — not a test, not a campaign, not a confirmation. (The
  confirmation email is sent by the website itself when someone subscribes.)
- **Import anybody whose consent is not a column in a file** — routes 3 (a paper
  sign-in sheet) and 4 (a written request) have no tool, and improvising one is
  forbidden. Route 2 does: `import-optin-subscribers.ts` (Step 6). The one-off
  Mailchimp importer is not a general path.
- **Re-import the frozen 2026-08-17 Mailchimp export** — that migration is done,
  on 2026-08-29, by `scripts/email/import-mailchimp-subscribers.ts`. Running it
  over that same file again only re-offers the same people. Running it over a
  **fresh** `subscribed` export to close the joiner gap is a different,
  sanctioned operation and it belongs to this skill: Step 6, "Closing the joiner
  gap".
- **Send anything, or switch the newsletter off Mailchimp** — the list is here,
  the sending is not.
- **Manage the monthly newsletter** — drafting, editorial and scheduling belong
  to `monthly-newsletter`.
- **Decide whether consent exists** — it presents the four options and records
  the answer. Only the person who ran the form or held the clipboard knows what
  was actually asked.
- **Recover an unsubscribe** — that runs through the website form and the person
  themselves, permanently and by design.
