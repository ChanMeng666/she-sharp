import { DeckImage } from "@/components/deck/deck-image";
import type { LogosSlide } from "@/lib/deck/types";

import { Kicker } from "./archive";

/** Target chip width per group size, fed to `minmax()` in an auto-fit grid. */
const CHIP_WIDTH = { sm: 150, md: 210, lg: 280 } as const;

/** Chip height per group size, before the list-length scale is applied. */
const CHIP_HEIGHT = { sm: 80, md: 112, lg: 148 } as const;

/**
 * The sponsor wall — the slide that pays for the venue.
 *
 * Left up during registration and shown again when the host thanks partners by
 * name, so every mark has to be legible without being cropped. Marks sit on
 * white chips rather than being colour-filtered: sponsor artwork is a mix of
 * dark and light SVGs, and a filter mangles the multi-colour ones.
 *
 * THE FORTY-SEVEN-MARK CASE IS THE REAL ONE. Nine current partners and
 * thirty-eight supporters since 2014 is what this deck actually carries. At full
 * chip size that is five rows of small marks plus two of large ones on a 4:3
 * projector — about 90px past the bottom edge. So the chip shrinks with the
 * length of the list rather than the stage: an `auto-fit` grid then finds ten
 * columns at 4:3 and thirteen at 16:9 on its own, and the wall lands inside 1080
 * at every stage width without a single breakpoint.
 *
 * No archive band here. This slide is already a wall of marks, and a second
 * full-bleed strip under it would be one texture too many — the sponsor logos
 * are doing the band's compositional job.
 */
export function LogosSlideLayout({ slide }: { slide: LogosSlide }) {
  const total = slide.groups.reduce((sum, group) => sum + group.logos.length, 0);
  const scale = total > 30 ? 0.72 : total > 18 ? 0.86 : 1;

  return (
    <div className="deck-safe">
      <div
        className="deck-content flex flex-1 flex-col"
        style={{ gap: "var(--deck-gap-md)" }}
      >
        <div className="flex flex-col" style={{ gap: "var(--deck-gap-xs)" }}>
          <Kicker text={slide.eyebrow} />
          <h2 className="deck-title">{slide.title}</h2>
          {slide.lead && <p className="deck-lead">{slide.lead}</p>}
        </div>

        <div className="flex flex-col" style={{ gap: "var(--deck-gap-md)" }}>
          {slide.groups.map((group, index) => {
            const size = group.size ?? "md";
            return (
              <div
                key={group.label ?? index}
                className="flex flex-col"
                style={{ gap: "var(--deck-gap-sm)" }}
              >
                {group.label && (
                  <div className="flex flex-col" style={{ gap: "var(--deck-gap-xs)" }}>
                    <p className="deck-label deck-accent">{group.label}</p>
                    <hr className="deck-rule" />
                  </div>
                )}

                <ul
                  className="grid"
                  style={{
                    gridTemplateColumns: `repeat(auto-fit, minmax(${Math.round(
                      CHIP_WIDTH[size] * scale,
                    )}px, 1fr))`,
                    gap: 12,
                  }}
                >
                  {group.logos.map((logo) => (
                    <li
                      key={logo.name}
                      className="deck-logo-chip"
                      style={{ blockSize: Math.round(CHIP_HEIGHT[size] * scale) }}
                    >
                      <DeckImage
                        image={{ src: logo.logo, alt: logo.name }}
                        fit="contain"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
