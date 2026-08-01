import { DeckImage } from "@/components/deck/deck-image";
import type { PhotoGridSlide } from "@/lib/deck/types";

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
 * previous event, arranged as an editorial mosaic rather than a uniform grid.
 *
 * Runs while the host describes the day, or on a loop before doors open. One
 * dominant image anchors the composition so the eye has somewhere to land;
 * beyond five pictures it stops reading as a composition and the linter says so.
 */
export function PhotoGridSlideLayout({ slide }: { slide: PhotoGridSlide }) {
  const count = slide.images.length;
  const placement = PLACEMENT[count];
  const template = TEMPLATE[count];

  return (
    <div className="deck-safe">
      <div className="flex flex-col" style={{ gap: "var(--deck-gap-xs)" }}>
        {slide.eyebrow && <p className="deck-kicker">{slide.eyebrow}</p>}
        <h2 className="deck-title">{slide.title}</h2>
        {slide.lead && <p className="deck-lead">{slide.lead}</p>}
      </div>

      {/* Archive photography used en masse, so the duotone ramp is mandatory —
          it is what makes twelve years of fluorescent-lit meeting rooms read as
          one deck. `.deck-duotone .deck-slot` already supplies the shadow colour
          as each cell's immediate backdrop, so no `.deck-duotone-cell` here.

          The cells are `.deck-slot` without a ratio modifier on purpose: in the
          3-5 image compositions below both grid axes are definite, so a slot
          ratio would be ignored anyway, and the mosaic's own proportions are the
          composition. The ratio does take effect on the defensive fallback path,
          where it gives uniform tiles instead of a ragged row. */}
      <div
        className="deck-duotone grid min-h-0 flex-1"
        style={{
          marginBlockStart: "var(--deck-gap-md)",
          gap: "var(--deck-wall-gap)",
          gridTemplateColumns: template ?? "repeat(auto-fit, minmax(360px, 1fr))",
          gridTemplateRows: placement ? "minmax(0, 1fr) minmax(0, 1fr)" : "auto",
        }}
      >
        {slide.images.map((image, index) => (
          <div key={image.src} className="deck-slot" style={placement?.[index]}>
            <DeckImage image={image} />
          </div>
        ))}
      </div>
    </div>
  );
}
