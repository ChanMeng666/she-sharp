# Designing this event's skin

Every event gets its own look. That is the point of this file, and it is a
change from how the first two decks were built — they shared one visual system,
so the Les Mills panel evening came out looking like a two-day AI hackathon.

What follows is how far that freedom goes, where it stops, and how to use it.

## The one boundary, and it is not aesthetic

**The organisational sequence keeps the house skin. The event's own chapters
wear the event's.**

| Wears the house, always | Wears the event's skin |
|---|---|
| Title, opening karakia, health & safety | The chapter card that hands over |
| We are She Sharp, the team, the impact figures | Everything after it |
| The sponsor wall, Stay Connected | The run sheet, the speakers, the tables |
| Thanks, upcoming, feedback QR, ambassador QR, closing karakia | The break, the closing photograph |

The archive wall and the purple duotone are the only thing making twelve years
of photography — shot in twelve different rooms under four stops of colour
temperature — read as one organisation. They are She Sharp's record of itself.
An event may not restyle them, any more than it may restyle the charity number.

The crossover is the chapter card, and that is deliberate: it is where the deck
stops being about She Sharp and starts being about the evening, so it is the
first slide to carry the evening's own identity.

You do not have to do anything to get this right. `buildOpeningSlides()` and
`buildClosingSlides()` stamp their own slides, and every slide you write in the
deck file is the event's by default.

## What a skin controls

- **The surface** — what fills the frame behind a statement slide, and what the
  thin band on a light slide is a strip of.
- **The palette** — canvases and the ink ramp, beyond the accent pair.
- **The geometry** — panel edges, rules, radii, chip corners.
- **The motion tempo** — how fast and how smoothly the entrances play.
- **The type personality** — tracking, case, the weight relationships in the
  small type.

## What a skin may never control

Each of these fails **silently**, on a projector or a phone, in front of a room.

- The stage geometry. No `vw`/`vh`/`dvh` inside the stage — ever. Use `cqi` or
  design px. Nothing may touch `.deck-stage`, `.deck-safe` or `.deck-slot`.
- The 1080 design height and the type scale it depends on.
- The copy limits and the rhythm rules. A skin changes how a deck looks, never
  what it is allowed to say.
- The accent contrast floor.
- `will-change` on a repeating row, or an ambient loop that is not scoped to
  `[data-active="true"]` **and** `[data-motion="on"]`. Both gates, every time —
  the first is what stopped iOS Safari killing the tab, the second is the `L`
  static-mode switch a host presses when the venue laptop stutters.
- The white logo chip. A partner's mark is not ours to restyle for a theme, and
  a multi-colour SVG survives both tones only because it sits on white.

## The order of work

**The poster comes first.** It is where the concept is decided, it is cheap to
iterate on, and the organiser can look at it and say yes or no long before any
front-end exists.

1. Generate the poster with `scripts/events/generate-poster-plate.ts` and
   compose it with `scripts/events/build-event-poster.ts`. Show it. Get a yes.
2. Take the accent off the poster — `scripts/deck/accent-from-poster.ts`.
3. Name the concept in one sentence. *"A braid of fibre-optic strands lit from
   within."* If you cannot, there is no skin yet, and the honest answer is the
   house skin.
4. Build the skin from that sentence, in the three places below.
5. Preview at four shapes, as always.

## The three places a skin lives

**One.** A `DeckSkin` in the deck file (or `lib/deck/skins.ts` if it will be
reused):

```ts
const FIBRE_SKIN: DeckSkin = {
  key: "fibre",
  name: "Fibre",
  description: "The poster's braid of lit fibre-optic strands.",
  surface: { kind: "plate", images: [PLATE_A, PLATE_B], drift: true },
  tempo: 1.25,
};
```

Then `skin: FIBRE_SKIN` on the deck.

**Two.** A `[data-skin="<key>"]` block in
`styles/components/deck-skins.css`. This is where the look actually is —
panels, rules, tracking, ambient loops.

**Three.** Only if the surface is a genuinely new *kind*: a branch in
`components/deck/surfaces.tsx` and a variant on `SurfaceSpec` in
`lib/deck/types.ts`. Two kinds exist:

| Kind | What it is | Use when |
|---|---|---|
| `archive` | The house wall of archive tiles | The event has no artwork of its own |
| `plate` | A field built from the event's own images, panned per slide | There is a poster |

A `plate` surface wants **at least two images**. One image across a deck's
statement slides reads as a stuck projector however far it is panned.

## Traps, all of them real

- **`object-position` cannot be set from the stylesheet.** `DeckImage` writes it
  inline from `DeckImage.focus`, and an inline style beats any stylesheet. A
  `--plate-pos` custom property was written, compiled cleanly, and did nothing —
  every band showed the top strip of the plate, which on a poster plate is the
  empty near-black the prompt asked for. A black bar, from a rule that looked
  correct. The pan travels on `focus`; see `platePlacement()`.
- **A plate keeps its own colours.** The purple duotone is for archive
  photography used as mass. Applying it to the event's own artwork would undo
  the whole reason the artwork exists.
- **Container queries must stay in descending width order.** A 900px stage
  matches both the 1560px and the 1000px block at equal specificity, and source
  order decides. Put the narrower block last, or a 4:3 projector silently runs
  the wide treatment.
- **The band's height is `--deck-band-h`.** The layouts already reserve
  `BAND_PAD` for it. Change the height and the type lands on the band.
- **Test the light slides, not just the dark ones.** A skin that only shows up
  on chapter cards is a skin nobody sees — most of a deck is light.

## Generated imagery: what is allowed

The rules differ by what the image is *for*, and they always did.

**For a karakia, a ceremony or a chapter of quiet:** whenua only — land, water,
plants, light. Never people. Never taonga: no carving, no woven pattern, no
moko, no motif belonging to any iwi. `public/img/plates/` holds six of these.

**For an event's own artwork:** the subject is open — it is this event's poster
concept, and a fitness company talking about AI is not going to be served by a
photograph of harakeke. What does not change:

- **Never people, never faces.** The room is full of real people and the archive
  is full of real photographs of them; a generated person next to those is a lie
  with no upside.
- **Never taonga.** Unchanged, and not negotiable.
- **Never anything that could pass for a real She Sharp event photograph.** This
  is the one that matters most. The archive's entire value is that it is true,
  and one convincing fake means nobody can trust any of it again. An abstract
  macro of lit glass could never be mistaken for a room at AUT, which is exactly
  why it is safe.
- **No text, no logos** in the generated image. Those are set in code, where
  they can be corrected.

Say in the preview which slides carry generated artwork, exactly as you would
name a borrowed archive photograph.

## When the honest answer is the house skin

- The event has no poster and nobody has time to make one.
- The concept cannot be said in a sentence.
- It is a recurring organisational event — the house skin *is* its identity.

Say so plainly: *"This one runs on She Sharp's own look — there's no artwork for
it yet, and the archive is the strongest thing we have."* A deck in the house
skin is not a failure. A deck in a half-built bespoke skin is.

**This applies to the SKIN and never to the weave.** A deck with no artwork still
picks how the archive is arranged — see `references/weaves.md` — and that choice
is enforced by the type system, because it is the axis that produced the twins in
the first place. Taking the house skin is a decision about this event's identity.
Taking the same weave as the deck next to it is not a decision at all; it is the
default, and the default is what went wrong.
