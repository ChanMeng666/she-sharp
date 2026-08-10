"use client";

import {
  useLayoutEffect,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";

import { DeckSkinProvider } from "@/components/deck/surfaces";
import { themeToCssVars } from "@/lib/deck/theme";
import type { Deck } from "@/lib/deck/types";
import { cn } from "@/lib/utils";

/**
 * Design height of every stage, in CSS px. Width flows with the display; the
 * height never changes, which is what lets the type scale be plain px.
 */
export const STAGE_H = 1080;

/** Narrowest stage we will draw: a 4:3 data projector. */
export const MIN_ASPECT = 4 / 3;

/** Widest stage we will draw: a 21:9 lobby screen or an LED wall. */
export const MAX_ASPECT = 21 / 9;

/** Fallback aspect when nothing has been measured yet, and the `contain` lock. */
const DEFAULT_ASPECT = 16 / 9;

/**
 * Design width of a PORTRAIT stage, in CSS px. The mirror of `STAGE_H`.
 *
 * A phone held upright is about 0.59 wide-to-tall. Clamped up to the 4:3 floor
 * that becomes a 1440x1080 stage scaled to 0.27, which puts `--dt-body` at seven
 * CSS px — the information is all present and none of it is readable. Fixing the
 * WIDTH instead and letting the height flow is the same trick the landscape
 * stage plays, turned ninety degrees: 900 design px across a 390px phone is a
 * scale of 0.43, so the same type lands near fifteen px.
 *
 * A portrait stage is taller than it is wide, so layouts get MORE vertical room,
 * which is the direction information completeness needs.
 */
export const PORTRAIT_STAGE_W = 900;

/**
 * Bounds on the derived portrait height. The floor stops a nearly-square window
 * producing a stage shorter than the landscape one every layout was authored
 * against; the ceiling stops a long thin window generating a stage so tall that
 * the six-row wall and the safe area lose all relationship to each other.
 */
const MIN_PORTRAIT_H = 1080;
const MAX_PORTRAIT_H = 2400;

export interface StageScaleOptions {
  /** Force a stage aspect (from `?aspect=16:9`). `null` measures the display. */
  aspectLock?: number | null;
  /** `fill` uses the display's own aspect; `contain` letterboxes deliberately. */
  fit?: "fill" | "contain";
  /** Multiplier from `?zoom=`, for venues whose screen crops the edges. */
  zoom?: number;
}

export interface StageScale {
  /** `transform: scale()` factor applied to the stage. */
  scale: number;
  /** Stage width in design px, i.e. `STAGE_H x stage aspect`. */
  stageWidth: number;
  /** Stage height in design px. `STAGE_H` on every landscape display. */
  stageHeight: number;
}

/** Clamps `value` into `[min, max]`. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Measures a container and derives the stage geometry that fills it.
 *
 * The deck is authored at a fixed 1080 height and a *variable* width, so that a
 * 4:3 projector and a 21:9 wall both get an edge-to-edge picture instead of
 * black bars. `fit: "contain"` opts back into letterboxing, which is what a
 * recording or a stream wants.
 *
 * A PORTRAIT display inverts that: the width is fixed at `PORTRAIT_STAGE_W` and
 * the height flows. The branch is gated on `lock === null && width < height`, so
 * `?aspect=`, `fit: "contain"`, print and every landscape display — which is to
 * say every projector this deck was built for — take the untouched path. That
 * gate is the only thing standing between a phone fix and the venue screen, so
 * do not loosen it.
 *
 * The scale is rounded to four decimal places and the state update is skipped
 * when nothing changed. Without that, a sub-pixel scale change resizes the
 * transformed stage, the ResizeObserver fires again, and Chrome starts logging
 * "ResizeObserver loop completed with undelivered notifications" forever.
 *
 * @param ref Element to measure — the viewport, not the stage.
 * @param opts Aspect lock, fit mode and zoom, normally straight from the query.
 * @returns The current `scale` and `stageWidth`.
 */
export function useStageScale(
  ref: RefObject<HTMLElement | null>,
  opts: StageScaleOptions = {},
): StageScale {
  const { aspectLock = null, fit = "fill", zoom = 1 } = opts;

  // `contain` is a deliberate letterbox: lock to 16:9 unless told otherwise.
  const lock = fit === "contain" ? (aspectLock ?? DEFAULT_ASPECT) : aspectLock;

  const [metrics, setMetrics] = useState<StageScale>(() => ({
    scale: 1,
    stageWidth: Math.round(STAGE_H * (lock ?? DEFAULT_ASPECT)),
    stageHeight: STAGE_H,
  }));

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const measure = (width: number, height: number) => {
      if (width <= 0 || height <= 0) return;

      // Portrait: fix the width, flow the height. See the note on the function.
      const portrait = lock === null && width < height;

      const stageWidth = portrait
        ? PORTRAIT_STAGE_W
        : Math.round(STAGE_H * (lock ?? clamp(width / height, MIN_ASPECT, MAX_ASPECT)));

      const stageHeight = portrait
        ? Math.round(
            clamp(
              PORTRAIT_STAGE_W / (width / height),
              MIN_PORTRAIT_H,
              MAX_PORTRAIT_H,
            ),
          )
        : STAGE_H;

      const raw = Math.min(width / stageWidth, height / stageHeight) * zoom;
      const scale = Math.round(raw * 1e4) / 1e4;

      setMetrics((previous) =>
        previous.scale === scale &&
        previous.stageWidth === stageWidth &&
        previous.stageHeight === stageHeight
          ? previous
          : { scale, stageWidth, stageHeight },
      );
    };

    const rect = element.getBoundingClientRect();
    measure(rect.width, rect.height);

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const box = entry.contentRect;
      measure(box.width, box.height);
    });
    observer.observe(element);

    return () => observer.disconnect();
  }, [ref, lock, zoom]);

  return metrics;
}

export interface DeckStageProps {
  deck: Deck;
  /** Stage width in design px, from `useStageScale()`. */
  stageWidth: number;
  /**
   * Stage height in design px, from `useStageScale()`. Defaults to `STAGE_H`,
   * which is what every landscape display and the print sheet want — so a
   * caller that predates the portrait stage keeps its exact previous geometry.
   */
  stageHeight?: number;
  /** Scale factor, from `useStageScale()`. */
  scale: number;
  /** `false` disables the cross-fade for reduced-motion and for print. */
  motion?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * The fixed-size, transform-scaled canvas every slide is drawn on.
 *
 * Everything inside is authored in design px against a 1080-high stage; this
 * element is the only place the real display size is acknowledged. The deck
 * theme lands here as custom properties so the per-tone rules in `deck.css`
 * resolve without any component knowing a hex value.
 *
 * `transform` is intentionally left to CSS: the print stylesheet overrides it
 * with a flat `scale(0.5)`, and an inline transform would beat that.
 */
export function DeckStage({
  deck,
  stageWidth,
  stageHeight = STAGE_H,
  scale,
  motion = true,
  children,
  className,
}: DeckStageProps) {
  const style = {
    ...themeToCssVars(deck.theme),
    "--deck-stage-w": `${stageWidth}px`,
    "--deck-stage-h": `${stageHeight}px`,
    "--deck-scale": String(scale),
    inlineSize: `${stageWidth}px`,
    blockSize: `${stageHeight}px`,
  } as CSSProperties;

  return (
    <div
      className={cn("deck-stage", className)}
      style={style}
      data-motion={motion ? "on" : "off"}
    >
      {/* The event's skin is published here rather than threaded through the
          layouts, because a layout is handed its slide and nothing else. Which
          skin a given slide actually wears is decided per slide — organisational
          ones always wear the house. See `lib/deck/skins.ts`. */}
      <DeckSkinProvider skin={deck.skin}>{children}</DeckSkinProvider>
    </div>
  );
}
