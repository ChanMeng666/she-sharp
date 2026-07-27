---
name: send-event-emails
description: Send the four stage emails around one She Sharp event — welcome, week-before, day-before, thank-you — to the people who registered, joining event facts from `lib/data/json/events-custom.json` to a recipient list exported from Humanitix, through `scripts/email/normalize-recipients.ts` and `scripts/email/build-batch.ts`. Use whenever the user wants to email an event's registrants — phrases like "remind the people coming tomorrow", "send the room number to everyone who registered", "the workshop's finished, send a thank-you", "email the AUT hackathon attendees", "给报名的人发个提醒" — or anything about attendee, ticket-holder or registrant email. Covers the four stages, Humanitix column mapping, refunded and duplicate rows, chunked sending that resumes after a failure instead of restarting, and the hard line between fulfilment mail and marketing. Assumes the event is already in the repo — `sync-event-from-slack` puts it there.
---

# Email the people who registered for one event

Three facts shape everything below.

- **The event lives in the repo** — title, date, time, venue, registration link,
  in `lib/data/json/events-custom.json` via `lib/data/events.ts`. Read it only
  through `scripts/resolve-event.ts`, which handles the fuzzy name, the timezone
  and the local-calendar date this repo has drifted on before.
- **The recipients do not.** `event_registrations` is empty; registration runs on
  **Humanitix**. The list arrives as a CSV a human exports. Nothing about who is
  coming is discoverable from this codebase.
- **The two meet in `tmp/` and are never written back** — no database row, no
  Resend contact, no list import. The only thing committed is a ledger of sha256
  hashes.

Underneath all of it: **registering is not subscribing.** Someone who bought a
ticket asked to hear about that event, not to hear from She Sharp again. That
line is enforced in `lib/email/audience.ts`, not left to judgement.

Commands are PowerShell-first. **Dry-run by default**: until the user approves
the Step 8 plan block, nothing is sent.

## When to apply

Trigger conditions (examples — don't wait for an exact match):

- "remind the people coming tomorrow" / "提醒一下明天工作坊的人"
- "send the room number to everyone who registered" / "把房间号发给报名的人"
- "the workshop's finished — send a thank-you" / "活动结束了发个感谢信"
- "email the registrants for the AUT one" / "给 AUT 那场的报名者发邮件"
- "the venue changed, tell the attendees"
- "here's the Humanitix export, can you email them"

Unsure? Run Step 1. It reads the repo and writes nothing.

## When NOT to apply

| The ask is | Use instead |
|---|---|
| Tell the mailing list about something (a new mentoring round, a general announcement) | `email-the-community` |
| Add these attendees to the mailing list | `update-mailing-list` |
| Reply to one person who wrote to us | `reply-to-contact-messages` |
| Put the event on the website in the first place | `sync-event-from-slack` |
| The monthly newsletter | `monthly-newsletter` |

The dividing question is *who*: an announcement to subscribers is not event ops,
even when it is about an event.

## What the user gives you

**Two things: an event name (however vague) and a path to a Humanitix CSV.**
Everything else this skill asks, with a default already chosen.

| Question it asks | Default when the user shrugs |
|---|---|
| Which event? | Whatever they said — Step 1 resolves it and reads it back |
| Which stage? | **Ask.** Inferred from timing (see the stage table), never assumed |
| Room / level / join details (`day-before`) | **Ask.** Never invent a room number |
| Feedback form URL (`thank-you`) | **Ask.** No form → drop the button |
| Photo album URL (`thank-you`) | The event's `galleryUrl` if it has one, else omit |
| Which mailbox? | `She Sharp <hello@shesharp.org.nz>`, Reply-To `hello@shesharp.org.nz` |
| Test-send address? | **Ask.** The user names it; this skill has no default mailbox |
| How many at a time? | 100 per chunk (the Resend maximum), 600ms between chunks |

If the user gives you the substance ("tell them we've moved to level 8"), that
substance IS the content. Put it in She Sharp's voice; do not add facts to it.

## Prerequisites

1. **Working directory is the repo root** (it has `lib/email/message.ts`). The
   shared scripts resolve `@/lib/…` through the repo tsconfig and fail elsewhere.
2. **The event is in `lib/data/json/events-custom.json`.** Step 1 finds nothing
   → stop, run `sync-event-from-slack` — copy written around an unverified event
   is how a wrong date goes out.
3. **A Humanitix CSV with an attendee email column** (no column, no send — see
   `references/humanitix-export.md`). Put it in `tmp/` or name it `*.local.csv`;
   both are gitignored.
4. **`resend` CLI on PATH and authenticated** — `resend whoami` must print the
   She Sharp account. Missing → install it. Auth error → ask the user to run
   `resend login`. Never hand-roll an API call instead.
5. **A Reply-To that a human actually reads.** `shesharp.org.nz` receives
   through Google Workspace, so its aliases are real inboxes — the risk is
   naming one nobody opens, on an email people will reply to.

## Step 1 — Identify the event

```powershell
npx tsx .claude/skills/send-event-emails/scripts/resolve-event.ts "myob working smarter"
```

It prints the slug, title, date (human-readable *and* `YYYY-MM-DD` from local
calendar fields), the verbatim time string, venue, address, registration URL, the
public event page and an add-to-calendar link.

**Read the title, date and venue back to the user and wait for a yes.** Every
later step quotes these exact strings.

- **Several candidates** (exit 2) — listed with dates and venues. She Sharp has
  run a same-named hackathon most years, so the answer is always "ask".
- **Nothing matched** (exit 1) — the event isn't in the repo (run
  `sync-event-from-slack`), or the wording is too far off. `--list` browses.
- **Multi-day warning** — quote the printed `Time` string verbatim.
- **No add-to-calendar link** — no start time in the record. Drop the calendar
  button rather than guessing one.

## Step 2 — Choose the audience route

| The email is | Route | Mechanism |
|---|---|---|
| For people who registered, about **this** event only — room number, time change, join link, thanks and feedback | **(a) transactional direct** | `resend emails batch`, `category: "transactional"`, one line reading "You're receiving this because you registered for `<event>`"; **never added to Resend contacts** |
| For the same people, but promoting **other** events | **(b) per-event segment broadcast** | Not yet available. Requires a consent-gated import through `update-mailing-list` first, then a broadcast carrying an unsubscribe link |
| For subscribers rather than registrants | **(c) hand over** | `email-the-community` — that is an announcement, not event ops |
| Registration form had **no** marketing opt-in question | **(a) only** | No opt-in, no marketing eligibility. Full stop |

**This skill implements route (a) and nothing else.** If what the user wants is
(b) or (c), say so and hand over rather than stretching (a) to cover it — the
stretch is exactly what the tier rules exist to prevent.

## Step 3 — Read the Humanitix export

Read `references/humanitix-export.md` first — at least the attendee-vs-buyer
section. Then detect, **without `--map`, so nothing is written**:

```powershell
npx tsx scripts/email/normalize-recipients.ts tmp/csv/myob-jul-2026.local.csv --key myob-jul-2026
```

```
I read …\myob-jul-2026.local.csv — 6 rows. I think:
  Email        ← column "E-Mail Address"   (5/6 look like emails)
  First name   ← column "Given Name"       (6/6 filled)
  Order status ← column "Order Status"     (5 completed, 1 refunded → will exclude)
Is that right? Reply "yes", or tell me which one is wrong.
```

**Say that back to the user in plain words and wait.** Then re-run with the
`--map` it printed:

```powershell
npx tsx scripts/email/normalize-recipients.ts "tmp/csv/myob-jul-2026.local.csv" `
  --key myob-jul-2026 `
  --map "email=E-Mail Address,firstName=Given Name,lastName=Last Name,status=Order Status,optIn=Can we email you about future events?"
```

That writes `tmp/emails/recipients-myob-jul-2026.json` at **tier 2** (event
registrants, fulfilment only). Never pass `--for-import` — that is the
mailing-list path and belongs to `update-mailing-list`.

## Step 4 — Filter

The normaliser has already removed, and reported by count: **refunded /
cancelled / declined / void orders**; **duplicate addresses** (a four-ticket order
is four rows — first kept, the rest listed with spreadsheet row numbers);
**malformed addresses** (a bounce costs the domain's sending reputation, which
every later email pays for); and **anyone on the hashed suppression list**.

One thing it deliberately does not decide: **`Pending` / awaiting-payment rows**
reach you as recipients — raise them in the plan block. Then subtract anyone who
already got **this stage**:

```powershell
npx tsx .claude/skills/send-event-emails/scripts/event-ledger.ts hashes `
  --slug she-sharp-and-myob-working-smarter --stage day-before `
  --out tmp/emails/sent-hashes.json
```

On a first send that file holds an empty list, so the build command is identical
either way — which is the point.

## Step 5 — Compose the stage message

Read `references/stage-templates.md` — block skeletons for all four stages, the
voice rules, and the field map for what comes from event data versus what you must
ask the user for. Do not improvise a tone.

Write the spec to `tmp/specs/<event-key>-<stage>.json`, using the same string as
the spec `key`; the stage then appears twice in generated filenames
(`batch-…-day-before-day-before-1.json`), which is expected — the key keeps each
stage's render separate, the suffix is added by `build-batch.ts`.

Non-negotiable in every spec: `engine: "layout"`, `category: "transactional"`, one
`button`, absolute URLs, `{firstName}` left literal, and a closing paragraph
saying why they received it.

## Step 6 — Render and check

```powershell
npx tsx scripts/email/render-message.ts tmp/specs/myob-working-smarter-day-before.json --mode broadcast
```

`--mode broadcast` is what ships and is gated strictly; files land at
`tmp/emails/<key>.broadcast.{html,txt}` (`--open` opens the HTML). A clean run
ends `✓ all gates passed`. A failed gate exits 1 but still writes the files, so
open the render and see what tripped — never build a batch from a red render.
Carry whatever `Redactions to confirm` names to the plan block.

## Step 7 — Test send

Send exactly one message to an address **the user names in this session** — this
skill has no hard-coded test mailbox, so ask. Copy the command
`render-message.ts` printed, put that address in `--to`, and run it **with `--dry-run` still on**. Check the command before its output: one
address, the right Reply-To, no `[TEST]` residue in the subject, the `.broadcast.*`
files, an idempotency key present.

Then run it **without `--dry-run`** — one real email, to the test address only.
Ask the user to open it on a phone. A room number that wraps badly on mobile is
worth catching now.

## Step 8 — Present the send plan

Show this block and stop:

```
Event       : Working Smarter: AI, MYOB, and the New Delivery Landscape
              30 July 2026, 5:00pm - 7:30pm NZST · MYOB, 8/50 Albert Street
Stage       : day-before
Audience    : Tier 2 — event registrants (fulfilment only), route (a) transactional
Recipients  : 3 to send
Excluded    : 1 refunded order · 1 duplicate address (row 5) · 1 malformed address (row 6)
Already sent: 0 (this stage has not run before)
Chunks      : 1 × 3, 600ms apart, ~0.0s of rate-limit waiting
Render      : tmp/emails/myob-working-smarter-day-before.broadcast.html (4.5KB, all gates passed)
Test send   : delivered to <the address the user named>
After send  : record each chunk in the ledger, then finish the stage
Redactions  : none
```

`Excluded:` names every category with its count and reason — only the user can
tell you a "duplicate" is really two people sharing a work address. `Redactions:`
is mandatory: every code, private link or passcode-bearing URL you kept out, or
`none`. **When resuming, the block opens with this exact line:**

```
RESUMING — chunks 2..3 of 3, 81 recipients already emailed will be skipped
```

Then wait for "send" / "发吧" / "go ahead". Changes wanted? Edit, re-render, draw
the whole block again. Never execute it partially.

## Step 9 — Build and preflight the batch

```powershell
npx tsx scripts/email/build-batch.ts tmp/specs/myob-working-smarter-day-before.json `
  --recipients tmp/emails/recipients-myob-jul-2026.json `
  --stage day-before `
  --exclude-hashes tmp/emails/sent-hashes.json
```

It enforces the audience rule first (a marketing spec on this list dies here),
renders every message, gates the first strictly, writes
`batch-<key>-<stage>-<n>.json` plus a manifest, and prints one paste-able command
per chunk.

**`resend emails batch` has no `--dry-run`** — only `resend emails send` does
(confirm with `resend emails batch --help`). The equivalent preflight is what just
ran: every message rendered locally, the first gated strictly, plus
`--batch-validation strict` so Resend rejects a whole chunk rather than
half-delivering it. To eyeball one message, open a chunk file and read its `html`.

Open the ledger entry before sending:

```powershell
npx tsx .claude/skills/send-event-emails/scripts/event-ledger.ts start `
  --slug she-sharp-and-myob-working-smarter --stage day-before `
  --manifest tmp/emails/batch-myob-working-smarter-day-before-day-before.manifest.json
```

## Step 10 — Send, chunk by chunk, recording as you go

For each chunk, in order:

```powershell
resend emails batch --file "…-1.json" --idempotency-key <from build-batch> --batch-validation strict

npx tsx .claude/skills/send-event-emails/scripts/event-ledger.ts record-chunk `
  --slug she-sharp-and-myob-working-smarter --stage day-before `
  --chunk 1 --resend-id re_… --resend-id re_…

Start-Sleep -Milliseconds 600
```

**Record the chunk the moment it succeeds — not at the end of the loop.** The
whole design exists for the run that dies at chunk 4 of 9: recorded, that costs
five more chunks; unrecorded, a duplicate send or a silent gap.

The batch endpoint returns one id per message (`[{"id":"…"}]`); pass them to
`--resend-id`, which repeats. 600ms between chunks stays under Resend's free-tier
~2 requests/second. If a chunk fails, **stop the loop** — don't skip ahead. Fix
the cause and resume from that same chunk; its idempotency key makes it safe.

## Step 11 — Record and report

```powershell
npx tsx .claude/skills/send-event-emails/scripts/event-ledger.ts finish `
  --slug she-sharp-and-myob-working-smarter --stage day-before `
  --digest "MYOB Working Smarter, 30 Jul 2026: day-before room details sent to all 3 registrants (Level 8, Kauri room). Thank-you stage still to do."
```

`finish` refuses while chunks remain — that refusal is a feature. Commit
`state/event-emails.json`; it is what stops the next run re-mailing these people.
Then report: event, stage, how many were emailed, how many excluded and why, how
many chunks, which stages remain, and anything the user still owes you (a feedback
form URL, a decision on the pending orders).

## Guardrails (USER-APPROVED — hard rules)

1. **Registering is not subscribing.** Registrants are tier 2 — fulfilment mail
   for the event they signed up for, nothing else; never imported to a list as a
   side effect. *Why:* consent does not transfer between lists, and
   `assertSendAllowed` refuses anyway.
2. **Not one email leaves without the user saying "send".** Everything before the
   Step 8 plan block is dry-run. *Why:* the user is accountable for what an
   outsider receives in She Sharp's name.
3. **Email cannot be recalled, so you resume — you never restart.** A failed run
   continues from the next unrecorded chunk. *Why:* restarting re-mails everyone
   who already got it, and there is no undo.
4. **A completed stage is not re-sent** without `--force` *and* the user naming
   the event and the stage out loud this session. *Why:* "resend the reminder" is
   ambiguous between a stage and one person, and the expensive reading hits a
   hundred inboxes twice.
5. **Never write a registration, discount or access code, or a passcode-bearing
   meeting link, into an email.** Link the public page. *Why:* the repo leaked
   hackathon codes in June 2026 and needed history rewritten and codes rotated —
   an email cannot be rewritten.
6. **Dates, times, venue and title come from the event data's local calendar
   fields** via `resolve-event.ts` — never `toISOString()`, never memory. *Why:*
   UTC-formatting a locally-built Date has already shifted a published date here
   by a day; in an email it becomes the organisation's promise.
7. **Every email carries one line saying why they received it**, naming the event
   and date. *Why:* it is what makes the message self-evidently fulfilment rather
   than a campaign — to the reader and to a spam filter.
8. **The test-send address is whatever the user names this session.** Never
   hard-code one, never borrow another skill's. *Why:* a wrong default sends real
   event copy to someone with no context.
9. **No real names or addresses leave `tmp/`** — counts and masked addresses in
   chat and plan blocks, only sha256 hashes committed. *Why:* the export is
   personal data and the repository is not the place for it.

## Stage decision table

| Stage | Send when | The one job | Ask the user for |
|---|---|---|---|
| `welcome` | Right after an export, registration open | Confirm they're in; get it in their calendar | nothing |
| `week-before` | ~7 days out | Agenda, and how to get there | agenda outline, parking/transport |
| `day-before` | ~1 day out | Get them through the right door | room/level or join link, on-the-day contact |
| `thank-you` | 1–2 days after | Thanks, feedback, photos, one subscribe **link** | feedback form URL, album URL |

A stage nobody asked for is not sent. Four emails about a two-hour evening
workshop is too many — for a single-session event, `welcome` + `day-before` is
usually the whole programme.

## Common failure modes and how to recover

**`I read … but I cannot find an email column`** — the export was made without
"Include attendee email"; nothing here can recover it. Show the user the header
list the script printed and ask for a re-export.

**`"…" matches 5 events. Which one?` (exit 2)** — genuinely ambiguous; show the
list and let the user name one, never pick the top row. **Exit 1, `Nothing in the
event data matches`** — the event isn't in the repo: run `sync-event-from-slack`,
or browse with `--list`.

**`✗ absolute-urls`** — a link written as `/events/…`; email clients have no base
URL, so rewrite every URL full. **`✗ image-format`** — a WebP or site-relative
image; these templates use none.

**`Blocked: cannot send a marketing email to Tier 2`** — the spec says
`category: "marketing"`. Either it is genuinely fulfilment (fix the category) or
genuinely promotion (route (b): stop, go via `update-mailing-list`).

**`429` mid-loop** — faster than ~2 requests/second. Stop, wait ten seconds,
resume from the failed chunk; never re-send one already recorded.

**A chunk fails halfway** — record what succeeded, write fresh `hashes`, rebuild
with `--exclude-hashes`, re-run `event-ledger.ts start` with the new manifest (it
detects the rebuild, keeps the emailed hashes, resets chunk numbering), continue.
**`the manifest … is not the one this stage was started with`** means you rebuilt
without re-running `start`; re-run it, nothing is lost.

**`resend: command not found`** — install the CLI and retry. Never substitute a
hand-written API call: the idempotency keys and `--batch-validation strict` are
what make a re-run safe.

**`state/event-emails.json is not valid JSON`** — restore it from git, never
delete it. An empty ledger reads as "nobody has been emailed", and the next run
re-mails everyone.

## What this skill does *not* do

- Send to anyone who is not on this event's registrant list.
- Add anyone to a mailing list, Resend audience, segment or topic — it can link
  to a subscribe page, never subscribe someone.
- Send marketing or cross-event promotion to registrants (route (b) is not built;
  route (c) belongs to `email-the-community`).
- Write to the database. `event_registrations` stays empty; Humanitix remains the
  system of record for who is coming.
- Create, edit or publish the event itself — that is `sync-event-from-slack`.
- Decide for the user whether pending/unpaid registrations should be emailed.
