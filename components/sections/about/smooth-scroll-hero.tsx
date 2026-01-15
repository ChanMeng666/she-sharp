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

export default function SmoothScrollHero() {
  return (
    <div className="bg-gray-50">
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
      <div className="absolute bottom-0 left-0 right-0 h-96 bg-linear-to-b from-gray-50/0 via-gray-50/50 to-gray-50" />
    </div>
  );
}

function CenterImage() {
  const { scrollY } = useScroll();

  const clip1 = useTransform(scrollY, [0, 1500], [5, 0]);
  const clip2 = useTransform(scrollY, [0, 1500], [95, 100]);

  const clipPath = useMotionTemplate`polygon(${clip1}% ${clip1}%, ${clip2}% ${clip1}%, ${clip2}% ${clip2}%, ${clip1}% ${clip2}%)`;

  const backgroundSize = useTransform(
    scrollY,
    [0, SECTION_HEIGHT + 500],
    ["150%", "110%"]
  );

  const opacity = useTransform(
    scrollY,
    [SECTION_HEIGHT, SECTION_HEIGHT + 500],
    [1, 0]
  );

  const brightness = useTransform(scrollY, [0, SECTION_HEIGHT], [0.6, 1]);

  const filter = useMotionTemplate`brightness(${brightness})`;

  return (
    <div className="sticky top-0 h-screen w-full overflow-hidden">
      <motion.div
        className="absolute inset-0 w-full h-full"
        style={{
          clipPath,
          backgroundSize,
          opacity,
          filter,
          backgroundImage:
            "url(https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/public/img/about-2.jpg)",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Overlay gradient for depth */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-gray-50/40 via-transparent to-gray-50/60 pointer-events-none"
        style={{ opacity }}
      />

      {/* Hero text */}
      <motion.div
        className="absolute inset-0 flex items-end justify-start"
        style={{
          opacity: useTransform(scrollY, [0, 300], [1, 0]),
          y: useTransform(scrollY, [0, 300], [0, -50]),
        }}
      >
        <div className="glass-panel text-left px-6 py-8 md:px-10 md:py-12 mb-8 ml-8 md:mb-4 md:ml-12 bg-black/40">
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 tracking-tight drop-shadow-lg">
            She Sharp
          </h1>
          <p className="text-xl md:text-2xl text-white max-w-2xl font-light drop-shadow-md">
            Bridging the gender gap in STEM
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function ParallaxImages() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-[200px] relative ">
      <ParallaxImg
        src="https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/public/img/about-3.jpg"
        alt="She Sharp event"
        start={-300}
        end={300}
        className="w-1/2 rounded-2xl "
      />
      <ParallaxImg
        src="https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/public/img/about-1.jpg"
        alt="She Sharp community"
        start={200}
        end={-300}
        className="mx-auto w-3/5 rounded-2xl -mt-48"
      />
      <ParallaxImg
        src="/img/about-4.jpg"
        alt="She Sharp workshop"
        start={-250}
        end={250}
        className="ml-auto w-1/2 rounded-2xl  -mt-40"
      />
      <ParallaxImg
        src="/img/about-5.jpg"
        alt="She Sharp networking"
        start={100}
        end={-400}
        className="ml-32 w-3/5 rounded-2xl -mt-24"
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
  const scale = useTransform(
    scrollYProgress,
    [0, 0.5, 0.75, 1],
    [0.8, 1.05, 1, 0.85]
  );

  const y = useTransform(scrollYProgress, [0, 1], [start, end]);
  const transform = useMotionTemplate`translateY(${y}px) scale(${scale})`;

  const clip1 = useTransform(scrollYProgress, [0, 0.3], [15, 0]);
  const clip2 = useTransform(scrollYProgress, [0, 0.3], [85, 100]);
  const clipPath = useMotionTemplate`polygon(${clip1}% ${clip1}%, ${clip2}% ${clip1}%, ${clip2}% ${clip2}%, ${clip1}% ${clip2}%)`;

  const brightness = useTransform(
    scrollYProgress,
    [0, 0.3, 0.7, 1],
    [0.7, 1, 1, 0.7]
  );

  const filter = useMotionTemplate`brightness(${brightness})`;

  return (
    <motion.div className={className} style={{ opacity }}>
      <motion.img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        ref={ref}
        style={{ transform, clipPath, filter }}
      />
    </motion.div>
  );
}
