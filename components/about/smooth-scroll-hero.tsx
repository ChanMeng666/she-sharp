"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SLIDE_DURATION = 3500;  // ms per slide
const FADE_MS = 900;          // crossfade duration

const slides = [
  {
    src: "/img/gallery/about-2.jpg",
    title: "She Sharp",
    subtitle: "Bridging the gender gap in STEM",
    pos: "center center",
  },
  {
    src: "/img/gallery/about-1.jpg",
    title: "Connect",
    subtitle: "Building professional networks for women in tech",
    pos: "center 30%",
  },
  {
    src: "/img/gallery/about-3.jpg",
    title: "Inspire",
    subtitle: "Showcasing diverse careers in STEM fields",
    pos: "center center",
  },
  {
    src: "/img/gallery/about-4.jpg",
    title: "Empower",
    subtitle: "Supporting career development and growth",
    pos: "center center",
  },
  {
    src: "/img/gallery/about-5.jpg",
    title: "Community",
    subtitle: "2200+ members across New Zealand",
    pos: "center center",
  },
];

const N = slides.length;

export default function SmoothScrollHero() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);

  const goTo = useCallback((index: number) => {
    setCurrent(((index % N) + N) % N);
  }, []);

  // Auto-advance — resets timer on every slide change or pause toggle
  useEffect(() => {
    if (isPaused) return;
    const t = setTimeout(() => goTo(current + 1), SLIDE_DURATION);
    return () => clearTimeout(t);
  }, [current, isPaused, goTo]);

  // Keyboard navigation
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
          to   { transform: scale(1.07) translate(-1.2%, -0.6%); }
        }
        @keyframes heroFillBar {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes heroTextUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        className="h-dvh w-full relative overflow-hidden select-none"
        style={{ background: "#080717" }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          if (dx > 50) goTo(current - 1);
          else if (dx < -50) goTo(current + 1);
        }}
      >
        {/* Background slides — all rendered, opacity transitions handle crossfade */}
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
              src={slide.src}
              alt={slide.title}
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                objectPosition: slide.pos,
                // Ken Burns restarts each time this slide becomes active
                animation:
                  i === current
                    ? `heroKenBurns ${SLIDE_DURATION + FADE_MS}ms ease-out forwards`
                    : "none",
              }}
            />
          </div>
        ))}

        {/* Gradient overlays */}
        <div className="absolute inset-0 z-[3] pointer-events-none bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute inset-0 z-[3] pointer-events-none bg-gradient-to-r from-black/30 to-transparent" />

        {/* Grain texture */}
        <div
          className="absolute inset-0 z-[4] pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "160px 160px",
          }}
        />

        {/* Slide text — key forces remount on slide change, restarting the entrance animation */}
        <div className="absolute bottom-0 left-0 right-0 px-8 sm:px-12 md:px-16 lg:px-20 pb-24 z-[5] pointer-events-none">
          <p
            key={`label-${current}`}
            className="text-white/50 text-[10px] sm:text-xs font-medium tracking-[0.3em] uppercase mb-2 sm:mb-3"
            style={{ animation: "heroTextUp 0.55s ease-out forwards" }}
          >
            She Sharp
          </p>
          <h2
            key={`title-${current}`}
            className="text-white text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-none tracking-tight drop-shadow-lg max-w-2xl mb-3 sm:mb-4"
            style={{ opacity: 0, animation: "heroTextUp 0.6s 0.07s ease-out forwards" }}
          >
            {slides[current].title}
          </h2>
          <p
            key={`sub-${current}`}
            className="text-white/70 text-sm sm:text-base md:text-lg font-light leading-relaxed max-w-sm sm:max-w-md"
            style={{ opacity: 0, animation: "heroTextUp 0.6s 0.16s ease-out forwards" }}
          >
            {slides[current].subtitle}
          </p>
        </div>

        {/* Arrows */}
        <button
          type="button"
          onClick={() => goTo(current - 1)}
          aria-label="Previous slide"
          className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => goTo(current + 1)}
          aria-label="Next slide"
          className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Bottom bar: progress bars + slide counter */}
        <div className="absolute bottom-6 sm:bottom-7 left-0 right-0 px-8 sm:px-12 md:px-16 lg:px-20 z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                className="relative overflow-hidden rounded-full transition-all duration-300 hover:opacity-80"
                style={{
                  height: "2px",
                  width: i === current ? "40px" : "14px",
                  backgroundColor: "rgba(255,255,255,0.22)",
                }}
              >
                {i === current && (
                  <div
                    key={current}
                    className="absolute inset-y-0 left-0 w-full bg-white rounded-full origin-left"
                    style={{
                      animation: `heroFillBar ${SLIDE_DURATION}ms linear forwards`,
                      animationPlayState: isPaused ? "paused" : "running",
                    }}
                  />
                )}
              </button>
            ))}
          </div>

          <span className="text-white/40 text-[10px] sm:text-xs tracking-[0.2em] tabular-nums font-medium">
            {String(current + 1).padStart(2, "0")}&thinsp;/&thinsp;{String(N).padStart(2, "0")}
          </span>
        </div>
      </div>
    </>
  );
}
