---
name: email-the-community
description: Send a one-off She Sharp announcement to the Resend mailing list as a gated broadcast — drafting a MessageSpec, rendering and gating it via `scripts/email/render-message.ts --mode broadcast`, test-sending to a mailbox the user names, then creating a DRAFT broadcast and scheduling it with a cancellation window. Use whenever the user wants to tell the whole list something — phrases like "email everyone about the new mentoring round", "send an announcement to the mailing list", "let the subscribers know applications are open", "blast out the hackathon news", "给邮件名单发个通知", "群发一封活动宣传". Covers segment and topic selection, the mandatory unsubscribe merge tag, subject and preview limits, one-CTA discipline, dry-run rehearsals, and duplicate-send short-circuiting via `state/broadcasts.json`. Nothing is created or sent in Resend before an explicit plan approval; audience rules: references/audience-and-consent.md.
---

# Send one announcement to everyone on the mailing list

Four things, in this order, every time:

- **This is not the monthly newsletter.** That is a scheduled, multi-section
  issue with its own skill. This is one message, about one thing, sent once.
- **The audience can only be a Resend segment** — not a database query, a
  spreadsheet, or "everyone who came to the last event". A segment is the only
  place She Sharp records that someone asked to hear from us.
- **A broadcast cannot be recalled.** Once `sent`, it is in every inbox
  permanently. This skill exists to put a cancellable `scheduled` state between
  the user's approval and that.
- **This skill only READS the list.** Adding or removing contacts is
  `/update-mailing-list` — also this skill's hard prerequisite, because the list
  currently holds one contact.

Input: a topic and a paragraph. Output: one scheduled broadcast, its id in
`state/broadcasts.json`, and a report. Commands are PowerShell-first.

## When to apply

Trigger conditions (examples — don't wait for an exact match):

- "email everyone about the new mentoring round" / "给邮件名单发个通知"
- "send an announcement to the mailing list" / "群发一封活动宣传"
- "let the subscribers know applications are open" / "通知订阅者一下"
- "tell the list the hackathon dates moved" / "can we email people about the Summit?"

Unsure? **Run Step 1 anyway** — it is read-only, and seeing the real audience
size usually settles the question.

## When NOT to apply

| The user wants… | Use instead |
|---|---|
| This month's newsletter issue — founder note, recap, photos, pulse | `/monthly-newsletter` |
| To add, remove, import or suppress people on the list | `/update-mailing-list` |
| Joining instructions or a reminder for one event's registrants | `/send-event-emails` |
| To answer someone who wrote in through the contact form | `/reply-to-contact-messages` |

The tell: if the recipients are defined by *something they individually did*
(registered, applied, donated, wrote in), it is not this skill. This skill has
one audience shape — everyone in a segment.

## What the user gives you

**The minimum input is a subject and a paragraph.** "Email the list that
mentoring applications are open again" is a complete request; everything else
has a default already chosen so the user can say "yes" and move on.

**This skill is dry-run by default.** Until the user says "send" / "发吧" / "go
ahead" at the Step 6 plan block, it creates nothing in Resend: every command
runs with `--dry-run`, and `state/broadcasts.json` is untouched.

| Question it asks | Default when the user shrugs |
|---|---|
| Which segment? | `Newsletter Pilot` — confirm the name and count out loud |
| Which topic? | `Monthly Newsletter` — always pass one, so opt-out has granularity |
| A cover photo? | **No cover.** Only add one if the user offers a real photo URL |
| What does the button say, and where does it go? | **Ask.** One CTA, one live `https://www.shesharp.org.nz/…` URL — never guess a link |
| When does it go out? | The next weekday, 10am NZ, at least an hour away |
| Which mailbox for the test send? | **Ask, every time. Never hard-code an address** |
| From / Reply-To | **`She Sharp <newsletter@shesharp.org.nz>`** — the `marketing` identity in `lib/email/senders.ts`. Anything going to the mailing list uses this, because it is the address subscribers have received the newsletter from for years and its reputation is what carries the Mailchimp → Resend move. The **Reply-To is `info@shesharp.org.nz`**, not `newsletter@`: the From carries the reputation, the Reply-To carries none of it, and nobody on the team has `newsletter@`'s password. If a topic owns a different mailbox use that, but it must be `@shesharp.org.nz` *and* listed as monitored in `docs/development/EMAIL_ADDRESSES.md` — passing the `reply-to-domain` gate only proves the spelling |

If the user hands you the substance ("say the round starts in September and
closes on the 30th"), that substance IS the content. Put it in She Sharp's
voice — do not add facts to it. Never invent a date, fee, deadline or capacity.

## Prerequisites

1. **Working directory is the repo root** (it has `lib/email/message.ts`). The
   scripts resolve `@/lib/…` through the repo tsconfig and fail elsewhere.
2. **`resend` CLI on PATH and authenticated** — `resend whoami` must print the
   She Sharp account. Not found → install it; auth error → ask the user to run
   `resend login`. Never hand-roll an API call instead.
3. **A segment with people in it.** Step 1 checks; under 5 contacts, stop and
   ask, and run `/update-mailing-list` first.
4. **A confirmed From / Reply-To pair.** `shesharp.org.nz` is verified for
   sending, and its MX points at Google Workspace, so "receiving disabled" in
   `resend domains list` only means Resend itself takes no inbound mail.
   **That is not the same as the mailbox existing.** A delivery probe on
   2026-08-23 found that seven addresses this repo published — `hello@`
   among them — had never been created and hard-bounced everything sent to
   them. Use only an address listed as monitored in
   `docs/development/EMAIL_ADDRESSES.md`, and confirm the pair with the user:
   the failure mode is a Reply-To nobody opens.
5. **Read `references/audience-and-consent.md`** before choosing an audience,
   and `references/resend-broadcast-cli.md` before Step 7.

---

## Step 1 — Check the audience is real

```powershell
resend segments list --json
resend topics list --json
(resend contacts list --json | ConvertFrom-Json).data.Count
```

For every list She Sharp holds and its consent tier (read-only, addresses
masked): `npx tsx scripts/email/audience-report.ts --include-resend`.

Note the segment **name**, its id, the topic id and the contact count — all four
go in the plan block.

**If the segment holds fewer than 5 contacts, stop and say this:**

```
Heads up: "Newsletter Pilot" currently has 1 contact.
Sending a broadcast now reaches essentially nobody.

  (1) run /update-mailing-list first, then come back
  (2) send anyway as a rehearsal — I'll note it as such
  (3) stop here
```

Then wait. Do not pick for them, and do not quietly send to a list of one as
though it were a campaign.

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
  that emits the unsubscribe merge tag. `"layout"` is the transactional design
  with no opt-out footer and fails the `unsubscribe` gate on marketing mail.
- **`category: "marketing"`** — makes the gates strict, and makes
  `render-message.ts` print a `broadcasts create` skeleton instead of a
  single-recipient send command.
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

Next — create the broadcast as a draft (no API call with --dry-run):
resend broadcasts create `
  --from "She Sharp <newsletter@shesharp.org.nz>" `
  --subject "Mentoring applications are open again" `
  --preview-text "Six months, one mentor, and a room of women in tech…" `
  --name "announce-mentoring-round-open" --reply-to "mentoring@shesharp.org.nz" `
  --segment-id <SEGMENT_ID> --topic-id <TOPIC_ID> `
  --html-file "tmp/emails/…broadcast.html" --text-file "tmp/emails/…broadcast.txt" `
  --dry-run
```

**Keep that command** — Step 7 is it with the two ids filled in. (It is printed
with one flag per line; the elisions above are only to keep this page short.)

Confirm both merge tags survived into the HTML — the unsubscribe link is the one
thing you cannot add later:

```powershell
Select-String tmp/emails/announce-mentoring-round-open.broadcast.html '\{\{\{[^}]*\}\}\}' -AllMatches |
  ForEach-Object { $_.Matches.Value } | Sort-Object -Unique
# → {{{RESEND_UNSUBSCRIBE_URL}}} and {{{contact.first_name|there}}}
```

A failed gate exits 1 but **still writes the HTML and text**, so you can open the
render and see what tripped:

- **`unsubscribe`** (fail) — almost always `engine: "layout"`. Switch to `"react"`.
- **`absolute-urls`** (fail) — a link written `/mentorship` rather than the full
  `https://www.shesharp.org.nz/mentorship`. Email clients have no base URL.
- **`image-format`** (fail) — a `.webp` cover, or an image with no extension.
- **`size-100kb`** (fail) — Gmail clips above ~102KB, hiding the footer *and the
  unsubscribe link*. Trim copy or shrink the cover.
- **`merge-tags`** (fail) — a double-brace `{{…}}`, or a tag other than the two
  allowed. Resend needs triple braces.
- **`secret-scan`** (fail) — a key- or token-shaped string got into the copy.
- **`subject-length` / `preheader-length` / `single-cta`** (warn) — advisory, but
  fix them; they are the difference between a read email and a deleted one.
- **`Redactions to confirm`** is a list, not a gate: links the scanner thinks are
  internal. Remove them, and declare what you removed on the plan block's
  `Redactions:` line so the user can overrule you.

**Never create a broadcast from a red render.**

## Step 4 — Preview with the DRAFT banner

```powershell
npx tsx scripts/email/render-message.ts tmp/specs/announce-mentoring-round-open.json `
  --mode preview --draft-banner --open
```

Writes `tmp/emails/<key>.preview.html` with a purple "DRAFT — this email has not
been sent" banner on top, so a colleague can review it and never mistake a
forwarded preview for the real thing.

The preview render deliberately swaps the merge tags for inert values, and the
`unsubscribe` gate is exempt in preview mode for exactly that reason. **A green
preview is not evidence the real send has an unsubscribe link** — Step 3 is.

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

**Why `emails send` and not a broadcast to a test segment:** a single send does
not consume the mailing list, creates no broadcast record, and cannot write an
unsubscribe against a real contact. A "test broadcast" would do all three.

**Merge tags arrive as literal text in the test** — `Hi
{{{contact.first_name|there}}},` and an unsubscribe link pointing at
`{{{RESEND_UNSUBSCRIBE_URL}}}`. **That is correct**; Resend substitutes them at
*broadcast* delivery only. Say so before the user reports it as a bug.

## Step 6 — Present the broadcast plan and stop

Show this exact block:

```
Announcement : announce-mentoring-round-open
Audience     : segment "Newsletter Pilot" (c0041ec5-…) — 1 contact
Topic        : "Monthly Newsletter" (301e1e64-…) — scopes what unsubscribe opts out of
Subject      : Mentoring applications are open again            (37 chars)
Preview text : Six months, one mentor, and a room of women in tech behind you.  (63)
From         : She Sharp <newsletter@shesharp.org.nz>
Reply-To     : mentoring@shesharp.org.nz
Body         : 2 paragraphs + 1 details table + 1 button → https://www.shesharp.org.nz/mentorship/mentee
Render       : tmp/emails/announce-mentoring-round-open.broadcast.html (13.9KB, all gates passed)
Unsubscribe  : {{{RESEND_UNSUBSCRIBE_URL}}} present
Schedule     : Tue 28 Jul 2026, 10:00 NZST (in ~2 hours) — cancellable until then
Redactions   : none
```

The `Redactions:` line is mandatory — every internal link, code or private detail
you deliberately kept out, or `none`. It makes the omission visible and lets the
user overrule you.

**Then wait for the user to say "send" / "发吧" / "go ahead".** Want a different
subject, link or time? Change it, re-render, and draw the whole block again.
Approval of one version is not approval of the next.

## Step 7 — Create the draft (not the send)

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
| `resume-draft` | A draft exists with this exact HTML | Skip to Step 8 with that id |
| `content-changed` | A draft exists but the HTML differs | Delete the old draft or use a new key — never two drafts under one name |
| `no-op` | Already `scheduled` or `sent` | **STOP.** Report it to the user and go no further |

**7.2 — dry-run the create.** Take the Step 3 command, replace `<SEGMENT_ID>` /
`<TOPIC_ID>` with the real ids from Step 1, keep `--dry-run` on. It prints
`{"dryRun":true,"request":{…}}` and calls nothing; confirm `segmentId`,
`topicId`, `previewText`, `replyTo`, and a non-empty `html`.

**7.3 — create it for real: drop `--dry-run`, and do NOT add `--send`.**
`create` without `--send` produces a **draft** — a broadcast that exists, can be
inspected, updated and deleted, and has been delivered to nobody. `--send` would
deliver it immediately with no cancellation window. Keep the returned id.

**7.4 — read it back before going near Step 8:**

```powershell
resend broadcasts get <broadcast-id> --json
```

Check `segment_id` is the segment you named, `topic_id` is set, `status` is
`draft`, `scheduled_at` and `sent_at` are both `null`, subject and from are
right, `html` is non-empty. A wrong `segment_id` is the mistake that cannot be
undone once sent — this is the last moment it is free.

**7.5 — record it:**

```powershell
npx tsx .claude/skills/email-the-community/scripts/broadcast-ledger.ts record `
  --key announce-mentoring-round-open --broadcast-id <broadcast-id> --status draft `
  --segment "Newsletter Pilot" --html-sha256 $sha `
  --digest "Mentoring applications reopen for the September 2026 round; closes 30 Aug."
```

## Step 8 — Schedule (or send)

```powershell
resend broadcasts send <broadcast-id> --scheduled-at "in 1 hour"
```

`--scheduled-at` takes ISO 8601 (`2026-07-28T22:00:00Z`) or natural language
(`"in 1 hour"`, `"tomorrow at 9am"`). **Default to at least an hour out**, at a
sensible NZ-local time (timing guidance in `references/audience-and-consent.md`).

*Why the hour:* a **scheduled** broadcast can still be cancelled —
`resend broadcasts delete <id> --yes` cancels delivery outright. A **sent** one
cannot be recalled by any means. That hour is the only window in which a wrong
date, a wrong segment or a typo is still free. Omitting `--scheduled-at` sends
immediately and throws the window away; do that only if the user asks.

Record the new state, and tell the user the cancellation command:

```powershell
npx tsx .claude/skills/email-the-community/scripts/broadcast-ledger.ts record `
  --key announce-mentoring-round-open --broadcast-id <broadcast-id> --status scheduled `
  --segment "Newsletter Pilot" --html-sha256 $sha --scheduled-at "2026-07-28T22:00:00Z"
```

## Step 9 — Verify delivery

After the slot passes:

```powershell
resend broadcasts get <broadcast-id> --json    # status → sent, sent_at set
resend logs list --limit 10 --json             # the API calls, in order
```

Record `--status sent`, then report:

```
Broadcast delivered.
  Key       : announce-mentoring-round-open
  Broadcast : 8f2c1a94-… → sent 2026-07-28T22:00:14Z
  Audience  : segment "Newsletter Pilot" — 1 contact
  Subject   : Mentoring applications are open again
  Ledger    : .claude/skills/email-the-community/state/broadcasts.json

Note: the list holds 1 contact, so this reached one mailbox.
Run /update-mailing-list before the next announcement.
```

Say explicitly if the announcement promised anything — a deadline, a follow-up,
a page that must exist — so the user actually does it.

---

## Guardrails (USER-APPROVED — hard rules)

1. **Nothing is created or sent in Resend until the user says "send" at the Step
   6 plan block.** Before that, every command carries `--dry-run`. *Why:* the
   user is accountable for what lands in strangers' inboxes in She Sharp's name,
   and a broadcast has no recall.
2. **Tier 0 only — the audience is a Resend segment, never a query.** No SQL, no
   CSV, no "everyone from the last event". *Why:* the database has no
   marketing-consent field, so a query cannot produce consent that was never
   collected — and a hand-built recipient list has no unsubscribe, which is the
   definition of spam and burns the domain every transactional email depends on.
3. **This skill NEVER writes to Resend contacts** — no `contacts
   create/update/delete/imports`, no segment or topic edits. *Why:* the contact
   list is the only record of consent; one skill owns writing to it
   (`/update-mailing-list`) so "when did this person opt in, and who added them?"
   always has an answer.
4. **Every broadcast carries `{{{RESEND_UNSUBSCRIBE_URL}}}`, verified on the
   `--mode broadcast` render.** *Why:* the preview render swaps the tag for an
   inert placeholder by design, so a green preview proves nothing. Marketing mail
   without a one-click opt-out is not sendable, full stop.
5. **Fewer than 5 contacts in the segment → stop and ask.** *Why:* a broadcast to
   a list of one is a rehearsal, not a campaign, and the user should learn that
   before approving it rather than after.
6. **A key already `scheduled` or `sent` in the ledger is a hard stop.** Run
   `broadcast-ledger.ts check` before creating anything. *Why:* the same
   announcement arriving twice is the failure this skill exists to prevent, and a
   crashed session cannot remember what it did.
7. **Default to a schedule at least an hour out; never `create --send`.** *Why:*
   `scheduled` can be cancelled with `broadcasts delete`; `sent` cannot be
   touched. That hour is the only free correction window that exists.
8. **The test-send mailbox is whatever the user names, asked for each time.**
   Never hard-code it. *Why:* a test send is a real email to a real person, and
   the right reviewer differs by announcement.
9. **Never put an internal code, private link or unpublished detail in an
   announcement** — no registration/discount codes, editable Google Docs, Slack
   archive URLs, preview deployments. Link the public page. *Why:* a broadcast is
   uncontrolled distribution and cannot be taken back; a 2026-06-11 event page
   leaked registration codes and needed a history rewrite plus rotation.
10. **Never invent a date, deadline, fee, capacity or policy.** Not in the repo
    data or on the live site → ask. *Why:* a wrong date in a broadcast becomes
    the organisation's public promise to its whole community.

## Broadcast vs transactional — decision table

| The email is… | Category | Mechanism | Unsubscribe | Skill |
|---|---|---|---|---|
| One announcement to the whole list | `marketing` | `broadcasts create` + `send`, against a segment | Required merge tag | **this one** |
| The monthly newsletter issue | `marketing` | `scripts/newsletter/approve.ts` | Required merge tag | `/monthly-newsletter` |
| Joining details for people who registered for an event | `transactional` | `emails send` per recipient | Not applicable | `/send-event-emails` |
| A reply to someone who wrote in | `transactional` | `emails send`, one recipient | Not applicable | `/reply-to-contact-messages` |
| Password reset, receipt, application update | `transactional` | the app's own `lib/email/service.ts` | Not applicable | — (app code) |

If you want a `marketing` send to people who are not in a segment, the answer is
never "loop `emails send`". It is either invite them to subscribe
(`/update-mailing-list`) or re-scope it as fulfilment (`/send-event-emails`).

## Common failure modes and how to recover

**`missing_segment`, or the broadcast reached nobody** — `--segment-id` was
omitted, or a topic id was pasted into it. Re-read `resend segments list --json`;
the two id spaces look identical and are not.

**`preview_text` is absent from `broadcasts get --json`** — the documented `get`
output shape does not list it, so its absence there is not proof it was dropped.
Confirm from the `create --dry-run` request JSON, where `previewText` definitely
appears. (The repo's REST wrapper `lib/newsletter/resend-api.ts:284` genuinely
does drop `previewText` — but that is the newsletter path, not this one.)

**`✗ size-100kb`** — over the Gmail clip budget. Gmail truncates the message and
hides the footer *including the unsubscribe link*. Shrink or drop the cover and
trim copy; do not send it anyway.

**`✗ image-format: WebP image(s) found`** — Outlook cannot decode WebP and shows
a broken-image box. Re-export the cover as JPEG and update `cover.url`.

**`✗ merge-tags: Double-brace template syntax found`** — a `{{…}}` slipped into
the copy. Resend needs **triple** braces and delivers `{{…}}` literally. Only
`{{{contact.first_name|fallback}}}` and `{{{RESEND_UNSUBSCRIBE_URL}}}` are
allowed; the CLI help's `{{{FIRST_NAME}}}` form fails this gate — use the repo's.

**"Can I cancel the one I scheduled?"** — yes, while it is still scheduled:
`resend broadcasts delete <broadcast-id> --yes` cancels delivery immediately.
Then re-record it as `draft`, or tell the user it is gone. **A `sent` broadcast
cannot be deleted or recalled** — if it is out, say so plainly and discuss a
correction email instead.

**`send_error` on a broadcast that exists** — broadcasts created in the Resend
**dashboard** cannot be sent through the API. Recreate it with
`resend broadcasts create` and send that one.

**`resend: command not found`** — the CLI is not on PATH. Install it and retry.
Do not substitute a hand-written API call: the CLI is what applies the segment
and the unsubscribe, and a raw call is exactly where those get forgotten.

**`auth_error`** — no or expired API key. `resend login`, or set
`RESEND_API_KEY`. Never paste a key into a command echoed back to the user.

**The session died between `create` and `send`** — run
`broadcast-ledger.ts show`, then `resend broadcasts get <id> --json`. Believe
Resend over the ledger, then correct the ledger with `record`.

## What this skill does *not* do

- Add, remove, import, suppress or edit anyone on the Resend list — it only reads
  it. `/update-mailing-list` owns every write.
- Build the monthly newsletter, or touch `lib/newsletter/` and its issue JSON.
- Email event registrants, applicants, donors or contact-form senders.
- Send to an address list assembled by hand, from a CSV, or from a SQL query.
- Create segments or topics, or change who belongs to one.
- Write anything to the database, or to the repo outside `tmp/` and this skill's
  own `state/broadcasts.json`.
