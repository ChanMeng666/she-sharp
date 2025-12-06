"use client";

import { ReactLenis } from "lenis/react";
import {
  motion,
  useMotionTemplate,
  useScroll,
  useTransform,
} from "framer-motion";
import { useRef } from "react";

const SECTION_HEIGHT = 1500;

interface ParallaxImgProps {
  src: string;
  alt: string;
  start: number;
  end: number;
  className?: string;
}

export function SmoothScrollHero() {
  return (
    <div className="bg-[#1f1e44]">
      <ReactLenis
        root
        options={{
          lerp: 0.05,
          smoothWheel: true,
        }}
      >
        <Hero />
      </ReactLenis>
    </div>
  );
}

function Hero() {
  return (
    <div
      style={{ height: `calc(${SECTION_HEIGHT}px + 100vh)` }}
      className="relative w-full"
    >
      <CenterImage />
      <ParallaxImages />
      <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-b from-[#1f1e44]/0 to-[#1f1e44]" />
    </div>
  );
}

function CenterImage() {
  const { scrollY } = useScroll();

  const clip1 = useTransform(scrollY, [0, 1500], [25, 0]);
  const clip2 = useTransform(scrollY, [0, 1500], [75, 100]);

  const clipPath = useMotionTemplate`polygon(${clip1}% ${clip1}%, ${clip2}% ${clip1}%, ${clip2}% ${clip2}%, ${clip1}% ${clip2}%)`;

  const backgroundSize = useTransform(
    scrollY,
    [0, SECTION_HEIGHT + 500],
    ["170%", "100%"]
  );
  const opacity = useTransform(
    scrollY,
    [SECTION_HEIGHT, SECTION_HEIGHT + 500],
    [1, 0]
  );

  return (
    <motion.div
      className="sticky top-0 h-screen w-full"
      style={{
        clipPath,
        backgroundSize,
        opacity,
        backgroundImage:
          "url(https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/public/img/about-2.jpg)",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    />
  );
}

function ParallaxImages() {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-[200px]">
      <ParallaxImg
        src="https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/public/img/about-3.jpg"
        alt="She Sharp event"
        start={-200}
        end={200}
        className="w-1/3"
      />
      <ParallaxImg
        src="https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/public/img/about-1.jpg"
        alt="She Sharp community"
        start={200}
        end={-250}
        className="mx-auto w-2/3"
      />
      <ParallaxImg
        src="https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/public/img/about-4.jpg"
        alt="She Sharp workshop"
        start={-200}
        end={200}
        className="ml-auto w-1/3"
      />
      <ParallaxImg
        src="https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/public/img/about-5.jpg"
        alt="She Sharp networking"
        start={0}
        end={-500}
        className="ml-24 w-5/12"
      />
    </div>
  );
}

function ParallaxImg({ className, alt, src, start, end }: ParallaxImgProps) {
  const ref = useRef<HTMLImageElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: [`${start}px end`, `end ${end * -1}px`],
  });

  const opacity = useTransform(scrollYProgress, [0.75, 1], [1, 0]);
  const scale = useTransform(scrollYProgress, [0.75, 1], [1, 0.85]);

  const y = useTransform(scrollYProgress, [0, 1], [start, end]);
  const transform = useMotionTemplate`translateY(${y}px) scale(${scale})`;

  // Clip-path animation: expand from center
  const clip1 = useTransform(scrollYProgress, [0, 0.4], [25, 0]);
  const clip2 = useTransform(scrollYProgress, [0, 0.4], [75, 100]);
  const clipPath = useMotionTemplate`polygon(${clip1}% ${clip1}%, ${clip2}% ${clip1}%, ${clip2}% ${clip2}%, ${clip1}% ${clip2}%)`;

  return (
    <motion.img
      src={src}
      alt={alt}
      className={className}
      ref={ref}
      style={{ transform, opacity, clipPath }}
    />
  );
}
