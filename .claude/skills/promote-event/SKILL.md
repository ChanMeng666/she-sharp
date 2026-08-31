---
name: promote-event
description: Promote ONE upcoming She Sharp event to the newsletter subscribers, across up to three campaign stages — a save-the-date, a line-up reveal and a last call — each a different email, built from the event's own record in `lib/data/json/events-custom.json` so the date, time, venue and registration link cannot disagree with the website. Use whenever someone wants the subscribers told about an event that has not happened yet — phrases like "email the list about the Les Mills panel", "tell everyone about next month's event", "promote Thursday's night to the mailing list", "send out the event announcement", "send the save the date", "do the last call for the hackathon", "can we let subscribers know about the hackathon", "宣传一下下个月的活动", "给邮件名单发个活动通知", "把这场活动群发给订阅者", "发个活动预告", "通知订阅者来参加". It generates one stage's MessageSpec with `scripts/email/event-announcement-spec.ts --stage <name>` and then HANDS OVER to `/email-the-community` from its Step 3 onward for rendering, gating, preview, test send, plan block, batch build and send — it duplicates none of that, and runs once per stage. Not for emailing people who registered (that is done in Humanitix -> Email campaigns, not from this repo), not for the monthly newsletter, and it sends to the newsletter subscriber table, which now holds the whole imported Mailchimp list — so a send here reaches real people. The list's first broadcast went out on 2026-08-31 (the August newsletter, 1,549 recipients), so one send is on the record and the three-per-month marketing cap already counts it.
---

# Promote one upcoming event to the mailing list

**Read this first: the list is real, and it has been sent to exactly once.**
The `newsletter_subscribers` table — the double opt-in list that is now the only
record of who asked to hear from She Sharp — holds the whole imported Mailchimp
list (**1,549 mailable as at 2026-08-30**, and it moves; Step 2 prints the live
number). On **2026-08-31** the August newsletter went from it to all 1,549, which
is the only broadcast in its history; the July 2026 issue was the last newsletter
Mailchimp ever sent. So a send here reaches real people, and it is the list's
*second* contact rather than its first — which changes the arithmetic in two ways
you must check before drafting. **One:** nobody yet knows how that first send
landed (Resend accepted all 1,549; delivery, bounces and complaints arrive later
through the webhook), so there is no evidence this list is warm.
**Two: the monthly cap has already been drawn on** — the August newsletter used
one of 2026-08's three marketing sends, and a three-stage campaign needs three.
None of that is a reason not to proceed — it is the reason to read the gates
before you finish. `/email-the-community`'s test send, its Step 6 plan block
("nothing is sent until the user says send") and its chunk-by-chunk Step 8 are
not paperwork here. Step 2 reads the live count out loud before anything is
built.

**One event, up to three emails.** A campaign is not a single send. The event
lifecycle SOP's own beat is a save-the-date while the date is still worth
holding, a line-up reveal once the speakers are confirmed, and a last call in the
final week — same event, different angle, different button, different facts held
back. **You run this skill once per stage**, and each run is a full trip through
`/email-the-community`'s gates. The stages, and when each may be sent, are in
Step 3; `--list-stages` prints them.

**Three is the ceiling, and it is shared.** `/email-the-community` refuses a
fourth marketing send to this list in one NZ calendar month, counting the
newsletter too — so a three-stage campaign whose stages fall in one month leaves
no room for the monthly issue. Spread them, or drop a stage. The reason is in
Step 5.

Five facts shape everything below.

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
- **This skill is thin.** It resolves the event, picks a stage, builds a spec,
  and hands over. Every consent check, gate, preview, test send, plan block,
  frequency check, ledger entry and send belongs to `/email-the-community`,
  which already does all of it.
- **A stage is a moment, not a label.** The generator refuses a "last call"
  three weeks out and a "save the date" the day before, against the event's own
  date — exit 4. There is no override, because the fix is naming the stage that
  fits, which the refusal prints.
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
`tmp/specs/announce-<slug>-<stage>.json`, which is gitignored scratch you can
ignore or delete.

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
| Which stage? | **`line-up`** — the one send the SOP already describes. Step 3 offers the others and refuses any that does not fit the date |
| Subject line | The stage's default: the event title, prefixed for the save-the-date and the last call |
| Preview text | The stage's default — the day and place, with the time added from the line-up on |
| A strapline? | **None.** Only add one if the user offers a framing sentence |
| Button wording | The stage's: `See the details` → the event page for a save-the-date, `Register` / `Book your seat` → the registration URL for the other two |
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
   It separately refuses a stage that does not belong at this distance from the
   event (exit 4). See Step 3.
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
| 4 | The stage does not belong this far from the event | Re-run with the stage it names. There is no override — see Step 3 |

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

## Step 3 — Pick the stage, and generate that stage's spec

**First decide which email this is.** Three stages exist, and the generator
prints them:

```powershell
npx tsx scripts/email/event-announcement-spec.ts --list-stages
```

| Stage | When it may be sent | What it says, and what it withholds |
|---|---|---|
| `save-the-date` | 14+ days out | The date exists and is worth holding. Subject `Save the date: …`, preview text the **day without the time** — at six weeks out the start time is the fact most likely to move. Button `See the details` → the **event page**, not the registration link, because the ticket page usually does not exist yet (SOP: it goes live at T-4w). **The speaker line-up is deliberately withheld** — it is the next stage's news, and at this range the record's speakers are often unconfirmed |
| `line-up` | 5–42 days out | The full announcement: description, When, Where, **Speaking**, and the partner. Subject is the event title. Button `Register` → the registration link. This is the T-3w send the lifecycle SOP already describes, and it is the default |
| `last-call` | 0–10 days out | The logistics, for people who have already decided. **Details table above the prose, the description dropped entirely.** Subject `Last call: …`, preview text `This <Weekday> · <venue>` inside a week. Button `Book your seat` |

**Ask the user which one**, unless they said (a save-the-date, the last call).
Then generate it:

```powershell
npx tsx scripts/email/event-announcement-spec.ts `
  --slug event-lesmills-03-september-2026 --stage last-call
```

It writes `tmp/specs/announce-<slug>-<stage>.json` and prints, to the console,
what it built and what it deliberately left out. Nothing is sent; nothing outside
`tmp/` is touched.

**Exit 4 means the stage does not belong at this distance from the event**, and
it names the one that does. A last call three weeks out and a save-the-date the
day before are both un-recallable once sent and both look fine to a duplicate
check — which is why this refusal is against the event's own date and **has no
override flag**. Re-run with the stage it names, or say to the user that this
event is past the point where the stage they asked for means anything.

The `Campaign so far` block in the output reads `/email-the-community`'s ledger
and shows which stages have already gone out. It is advisory — the gate is that
skill's Step 7.1 — but read it to the user: it is how they see that the line-up
went out ten days ago before they approve a last call.

What it fixes for you, and why you must not "improve" on any of it:

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

Show them the subject, the preview text and the button label, and offer the four
flags. Re-run Step 3 with whatever they choose; the script is cheap and
idempotent.

```powershell
npx tsx scripts/email/event-announcement-spec.ts --slug <slug> --stage line-up `
  --subject "AI is everyone's job now" `
  --preheader "Thu 3 Sept, Les Mills Auckland City — four leaders, four functions." `
  --strapline "We're bringing this one to a gym, and we mean that literally." `
  --cta "Save me a seat"
```

Every override is per stage, so a subject written for the line-up does not leak
into the last call — the stage flag is part of the command, not a setting.

The limits and what earns a place in the email at all are in
`references/copy-rules.md`. Read it before you write a subject line.

**A later stage must not repeat an earlier one's subject.** Three sends with the
same subject line read as one message delivered three times, and that is what
gets a complaint rather than an unsubscribe. If the user overrides the subject,
check it against what the earlier stage actually sent — the `Campaign so far`
block names the ledger keys, and `broadcast-ledger.ts show --key <k>` prints the
digest.

Anything else the user wants changed — a different order of facts, an extra
paragraph, a photo — is a hand edit to `tmp/specs/announce-<slug>-<stage>.json`
after this step. That file is an ordinary `MessageSpec`; `lib/email/message.ts`
lists all nine block types.

## Step 5 — Hand over to `/email-the-community`, from its Step 3

**Say this to the user explicitly**, then do it:

> The `<stage>` spec is ready at `tmp/specs/announce-<slug>-<stage>.json`. From
> here I'm following `/email-the-community` — it owns the gates, the preview, the
> test send, the approval block and the send itself, and I'm not going to
> duplicate any of it.

Then run its steps, in order, with your generated spec in place of a hand-written
one. **`<slug>` in the paths below is really `<slug>-<stage>`** — Step 3 wrote
`tmp/specs/announce-<slug>-<stage>.json`, and the ledger key is
`announce-<slug>-<stage>`:

| Its step | What happens | Anything different for an event announcement |
|---|---|---|
| **Step 3 — Render and gate** | `npx tsx scripts/email/render-message.ts tmp/specs/announce-<slug>-<stage>.json --mode broadcast` | **`absolute-urls` and `unsubscribe` fail here on every marketing spec, and that is the generator working.** The footer carries the literal `%%SHESHARP_UNSUBSCRIBE_URL%%` (`emails/announcement.tsx:293`) until `build-batch.ts` signs one per recipient, so at render time it is neither an `https://` URL nor an opt-out link yet. Those two are really enforced at Step 7, on the substituted message — `build-batch.ts` swaps the placeholder and *then* runs the same strict gates, and exits 1 writing nothing if they fail. So nothing is waved through here. **Any other red gate** — `image-format`, `size-100kb`, `merge-tags`, `secret-scan`, or an `absolute-urls` that names anything besides the placeholder — **is a bug in the generator**, not a reason to hand-edit the spec: say what failed |
| **Step 4 — DRAFT-banner preview** | `--mode preview --draft-banner --open` | Check the cover is not a broken box, and that the date in the email matches the event page |
| **Step 5 — Test send** | `resend emails send` to a mailbox **the user names**, dry-run first | Open the event page from the test email and check every fact against it. The footer's unsubscribe link shows as literal `%%SHESHARP_UNSUBSCRIBE_URL%%` in a test — that is expected |
| **Step 6 — Plan block, then stop** | The full block, including the `Redactions:` line | Add an `Event:` line naming the slug and its date, and a `Stage:` line naming which of the three this is and which have already gone out — so approval is of a specific email, not of "the campaign" |
| **Step 7.1 — Ledger check** | `broadcast-ledger.ts check --key announce-<slug>-<stage>` | The key carries the stage, so each stage is recorded separately and `no-op` stops **this stage** going twice. A `no-op` on the line-up does **not** block the last call, and must not be read as one |
| **Step 7.2 — Frequency check** | `marketing-frequency-check.ts check --key announce-<slug>-<stage>` | **This is where a multi-stage campaign gets refused.** Three marketing sends a month across every skill, newsletter included; it exits non-zero. If the stages plus this month's newsletter come to four, the answer is normally to move a stage into the next month, not to override |
| **Step 7.3–7.6 — Build the batch** | `recipients-from-db.ts`, then `build-batch.ts` with `BASE_URL` and `EMAIL_UNSUBSCRIBE_SECRET` set in the shell | Nothing event-specific |
| **Step 8 — Send, chunk by chunk** | `resend emails batch` per chunk, recording as you go | **There is no scheduler.** Run it at a time that is well before the doors open — an announcement landing after the event has started is worse than not sending |
| **Step 9 — Verify** | `resend logs list`, record `sent`, report | Say plainly if the announcement promised anything the team now has to do. Then say which stage this was and which remain, so the next one is a decision rather than a habit |

Every guardrail in that skill applies here unchanged. Where the two disagree, it
wins — it is the one that owns the send.

**Then stop.** One run of this skill is one stage. The next stage is a new run,
at its own moment in the campaign, with its own approval — never queued up
behind this one.

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
10. **A stage is sent in its own window, or not at all.** The generator refuses
    exit 4 against the event date and there is no override flag. *Why:* a "last
    call" three weeks out and a "save the date" the day before are both untrue
    at the moment they land, and a duplicate check cannot see it — the ledger
    only knows the stage has not been sent, never that it is the wrong one.
11. **One run of this skill is ONE stage.** Never build two stages in a session,
    never queue the last call behind the line-up. *Why:* each stage needs its own
    approval at its own moment, and a campaign approved in advance is a campaign
    nobody looked at when it went out.
12. **Three marketing sends per NZ calendar month, across every skill.** Step 7.2
    refuses the fourth. *Why:* the Resend account complaint ceiling is 0.08% —
    about 1.25 complaints on a full send — and the account is shared, so
    breaching it takes password resets and donation receipts down with the
    marketing mail. Frequency is what drives complaints, and three stages plus
    the monthly newsletter is four emails to the same people.
13. **Never repeat an earlier stage's subject line.** *Why:* three sends with one
    subject read as one message delivered three times, which earns a complaint
    where a different angle earns a click.

## What this skill does *not* do

- Send anything. Every command here is a local render or a read-only count; the
  send belongs to `/email-the-community`.
- Add, remove, import or suppress anyone on the subscriber list —
  `/update-mailing-list` owns every write to it.
- Email the people who registered for the event. That is done in Humanitix ->
  Email campaigns, not from this repo, and the line between them is consent, not
  convenience.
- Duplicate `/email-the-community`'s gates, ledger, approval block, frequency
  check or batch build. One implementation, one place.
- Run a whole campaign. It builds **one stage** and hands over; the next stage
  is a separate run, days or weeks later, decided then.
- Schedule anything. There is no scheduler anywhere in this path — a stage goes
  out when a human runs the batch command.
- Edit `lib/data/json/events-custom.json`. A wrong date is fixed in the event
  record, where the website and the poster read it too — never in the email only.
- Build artwork. `/make-event-poster` writes the JPEG this skill looks for.
- Write anywhere outside `tmp/`.

## Reference

- `references/copy-rules.md` — what belongs in an event announcement, what each
  stage carries and withholds, the subject and preheader limits, and the
  redaction rule.
- `docs/development/EVENT_LIFECYCLE_SOP.md` §7 — the campaign beat the three
  stages are drawn from, and where the mailing list sits in it.
- `.claude/skills/email-the-community/SKILL.md` — Steps 3–9, and the gate
  troubleshooting table. This skill hands over into it and does not restate it.
- `.claude/skills/update-mailing-list/references/consent-rules.md` — the four
  audience tiers, and the reason a registrant list is not a mailing list.
- `lib/email/message.ts` — the `MessageSpec` shape and all nine block types.
- `docs/development/EMAIL_OPERATIONS.md` — the four streams and the sending
  identities.
