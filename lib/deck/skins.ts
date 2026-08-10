/**
 * Deck skins: the per-event visual identity, and the line it may not cross.
 *
 * WHY THIS EXISTS. Until now a deck's only per-event knob was `theme.accent`,
 * so every deck was the archive wall in a slightly different purple. The Les
 * Mills deck came out looking like the hackathon deck, which is the defect this
 * module answers: a deck should look like ITS event, and the poster is where
 * that look is decided.
 *
 * THE ONE HARD BOUNDARY, and it is not aesthetic. **The organisational sequence
 * keeps the house skin; the event's own chapters get the event's skin.** The
 * team, the impact figures, the sponsor wall and the thanks are She Sharp's
 * record of itself, and the archive wall is what makes twelve years of
 * photography shot under twelve different lighting conditions read as one
 * organisation. An event may not restyle that. Everything from the chapter card
 * onwards is the event's, because the chapter card is precisely the handover.
 * `SlideBase.surface` carries which side of that line a slide is on, and
 * `buildOpeningSlides()` / `buildClosingSlides()` stamp it so an author cannot
 * forget.
 *
 * WHAT A SKIN CONTROLS
 *   - the SURFACE: what fills the frame behind a statement slide
 *   - the PALETTE: canvases and the ink ramp, beyond the accent pair
 *   - the GEOMETRY: panel edges, rules, radii
 *   - the MOTION TEMPO: how fast and how smoothly a recipe plays
 *   - the TYPE PERSONALITY: tracking, weight, case
 *
 * The last four are CSS, keyed on `[data-skin="<key>"]` in
 * `styles/components/deck-skins.css`. Only the surface needs data, so only the
 * surface is in this file.
 *
 * WHAT A SKIN MAY NOT CONTROL — because each of these fails silently on a
 * projector or a phone, and the rules are documented where they are enforced:
 * the stage geometry (`styles/components/deck.css`), the 1080 design height,
 * the copy and rhythm limits (`lib/deck/lint.ts`), the accent contrast floor,
 * or the eighteen slide types. A skin changes how a deck LOOKS, never what it
 * is allowed to say or how it is measured.
 *
 * ADDING ONE is three things and no more: a `SurfaceSpec` here, a
 * `[data-skin="<key>"]` block in `deck-skins.css`, and — only if the surface is
 * a genuinely new kind — a branch in `components/deck/surfaces.tsx`.
 */

import type { DeckImage, DeckSkin, SurfaceSpec } from "./types";

export type { DeckSkin, SurfaceSpec };

/**
 * The house skin: the archive wall, the purple duotone, hard-edged incisions.
 *
 * Not a fallback and not a legacy option. This is She Sharp's own visual record
 * and it is what every organisational slide wears, in every deck, forever. A
 * deck that declares no skin of its own wears it throughout, which is the right
 * outcome for an event with no artwork yet.
 */
export const houseSkin: DeckSkin = {
  key: "house",
  name: "She Sharp House",
  description:
    "Twelve years of the archive used as mass, under the brand purple duotone.",
  surface: { kind: "archive" },
};

/**
 * Resolves the skin a given slide wears.
 *
 * `surface: "house"` is stamped by the boilerplate onto the organisational
 * slides. Everything else — every slide an event author writes — is the event's.
 */
export function skinForSlide(
  surface: "house" | "event" | undefined,
  eventSkin: DeckSkin | undefined,
): DeckSkin {
  if (surface === "house") return houseSkin;
  return eventSkin ?? houseSkin;
}

/**
 * Which plate a slide shows, and where it is panned to.
 *
 * Derived from the slide's own seed rather than its index, for the reason
 * `seedFrom()` exists at all: a layout is handed a slide and nothing else, and
 * the value has to survive server render and hydration identically.
 *
 * THE PAN TRAVELS ON `focus`, NOT ON A CSS VARIABLE. `DeckImage` writes
 * `object-position` as an INLINE style, defaulting to `50% 0%` — it crops from
 * the top because the archive is group photographs and the browser default
 * takes the tops off people's heads. An inline style beats any stylesheet, so a
 * `--plate-pos` custom property looked correct in the CSS and did nothing at
 * all: every band showed the top strip of the plate, which on these plates is
 * the empty near-black the poster prompt asked for. A black bar, from a rule
 * that compiled cleanly.
 *
 * The pan is deliberately small. A plate panned hard enough to look like a
 * different picture is a plate whose subject has left the frame, and the
 * subject is the only reason the plate was chosen. The vertical range stays in
 * the middle band, where the braid actually is.
 */
export function platePlacement(
  spec: Extract<SurfaceSpec, { kind: "plate" }>,
  seed: number,
): { image: DeckImage } {
  const base = spec.images[seed % spec.images.length];
  const x = 34 + ((seed >> 3) % 5) * 8; // 34%–66%
  const y = 40 + ((seed >> 5) % 4) * 7; // 40%–61%
  return { image: { ...base, focus: `${x}% ${y}%` } };
}
