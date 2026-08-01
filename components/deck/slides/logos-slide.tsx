import { DeckImage } from "@/components/deck/deck-image";
import type { LogosSlide } from "@/lib/deck/types";

/** Target chip width per group size, fed to `minmax()` in an auto-fit grid. */
const CHIP_WIDTH = { sm: 170, md: 230, lg: 310 } as const;

/** Chip height per group size, before the crowd-size scale is applied. */
const CHIP_HEIGHT = { sm: 96, md: 128, lg: 168 } as const;

/**
 * The sponsor wall — the slide that pays for the venue.
 *
 * Left up during registration and shown again when the host thanks partners by
 * name, so every mark has to be legible without being cropped. Marks sit on a
 * white chip rather than being colour-filtered: sponsor SVGs are a mix of dark
 * and light artwork, and filtering mangles the multi-colour ones.
 */
export function LogosSlideLayout({ slide }: { slide: LogosSlide }) {
  const total = slide.groups.reduce((sum, group) => sum + group.logos.length, 0);

  /* Thirty-eight marks in one group is a real sponsor list, not a hypothetical.
     Shrinking the chip is what keeps the last row on the stage. */
  const scale = total > 30 ? 0.7 : total > 18 ? 0.85 : 1;

  return (
    <div className="deck-safe">
      <div
        className="deck-content flex flex-1 flex-col"
        style={{ gap: "var(--deck-gap-lg)" }}
      >
        <div className="flex flex-col" style={{ gap: "var(--deck-gap-xs)" }}>
          {slide.eyebrow && <p className="deck-kicker">{slide.eyebrow}</p>}
          <h2 className="deck-title">{slide.title}</h2>
          {slide.lead && <p className="deck-lead">{slide.lead}</p>}
        </div>

        <div
          className="flex flex-col"
          style={{ gap: "var(--deck-gap-lg)" }}
        >
          {slide.groups.map((group, index) => {
            const size = group.size ?? "md";
            return (
              <div
                key={group.label ?? index}
                className="flex flex-col"
                style={{ gap: "var(--deck-gap-sm)" }}
              >
                {group.label && <p className="deck-label">{group.label}</p>}

                <ul
                  className="grid"
                  style={{
                    gridTemplateColumns: `repeat(auto-fit, minmax(${Math.round(
                      CHIP_WIDTH[size] * scale,
                    )}px, 1fr))`,
                    gap: "var(--deck-gap-sm)",
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
