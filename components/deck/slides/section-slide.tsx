import { DeckImage } from "@/components/deck/deck-image";
import type { SectionSlide } from "@/lib/deck/types";

/**
 * A chapter card between blocks of an event.
 *
 * Deliberately almost empty. Its job is to give the room a beat — people look
 * up, the host changes footing, and nobody is asked to read anything while the
 * previous speaker walks off stage. The giant outlined index is the only thing
 * carrying position in the running order.
 */
export function SectionSlideLayout({ slide }: { slide: SectionSlide }) {
  /* A background photograph brings a dark scrim with it, so the text stops
     following the tone tokens and uses the dark-canvas pair instead — the light
     tone's brand purple is 2.92:1 against that scrim. */
  const overPhoto = Boolean(slide.background);
  const ink = overPhoto ? "var(--deck-canvas-light)" : undefined;
  const accent = overPhoto ? "var(--deck-accent-dark)" : "var(--slide-accent)";

  return (
    <>
      {slide.background ? (
        <>
          <DeckImage image={slide.background} className="deck-bleed" />
          <div className="deck-scrim" aria-hidden="true" />
        </>
      ) : (
        <div className="deck-burst" aria-hidden="true" />
      )}

      <div className="deck-safe">
        <div
          className="deck-content flex min-h-0 flex-1 flex-col justify-center"
          style={{ gap: "var(--deck-gap-md)", color: ink }}
        >
          {slide.index && (
            <p
              className="deck-stat deck-outline"
              style={{ color: accent, fontSize: "calc(var(--dt-stat) * 1.7)" }}
            >
              {slide.index}
            </p>
          )}

          {slide.eyebrow && (
            <p className="deck-eyebrow" style={{ color: accent }}>
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
