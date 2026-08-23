---
name: promote-event
description: Announce ONE upcoming She Sharp event to the Resend mailing list, building the email from the event's own record in `lib/data/json/events-custom.json` so the date, time, venue and registration link cannot disagree with the website. Use whenever someone wants the subscribers told about an event that has not happened yet — phrases like "email the list about the Les Mills panel", "tell everyone about next month's event", "promote Thursday's night to the mailing list", "send out the event announcement", "can we let subscribers know about the hackathon", "宣传一下下个月的活动", "给邮件名单发个活动通知", "把这场活动群发给订阅者", "发个活动预告", "通知订阅者来参加". It generates the MessageSpec with `scripts/email/event-announcement-spec.ts` and then HANDS OVER to `/email-the-community` from its Step 3 onward for rendering, gating, preview, test send, plan block, draft and scheduling — it duplicates none of that. Not for emailing people who registered (that is `/send-event-emails`), not for the monthly newsletter, and it is blocked until `/update-mailing-list` has actually populated the Resend list.
---

# Announce one upcoming event to the mailing list

**Read this first: the mailing list is empty, so this skill cannot finish
today.** `.claude/skills/update-mailing-list/state/roster.json` records no
imports, `.claude/skills/email-the-community/state/broadcasts.json` records no
broadcasts, and the newsletter people actually receive still goes out from
**Mailchimp**, not Resend. Nothing is wrong with the machinery — there is simply
nobody in Resend to send to yet. Step 2 checks the live count and stops there if
it is still true. Run `/update-mailing-list` first; then come back and this works
end to end.

Four facts shape everything below.

- **The event lives in the repo, and the email is built from it.** Title, date,
  time, venue, speakers, partner and the registration link are read through
  `scripts/events/resolve-event.ts` — the same resolver the stage emails and the
  posters use. Nothing is retyped, so the email cannot say Thursday while the
  website says Wednesday.
- **Registering for an event is not subscribing.** The audience here is a Resend
  segment and nothing else — never a registrant list, never a Humanitix export,
  never a database query. Someone who bought a ticket asked about *that event*,
  not to hear from She Sharp again. `references/consent-rules.md` in
  `/update-mailing-list` is the binding version of this.
- **This skill is thin.** It resolves the event, builds a spec, and hands over.
  Every consent check, gate, preview, test send, plan block, ledger entry and
  schedule belongs to `/email-the-community`, which already does all of it.
- **A broadcast cannot be recalled.** Which is why the handover happens at the
  step where that skill starts being careful, not after it.

Commands are PowerShell-first. **Nothing is created or sent in Resend by this
skill.**

## When to apply

Trigger conditions (examples — don't wait for an exact match):

- "email the list about the Les Mills panel" / "给邮件名单发个活动通知"
- "tell everyone about next month's event" / "宣传一下下个月的活动"
- "promote Thursday night to the subscribers" / "发个活动预告"
- "send the event announcement out" / "把这场活动群发给订阅者"
- "can we let the community know about the hackathon before tickets close?"

Unsure? Run Step 1. It reads the repo and writes nothing.

## When NOT to apply

| The ask is | Use instead |
|---|---|
| Joining details, a room number, a reminder or a thank-you for people who **registered** | `/send-event-emails` |
| An announcement that is not about one event — a mentoring round, a policy change, a call for volunteers | `/email-the-community` |
| This month's newsletter issue | `/monthly-newsletter` |
| Add these attendees to the mailing list | `/update-mailing-list` |
| Put the event on the website in the first place | `/sync-event-from-slack` |
| A poster, banner or social graphic for the event | `/make-event-poster` |

The dividing question is *who*. If the recipients are defined by something they
individually did — registered, applied, donated, wrote in — it is not this skill.
This skill has one audience shape: everyone in a segment.

## What the user gives you

**The minimum input is an event name, however vague.** "Email the list about the
Les Mills thing" is a complete request; everything else already has a default.

| Question it asks | Default when the user shrugs |
|---|---|
| Which event? | Whatever they said — Step 1 resolves it and reads it back |
| Subject line | The event title, if it fits in 50 characters |
| Preview text | `<Weekday D Month YYYY, time> · <venue>` — the facts the subject has no room for |
| A strapline? | **None.** Only add one if the user offers a framing sentence |
| Button wording | `Register`, pointing at the event's registration URL |
| A cover image? | The event's own JPEG poster if one exists on disk; otherwise **no cover** |
| Which segment / topic? | `/email-the-community`'s defaults — it asks |
| When does it go out? | `/email-the-community`'s default — next weekday, 10am NZ, at least an hour out |

If the user hands you substance ("say it's free and there's food"), that
substance IS the content — put it in She Sharp's voice with `--strapline`. **Never
add a fact the event record does not have.** No fee, no capacity, no deadline, no
"limited spaces" unless it is written down somewhere you can point at.

## Prerequisites

1. **Working directory is the repo root** (it has `lib/email/message.ts`). The
   scripts resolve `@/lib/…` through the repo tsconfig and fail elsewhere.
2. **The event is in `lib/data/json/events-custom.json`.** Step 1 finds nothing →
   stop and run `/sync-event-from-slack`. Copy written around an unverified event
   is how a wrong date reaches the whole community.
3. **The event has not happened yet.** The generator refuses a past event (exit
   3) because its one button points at a closed registration page. See Step 1.
4. **A Resend segment with real people in it.** Step 2 checks. Today it holds
   essentially nobody — see the banner at the top of this page.
5. **`resend` CLI on PATH and authenticated** for Step 2 onward — `resend whoami`
   must print the She Sharp account.
6. **Read `.claude/skills/email-the-community/SKILL.md`** before Step 5. You are
   handing over into the middle of it and must know where you are landing.

---

## Step 1 — Resolve the event and read it back

```powershell
npx tsx scripts/email/event-announcement-spec.ts "les mills panel"
```

The resolver behind it accepts a slug or half-remembered words. Its exit codes:

| Exit | Meaning | Do |
|---|---|---|
| 0 | One event resolved | Continue |
| 1 | Nothing matched | `npx tsx scripts/events/resolve-event.ts --list` to browse, or run `/sync-event-from-slack` |
| 2 | Several candidates, listed with dates | **Ask the user which one.** She Sharp has run same-named events in several years |
| 3 | The event has already happened | Almost always the wrong event or the wrong skill. `--allow-past` overrides it, for a genuine re-run or recap |

**Read the title, date, time and venue back to the user and wait for a yes.**
Every later step quotes these exact strings, and this is the cheapest moment to
catch the wrong event.

## Step 2 — Check the audience is real

This is `/email-the-community`'s Step 1, unchanged. Do not invent a shortcut:

```powershell
resend segments list --json
resend topics list --json
(resend contacts list --json | ConvertFrom-Json).data.Count
```

For every list She Sharp holds and its consent tier (read-only, addresses
masked): `npx tsx scripts/email/audience-report.ts --include-resend`.

Note the segment **name**, its id, the topic id and the contact count — all four
go in the plan block later.

**Fewer than 5 contacts → stop and say this, in these words:**

```
Heads up: the Resend segment currently has <n> contact(s).

She Sharp's newsletter still goes out through Mailchimp; the Resend list has
never been imported. Sending this announcement now would reach almost nobody.

  (1) run /update-mailing-list first, then come back here
  (2) send anyway as a rehearsal — I'll label it as one
  (3) stop here
```

Then wait. Do not choose for them, and do not quietly broadcast to a list of one
as though it were a campaign.

## Step 3 — Generate the announcement spec

```powershell
npx tsx scripts/email/event-announcement-spec.ts --slug event-lesmills-03-september-2026
```

It writes `tmp/specs/announce-<slug>.json` and prints, to the console, what it
built and what it deliberately left out. Nothing is sent; nothing outside `tmp/`
is touched.

What it fixes for you, and why you must not "improve" on any of it:

- **`engine: "react"`** — the only engine that emits
  `{{{RESEND_UNSUBSCRIBE_URL}}}`. `"layout"` is the transactional design with no
  opt-out footer and fails the `unsubscribe` gate outright.
- **`category: "marketing"`** — makes the gates strict, and makes the render
  print a `broadcasts create` skeleton rather than a one-recipient send command.
- **From `newsletter@shesharp.org.nz`, Reply-To `info@shesharp.org.nz`** — the
  `marketing` identity in `lib/email/senders.ts`. The From carries the years of
  engagement reputation the Mailchimp → Resend move depends on; the Reply-To is
  deliberately different because nobody on the team holds `newsletter@`'s
  password, so a subscriber who presses Reply must land somewhere read.
- **One button.** Two CTAs split the clicks and neither gets pressed.
- **All URLs absolute** on `https://www.shesharp.org.nz`. Email clients have no
  base URL, and the `absolute-urls` gate is a hard fail.
- **Access/promo/discount parameters stripped from the registration link**, with
  a `Redactions:` line naming what went. See `references/copy-rules.md`.

Two lines in its output need a decision:

- **`Cover — none`** with a note about WebP. Most events' cover art is `.webp`,
  which Outlook renders as a broken-image box, so no cover is emitted. Either
  accept a cover-less email (perfectly good) or run the command it prints —
  `npx tsx scripts/events/build-event-poster.ts <slug> --only social` — and
  re-run this step. **Never hand-edit a `.webp` URL into the spec.**
- **`Redactions:`** — read it aloud to the user later, in the plan block. `none`
  is a normal and common answer.

## Step 4 — Let the user set the words

Show them the subject, the preview text and the button label, and offer the three
flags. Re-run Step 3 with whatever they choose; the script is cheap and
idempotent.

```powershell
npx tsx scripts/email/event-announcement-spec.ts --slug <slug> `
  --subject "AI is everyone's job now" `
  --preheader "Thu 3 Sept, Les Mills Auckland City — four leaders, four functions." `
  --strapline "We're bringing this one to a gym, and we mean that literally." `
  --cta "Save me a seat"
```

The limits and what earns a place in the email at all are in
`references/copy-rules.md`. Read it before you write a subject line.

Anything else the user wants changed — a different order of facts, an extra
paragraph, a photo — is a hand edit to `tmp/specs/announce-<slug>.json` after
this step. That file is an ordinary `MessageSpec`; `lib/email/message.ts` lists
all nine block types.

## Step 5 — Hand over to `/email-the-community`, from its Step 3

**Say this to the user explicitly**, then do it:

> The spec is ready at `tmp/specs/announce-<slug>.json`. From here I'm following
> `/email-the-community` — it owns the gates, the preview, the test send, the
> approval block and the schedule, and I'm not going to duplicate any of it.

Then run its steps, in order, with your generated spec in place of a hand-written
one:

| Its step | What happens | Anything different for an event announcement |
|---|---|---|
| **Step 3 — Render and gate** | `npx tsx scripts/email/render-message.ts tmp/specs/announce-<slug>.json --mode broadcast`, then confirm `{{{RESEND_UNSUBSCRIBE_URL}}}` survived into the HTML | A red gate here is a bug in the generator, **not** a reason to hand-edit the spec. Say what failed |
| **Step 4 — DRAFT-banner preview** | `--mode preview --draft-banner --open` | Check the cover is not a broken box, and that the date in the email matches the event page |
| **Step 5 — Test send** | `resend emails send` to a mailbox **the user names**, dry-run first | Open the event page from the test email and check every fact against it |
| **Step 6 — Plan block, then stop** | The full block, including the `Redactions:` line | Add an `Event:` line naming the slug and its date, so approval is of a specific event |
| **Step 7 — Create the draft** | Ledger check, `--dry-run`, then `create` without `--send`, read back, record | The ledger key is the spec's `key` — `announce-<slug>` — so the same event cannot be announced twice |
| **Step 8 — Schedule** | `broadcasts send <id> --scheduled-at …`, at least an hour out | **Also schedule it before the event.** A broadcast landing after the doors open is worse than not sending |
| **Step 9 — Verify** | `broadcasts get`, record `sent`, report | Say plainly if the announcement promised anything the team now has to do |

Every guardrail in that skill applies here unchanged. Where the two disagree, it
wins — it is the one that owns the send.

---

## Guardrails (USER-APPROVED — hard rules)

1. **The audience is a Resend segment, never a registrant list.** No Humanitix
   CSV, no SQL, no "everyone who came last time". *Why:* the database has no
   marketing-consent column, so a query cannot produce consent that was never
   collected, and a hand-built list has no unsubscribe — which is the definition
   of spam and burns the domain every password-reset email depends on.
2. **Every fact comes from the event record.** Date, time, venue, speakers,
   partner, registration link. *Why:* a retyped date is how an email comes to
   contradict the page it links to, and the email is the version people trust.
3. **Never invent a fee, capacity, deadline or "limited spaces".** Not in the
   record and not on the live site → ask. *Why:* a broadcast is the
   organisation's public promise to its whole community.
4. **Never publish a registration, access or discount code.** The generator
   strips them from the URL and reports it; do not put one back. *Why:* on
   2026-06-11 an event page leaked registration codes and the fix cost a git
   history rewrite plus a rotation of every code — an email cannot be rewritten
   at all.
5. **`engine: "react"` and `category: "marketing"`, always.** *Why:* `react` is
   the only engine that emits the unsubscribe merge tag, and `marketing` is what
   makes the gates strict. Changing either is how a list email ships with no
   opt-out.
6. **A `.webp` cover is never acceptable.** No cover, or a JPEG. *Why:* Outlook
   cannot decode WebP and shows a broken-image box where the poster should be.
7. **Never announce a past event without the user saying so in words.** The
   generator refuses with exit 3. *Why:* the button points at a closed
   registration page, and the recipients cannot act on any of it.
8. **Fewer than 5 contacts in the segment → stop and ask.** *Why:* a broadcast to
   a list of one is a rehearsal, not a campaign, and the user should learn that
   before approving rather than after.
9. **Nothing is created or sent in Resend until the user approves
   `/email-the-community`'s Step 6 plan block.** *Why:* that skill owns the send,
   and a broadcast has no recall.

## What this skill does *not* do

- Send anything. Every command here is a local render or a read-only Resend
  query; the send belongs to `/email-the-community`.
- Add, remove, import or suppress anyone on the Resend list — `/update-mailing-list`
  owns every write to it.
- Email the people who registered for the event. That is `/send-event-emails`,
  and the line between them is consent, not convenience.
- Duplicate `/email-the-community`'s gates, ledger, draft, approval block or
  scheduling. One implementation, one place.
- Edit `lib/data/json/events-custom.json`. A wrong date is fixed in the event
  record, where the website and the poster read it too — never in the email only.
- Build artwork. `/make-event-poster` writes the JPEG this skill looks for.
- Write anywhere outside `tmp/`.

## Reference

- `references/copy-rules.md` — what belongs in an event announcement, the
  subject and preheader limits, and the redaction rule.
- `.claude/skills/email-the-community/SKILL.md` — Steps 3–9, and the gate
  troubleshooting table. This skill hands over into it and does not restate it.
- `.claude/skills/update-mailing-list/references/consent-rules.md` — the four
  audience tiers, and the reason a registrant list is not a mailing list.
- `lib/email/message.ts` — the `MessageSpec` shape and all nine block types.
- `docs/development/EMAIL_OPERATIONS.md` — the four streams and the sending
  identities.
