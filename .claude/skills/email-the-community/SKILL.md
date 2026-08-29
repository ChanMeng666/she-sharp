---
name: email-the-community
description: Send a one-off She Sharp announcement to the newsletter subscribers as a gated batch — drafting a MessageSpec, rendering and gating it via `scripts/email/render-message.ts --mode broadcast`, test-sending to a mailbox the user names, then building the batch from the subscriber table with `scripts/email/recipients-from-db.ts` + `scripts/email/build-batch.ts` and sending it chunk by chunk. Use whenever the user wants to tell the whole list something — phrases like "email everyone about the new mentoring round", "send an announcement to the mailing list", "let the subscribers know applications are open", "blast out the hackathon news", "给邮件名单发个通知", "群发一封活动宣传". Covers who counts as a subscriber, the signed per-recipient unsubscribe link, subject and preview limits, one-CTA discipline, dry-run rehearsals, and duplicate-send short-circuiting via `state/broadcasts.json`. Nothing leaves the building before an explicit plan approval; audience rules: references/audience-and-consent.md.
---

# Send one announcement to everyone on the mailing list

Four things, in this order, every time:

- **This is not the monthly newsletter.** That is a scheduled, multi-section
  issue with its own skill. This is one message, about one thing, sent once.
- **The audience can only be the subscriber table** — not a database query
  across the site, not a spreadsheet, not "everyone who came to the last event".
  A row in `newsletter_subscribers` with status `subscribed` is the only place
  She Sharp records that someone asked to hear from us.
- **Email cannot be recalled.** Once a chunk is sent, it is in those inboxes
  permanently. This skill exists to put a plan block, a test send and a set of
  gates between the user's approval and that.
- **This skill only READS the list.** Adding, importing or suppressing people is
  `/update-mailing-list`. The table holds the whole imported Mailchimp list
  (**1,549 mailable as at 2026-08-30**, and it moves — Step 1 prints the live
  number), so a send here reaches real people. **Nothing has ever been sent from
  this list**, which makes the test send, the Step 6 plan block and the
  chunk-by-chunk Step 8 the gates that matter, not paperwork.

Input: a topic and a paragraph. Output: one sent batch, its record in
`state/broadcasts.json`, and a report. Commands are PowerShell-first.

**What changed, and why the old commands are gone.** The newsletter moved off
Resend broadcasts. There is no segment to send to any more; the consent record
is a table in She Sharp's own database, and marketing mail goes out as a
**batch** — one rendered message per person, each carrying its own signed
unsubscribe link. Anything you find that says "segment", "topic" or
`{{{RESEND_UNSUBSCRIBE_URL}}}` is describing the system this replaced. **The
live newsletter still goes out from Mailchimp**; none of this has taken over
from it yet.

## When to apply

Trigger conditions (examples — don't wait for an exact match):

- "email everyone about the new mentoring round" / "给邮件名单发个通知"
- "send an announcement to the mailing list" / "群发一封活动宣传"
- "let the subscribers know applications are open" / "通知订阅者一下"
- "tell the list the hackathon dates moved" / "can we email people about the Summit?"

Unsure? **Run Step 1 anyway** — it reads the table and sends nothing, and seeing
the real subscriber count usually settles the question.

## When NOT to apply

| The user wants… | Use instead |
|---|---|
| This month's newsletter issue — founder note, recap, photos, pulse | `/monthly-newsletter` |
| To add, remove, import or suppress people on the list | `/update-mailing-list` |
| Joining instructions or a reminder for one event's registrants | `/send-event-emails` |
| To answer someone who wrote in through the contact form | `/reply-to-contact-messages` |

The tell: if the recipients are defined by *something they individually did*
(registered, applied, donated, wrote in), it is not this skill. This skill has
one audience shape — everyone who confirmed a subscription.

## What the user gives you

**The minimum input is a subject and a paragraph.** "Email the list that
mentoring applications are open again" is a complete request; everything else
has a default already chosen so the user can say "yes" and move on.

**This skill is dry-run by default.** Until the user says "send" / "发吧" / "go
ahead" at the Step 6 plan block, nothing leaves the building: every command
either writes a file in `tmp/` or carries `--dry-run`, and
`state/broadcasts.json` is untouched.

| Question it asks | Default when the user shrugs |
|---|---|
| Who is it going to? | Everyone in the subscriber table with status `subscribed` — there is no other option, and Step 1 reads the count out loud |
| A cover photo? | **No cover.** Only add one if the user offers a real photo URL |
| What does the button say, and where does it go? | **Ask.** One CTA, one live `https://www.shesharp.org.nz/…` URL — never guess a link |
| When does it go out? | Ask. A batch has no scheduler — you send it when you send it, so pick a sensible NZ-local moment and wait for it |
| Which mailbox for the test send? | **Ask, every time. Never hard-code an address** |
| From / Reply-To | **`She Sharp <newsletter@shesharp.org.nz>`** — the `marketing` identity in `lib/email/senders.ts`. Anything going to the mailing list uses this, because it is the address subscribers have received the newsletter from for years and its reputation is what carries the move off Mailchimp. The **Reply-To is `info@shesharp.org.nz`**, not `newsletter@`: the From carries the reputation, the Reply-To carries none of it, and nobody on the team has `newsletter@`'s password. If a topic owns a different mailbox use that, but it must be `@shesharp.org.nz` *and* listed as monitored in `docs/development/EMAIL_ADDRESSES.md` — passing the `reply-to-domain` gate only proves the spelling |

If the user hands you the substance ("say the round starts in September and
closes on the 30th"), that substance IS the content. Put it in She Sharp's
voice — do not add facts to it. Never invent a date, fee, deadline or capacity.

## Prerequisites

1. **Working directory is the repo root** (it has `lib/email/message.ts`). The
   scripts resolve `@/lib/…` through the repo tsconfig and fail elsewhere.
2. **`POSTGRES_URL` in `.env`.** Step 1 reads the subscriber table.
   `recipients-from-db.ts` loads `.env` itself (not `.env.local`).
3. **Two variables exported in the shell before Step 7.**
   `build-batch.ts` does **not** read `.env`, deliberately — a marketing batch
   bakes an unsubscribe URL into every message, and the two values that decide
   whether that URL works have to be stated on purpose:

   ```powershell
   $env:BASE_URL = "https://www.shesharp.org.nz"
   $env:EMAIL_UNSUBSCRIBE_SECRET = "<the production value>"
   ```

   The secret lives on Vercel production. If the user does not have it to hand,
   stop and ask them for it — `docs/deployment/VERCEL_ENV_VARIABLES_GUIDE.md`
   covers pulling it. Without both, Step 7 refuses and writes nothing, which is
   the correct outcome, not a bug to work around.
4. **Subscribers to send to.** Step 1 checks; under 5, stop and ask, and run
   `/update-mailing-list` first.
5. **`resend` CLI on PATH and authenticated** — `resend whoami` must print the
   She Sharp account. Not found → install it; auth error → ask the user to run
   `resend login`. Never hand-roll an API call instead.
6. **A confirmed From / Reply-To pair.** `shesharp.org.nz` is verified for
   sending, and its MX points at Google Workspace, so "receiving disabled" in
   `resend domains list` only means Resend itself takes no inbound mail.
   **That is not the same as the mailbox existing.** A delivery probe on
   2026-08-23 found that seven addresses this repo published — `hello@`
   among them — had never been created and hard-bounced everything sent to
   them. Use only an address listed as monitored in
   `docs/development/EMAIL_ADDRESSES.md`, and confirm the pair with the user:
   the failure mode is a Reply-To nobody opens.
7. **Read `references/audience-and-consent.md`** before choosing an audience,
   and `references/resend-broadcast-cli.md` before Step 8 — it is the CLI
   reference, and its first section is why the broadcast commands you may find
   elsewhere are not this skill's mechanism any more.

---

## Step 1 — Check the audience is real

```powershell
npx tsx scripts/email/recipients-from-db.ts --key audience-check
```

It reads every `subscribed` row, applies **both** suppression registers, and
prints counts and truncated hashes — never an address:

```
  Confirmed subscribers      0
  Held back by suppression   0
  WILL BE MAILED             0
```

To see the table itself, masked (`j****@gmail.com`), including people who
started subscribing but never pressed the confirmation button:

```powershell
npx tsx scripts/email/inspect-subscribers.ts --limit 20
```

Note the **WILL BE MAILED** number — it is the one that goes in the plan block.

**If fewer than 5 people will be mailed, stop and say this:**

```
Heads up: the subscriber list currently has <n> confirmed subscriber(s).
Sending this now would reach almost nobody.

That is far below the 1,549 the table held on 2026-08-30, so it is much
more likely a wrong database or a broken connection than a real list.

  (1) check POSTGRES_URL points at production, then re-run this step
  (2) send anyway as a rehearsal — I'll note it as such
  (3) stop here
```

Then wait. Do not pick for them, and do not quietly send to an empty list — or
to a list of one — as though it were a campaign.

## Step 2 — Write the announcement spec

Choose a **key** first: kebab-case, describing the announcement, e.g.
`announce-mentoring-round-open`. It names the rendered files and is the ledger
key that stops this announcement going out twice — so reuse it across re-renders
of the same message, and change it only for a genuinely different message.

Write the spec to `tmp/specs/announce-<slug>.json` (shape in
`lib/email/message.ts`):

```json
{
  "key": "announce-mentoring-round-open",
  "engine": "react",
  "category": "marketing",
  "from": "She Sharp <newsletter@shesharp.org.nz>",
  "replyTo": "mentoring@shesharp.org.nz",
  "subject": "Mentoring applications are open again",
  "preheader": "Six months, one mentor, and a room of women in tech behind you.",
  "title": "Applications for the next mentoring round are open",
  "blocks": [
    { "type": "paragraph", "text": "We paused mentoring while we rebuilt how matching works. It is open again, and this round starts in September. Details on the [mentoring page](https://www.shesharp.org.nz/mentorship)." },
    { "type": "details", "rows": [{ "label": "Applications close", "value": "Sunday 30 August 2026" }] },
    { "type": "button", "text": "Apply to be mentored", "url": "https://www.shesharp.org.nz/mentorship/mentee" },
    { "type": "paragraph", "text": "Ngā mihi,\nThe She Sharp team" }
  ]
}
```

- **`engine: "react"`** — the branded announcement template, and the only engine
  whose footer carries an unsubscribe link at all. `"layout"` is the
  transactional design with no opt-out footer and fails the `unsubscribe` gate
  on marketing mail.
- **`category: "marketing"`** — makes the gates strict, and switches on the
  three refusals in Step 7 that protect the opt-out link.
- **Nine block types**, as a colleague would see them: `paragraph` (a paragraph;
  `[label](url)` inline links and blank lines work), `heading` (a sub-heading),
  `button` (the one big clickable button), `info` / `warning` (a tinted callout —
  these two take raw HTML, everything else is escaped plain text), `success` (a
  green confirmation line), `details` (a label/value table — ideal for When /
  Where / Deadline), `link` (a bare link line), `divider` (a rule).
- **`cover: { "url", "alt" }`** is optional and only honoured by
  `engine: "react"`. Absolute `https://` **JPEG or PNG** — `.webp` fails the
  `image-format` gate because Outlook shows it as a broken-image box. Never
  invent a cover; ask for one.
- **`subject` ≤ 50 chars, ≤ 1 emoji** (longer truncates on mobile);
  **`preheader` ≤ 120 chars and must NOT repeat the subject** — it is the second
  hook in the inbox, not an echo.
- **ONE primary CTA.** Two buttons trip the `single-cta` warning and neither
  gets clicked; other links go inline in a paragraph.
- **Never** put a registration or discount code, a private Slack link, an
  editable Google Doc or a preview deployment in the copy. Link the public page.

## Step 3 — Render and gate

```powershell
npx tsx scripts/email/render-message.ts tmp/specs/announce-mentoring-round-open.json --mode broadcast
```

`--mode broadcast` is what ships and is gated strictly. Files land at
`tmp/emails/<key>.broadcast.{html,txt}`. A clean run ends:

```
Email gates — 13.9KB rendered
  ✓ all gates passed
```

`render-message.ts` now prints the two-step batch route itself — the recipient
build and then the batch build. Neither sends.

A failed gate exits 1 but **still writes the HTML and text**, so you can open the
render and see what tripped:

- **`unsubscribe`** (fail) — almost always `engine: "layout"`. Switch to `"react"`.
- **`absolute-urls`** (fail) — a link written `/mentorship` rather than the full
  `https://www.shesharp.org.nz/mentorship`. Email clients have no base URL.
- **`image-format`** (fail) — a `.webp` cover, or an image with no extension.
- **`size-100kb`** (fail) — Gmail clips above ~102KB, hiding the footer *and the
  unsubscribe link*. Trim copy or shrink the cover.
- **`merge-tags`** (fail) — a double-brace `{{…}}` in the copy, or a tag the
  gate does not allow. Take braces out of the copy entirely.
- **`secret-scan`** (fail) — a key- or token-shaped string got into the copy.
- **`subject-length` / `preheader-length` / `single-cta`** (warn) — advisory, but
  fix them; they are the difference between a read email and a deleted one.
- **`Redactions to confirm`** is a list, not a gate: links the scanner thinks are
  internal. Remove them, and declare what you removed on the plan block's
  `Redactions:` line so the user can overrule you.

**Never build a batch from a red render.**

## Step 4 — Preview with the DRAFT banner

```powershell
npx tsx scripts/email/render-message.ts tmp/specs/announce-mentoring-round-open.json `
  --mode preview --draft-banner --open
```

Writes `tmp/emails/<key>.preview.html` with a purple "DRAFT — this email has not
been sent" banner on top, so a colleague can review it and never mistake a
forwarded preview for the real thing.

The preview render deliberately swaps the unsubscribe link for an inert `#`, and
the `unsubscribe` gate is exempt in preview mode for exactly that reason. **A
green preview is not evidence the real send has a working unsubscribe link** —
Step 3 gates it and Step 7 signs it.

## Step 5 — Test send to a mailbox the user names

Ask which mailbox. **Never hard-code an address**, and never borrow another
skill's convention. Send the **broadcast-mode** HTML — the bytes that will ship:

```powershell
resend emails send `
  --from "She Sharp <newsletter@shesharp.org.nz>" `
  --to "<the address the user gave you>" `
  --reply-to "mentoring@shesharp.org.nz" `
  --subject "[TEST] Mentoring applications are open again" `
  --html-file "tmp/emails/announce-mentoring-round-open.broadcast.html" `
  --text-file "tmp/emails/announce-mentoring-round-open.broadcast.txt" `
  --dry-run
```

Check the printed request JSON — one recipient, the right files, no residue in
the subject beyond `[TEST]` — then re-run with `--dry-run` removed. Read it on a
phone and on desktop: images load, the button is tappable, the preheader reads
well beside the subject, nothing overflows.

**Two placeholders arrive as literal text in this test** — a greeting and, in
the footer, an unsubscribe link pointing at `%%SHESHARP_UNSUBSCRIBE_URL%%`.
**That is correct**: this command sends the raw rendered file, and only Step 7's
build fills those in per person. Say so before the user reports it as a bug.

**Why `emails send` and not a one-person batch:** a single send touches no
subscriber row, records nothing, and cannot write an unsubscribe against a real
person. If the tester is themselves a confirmed subscriber and you want to
rehearse the real bytes end to end, Step 7's `--only` flag does that safely —
see the note there.

## Step 6 — Present the send plan and stop

Show this exact block:

```
Announcement : announce-mentoring-round-open
Audience     : newsletter subscribers, status "subscribed" — <WILL BE MAILED from Step 1>
Held back    : <suppressed count from Step 1> on the do-not-contact register
Subject      : Mentoring applications are open again            (37 chars)
Preview text : Six months, one mentor, and a room of women in tech behind you.  (63)
From         : She Sharp <newsletter@shesharp.org.nz>
Reply-To     : mentoring@shesharp.org.nz
Body         : 2 paragraphs + 1 details table + 1 button → https://www.shesharp.org.nz/mentorship/mentee
Render       : tmp/emails/announce-mentoring-round-open.broadcast.html (13.9KB, all gates passed)
Unsubscribe  : signed per-recipient link, built at send time
Send when    : Tue 28 Jul 2026, ~10:00 NZST — I'll wait until you say go
Redactions   : none
```

The `Redactions:` line is mandatory — every internal link, code or private detail
you deliberately kept out, or `none`. It makes the omission visible and lets the
user overrule you.

**Then wait for the user to say "send" / "发吧" / "go ahead".** Want a different
subject, link or time? Change it, re-render, and draw the whole block again.
Approval of one version is not approval of the next.

**There is no scheduler and no cancellation window.** A batch goes out when you
run the command. If the user wants it to land at 10am, wait until 10am — do not
build it early "so it's ready".

## Step 7 — Build the batch (still nothing sent)

**7.1 — short-circuit a repeat.** Hash the render, then ask the ledger:

```powershell
$sha = (Get-FileHash tmp/emails/announce-mentoring-round-open.broadcast.html -Algorithm SHA256).Hash.ToLower()
npx tsx .claude/skills/email-the-community/scripts/broadcast-ledger.ts check `
  --key announce-mentoring-round-open --html-sha256 $sha
```

It always exits 0 and prints one verdict — act on it:

| Verdict | Meaning | Do |
|---|---|---|
| `proceed` | Nothing recorded under this key | Continue to 7.2 |
| `resume-draft` | A batch was built with this exact HTML but never sent | Continue to 7.2; the build is cheap and idempotent |
| `content-changed` | A batch was built under this key from different HTML | Use a new key, or confirm with the user that the old build is abandoned |
| `no-op` | Already recorded as `sent` | **STOP.** Report it to the user and go no further |

The verdict's own explanation still talks about drafts and `resend broadcasts
delete`; the ledger predates the move. **Act on the table above, not on that
prose.**

**7.2 — build the recipient list, fresh.** Do this now rather than reusing Step
1's file: someone may have unsubscribed in between, and this is the list that
gets mailed.

```powershell
npx tsx scripts/email/recipients-from-db.ts --key announce-mentoring-round-open
```

If **WILL BE MAILED** differs from the number the user approved in Step 6 by
more than one or two, redraw the plan block and ask again.

*Rehearsing against one mailbox:* add `--only "<address>"`. It keeps exactly
that person and can only ever narrow the list — the address still has to be a
confirmed subscriber, so it cannot smuggle anyone in. `--limit <n>` caps a first
send the same way. Use a different `--key` for a rehearsal
(`…-rehearsal`) so the real build is not overwritten.

**7.3 — set the two variables and build.**

```powershell
$env:BASE_URL = "https://www.shesharp.org.nz"
$env:EMAIL_UNSUBSCRIBE_SECRET = "<the production value>"

npx tsx scripts/email/build-batch.ts tmp/specs/announce-mentoring-round-open.json `
  --recipients tmp/emails/recipients-announce-mentoring-round-open.json `
  --stage announcement
```

It refuses, before writing anything, if: the audience tier may not receive
marketing mail; `EMAIL_UNSUBSCRIBE_SECRET` is unset; `BASE_URL` is localhost or
not `https://`; or any `{{{…}}}` placeholder survives into a message. Each
refusal prints what is wrong and ends `Nothing has been written.` **Every one of
those is protecting the unsubscribe link. None of them is worked around** — fix
the cause and build again.

A clean run prints the gate report, then:

```
  Message       announce-mentoring-round-open (react, marketing)
  Audience      Tier 0 …
  Recipients    95
  Chunks        95
  Manifest      …\tmp\emails\batch-announce-mentoring-round-open-announcement.manifest.json

Send (one command per chunk — check the first chunk's file before running):

  # chunk 1/1 — 95 recipient(s)
  resend emails batch --file "…-1.json" --idempotency-key <key> --batch-validation strict
```

**Keep those commands.** Step 8 is running them, in order.

**7.4 — read one message before you send it.** Open the first chunk file and
read one entry's `"html"`. Check the footer's unsubscribe link is a real
`https://www.shesharp.org.nz/api/email/unsubscribe?t=…` URL and not
`%%SHESHARP_UNSUBSCRIBE_URL%%`, and that no `{{` braces survive anywhere. This
is the last moment any of that is free.

**7.5 — record the build:**

```powershell
npx tsx .claude/skills/email-the-community/scripts/broadcast-ledger.ts record `
  --key announce-mentoring-round-open --broadcast-id batch-announcement `
  --status draft --segment "newsletter_subscribers (subscribed)" --html-sha256 $sha `
  --digest "Mentoring applications reopen for the September 2026 round; closes 30 Aug."
```

The ledger predates the move off broadcasts, so its flags still say
`--broadcast-id` and `--segment`. Paste them as above: the id is which batch
stage this was, the segment names where the audience came from. The **key** and
the **html hash** are what actually do the work.

## Step 8 — Send, chunk by chunk

For each chunk printed by `build-batch.ts`, in order:

```powershell
resend emails batch --file "…-1.json" --idempotency-key <from build-batch> --batch-validation strict
Start-Sleep -Milliseconds 600
```

**`resend emails batch` has no `--dry-run`** — only `resend emails send` does.
The preflight already happened: every message was rendered locally, the first
was put through the strict gates, and `--batch-validation strict` makes Resend
reject a whole chunk rather than half-delivering it.

If a chunk fails, **stop the loop** — do not skip ahead. Fix the cause and
re-run that same chunk; its idempotency key makes the re-run safe. 600ms between
chunks stays under Resend's ~2 requests/second.

Then record it as sent:

```powershell
npx tsx .claude/skills/email-the-community/scripts/broadcast-ledger.ts record `
  --key announce-mentoring-round-open --broadcast-id batch-announcement `
  --status sent --segment "newsletter_subscribers (subscribed)" --html-sha256 $sha `
  --digest "Sent 28 Jul 2026 to 95 subscribers."
```

Commit `state/broadcasts.json`. It is what stops the next session sending this
announcement a second time.

## Step 9 — Verify and report

```powershell
resend logs list --limit 10 --json     # the API calls, in order
```

Then report:

```
Announcement sent.
  Key        : announce-mentoring-round-open
  Sent       : 95 subscribers, 1 chunk, 2026-07-28 10:00 NZST
  Subject    : Mentoring applications are open again
  Unsubscribe: signed per-recipient link in every message
  Ledger     : .claude/skills/email-the-community/state/broadcasts.json
```

If the list was tiny, say so plainly rather than reporting a rehearsal as a
campaign. Say explicitly if the announcement promised anything — a deadline, a
follow-up, a page that must exist — so the user actually does it.

Bounces and complaints come back through the Resend webhook and land in
`email_optouts`; nothing to do here, but `/update-mailing-list` folds them into
the committed register.

---

## Guardrails (USER-APPROVED — hard rules)

1. **Nothing is sent until the user says "send" at the Step 6 plan block.**
   Before that, every command writes a file or carries `--dry-run`. *Why:* the
   user is accountable for what lands in strangers' inboxes in She Sharp's name,
   and email has no recall.
2. **Tier 0 only — the audience is the subscriber table, never a query.** No SQL
   across the site, no CSV, no "everyone from the last event". *Why:* the rest
   of the database has no marketing-consent field, so a query cannot produce
   consent that was never collected — and a hand-built recipient list has no
   unsubscribe, which is the definition of spam and burns the domain every
   transactional email depends on.
3. **This skill NEVER writes to the subscriber table** — no subscribing,
   unsubscribing, importing or suppressing. *Why:* that table is the only record
   of consent; one skill owns writing to it (`/update-mailing-list`) so "when did
   this person opt in, and who added them?" always has an answer.
4. **Every message carries a working, signed unsubscribe link, checked in a
   real chunk file before sending.** *Why:* the preview render swaps it for an
   inert `#` by design and the test send shows the raw placeholder, so neither
   proves anything. Marketing mail without a one-click opt-out is not sendable,
   full stop.
5. **Never work around a `build-batch.ts` refusal.** Missing secret, localhost
   `BASE_URL`, surviving placeholder, wrong tier — each of those refusals is the
   opt-out link failing in a different way. Fix the cause. *Why:* a whole list
   with a broken unsubscribe is unrecoverable; a build that refuses costs
   minutes.
6. **Fewer than 5 mailable subscribers → stop and ask.** *Why:* a send to a list
   of one is a rehearsal, not a campaign, and the user should learn that before
   approving it rather than after.
7. **A key already recorded `sent` in the ledger is a hard stop.** Run
   `broadcast-ledger.ts check` before building anything. *Why:* the same
   announcement arriving twice is the failure this skill exists to prevent, and a
   crashed session cannot remember what it did.
8. **Resume, never restart.** A run that dies at chunk 4 of 9 continues at chunk
   4. *Why:* restarting re-mails everyone already reached, and there is no undo.
9. **The test-send mailbox is whatever the user names, asked for each time.**
   Never hard-code it. *Why:* a test send is a real email to a real person, and
   the right reviewer differs by announcement.
10. **Never put an internal code, private link or unpublished detail in an
    announcement** — no registration/discount codes, editable Google Docs, Slack
    archive URLs, preview deployments. Link the public page. *Why:* a send to the
    whole list is uncontrolled distribution and cannot be taken back; a
    2026-06-11 event page leaked registration codes and needed a history rewrite
    plus rotation.
11. **Never invent a date, deadline, fee, capacity or policy.** Not in the repo
    data or on the live site → ask. *Why:* a wrong date in a list email becomes
    the organisation's public promise to its whole community.
12. **No real addresses in chat, plan blocks or commits.** Counts, masked
    addresses and truncated hashes only. *Why:* the recipients file is personal
    data; it lives in `tmp/`, which is gitignored, and it stays there.

## Marketing vs transactional — decision table

| The email is… | Category | Mechanism | Unsubscribe | Skill |
|---|---|---|---|---|
| One announcement to the whole list | `marketing` | `recipients-from-db.ts` → `build-batch.ts` → `resend emails batch` | Signed per-recipient link | **this one** |
| The monthly newsletter issue | `marketing` | `scripts/newsletter/approve.ts` | Signed per-recipient link | `/monthly-newsletter` |
| Joining details for people who registered for an event | `transactional` | `normalize-recipients.ts` → `build-batch.ts` | Not applicable | `/send-event-emails` |
| A reply to someone who wrote in | `transactional` | `emails send`, one recipient | Not applicable | `/reply-to-contact-messages` |
| Password reset, receipt, application update | `transactional` | the app's own `lib/email/service.ts` | Not applicable | — (app code) |

If the user wants a `marketing` send to people who are not subscribers, the
answer is never "loop `emails send`". It is either invite them to subscribe
(`/update-mailing-list`) or re-scope it as fulfilment (`/send-event-emails`).

## Common failure modes and how to recover

**`EMAIL_UNSUBSCRIBE_SECRET is not set`** — you are in a new shell, or the
variable was set in the wrong one. `build-batch.ts` does not read `.env`. Set it
with `$env:EMAIL_UNSUBSCRIBE_SECRET = "…"` in the same window and build again.
Nothing was written.

**`BASE_URL is "http://localhost:3000", which cannot be used for a marketing
batch`** — same cause. Every unsubscribe URL is baked in at build time, so a
localhost build ships a whole list a link that resolves to their own machine.
Set `$env:BASE_URL = "https://www.shesharp.org.nz"`.

**`A merge tag survived into the html: {{{…}}}`** — the batch endpoint
substitutes nothing, so that would reach inboxes as literal braces. If the tag is
in your copy, take it out. If it appears without you writing it, it is a bug in
the email template — **say so and stop**; do not hand-edit around it.

**`✗ unsubscribe`** — `engine: "layout"` on a marketing spec. Switch to
`"react"`, which is the only engine with an opt-out footer.

**`✗ size-100kb`** — over the Gmail clip budget. Gmail truncates the message and
hides the footer *including the unsubscribe link*. Shrink or drop the cover and
trim copy; do not send it anyway.

**`✗ image-format: WebP image(s) found`** — Outlook cannot decode WebP and shows
a broken-image box. Re-export the cover as JPEG and update `cover.url`.

**The render script printed a `resend broadcasts create` command** — ignore it.
`render-message.ts` still prints the pre-batch skeleton for marketing specs and
there is no segment to fill into it. Step 7 is the real next step.

**"Can I cancel the one I sent?"** — no. There is no scheduled state and no
recall. If it is out, say so plainly and discuss a correction email instead.

**`429` mid-loop** — faster than ~2 requests/second. Stop, wait ten seconds,
resume from the failed chunk; never re-send one that succeeded.

**`resend: command not found`** — the CLI is not on PATH. Install it and retry.
Do not substitute a hand-written API call.

**`auth_error`** — no or expired API key. `resend login`, or set
`RESEND_API_KEY`. Never paste a key into a command echoed back to the user.

**The session died mid-send** — read `state/broadcasts.json` and the manifest at
`tmp/emails/batch-<key>-<stage>.manifest.json`, then `resend logs list` to see
which chunks actually went. Resume from the first chunk with no log entry.

## What this skill does *not* do

- Add, remove, import, suppress or edit anyone on the subscriber list — it only
  reads it. `/update-mailing-list` owns every write.
- Build the monthly newsletter, or touch `lib/newsletter/` and its issue JSON.
- Email event registrants, applicants, donors or contact-form senders.
- Send to an address list assembled by hand, from a CSV, or from a SQL query.
- Schedule anything. There is no scheduled state on this path.
- Write anything to the database, or to the repo outside `tmp/` and this skill's
  own `state/broadcasts.json`.
