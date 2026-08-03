# The interview — what to ask, in what order

This is the script for Step 2. Work through it **one round at a time**: ask the
three or four questions in a round, listen, reflect back what you heard in the
shortened form you intend to put on the slide, then move to the next round.

Do not paste a round verbatim. The wording below is a guide to what you need,
not a form to be filled in. Ask it the way you would ask a colleague.

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

## Round 1 — What this is, and who it is for

> "In one sentence, what is this event? And who's coming — is it people who've
> never been to a She Sharp event before, or the regulars?"

**Why it matters.** It sets the whole deck's altitude. A room of first-timers
needs the "we are She Sharp" slide to actually land; a room of regulars will sit
through it politely and stop paying attention. It also decides whether jargon on
the event-specific slides needs unpacking.

**Don't know:** take the event's own `subtitle` and `fullDescription[0]` from
`events-custom.json`, shorten it, and read it back for a yes or no. That is
usually enough — they wrote it, they just don't remember writing it.

## Round 2 — Who is on stage

> "Who's opening the event? Who's speaking, and in what order? Is anyone
> introducing anyone else?"
>
> "Which of the She Sharp team will be in the room — should they be on the team
> slide, or is the standard one fine?"

**Why it matters.** The host needs to know who to look at and when. A speaker
missing from the deck gets introduced by the wrong name in front of a room.

Check `speakers[]` in the event data first and read it back rather than asking
cold: *"I've got Priya, Marcus and Dr Chen from the event page — is that
everyone, and is that the running order?"*

**Don't know:** use the event data as-is and flag it as unconfirmed in your
report. Speakers change late; that is normal and it is a cheap thing to fix on
the Wednesday.

**Names and roles only, never bios.** A person's job title is six words maximum
(the linter enforces it). Their story is theirs to tell in the room.

## Round 3 — The run sheet

> "Walk me through the day. What time does it open, what happens when, and what
> time does it finish?"
>
> "Which moment is the one people should be looking at the screen for?"

**Why it matters.** The run sheet is the single most-used slide of the event.
People check it walking in, at the break, and whenever they wonder how long is
left.

Write each row as a time plus a very short label:

```
5:30–5:45pm   Doors and kai
5:45pm        Welcome and karakia
6:00pm        Panel: getting your first tech role
6:45pm        Q&A
7:15pm        Group photo and close
```

Six words maximum after the clock time. Fourteen rows maximum on one slide; a
two-day event splits into one slide per day.

Mark the "you are here" moment — usually the thing the room came for — so it can
be shown in the accent colour.

**Don't know the exact times:** ask for the shape ("doors at half five, panel at
six, done by half seven") and write the rows from that. An approximate run sheet
the room can see beats an exact one in someone's phone.

## Round 4 — Breaks and the group photo

> "Is there a break? How long?"
>
> "Are you doing a group photo? Before the break or at the end?"

**Why it matters.** The break slide runs a countdown clock on the screen, which
is the single most effective way to get a room back on time. The host presses
Space to start it and Space again to pause it.

**Don't know:** 15 minutes, before the closing. Say which default you used.

**No break at all** (a one-hour panel, a lunchtime talk): drop the slide rather
than inventing one. Say that you dropped it.

## Round 5 — Who to thank

> "Which partners should be thanked on the closing slide? Is it the same list as
> the sponsors on the event page, or is there someone extra — the venue, someone
> who brought the food, the volunteers?"
>
> "Anyone you want thanked by name — mentors, judges, the person who ran the
> door?"

**Why it matters.** Missing a sponsor off the thank-you slide is the mistake
that gets noticed, and it gets noticed by the person who paid for the room.

Start from `sponsors` in the event data and read the list back. Logos usually
already exist under `public/img/sponsors/`.

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
| **Event-specific slides** | various | **Everything. This is the work** |
| Group photo & break | `photo` + `break` | Break length, whether there is a photo, when (Round 4) |
| Thank you | `thanks` | Partners and named people (Round 5) |
| Upcoming events | `upcoming` | Up to three, with dates (Round 8) |
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
    ── event-specific slides ──
10  Group photo & break
11  Thank you
12  Upcoming events
13  Feedback QR
14  Ambassador QR
15  Closing karakia (whakamutunga)
```

Do not reorder it. The frame is the same at every She Sharp event so that a
volunteer who has hosted once can host any of them.

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
