---
name: update-mailing-list
description: Inspect and safely update She Sharp's Resend mailing list — the only record of who consented to marketing email — via `scripts/email/normalize-recipients.ts`, this skill's `scripts/diff-roster.ts`, and `resend contacts imports`. Use whenever the user wants to see or change who is on the list — phrases like "add these attendees to the mailing list", "who's on our email list?", "import this sign-up sheet", "subscribe these people", "take her off the list", "how many subscribers do we have?" — or anything about Resend contacts, segments, topics, unsubscribes or bounces. Covers roster reporting, any-shape CSV normalisation, the four-way consent gate, unsubscribed and suppression exclusion, and segment plus topic assignment; nothing is written to Resend before an explicit plan approval. Read `references/consent-rules.md` first — registering for an event is not subscribing. This skill is the hard prerequisite for `email-the-community`.
---

# Look after the mailing list

This skill answers two questions for a colleague who does not write code: **who
is on our mailing list?** and **can these people be added to it?**

Hold one idea above everything else:

> **Resend is the source of truth for who is subscribed. The database is not.**

There is no marketing-consent field anywhere in the She Sharp database — no
`subscribed` column, no `opt_in_at`, no subscribers table. A database query can
therefore never produce a mailing list, however it is written. Resend's segment
and topic membership is the entire record of who agreed to hear from us.
`references/consent-rules.md` is the standing baseline; read it before your
first import and whenever one feels borderline.

**This skill sends no email.** It reads and edits a list. Sending belongs to
`email-the-community`, `send-event-emails` and `reply-to-contact-messages`.
Commands are PowerShell-first.

## When to apply

Trigger conditions (examples — don't wait for an exact match):

- "add the July workshop attendees to the mailing list"
- "who's actually on our email list right now?"
- "here's the sign-up sheet from the AUT event, can you import it"
- "how many newsletter subscribers do we have?"
- "please take this person off the list, she asked twice"
- "can we email everyone who registered last month?" — usually **no**, and
  explaining why is part of this skill's job

## What the user gives you

Either **a file** (a CSV from Humanitix, Eventbrite, Google Forms, or typed by
hand — any shape, any headers; you never ask them to clean it up), or **a
question** with no file at all ("who's on the list?"), which is Step 1 alone and
a complete piece of work. They may name a segment loosely ("the newsletter
one"); resolve it to an ID in Step 1. A file with no context is not yet a
request — ask what it is and where it came from first.

**Dry-run is the default and is not negotiable.** Until the user has seen the
Step 5 plan and said yes, **nothing is written to Resend** — no
`contacts create`, no `imports create`, no `add-segment`, no `update-topics`.
Reads are always fine, and local files under `tmp/` are working notes.

## Prerequisites

1. **Working directory is the repo root** (contains `scripts/email/` and
   `lib/email/audience.ts`).
2. **`resend` on PATH and authenticated** — `resend whoami` must print
   `"authenticated": true` and `"permission": "full_access"`. Not found:
   `npm i -g resend-cli`, then `resend login`. A `sending_access` key cannot
   manage contacts — ask for a full-access one. **Never substitute a guess, or a
   database query, for the roster.**
3. **CSV readable and in a permitted location** — under `tmp/` or named
   `*.local.csv` (both gitignored). If the user points at their Desktop, copy it
   to `tmp/csv/<name>.local.csv` and work from there.
4. **`DATABASE_URL` (optional)** — only for the fuller Step 1 report. Without
   it, run the Resend half and say the database half was skipped.

## Step 1 — Report the current roster

Start here even when a file arrived — the user cannot judge a change without
seeing what exists.

```powershell
resend contacts list --limit 100 --json
resend segments list --json
resend topics list --json
npx tsx scripts/email/audience-report.ts --include-resend
```

**Tell the user the real number, plainly and first.** The list currently holds
**0 contacts** — the account moved to the She Sharp–owned Resend team on
2026-08-28 and nothing has been imported into it:

> Right now the mailing list has nobody on it. The real list — about 1,560
> subscribers — is still in Mailchimp, and the monthly newsletter still goes
> out from there. The 3000+ members you're thinking of are in the database, but
> the database never recorded who agreed to receive email, so it can't be used
> as a list. Building the Resend list up is exactly what this skill is for.

`--limit` defaults to **10**; on a longer list page with `--after` until
`has_more` is false, or you will confidently report the wrong number.

Live objects (Resend team **shesharp**, owned by `website@shesharp.org.nz`):
segment **Newsletter** `95d452f5-2eed-4ad4-b18e-5ff5a89a576b`, topic **Monthly
Newsletter** `08e59693-29dc-4556-8357-866dea047c6f`. The team's default segment
**General** `9d195cb7-f7fc-49e0-9b88-e47c1741e720` is empty and nothing uses it.
Re-read them rather than trusting this line.

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
email. Four acceptable answers, no fifth: the **website subscribe form**; a
**tick-box on the registration form** (record the exact question, event and
date — valid only if the CSV really has that column, and only for rows that
answered yes); a **paper sign-in sheet** that carried opt-in wording ("Does the
sheet have a line saying they agree to receive emails from She Sharp — and did
these people tick it?"); or **the person asked in writing**, one at a time.

Ask in their language, not in compliance language:

> Before I add these 40 people — did the registration form ask whether they
> wanted emails from She Sharp about future events? If it did, I'll only add the
> ones who ticked yes. If it didn't, I can't add them, but I can give you a
> subscribe link to send them so they can add themselves.

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

`--for-import` refuses to run without both consent flags (exit 1) and drops
every row that did not tick the opt-in, plus refunded orders, duplicates,
malformed addresses and anyone suppressed. Output:
`tmp/emails/recipients-<key>.json`.

## Step 4 — Diff against Resend

```powershell
npx tsx .claude/skills/update-mailing-list/scripts/diff-roster.ts `
  --recipients tmp/emails/recipients-aut-jul-2026.json `
  --segment-id 95d452f5-2eed-4ad4-b18e-5ff5a89a576b
```

It sorts every row into `new`, `alreadyPresent`, `unsubscribed`,
`alreadyInSegment`, `suppressed` and prints `Importable now: <n>`. Addresses are
masked; `--json` gives the raw buckets.

**The `unsubscribed` bucket is why this step exists.** Someone who opted out in
March still appears in July's attendee export — that file has no idea they left
— and `--on-conflict upsert` would silently resurrect them. If the bucket is
non-empty, remove those rows from the CSV before importing and say so in the
plan.

Then check whether these exact bytes have been imported before:

```powershell
npx tsx .claude/skills/update-mailing-list/scripts/roster-state.ts sha256 tmp/csv/attendees.local.csv
```

A warning here means **stop and tell the user**. Re-importing re-touches every
contact and there is no batch undo.

## Step 5 — Present the roster plan

Show this block, then **stop and wait**.

```
List          : Newsletter (95d452f5-2eed-4ad4-b18e-5ff5a89a576b)
Source file   : tmp/csv/attendees.local.csv (sha256 930614c5…)
Consent       : Humanitix checkout question "Can we email you about future
                She Sharp events?", AUT July 2026 — collected 2026-07-15
Rows read     : 7
Would add     : 2 new contacts
Already there : 1 (no change)
Topic         : Monthly Newsletter → opt_in
Conflict mode : skip (existing contacts left untouched)
Redactions    : 4 rows excluded —
                  1 no marketing opt-in
                  1 order refunded
                  1 duplicate address
                  1 malformed address
                  0 previously unsubscribed
```

The **`Redactions:` line is mandatory** — every row that will not be imported,
with its reason, even at zero. It lets the user catch a misread column ("wait,
why is Priya excluded?") while it is still cheap; without it the exclusions
surface months later as "why did half the room never hear from us?".

`Would add` comes from `diff-roster.ts`'s `Importable now`, never from the CSV
row count — only the diff knows who is already there.

Wait for "yes", "go ahead", "import it". Anything ambiguous is a no.

## Step 6 — Import

Only after approval.

```powershell
resend contacts imports create --file .\tmp\csv\attendees.local.csv `
  --column-map '{"email":"E-Mail Address","firstName":"Given Name"}' `
  --on-conflict skip `
  --segment-id 95d452f5-2eed-4ad4-b18e-5ff5a89a576b `
  --topics '[{"id":"08e59693-29dc-4556-8357-866dea047c6f","subscription":"opt_in"}]'
```

It returns `{"object":"contact_import","id":"<id>"}` — **a receipt, not a
success.** The job runs in the background; poll to a terminal state:

```powershell
resend contacts imports get <id> --json
```

`status` moves `queued` → `in_progress` → `completed` | `failed`; only the last
two are terminal. A completed import carries
`counts: {total, created, updated, skipped, failed}` — report those, not your
expectation, and investigate any non-zero `failed` before claiming success.

Two reliable traps: **without `--column-map`, headers must be exactly lowercase
`email` / `first_name` / `last_name`** (no real export is), and **`upsert`
overwrites existing contacts** — prefer `skip`. Full flag detail and the error
table are in `references/resend-roster-cli.md`.

## Step 7 — Assign segment and topic

The import flags cover both. For one person, or to fix an assignment afterwards:

```powershell
resend contacts add-segment someone@example.com --segment-id 95d452f5-2eed-4ad4-b18e-5ff5a89a576b
resend contacts update-topics someone@example.com `
  --topics '[{"id":"08e59693-29dc-4556-8357-866dea047c6f","subscription":"opt_in"}]'
resend contacts segments someone@example.com
```

`update-topics` replaces only the topics named in the array. Note the asymmetry:
`add-segment` takes `--segment-id`, `remove-segment` takes the segment as a
positional second argument. **Never use these to re-subscribe someone who opted
out** — the CLI will let you; the rules will not.

## Step 8 — Suppressions

When someone bounces, complains, or asks to be left alone, record it so the next
CSV cannot bring them back:

```powershell
npx tsx scripts/email/suppression.ts add someone@example.com --reason "asked to be removed"
npx tsx scripts/email/suppression.ts check someone@example.com
npx tsx scripts/email/suppression.ts list
```

The register stores only sha256 hashes, so
`lib/data/json/email-suppression-hashes.json` is safe to commit and `list` shows
truncated hashes plus a reason — use `check` to test one address.

Suppressing is local and separate from unsubscribing in Resend. For a removal
request do **both**: `resend contacts update <email> --unsubscribed` (or
`contacts delete <email> --yes` if they want their data gone), *and* add the
suppression entry so no future import re-adds them.

**Bounces and complaints no longer need adding by hand.** The Resend webhook
(`app/api/webhooks/resend/route.ts`) writes them straight into the `email_optouts`
table as they happen, and `sendEmail()` honours that table on every
notification-class send. One-click unsubscribes from the `List-Unsubscribe`
header land there too. Fold them into the committed register — the one the
import scripts read — with:

```powershell
npx tsx scripts/email/suppression.ts sync --dry-run   # see what would be added
npx tsx scripts/email/suppression.ts sync             # merge them in
```

Both stores key on the same `hashEmail()`, so this is a plain set union with no
addresses crossing over. Run it monthly, and always **before** an import — an
un-synced register will happily re-add someone who bounced last week. Needs
`POSTGRES_URL`; the other subcommands do not.

## Step 9 — Record state and report

```powershell
npx tsx .claude/skills/update-mailing-list/scripts/roster-state.ts record `
  --key aut-jul-2026 --import-id <id from Step 6> `
  --file-sha256 <sha from Step 4> --count 2 --segment "Newsletter" `
  --consent "Humanitix checkout opt-in question, AUT July 2026, collected 2026-07-15" `
  --digest "40-row attendee export; 2 new, 1 already present, 4 excluded. Nothing outstanding."
```

Commit `state/roster.json` alongside any suppression change — it holds counts,
hashes and prose, never addresses.

Then report in the user's terms: how many contacts the list holds **now**
(re-read it, don't do arithmetic); added versus already there; who was excluded
and why (the `Redactions` list, in words); what the recorded consent says; and
anything left open ("3 people ticked no — if you want them, send them the
subscribe link"). Finally delete the CSV from `tmp/`: the list lives in Resend,
the CSV was scaffolding.

---

## Guardrails (USER-APPROVED — hard rules)

1. **Resend is the source of truth; the database never is.** *Why:* a query
   result looks exactly like a mailing list and is not one — the permission it
   would need was never collected.
2. **Nothing is written to Resend before the Step 5 plan is approved.** *Why:*
   imports are asynchronous with no batch undo; the only remedy for 300 wrong
   contacts is 300 deletes.
3. **Every import needs one of the four consent sources, recorded with the
   list.** *Why:* if nobody can say where the opt-in came from, it did not
   happen — and "I don't know" cannot survive a complaint.
4. **Never re-add an unsubscribed contact** — not by import, not by hand, not
   because a newer file lists them. *Why:* they receive mail they explicitly
   refused, and learn that unsubscribing doesn't work. Re-entry is only ever
   through the website form.
5. **Registering, donating, applying or writing to us is not subscribing.**
   *Why:* consent attaches to a purpose, not a person; one address can be
   mailable for one thing and off-limits for another at the same moment.
6. **Prefer `--on-conflict skip`.** *Why:* `upsert` silently overwrites existing
   contact state, including opt-outs the source file cannot know about.
7. **Addresses are masked everywhere they are shown.** *Why:* plans and reports
   get pasted into Slack, a far wider audience than the person who asked.
8. **CSVs live only in `tmp/` or `*.local.csv`, and are deleted afterwards.**
   *Why:* both are gitignored; anywhere else one `git add .` publishes real
   addresses into permanent public history.
9. **Report the import's own `counts`, never your expectation.** *Why:* `create`
   returning an id means the job was accepted, not that it worked; a `failed`
   count of 25 is invisible unless you poll and read it.

## Audience tiers — decision table

Consistent with `references/consent-rules.md` and `lib/email/audience.ts`.

| Tier | Who | May receive | Channel | On this list? |
|---|---|---|---|---|
| **0** | Resend contacts in a segment, opted into the topic | Anything — newsletters, campaigns, promotion | Resend broadcast to a segment/topic | **Yes — this is the list** |
| **1** | People who wrote to us (`contact_form_submissions`) | A 1:1 reply to what they asked | Individual transactional email | No — never import |
| **2** | Event registrants, mentor/mentee/volunteer applicants, donors, account holders | Only mail fulfilling what they signed up for | Individual or per-event transactional batch | No — unless they separately ticked an opt-in |
| **3** | Scraped, inherited or unexplainable addresses | Nothing, ever | — | No — and remove if found |

A Tier 2 address that ticked an opt-in box becomes Tier 0 **for that opt-in
only**, and the tick is what you record as consent.

## Common failure modes and how to recover

**`resend: command not found` / `ENOENT`** — CLI missing or not on PATH.
`npm i -g resend-cli`, `resend login`, `resend whoami`. Report the blocker; do
not substitute a database query for the roster.

**`{"error":{"code":"auth_error"}}`** — no saved key, or a `sending_access` key
that cannot manage contacts. `resend login` with a full-access key.

**Import stuck at `queued` / `in_progress`** — normal for a large file. Keep
polling `imports get <id> --json`. **Do not re-upload** — a second create
double-imports. If wedged, check `imports list --status failed --json` first.

**Import `completed` but `created: 0`, `failed: <everything>`** — almost always
no `--column-map` while the CSV has headers like `Email` / `First Name`
(matching without a map is case-sensitive against lowercase `email`,
`first_name`, `last_name`). Re-run with `--column-map`; the failed run created
nothing, so there is nothing to clean up. **`invalid_column_map`** is the
neighbouring case — malformed JSON or a header not in the file; print the header
row and compare byte-for-byte, and single-quote the JSON in PowerShell.

**Mojibake in names, or a first header reading `﻿Email`** — a UTF-8 BOM or a
non-UTF-8 export. `normalize-recipients.ts` strips the BOM; Resend's importer
does not. Ask for a re-export as UTF-8 CSV rather than repairing by hand.

**About to re-add an unsubscribed contact** — `diff-roster.ts` put them in the
`unsubscribed` bucket. Remove those rows and re-run Steps 3–5. If the user
pushes back ("she said it's fine now"): *"If she'd like back on, this link puts
her back with a record we can point to — I can't undo an unsubscribe from this
side."*

**A contact was imported by mistake** — no batch undo. Delete one at a time
(`resend contacts delete <email> --yes`). If the mistake was systematic, list
the affected addresses and confirm the whole set before deleting anything.

**The same CSV was imported twice** — `roster-state.ts sha256` warns when bytes
match a recorded import. With `skip` the second run is harmless; with `upsert`
it may have overwritten fields. Compare `imports get <id> --json` counts for
both runs and report what actually changed.

## What this skill does *not* do

- **Send any email** — not a test, not a campaign, not a confirmation.
- **Manage the monthly newsletter** — drafting, editorial and broadcast
  scheduling belong to `monthly-newsletter`.
- **Write to the database** — it only reads, and there is no consent field to
  write to anyway.
- **Decide whether consent exists** — it presents the four options and records
  the answer. Only the person who ran the form or held the clipboard knows what
  was actually asked.
- **Create or design segments and topics.** It uses what exists; segments cannot
  even be renamed (no update endpoint), so creating one is a decision for the
  user.
- **Recover an unsubscribe** — that runs through the website form and the person
  themselves, permanently and by design.
