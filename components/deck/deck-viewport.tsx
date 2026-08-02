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
import { ENTRANCES_ATTR, ENTRANCES_JS } from "@/lib/deck/motion";
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

/**
 * Where the low-power choice is remembered.
 *
 * Per browser rather than per deck on purpose: the thing being remembered is a
 * fact about the machine plugged into the projector, not about the event.
 */
const LOW_POWER_KEY = "deck:low-power";

/**
 * Whether this browser has already been shown the controls.
 *
 * Per browser, like the low-power choice, and for the same reason: a venue
 * laptop is opened fresh, so the host who most needs the card is exactly the
 * one who gets it. Someone rehearsing on their own machine sees it once.
 */
const COACH_KEY = "deck:coach-seen";

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
  const [coachOpen, setCoachOpen] = useState(false);
  const [blackout, setBlackout] = useState(false);
  const [idle, setIdle] = useState(false);

  const reducedMotion = usePrefersReducedMotion();
  const { scale, stageWidth } = useStageScale(viewportRef, {
    aspectLock,
    fit,
    zoom,
  });

  // ------------------------------------------------------------- low power

  // `null` means "nobody has decided", in which case the OS setting decides.
  // A host who presses L once has decided, and their choice then outranks the
  // OS on that machine — including the choice to turn motion back ON.
  const [lowPowerChoice, setLowPowerChoice] = useState<boolean | null>(null);
  const lowPower = lowPowerChoice ?? reducedMotion;
  const motionOn = !lowPower;

  // Read after mount, never during render: the server has no localStorage, and
  // a value read during render would hydrate into a mismatch.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LOW_POWER_KEY);
      if (stored === "1" || stored === "0") setLowPowerChoice(stored === "1");
    } catch {
      // Private mode, or storage disabled by policy. The OS setting still works.
    }
  }, []);

  const toggleLowPower = useCallback(() => {
    setLowPowerChoice((previous) => {
      const next = !(previous ?? reducedMotion);
      try {
        window.localStorage.setItem(LOW_POWER_KEY, next ? "1" : "0");
      } catch {
        // Not being able to remember it is survivable; not being able to set it
        // in the first place would not be.
      }
      return next;
    });
  }, [reducedMotion]);

  // The body flag is what stops the CSS side: the ambient wall drift, the plate
  // swell and the slide cross-fade are all `!important`-cancelled off it, so a
  // laptop that cannot keep up has nothing left running between clicks.
  useEffect(() => {
    document.body.classList.toggle("deck-low-power", lowPower);
    return () => document.body.classList.remove("deck-low-power");
  }, [lowPower]);

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

  // ------------------------------------------------------------------ coach

  /* Shown once per browser, on mount, before anyone has pressed anything. A
     help panel behind a `?` nobody knows about is not discoverable, and an
     undiscoverable control may as well not exist — the overview grid and the
     static-mode switch were both invisible to every host who ever used this. */
  useEffect(() => {
    let seen = true;
    try {
      seen = window.localStorage.getItem(COACH_KEY) === "seen";
    } catch {
      seen = false;
    }
    if (!seen) setCoachOpen(true);
  }, []);

  /* Any real interaction dismisses it. The host who already knows the deck
     presses the right arrow and the card is gone before the room notices it —
     which matters, because the deck may already be on the projector. */
  useEffect(() => {
    if (!coachOpen) return;
    const dismiss = () => {
      setCoachOpen(false);
      try {
        window.localStorage.setItem(COACH_KEY, "seen");
      } catch {
        // Ignored; see the dismiss handler on the card itself.
      }
    };
    document.addEventListener("keydown", dismiss, { once: true });
    document.addEventListener("pointerdown", dismiss, { once: true });
    return () => {
      document.removeEventListener("keydown", dismiss);
      document.removeEventListener("pointerdown", dismiss);
    };
  }, [coachOpen]);

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

      // Above the dialog guard on purpose: the help overlay is where the switch
      // is documented and where its current state is shown, so a host who has
      // just opened it to find the key must be able to press the key.
      if (key === "l" || key === "L") {
        // Venue laptops are often old, and a stuttering deck reads worse from
        // the room than a static one. One key, mid-talk, no menu.
        event.preventDefault();
        toggleLowPower();
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
    toggleLowPower,
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

  // Claim entrances for the JavaScript runtime, so `deck.css` stands its own
  // `.deck-rise` / `.deck-reveal` / `.deck-draw` entrances down. Written from a
  // layout effect rather than as a JSX attribute on purpose: it must only ever
  // be true when JavaScript actually ran. Server-rendered markup, the print
  // sheet and a page whose bundle failed all keep the CSS entrances.
  useLayoutEffect(() => {
    const stage = viewportRef.current?.querySelector<HTMLElement>(".deck-stage");
    if (!stage) return;
    stage.dataset[ENTRANCES_ATTR] = ENTRANCES_JS;
    return () => {
      delete stage.dataset[ENTRANCES_ATTR];
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
          motion={motionOn}
        >
          {deck.slides.map((item, itemIndex) => (
            <SlideFrame
              key={item.id}
              slide={item}
              index={itemIndex}
              total={total}
              active={itemIndex === index}
              motion={motionOn}
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
            style={{ insetInlineStart: 26, insetBlockEnd: 70, fontSize: 13 }}
            role="status"
            // Findable, but never announced: sixty-five interruptions while
            // someone is trying to open an event is worse than silence.
            aria-live="off"
          >
            Loading assets {loaded} / {images.length}
          </div>
        )}

        {/* The keys are useless if nothing says they exist. This rides the same
            idle fade as the rest of the chrome, so the host — who is touching
            the machine — sees it, and the room, which is looking at a still
            projection three seconds later, does not. */}
        <button
          type="button"
          className="deck-chrome deck-keyhint"
          data-autohide="true"
          data-no-advance
          onClick={() => setHelpOpen(true)}
          aria-label="Show keyboard shortcuts"
        >
          <span aria-hidden="true">?</span> keys
        </button>

        {coachOpen && (
          <DeckCoach
            total={total}
            onDismiss={() => {
              setCoachOpen(false);
              try {
                window.localStorage.setItem(COACH_KEY, "seen");
              } catch {
                // Private browsing. Showing it again next time is the right
                // failure: this is a teaching card, not a preference.
              }
            }}
          />
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

        <DeckHelp
          open={helpOpen}
          onOpenChange={setHelpOpen}
          lowPower={lowPower}
          lowPowerForced={lowPowerChoice === null && reducedMotion}
        />
      </div>
    </DeckControlsContext.Provider>
  );
}

/**
 * The card a host sees the first time this browser opens a deck.
 *
 * It exists because every control here was invisible. The keys were real, the
 * help panel was real, and the only way to find any of it was to already know
 * to press `?` — so in practice no host ever used the overview grid or the
 * static-mode switch, and a feature nobody can find is a feature that is not
 * there.
 *
 * Four keys, not nine. This is the set a host actually needs in a room: start,
 * move, jump when running late, and kill the motion when the laptop struggles.
 * The rest stay in the `?` panel, which the corner hint now points at.
 *
 * Dismissed by literally any key or click, because it may already be on the
 * projector when the host opens it.
 */
function DeckCoach({
  total,
  onDismiss,
}: {
  total: number;
  onDismiss: () => void;
}) {
  const keys: { key: string; what: string }[] = [
    { key: "→", what: "Next slide. Space works too" },
    { key: "F", what: "Fullscreen — do this before you start" },
    { key: "O", what: `All ${total} slides, click one to jump` },
    { key: "L", what: "Static mode, if the laptop struggles" },
  ];

  return (
    <div
      className="deck-coach"
      role="dialog"
      aria-label="Deck controls"
      data-no-advance
      onClick={onDismiss}
    >
      <div className="deck-coach-card">
        <p className="deck-coach-lede">Before you start</p>
        <ul className="deck-coach-keys">
          {keys.map(({ key, what }) => (
            <li key={key}>
              <kbd>{key}</kbd>
              <span>{what}</span>
            </li>
          ))}
        </ul>
        <p className="deck-coach-foot">
          <kbd>?</kbd> for everything else · press any key to begin
        </p>
      </div>
    </div>
  );
}
