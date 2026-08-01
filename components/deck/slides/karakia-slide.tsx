import { DeckImage } from "@/components/deck/deck-image";
import type { KarakiaSlide } from "@/lib/deck/types";

/** Kicker shown when the deck author has not supplied their own eyebrow. */
const VARIANT_LABEL: Record<KarakiaSlide["variant"], string> = {
  timatanga: "Karakia tīmatanga",
  whakamutunga: "Karakia whakamutunga",
};

/**
 * The karakia that opens and closes a She Sharp event.
 *
 * This is a moment of ceremony, not a content slide: the te reo Māori sits at
 * full ink in the reading voice, the English translation sits quietly beside it
 * for people who need it, and any background photograph is pushed almost to
 * nothing so the words carry the slide. Nobody presents from this slide — it is
 * on screen so the room can say it together.
 */
export function KarakiaSlideLayout({ slide }: { slide: KarakiaSlide }) {
  const kicker = slide.eyebrow ?? VARIANT_LABEL[slide.variant];

  return (
    <>
      {slide.background && (
        /* A wash in the slide's own background colour rather than the shared
           dark scrim: this keeps the tone tokens correct, so the words stay in
           the reading voice on both a white and a near-black canvas, and the
           photograph stays atmosphere rather than becoming the subject. */
        <>
          <DeckImage image={slide.background} className="deck-bleed" />
          <div
            className="deck-bleed"
            aria-hidden="true"
            style={{ zIndex: 1, background: "var(--slide-bg)", opacity: 0.84 }}
          />
        </>
      )}

      <div className="deck-safe">
        <div
          className="deck-content flex min-h-0 flex-1 flex-col justify-center"
          style={{ gap: "var(--deck-gap-lg)" }}
        >
          <div className="flex flex-col" style={{ gap: "var(--deck-gap-xs)" }}>
            <p className="deck-eyebrow">{kicker}</p>
            <h2 className="deck-title">{slide.title}</h2>
          </div>

          <div
            className="grid grid-cols-[1.05fr_0.95fr] @max-[1560px]/deck:grid-cols-1"
            style={{ gap: "var(--deck-gap-xl)" }}
          >
            <div className="flex flex-col" style={{ gap: 14 }}>
              {slide.teReo.map((line, index) => (
                <p
                  key={`${index}-${line}`}
                  className="deck-quote"
                  style={{ lineHeight: 1.42 }}
                >
                  {line}
                </p>
              ))}
            </div>

            <div className="flex flex-col" style={{ gap: 12 }}>
              {slide.english.map((line, index) => (
                <p
                  key={`${index}-${line}`}
                  className="deck-body deck-muted"
                  style={{ lineHeight: 1.42 }}
                >
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
