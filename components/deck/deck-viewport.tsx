"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import type { Deck } from "@/lib/deck/types";
import { collectDeckImages, slideAriaLabel, toneOf } from "@/lib/deck/utils";

import { DeckControlsContext, type DeckControls } from "./deck-controls";
import { DeckHelp } from "./deck-help";
import { DeckOverview } from "./deck-overview";
import { DeckProgress } from "./deck-progress";
import { DeckStage, useStageScale } from "./deck-stage";
import { SlideFrame } from "./slide-frame";
import { SlideRenderer } from "./slide-renderer";

/** Milliseconds of stillness before the cursor and the chrome fade away. */
const IDLE_DELAY = 3000;

/** Images warmed at a time. Six keeps the connection busy without queueing. */
const PRELOAD_BATCH = 6;

/** Minimum horizontal travel, in px, before a drag counts as a swipe. */
const SWIPE_DISTANCE = 60;

/** Travel above which a pointer release is a drag rather than a tap. */
const TAP_SLOP = 10;

/** Fraction of the viewport width that pages backwards when clicked. */
const BACK_ZONE = 0.25;

export interface DeckViewportProps {
  deck: Deck;
  /** Forced stage aspect from `?aspect=`, or `null` to measure the display. */
  aspectLock: number | null;
  /** `contain` letterboxes on purpose, for recording or streaming. */
  fit: "fill" | "contain";
  /** Multiplier from `?zoom=`, for screens that crop the edges. */
  zoom: number;
}

/** Whether the keyboard currently belongs to a text field rather than the deck. */
function isTypingTarget(): boolean {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) return false;
  const tag = active.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || active.isContentEditable;
}

/**
 * The presenter runtime: one deck, one screen, one host with a clicker.
 *
 * Every slide stays mounted and only visibility changes, so advancing is a
 * repaint rather than a mount — nothing waits on layout, image decode or the
 * venue's network. Around that sit the things that make a laptop safe to plug
 * into a projector: a wake lock, a full asset preload with a visible counter, a
 * blackout key, and a keyboard map that assumes a presenter remote is sending
 * arrow keys and Page Up/Down.
 */
export function DeckViewport({
  deck,
  aspectLock,
  fit,
  zoom,
}: DeckViewportProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const total = deck.slides.length;

  const [index, setIndex] = useState(0);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [blackout, setBlackout] = useState(false);
  const [idle, setIdle] = useState(false);

  const reducedMotion = usePrefersReducedMotion();
  const { scale, stageWidth } = useStageScale(viewportRef, {
    aspectLock,
    fit,
    zoom,
  });

  const slide = deck.slides[index];
  const breakSlide = slide?.type === "break" ? slide : null;

  // ---------------------------------------------------------------- navigation

  const goTo = useCallback(
    (target: number) => {
      setIndex((previous) => {
        const next = Math.min(Math.max(target, 0), Math.max(total - 1, 0));
        return next === previous ? previous : next;
      });
    },
    [total],
  );

  const goNext = useCallback(() => {
    setIndex((previous) => Math.min(previous + 1, Math.max(total - 1, 0)));
  }, [total]);

  const goPrevious = useCallback(() => {
    setIndex((previous) => Math.max(previous - 1, 0));
  }, []);

  // ------------------------------------------------------------------- timer

  const [timerRunning, setTimerRunning] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
  const armedFor = useRef<string | null>(null);
  const armSeconds = breakSlide ? breakSlide.minutes * 60 : null;

  // Arm the countdown when a *different* break slide comes on screen. Returning
  // to the same break keeps its remaining time, so stepping back one slide to
  // re-read something does not silently restart the clock the room is watching.
  useEffect(() => {
    if (!breakSlide) {
      setTimerRunning(false);
      return;
    }
    if (armedFor.current === breakSlide.id) return;
    armedFor.current = breakSlide.id;
    setTimerRemaining(breakSlide.minutes * 60);
    setTimerRunning(false);
  }, [breakSlide]);

  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => {
      setTimerRemaining((previous) =>
        previous === null ? previous : Math.max(0, previous - 1),
      );
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning]);

  useEffect(() => {
    if (timerRunning && timerRemaining === 0) setTimerRunning(false);
  }, [timerRunning, timerRemaining]);

  const toggleTimer = useCallback(() => {
    if (armSeconds === null) return;
    // Starting from zero restarts the break rather than doing nothing, which is
    // what "five more minutes" looks like from the front of a room.
    setTimerRemaining((previous) =>
      previous === null || previous <= 0 ? armSeconds : previous,
    );
    setTimerRunning((running) => !running);
  }, [armSeconds]);

  const resetTimer = useCallback(() => {
    if (armSeconds === null) return;
    setTimerRemaining(armSeconds);
    setTimerRunning(false);
  }, [armSeconds]);

  const controls = useMemo<DeckControls>(
    () => ({
      timerRunning,
      timerRemaining,
      toggleTimer,
      resetTimer,
      currentIndex: index,
    }),
    [timerRunning, timerRemaining, toggleTimer, resetTimer, index],
  );

  // ------------------------------------------------------------------ chrome

  const toggleFullscreen = useCallback(() => {
    const element = viewportRef.current;
    if (!element) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
    } else {
      void element.requestFullscreen?.().catch(() => {});
    }
  }, []);

  // --------------------------------------------------------------- URL sync

  // `history.replaceState` rather than `next/navigation`: the root layout awaits
  // `cookies()`, so every route is dynamic and a router navigation would round
  // -trip the server on each slide change — over venue wifi, mid-talk.
  const hashInitialised = useRef(false);

  useEffect(() => {
    const applyHash = () => {
      const raw = window.location.hash.replace(/^#/, "");
      const parsed = Number.parseInt(raw, 10);
      if (Number.isNaN(parsed)) return;
      setIndex(Math.min(Math.max(parsed - 1, 0), Math.max(total - 1, 0)));
    };

    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, [total]);

  useEffect(() => {
    // Skip the first pass. The mount effect above may be about to apply a deep
    // link such as `#12`, and writing `#1` here would erase it before the state
    // update lands.
    if (!hashInitialised.current) {
      hashInitialised.current = true;
      return;
    }
    const hash = `#${index + 1}`;
    if (window.location.hash !== hash) {
      window.history.replaceState(null, "", hash);
    }
  }, [index]);

  // ------------------------------------------------------------------- idle

  const idleTimer = useRef<number | null>(null);

  const wake = useCallback(() => {
    setIdle(false);
    if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => setIdle(true), IDLE_DELAY);
  }, []);

  useEffect(() => {
    wake();
    document.addEventListener("pointermove", wake);
    document.addEventListener("keydown", wake);
    return () => {
      document.removeEventListener("pointermove", wake);
      document.removeEventListener("keydown", wake);
      if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
    };
  }, [wake]);

  // --------------------------------------------------------------- keyboard

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // Leave browser and OS shortcuts alone, and leave text fields alone —
      // the overview has no input today, but the help dialog is one edit away.
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTypingTarget()) return;

      const key = event.key;

      if (key === "Escape") {
        if (overviewOpen) {
          event.preventDefault();
          setOverviewOpen(false);
        } else if (helpOpen) {
          event.preventDefault();
          setHelpOpen(false);
        } else if (blackout) {
          event.preventDefault();
          setBlackout(false);
        }
        // Nothing open: let the browser leave full screen.
        return;
      }

      // Blackout is a panic key. Whatever comes next just brings the deck back.
      if (blackout) {
        event.preventDefault();
        setBlackout(false);
        return;
      }

      if (key === "o" || key === "O") {
        event.preventDefault();
        setHelpOpen(false);
        setOverviewOpen((open) => !open);
        return;
      }

      if (key === "?") {
        event.preventDefault();
        setOverviewOpen(false);
        setHelpOpen((open) => !open);
        return;
      }

      // A dialog owns the screen; everything below moves the deck underneath it.
      if (overviewOpen || helpOpen) return;

      switch (key) {
        case " ":
          // Always swallow Space: unhandled, it scrolls the page behind the
          // fixed viewport. On a break slide it drives the countdown instead of
          // advancing, so the host can time a break without leaving the slide.
          event.preventDefault();
          if (breakSlide) toggleTimer();
          else goNext();
          return;

        case "ArrowRight":
        case "ArrowDown":
        case "PageDown":
        case "Enter":
          event.preventDefault();
          goNext();
          return;

        case "ArrowLeft":
        case "ArrowUp":
        case "PageUp":
        case "Backspace":
          event.preventDefault();
          goPrevious();
          return;

        case "Home":
          event.preventDefault();
          goTo(0);
          return;

        case "End":
          event.preventDefault();
          goTo(total - 1);
          return;

        case "f":
        case "F":
          event.preventDefault();
          toggleFullscreen();
          return;

        case "b":
        case "B":
          event.preventDefault();
          setBlackout(true);
          return;

        default:
          return;
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [
    blackout,
    breakSlide,
    goNext,
    goPrevious,
    goTo,
    helpOpen,
    overviewOpen,
    toggleFullscreen,
    toggleTimer,
    total,
  ]);

  // ---------------------------------------------------------------- pointer

  const pointerStart = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = useCallback((event: ReactPointerEvent) => {
    pointerStart.current = { x: event.clientX, y: event.clientY };
  }, []);

  // Click and swipe are resolved together on pointerup rather than through a
  // separate click handler, so a touch never fires both.
  const handlePointerUp = useCallback(
    (event: ReactPointerEvent) => {
      const start = pointerStart.current;
      pointerStart.current = null;
      if (!start) return;

      if (blackout) {
        setBlackout(false);
        return;
      }

      const target = event.target;
      if (
        target instanceof Element &&
        target.closest("a, button, [data-no-advance]")
      ) {
        return;
      }

      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;

      if (
        Math.abs(dx) > SWIPE_DISTANCE &&
        Math.abs(dx) > Math.abs(dy) * 1.5
      ) {
        if (dx < 0) goNext();
        else goPrevious();
        return;
      }

      // A drag that was not a swipe is someone steadying the trackpad, not a tap.
      if (Math.abs(dx) > TAP_SLOP || Math.abs(dy) > TAP_SLOP) return;

      const rect = viewportRef.current?.getBoundingClientRect();
      if (rect && event.clientX - rect.left < rect.width * BACK_ZONE) {
        goPrevious();
      } else {
        goNext();
      }
    },
    [blackout, goNext, goPrevious],
  );

  // ------------------------------------------------------------- preloading

  const images = useMemo(() => collectDeckImages(deck), [deck]);
  const [loaded, setLoaded] = useState(0);

  useEffect(() => {
    if (images.length === 0) return;
    let cancelled = false;

    const schedule = (task: () => void) => {
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(task);
      } else {
        window.setTimeout(task, 0);
      }
    };

    const runBatch = (start: number) => {
      if (cancelled || start >= images.length) return;
      const batch = images.slice(start, start + PRELOAD_BATCH);
      let settled = 0;

      batch.forEach((src) => {
        const image = new window.Image();
        image.decoding = "async";
        const settle = () => {
          if (cancelled) return;
          setLoaded((count) => count + 1);
          settled += 1;
          // A 404 counts as settled: one missing asset must not leave the host
          // staring at "41 / 65" and wondering whether it is safe to start.
          if (settled === batch.length) {
            schedule(() => runBatch(start + PRELOAD_BATCH));
          }
        };
        image.onload = settle;
        image.onerror = settle;
        image.src = src;
      });
    };

    schedule(() => runBatch(0));
    return () => {
      cancelled = true;
    };
  }, [images]);

  const preloading = images.length > 0 && loaded < images.length;

  // -------------------------------------------------------------- wake lock

  useEffect(() => {
    let sentinel: WakeLockSentinel | null = null;
    let disposed = false;

    const acquire = async () => {
      if (!("wakeLock" in navigator)) return;
      if (sentinel && !sentinel.released) return;
      try {
        const next = await navigator.wakeLock.request("screen");
        if (disposed) {
          void next.release().catch(() => {});
          return;
        }
        sentinel = next;
      } catch {
        // Rejects on a non-secure origin, in a background tab, and on any
        // browser that has the API but not the permission. None are fatal.
      }
    };

    void acquire();

    // The lock is dropped whenever the tab is hidden — including by the display
    // sleeping once — so it has to be taken again every time we come back.
    const onVisibility = () => {
      if (document.visibilityState === "visible") void acquire();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", onVisibility);
      void sentinel?.release().catch(() => {});
    };
  }, []);

  // ------------------------------------------------------- layout neutralise

  useLayoutEffect(() => {
    // `deck.css` keys the cookie-banner and toaster suppression off this flag.
    document.documentElement.dataset.present = "";
    return () => {
      delete document.documentElement.dataset.present;
    };
  }, []);

  useEffect(() => {
    viewportRef.current?.focus();
  }, []);

  if (!slide) return null;

  const tone = toneOf(slide);

  return (
    <DeckControlsContext.Provider value={controls}>
      <div
        ref={viewportRef}
        className="deck-viewport"
        data-idle={idle ? "true" : "false"}
        tabIndex={0}
        role="region"
        aria-roledescription="slide deck"
        aria-label={deck.title}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <DeckStage
          deck={deck}
          stageWidth={stageWidth}
          scale={scale}
          motion={!reducedMotion}
        >
          {deck.slides.map((item, itemIndex) => (
            <SlideFrame
              key={item.id}
              slide={item}
              index={itemIndex}
              total={total}
              active={itemIndex === index}
            >
              <SlideRenderer slide={item} />
            </SlideFrame>
          ))}

          <DeckProgress index={index} total={total} tone={tone} />
        </DeckStage>

        <p className="sr-only" aria-live="polite">
          {slideAriaLabel(slide, index, total)}
        </p>

        {preloading && (
          <div
            className="deck-chrome rounded-full border border-white/20 bg-black/70 px-4 py-2 font-medium tabular-nums text-white/80"
            style={{ insetInlineStart: 24, insetBlockEnd: 24, fontSize: 13 }}
            role="status"
            // Findable, but never announced: sixty-five interruptions while
            // someone is trying to open an event is worse than silence.
            aria-live="off"
          >
            Loading assets {loaded} / {images.length}
          </div>
        )}

        {blackout && (
          <div
            className="absolute inset-0 z-[60] bg-black"
            aria-hidden="true"
            data-no-advance
          />
        )}

        <DeckOverview
          deck={deck}
          open={overviewOpen}
          onOpenChange={setOverviewOpen}
          currentIndex={index}
          onSelect={(target) => {
            goTo(target);
            setOverviewOpen(false);
          }}
        />

        <DeckHelp open={helpOpen} onOpenChange={setHelpOpen} />
      </div>
    </DeckControlsContext.Provider>
  );
}
