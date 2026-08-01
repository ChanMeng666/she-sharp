import { DeckStage } from "./deck-stage";
import { SlideFrame } from "./slide-frame";
import { SlideRenderer } from "./slide-renderer";
import type { Deck } from "@/lib/deck/types";
import { slideLabel } from "@/lib/deck/utils";

/**
 * Print width of the stage, in design px.
 *
 * Hard-coded rather than imported from `deck-stage.tsx`: that module is
 * `"use client"`, and a plain constant pulled from a client module into a
 * server component arrives as a client reference, not a number. `deck.css`
 * pairs this width with a flat `scale(0.5)` into a 960x540 page, so the PDF
 * needs no measurement and no client JavaScript — which is the point: this is
 * the copy that still works when the laptop does not.
 */
const PRINT_STAGE_W = 1920;

export interface DeckPrintProps {
  deck: Deck;
}

/**
 * The paper backup, reached at `/present/<deck>?print=1`.
 *
 * Renders every slide at full fidelity, one per page, each followed by its host
 * note. `slide.note` appears here and nowhere else — it is what the person
 * holding the microphone reads, so it must never reach the projector.
 *
 * A server component on purpose. No viewport, no keyboard, no wake lock: the
 * page has to survive being opened on a borrowed machine with the venue wifi
 * already gone.
 */
export function DeckPrint({ deck }: DeckPrintProps) {
  const total = deck.slides.length;

  return (
    <div className="deck-print">
      <div className="deck-print-toolbar mx-auto mb-6 max-w-[960px] rounded-xl border border-[#d9d8ea] bg-white px-5 py-4 text-[13px] leading-relaxed text-[#33325c]">
        <p className="font-semibold">
          {deck.title} — {total} slides
        </p>
        <p className="mt-1">
          Press <strong>Ctrl/Cmd&nbsp;+&nbsp;P</strong>, choose{" "}
          <strong>Save as PDF</strong>, and tick{" "}
          <strong>Background graphics</strong>. Without that last one every slide
          prints white.
        </p>
        <p className="mt-1 text-[#5a5880]">
          Host notes print under each slide on screen and are hidden in the PDF.
        </p>
      </div>

      {deck.slides.map((slide, index) => (
        <div key={slide.id}>
          <div className="deck-page">
            <DeckStage
              deck={deck}
              stageWidth={PRINT_STAGE_W}
              scale={1}
              motion={false}
            >
              <SlideFrame slide={slide} index={index} total={total} active>
                <SlideRenderer slide={slide} />
              </SlideFrame>
            </DeckStage>
          </div>

          <div className="deck-page-note">
            <p>
              <strong>
                {index + 1} / {total} — {slideLabel(slide)}
              </strong>
              {slide.optional ? " (optional)" : ""}
            </p>
            <p>{slide.note}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
