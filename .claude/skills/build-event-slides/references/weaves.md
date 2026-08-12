# Choosing this deck's weave

Every deck picks one **weave**: how She Sharp's own photographs are arranged on
She Sharp's own slides. It is one line in the deck file and it is not optional —
the type will not compile without it.

This is the newest thing in the deck system and it exists because of a specific
failure, which is worth knowing before you choose.

## Why this field exists

Until August 2026 a deck's look was `theme.accent` and `skin`, and **neither of
them reaches the organisational slides**. The opening and closing sequences are
stamped `surface: "house"`, and the house look was one fixed arrangement: six
rows of archive photographs drifting past each other.

For the Les Mills deck that was fourteen slides out of twenty-four. Over half
the deck was, pixel for pixel, the hackathon deck — while the skin, the accent
and the plates all differed on the other ten. The organiser's reaction was the
correct one: *these look like the same deck.* They were, mostly.

So the arrangement became a choice. What stays fixed is everything that carries
the organisation: the 118 photographs, the purple duotone that makes twelve
years of wildly different lighting read as one thing, and the 166px grid the
whole stage is built on. What varies is the composition laid on that grid — and
that is what a room notices from ten metres.

## The three weaves

| key | what it is | what it says |
|---|---|---|
| `drift` | Six rows of archive sliding slowly past each other, alternate rows in opposite directions. | Restless, continuous, never settling. |
| `contact-sheet` | One strict grid, every cell the same size, completely motionless. | Ordered, documentary, held still. |
| `mosaic` | A grid on the same rows, but cells are one or two columns wide in an uneven rhythm. Motionless. | Editorial, composed, less formal. |

**Taken so far:** `drift` — Aotearoa AI Hackathon Festival 2026.
`contact-sheet` — Les Mills, 3 September 2026.

Run `npx tsx scripts/deck/style-ledger.ts` for the live list. Do not guess from
this table; it is prose and it will go stale.

## How to choose

Ask what the *event* is like, then ask what the rest of *this deck* is already
doing. The second question is the one people forget, and it decided Les Mills:

> Its event slides already sit on a drifting plate of fibre-optic light. Put the
> drifting archive on the organisational slides too and nothing in twenty-four
> slides is ever still. A motionless house sequence says the true thing instead
> — the organisation is the fixed point, the evening is what is moving.

Two useful prompts:

- **A weekend hackathon, a festival, something with genuine churn to it** →
  `drift` earns its restlessness.
- **A panel evening, a lecture, a ceremony, an awards night** → a still weave.
  Pick `contact-sheet` for something formal and `mosaic` for something warmer.

And one rule that overrides taste: **a weave no other deck is using beats a
better-argued weave that a neighbouring deck already has.** `deck.test.ts` fails
the build when two decks share a weave *and* an accent hue sector, because that
combination is precisely what makes two decks read as one.

## Writing it

```ts
export const myEventDeck: Deck = {
  slug: EVENT_SLUG,
  // …
  archive: "contact-sheet",
  // …
};
```

`scripts/deck/new-deck.ts` fills this in for you with a weave nothing else is
using, and prints which ones are still free. If you change it, say why in a
comment — the next person's first question will be "why this one".

## What a weave may not do

The same list as a skin, plus one:

- **It may not change the grid.** Six rows of `--deck-tile-h` on the house
  gutter fill exactly 1080 minus the running header, and five rows land exactly
  where `INCISION_5_ROWS` puts a chapter card's translucent panel. Widen the
  gutter and the bottom row is sliced and the panel cuts through the middle of a
  photograph — on a projector, and nowhere else. A contact sheet's identity is
  uniformity, not air.
- **It may not restyle the photographs.** The purple duotone is the
  organisation's, not the event's.
- **No `vw`/`vh`/`dvh`, no `will-change` on a repeating cell, and any ambient
  loop needs both the `[data-motion="on"]` and `[data-active="true"]` gates.**
  See `references/skins.md` — every one of these has already broken something.

## Adding a fourth

Three things, and it is the same shape as adding a surface kind:

1. a builder in `lib/deck/wall.ts` returning `WeaveCell[]`,
2. a branch in `components/deck/slides/archive.tsx`,
3. a `[data-…]`-free `.deck-weave-<key>` block in
   `styles/components/deck-weaves.css`, plus its breakpoints.

Then add the key to `ArchiveWeaveKey` in `lib/deck/types.ts` — **last, not
first**. A key in the union that nothing renders is a weave the ledger will
recommend and the scaffold will assign, and the first anyone knows about it is a
blank ground on a projector. A vertical-column weave was designed and left
unbuilt for exactly this reason; it needs `steps()` timing to keep a horizontal
panel on a cell edge, and an unbuilt key was judged worse than three that work.

Every weave owes **both** a full-bleed form and a band form. A light slide with
no band has no family resemblance to the dark slides either side of it, and most
of a deck is light.
