"use client";

import * as React from "react";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionStyle,
} from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Parallax primitives for full-bleed editorial imagery.
 *
 * The inner image layer is taller than its frame and translates vertically
 * slower than the page scrolls, producing a restrained depth effect. All
 * movement is transform-only and disabled under prefers-reduced-motion, where
 * a static object-cover image is rendered instead.
 */

/** Minimal shape shared by curated images — only what the layer needs. */
type ParallaxImageSource = {
  src: string;
  width: number;
  height: number;
  alt: string;
};

/**
 * useParallax — scroll-linked vertical drift for a section ref.
 *
 * Returns a motion style whose `y` runs from +amount to -amount of the layer
 * height as the target traverses the viewport. Pair with a layer that is
 * `(1 + 2*amount)` tall so its edges never reveal. Callers should skip the
 * returned style under reduced motion.
 */
export function useParallax(
  ref: React.RefObject<HTMLElement | null>,
  amount = 0.12
): MotionStyle {
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const pct = amount * 100;
  const y = useTransform(scrollYProgress, [0, 1], [`${pct}%`, `-${pct}%`]);
  return { y };
}

export interface ParallaxImageProps {
  image: ParallaxImageSource;
  className?: string;
  /** Frame height utility classes. */
  heightClass?: string;
  /** Drift magnitude as a fraction of layer height (0.12 = ±12%). */
  amount?: number;
  priority?: boolean;
  /** Optional overlay content rendered above the image. */
  children?: React.ReactNode;
}

/**
 * ParallaxImage — full-bleed image whose inner layer drifts slower than scroll.
 * Falls back to a static cover image under reduced motion or without JS.
 */
export function ParallaxImage({
  image,
  className,
  heightClass = "h-[50vh] md:h-[60vh]",
  amount = 0.12,
  priority = false,
  children,
}: ParallaxImageProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const style = useParallax(ref, amount);

  // Layer extends beyond the frame on both edges so the drift never reveals a
  // gap: height = 100% + 2*amount, offset up by amount.
  const overshoot = `${amount * 100}%`;
  const layerHeight = `${(1 + amount * 2) * 100}%`;

  return (
    <div
      ref={ref}
      className={cn("relative w-full overflow-hidden", heightClass, className)}
    >
      <motion.div
        className="absolute inset-x-0"
        style={
          reduceMotion
            ? { top: 0, height: "100%" }
            : { ...style, top: `-${overshoot}`, height: layerHeight }
        }
      >
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="100vw"
          priority={priority}
          className="object-cover"
        />
      </motion.div>
      {children}
    </div>
  );
}
