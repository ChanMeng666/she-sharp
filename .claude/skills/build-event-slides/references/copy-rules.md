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
| Words in an eyebrow (the small kicker) | **5** |

Two more that are not counted but are checked:

- **A bullet never ends with a full stop.** Bullets are fragments, not
  sentences. A full stop on one bullet and not the next is the most common way a
  deck starts looking homemade.
- **A bullet never starts with a dash or a dot.** The layout draws the marker.
  Typing your own creates a sub-bullet, and a sub-bullet is a paragraph wearing a
  disguise.

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
