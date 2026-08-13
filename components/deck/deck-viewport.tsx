"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useDeckKeyboard } from "@/hooks/use-deck-keyboard";
import { useDeckPreload } from "@/hooks/use-deck-preload";
import { useDeckSwipe } from "@/hooks/use-deck-swipe";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { useWakeLock } from "@/hooks/use-wake-lock";
import { ENTRANCES_ATTR, ENTRANCES_JS } from "@/lib/deck/motion";
import type { Deck } from "@/lib/deck/types";
import { slideAriaLabel, toneOf } from "@/lib/deck/utils";

import { DeckControlsContext, type DeckControls } from "./deck-controls";
import { DeckHelp } from "./deck-help";
import { DeckOverview } from "./deck-overview";
import { DeckProgress } from "./deck-progress";
import { DeckStage, useStageScale } from "./deck-stage";
import { SlideFrame } from "./slide-frame";
import { SlideRenderer } from "./slide-renderer";

/** Milliseconds of stillness before the cursor and the chrome fade away. */
const IDLE_DELAY = 3000;

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
  const { scale, stageWidth, stageHeight } = useStageScale(viewportRef, {
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

  /* Whether this is a finger rather than a mouse. Resolved in an effect and
     defaulted to `false`, so the server-rendered markup and the first client
     render always agree; the chip relabels itself a frame later, which nobody
     is looking at yet. Not a viewport width — an iPad in landscape drives a
     desktop-sized stage and still has no keyboard. */
  const [touchInput, setTouchInput] = useState(false);
  useEffect(() => {
    setTouchInput(window.matchMedia("(pointer: coarse)").matches);
  }, []);

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
    // `pointerdown` is what carries this on a touch screen. With only the other
    // two, a phone fires neither, `data-idle` latches three seconds after load
    // and the `? keys` chip — the only visible route to the controls — is hidden
    // for the rest of the session with no way to bring it back.
    document.addEventListener("pointerdown", wake);
    return () => {
      document.removeEventListener("pointermove", wake);
      document.removeEventListener("keydown", wake);
      document.removeEventListener("pointerdown", wake);
      if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
    };
  }, [wake]);

  // --------------------------------------------------------------- keyboard

  useDeckKeyboard({
    total,
    breakSlide,
    overviewOpen,
    setOverviewOpen,
    helpOpen,
    setHelpOpen,
    blackout,
    setBlackout,
    goNext,
    goPrevious,
    goTo,
    toggleFullscreen,
    toggleLowPower,
    toggleTimer,
  });

  // ---------------------------------------------------------------- pointer

  const { onPointerDown: handlePointerDown, onPointerUp: handlePointerUp } =
    useDeckSwipe({ viewportRef, blackout, setBlackout, goNext, goPrevious });

  // ------------------------------------------------------------- preloading

  const { loaded, total: imageCount, preloading } = useDeckPreload(deck);

  // -------------------------------------------------------------- wake lock

  useWakeLock();

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
          stageHeight={stageHeight}
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
            Loading assets {loaded} / {imageCount}
          </div>
        )}

        {/* The keys are useless if nothing says they exist. This rides the same
            idle fade as the rest of the chrome, so the host — who is touching
            the machine — sees it, and the room, which is looking at a still
            projection three seconds later, does not.

            On a touch screen it opens the SLIDE LIST instead. A keyboard
            reference is the one panel a phone can do nothing with, and this chip
            is the only visible route to any control there — so it has to lead to
            the control that matters, which is jumping to a slide. */}
        <button
          type="button"
          className="deck-chrome deck-keyhint"
          data-autohide="true"
          data-no-advance
          onClick={() => (touchInput ? setOverviewOpen(true) : setHelpOpen(true))}
          aria-label={touchInput ? "Show all slides" : "Show keyboard shortcuts"}
        >
          <span aria-hidden="true">?</span> {touchInput ? "slides" : "keys"}
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
 * ON A TOUCH SCREEN IT TEACHES SOMETHING ELSE. A phone has no arrow key, no `F`,
 * no `O` and no `L`, so the keyboard card was four instructions none of which
 * could be carried out — worse than no card, because it reads as "this page is
 * not for you". The gestures below are the ones the pointer handler already
 * implements; they were simply never named anywhere.
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
  // Read in an effect, not during render: the server has no `matchMedia`, and
  // branching on it inline would make the first client render disagree with the
  // markup React is hydrating.
  const [touch, setTouch] = useState(false);
  useEffect(() => {
    setTouch(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  const keys: { key: string; what: string }[] = touch
    ? [
        { key: "›", what: "Tap the right of the screen for the next slide" },
        { key: "‹", what: "Tap the left quarter to go back" },
        { key: "↔", what: "Swipe works too, either direction" },
        { key: "?", what: `Tap the corner for all ${total} slides` },
      ]
    : [
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
          {touch ? (
            <>Tap anywhere to begin</>
          ) : (
            <>
              <kbd>?</kbd> for everything else · press any key to begin
            </>
          )}
        </p>
      </div>
    </div>
  );
}
