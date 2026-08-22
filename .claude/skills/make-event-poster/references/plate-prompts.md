# Writing the plate prompt

The plate is the picture with no words on it. Everything readable is set in code
afterwards, so this prompt has exactly one job: produce an image that is **as
designed as the event deserves in the part you look at, and calm in the part the
type goes**.

Those are two different demands and only the second one is a constraint. The
first is the work.

## The one rule that is actually a constraint

**The type zone must be calm and far from the ink.** Even in tone, no bright
highlight crossing where a word will sit, and well clear of the ink's own
luminance so the gate passes.

That is it. It says nothing about the rest of the frame, and for a long time
this file behaved as though it did — it mandated "deep blacks" and "near-black"
in the house rules, so every plate came back as one glowing object on black.
Five events in a row looked like the same event. The founder's words on 22 Aug
2026: *不要老是暗色调* — stop always being dark — and *可以更有设计感，更贴合各个
活动不同的主题* — the picture may be more designed, and more particular to this
event.

**Dark was never the requirement.** It was a side effect of the type being
white, which was itself a hard-coded constant rather than a decision. Now that
`PosterTheme` carries its own ink, a pale plate with dark type is as legal as a
black one — the gate measures distance from the ink, not darkness.

## The shape that works

Three parts, in this order.

**1. The subject, and it should be a real idea.** Not "an image representing
collaboration" — a thing, made or photographed, that says what *this* event is
about and would not do for the one before it. Name the medium as deliberately as
the subject: a macro photograph, a long exposure, a cyanotype, a risograph
overprint, a woven paper construction lit from one side, a light-table
arrangement of glass and film. The medium is where an event stops looking like
every other event.

**2. The calm zones, and name the RIGHT two.** They are the **lower half**
(0.5–1.0 of the frame) and the **middle band** (0.33–0.62) — those are the two
`TYPE_ZONES` the generator measures, because the portrait sizes set their type
into the lower half and the website cover crops to the middle.

**This file used to say "the lower half and a clear strip across the very top",
and that was wrong for as long as it stood.** It leaves the middle free to be
the busiest part of the picture, which is exactly where the cover puts a
headline. Both plates built under the old wording show it: the Les Mills fibre
braid measured ±0.47 across the cover band, and the first Code Secure riso set
measured ±0.67 to ±0.72, because in each case the subject ran straight through
the middle while the top and bottom sat obediently empty.

The top still matters, but for a different reason and with no gate behind it:
the logo lockup goes there, and an event with three hosts needs a wider clear
run than one with a single partner. Name it as well — just do not mistake it
for one of the two that are measured.

So the subject wants to sit in the upper-middle band, roughly 0.10–0.35, or to
span the frame in a way that stays even where it crosses the two calm zones.

"Calm" is not "empty". A field of even texture — paper grain, a flat wash, an
unlit expanse — is calm. A field with three bright specular hits across it is
not, however dark its average, and the gate will say so.

**3. The house rules, verbatim.** Each has cost something:

```
No people, no faces, no text, no letterforms, no numbers, no logos.
Composed and deliberate, not a stock photograph. Fine natural grain,
no oversaturation, no lens flare.
```

Note what is **no longer** in that block: "photographic, not illustration", and
"deep blacks". The first was there to stop the generator inventing signage and
lettering — the explicit "no text, no letterforms, no numbers" does that job
directly and without ruling out every made or graphic image. The second is the
one that made everything black.

## Words to leave out

**Never write "poster", "background", "design brief", "layout" or "banner".**
Those are the words that make a generator invent signage, invent lettering, and
put a title block in the middle of the frame. Ask for a picture of a thing, in a
medium.

Avoid naming a colour palette in RGB or brand terms. Describe the light and the
material — *"the light inside the fibres is magenta and cyan"*, *"ink sitting wet
on cold-pressed cotton paper"* — and the accent extraction will find it.

## Worked examples

### A dark one, and why it worked

*No Pain, All Gain – Getting Fit for AI.* A fitness company hosting a panel about
AI across every job function. The organiser's own sentence was "AI is everyone's
job, not just the tech team".

> A macro photograph of a sculptural braid of fibre-optic strands lit from
> within. Dozens of fine glass filaments are bundled and twisted around each
> other like the fascicles of a muscle, the bundle running diagonally up through
> the upper third of the frame; points of light travel along the inside of the
> strands and bloom softly where the bundle crosses itself. Shot on a macro lens
> at a wide aperture — one plane of the braid is razor sharp and everything in
> front of and behind it falls away into deep bokeh. The light inside the fibres
> is magenta and cyan; the field around them is near-black.
>
> The bottom half of the frame is empty near-black, with only a faint magenta
> haze low down. A clear strip across the very top of the frame is unlit. Both
> are calm space for type.

"Muscle" is a **simile for the form**, not an instruction to render anatomy — the
subject named first and last is glass. It carries both halves of the event, a
body and a network, without putting a person in the frame.

Dark suited *that* event. The mistake was making it the only option.

### A light one, for contrast

The same three-part shape with the polarity flipped, for an event about
beginnings rather than systems:

> A large sheet of heavy cold-pressed cotton paper photographed flat from
> directly above in raking morning light, so the tooth of the paper throws fine
> shadows across the upper half. Three torn strips of paper in warm ochre, deep
> teal and a dusty rose are laid across the top third in a loose diagonal, their
> torn edges showing white fibre; a single length of waxed linen thread runs
> under and over them. The surface is bright and warm — bone white, not grey.
>
> The lower half of the frame is unbroken paper, evenly lit, with no strips and
> no thread crossing it. A clear band across the very top is plain paper too.
> Both are calm space for type.

Everything readable still comes from code, the subject is still not a person or a
place, and it could not be mistaken for a photograph of a She Sharp event — but
nothing about it is dark, and it belongs to one event rather than to a house
style.

## Getting from an idea to a subject

Ask what the event is about and listen for a concrete noun. Then look for one
object, and one way of making it, that is honestly both halves of it.

| The idea | A subject that carries it | A medium that makes it particular |
|---|---|---|
| "AI is everyone's job" | Many filaments, one braid, light through all of them | Macro, wide aperture, lit from within |
| Finding the flaw in code | A single lit fracture through dark glass | Macro, the light held inside the crack |
| A first-time coding workshop | One lit thread drawn out of a dark tangle | Long exposure, the thread in motion |
| Beginnings, a first cohort | Torn paper strips and one linen thread | Flat lay, raking daylight, bright paper |
| Twelve years of the community | Not generated at all — use the photographic archive | — |
| A hackathon's final night | Long-exposure light trails through a dark room | Slow shutter, handheld |

Two subjects on this list are dark and two are not, which is the point. If
nothing comes, ask another question rather than generating four variations of a
vague brief.

## Scope: what may be generated

Three rules that never move, and the reasons matter more than the rules.

**Never people or faces.** The room will be full of real people and the archive
is full of real photographs of them. A generated person beside those is a lie
with no upside.

**Never taonga** — no carving, no woven pattern, no moko, no motif belonging to
any iwi. Imitating taonga is appropriation whoever holds the pen, and "a machine
made it" is not a defence.

**Never anything that could pass for a real She Sharp photograph.** This is the
worst outcome available, worse than an ugly poster. The archive's entire value is
that it is true; one convincing fake event photo poisons every real one next to
it, because from then on nobody can tell which is which. If an image would make a
viewer ask "was I at that?", it must not exist. A macro of lit glass is safe
precisely because it could never be mistaken for a room at AUT — and so is a
sheet of paper. **A staged interior with soft daylight is not**, whatever its
palette, so richer does not mean "a scene with chairs in it".

**For a karakia or a ceremonial slide the scope is narrower still** — whenua
only: land, water, plants, light. That is a different job with a different rule,
and it lives in the `build-event-slides` skill.

## Choosing between candidates

Generate four. The script prints, per candidate, the **mean luminance of the
regions the type will land in**, and the **spread** within each — how far the
brightest part of that zone sits from the darkest.

Read them in that order. The mean tells you which ink the plate wants: far below
the midpoint wants white type, far above it wants dark. **The spread is the one
that fails a build** — an even zone at 0.55 is workable and a mottled one
averaging 0.20 is not, because a single specular hit does not move a mean but
does make a word unreadable, and the gate measures the word rather than the
average.

Under about **0.35** is calm. The numbers behind that: the four Code Secure
candidates measured ±0.02 to ±0.16 across both zones, and the Les Mills fibre
plate measured **±0.47** in the cover band — its mean there was a comfortable
0.105 while the lit braid ran straight through where the headline goes. That
poster shipped, because the scrim is heavy enough in that band to rescue it, but
the mean alone would never have told you it needed rescuing.

Then look at the contact sheet for the things no number can see:

- Is there **clear space at the top** for the logo lockup? It is wider than it
  used to be — an event with three hosts carries three marks.
- Does the subject **survive a 2:1 crop**? The banner takes a wide slice; a
  composition that only works tall is a composition that only works once.
- Is the subject **off-centre**? Dead-centre subjects fight the type in every
  format.
- Does it look like **this event**, or like the last one? If you cannot say what
  about it belongs to this evening in particular, that is the note.

Show the sheet to the organiser and let them choose. It is their event.
