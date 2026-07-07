"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Reveal — one-shot scroll entrance that renders VISIBLE by default.
 *
 * Unlike the old opacity-0 SSR pattern, Reveal never hides content on the
 * server, so there is no blank-flash on first paint. On mount (client only),
 * if the element is below the fold and the user has not requested reduced
 * motion, it arms a fade + 12px rise driven by --ease-out-expo and reveals
 * via a one-shot IntersectionObserver.
 *
 * Prop-compatible with the legacy AnimateOnScroll (threshold/rootMargin/once
 * accepted for back-compat; `variant`, `delay`, `className` are the primary
 * knobs).
 */

type RevealVariant =
  | "fade-up"
  | "fade-down"
  | "fade-left"
  | "fade-right"
  | "scale"
  | "fade";

const hiddenTransform: Record<RevealVariant, string> = {
  "fade-up": "translateY(12px)",
  "fade-down": "translateY(-12px)",
  "fade-left": "translateX(12px)",
  "fade-right": "translateX(-12px)",
  scale: "scale(0.98)",
  fade: "none",
};

export interface RevealProps {
  children: React.ReactNode;
  variant?: RevealVariant;
  delay?: number;
  className?: string;
  /** Back-compat with AnimateOnScroll — accepted but optional. */
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}

// useLayoutEffect on the client, useEffect on the server (avoids SSR warning).
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

export function Reveal({
  children,
  variant = "fade-up",
  delay = 0,
  className,
  threshold = 0.1,
  rootMargin = "0px 0px -80px 0px",
}: RevealProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  // armed = we are running the hide→show animation; shown = current state.
  const [armed, setArmed] = React.useState(false);
  const [shown, setShown] = React.useState(true);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduceMotion) return;

    // Only animate content that starts below the fold — above-the-fold
    // content stays instantly visible (no flash, no delay).
    const rect = el.getBoundingClientRect();
    const belowFold = rect.top > window.innerHeight * 0.9;
    if (!belowFold) return;

    setArmed(true);
    setShown(false);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold, rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
    // Intentionally run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style: React.CSSProperties | undefined = armed
    ? {
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : hiddenTransform[variant],
        transition: `opacity 0.6s var(--ease-out-expo) ${delay}ms, transform 0.6s var(--ease-out-expo) ${delay}ms`,
        willChange: "opacity, transform",
      }
    : undefined;

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}

/**
 * CurtainReveal — image curtain wipe (clip-path from bottom) for editorial
 * image reveals. Renders visible by default; arms a 1.1s --ease-snap wipe when
 * scrolled into view (skipped entirely under reduced motion).
 */
export interface CurtainRevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  threshold?: number;
}

export function CurtainReveal({
  children,
  delay = 0,
  className,
  threshold = 0.2,
}: CurtainRevealProps) {
  // The observed wrapper must stay UNCLIPPED: Chrome factors the target's own
  // clip-path into IntersectionObserver's intersection rect, so a fully
  // clipped target never reports as intersecting and the curtain never lifts.
  // The clip therefore lives on an inner element while the outer ref is
  // observed.
  const ref = React.useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = React.useState(false);
  const [shown, setShown] = React.useState(false);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduceMotion) {
      setShown(true);
      return;
    }

    // Above-the-fold curtains never hide content — same contract as Reveal.
    const rect = el.getBoundingClientRect();
    const belowFold = rect.top > window.innerHeight * 0.9;
    if (!belowFold) {
      setShown(true);
      return;
    }

    setEnabled(true);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold }
    );
    observer.observe(el);

    // Safety net: if the observer never fires (browser quirk, unexpected
    // layout), force the content visible rather than leaving it clipped.
    const fallback = window.setTimeout(() => setShown(true), 4000);
    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const innerStyle: React.CSSProperties | undefined = enabled
    ? {
        clipPath: shown ? "inset(0 0 0 0)" : "inset(0 0 100% 0)",
        transition: `clip-path 1.1s var(--ease-snap) ${delay}ms`,
        willChange: "clip-path",
      }
    : undefined;

  return (
    <div ref={ref} className={cn(className)}>
      <div className="h-full w-full" style={innerStyle}>
        {children}
      </div>
    </div>
  );
}
