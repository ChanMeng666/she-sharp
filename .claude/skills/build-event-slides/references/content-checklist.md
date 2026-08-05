# The interview — what to read back, what to ask

This is the script for Step 2. Work through it **one round at a time**: put the
round to them, listen, reflect back what you heard in the shortened form you
intend to put on the slide, then move to the next round.

Do not paste a round verbatim. The wording below is a guide to what you need,
not a form to be filled in. Ask it the way you would ask a colleague.

**Most rounds are a read-back, not a question.** The run sheet, the speakers,
the hosts and the sponsors are already in `events-custom.json` and already on
the deck. Reading them back as a short list gets you a yes in one exchange;
asking for them cold makes an organiser dictate facts they already gave the
website, which is both tedious and a good way to end up with two versions.

Rounds marked **READ BACK** below are confirmations. Rounds marked **ASK** are
things that exist nowhere but in their head.

**When a read-back gets corrected, the correction goes into the event data** —
not into the deck, and not into your notes. See *Correcting a fact* in
`SKILL.md`. Say what you are doing, because it is more than they asked for:

> Good catch — I'll fix that on the event page too, so the website and the
> slides say the same thing.

Three standing rules:

- **You shorten, not them.** They speak in paragraphs; that is correct and
  useful. Turning a paragraph into seven words is your job, and reading it back
  is how they stay in control of it.
- **"I don't know" is a real answer.** Every round below says what to do with
  one. None of the answers is "make something up".
- **Write down the throwaway lines.** Every slide needs a kicker — a short line
  above the title telling the room what to do or what is true right now — and
  you are never going to get those by asking for them. They arrive as asides:
  *"oh, the toilets are through the double doors"*, *"dinner's out when people
  walk in"*, *"they should stand for the karakia if they're able"*. Those
  sentences **are** the kickers, already written, and they will be gone from
  your notes in ten minutes if you only record the answer to the question you
  asked. See `references/copy-rules.md`.

---

## Round 1 — What this is, and who it is for — **READ BACK**

> "The event page describes it as *a cross-functional conversation about how AI
> is changing every role, not just the technical ones* — is that still how you'd
> put it? And who's coming: people who've never been to a She Sharp event
> before, or the regulars?"

**Why it matters.** It sets the whole deck's altitude. A room of first-timers
needs the "we are She Sharp" slide to actually land; a room of regulars will sit
through it politely and stop paying attention. It also decides whether jargon on
the event-specific slides needs unpacking.

**Don't know:** take the event's own `subtitle` and `fullDescription[0]` from
`events-custom.json`, shorten it, and read it back for a yes or no. That is
usually enough — they wrote it, they just don't remember writing it.

## Round 2 — Who is on stage — **READ BACK**

The deck already has them, with their photographs, from `speakers[]`. Read the
list, do not ask for it:

> "The panel slide has Keryn McKenzie, Carolina Lobos, Ben Sullivan and Gemma
> Lynskey, with their Les Mills titles and headshots. Is that everyone, and is
> that the order you want them introduced in?"
>
> "Which of the She Sharp team will be in the room — should they be on the team
> slide, or is the standard one fine?"

**Why it matters.** The host needs to know who to look at and when. A speaker
missing from the deck gets introduced by the wrong name in front of a room.

**If a name, title or photo is wrong**, fix it in `events-custom.json` — that
corrects the website's speaker section at the same time. **If a whole speaker
group is missing**, add it to the JSON and regenerate the deck; a new group is a
new slide, not a new fact.

**Don't know:** use the event data as-is and flag it as unconfirmed in your
report. Speakers change late; that is normal and it is a cheap thing to fix on
the Wednesday.

**Names and roles only, never bios.** A person's job title is six words maximum
(the linter enforces it). Their story is theirs to tell in the room.

## Round 3 — The run sheet — **READ BACK**

The event's own schedule is already the run-sheet slide, times and all. Read it
back as a shape rather than row by row, and ask the one thing it cannot tell
you:

> "The run sheet slide has your five blocks — doors at five, panel at half five,
> roundtables at quarter past six, readouts at half six, networking from quarter
> to seven. Right?"
>
> "Which moment is the one people should be looking at the screen for?"

**Why it matters.** The run sheet is the single most-used slide of the event.
People check it walking in, at the break, and whenever they wonder how long is
left.

Rows are six words maximum after the clock time, and the generator will tell you
which ones it had to shorten — read those back specifically. Fourteen rows
maximum on one slide; a two-day event splits into one slide per day.

Mark the "you are here" moment — usually the thing the room came for — so it can
be shown in the accent colour. That is `emphasis` on the row, and it is the one
part of the run sheet that is yours rather than the data's.

**If a time is wrong**, fix it in `events-custom.json`. The countdown clock on
the discussion slide is computed from those same times, so correcting the
schedule corrects the clock — do not edit the number of minutes by hand.

**No timed schedule in the event data at all:** the deck has no run-sheet slide
and the generator will have said so. It is the most-looked-at slide of the
night, so this is worth fixing at the source: ask for the shape ("doors at half
five, panel at six, done by half seven"), write it into the event's
`specialSections` as an agenda, and regenerate. That puts it on the website too,
where the people coming can read it.

## Round 4 — Breaks and the group photo — **ASK**

> "Are you doing a group photo? Before the break or at the end?"

**Why it matters.** The break slide runs a countdown clock on the screen, which
is the single most effective way to get a room back on time. The host presses
Space to start it and Space again to pause it.

**Do not ask how long the break is.** The deck takes it from the run sheet — 15
minutes because the schedule says 6:15 to 6:30, not because 15 is a default.
Only ask if the run sheet has no readable duration for that block, which the
generator reports.

**No break at all** (a one-hour panel, a lunchtime talk): drop the slide rather
than inventing one. Say that you dropped it.

## Round 4a — The table discussion — **ASK**

The one part of the middle the repo cannot supply. If the run sheet has a
roundtable, breakout or group activity, the deck has a slide of prompts and it
is a **placeholder**:

> "During the roundtables, what do you actually want people talking about? Two
> or three questions is plenty — they go on the screen while people talk."

**Why it matters.** It is the slide the room stares at longest, because it is up
for the entire discussion. The placeholder text is deliberately generic and
saying it out loud in a room is worse than saying nothing.

**Don't know yet:** keep the placeholder, and tell them in as many words that it
is a placeholder and needs replacing before the night. Do not let it ship
silently.

## Round 5 — Who to thank — **READ BACK, then ASK**

The logos come from the event data. The *people* do not exist anywhere and have
to be asked for.

> "The thank-you slide has the Les Mills logo from the event page. Is there
> anyone else who should be on it — the venue, someone who brought the food?"
>
> "Anyone you want thanked by name — mentors, judges, the person who ran the
> door?"

**Why it matters.** Missing a sponsor off the thank-you slide is the mistake
that gets noticed, and it gets noticed by the person who paid for the room.

A partner who is missing belongs in the event data's `sponsors`, not typed into
the deck — the same list feeds the event page's sponsor section, so adding it in
one place fixes both. Logos usually already exist under `public/img/sponsors/`.

**Don't know:** use the event page's sponsor list unchanged, and ask them to
check it once before the deck ships. Do not add a logo you cannot source.

## Round 6 — The visual assets

> "Have you got the poster or key visual? I'll pull the deck's colour from it."
>
> "Any photos from this event or the venue you want in — the room, the setup,
> last year's version of this?"
>
> "Do the speakers have headshots?"

**Why it matters.** The deck is built out of She Sharp's own photography — that
is the entire design. A deck of white slides with bullets looks like a template;
twelve years of real rooms looks like nobody else.

Tell them exactly what to send: **the biggest version they have**, any of JPEG,
WebP, PNG or SVG, and no need to resize or rename anything. See
`references/assets.md`.

**Ask for size explicitly when you want a slide-filling photo.** Most of the
archive tops out around 1200px, which is fine as one tile among many and visibly
soft blown up across a projector. "The original off the camera, not the one from
Instagram" is the sentence that gets you the right file.

**Don't know / haven't got any:** offer `public/img/curated/` — real photographs
from past She Sharp events, with alt text already written. Name which slides
ended up using them, both when you offer and again in the Step 7 preview.

**And mention the gap once.** There is no photograph anywhere in the archive of
a mentor and a mentee meeting one to one — the flagship programme has no picture
of itself. If mentorship comes up in this deck at all, say so and ask them to
have someone take one at the next event. It costs them nothing and it is a hole
that has been open for years.

## Round 7 — QR codes on the day

> "Anything people need to scan on the day — the Slack invite, the event page, a
> submission form?"
>
> "Is there a prize draw for people who fill in the feedback form? If so I'll
> say so on the slide."

**Why it matters.** The QR codes are how everything you deliberately left off
the slides — bios, full rules, terms, the schedule in detail — still reaches the
people who want it.

You do not need a QR image from anybody. Codes are drawn from the URL in the
browser, so all you are collecting here is links.

**Both closing codes are already handled. Do not ask for either.** The feedback
code is She Sharp's own form on shesharp.org.nz, derived from the event slug —
`buildClosingSlides()` builds it from `eventSlug` and the linter checks it
points at *this* event. The ambassador code is the standing recruitment page.

This used to be the round where you chased a Google Form link, and it is worth
knowing why that is gone: every event got a fresh form, so there was no safe
default, the URL was long enough to make the projected code hard to scan from
the back of the room, and the answers landed in one person's Drive instead of in
the database. The native form fixes all three. It also has no sign-in wall,
which is the one thing about a Google Form you could not check without opening
it in a signed-out browser.

The prize draw is the only thing here still worth asking about, because it
changes what the slide says.

The contact slide near the front carries up to three codes; more than three and
none of them is big enough to scan from the back.

## Round 8 — The closing, and what's next

> "How do you want to close — anything specific you want said?"
>
> "Which upcoming events should people hear about before they leave? Up to
> three."

**Why it matters.** The last ninety seconds is when people decide whether to
come back. Three future events is the maximum that anyone remembers; one, with a
date they can write down, usually beats three.

Upcoming events are **snapshotted into the deck**, not looked up live — a live
list would quietly change between the rehearsal and the event.

**Don't know:** take the next events from `events-custom.json` by date, read the
titles and dates back, and let the author cut the ones that don't fit.

**Nothing is confirmed yet** — which happens more often than not, because a deck
is usually built for the last event on the books. The slide is dropped rather
than projected empty. Say so plainly: *"there's no next event in the system yet,
so that slide won't appear — the events QR at the start still points people at
the website. Tell me if something gets confirmed before the night and I'll put
it back."* Do not put a "watch this space" placeholder on a wall.

---

## What each fixed slide needs from the author

The organisational frame comes free. This is what you still have to collect.

| Slide | Type | The author supplies |
|---|---|---|
| Title & partners | `title` | Confirmation of the title, and which partner logos sit on it |
| Opening karakia | `karakia` | Nothing — fixed te reo and English |
| Health & safety | `bullets` | Fire exits, the toilets, the assembly point for **this venue** |
| We are She Sharp | `bullets` | Nothing |
| The team | `people` | Who is actually in the room, if it differs from the standard roster |
| Our impact | `stats` | Nothing — 3000+ members, 50+ sponsors, 94+ events since 2014 |
| Sponsors | `logos` | The confirmed list (Round 5) |
| Contact & QR codes | `contact` | Nothing, unless a code changed |
| The event title | `section` | Nothing — from the event data |
| How tonight runs | `agenda` | Nothing — the event's own schedule. Only the "you are here" row (Round 3) |
| Tonight's hosts | `logos` | Nothing — the event's `sponsors.main` |
| Meet the … | `people` | Nothing — the event's `speakers`. Confirm the order (Round 2) |
| What you'll explore | `bullets` | Approval of the shortened lines (Round 1) |
| At your table | `bullets` | **The prompts. This is the placeholder** (Round 4a) |
| The countdown | `break` | Nothing — minutes come from the run sheet |
| What did you find | `bullets` | The three readout questions, if the defaults are wrong |
| The closing frame | `photo` | A photograph, if they have a better one than the archive |
| Thank you | `thanks` | Partners and named people (Round 5) |
| Upcoming events | `upcoming` | Up to three, with dates (Round 8). Dropped if there are none |
| Feedback QR | `qr-cta` | Nothing — derived from the event slug. Only the prize draw, if there is one (Round 7) |
| Ambassador QR | `qr-cta` | Nothing — `/join-our-team` |
| Closing karakia | `karakia` | Nothing — fixed |

## The fixed sequence, in order

```
1   Title & partners
2   Opening karakia (tīmatanga)
3   Health & safety
4   We are She Sharp
5   The team
6   Our impact
7   Sponsors
8   Contact & QR codes
9   The event title
    ── the evening, generated from the event data ──
    How tonight runs
    Tonight's hosts
    │ Meet the panel / speakers
    │ What you'll explore
    │ At your table
    │ The countdown
    │ What did you find
    The closing frame          ← cannot be removed
10  Thank you
11  Upcoming events
12  Feedback QR
13  Ambassador QR
14  Closing karakia (whakamutunga)
```

Do not reorder it. The frame is the same at every She Sharp event so that a
volunteer who has hosted once can host any of them.

The middle blocks each disappear on their own when the event has no data for
them, and chapter dividers go with the block they introduce — so a workshop with
no panel and no roundtable gets a shorter deck, not a broken one. Delete freely.
**The closing frame is the exception**: the four closing slides are already the
longest run of information the deck allows, so the middle has to end on a
full-frame slide. Swap the photograph if you like; do not remove the slide.

## Every slide also needs a host note

One or two sentences the person clicking can read before they speak. It prints
in the PDF and never appears on screen.

You write these — do not make the author dictate fifteen of them. Draft from
what they told you and read back any you are unsure of:

> **Sponsors slide note:** "Thank AUT for the space and Centrality for the
> catering by name. Twenty seconds, then move on."

The linter rejects a slide without one, because a slide nobody can introduce is
a slide nobody should present.

## And every slide needs a kicker

The short line above the title, five or six words. The fixed organisational
slides need one just as much as the event-specific ones do — arguably more,
since they are the slides a regular attendee has already seen four times.

> **Health & safety:** `THE EXITS ARE BEHIND YOU`
> **Our impact:** `SINCE 2014, MOSTLY THIS ROOM`
> **Opening karakia:** `PLEASE STAND IF YOU ARE ABLE`

It must not repeat the title or the chapter label — the checker rejects that,
and it is the fastest way to make a deck read as machine-written. Write it from
the asides you collected; that is what the third standing rule at the top of
this page is for.
