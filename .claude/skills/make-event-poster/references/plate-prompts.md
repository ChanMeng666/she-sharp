# Writing the plate prompt

The plate is the picture with no words on it. Everything readable is set in code
afterwards, so this prompt has exactly one job: produce a photograph-like image
that is **beautiful in the part you look at and empty in the part the type goes**.

## The shape that works

Three parts, in this order.

**1. The subject, framed as a photographer would frame it.** The light, the
lens, the depth of field, what is sharp and what falls away. Not "an image
representing collaboration" — a thing, photographed.

**2. The clear space, named explicitly and more than once.** *"The bottom half of
the frame is empty near-black."* *"A clear strip across the very top is unlit."*
Without this you get a lovely picture with the subject dead centre and nowhere to
put a word. Name **two** regions, because the five formats put type in different
places: the portrait sizes set into the lower half, the banner into the leading
edge.

**3. The house rules, verbatim.** These are not decoration; each has cost
something:

```
Photographic, not illustration. No people, no faces, no text, no logos.
Cinematic, restrained. Fine natural film grain, deep blacks, no oversaturation.
```

## Words to leave out

**Never write "poster", "background", "design", "layout" or "banner".** Those are
the words that make a generator invent signage, invent lettering, and put a
title block in the middle of the frame. Ask for a photograph of a thing.

Also avoid naming a colour palette in RGB or brand terms. Describe the light —
"the light inside the fibres is magenta and cyan" — and the accent extraction
will find it.

## Worked example

Event: *No Pain, All Gain – Getting Fit for AI.* A fitness company hosting a
panel about AI across every job function. The idea, in the organiser's words, was
"AI is everyone's job, not just the tech team".

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
> haze low down. A clear strip across the very top of the frame is unlit
> near-black. Both are empty space for type.
>
> Photographic, not illustration. No people, no faces, no text, no logos.
> Cinematic, restrained. Fine natural film grain, deep blacks, no oversaturation.

Why it works: "muscle" is a **simile for the form**, not an instruction to render
anatomy — the subject named first and last is glass. It carries both halves of
the event (a body, a network) without putting a person in the frame. And the two
clear regions are the two the layouts actually use.

## Getting from an idea to a subject

Ask what the event is about and listen for a concrete noun. Then look for one
object that is honestly both halves of it.

| The idea | A subject that carries it |
|---|---|
| "AI is everyone's job" | Many filaments, one braid, light through all of them |
| A first-time coding workshop | A single lit thread being drawn out of a dark tangle |
| Twelve years of the community | Not generated at all — use the photographic archive |
| A hackathon's final night | Long-exposure light trails through a dark room |

If nothing comes, ask another question rather than generating four variations of
a vague brief. A prompt written from a sentence the organiser recognises produces
something they will approve; one written from "make it about technology" does not.

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
viewer ask "was I at that?", it must not exist. An abstract macro of lit glass is
safe precisely because it could never be mistaken for a room at AUT.

**For a karakia or a ceremonial slide the scope is narrower still** — whenua
only: land, water, plants, light. That is a different job with a different rule,
and it lives in the `build-event-slides` skill.

## Choosing between candidates

Generate four. The script prints, per candidate, the **mean luminance of the
regions the type will land in**. Lower is better — that is the number, not a
feeling.

Then look at the contact sheet for the things the number cannot see:

- Is there **clear space at the top** for the logo lockup?
- Does the subject **survive a 2:1 crop**? The Humanitix banner takes a wide
  slice; a composition that only works tall is a composition that only works
  once.
- Is the subject **off-centre**? Dead-centre subjects fight the type in every
  format.

Show the sheet to the organiser and let them choose. It is their event.
