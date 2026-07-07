"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { curatedImages, toSrcSet } from "@/public/img/curated";

const SLIDE_DURATION = 4200; // ms per slide — slowed for editorial calm
const FADE_MS = 900; // crossfade duration

// Five curated crowd/speaker frames carry the About hero — each image is
// exclusive to this page so no hero repeats elsewhere on the site.
const slides = [
  {
    img: curatedImages["hero-inspire-her-crowd"],
    eyebrow: "She Sharp",
    title: "Bridging the gender gap in STEM",
    pos: "center center",
  },
  {
    img: curatedImages["hero-diwali-community"],
    eyebrow: "Connect",
    title: "Building professional networks for women in tech",
    pos: "center center",
  },
  {
    img: curatedImages["speaker-inspire-her"],
    eyebrow: "Inspire",
    title: "Showcasing diverse careers in STEM",
    pos: "center 30%",
  },
  {
    img: curatedImages["audience-inspire-her-theatre"],
    eyebrow: "Empower",
    title: "Supporting career development and growth",
    pos: "center center",
  },
  {
    img: curatedImages["hero-anniversary-crowd"],
    eyebrow: "Community",
    title: "3000+ members across New Zealand",
    pos: "center center",
  },
] as const;

const N = slides.length;

export default function SmoothScrollHero() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const touchStartX = useRef(0);

  const goTo = useCallback((index: number) => {
    setCurrent(((index % N) + N) % N);
  }, []);

  // Honour reduced-motion: no auto-advance, no Ken Burns; manual nav only.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Auto-advance — resets timer on every slide change or pause toggle.
  useEffect(() => {
    if (isPaused || reduceMotion) return;
    const t = setTimeout(() => goTo(current + 1), SLIDE_DURATION);
    return () => clearTimeout(t);
  }, [current, isPaused, reduceMotion, goTo]);

  // Keyboard navigation.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goTo(current - 1);
      if (e.key === "ArrowRight") goTo(current + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, goTo]);

  return (
    <>
      <style>{`
        @keyframes heroKenBurns {
          from { transform: scale(1) translate(0%, 0%); }
          to   { transform: scale(1.06) translate(-1%, -0.5%); }
        }
        @keyframes heroFillBar {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes heroTextUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        className="relative h-dvh w-full select-none overflow-hidden bg-foreground"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          if (dx > 50) goTo(current - 1);
          else if (dx < -50) goTo(current + 1);
        }}
      >
        {/* Background slides — all rendered; opacity transitions handle the crossfade. */}
        {slides.map((slide, i) => (
          <div
            key={i}
            className="absolute inset-0"
            style={{
              opacity: i === current ? 1 : 0,
              transition: `opacity ${FADE_MS}ms ease-in-out`,
              zIndex: i === current ? 2 : 1,
            }}
          >
            <img
              src={slide.img.src}
              srcSet={toSrcSet(slide.img)}
              sizes="100vw"
              alt={slide.img.alt}
              className="absolute inset-0 h-full w-full object-cover"
              style={{
                objectPosition: slide.pos,
                // Ken Burns restarts each time this slide becomes active.
                animation:
                  i === current && !reduceMotion
                    ? `heroKenBurns ${SLIDE_DURATION + FADE_MS}ms ease-out forwards`
                    : "none",
              }}
            />
          </div>
        ))}

        {/* Navy scrim — restrained, bottom-anchored so photos stay bright. */}
        <div className="pointer-events-none absolute inset-0 z-[3] bg-gradient-to-t from-foreground/70 via-foreground/15 to-transparent" />

        {/* Slide text — key forces remount on slide change, restarting the entrance. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] px-8 pb-24 sm:px-12 md:px-16 lg:px-20">
          <p
            key={`label-${current}`}
            className="text-label mb-3 text-background/70"
            style={{ animation: "heroTextUp 0.55s ease-out forwards" }}
          >
            {slides[current].eyebrow}
          </p>
          <h1
            key={`title-${current}`}
            className="text-display-md max-w-3xl text-background"
            style={{ opacity: 0, animation: "heroTextUp 0.6s 0.08s ease-out forwards" }}
          >
            {slides[current].title}
          </h1>
        </div>

        {/* Arrows — hairline, no glass. */}
        <button
          type="button"
          onClick={() => goTo(current - 1)}
          aria-label="Previous slide"
          className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-background/40 text-background transition-colors duration-200 hover:bg-background/10 sm:left-5"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => goTo(current + 1)}
          aria-label="Next slide"
          className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-background/40 text-background transition-colors duration-200 hover:bg-background/10 sm:right-5"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Bottom bar: hairline progress + slide counter. */}
        <div className="absolute inset-x-0 bottom-6 z-10 flex items-center justify-between px-8 sm:bottom-7 sm:px-12 md:px-16 lg:px-20">
          <div className="flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                className="relative overflow-hidden rounded-full transition-all duration-300 hover:opacity-80"
                style={{
                  height: "1px",
                  width: i === current ? "40px" : "14px",
                  backgroundColor: "rgba(255,255,255,0.28)",
                }}
              >
                {i === current && !reduceMotion && (
                  <div
                    key={current}
                    className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-background"
                    style={{
                      animation: `heroFillBar ${SLIDE_DURATION}ms linear forwards`,
                      animationPlayState: isPaused ? "paused" : "running",
                    }}
                  />
                )}
                {i === current && reduceMotion && (
                  <div className="absolute inset-0 rounded-full bg-background" />
                )}
              </button>
            ))}
          </div>

          <span className="text-label text-background/50">
            {String(current + 1).padStart(2, "0")}
            &thinsp;/&thinsp;
            {String(N).padStart(2, "0")}
          </span>
        </div>
      </div>
    </>
  );
}
