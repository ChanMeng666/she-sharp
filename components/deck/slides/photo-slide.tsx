import { DeckImage } from "@/components/deck/deck-image";
import type { PhotoSlide } from "@/lib/deck/types";

/**
 * The emotional beat: one photograph, edge to edge, with at most a line over it.
 *
 * Placed where the deck would otherwise stack a third list — after the welcome,
 * before the judging, at the moment the host says "this is what last year looked
 * like". Because a photograph is what the wide stages are for, the image fills
 * the whole stage rather than a safe-area box: a 21:9 wall gets more picture,
 * not black bars.
 *
 * This is a single subject photograph, never archive texture, so it takes the
 * plate register: full colour, no duotone, no tiles.
 *
 * Text over it always uses the light ink and the mint kicker rather than the
 * tone tokens — the overlays are dark on both tones, and navy on a dark scrim is
 * invisible.
 */
export function PhotoSlideLayout({ slide }: { slide: PhotoSlide }) {
  const overlay = slide.overlay ?? "gradient";
  const hasCopy = Boolean(slide.title || slide.lead || slide.eyebrow);

  return (
    <>
      <div className="deck-plate deck-full-colour">
        <DeckImage image={slide.image} priority />
      </div>

      {overlay === "scrim" && <div className="deck-scrim" aria-hidden="true" />}
      {overlay === "gradient" && <div className="deck-gradient" aria-hidden="true" />}

      {hasCopy && (
        <div className="deck-safe justify-end">
          <div
            className="deck-content flex flex-col"
            style={{ gap: "var(--deck-gap-sm)", color: "var(--deck-canvas-light)" }}
          >
            {slide.eyebrow && (
              /* Mint, which is what the kicker is set in on dark grounds. A
                 photo slide defaults to the light tone, whose `--slide-kicker`
                 is brand purple — 2.92:1 against the scrim and unreadable. */
              <p className="deck-kicker" style={{ color: "var(--deck-mint)" }}>
                {slide.eyebrow}
              </p>
            )}

            {slide.title && <h2 className="deck-title">{slide.title}</h2>}

            {slide.lead && (
              <p
                className="deck-lead"
                style={{
                  color:
                    "color-mix(in srgb, var(--deck-canvas-light) 82%, transparent)",
                }}
              >
                {slide.lead}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
