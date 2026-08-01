"use client";

import {
  useLayoutEffect,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";

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
  }));

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const measure = (width: number, height: number) => {
      if (width <= 0 || height <= 0) return;

      const stageAspect = lock ?? clamp(width / height, MIN_ASPECT, MAX_ASPECT);
      const stageWidth = Math.round(STAGE_H * stageAspect);
      const raw = Math.min(width / stageWidth, height / STAGE_H) * zoom;
      const scale = Math.round(raw * 1e4) / 1e4;

      setMetrics((previous) =>
        previous.scale === scale && previous.stageWidth === stageWidth
          ? previous
          : { scale, stageWidth },
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
  scale,
  motion = true,
  children,
  className,
}: DeckStageProps) {
  const style = {
    ...themeToCssVars(deck.theme),
    "--deck-stage-w": `${stageWidth}px`,
    "--deck-scale": String(scale),
    inlineSize: `${stageWidth}px`,
  } as CSSProperties;

  return (
    <div
      className={cn("deck-stage", className)}
      style={style}
      data-motion={motion ? "on" : "off"}
    >
      {children}
    </div>
  );
}
