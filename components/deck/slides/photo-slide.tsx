import { DeckImage } from "@/components/deck/deck-image";
import type { PhotoSlide } from "@/lib/deck/types";

/**
 * The emotional beat: one photograph, edge to edge, in full colour.
 *
 * THIS IS THE OPT-OUT, AND IT IS THE POINT OF THE OPT-OUT. Every other
 * photograph in this deck is graded into the purple duotone, because en masse
 * the archive is texture and evidence and has to read as one thing. Here a
 * single frame is being looked at rather than counted, and that is where the
 * warmth of twelve years of this actually lives — four women mid-laugh, in the
 * light the room really had. Grading this one would cost the deck the only
 * moment it has of people rather than of scale.
 *
 * The image fills the whole stage rather than a safe-area box, so a 21:9 wall
 * gets more picture instead of black bars. The copy sits low on the leading
 * edge, inside the part of the frame `.deck-gradient` empties, over a 1px accent
 * rule — the same rule that opens a panel everywhere else in the deck.
 *
 * Text over a photograph always uses the light ink and the mint kicker rather
 * than the tone tokens: the overlays are dark on both tones, and navy on a dark
 * scrim is invisible.
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
      {overlay === "gradient" && (
        <div className="deck-gradient" aria-hidden="true" />
      )}

      {hasCopy && (
        <div className="deck-safe justify-end">
          <div
            className="deck-content flex flex-col"
            style={{
              gap: "var(--deck-gap-md)",
              marginInline: 0,
              /* Held inside the emptied side of the gradient. Letting a caption
                 run the full width of a 21:9 stage would put the last words of
                 it across the face the photograph was chosen for. */
              maxInlineSize: "min(1180px, 62%)",
              color: "var(--deck-canvas-light)",
            }}
          >
            {slide.eyebrow && (
              /* Mint, which is what the kicker is set in on dark grounds. A photo
                 slide defaults to the light tone, whose `--slide-kicker` is brand
                 purple — 2.92:1 against the scrim, and unreadable. */
              <p
                className="deck-kicker"
                style={{ color: "var(--deck-mint)" }}
              >
                {slide.eyebrow}
              </p>
            )}

            {slide.title && (
              <div className="flex flex-col" style={{ gap: "var(--deck-gap-sm)" }}>
                <hr className="deck-rule deck-rule-accent" />
                <h2 className="deck-title">{slide.title}</h2>
              </div>
            )}

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
