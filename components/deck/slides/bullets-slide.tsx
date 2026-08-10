import { DeckImage } from "@/components/deck/deck-image";
import type { BulletsSlide } from "@/lib/deck/types";
import { cn } from "@/lib/utils";

import { DeckSurfaceBand } from "@/components/deck/surfaces";
import { BAND_PAD, Kicker, SponsorMark, seedFrom } from "./archive";

/**
 * The marker on the leading edge of a bullet.
 *
 * Three flavours because the three jobs are different: a checklist is a set of
 * things the audience must do, a numbered list is an order they must follow, and
 * a plain list is neither. All three are drawn in the same 1px-and-accent
 * vocabulary the rest of the deck uses — no discs, no icons with fills.
 */
function BulletMarker({ variant, index }: { variant: string; index: number }) {
  if (variant === "checklist") {
    return (
      <svg
        width={38}
        height={38}
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--slide-accent)"
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ flex: "0 0 38px", marginBlockStart: 2 }}
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    );
  }

  if (variant === "numbered") {
    return (
      <span
        aria-hidden="true"
        className="deck-label deck-accent deck-tabular"
        style={{ flex: "0 0 48px", marginBlockStart: 8 }}
      >
        {String(index + 1).padStart(2, "0")}
      </span>
    );
  }

  /* A 1px accent rule, not a bar or a disc. The same hairline does the
     compositional work everywhere else in the deck. */
  return (
    <span
      aria-hidden="true"
      className="deck-rule deck-rule-accent"
      style={{ flex: "0 0 44px", marginBlockStart: "var(--deck-gap-sm)" }}
    />
  );
}

/**
 * The workhorse content slide: a claim and up to five short supports.
 *
 * COMPOSITION. On paper the wall survives as a single full-bleed band across the
 * foot — the same photographs, the same grade, one row deep — which is what
 * keeps an information slide in the same deck as the title. The safe area
 * reserves its height, so no line of type ever lands on a face.
 *
 * The bullets are hairline rows rather than a bulleted list: at 38px on a
 * projector the ruled row is what makes five supports scan as five, and it is
 * the same rhythm as the run sheet two slides later.
 */
export function BulletsSlideLayout({ slide }: { slide: BulletsSlide }) {
  const variant = slide.variant ?? "plain";
  const seed = seedFrom(slide.id);

  /* Two columns halve the row count, so they are only worth it when there are
     enough rows to halve and no photograph competing for the width. `auto-fit`
     rather than a breakpoint: a 4:3 projector cannot hold two 560px columns and
     collapses to one on its own. */
  const twoColumns = slide.columns === 2 && slide.items.length >= 4 && !slide.image;

  return (
    <>
      <DeckSurfaceBand slide={slide} seed={seed} />

      <div className="deck-safe" style={{ paddingBlockEnd: BAND_PAD }}>
        <div
          className="deck-content flex flex-1 flex-col"
          style={{ gap: "var(--deck-gap-lg)" }}
        >
          <div
            className="flex items-start"
            style={{ gap: "var(--deck-gap-lg)" }}
          >
            <div
              className="flex flex-1 flex-col"
              style={{ gap: "var(--deck-gap-xs)", minInlineSize: 0 }}
            >
              <Kicker text={slide.eyebrow} />
              <h2 className="deck-title">{slide.title}</h2>
              {slide.lead && (
                <p className="deck-lead">{slide.lead}</p>
              )}
            </div>
            {slide.logo && <SponsorMark logo={slide.logo} />}
          </div>

          <div className="flex items-start" style={{ gap: "var(--deck-gap-xl)" }}>
            <ul
              className={cn("grid flex-1")}
              style={{
                gridTemplateColumns: twoColumns
                  ? "repeat(auto-fit, minmax(560px, 1fr))"
                  : "minmax(0, 1fr)",
                columnGap: "var(--deck-gap-xl)",
                borderBlockStart: "1px solid var(--slide-hairline)",
              }}
            >
              {slide.items.map((item, index) => (
                <li
                  key={item}
                  className={cn(
                    "flex items-start",
                  )}
                  style={{
                    gap: "var(--deck-gap-sm)",
                    paddingBlock: "var(--deck-gap-sm)",
                    borderBlockEnd: "1px solid var(--slide-hairline)",
                  }}
                >
                  <BulletMarker variant={variant} index={index} />
                  <span className="deck-bullet">{item}</span>
                </li>
              ))}
            </ul>

            {slide.image && (
              /* One supporting photograph, so it keeps its colour — the duotone
                 is for photographs used as mass. Dropped on narrow stages so the
                 text keeps its measure rather than being squeezed into a column
                 nobody can read from row ten. */
              <div
                className="deck-frame deck-full-colour deck-slot deck-slot-3x2 @max-[1600px]/deck:hidden"
                style={{ flex: "0 0 34%" }}
              >
                <DeckImage image={slide.image} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
