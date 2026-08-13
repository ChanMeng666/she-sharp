"use client";

import {
  useCallback,
  useRef,
  type Dispatch,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  type SetStateAction,
} from "react";

/** Minimum horizontal travel, in px, before a drag counts as a swipe. */
const SWIPE_DISTANCE = 60;

/** Travel above which a pointer release is a drag rather than a tap. */
const TAP_SLOP = 10;

/** Fraction of the viewport width that pages backwards when clicked. */
const BACK_ZONE = 0.25;

export interface DeckSwipeOptions {
  /** The element whose width defines the back zone. */
  viewportRef: RefObject<HTMLElement | null>;
  blackout: boolean;
  setBlackout: Dispatch<SetStateAction<boolean>>;
  goNext: () => void;
  goPrevious: () => void;
}

export interface DeckSwipeHandlers {
  onPointerDown: (event: ReactPointerEvent) => void;
  onPointerUp: (event: ReactPointerEvent) => void;
}

/**
 * Tap and swipe paging, resolved on pointerup.
 *
 * Click and swipe are settled together rather than through a separate click
 * handler, so a touch never fires both.
 */
export function useDeckSwipe({
  viewportRef,
  blackout,
  setBlackout,
  goNext,
  goPrevious,
}: DeckSwipeOptions): DeckSwipeHandlers {
  const pointerStart = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = useCallback((event: ReactPointerEvent) => {
    pointerStart.current = { x: event.clientX, y: event.clientY };
  }, []);

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
    [blackout, goNext, goPrevious, setBlackout, viewportRef],
  );

  return { onPointerDown: handlePointerDown, onPointerUp: handlePointerUp };
}
