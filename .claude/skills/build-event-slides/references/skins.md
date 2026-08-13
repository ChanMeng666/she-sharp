# Designing this event's skin

Most events do not need one. The first section says what they get instead; the
rest of the file is for the events that do.

## The default for a regular evening: Editorial Paper

She Sharp's public site was rebuilt in July 2026 around a visual system it
already has a name for, and since August 2026 that system is what a deck wears
unless someone decides otherwise. **Editorial Paper** puts it on the projector:
a paper ground under navy ink, hairline rules instead of shadows, a line of
Carattere script where a statement slide introduces itself, chapter numerals
drawn as outlines rather than filled, page numbers set as `(07)` on the rail,
and the accent used as punctuation — a mint or purple full stop after the
kicker — rather than as decoration. The organisational slides keep the archive
photo wall under the brand purple duotone, untouched; Editorial Paper is type,
rule and radius, and the wall behind it stays She Sharp's.

**`scripts/deck/new-deck.ts` writes it in for you.** A scaffolded deck arrives
with `import { EDITORIAL_SKIN } from "../skins";` and `skin: EDITORIAL_SKIN,`
already on it, so this is a decision to confirm rather than one to make. Say it
to the author in their words:

> Your slides use She Sharp's own editorial look — the same paper, navy and
> hairline rules as the website, so the night reads as a She Sharp night rather
> than as a one-off. The photo wall on the She Sharp slides is unchanged.

**Why a default at all.** A two-hour panel evening has no visual concept of its
own and should not be made to invent one. The attempt to give the Les Mills
evening a bespoke identity took three rounds before anybody could say what it
was *for*, and every round was measuring itself against the hackathon deck —
which had never made a design decision either, so "different from that" was
never a brief. A shared editorial voice is the honest answer to "what does a
normal She Sharp evening look like", and it is a better answer than a different
half-built concept every month.

### The knobs inside the default

Two, and there is no third.

1. **The accent pair.** The default is brand purple on paper and mint on navy.
   Take the event's own accent off its poster —
   `npx tsx scripts/deck/accent-from-poster.ts <slug>` — and use it **only if it
   genuinely beats purple and mint**, which is a higher bar than "it is this
   event's colour". It has to clear **4.5:1 on both canvases**, `onDark` lighter
   than `onLight`, and it has to land in a hue sector no neighbouring deck is
   using: `deck.test.ts` fails the build when two decks in this skin share both
   the weave and the hue sector. Run `npx tsx scripts/deck/style-ledger.ts` and
   look before you choose.
2. **The archive weave** — how the organisational slides arrange the wall. See
   `references/weaves.md`. The scaffold picks a free one.

Everything else is the same at every event on purpose. Do not open the type
scale, the geometry or the tempo to make one evening feel special; that is what
the deviation below is for.

### When to deviate

- **The event's poster gives you a concept you can say in one sentence**, and
  the sentence is about the evening rather than about the artwork. *"Night water
  under the bridge lights, because the whole thing runs after dark."* If you can
  say it, build the skin — the rest of this file is how. If you cannot, you do
  not have a concept, you have a preference, and Editorial Paper is the better
  deck. See the bar under **The order of work**: it has been failed before.
- **A flagship or multi-day event that must not read as a regular evening.** A
  hackathon festival, a conference, an awards night. These earn their own look
  because the room already knows they are not a Tuesday panel, and a deck that
  says otherwise is telling the room the wrong thing.

Anything else — "the last deck used it", "it would be nice to vary it" — is not
a reason. **A deck in a half-built bespoke skin is worse than a deck in this
one.** That sentence is older than Editorial Paper and it is the whole reason
Editorial Paper exists.

### Two decks in one skin

Two evenings wearing Editorial Paper are meant to look related — that is what a
house system is. `lintDeckSet()` therefore stops asking a same-skin pair to
differ on surface, geometry and tempo (they cannot; they share a skin) and
instead requires them to differ on **both** the archive weave and the accent hue
sector. One alone is the same night in a different colour, or the same colour in
a different order. If you run out of room, the answer is a fourth weave or a
skin of its own for that event — not a colour nobody chose.

---

The rest of this file is the system underneath. The next three sections apply to
every deck including one wearing the default; from **The order of work** onwards
it is about building a bespoke skin for an event that cleared the bar above.

## The one boundary, and it is about content

**The organisational slides keep She Sharp's own photographs. Everything else
about how they look is the event's.**

| Never the event's | Always the event's |
|---|---|
| Which photographs appear on the organisational slides — twelve years of real rooms, from the archive | The ground, the ink, the grade, the edges, the type personality |
| Which organisational slides exist, and in what order | The event's own chapters, entirely |
| The white logo chip a partner's mark sits on | The accent, the kicker colour, the tempo |

**This was drawn in the wrong place once, and it is worth knowing why.** The
boundary used to be around *treatment*: organisational slides wore the house
skin outright. But the organisational sequence is fifteen slides of a
twenty-five slide deck, so an event's design reached ten and the rest were the
same paper, the same navy ink, the same purple grade and the same type as every
deck ever built. Two decks came out looking like one. A weave was added so the
archive could be *arranged* differently, and they still came out looking like
one — because the arrangement was never what the room was reading. It was
reading the palette.

So the archive photographs stay, and their treatment does not. The grade in
particular: its job is to make photography shot across four stops of colour
temperature read as one thing, and it does that in **any** hue. Brand purple was
the convention, not the mechanism. A deck that regrades the archive to its own
light still shows every one of those rooms, still shows them all as one, and no
longer looks like the deck before it.

You do not have to do anything to get this right. `buildOpeningSlides()` and
`buildClosingSlides()` stamp their own slides, `skinForSlide()` keeps their
surface and gives them your palette, and every slide you write in the deck file
is the event's by default.

### Three tokens that are not what their names say

All three cost a rebuild to find. Check them whenever a skin moves a ground.

- **`theme.lightCanvas` drives the ink over photographs, not a canvas.**
  `themeToCssVars()` emits it as `--deck-canvas-light`, and every consumer —
  `karakia-slide`, `break-slide`, `photo-slide` — uses it as *the light colour to
  set type in over a picture*. Nothing uses it as a background. Declare a dark
  value there and the opening karakia becomes near-black type over a photograph
  of the sea. Set the honest value for the contrast checker, then restate
  `--deck-canvas-light` as ink in your skin block.
- **`--deck-paper` becomes the INK on a dark slide.** `deck.css` sets
  `--slide-ink: var(--deck-paper)` there — an elegant inversion, and the wrong
  one to inherit if you have moved paper somewhere dark.
- **`--deck-content-max` is measured against by a layout.** `people-slide.tsx`
  derives its column count assuming ~1230px. Narrow the measure for air and a
  fifteen-person team grid keeps its eight columns and breaks names mid-word:
  "McCaule/y", "Prasant/h". Get your composition from alignment and ground
  instead — nothing measures against those.

**If you move the ground, you must move the ink with it — in the CSS *and* in
`theme.ink`.** `deck.test.ts` asserts body text clears 7:1 against its own
canvas and it reads the theme, not the stylesheet. The first dark skin declared
its canvases and left the ink implicit; the check measured the house navy
against a near-black ground, reported 1.12:1, and was right — the title slide
had come out invisible. Same for `theme.darkCanvas` / `theme.lightCanvas`: if
they do not match what the CSS renders, the one check that can catch an
unreadable slide becomes a rubber stamp.

## What a skin controls

- **The surface** — what fills the frame behind a statement slide, and what the
  thin band on a light slide is a strip of.
- **The palette** — both canvases, the ink ramp, the hairlines and the rules.
  A skin may take the whole deck dark, or the whole deck pale; `data-tone` is a
  *contrast relationship*, not a literal colour, so the rhythm rules stay
  meaningful as long as the two registers still differ from each other.
- **The archive grade** — `--deck-duo-shadow` and `--deck-duo-highlight`. See
  the boundary above.
- **The geometry** — panel edges, rules, radii, chip corners.
- **The motion tempo** — how fast and how smoothly the entrances play.
- **The type personality** — tracking, case, weight. **Not the sizes**: `--dt-*`
  is the stage's contract with every layout, and a skin that changes them
  overflows a slide it has never seen.

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

*From here on: building a bespoke skin. If this event is taking Editorial Paper,
you are done — go back to the two knobs.*

**The poster comes first.** It is where the concept is decided, it is cheap to
iterate on, and the organiser can look at it and say yes or no long before any
front-end exists.

1. Generate the poster with `scripts/events/generate-poster-plate.ts` and
   compose it with `scripts/events/build-event-poster.ts`. Show it. Get a yes.
2. Take the accent off the poster — `scripts/deck/accent-from-poster.ts`.
3. Name the concept in one sentence. If you cannot, there is no skin yet, and
   the honest answer is Editorial Paper.
4. Build the skin from that sentence, in the three places below.
5. Preview at four shapes, as always.

**The sentence is a bar, not a formality, and it has been failed.** The Les
Mills evening got a "Fibre" skin in August 2026 — six generated plates, a `field`
surface kind and some seven hundred lines of CSS, off a sentence (*"a braid of
fibre-optic strands lit from within"*) that described the poster rather than the
evening. It went three rounds, satisfied nobody, and was deleted in full when
Editorial Paper replaced it. Two things it taught, both of which are now rules
elsewhere in this file: a concept has to be about the event and not only about
its artwork, and a bespoke skin costs the same to build whether or not the event
needed one.

## The three places a skin lives

**One.** A `DeckSkin`. When the deck is taking the default it is an import and
one line, and the scaffold has already written both:

```ts
import { EDITORIAL_SKIN } from "../skins";

export const myEventDeck: Deck = {
  // …
  skin: EDITORIAL_SKIN,
};
```

A bespoke one is declared in the deck file — or in `lib/deck/skins.ts` if it
will be reused, which is what happened to Editorial Paper once it stopped being
one event's idea:

```ts
const HARBOUR_SKIN: DeckSkin = {
  key: "harbour",
  name: "Harbour",
  description: "The poster's night water under the bridge lights.",
  surface: { kind: "plate", images: [PLATE_A, PLATE_B], drift: true },
  geometry: "glass",
  tempo: 1.25,
};
```

Then `skin: HARBOUR_SKIN` on the deck. Note what is NOT in either of these: no
sizes, no copy, no slide types. A skin is a look.

**`--force` and the scaffold.** `new-deck.ts` regenerates a deck around
`skin: EDITORIAL_SKIN,` without comment — it is an import, so the line means the
same thing in the new file. It **refuses outright** on any other skin
declaration, because a bespoke skin refers to plates and constants further up
the file that a one-line lift would leave pointing at nothing. Move it out by
hand first.

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

- **`object-position` cannot be set from the stylesheet.** Found building the
  Fibre skin, and it outlived it. `DeckImage` writes it inline from
  `DeckImage.focus`, and an inline style beats any stylesheet. A
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

## When the honest answer is Editorial Paper

- The event has no poster and nobody has time to make one.
- The concept cannot be said in a sentence.
- It is a recurring organisational event — the house voice *is* its identity.

Say so plainly: *"This one runs on She Sharp's own editorial look — there's no
artwork specific to it yet, and that look is the strongest thing we have."* A
deck in Editorial Paper is not a failure. A deck in a half-built bespoke skin is,
and the Fibre skin is the proof.

**This applies to the SKIN and never to the weave.** A deck with no artwork still
picks how the archive is arranged — see `references/weaves.md` — and that choice
is enforced by the type system, because it is the axis that produced the twins in
the first place. Taking Editorial Paper is a decision about this event's
identity. Taking the same weave as the deck next to it is not a decision at all;
it is the default, and the default is what went wrong.
