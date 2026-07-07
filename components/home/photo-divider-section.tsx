"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { curatedImages, toSrcSet } from "@/public/img/curated";

// Full-bleed editorial breather between the impact band and the programmes.
// A curated crowd photo drifts a few percent as it scrolls past.
export function PhotoDividerSection() {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);
  const img = curatedImages["divider-venue-glasshouse"];

  return (
    <section
      ref={ref}
      aria-hidden
      className="relative h-[50vh] w-full overflow-hidden md:h-[60vh]"
    >
      <motion.img
        src={img.src}
        srcSet={toSrcSet(img)}
        sizes="100vw"
        alt=""
        style={reduceMotion ? undefined : { y }}
        className="absolute inset-x-0 top-[-6%] h-[112%] w-full object-cover"
      />
    </section>
  );
}
