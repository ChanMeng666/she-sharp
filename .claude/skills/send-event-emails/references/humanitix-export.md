# Getting a usable attendee list out of Humanitix

She Sharp's event registrations do **not** live in this repo's database. The
`event_registrations` table exists but is empty — registration runs on
Humanitix, an external platform. So the recipient list for every stage email
starts as a CSV a human downloads and hands over. This page is what to tell that
human, and how to read what they give you.

## What to ask for

> "In Humanitix, open the event → **Reports** (or **Attendees**) → **Export** →
> CSV. Tick **Include attendee email** before you download. Send me the file, or
> drop it in the repo's `tmp/` folder."

The one field that matters is the email. Everything else the pipeline can work
around; without an email column there is nothing to send to and no way to fix it
except a re-export.

Ask for these columns if the export screen offers a choice:

- Attendee email **and** buyer/order email (see below — they differ)
- Attendee first name and last name
- Order status
- Ticket type
- Any custom checkout question about hearing from She Sharp again

## Attendee email vs buyer email — who actually gets the mail

Humanitix separates the **buyer** (the person who paid, one per order) from the
**attendee** (one per ticket). One buyer can register four colleagues.

- **Fulfilment mail for the event — room number, time change, join link, the
  thank-you — goes to the ATTENDEE email.** They are the person walking through
  the door.
- The buyer email only matters for money: refunds, invoices. This skill does not
  send those.

If the export has both, map `email=` to the attendee column. If it has only a
buyer column, say so plainly in the plan block: some attendees will not be
reached directly, and the buyer will have to forward it. Do not silently treat a
buyer address as an attendee address.

## Column names you will actually see

Humanitix does not have one stable header set — it changes with the ticket
configuration, the checkout questions, and the export screen used. Real headers
that have come out of it:

| Meaning | Headers seen |
|---|---|
| Email | `E-Mail Address`, `Attendee Email`, `Email`, `Buyer Email` |
| First name | `Given Name`, `First Name`, `Attendee First Name` |
| Last name | `Last Name`, `Surname`, `Family Name` |
| Order state | `Order Status`, `Status`, `Ticket Status` |
| Marketing question | `Can we email you about future events?`, `Subscribe to updates` |

`normalize-recipients.ts` detects all of these by meaning rather than exact
match, and it asks before it writes anything. Run it **without** `--map` first,
read its guess back to the user in plain words, and only then re-run with the
`--map` it printed. When it cannot find an email column it lists every header in
the file and stops — that list is what you show the user.

## Order status values

The status column is how refunded and cancelled people get kept out of the send.

| Value | Means | Emailed? |
|---|---|---|
| `Completed` | Paid (or free) and confirmed | Yes |
| `Refunded` | Money returned; they are not coming | **No** |
| `Cancelled` | Order cancelled before the event | **No** |
| `Pending` / `Awaiting payment` | Checkout never finished | Ask the user — usually no |

`normalize-recipients.ts` drops anything whose status contains `cancel`,
`refund`, `declin` or `void`, and reports the count by reason. `Pending` is not
in that list on purpose: whether an unpaid registration should get the room
number is a judgement call about that specific event, so it reaches you as a
recipient and you raise it in the plan block.

## Duplicate rows are normal

A four-ticket order produces four rows. If the buyer put their own address on
every ticket, you get the same address four times. The normaliser keeps the
first occurrence and reports the rest as `duplicates` with their spreadsheet row
numbers — the numbers a colleague can type straight into Excel (header is row 1,
so the first data row is row 2).

Never "fix" duplicates by hand in the spreadsheet. Hand-editing is how the wrong
row survives.

## Rows with no email, or a broken one

Typed addresses arrive broken: a missing `@`, a trailing comma, a whole sentence
in the email cell. These land in `malformed` with the row number and the raw
value, and they are **excluded from the send** — a bounce hurts the domain's
sending reputation, which affects every later email.

Report the count and the row numbers to the user. If it is more than one or two,
the export probably has the wrong column mapped; check before sending.

## If there is no email column at all

The export was generated without "Include attendee email" ticked. There is no
recovery inside this repo — no database copy, no cache. Ask for a re-export.
Sending to buyer emails "because they're there" is not a substitute; say so.

## Where the file goes, and what never gets committed

A Humanitix export is a list of real people's names and addresses. It must not
enter git.

- Put it in **`tmp/`** (the whole directory is gitignored), or name it
  **`*.local.csv`** anywhere (`**/*.local.csv` is gitignored).
- `tmp/csv/<event-key>.local.csv` satisfies both. Use it.
- The normalised output (`tmp/emails/recipients-<key>.json`) contains the same
  addresses in plaintext and is covered by the same `tmp/` rule. It is a working
  file, not a record.
- The **only** thing this skill commits is
  `.claude/skills/send-event-emails/state/event-emails.json`, which stores
  sha256 hashes of lowercased addresses — enough to know who has already been
  emailed, not enough to email anyone.

Before finishing a session, check: `git status` should show no CSV and no
`recipients-*.json`. If one appears, it is in the wrong place — move it, don't
add it to `.gitignore` case by case.

Never paste the contents of an export into chat, a commit message, a Slack
message or a plan block. Counts and masked addresses only.

## Sanity checks before you build a batch

1. **Row count matches what the user expects.** "About eighty" and a 12-row file
   means the wrong export, or a filtered view.
2. **Recipients + excluded + duplicates + malformed = rows read.** The
   normaliser prints a warning if they don't; treat it as a stop.
3. **The event in the file is the event you resolved.** Check the ticket-type or
   event-name column against the title `resolve-event.ts` printed. Two exports
   in a downloads folder look identical.
4. **Nobody appears who obviously shouldn't** — a test order the team placed, a
   staff address. Ask; exclusions are cheap, an unwanted email is not.
