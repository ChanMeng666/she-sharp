import { DeckImage } from "@/components/deck/deck-image";
import type { SectionSlide } from "@/lib/deck/types";

/**
 * A chapter card between blocks of an event.
 *
 * Deliberately almost empty. Its job is to give the room a beat — people look
 * up, the host changes footing, and nobody is asked to read anything while the
 * previous speaker walks off stage. The chapter number carries the whole slide,
 * set in `.deck-mega`, which is the one voice in the deck reserved for it.
 *
 * A background here is a single subject photograph rather than archive texture,
 * so it takes the plate register — full colour, no duotone — under a scrim.
 */
export function SectionSlideLayout({ slide }: { slide: SectionSlide }) {
  /* A background brings a dark scrim with it, so the copy stops following the
     tone tokens and uses the dark-canvas pair — the light tone's kicker and
     accent are the brand purple, 2.92:1 against that scrim. */
  const overPhoto = Boolean(slide.background);
  const ink = overPhoto ? "var(--deck-canvas-light)" : undefined;
  const accent = overPhoto ? "var(--deck-accent-dark)" : undefined;

  return (
    <>
      {slide.background && (
        <>
          <div className="deck-plate deck-full-colour">
            <DeckImage image={slide.background} />
          </div>
          <div className="deck-scrim" aria-hidden="true" />
        </>
      )}

      <div className="deck-safe">
        <div
          className="deck-content flex flex-1 flex-col"
          style={{ gap: "var(--deck-gap-md)", color: ink }}
        >
          {slide.index && (
            <p
              className="deck-mega deck-outline"
              style={{ color: accent ?? "var(--slide-accent)" }}
            >
              {slide.index}
            </p>
          )}

          {slide.eyebrow && (
            <p className="deck-kicker" style={{ color: accent }}>
              {slide.eyebrow}
            </p>
          )}

          <h2 className="deck-display">{slide.title}</h2>

          {slide.subtitle && (
            <p
              className="deck-lead"
              style={
                overPhoto
                  ? {
                      color:
                        "color-mix(in srgb, var(--deck-canvas-light) 82%, transparent)",
                    }
                  : undefined
              }
            >
              {slide.subtitle}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
