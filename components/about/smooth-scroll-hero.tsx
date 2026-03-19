"use client";

import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useRef } from "react";

const slides = [
  {
    src: "/img/gallery/about-2.jpg",
    title: "She Sharp",
    subtitle: "Bridging the gender gap in STEM",
  },
  {
    src: "/img/gallery/about-3.jpg",
    title: "Connect",
    subtitle: "Building professional networks for women in tech",
  },
  {
    src: "/img/gallery/about-1.jpg",
    title: "Inspire",
    subtitle: "Showcasing diverse careers in STEM fields",
  },
  {
    src: "/img/about-4.jpg",
    title: "Empower",
    subtitle: "Supporting career development and growth",
  },
  {
    src: "/img/about-5.jpg",
    title: "Community",
    subtitle: "2200+ members across New Zealand",
  },
];

function SlideImage({
  slide,
  index,
  total,
  progress,
}: {
  slide: (typeof slides)[number];
  index: number;
  total: number;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  const segmentStart = index / total;
  const segmentEnd = (index + 1) / total;
  const fadeInEnd = segmentStart + 0.3 / total;
  const fadeOutStart = segmentEnd - 0.3 / total;

  const opacity = useTransform(progress, (v) => {
    if (index === 0) {
      // First slide: fully visible at start, fade out at end
      if (v <= fadeOutStart) return 1;
      if (v >= segmentEnd) return 0;
      return 1 - (v - fadeOutStart) / (segmentEnd - fadeOutStart);
    }
    if (v <= segmentStart) return 0;
    if (v <= fadeInEnd) return (v - segmentStart) / (fadeInEnd - segmentStart);
    if (v <= fadeOutStart) return 1;
    if (index === total - 1) return 1; // Last slide stays visible
    if (v >= segmentEnd) return 0;
    return 1 - (v - fadeOutStart) / (segmentEnd - fadeOutStart);
  });

  const scale = useTransform(progress, (v) => {
    if (v < segmentStart || v > segmentEnd) return 1;
    const mid = (segmentStart + segmentEnd) / 2;
    if (v <= mid) return 1 + 0.05 * ((v - segmentStart) / (mid - segmentStart));
    return 1.05 - 0.05 * ((v - mid) / (segmentEnd - mid));
  });

  return (
    <motion.div className="absolute inset-0" style={{ opacity }}>
      <motion.img
        src={slide.src}
        alt={slide.title}
        className="absolute inset-0 w-full h-full object-cover object-center"
        style={{ scale }}
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
      {/* Text overlay */}
      <div className="absolute bottom-0 left-0 right-0 px-6 sm:px-8 md:px-16 lg:px-24 pb-24 sm:pb-20 md:pb-14 lg:pb-16">
        <h1 className="text-white text-4xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight drop-shadow-lg max-w-3xl mb-3 md:mb-4">
          {slide.title}
        </h1>
        <p className="text-white text-base sm:text-lg md:text-2xl lg:text-3xl font-semibold leading-snug tracking-wide drop-shadow-lg max-w-3xl">
          {slide.subtitle}
        </p>
      </div>
    </motion.div>
  );
}

function ScrollIndicator({
  progress,
  total,
}: {
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  total: number;
}) {
  const activeIndex = useTransform(progress, (v) =>
    Math.min(Math.floor(v * total), total - 1)
  );

  return (
    <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-10 glass-pill flex gap-2 px-4 py-2">
      {Array.from({ length: total }).map((_, i) => (
        <IndicatorDot key={i} index={i} activeIndex={activeIndex} />
      ))}
    </div>
  );
}

function IndicatorDot({
  index,
  activeIndex,
}: {
  index: number;
  activeIndex: MotionValue<number>;
}) {
  const isActive = useTransform(activeIndex, (v) => (v === index ? 1 : 0));
  const bg = useTransform(isActive, (v) =>
    v === 1 ? "var(--color-brand)" : "rgba(255,255,255,0.5)"
  );
  const dotScale = useTransform(isActive, (v) => (v === 1 ? 1.3 : 1));

  return (
    <motion.div
      className="w-2.5 h-2.5 rounded-full transition-colors"
      style={{ backgroundColor: bg, scale: dotScale }}
    />
  );
}

export default function SmoothScrollHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  return (
    <div
      ref={containerRef}
      style={{ height: `${slides.length * 100}vh` }}
      className="relative"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {slides.map((slide, i) => (
          <SlideImage
            key={i}
            slide={slide}
            index={i}
            total={slides.length}
            progress={scrollYProgress}
          />
        ))}
        <ScrollIndicator progress={scrollYProgress} total={slides.length} />
      </div>
    </div>
  );
}
