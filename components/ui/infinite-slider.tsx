"use client";

import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useTransform,
} from "framer-motion";
import React, { useCallback, useEffect, useRef, useState } from "react";
import useMeasure from "react-use-measure";

interface InfiniteSliderProps {
  children: React.ReactNode;
  gap?: number;
  duration?: number;
  durationOnHover?: number;
  direction?: "horizontal" | "vertical";
  reverse?: boolean;
  className?: string;
}

export function InfiniteSlider({
  children,
  gap = 16,
  duration = 25,
  durationOnHover,
  direction = "horizontal",
  reverse = false,
  className,
}: InfiniteSliderProps) {
  const [currentDuration, setCurrentDuration] = useState(duration);
  const [ref, { width, height }] = useMeasure();
  const translation = useMotionValue(0);
  const [isTransitionEnabled, setIsTransitionEnabled] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    setKey((prev) => prev + 1);
  }, [width, height, gap, duration, durationOnHover, direction, reverse]);

  const size = direction === "horizontal" ? width : height;
  const contentSize = size + gap;
  const from = reverse ? -contentSize / 2 : 0;
  const to = reverse ? 0 : -contentSize / 2;

  useEffect(() => {
    if (size > 0) {
      setIsTransitionEnabled(true);
    }
  }, [size]);

  const progress = useRef(0);
  const lastTimestamp = useRef(0);

  const distancePerSecond = contentSize / currentDuration;

  useAnimationFrame((timestamp) => {
    if (!isTransitionEnabled || contentSize <= 0) return;

    if (lastTimestamp.current === 0) {
      lastTimestamp.current = timestamp;
      return;
    }

    const elapsed = timestamp - lastTimestamp.current;
    lastTimestamp.current = timestamp;

    const delta = (elapsed / 1000) * distancePerSecond;
    progress.current += delta;

    if (progress.current >= Math.abs(to - from)) {
      progress.current = progress.current % Math.abs(to - from);
    }

    const currentPosition = reverse
      ? from + progress.current
      : from - progress.current;

    translation.set(currentPosition);
  });

  const translateOutput = useTransform(translation, (value) =>
    direction === "horizontal"
      ? `translateX(${value}px)`
      : `translateY(${value}px)`
  );

  const handleHoverStart = useCallback(() => {
    if (durationOnHover) {
      setCurrentDuration(durationOnHover);
    }
  }, [durationOnHover]);

  const handleHoverEnd = useCallback(() => {
    setCurrentDuration(duration);
  }, [duration]);

  return (
    <div className={className} style={{ overflow: "hidden" }}>
      <motion.div
        key={key}
        ref={ref}
        style={{
          display: "flex",
          flexDirection: direction === "horizontal" ? "row" : "column",
          width: direction === "horizontal" ? "max-content" : undefined,
          height: direction === "vertical" ? "max-content" : undefined,
          gap: `${gap}px`,
          transform: translateOutput,
        }}
        onHoverStart={handleHoverStart}
        onHoverEnd={handleHoverEnd}
      >
        {React.Children.map(children, (child) => child)}
        {React.Children.map(children, (child) => child)}
      </motion.div>
    </div>
  );
}
