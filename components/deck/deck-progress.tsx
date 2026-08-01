import type { CSSProperties } from "react";

import type { SlideTone } from "@/lib/deck/types";

/**
 * Tone variables mirrored from `.deck-slide[data-tone=…]` in `deck.css`.
 *
 * The progress bar lives beside the slides rather than inside one, so it sits
 * outside the selector that declares these. Rather than give the chrome its own
 * palette (which would drift from the slides on a custom-accent deck), it
 * re-declares the same three variables for whichever tone is on screen.
 */
const TONE_VARS: Record<SlideTone, CSSProperties> = {
  light: {
    "--slide-accent": "var(--deck-accent-light)",
    "--slide-hairline": "#e7e6f2",
    "--slide-ink-soft": "#5a5880",
  } as CSSProperties,
  dark: {
    "--slide-accent": "var(--deck-accent-dark)",
    "--slide-hairline": "rgb(255 255 255 / 0.18)",
    "--slide-ink-soft": "rgb(255 255 255 / 0.74)",
  } as CSSProperties,
};

export interface DeckProgressProps {
  /** Zero-based index of the slide on screen. */
  index: number;
  total: number;
  /** Tone of the current slide, so the bar reads on both canvases. */
  tone: SlideTone;
}

/**
 * Position bar and slide counter.
 *
 * Rendered inside the stage on purpose: the stage is transform-scaled, so
 * chrome placed in it keeps the same visual weight on a 4:3 projector and a
 * 21:9 wall. Chrome placed in the viewport would not.
 *
 * The counter is `aria-hidden` because the live region in `DeckViewport`
 * already announces "Slide 12 of 35" — hearing it twice is worse than not at
 * all.
 */
export function DeckProgress({ index, total, tone }: DeckProgressProps) {
  const percent = total > 0 ? ((index + 1) / total) * 100 : 0;
  const vars = TONE_VARS[tone];

  return (
    <>
      <div
        className="deck-chrome deck-progress-track"
        data-autohide="true"
        style={vars}
        role="presentation"
      >
        <div className="deck-progress-fill" style={{ inlineSize: `${percent}%` }} />
      </div>

      <div
        className="deck-chrome deck-counter"
        data-autohide="true"
        aria-hidden="true"
        style={{ ...vars, insetInlineEnd: 40, insetBlockEnd: 28 }}
      >
        {index + 1} / {total}
      </div>
    </>
  );
}
