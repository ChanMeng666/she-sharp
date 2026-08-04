import { DeckImage } from "@/components/deck/deck-image";
import type { PhotoGridSlide } from "@/lib/deck/types";

import { Kicker } from "./archive";

/**
 * Column templates per image count. Fractional units on purpose: the mosaic
 * keeps its proportions from a 1440px projector to a 2520px LED wall, and the
 * dominant image simply gets more of the extra width.
 */
const TEMPLATE: Record<number, string> = {
  3: "1.6fr 1fr",
  4: "1.5fr 1fr 1fr",
  5: "1.6fr 1fr 1fr",
};

/** Explicit placement so the composition is asymmetric rather than a contact sheet. */
const PLACEMENT: Record<number, { gridColumn: string; gridRow: string }[]> = {
  3: [
    { gridColumn: "1 / 2", gridRow: "1 / 3" },
    { gridColumn: "2 / 3", gridRow: "1 / 2" },
    { gridColumn: "2 / 3", gridRow: "2 / 3" },
  ],
  4: [
    { gridColumn: "1 / 2", gridRow: "1 / 3" },
    { gridColumn: "2 / 3", gridRow: "1 / 2" },
    { gridColumn: "3 / 4", gridRow: "1 / 2" },
    { gridColumn: "2 / 4", gridRow: "2 / 3" },
  ],
  5: [
    { gridColumn: "1 / 2", gridRow: "1 / 3" },
    { gridColumn: "2 / 3", gridRow: "1 / 2" },
    { gridColumn: "3 / 4", gridRow: "1 / 2" },
    { gridColumn: "2 / 3", gridRow: "2 / 3" },
    { gridColumn: "3 / 4", gridRow: "2 / 3" },
  ],
};

/**
 * The "what this actually looks like" slide — three to five photographs from a
 * previous event, arranged as an editorial mosaic rather than a contact sheet.
 *
 * This is the archive used as MASS, so the duotone is mandatory and applies to
 * every cell including the dominant one. That is the difference between this
 * slide and `photo`: there a single frame is the subject and keeps its colour,
 * here five frames are one texture, and five untreated shots spanning four stops
 * of white balance would read as five different decks stapled together.
 *
 * The mosaic is bled into the safe area's full remaining height and the grid
 * gap is the wall's own 4px grout, so the block reads as a piece of the wall
 * lifted into the page rather than as a gallery of pictures.
 */
export function PhotoGridSlideLayout({ slide }: { slide: PhotoGridSlide }) {
  const count = slide.images.length;
  const placement = PLACEMENT[count];
  const template = TEMPLATE[count];

  return (
    /* A grid rather than the inherited flex column, and it is load-bearing.
       `fr` row tracks only resolve against a definite block size, and a flex
       item's grown height does not count as one — so inside a flex column the
       mosaic's own `minmax(0, 1fr)` rows fell back to max-content, each cell
       claimed its 16:10 default ratio, and the block ran about 270px past the
       stage while looking perfectly composed. An explicit `minmax(0, 1fr)`
       track here is definite, which makes the nested one definite too. */
    <div
      className="deck-safe"
      style={{ display: "grid", gridTemplateRows: "auto minmax(0, 1fr)" }}
    >
      <div className="flex flex-col" style={{ gap: "var(--deck-gap-xs)" }}>
        <Kicker text={slide.eyebrow} />
        <h2 className="deck-title">{slide.title}</h2>
        {slide.lead && <p className="deck-lead">{slide.lead}</p>}
      </div>

      {/* The mosaic is taken out of flow and pinned to this track.

          An absolutely positioned box with `inset: 0` has a definite block
          size, and that is the only reliable way to get one here: a grid or
          flex item's stretched height is not treated as definite when the
          browser resolves the `fr` rows *inside* it, so the mosaic sized its
          own rows to max-content, each cell claimed its 16:10 default ratio,
          and the composition ran ~270px past the bottom of the stage while
          looking entirely correct. */}
      <div
        style={{
          position: "relative",
          minBlockSize: 0,
          marginBlockStart: "var(--deck-gap-md)",
        }}
      >
        {/* `.deck-duotone .deck-slot` already supplies the shadow colour as
            each cell's immediate backdrop, so no `.deck-duotone-cell` is
            needed here.

            A placed cell drops `.deck-slot`'s default 16:10 ratio and fills its
            track instead. The ratio is not "ignored because both axes are
            definite" — it wins, and it is what made the second row 585px tall
            in a 313px track. It still applies on the defensive fallback path
            below, where it gives uniform tiles instead of a ragged row. */}
        <div
          className="deck-duotone grid"
          style={{
            position: "absolute",
            inset: 0,
            gap: "var(--deck-wall-gap)",
            gridTemplateColumns: template ?? "repeat(auto-fit, minmax(360px, 1fr))",
            gridTemplateRows: placement ? "minmax(0, 1fr) minmax(0, 1fr)" : "auto",
          }}
        >
          {slide.images.map((image, index) => (
            <div
              key={image.src}
              className="deck-slot"
              style={
                placement
                  ? { ...placement[index], aspectRatio: "auto", blockSize: "100%" }
                  : undefined
              }
            >
              <DeckImage image={image} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
