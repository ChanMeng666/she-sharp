"use client";

import { useRef, useEffect, useLayoutEffect } from "react";

const slides = [
  {
    src: "/img/gallery/about-2.jpg",
    title: "She Sharp",
    subtitle: "Bridging the gender gap in STEM",
    pos: "center center",
  },
  {
    src: "/img/gallery/about-3.jpg",
    title: "Connect",
    subtitle: "Building professional networks for women in tech",
    pos: "center 30%",
  },
  {
    src: "/img/gallery/about-1.jpg",
    title: "Inspire",
    subtitle: "Showcasing diverse careers in STEM fields",
    pos: "center center",
  },
  {
    src: "/img/about-4.jpg",
    title: "Empower",
    subtitle: "Supporting career development and growth",
    pos: "center center",
  },
  {
    src: "/img/about-5.jpg",
    title: "Community",
    subtitle: "2200+ members across New Zealand",
    pos: "center center",
  },
];

const N = slides.length;
const LERP = 0.08;
const WHEEL_SPEED = 0.75;
const MAX_DELTA = 120;
const SNAP_MS = 450;
const OVERSCROLL_EXIT = 60;

export default function SmoothScrollHero() {
  const rootRef = useRef<HTMLDivElement>(null);
  const slideEls = useRef<(HTMLDivElement | null)[]>([]);
  const bgEls = useRef<(HTMLDivElement | null)[]>([]);
  const dotEls = useRef<(HTMLDivElement | null)[]>([]);
  const hintRef = useRef<HTMLDivElement>(null);

  // Set initial slide positions synchronously before paint to avoid flash
  useLayoutEffect(() => {
    const sH = rootRef.current?.offsetHeight || window.innerHeight;
    for (let i = 0; i < N; i++) {
      const el = slideEls.current[i];
      if (el) el.style.transform = `translateY(${i * sH}px)`;
    }
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let sH = root.offsetHeight;
    let curY = 0;
    let tgtY = 0;
    let lastT = Date.now();
    let isSnap = false;
    let snapT = 0;
    let snapFrom = 0;
    let snapGoal = 0;
    let isDrag = false;
    let dragStartY = 0;
    let dragStartTgt = 0;
    const pxV = new Array(N).fill(0);
    let active = true;
    let rafId = 0;
    let prevDot = 0;
    let hintGone = false;
    let overscroll = 0;

    const minTgt = -(N - 1) * sH;

    function clamp(v: number) {
      return Math.max(Math.min(v, 0), minTgt);
    }

    function doSnap() {
      let goal = -Math.round(-tgtY / sH) * sH;
      goal = clamp(goal);
      if (Math.abs(tgtY - goal) < 2) return;
      isSnap = true;
      snapT = Date.now();
      snapFrom = tgtY;
      snapGoal = goal;
    }

    function tickSnap() {
      const p = Math.min((Date.now() - snapT) / SNAP_MS, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      tgtY = snapFrom + (snapGoal - snapFrom) * ease;
      if (p >= 1) isSnap = false;
    }

    function updateDots() {
      const idx = Math.max(0, Math.min(Math.round(-curY / sH), N - 1));
      if (idx === prevDot) return;
      prevDot = idx;
      for (let i = 0; i < N; i++) {
        const dot = dotEls.current[i];
        if (!dot) continue;
        dot.style.backgroundColor =
          i === idx ? "var(--color-brand)" : "rgba(255,255,255,0.5)";
        dot.style.transform = i === idx ? "scale(1.3)" : "scale(1)";
      }
    }

    function animate() {
      const now = Date.now();

      // Auto-snap after inactivity
      if (!isSnap && !isDrag && active && now - lastT > 120) {
        doSnap();
      }
      if (isSnap) tickSnap();

      // Lerp current toward target
      if (!isDrag) curY += (tgtY - curY) * LERP;

      // Update each slide position + parallax
      for (let i = 0; i < N; i++) {
        const el = slideEls.current[i];
        const bg = bgEls.current[i];
        if (!el) continue;

        const y = i * sH + curY;
        el.style.transform = `translateY(${y}px)`;

        if (bg) {
          const target = (-curY - i * sH) * 0.15;
          pxV[i] += (target - pxV[i]) * 0.1;
          bg.style.transform = `translateY(${pxV[i].toFixed(1)}px) scale(1.3)`;
        }
      }

      updateDots();

      // Hide scroll hint after first interaction
      if (!hintGone && Math.abs(tgtY) > 10) {
        hintGone = true;
        const hint = hintRef.current;
        if (hint) {
          hint.style.opacity = "0";
          hint.style.transition = "opacity 0.5s";
        }
      }

      rafId = requestAnimationFrame(animate);
    }

    // --- Wheel ---
    function onWheel(e: WheelEvent) {
      if (!active) return;

      const delta = Math.max(
        Math.min(e.deltaY * WHEEL_SPEED, MAX_DELTA),
        -MAX_DELTA
      );

      // At last slide, scrolling down — accumulate overscroll
      if (delta > 0 && tgtY <= minTgt + 2) {
        overscroll += delta;
        if (overscroll >= OVERSCROLL_EXIT) {
          active = false;
          tgtY = minTgt;
          overscroll = 0;
          // Kick-start page scroll so user doesn't need an extra scroll
          window.scrollBy(0, 1);
          return;
        }
        e.preventDefault();
        return;
      }

      const newTgt = tgtY - delta;

      // Scrolling up past first slide — let page handle
      if (newTgt > sH * 0.05) return;

      // Reset overscroll when not at boundary
      overscroll = 0;

      e.preventDefault();
      isSnap = false;
      lastT = Date.now();
      tgtY = clamp(newTgt);
    }

    // --- Touch ---
    function onTouchStart(e: TouchEvent) {
      if (!active) return;
      isDrag = true;
      isSnap = false;
      dragStartY = e.touches[0].clientY;
      dragStartTgt = tgtY;
      lastT = Date.now();
    }

    function onTouchMove(e: TouchEvent) {
      if (!isDrag || !active) return;

      const dy = e.touches[0].clientY - dragStartY;
      const newTgt = dragStartTgt + dy * 1.2;

      // Swiping down (scroll up) past first slide
      if (newTgt > sH * 0.05) return;

      // Swiping up (scroll down) past last slide — exit with small threshold
      if (newTgt < minTgt - OVERSCROLL_EXIT) {
        active = false;
        tgtY = minTgt;
        isDrag = false;
        overscroll = 0;
        window.scrollBy(0, 1);
        return;
      }

      e.preventDefault();
      tgtY = clamp(newTgt);
      lastT = Date.now();
    }

    function onTouchEnd() {
      isDrag = false;
    }

    // --- Re-activate when page scrolls back to top ---
    function onPageScroll() {
      if (!active && window.scrollY <= 2) {
        active = true;
        overscroll = 0;
        // Re-enter at last slide
        curY = minTgt;
        tgtY = minTgt;
      }
    }

    // --- Resize ---
    function onResize() {
      const newH = root!.offsetHeight;
      if (newH === sH || newH === 0) return;
      const currentSlide = Math.round(-curY / sH);
      sH = newH;
      curY = -currentSlide * sH;
      tgtY = curY;
    }

    root.addEventListener("wheel", onWheel, { passive: false });
    root.addEventListener("touchstart", onTouchStart, { passive: true });
    root.addEventListener("touchmove", onTouchMove, { passive: false });
    root.addEventListener("touchend", onTouchEnd);
    window.addEventListener("scroll", onPageScroll);
    window.addEventListener("resize", onResize);
    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      root.removeEventListener("wheel", onWheel);
      root.removeEventListener("touchstart", onTouchStart);
      root.removeEventListener("touchmove", onTouchMove);
      root.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("scroll", onPageScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="h-screen w-full relative overflow-hidden"
      style={{ background: "#0a0920" }}
    >
      {slides.map((slide, i) => (
        <div
          key={i}
          ref={(el) => {
            slideEls.current[i] = el;
          }}
          className="absolute top-0 left-0 w-full h-full overflow-hidden"
        >
          {/* Background image with parallax — inset -20% to allow movement room */}
          <div
            ref={(el) => {
              bgEls.current[i] = el;
            }}
            className="absolute will-change-transform"
            style={{ inset: "-20%" }}
          >
            <img
              src={slide.src}
              alt={slide.title}
              className="w-full h-full object-cover block"
              style={{ objectPosition: slide.pos }}
              draggable={false}
            />
          </div>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />

          {/* Text overlay */}
          <div className="absolute bottom-0 left-0 right-0 px-6 sm:px-8 md:px-16 lg:px-24 pb-24 sm:pb-20 md:pb-14 lg:pb-16 z-[2]">
            <h2 className="text-white text-4xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight drop-shadow-lg max-w-3xl mb-3 md:mb-4">
              {slide.title}
            </h2>
            <p className="text-white text-base sm:text-lg md:text-2xl lg:text-3xl font-semibold leading-snug tracking-wide drop-shadow-lg max-w-3xl">
              {slide.subtitle}
            </p>
          </div>
        </div>
      ))}

      {/* Scroll indicator dots */}
      <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-10 glass-pill flex gap-2 px-4 py-2">
        {slides.map((_, i) => (
          <div
            key={i}
            ref={(el) => {
              dotEls.current[i] = el;
            }}
            className="w-2.5 h-2.5 rounded-full transition-all duration-200"
            style={{
              backgroundColor:
                i === 0 ? "var(--color-brand)" : "rgba(255,255,255,0.5)",
              transform: i === 0 ? "scale(1.3)" : "scale(1)",
            }}
          />
        ))}
      </div>

      {/* Scroll hint */}
      <div
        ref={hintRef}
        className="absolute bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5 pointer-events-none"
      >
        <span className="text-white/30 text-[11px] tracking-[0.12em] uppercase">
          Scroll
        </span>
        <div className="w-px h-5 bg-white/20 animate-bounce" />
      </div>
    </div>
  );
}
