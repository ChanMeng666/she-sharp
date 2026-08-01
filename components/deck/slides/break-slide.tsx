"use client";

import { DeckImage } from "@/components/deck/deck-image";
import { formatCountdown, useDeckControls } from "@/components/deck/deck-controls";
import type { BreakSlide } from "@/lib/deck/types";

/**
 * The break clock — the biggest type in the whole deck.
 *
 * It exists so a host never has to shout "five more minutes" across a room of
 * people eating pizza, and so nobody has to trust a wristwatch to bring a
 * hundred people back at the same time. The countdown is owned by the viewport,
 * not by this slide: Space is "next slide" everywhere else and "start / pause"
 * here, so exactly one component listens for it.
 *
 * Time remaining reads as a 1px rule that empties from the trailing edge rather
 * than as a circular gauge. At `--dt-stat` (224px) a five-character clock is
 * over 600px wide, so a ring around it would not fit the stage — and a rule is
 * the language this deck already speaks.
 *
 * With no viewport (print mode) the same slide degrades to the planned length,
 * which is all a paper run sheet needs.
 */
export function BreakSlideLayout({ slide }: { slide: BreakSlide }) {
  const controls = useDeckControls();
  const total = Math.max(1, slide.minutes * 60);
  const live = controls !== null;
  const remaining = controls?.timerRemaining ?? total;
  const progress = live ? Math.max(0, Math.min(1, remaining / total)) : 1;

  /* A background brings a dark scrim with it, so the copy leaves the tone
     tokens and uses the dark-canvas pair, which is legible on both. */
  const overPhoto = Boolean(slide.background);
  const ink = overPhoto ? "var(--deck-canvas-light)" : undefined;
  const accent = overPhoto ? "var(--deck-accent-dark)" : undefined;
  const soft = overPhoto
    ? "color-mix(in srgb, var(--deck-canvas-light) 80%, transparent)"
    : undefined;

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
          className="deck-content flex flex-1 flex-col items-center text-center"
          style={{ gap: "var(--deck-gap-md)", color: ink }}
        >
          {slide.eyebrow && (
            <p className="deck-kicker" style={{ color: accent }}>
              {slide.eyebrow}
            </p>
          )}

          <h2 className="deck-title">{slide.title}</h2>

          {live ? (
            <p className="deck-stat deck-tabular">{formatCountdown(remaining)}</p>
          ) : (
            <>
              <p className="deck-stat deck-tabular">{slide.minutes}</p>
              <p className="deck-label">minutes</p>
            </>
          )}

          {/* The track is the structural hairline; the fill is the spark, which
              is decorative by definition and never carries type. */}
          <div
            className="w-full"
            aria-hidden="true"
            style={{ background: "var(--slide-hairline)", blockSize: 1 }}
          >
            <div
              style={{
                inlineSize: `${progress * 100}%`,
                blockSize: 1,
                background: "var(--deck-spark)",
                transition: "inline-size 1s linear",
              }}
            />
          </div>

          {slide.lead && (
            <p className="deck-lead mx-auto" style={{ color: soft }}>
              {slide.lead}
            </p>
          )}

          {slide.resumeLabel && (
            <p className="deck-subtitle" style={{ color: accent ?? "var(--slide-accent)" }}>
              {slide.resumeLabel}
            </p>
          )}

          {live && (
            /* The viewport owns Space; this line only tells the host so. */
            <p className="deck-label" style={{ color: soft }}>
              Space — start / pause · → — continue
            </p>
          )}
        </div>
      </div>
    </>
  );
}
