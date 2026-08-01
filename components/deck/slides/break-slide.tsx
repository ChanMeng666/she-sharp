"use client";

import { DeckImage } from "@/components/deck/deck-image";
import {
  formatCountdown,
  useDeckControls,
} from "@/components/deck/deck-controls";
import type { BreakSlide } from "@/lib/deck/types";

import { ArchiveBand, BAND_PAD, seedFrom } from "./archive";

/**
 * The break clock — the biggest type in the whole deck.
 *
 * It exists so a host never has to shout "five more minutes" across a room of
 * people eating pizza, and so nobody has to trust a wristwatch to bring a
 * hundred people back at the same time. The countdown is owned by the viewport,
 * not by this slide: Space is "next slide" everywhere else and "start / pause"
 * here, so exactly one component listens for it.
 *
 * SOLID, NOT CUT OUT. Five characters at `--dt-stat` is exactly the shape the
 * photo knockout is built for, and it was tried here first. It is wrong: the
 * clock is the one thing in the deck that has to be readable at a glance from
 * the far side of a room by someone holding a plate, and a figure whose counters
 * are full of faces costs a fraction of a second to resolve. The archive gets
 * the foot band instead, which is where it can run without being in the way.
 *
 * Time remaining reads as a rule emptying from the trailing edge rather than as
 * a circular gauge: at `--dt-stat` a five-character clock is over 600px wide, so
 * a ring around it would not fit the stage — and a rule is the language this
 * deck already speaks. It is `.deck-countdown-track` at 3px rather than a
 * hairline, because this one is a functional indicator read from the back of the
 * room, not a divider that should recede.
 *
 * With no viewport — print mode — `useDeckControls()` returns `null` and the
 * same slide degrades to the planned length, which is all a paper run sheet
 * needs. That branch is not a fallback nobody sees: the PDF export is the backup
 * every venue asks for.
 */
export function BreakSlideLayout({ slide }: { slide: BreakSlide }) {
  const controls = useDeckControls();
  const total = Math.max(1, slide.minutes * 60);
  const live = controls !== null;
  const remaining = controls?.timerRemaining ?? total;
  const progress = live ? Math.max(0, Math.min(1, remaining / total)) : 1;
  const seed = seedFrom(slide.id);

  /* A background brings a dark scrim with it, so the copy leaves the tone tokens
     and uses the dark-canvas pair, which is legible on both. */
  const overPhoto = Boolean(slide.background);
  const ink = overPhoto ? "var(--deck-canvas-light)" : undefined;
  const accent = overPhoto ? "var(--deck-accent-dark)" : undefined;
  const soft = overPhoto
    ? "color-mix(in srgb, var(--deck-canvas-light) 80%, transparent)"
    : undefined;

  return (
    <>
      {slide.background ? (
        <>
          <div className="deck-plate deck-full-colour">
            <DeckImage image={slide.background} />
          </div>
          <div className="deck-scrim" aria-hidden="true" />
        </>
      ) : (
        <ArchiveBand seed={seed} />
      )}

      <div
        className="deck-safe"
        style={overPhoto ? undefined : { paddingBlockEnd: BAND_PAD }}
      >
        <div
          className="deck-content flex flex-1 flex-col items-center text-center"
          style={{ gap: "var(--deck-gap-md)", color: ink }}
        >
          {slide.eyebrow && (
            /* Over a plate the mint kicker would sit on an unpredictable
               photograph, so a backed slide takes the dark-canvas accent. */
            <p
              className="deck-kicker"
              style={accent ? { color: accent } : undefined}
            >
              {slide.eyebrow}
            </p>
          )}

          <h2 className="deck-title">{slide.title}</h2>

          {live ? (
            <p className="deck-stat deck-tabular">
              {formatCountdown(remaining)}
            </p>
          ) : (
            <div className="flex flex-col items-center">
              <p className="deck-stat deck-tabular">{slide.minutes}</p>
              <p className="deck-label">minutes</p>
            </div>
          )}

          {/* 3px, not a hairline: this is a functional indicator someone reads
              from the back of the room to decide whether to get another coffee,
              not a divider that should recede. `data-paused` takes the fill
              faint and kills its transition, so a host who pauses to answer a
              question is not left with a live-looking timer. */}
          <div
            className="deck-countdown-track"
            aria-hidden="true"
            data-paused={controls !== null && !controls.timerRunning ? "true" : undefined}
          >
            <div
              className="deck-countdown-fill"
              style={{ inlineSize: `${progress * 100}%` }}
            />
          </div>

          {slide.lead && (
            <p
              className="deck-lead mx-auto"
              style={soft ? { color: soft } : undefined}
            >
              {slide.lead}
            </p>
          )}

          {slide.resumeLabel && (
            <p
              className="deck-subtitle"
              style={{ color: accent ?? "var(--slide-accent)" }}
            >
              {slide.resumeLabel}
            </p>
          )}

          {live && (
            /* The viewport owns Space; this line only tells the host so. */
            <p
              className="deck-label deck-faint"
              style={soft ? { color: soft } : undefined}
            >
              Space — start / pause · → — continue
            </p>
          )}
        </div>
      </div>
    </>
  );
}
