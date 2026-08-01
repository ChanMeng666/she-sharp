import { DeckImage } from "@/components/deck/deck-image";
import type { KarakiaSlide } from "@/lib/deck/types";

import { Kicker } from "./archive";

/** Kicker shown when the deck author has not supplied their own eyebrow. */
const VARIANT_LABEL: Record<KarakiaSlide["variant"], string> = {
  timatanga: "Karakia tīmatanga",
  whakamutunga: "Karakia whakamutunga",
};

/**
 * The karakia that opens and closes a She Sharp event — and the one slide in the
 * deck with no wall on it.
 *
 * Everywhere else the archive is the ground, because everywhere else something
 * is being offered: an event, an organisation, a set of numbers, a prize. Here
 * nothing is. So the tiles, the incisions, the accent hairlines and the duotone
 * are all gone and what is left is one full-colour whenua plate and the words.
 * That absence is the point: it is the only real stillness in thirty-eight
 * slides, and it is what lets the rest of the deck be as loud as it is.
 *
 * Te reo leads at subtitle scale, the English follows directly beneath each line
 * in the same measure — set as a translation, not as a caption in a second
 * column, so a room reading along never has to track across the stage. The final
 * line takes the kicker colour, which is where the reading stops.
 */
export function KarakiaSlideLayout({ slide }: { slide: KarakiaSlide }) {
  const kicker = slide.eyebrow ?? VARIANT_LABEL[slide.variant];
  const overPlate = Boolean(slide.background);

  const lines = slide.teReo.map((teReo, index) => ({
    teReo,
    english: slide.english[index],
  }));

  return (
    <>
      {slide.background && (
        <>
          {/* Deliberately outside any `.deck-duotone`: this photograph is being
              looked at, not used as texture, and the grade would flatten it into
              the same purple the wall slides are made of. */}
          <div className="deck-plate deck-full-colour">
            <DeckImage image={slide.background} priority />
          </div>
          {/* Empties the leading side enough to take type without touching the
              far side of the frame, where every committed plate keeps its
              subject. A flat scrim would darken the whole photograph instead. */}
          <div className="deck-gradient" aria-hidden="true" />
        </>
      )}

      <div className="deck-safe">
        <div
          className="deck-content flex flex-1 flex-col"
          style={{
            gap: "var(--deck-gap-lg)",
            /* Anchored to the leading edge rather than centred: the gradient
               clears that side, and a centred column would drift onto the
               plate's subject as the stage widens toward 21:9. */
            marginInline: 0,
            maxInlineSize: "min(1120px, 60%)",
            /* Over a plate the copy leaves the tone tokens — a light-tone
               karakia would otherwise set navy te reo on a dark sea. */
            color: overPlate ? "var(--deck-canvas-light)" : undefined,
          }}
        >
          <div className="flex flex-col" style={{ gap: "var(--deck-gap-md)" }}>
            <Kicker text={kicker} />
            <h2 className="deck-title">{slide.title}</h2>
          </div>

          <div className="flex flex-col" style={{ gap: "var(--deck-gap-sm)" }}>
            {lines.map((line, index) => (
              <div key={`${index}-${line.teReo}`}>
                <p
                  className="deck-subtitle"
                  lang="mi"
                  style={
                    index === lines.length - 1
                      ? { color: "var(--slide-kicker)" }
                      : undefined
                  }
                >
                  {line.teReo}
                </p>
                {line.english && (
                  <p
                    className="deck-body"
                    style={{
                      marginBlockStart: 4,
                      color: overPlate
                        ? "color-mix(in srgb, var(--deck-canvas-light) 76%, transparent)"
                        : "var(--slide-ink-soft)",
                    }}
                  >
                    {line.english}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
