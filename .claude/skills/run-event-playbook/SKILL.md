---
name: run-event-playbook
description: Run one regular She Sharp evening event end to end — from the Slack planning channel six weeks out to the photographs and the attendance figures a fortnight after — by deciding which single-purpose skill runs next and whether its precondition actually holds. Use whenever someone asks about an event as a whole rather than about one artefact — phrases like "let's get the Les Mills event ready", "what's left to do for Thursday's panel", "where are we up to on next month's event", "is the September event on track", "we've got an event coming, walk me through it", "what should I be doing six weeks out", "run the event playbook", "what happens after the event", "下个月的活动要准备什么", "这场活动还差什么", "活动准备到哪一步了", "帮我把这场活动从头到尾安排好", "接下来该做什么", "活动结束之后还要做什么". It starts by running `npx tsx scripts/events/event-status.ts --slug <slug>`, which reports offline where the event has got to across ten checks — Slack, event data, cover, poster set, speaker set, deck, feedback code, announcement, emails, photos — reads that back in plain words, and then hands the first gap to the skill that owns it. It builds nothing itself: no poster, no deck, no email, no Slack read, no send. Not the right shape for a flagship or multi-day event, and not needed when someone already knows the one thing they want — a poster is `/make-event-poster`.
disable-model-invocation: true
---

# Run one event, from the planning channel to the photographs

The person you are working with runs She Sharp events. They do not write code and
must never be shown a lint error or a stack trace. They already have a skill for
every piece of the work. What nobody has is **the order**.

Five facts shape everything below.

- **This is a conductor, and it builds nothing.** No poster, no deck, no email,
  no Slack read, no send. Every phase names another skill and hands over. The
  moment you find yourself choosing an accent colour or writing a subject line,
  you have stopped running the playbook and started running the skill that owns
  that work — which is correct, but say so out loud first.
- **`event-status.ts` answers the only question that matters, and it is Step 0.**
  Ten checks, computed offline from files already in the repository. It writes
  nothing, opens no socket, touches no database, and **always exits 0** — an
  event three weeks out is *supposed* to have work outstanding.
- **The gates are the whole value.** Each phase carries one precondition, and
  every one of them is scar tissue from a sibling skill: a poster built on a
  guessed date, a deck whose feedback QR pointed at last month's event, an email
  to people who never subscribed. The individual skills each defend their own
  gate. The playbook's contribution is knowing which gate comes next.
- **Nothing about who is coming is in this repo.** `event_registrations` is
  empty and Humanitix is the system of record. The registrant list arrives as a
  CSV a human exports, and no amount of reading the codebase will produce it.
- **There are no preview deploys.** Whatever is verified locally is the only
  verification there is. Merging to `main` deploys to production in about three
  minutes.

Commands are PowerShell-first. Every command in Step 0 is read-only; everything
after it belongs to a skill that has its own approval step.

## When to apply

- "Let's get the Les Mills event ready."
- "What's still to do for Thursday's panel?"
- "Where are we up to on the September event?"
- "We've got an event in six weeks — walk me through it."
- "The event's finished. What now?"
- "下个月的活动要准备什么？"
- "这场活动还差什么？活动准备到哪一步了？"
- "活动结束之后还要做什么？"

Unsure? Run Step 0. It reads the repo and writes nothing.

## When NOT to apply

| The ask is | Use instead |
|---|---|
| One artefact, and they know which — a poster, a deck, a broadcast, a video | That skill directly: `/make-event-poster`, `/build-event-slides`, `/promote-event`, `/make-event-video` |
| A word changed on a deck an hour before the doors open | `/tweak-event-slides` |
| A **flagship or multi-day** event — a hackathon, a festival, a conference | The individual skills, in whatever order that event needs. See *When the shape does not fit* |
| Something that is not an event at all — a mentoring round, a policy change, a call for volunteers | `/email-the-community` |
| This month's newsletter | `/monthly-newsletter` |
| Who is on the mailing list, or getting someone onto it | `/update-mailing-list` |

This skill is a conductor, not a replacement. Somebody who has already decided
they want a poster should not be walked through fourteen phases to get one.

## Prerequisites

1. **Working directory is the repo root.** `event-status.ts` resolves `@/lib/…`
   through the repo tsconfig and fails anywhere else.
2. **You know which event.** A slug, a venue, a partner name, a month — anything
   Step 0 can narrow to one record. Nothing else is needed to start.
3. **Nothing else.** Deliberately. Every credential, CLI and export this event
   will eventually need belongs to a later phase, and the phase that needs it
   checks for it. Front-loading those checks would stop an organiser six weeks
   out from doing the one thing they can actually do today.

---

## Step 0 — Ask the script

```powershell
npx tsx scripts/events/event-status.ts --slug event-lesmills-03-september-2026
```

This is what it prints:

```
event-lesmills-03-september-2026 — No Pain, All Gain – Getting Fit for AI
  Thursday, 3 September 2026 · 5:00pm – 7:30pm NZST · Les Mills Auckland City · in 13 days

  Slack        done     #event-lesmills-03-september-2026, read to 12 Aug 2026, no backlog
  Event data   done     4 speakers · 1 sponsor · 2 sections · registration link set
  Cover image  done     /img/events/event-lesmills-03-september-2026/cover.webp
  Poster set   done     poster, social, humanitix, story, square
  Speaker set  done     4 of 4 speakers + line-up tile
  Deck         done     /present/event-lesmills-03-september-2026 · 25 slides
  Feedback     done     www.shesharp.org.nz/f/l03s26
  Announcement missing  no announcement broadcast has ever been recorded
                        → /email-the-community  (sends to the newsletter_subscribers table)
  Emails       n/a      sent from Humanitix -> Email campaigns; this repo keeps no record of it
  Photos       n/a      the event has not happened yet

1 event · 1 check missing
```

Read that shape before you read the words. **Three states, and `n/a` is not a
softer `missing`:**

- **`done`** — the artefact exists, and the line says what it is.
- **`missing`** — outstanding work, and the `→` line is the exact command or
  skill that closes it. Never paraphrase that line into a different command.
- **`n/a`** — not work. A past event's poster set is not outstanding; a past
  event's photographs are.

**What the Announcement row is waiting for.** The mailing list is the
`newsletter_subscribers` table in She Sharp's own database, not a Resend segment
— that moved on 2026-08-29, and this paragraph used to warn that the row still
said otherwise. It does not any more, and the table is not empty: **1,549
mailable as at 2026-08-30**
(`npx tsx scripts/email/suppression.ts reconcile`, the
`Mailable after suppression` line). So `/email-the-community` from here reaches
real people. **That table has been broadcast to once** — the August 2026
newsletter, on 2026-08-31, to all 1,549 — which makes a send from here a
deliberate, approved step rather than a routine one: it is the list's second
contact, not its fiftieth, and it comes out of the **three marketing emails per
calendar month** shared across every sending skill. Say that when you translate
the report in Step 1.

Other selections:

```powershell
npx tsx scripts/events/event-status.ts                 # everything still to come
npx tsx scripts/events/event-status.ts --past 5        # the 5 most recent past events
npx tsx scripts/events/event-status.ts --all --json    # machine-readable, all 97
```

`--slug` repeats for several events. `--help` prints the rest.

**If no slug matches**, the event is not in the repo at all. That is the T-6w
gate failing, not an error: go to `/sync-event-from-slack`.

## Step 1 — Say it back in plain words

Do not paste the report. Translate it — one sentence on where the event stands,
then the next thing to do, then stop and let them answer.

> The Les Mills panel is 13 days out and in good shape: the page, the artwork,
> all four speaker posters and the 25-slide deck are done, and the feedback QR is
> live at `shesharp.org.nz/f/l03s26`.
>
> Two things are open, and one of them is blocked. Nobody has emailed the
> registrants yet — that's the next real job, and I need the Humanitix export to
> do it. The mailing-list announcement can't go out at all yet, because nobody
> has subscribed to the new list yet and the newsletter people actually receive
> still comes from Mailchimp.
>
> Shall I start on the registrant email? If you can export the attendee list from
> Humanitix into `tmp/`, I'll take it from there.

Three rules for that paragraph:

- **Lead with what is done.** The report is a list of holes by construction, and
  an organiser reading only holes concludes the event is in trouble when it is
  thirteen days out and fine.
- **Name the blocked thing as blocked, not as forgotten.** "The list is empty" is
  a fact about the organisation, not a failure of theirs.
- **Ask for the one input you need.** A Humanitix CSV, a room number, an album
  URL. Those come from a human and nothing in the repo can produce them.

## Step 2 — Act on the first gap, in phase order

Work down the phase table. **Check the gate, then hand over.** If the gate does
not hold, say what is missing and stop — do not go on to the next phase because
this one is stuck.

| Phase | Gate — what must be true first | Hand to |
|---|---|---|
| **T-6w Intake** | a Slack planning channel exists for the event | `/sync-event-from-slack` |
| **T-6w Archive** | you hold the `she-sharp-slack-archive` checkout (`SLACK_ARCHIVE_DIR` is set) — otherwise **skip this phase** | its "Not part of a sync" section, `refresh-archive.ts` |
| **T-5w Artwork** | date, venue and title confirmed **in the event record** | `/make-event-poster`, steps 1–6 |
| **T-4w Campaign** | every speaker has a headshot **in the event record** | `/make-event-poster` step 7 — `--speaker all --lineup` |
| **T-3w Promotion** | the newsletter subscriber table has real people in it — **it does not today** | `/promote-event` → `/email-the-community` from its Step 3 |
| **T-3w Video (promo)** | date, venue and title are in the event record, and there is something to show (a prior edition's photos, or this event's poster and headshots) | `/make-event-video` kind `promo` |
| **T-2w Registrants** | the event is ticketed on Humanitix, and the sender has access | Humanitix -> Email campaigns — **not this repo** |
| **T-1w Slides** | a run sheet in the event data | `/build-event-slides` |
| **T-7d / T-1d Reminders** | the room, level or join link is known — never invented | Humanitix -> Email campaigns |
| **T-1h Late change** | the deck already exists at `/present/<slug>` | `/tweak-event-slides` |
| **T+0 The night** | — | project the deck; the `/f/<code>` QR is already live |
| **T+1d Thanks** | a feedback form URL, and the event ended **under 14 days ago** | Humanitix -> Email campaigns |
| **T+3d Digest** | — | **nothing to do** — the cron posts to Slack by itself |
| **T+1w Close-out** | the album URL is known | flip `status`, set `galleryUrl`, `build-event-archive.mts`, then the attendance figures |
| **T+1w Video (recap)** | `photo-*.webp` (or a built archive) exists for the slug | `/make-event-video` kind `recap` |
| **T+2w Newsletter** | the month's issue is being written | `/monthly-newsletter` picks the event up |

The gate, the artefact, what to check and what goes wrong for each phase are in
**`references/phases.md`**. Read the phase you are about to run before you run
it — that is where the detail lives, and this table is only the index.

Two shortcuts worth knowing:

- **The weeks are guidance; the report is the truth.** An event booked with three
  weeks' notice skips nothing — it does T-6w through T-3w in one afternoon, in
  the same order.
- **The status line and the phase are the same list.** `Poster set missing` is
  T-5w. `Speaker set missing` is T-4w. `Emails: welcome unsent` is T-2w. If the
  two ever disagree, the script is right and this table has rotted.

---

## Two things that look like a bug and are not

Both of these send organisers looking for a fault in the website. Say them
plainly the first time they come up.

**`detailPageData.status` is never read by the website.** `getUpcomingEvents()`
and `getPastEvents()` in `lib/data/events.ts` filter on the **date** alone, and
nothing renders `status` anywhere. An event moves to "past" by itself, at
midnight, whatever the field says. Flipping it at close-out is bookkeeping — it
clears the `stale-status` row in `/sync-event-from-slack`'s triage — and not
something a page is waiting on.

**`isFeatured` is currently inert.** `getFeaturedEvent()` searches only
*upcoming* events for the flag, and the one record carrying `isFeatured: true`
is in the past, so the homepage is simply showing the nearest upcoming event.
That is usually the right answer. Setting the flag on a **future** event is how
you override it — and it is the only way to.

## When the shape does not fit

**A flagship or multi-day event does not run on this playbook, and forcing it
through is worse than not having one.** The 2026 Aotearoa AI Hackathon Festival
is the worked counter-example: 91 slides against a regular evening's 25, a run
sheet spanning two days, twenty-two people who are judges and mentors rather
than a panel, and its own bespoke deck skin rather than the editorial default.
Almost every gate in the table is either wrong or trivially true for it —
"`--speaker all` for twenty-two people" is a campaign nobody posts, and a
line-up tile carries six faces, not twenty-two.

Say so and hand back to the individual skills:

> This one's much bigger than the evening events the playbook is shaped around —
> two days, twenty-odd speakers, its own look. I'd rather run the skills
> individually and let the event decide the order than march it through a
> sequence built for a two-hour panel. Where do you want to start?

The same applies to anything with a paid programme, a call for submissions,
travel, or a second organisation running half of it.

---

## Guardrails (USER-APPROVED — hard rules)

1. **The conductor never skips a gate to save a step.** Not to be helpful, not
   because the missing piece "will be there by then", not because the organiser
   is in a hurry. *Why:* the gates are the accumulated scar tissue of the
   sibling skills — each one is written down because something went out wrong
   once. A conductor that routes around them is worse than no conductor at all,
   because it does it while looking authoritative: the organiser stops checking,
   having been told the order is handled.
2. **Never build, send or commit anything yourself.** Hand to the skill that
   owns it and follow that skill. *Why:* every one of them carries approval
   steps, ledgers, linters and consent gates that exist because this repo has
   already published a wrong start time, a `localhost` URL and a live access
   code. Reimplementing "just the simple part" reimplements none of that.
3. **Every fact comes from the event record**, `lib/data/json/events-custom.json`.
   A wrong date is fixed there, in its own `fix(events):` commit, never in the
   poster, the deck or the email. *Why:* the deck and the poster are *views* of
   that record; pasting a correction into one of them makes the projector and
   the website disagree, silently, and nothing will ever tell you.
4. **Registering is not subscribing.** A promotion goes only to people who
   confirmed a newsletter subscription — never to a registrant list, a Humanitix
   export, or a query across the rest of the database. *Why:* no other table
   carries marketing consent, so a query cannot produce consent that was never
   collected — and it is enforced in `lib/email/audience.ts`, not left to
   judgement.
5. **A deck slug IS its event slug.** Never build or reuse a deck against a
   different event's slug. *Why:* the feedback code is derived from the slug, so
   a deck built against the wrong event collects the wrong event's feedback
   while looking perfectly correct from the front of the room. `deck.test.ts`
   fails on it as an error, never a warning.
6. **Never invent an input a human owes you** — a room number, a join link, a
   feedback URL, an album URL, an attendance figure. Ask, and wait. *Why:* every
   one of them ends up in something that cannot be recalled: an email, a
   projected slide, or a published page.
7. **Never read a status line, a lint rule or a stack trace to the organiser.**
   Translate it. *Why:* this skill is the whole interface for a volunteer who
   does not write code; the moment it leaks tooling, they stop being able to run
   their own event.
8. **Stop and hand back when the event stops being a regular evening.** *Why:*
   the sequence's authority comes entirely from being the right shape. Stretched
   over an event it does not fit, it starts giving confident wrong answers.

## What this skill does *not* do

- **Make anything.** Not a poster, a plate, a deck, a slide, an email, a spec, a
  send or a commit. Every artefact belongs to another skill.
- **Read Slack, send email, or call any external service.** Step 0 is offline;
  everything after it is somebody else's step.
- **Decide the creative work** — the poster concept, the deck's skin, the subject
  line, the hooks. Those are conversations `/make-event-poster`,
  `/build-event-slides` and `/promote-event` each own.
- **Duplicate any sibling skill's gates, ledgers, approval blocks or guardrails.**
  Where this file and a sibling disagree about that skill's own work, the sibling
  wins — it is the one that ships.
- **Edit `lib/data/json/events-custom.json`.** It reads the record and names what
  is missing from it; the edit belongs to `/sync-event-from-slack` or to the
  skill whose gate is failing.
- **Replace judgement about whether to send at all.** Four emails about a
  two-hour evening is too many. See T-2w in `references/phases.md`.
- **Run the flagship events.** See *When the shape does not fit*.

## Reference

- `references/phases.md` — every phase in full: the gate, the skill, the
  artefact it leaves behind, what to check before moving on, and what has
  actually gone wrong at that point.
- `scripts/events/event-status.ts` — Step 0. `--help` for the flags; the file's
  own header explains why it exits 0 on a report full of gaps.
- `docs/development/EVENT_FEEDBACK.md` — the `/f/<code>` QR, the 3-day digest
  cron, and the 12-month anonymisation of the personal columns.
- `docs/development/ADD_EVENTS.md` — the event record itself, and which of the
  two JSON files owns which events.
- `.claude/skills/update-mailing-list/references/consent-rules.md` — the binding
  version of guardrail 4.
