import type { CSSProperties } from "react";

import type { SectionSlide } from "@/lib/deck/types";
import { buildMosaic } from "@/lib/deck/wall";

import { DeckSurface } from "@/components/deck/surfaces";
import {
  INCISION_5_ROWS,
  INCISION_5_ROWS_PAD,
  Kicker,
  knockoutStyle,
  seedFrom,
} from "./archive";

/**
 * A chapter card between blocks of an event — the wall at its most confident.
 *
 * Its job is to give the room a beat: people look up, the host changes footing,
 * and nobody is asked to read anything while the previous speaker walks off.
 * So the archive runs full bleed and the only cut into it is a translucent one,
 * stopping on a tile edge five rows down so the bottom row of the wall keeps
 * full strength. The panel is a window, not a lid.
 *
 * THE NUMERAL IS THE SLIDE. Two characters at `--dt-mega` is the one place the
 * photo knockout works without reservation — the counters are enormous, the
 * letterform survives whatever fragment lands inside it, and the chapter number
 * ends up literally made of the people the chapter is about. The title beside it
 * is solid ink for exactly the opposite reason: it is words.
 */
export function SectionSlideLayout({ slide }: { slide: SectionSlide }) {
  const seed = seedFrom(slide.id);

  /* The divider's own background is a single archive frame. Rather than lay it
     under a scrim as one more photograph nobody looks at, it becomes the fill of
     the numeral — the same asset doing a job only this deck can give it. */
  const knockoutSrc = slide.background?.src ?? buildMosaic(1, seed)[0];

  return (
    <>
      <DeckSurface slide={slide} seed={seed} />

      <div
        className="deck-incision deck-incision-sheer deck-edge-block-end"
        style={
          {
            insetInline: 0,
            insetBlockStart: "var(--deck-rail-h)",
            blockSize: INCISION_5_ROWS,
            "--incision-pad": "0px",
          } as CSSProperties
        }
        aria-hidden="true"
      />

      {/* The bottom padding is what keeps the composition off that last full
          strength row — without it the optical centring drops the subtitle onto
          a band of faces. */}
      <div className="deck-safe" style={{ paddingBlockEnd: INCISION_5_ROWS_PAD }}>
        <div
          className="deck-content flex flex-1 flex-col"
          style={{ gap: "var(--deck-gap-lg)" }}
        >
          <Kicker text={slide.eyebrow} />

          <div
            className="flex flex-wrap items-end"
            style={{ gap: "var(--deck-gap-xl)" }}
          >
            {slide.index && (
              <p
                className="deck-mega deck-knockout"
                style={knockoutStyle(knockoutSrc, seed)}
              >
                {slide.index}
              </p>
            )}

            <div
              className="flex min-w-0 flex-1 flex-col"
              style={{ gap: "var(--deck-gap-sm)" }}
            >
              <h2 className="deck-display">{slide.title}</h2>
              {slide.subtitle && (
                <p className="deck-subtitle deck-accent">
                  {slide.subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
