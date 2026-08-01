"use client";

import { DeckImage } from "@/components/deck/deck-image";
import { formatCountdown, useDeckControls } from "@/components/deck/deck-controls";
import type { BreakSlide } from "@/lib/deck/types";

/**
 * Ring geometry in design px.
 *
 * 520 rather than as large as it would like to be: the worst case on this slide
 * is eyebrow + title + ring + lead + resume label + key hints, and that stack
 * has to clear 1080 on a 4:3 projector where the type scale is smallest.
 */
const RING = 520;
const STROKE = 14;
const RADIUS = (RING - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * The break clock — the biggest type in the whole deck.
 *
 * It exists so a host never has to shout "five more minutes" across a room of
 * people eating pizza, and so nobody has to trust a wristwatch to bring a
 * hundred people back at the same time. The countdown is owned by the viewport,
 * not by this slide: Space is "next slide" everywhere else and "start / pause"
 * here, so exactly one component listens for it.
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

  /* A background photograph brings a dark scrim with it, so the copy leaves the
     tone tokens and uses the dark-canvas pair, which is legible on both. */
  const overPhoto = Boolean(slide.background);
  const ink = overPhoto ? "var(--deck-canvas-light)" : undefined;
  const accent = overPhoto ? "var(--deck-accent-dark)" : "var(--slide-accent)";
  const soft = overPhoto
    ? "color-mix(in srgb, var(--deck-canvas-light) 80%, transparent)"
    : undefined;

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

      <div className="deck-safe items-center justify-center text-center">
        <div
          className="deck-content flex flex-col items-center"
          style={{ gap: "var(--deck-gap-sm)", color: ink }}
        >
          {slide.eyebrow && (
            <p className="deck-eyebrow" style={{ color: accent }}>
              {slide.eyebrow}
            </p>
          )}

          <h2 className="deck-title">{slide.title}</h2>

          <div
            className="relative grid place-items-center"
            style={{ inlineSize: RING, blockSize: RING }}
          >
            <svg
              width={RING}
              height={RING}
              viewBox={`0 0 ${RING} ${RING}`}
              aria-hidden="true"
              style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}
            >
              <circle
                cx={RING / 2}
                cy={RING / 2}
                r={RADIUS}
                fill="none"
                stroke="var(--slide-hairline)"
                strokeWidth={STROKE}
              />
              <circle
                cx={RING / 2}
                cy={RING / 2}
                r={RADIUS}
                fill="none"
                stroke="var(--deck-spark)"
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
              />
            </svg>

            {live ? (
              <p
                className="deck-stat deck-tabular"
                style={{ fontSize: "calc(var(--dt-stat) * 1.15)" }}
              >
                {formatCountdown(remaining)}
              </p>
            ) : (
              <div className="flex flex-col items-center" style={{ gap: "var(--deck-gap-sm)" }}>
                <p
                  className="deck-stat deck-tabular"
                  style={{ fontSize: "calc(var(--dt-stat) * 1.15)" }}
                >
                  {slide.minutes}
                </p>
                <p className="deck-label">minutes</p>
              </div>
            )}
          </div>

          {slide.lead && (
            <p className="deck-lead mx-auto" style={{ color: soft }}>
              {slide.lead}
            </p>
          )}

          {slide.resumeLabel && (
            <p className="deck-subtitle" style={{ color: accent }}>
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
