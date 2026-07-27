---
name: reply-to-contact-messages
description: Answer She Sharp's contact-form enquiries — reconciling `contact_form_submissions` against the #contact-form-notifications Slack channel (C0AGVRL0G5A), drafting and gating a MessageSpec with `scripts/email/render-message.ts`, sending via the Resend CLI, then closing the row with `scripts/email/mark-contact-replied.ts` and noting the Slack thread. Use whenever the user works the contact inbox — phrases like "who hasn't been replied to yet", "reply to the contact form messages", "clear the enquiry inbox", "answer the person asking about sponsorship", "draft a reply to the person who emailed us", "回一下联系表单", or anything about turning a contact-form submission into a sent reply. Covers QA/test rows never emailed, sponsor leads, vendor pitches, DB↔Slack drift, dry-run previews, one-reply-per-row idempotency via `reviewed_at`, and stopping when a minor or safeguarding concern appears. Tone/templates: references/reply-voice-and-templates.md.
---

# Reply to the messages people sent through the contact form

Four things, in this order, every time:

- **The database is the authority.** Every submission is a row in
  `contact_form_submissions`, and `reviewed_at IS NOT NULL` is the ONLY durable
  "this one is handled" marker — there is no `replied` status.
- **Slack is the human's field of view.** `#contact-form-notifications` is where
  the team reads enquiries and where a colleague may already have answered
  in-thread. A second opinion, never the record.
- **The reply goes out through the Resend CLI**, from a rendered file on disk.
- **Nothing is sent until the user says so.** The plan block (Step 6) is the
  gate; before it, everything runs dry.

Input: usually nothing — the user just asks who is waiting. Output: sent replies,
each with its row closed, its Slack thread annotated, and a line in
`state/inbox-state.json`. Commands are PowerShell-first.

## When to apply

Trigger conditions (examples — don't wait for an exact match):

- "who hasn't been replied to?" / "谁还没回"
- "reply to the contact form messages" / "回一下联系表单"
- "clear the enquiry inbox" / "清一下咨询箱"
- "answer the person who asked about sponsorship" / "帮我回那个赞助的人"
- "draft a reply to the person who emailed us about the hackathon"
- "did anyone answer the message from Tuesday?"

Unsure whether it applies? **Run the reconcile step anyway** — it is read-only
and writes only a gitignored cache, so seeing the queue costs nothing.

## What the user gives you

**The minimum input is nothing at all.** "Help me with the contact inbox" is a
complete request; everything else this skill asks for, with a default already
chosen so the user can say "yes" and move on.

**This skill is dry-run by default.** Until the user says "send" / "发吧" / "go
ahead" it sends no email (`resend … --dry-run`), writes nothing to the database
(`mark-contact-replied.ts --dry-run`), posts nothing to Slack
(`post-slack-reply-note.ts --dry-run`), and leaves `state/inbox-state.json` alone.

| Question it asks | Default when the user shrugs |
|---|---|
| Which rows to answer? | Every replyable row not already answered in Slack |
| What should the reply say? | **Ask.** Never assume — see Step 3 |
| Who is signing? | "The She Sharp team" — never a named individual |
| Which mailbox? | `She Sharp <hello@shesharp.org.nz>`, Reply-To per the table in `references/reply-voice-and-templates.md` |
| The vendor pitches — bin them? | **Ask.** Never decide this for the user |
| One reply, or the whole queue? | One at a time, newest first, a plan block per reply |

If the user hands you the substance ("tell her the hackathon is full but the AI
Summit isn't"), that substance IS the content. Your job is to put it in She
Sharp's voice — not to add facts to it.

## Prerequisites

1. **Working directory is the repo root** (it has `lib/email/message.ts`). The
   scripts resolve `@/lib/…` through the repo tsconfig and fail elsewhere.
2. **`DATABASE_URL` in `.env`** — that name, *not* `POSTGRES_URL`. Missing it
   kills every DB script on connect and there is no offline mode for the queue,
   so stop and tell the user.
3. **`SLACK_BOT_TOKEN` in `.env`** (read scopes for reconcile, `chat:write` for
   the thread note). **If missing, do not stop** — degrade: run everything with
   `--no-slack`, treat every row as `db-only`, skip the thread note, say so.
4. **`resend` CLI on PATH and authenticated** — `resend whoami` must print the
   She Sharp account. Not found → install it; auth error → ask the user to run
   `resend login`. Never hand-roll an API call instead.
5. **A confirmed From / Reply-To pair** (table in
   `references/reply-voice-and-templates.md`). Ask once per session, reuse
   silently. `shesharp.org.nz` receives mail through Google Workspace, so the
   aliases do work — the risk is picking one nobody reads, which sends the
   person's answer into a mailbox no one opens.

---

## Step 1 — See who is waiting

```powershell
npx tsx .claude/skills/reply-to-contact-messages/scripts/reconcile-inbox.ts
```

Read-only. It joins every row against the Slack channel and prints the queue:

```
Contact inbox — pending (reviewed_at IS NULL)

  #5    2026-04-24  QA Verification <q***@example.com>         qa-test      db-only
  #6    2026-06-20  Thavamany Thavarasan <t***@yahoo.com>      general      db-only
  #7    2026-07-03  Trever Gray <t***@sendproud.com>           vendor-pitch matched
  #8    2026-07-12  Maahir Hussain Shaik <m***@gmail.com>      general      matched    [already answered in Slack thread]
  #9    2026-07-20  Mahsa Shoja <s***@gmail.com>               general      matched
  #10   2026-07-21  May Li <l***@gmail.com>                    general      matched
  #11   2026-07-22  Hannah Melotto <h***@melottogroup.com>     vendor-pitch matched

  counts: pending=7 (matched=5, db-only=2) slackOnly=0 ambiguous=0 | general=4 sponsor=0 qa-test=1 vendor-pitch=2
  next: 3 of 4 replyable row(s) look genuinely un-answered — draft replies for those; mark qa-test rows reviewed without emailing.
        2 row(s) look like unsolicited vendor outreach. That is a judgement call — show the message to the user and let them decide before marking any of them "no reply needed".
```

- **`#<id>`** — `contact_form_submissions.id`; every later command keys off it,
  followed by the submission date.
- **name `<masked email>`** — masked in console output on purpose; the real
  address is in `--json`, which is where you get it for the send.
- **kind** — `general` / `sponsor` / `qa-test` / `vendor-pitch`; drives triage.
- **reconcile** — `matched` (joined to a Slack notification) or `db-only` (the
  webhook failed, or the row predates the integration). `db-only` is perfectly
  replyable; you just can't post a thread note for it.
- **`[already answered in Slack thread]`** — a real person replied there. Strong
  signal, not a verdict: **read the thread before deciding.**

Variants: `--json` (machine-readable, carries real emails + Slack ts),
`--include-handled`, `--no-slack` (DB only), `--limit 20` (cap how many pending
rows are shown — it does **not** narrow the Slack search), `--slack-depth 500`
(read further back through the channel when an old row reports `db-only` and you
suspect its notification is simply out of range). If the report shows
`ambiguous` or `slack-only` rows, resolve those first — see *Common failure
modes* and `references/slack-reconciliation.md`.

## Step 2 — Triage before writing a word

Decide *whether* each row gets an email at all, in this order:

1. **`qa-test` first, always.** Team form tests. Never emailed — and this check
   outranks everything, including the sponsor prefix (a QA run of the sponsor
   form trips both). Close `no-reply-needed --reason "QA test row"`.
2. **`[already answered in Slack thread]`** — open the thread (permalink in
   `--json`) and read it. A teammate genuinely emailed them → close
   `no-reply-needed --reason "answered by <who> in Slack thread"`. Only "I'll
   email them" and nothing went out → still unanswered, reply normally.
3. **`vendor-pitch`** — advisory only. Show the user the message text; they
   choose no reply (usual) or a one-paragraph decline. **Never mark a
   vendor-pitch row without the user's word in this session.**
4. **Safeguarding stop.** A minor, personal safety, a code-of-conduct complaint,
   immigration status → stop. Summarise for the user, draft nothing, say plainly
   it needs a human decision.
5. **Everything else** (`general`, `sponsor`) gets a real reply. Read the full
   body from `--json`, not from Slack — Slack section blocks truncate near 3000
   characters and the form accepts 5000.

## Step 3 — Draft the reply

Read `references/reply-voice-and-templates.md` first — voice rules, the four
block structures (general / mentoring / event registration / sponsorship), the
From-and-Reply-To table, and the messages that get no template reply. Do not
improvise a tone.

**The content comes from the user.** If they said what to say, that is the
substance — you translate it into She Sharp's voice and nothing more. If they
didn't, ask. You may ground a reply in what is already in the repo (event dates
in `lib/data/json/events-custom.json`, the live mentorship status, real
`https://www.shesharp.org.nz` URLs) but **never invent** a date, fee, capacity,
policy or availability. "I'll check with the team and come back to you this week"
is a correct reply; a confident guess is not.

Write the draft as a `MessageSpec` JSON at `tmp/specs/contact-reply-<id>.json`
(shape in `lib/email/message.ts`):

```json
{
  "key": "contact-reply-9",
  "engine": "layout",
  "category": "transactional",
  "from": "She Sharp <hello@shesharp.org.nz>",
  "replyTo": "mentoring@shesharp.org.nz",
  "subject": "Re: your message about our mentoring programme",
  "preheader": "A quick answer about where the programme is up to.",
  "title": "Thanks for getting in touch",
  "blocks": [
    { "type": "paragraph", "text": "Kia ora {firstName}," },
    { "type": "paragraph", "text": "…the actual answer…" },
    { "type": "button", "text": "About the programme", "url": "https://www.shesharp.org.nz/mentorship" },
    { "type": "paragraph", "text": "Ngā mihi,\nThe She Sharp team" }
  ],
  "tags": [{ "name": "category", "value": "contact-reply" },
           { "name": "submission_id", "value": "9" }]
}
```

- **`key`** must be kebab-case, and should be `contact-reply-<id>` — it names the
  rendered files and seeds the idempotency key.
- **`engine: "layout"`** = the branded transactional layout (`"react"` is the
  announcement template and ignores `{firstName}`). **`category:
  "transactional"`** — a reply is not marketing; `"marketing"` trips the
  unsubscribe gate and prints a *broadcast* command instead of a send.
- **Nine block types**, as a colleague would see them: `paragraph` (a paragraph,
  `[label](url)` inline links work), `heading` (a sub-heading), `button` (the one
  big clickable button), `info` / `warning` (a tinted callout box — these two
  take raw HTML, everything else is escaped plain text), `success` (a green
  confirmation line), `details` (a small label/value table, good for
  Event / When / Where), `link` (a bare link line), `divider` (a rule).
- **`{firstName}` stays literal** — the renderer substitutes it and falls back to
  `there` when no name is known.
- **One button per email** (two trips the `single-cta` gate, and neither gets
  clicked). Don't repeat the contact address, logo or copyright — the footer has
  them.

## Step 4 — Render and check the gates

```powershell
npx tsx scripts/email/render-message.ts tmp/specs/contact-reply-9.json --mode broadcast
```

`--mode broadcast` is what ships and is gated strictly (`preview` is the default
and looser). `--open` opens the HTML; `--draft-banner` stamps a "not sent" banner
on a review copy. Files land at `tmp/emails/<key>.<mode>.{html,txt}`. A clean run
ends:

```
Email gates — 3.1KB rendered
  ✓ all gates passed

Next — dry-run the send (no API call):
resend emails send `
  --from "She Sharp <hello@shesharp.org.nz>" `
  --to <RECIPIENT> `
  --reply-to "mentoring@shesharp.org.nz" `
  --subject "Re: your message about our mentoring programme" `
  --html-file "tmp/emails/contact-reply-9.broadcast.html" `
  --text-file "tmp/emails/contact-reply-9.broadcast.txt" `
  --tags category=contact-reply `
  --tags submission_id=9 `
  --idempotency-key contact-reply-9-491e2f2e `
  --dry-run
```

A failed gate exits 1 but **still writes the HTML and text**, so you can open the
render and see what tripped. What you will actually meet:

- **`absolute-urls`** (fail) — a link written as `/mentorship` instead of the
  full `https://www.shesharp.org.nz/mentorship`. Email clients have no base URL.
- **`single-cta`** (warn) — two buttons; pick one. **`subject-length` /
  `preheader-length`** (warn) — trim to ~50 / ~120 chars.
- **`secret-scan`** (fail) — a key- or token-shaped string got into the copy.
  **`size-100kb`, `image-format`, `merge-tags`, `unsubscribe`** are rare in a
  short reply; read the message, fix the spec, re-render.
- **`Redactions to confirm`** is a list, not a gate: links the scanner thinks are
  internal (a booking link, an editable Google Doc, a Slack archive URL, a
  preview deployment). Remove them, and declare what you removed on the plan
  block's `Redactions:` line so the user can overrule you.

Never send from a red render.

## Step 5 — Dry-run the send

Copy the printed command, replace `<RECIPIENT>` with the sender's real address
(from `--json`), and run it **with `--dry-run` still on**. Check the command
itself before you read its output:

- `--to` carries **exactly one** address, and it is the person who wrote in.
- `--reply-to` matches the mailbox agreed in the prerequisites.
- `--subject` has no `[TEST]` / `DRAFT` residue and reads like a reply.
- `--html-file` / `--text-file` point at the `.broadcast.*` render you just made,
  and the HTML is non-empty.
- `--idempotency-key` is present — derived from the rendered HTML, so re-running
  the same bytes is a no-op while re-running after an edit is a new send.

## Step 6 — Present the reply plan and stop

Show this exact block, one per reply:

```
Submission  : #9 — Mahsa Shoja <shojamahsa87@gmail.com>
Kind        : general (matched to Slack thread 1753000000.000100)
Subject     : Re: your message about our mentoring programme
From        : She Sharp <hello@shesharp.org.nz>
Reply-To    : mentoring@shesharp.org.nz
Body        : 3 paragraphs + 1 button → https://www.shesharp.org.nz/mentorship
Render      : tmp/emails/contact-reply-9.broadcast.html (3.1KB, all gates passed)
After send  : mark #9 replied · post thread note on 1753000000.000100 · record state
Redactions  : none
```

The `Redactions:` line is mandatory — every internal link, code or private Slack
detail you found and deliberately kept out, or `none`. It makes the omission
visible and lets the user overrule you.

**Then wait for the user to say "send" / "发吧" / "go ahead".** Want a different
tone, link, or length? Change it, re-render, and draw the whole block again.
Never execute it partially: a sent email with an unclosed row is worse than
nothing sent.

## Step 7 — Send, mark, and note

**7.1 — send:** the Step 5 command with `--dry-run` removed and `<RECIPIENT>`
filled in. Keep the returned Resend message id.

**7.2 — close the row.** Dry-run first to see the exact UPDATE:

```powershell
npx tsx scripts/email/mark-contact-replied.ts --id 9 --outcome replied `
  --resend-id re_abc123 `
  --subject "Re: your message about our mentoring programme" --dry-run
```

```
Contact #9 — Mahsa Shoja <shojamahsa87@gmail.com>
  submitted:   2026-07-20T00:10:36.614Z
  outcome:     replied

UPDATE contact_form_submissions SET
  reviewed_at  = 2026-07-27T13:25:25.780Z            (was null)
  status       = approved    (was submitted)
  reviewed_by  = null    (was null)
  review_notes =
    Replied ... · resend=test-abc · subject="..."
WHERE id = 9;

DRY RUN — nothing was written.
```

Re-run without `--dry-run`. Add `--by-email <admin@…>` to attribute the review to
a specific admin account.

> **If the email sent but this write fails, retry once. If it fails again, print
> the exact command, tell the user the row is still open, and STOP. Do not
> re-send the email.** The reply is already in their inbox; the only damage is a
> stale queue entry, and a second email is real damage.

Rows that get no email at all (QA row, a vendor pitch the user declined, one a
teammate already answered):

```powershell
npx tsx scripts/email/mark-contact-replied.ts --id 5 --outcome no-reply-needed `
  --reason "QA test row"
```

**7.3 — leave the Slack thread note** (skip when reconcile said `db-only`, or
when running `--no-slack`):

```powershell
npx tsx .claude/skills/reply-to-contact-messages/scripts/post-slack-reply-note.ts `
  --thread-ts 1753000000.000100 --submission-id 11 --dry-run
```

```
[DRY RUN] chat.postMessage payload:
{
  "channel": "C0AGVRL0G5A",
  "thread_ts": "1753000000.000100",
  "text": "✅ Replied to the sender by email on 28 Jul 2026, 1:16 am — submission #11"
}
```

Drop `--dry-run` to post. `--name "Mahsa Shoja"` names the sender in the default
wording; `--note "…"` replaces the text entirely. **A failure here is a warning,
not an error** — the email went out and `reviewed_at` is written, so the
submission is correctly handled; only the channel lacks its note. Report and
carry on.

## Step 8 — Record and report

```powershell
npx tsx .claude/skills/reply-to-contact-messages/scripts/inbox-state.ts record `
  --submission-id 9 --outcome replied --resend-id re_abc123 `
  --digest "Asked whether mentoring is open; told her applications are paused and pointed at events." `
  --watermark 1753000000.000100
```

`--watermark` is optional (the newest Slack ts processed this run);
`inbox-state.ts show` prints the whole log. This file is a **run log, not a
gate** — never read it to decide whether to send. Then report:

```
Replied to 2 of 7 pending enquiries.
  #9  Mahsa Shoja  mentoring  hello@ / reply-to mentoring@  resend re_abc123
  #10 May Li       general    hello@ / reply-to hello@      resend re_def456
Closed without an email: #5 QA test row · #8 answered by Sarah in Slack, 12 Jul
Still open (your call): #7, #11 vendor pitches — decline or ignore?
                        #6 needs to know whether we run beginner workshops
Queue: 7 → 3 pending.
```

Say explicitly whether any reply promised a follow-up, so the user actually does it.

---

## Guardrails (USER-APPROVED — hard rules)

1. **Not one email leaves without the user saying "send".** Everything is dry-run
   until the Step 6 plan block is approved. *Why:* the user is accountable for
   what an outsider receives in She Sharp's name, and a send cannot be recalled.
2. **`qa-test` rows are never emailed, and that check outranks every other
   classification.** *Why:* a QA run of the sponsor form satisfies both rules, and
   a warm, real-looking reply to a teammate's test row is the expensive mistake.
3. **`vendor-pitch` is a hint, not a decision.** Show the message; the user
   decides; never mark one without their word this session. *Why:* the classifier
   keys off phrasing, and a real member saying "happy to grab a time" must not be
   silently binned.
4. **Minors, safety, complaints, immigration status → stop and hand over, draft
   nothing.** *Why:* these need judgement, a named human and often a policy this
   skill cannot see; a helpful-sounding auto-reply can do harm and commit the
   organisation.
5. **A reply never mentions another enquirer** — no names, no addresses, no
   "someone else asked the same thing". *Why:* the contact table is personal data
   and one careless sentence is a privacy breach.
6. **Never put internal codes, private links or Slack content in an email** — no
   registration/discount/access codes, editable Google Docs, Slack archive URLs
   or preview deployments; link the public page. *Why:* a code in an outbound
   email is uncontrolled distribution and cannot be taken back.
7. **Never invent a date, fee, capacity, policy or someone's availability.** Not
   in the repo data or on the live site → say you'll confirm. *Why:* a wrong date
   in a reply becomes the organisation's promise.
8. **`reviewed_at` is the idempotency truth; `state/inbox-state.json` is not.**
   Re-run `reconcile-inbox.ts` against the database before sending. *Why:* a
   session can send and die before recording, and the file does not survive a
   teammate replying by hand.
9. **The plan block comes before the send, always — even for a one-line reply.**
   *Why:* it is the only moment at which a mistake is still free.

## Triage decision table

| kind | Email? | Action | Close as |
|---|---|---|---|
| `qa-test` | Never | No draft, no send. Highest priority — beats the sponsor prefix. | `--outcome no-reply-needed --reason "QA test row"` |
| `general` | Yes | Template 1 (or 2 / 3 for mentoring or an event) from the references. | `--outcome replied --resend-id … --subject …` |
| `sponsor` | Yes | Template 4. Strip the `[Sponsor Inquiry]` prefix before quoting back. | `--outcome replied --resend-id … --subject …` |
| `vendor-pitch` | User decides | Show the message. Usually nothing; occasionally a one-paragraph decline, no button. | Only after the user says so |
| any + `[already answered in Slack thread]` | Read the thread first | A real answer went out → close it. Only "I'll email them" → reply normally. | `--outcome no-reply-needed --reason "answered by <who> in Slack thread"` |
| any + safeguarding signal | Never | Summarise for the user, draft nothing, hand over. | Leave open |

## Common failure modes and how to recover

**`ambiguous` non-zero in the reconcile output** — two or more Slack messages
plausibly match one row, so it was deliberately excluded from `pending`. Show the
candidates (`deltaSeconds` + permalinks from `--json`) and let the user pick, or
reply with no thread note. Never guess the thread. To inspect the raw Slack parse
on its own, run `scripts/fetch-contact-notifications.ts` (flags: `--since <ts>`,
`--limit <n>`, `--json`, `--no-permalinks`); it also caches the full payload to
`.cache/contact-notifications.json`.

**`Slack-only notifications with no DB row: N`** — a notification with no
unhandled row behind it; usually the row is already reviewed, occasionally the
insert failed. **Send nothing.** Report it and let the user check.

**`ERROR: chat.postMessage failed (missing_scope)`** — the bot token lacks
`chat:write`; add it under the Slack app's OAuth & Permissions and reinstall.
**`(not_in_channel)`** — the bot isn't in `#contact-form-notifications`; invite
it or grant `channels:join`. Both are cosmetic: the email is out and the row is
closed, so never re-send over them.

**`✗ absolute-urls`** — a link in the spec is site-relative. Rewrite every URL to
full `https://www.shesharp.org.nz/…` and re-render.

**`ERROR: contact #9 was already reviewed at … (status=approved). Refusing to
overwrite.`** — the row is closed already, which almost always means the reply
went out (the printed `review_notes` carries the `resend=` id). **Do not send
again.** Use `--force` only when the user explicitly wants a second audit line
appended, e.g. after a genuine follow-up email.

**Scripts die on connect / `DATABASE_URL` undefined** — the variable is missing
from `.env`. It is `DATABASE_URL`, not `POSTGRES_URL`. No offline mode; stop.

**`resend: command not found`** — the CLI isn't on PATH. Install it and retry; do
not substitute a hand-written API call, because the printed command's tags and
idempotency key are what make a re-run safe.

**`SLACK_BOT_TOKEN is not set in .env`** — degrade, don't stop: re-run reconcile
with `--no-slack`, treat every row as `db-only`, skip Step 7.3, say so.

## What this skill does *not* do

- Send to more than one recipient. One reply, one person, one row.
- Touch mailing lists, audiences, segments or subscription state — it can link to
  a signup page, never subscribe anyone.
- Send event announcements, newsletters or any marketing email
  (`category: "marketing"` is out of scope here by design).
- Change the contact form, its schema, or the Slack notification template.
- Decide for the user whether an unsolicited vendor pitch deserves a reply.
- Reply on behalf of a named individual unless the user says who is signing.
