---
name: promote-event
description: Announce ONE upcoming She Sharp event to the newsletter subscribers, building the email from the event's own record in `lib/data/json/events-custom.json` so the date, time, venue and registration link cannot disagree with the website. Use whenever someone wants the subscribers told about an event that has not happened yet — phrases like "email the list about the Les Mills panel", "tell everyone about next month's event", "promote Thursday's night to the mailing list", "send out the event announcement", "can we let subscribers know about the hackathon", "宣传一下下个月的活动", "给邮件名单发个活动通知", "把这场活动群发给订阅者", "发个活动预告", "通知订阅者来参加". It generates the MessageSpec with `scripts/email/event-announcement-spec.ts` and then HANDS OVER to `/email-the-community` from its Step 3 onward for rendering, gating, preview, test send, plan block, batch build and send — it duplicates none of that. Not for emailing people who registered (that is done in Humanitix -> Email campaigns, not from this repo), not for the monthly newsletter, and it sends to the newsletter subscriber table, which now holds the whole imported Mailchimp list — so a send here reaches real people, and nothing has ever been sent from that list before.
---

# Announce one upcoming event to the mailing list

**Read this first: the list is real now, and nothing has ever been sent from
it.** The `newsletter_subscribers` table — the double opt-in list that is now
the only record of who asked to hear from She Sharp — holds the whole imported
Mailchimp list (**1,549 mailable as at 2026-08-30**, and it moves; Step 2 prints
the live number). So a send here reaches real people, and it would be the
**first** send this list has ever received: the newsletter people actually
receive still goes out from **Mailchimp**. None of that is a reason not to
proceed — it is the reason to read the gates before you finish.
`/email-the-community`'s test send, its Step 6 plan block ("nothing is sent
until the user says send") and its chunk-by-chunk Step 8 are not paperwork here;
they are the only thing between a draft and a list that has never had a message
from this system. Step 2 reads the live count out loud before anything is built.

Four facts shape everything below.

- **The event lives in the repo, and the email is built from it.** Title, date,
  time, venue, speakers, partner and the registration link are read through
  `scripts/events/resolve-event.ts` — the same resolver the stage emails and the
  posters use. Nothing is retyped, so the email cannot say Thursday while the
  website says Wednesday.
- **Registering for an event is not subscribing.** The audience here is the
  newsletter subscriber table and nothing else — never a registrant list, never
  a Humanitix export, never a query across the rest of the database. Someone who
  bought a ticket asked about *that event*, not to hear from She Sharp again.
  `references/consent-rules.md` in `/update-mailing-list` is the binding version
  of this.
- **This skill is thin.** It resolves the event, builds a spec, and hands over.
  Every consent check, gate, preview, test send, plan block, ledger entry and
  send belongs to `/email-the-community`, which already does all of it.
- **Email cannot be recalled.** Which is why the handover happens at the step
  where that skill starts being careful, not after it.

Commands are PowerShell-first. **This skill sends nothing.**

## When to apply

Trigger conditions (examples — don't wait for an exact match):

- "email the list about the Les Mills panel" / "给邮件名单发个活动通知"
- "tell everyone about next month's event" / "宣传一下下个月的活动"
- "promote Thursday night to the subscribers" / "发个活动预告"
- "send the event announcement out" / "把这场活动群发给订阅者"
- "can we let the community know about the hackathon before tickets close?"

Unsure? Run Step 1. It reads the repo, sends nothing, and touches nothing
outside `tmp/` — on a match it also writes the spec to
`tmp/specs/announce-<slug>.json`, which is gitignored scratch you can ignore
or delete.

## When NOT to apply

| The ask is | Use instead |
|---|---|
| Joining details, a room number, a reminder or a thank-you for people who **registered** | Humanitix -> Email campaigns — no skill here does this |
| An announcement that is not about one event — a mentoring round, a policy change, a call for volunteers | `/email-the-community` |
| This month's newsletter issue | `/monthly-newsletter` |
| Add these attendees to the mailing list | `/update-mailing-list` |
| Put the event on the website in the first place | `/sync-event-from-slack` |
| A poster, banner or social graphic for the event | `/make-event-poster` |

The dividing question is *who*. If the recipients are defined by something they
individually did — registered, applied, donated, wrote in — it is not this skill.
This skill has one audience shape: everyone who confirmed a subscription.

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
| Who does it go to? | Everyone in the subscriber table with status `subscribed`. There is no other option, and `/email-the-community`'s Step 1 reads the count out loud |
| When does it go out? | **Ask.** A batch has no scheduler — it goes out when the command is run, so pick a sensible NZ-local moment and wait for it |

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
4. **Confirmed subscribers to send to.** Step 2 checks and prints the live
   number; it was 1,549 on 2026-08-30. Never quote a remembered figure — a
   subscriber can unsubscribe between two runs of this skill.
5. **`POSTGRES_URL` in `.env`** for Step 2, which reads the subscriber table, and
   the **`resend` CLI on PATH and authenticated** for the handover — `resend
   whoami` must print the She Sharp account.
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
npx tsx scripts/email/recipients-from-db.ts --key audience-check
```

It reads every confirmed subscriber, applies both suppression registers, and
prints counts and truncated hashes — never an address. The number that matters
is **WILL BE MAILED**; it goes in the plan block later.

To see the table itself, masked, including people who started subscribing but
never pressed the confirmation button:
`npx tsx scripts/email/inspect-subscribers.ts --limit 20`.

The expected answer is now four figures — 1,549 on 2026-08-30. A number in the
low single digits means something has gone wrong with the database connection or
the import, not that the list is small; **it is no longer the normal state.**

**Fewer than 5 will be mailed → stop and say this, in these words:**

```
Heads up: the subscriber list currently has <n> confirmed subscriber(s).

That is far below the 1,549 the table held on 2026-08-30, so this is much
more likely a wrong database or a broken connection than a real list.
Sending now would reach almost nobody.

  (1) check POSTGRES_URL points at production, then re-run this step
  (2) send anyway as a rehearsal — I'll label it as one
  (3) stop here
```

Then wait. Do not choose for them, and do not quietly send to a list of one as
though it were a campaign.

## Step 3 — Generate the announcement spec

```powershell
npx tsx scripts/email/event-announcement-spec.ts --slug event-lesmills-03-september-2026
```

It writes `tmp/specs/announce-<slug>.json` and prints, to the console, what it
built and what it deliberately left out. Nothing is sent; nothing outside `tmp/`
is touched.

What it fixes for you, and why you must not "improve" on any of it:

- **`engine: "react"`** — the branded announcement template, and the one that
  supports the cover image. Not a gate decision: `composeMessage` appends the
  unsubscribe placeholder to *any* marketing spec, so both engines fail
  `unsubscribe` and `absolute-urls` identically at Step 3 (see that row's note).
- **`category: "marketing"`** — makes the gates strict, and switches on the
  refusals in `/email-the-community`'s Step 7 that protect the opt-out link.
- **From `newsletter@shesharp.org.nz`, Reply-To `info@shesharp.org.nz`** — the
  `marketing` identity in `lib/email/senders.ts`. The From carries the years of
  engagement reputation the move off Mailchimp depends on; the Reply-To is
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
> approval block and the send itself, and I'm not going to duplicate any of it.

Then run its steps, in order, with your generated spec in place of a hand-written
one:

| Its step | What happens | Anything different for an event announcement |
|---|---|---|
| **Step 3 — Render and gate** | `npx tsx scripts/email/render-message.ts tmp/specs/announce-<slug>.json --mode broadcast` | **`absolute-urls` and `unsubscribe` fail here on every marketing spec, and that is the generator working.** The footer carries the literal `%%SHESHARP_UNSUBSCRIBE_URL%%` (`emails/announcement.tsx:293`) until `build-batch.ts` signs one per recipient, so at render time it is neither an `https://` URL nor an opt-out link yet. Those two are really enforced at Step 7, on the substituted message — `build-batch.ts` swaps the placeholder and *then* runs the same strict gates, and exits 1 writing nothing if they fail. So nothing is waved through here. **Any other red gate** — `image-format`, `size-100kb`, `merge-tags`, `secret-scan`, or an `absolute-urls` that names anything besides the placeholder — **is a bug in the generator**, not a reason to hand-edit the spec: say what failed |
| **Step 4 — DRAFT-banner preview** | `--mode preview --draft-banner --open` | Check the cover is not a broken box, and that the date in the email matches the event page |
| **Step 5 — Test send** | `resend emails send` to a mailbox **the user names**, dry-run first | Open the event page from the test email and check every fact against it. The footer's unsubscribe link shows as literal `%%SHESHARP_UNSUBSCRIBE_URL%%` in a test — that is expected |
| **Step 6 — Plan block, then stop** | The full block, including the `Redactions:` line | Add an `Event:` line naming the slug and its date, so approval is of a specific event |
| **Step 7 — Build the batch** | Ledger check, `recipients-from-db.ts`, then `build-batch.ts` with `BASE_URL` and `EMAIL_UNSUBSCRIBE_SECRET` set in the shell | The ledger key is the spec's `key` — `announce-<slug>` — so the same event cannot be announced twice |
| **Step 8 — Send, chunk by chunk** | `resend emails batch` per chunk, recording as you go | **There is no scheduler.** Run it at a time that is well before the doors open — an announcement landing after the event has started is worse than not sending |
| **Step 9 — Verify** | `resend logs list`, record `sent`, report | Say plainly if the announcement promised anything the team now has to do |

Every guardrail in that skill applies here unchanged. Where the two disagree, it
wins — it is the one that owns the send.

---

## Guardrails (USER-APPROVED — hard rules)

1. **The audience is the newsletter subscriber table, never a registrant list.**
   No Humanitix CSV, no SQL across the rest of the database, no "everyone who
   came last time". *Why:* no other table has a marketing-consent column, so a
   query cannot produce consent that was never collected, and a hand-built list
   has no unsubscribe — which is the definition of spam and burns the domain
   every password-reset email depends on.
2. **Every fact comes from the event record.** Date, time, venue, speakers,
   partner, registration link. *Why:* a retyped date is how an email comes to
   contradict the page it links to, and the email is the version people trust.
3. **Never invent a fee, capacity, deadline or "limited spaces".** Not in the
   record and not on the live site → ask. *Why:* an email to the whole list is
   the organisation's public promise to its whole community.
4. **Never publish a registration, access or discount code.** The generator
   strips them from the URL and reports it; do not put one back. *Why:* on
   2026-06-11 an event page leaked registration codes and the fix cost a git
   history rewrite plus a rotation of every code — an email cannot be rewritten
   at all.
5. **`engine: "react"` and `category: "marketing"`, always.** *Why:* `react` is
   the only engine with an unsubscribe link in its footer, and `marketing` is
   what makes the gates strict and turns on the build refusals that protect that
   link. Changing either is how a list email ships with no opt-out.
6. **A `.webp` cover is never acceptable.** No cover, or a JPEG. *Why:* Outlook
   cannot decode WebP and shows a broken-image box where the poster should be.
7. **Never announce a past event without the user saying so in words.** The
   generator refuses with exit 3. *Why:* the button points at a closed
   registration page, and the recipients cannot act on any of it.
8. **Fewer than 5 mailable subscribers → stop and ask.** *Why:* a send to a list
   of one is a rehearsal, not a campaign, and the user should learn that before
   approving rather than after.
9. **Nothing is sent until the user approves `/email-the-community`'s Step 6
   plan block.** *Why:* that skill owns the send, and email has no recall.

## What this skill does *not* do

- Send anything. Every command here is a local render or a read-only count; the
  send belongs to `/email-the-community`.
- Add, remove, import or suppress anyone on the subscriber list —
  `/update-mailing-list` owns every write to it.
- Email the people who registered for the event. That is done in Humanitix ->
  Email campaigns, not from this repo, and the line between them is consent, not
  convenience.
- Duplicate `/email-the-community`'s gates, ledger, approval block or batch
  build. One implementation, one place.
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
