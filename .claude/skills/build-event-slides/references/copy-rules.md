# How to write for a slide

A projected slide is read from three metres away by someone who is also
listening to a person talk. That is the whole design brief, and every rule below
comes out of it.

The room can read, or it can listen. It cannot do both. So the slide carries the
**shape** of what is being said, and the person carries the meaning. If a slide
can be understood without the speaker, the speaker has nothing to do.

None of this is advice. `lib/deck/lint.ts` enforces it and the build fails.
**When it fails, the copy changes** — you rewrite it shorter and read the new
version back to the author for a yes. They never see the error.

---

## The limits, in plain words

| Thing | Limit |
|---|---|
| Words in a slide title | **7** |
| Words in the one sentence under a title | **18**, and it must be one sentence |
| Bullets on a slide | **5** |
| Words in a bullet | **10** |
| Bullet slides in a row | **2** |
| Words after the time on a run-sheet row | **6** |
| Rows on one run-sheet slide | **14** |
| Words in a person's job title | **6** |
| Big numbers on a stats slide | **4** |
| Cards on a themes slide | **6** |
| Rows on a criteria slide | **5**, description 10 words each |
| Rows on a prizes slide | **4** |
| Photos in a photo grid | **3 to 5** |
| QR codes on the contact slide | **3** |
| Facts under a title-slide headline | **3** |
| Upcoming events | **3**, blurb 18 words each |
| Words in the kicker | **5** — see below, this one is a nudge |

Three more that are not counted but are checked:

- **A bullet never ends with a full stop.** Bullets are fragments, not
  sentences. A full stop on one bullet and not the next is the most common way a
  deck starts looking homemade.
- **A bullet never starts with a dash or a dot.** The layout draws the marker.
  Typing your own creates a sub-bullet, and a sub-bullet is a paragraph wearing a
  disguise.
- **The kicker never restates the title or the section label.** See the next
  section — this one has its own rule because it is the difference between a
  deck that sounds like a person and a deck that sounds like a machine.

---

## The kicker

Every slide carries a short line above the title. It is not decoration and it is
not a subtitle. It is the one place on a slide where you get to say something
the layout cannot.

Two labels sit at the top of a slide and they do different jobs:

| | What it does | How often it changes |
|---|---|---|
| **Section label** | Names the chapter — "Day One", "The challenge" | Stays put across many slides |
| **Kicker** | Names *this* page — what to do, or what is true right now | Different every single time |

**They must never be restatements of each other, and the kicker must never
restate the title.** The checker rejects both, because it is the most reliable
tell that nobody actually wrote the slide. A kicker reading "DAY ONE" on a slide
titled "Day one" inside a section called "Day One" is three labels saying one
thing and the room reads none of them.

### What a good one sounds like

These are from the approved prototype:

```
PLEASE STAND IF YOU ARE ABLE       on the opening karakia
THE FIRST OF TWO BUILD DAYS        on the Day One divider
DOORS AT FIVE, DINNER ON ARRIVAL   on the run sheet
```

Read those again and notice what they have in common. Not one of them describes
the slide. Each one either **tells the room what to do**, or **tells the room
what is true right now** — a thing the person at the front would otherwise have
to say out loud, or would forget to say at all.

That is the test. Write the kicker by asking: *standing in this room, at this
moment, what does someone need to know that the title does not say?*

**On length:** five words is the target and the checker will point at anything
longer — but it points, it does not block. All three examples above run to six,
because in each case the sixth word is carrying real weight ("if you are
**able**" is the whole courtesy of that line). Six is fine when the extra word
earns its place. Nine is a sentence, and a sentence in the kicker slot is a
second title.

| Slide | Weak kicker (restates) | Strong kicker (adds) |
|---|---|---|
| Health & safety | `HEALTH AND SAFETY` | `THE EXITS ARE BEHIND YOU` |
| Meet the judges | `OUR JUDGES` | `THEY SEE YOUR DEMO AT THREE` |
| Break | `BREAK TIME` | `COFFEE IS IN THE ATRIUM` |
| Prizes | `THE PRIZES` | `EVERY TEAM PITCHES, EVERY TEAM SCORES` |
| Sponsors | `OUR SPONSORS` | `THEY PAID FOR THE KAI` |

**The deck shipped before this rule used the kicker slot zero times across
thirty-six slides.** Every one of those slides was correct and every one of them
was a little more anonymous than it needed to be. Six words is a low price.

### Where the words come from

You write these, from what the author told you in the interview — not by asking
them for thirty-six of them. Listen for the practical asides: *"oh, tell people
the toilets are through the double doors"*, *"dinner's there when they arrive"*,
*"they should stand for the karakia if they can"*. Those asides **are** the
kickers. Write them down as you hear them.

---

## The rhythm limits — the deck, not the slide

Everything above judges one slide. These judge the sequence, and a deck can pass
every rule above and fail every rule below.

| Thing | Limit |
|---|---|
| Full-frame slides in a row | **2** |
| Information slides in a row | **4** |
| Slides of the same tone (all light, all dark) in a row | **4** |
| Share of dark slides, in a deck of 12 or more | **at least 25%** |
| Different layouts used, in a deck of 10 or more | **at least 8** |
| Bullet slides in a row | **2** |

**Full-frame** slides are the ones that fill the screen and carry almost no
information: the title, a chapter divider, a karakia, a break, a single
photograph, the prizes. They are the breathing. **Information** slides are
everything else.

### Why a correct deck can still be exhausting

Nobody reviews a deck as a deck. They open it, look at slide four, fix a word,
look at slide five, fix a word. Every slide gets checked and the *shape* of the
thing never does — which is how the first version of the hackathon deck went out
with **eight consecutive light information slides** in the middle of it. Not one
of them was wrong. Sitting through them was like being read a list of lists.

An audience is not reading your deck, they are enduring it. What they actually
register is change: light to dark, dense to empty, words to a face. Take the
change away and the room stops looking up, and once a room has stopped looking
up it does not start again for the good slide you were saving.

### When the checker flags a run

It will say something like *"8 information slides in a row (max 4), ending at
slide 20"*. Do not shuffle the slides — the order is the order of the day and
moving a slide moves a moment. **Put something in the gap instead**, roughly
halfway along the run:

- a **section divider**, if the run crosses a genuine change of subject — this
  is the right answer about half the time, and it costs the deck nothing because
  the divider was the missing beat all along;
- a **photograph** of the thing being discussed, at full size, with the point in
  four words over it;
- the **break** you were going to announce verbally anyway;
- or **turn one of the slides in the run into something else** — a list of five
  things is very often three themes, four criteria or a stats slide wearing a
  list's clothes.

And if the fix is that two adjacent slides say almost the same thing, the real
answer is to delete one. A run of eight is sometimes a run of six with two
slides nobody needed.

The other two you will see are **"not enough of the slides are dark"** and
**"not enough different layouts"**. The first means the deck has no quiet
moments — add a divider, a photograph or a break, all of which are dark by
default. The second means you kept reaching for the same layout, which almost
always means the content got bent to fit it rather than the other way around.

---

## Before and after

These are real She Sharp event prose, shortened the way you should shorten it.

### A description becomes a title

> **Before (14 words)** — "An evening panel discussion about how women move from
> their first tech role into leadership"

> **After (5 words)** — "From first role to leadership"

The date, the venue and the word "panel" are all elsewhere on the slide. The
title only has to name the idea.

### A paragraph becomes bullets

> **Before (34 words)** — "Over the course of the day you'll be working in a
> small team with people you probably haven't met before, using AI tools to
> build something that actually addresses a real environmental problem here in
> Aotearoa, and you don't need to be able to code to take part."

> **After (7 words, one bullet)** — "Build something real — no code required"

If the other three ideas in that paragraph genuinely need to be on screen, they
are three more bullets, not one longer one:

```
Teams of four, formed on the day
Real environmental problems from Aotearoa
No code required
```

Twenty-eight words became twelve. Everything cut is still said out loud, and the
detail lives on the event page behind the QR code.

### A run-sheet row loses its explanation

> **Before (12 words)** — "5:45pm — Welcome from the She Sharp team and our
> opening karakia"

> **After (3 words)** — "5:45pm — Welcome and karakia"

Nobody reads a run sheet to learn what a welcome is. They read it to find out
what time it is at.

### A job title stops being a biography

> **Before (17 words)** — "Senior Data Engineer at Fonterra, where she leads the
> platform team and mentors through She Sharp"

> **After (5 words)** — "Senior Data Engineer, Fonterra"

The mentoring is worth saying. Say it out loud while her face is on screen —
that is a better moment than a line of small text nobody at the back can read.

### A rule becomes a criterion

> **Before (23 words)** — "Judges will be looking at how well the solution
> actually addresses the problem the team chose, and whether it could realistically
> be built"

> **After — name 2 words, description 7 words**

```
Impact       Solves a real problem for real people
Feasibility  Could actually be built from here
```

### A lead sentence stops being two

> **Before** — "This is our fourth year running the hackathon. We've had over
> 300 people take part."

> **After (13 words)** — "Our fourth hackathon, and more than 300 people have
> taken part so far"

The limit is one sentence for a reason: two sentences on a slide is where a
paragraph starts.

---

## What goes on a slide, and what stays on the event page

| On the slide | On the event page, behind a QR code |
|---|---|
| The run sheet | The detailed schedule with room numbers |
| Speaker names and job titles | Speaker biographies |
| Four criteria, seven words each | The full judging rubric and weightings |
| "Teams of four, formed on the day" | The complete team-formation rules |
| Prize amounts | Terms, eligibility, how payment works |
| The feedback QR code | The feedback form itself |
| "Free, register on Humanitix" | Refund policy, accessibility info, parking |

The test: **does the room need this in order to do something in the next five
minutes?** Yes → slide. No → page.

This is not about hiding detail. It is about putting detail where it can be
read properly, by the people who want it, on their own phone, later.

---

## Why the specific rules exist

**Nothing smaller than 28px.** The deck's type scale bottoms out there and there
is nothing below it. If copy only fits by getting smaller, it does not fit —
from the back of a room, 28px on a 1080-tall stage is already the floor. Cut the
copy instead.

**One idea per slide.** A slide with two ideas gets read twice and heard once.
When a slide is fighting the limits, that is almost always the real problem —
split it in two, both halves will be better, and nobody has ever complained that
a deck had too many slides.

**No more than two bullet slides in a row.** Three consecutive bullet slides is
the exact point where a room stops looking up. Break the run with a photo, a
stats slide, a section divider, or a themes grid. The linter fails on the third
one, on purpose.

**Bullets have no full stops.** They are fragments — "Teams of four, formed on
the day", not "Teams of four are formed on the day." A fragment reads in one
glance; a sentence asks to be read as prose, which takes attention away from
the person talking.

**Job titles are six words.** Longer and the people grid either shrinks the text
below readable or wraps into three lines and breaks the alignment across the
row. Both look worse than the shorter title reads.

**Three QR codes maximum.** Four codes on a slide means each one is too small to
resolve from more than a few metres, so nobody scans any of them.

**Three upcoming events maximum.** People remember one. Three is generous. Five
is a list, and a list is something you skim rather than act on.

## How to read a rewrite back

Always show the change and ask, never just do it:

> "How we'll be judging your project and what the weighting is across the two
> days" was too long for a title, so I've made it **"How judging works"** and
> put the weightings in the rows underneath. Does that still say what you meant?

Two things that matter about that sentence: it shows the new version, and it
ends with a question. The author knows their event better than you do, and
sometimes the shortening loses the thing that mattered. Give them the chance to
say so.

Never say "the linter rejected it". They did not write the linter and it is not
their problem.
