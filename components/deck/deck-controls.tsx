"use client";

import { createContext, useContext } from "react";

/**
 * Runtime controls the viewport exposes to slide layouts.
 *
 * The break countdown lives here rather than inside the break slide because the
 * viewport owns the keyboard: Space is "next slide" everywhere except on a
 * break slide, where it starts and pauses the clock. One owner, no race.
 *
 * The context is absent in print mode, so layouts must handle `null` by
 * rendering their static state.
 */
export interface DeckControls {
  /** Whether the countdown is currently ticking. */
  timerRunning: boolean;
  /** Seconds left, or `null` before the timer has been armed for this slide. */
  timerRemaining: number | null;
  toggleTimer: () => void;
  resetTimer: () => void;
  /** Index of the slide currently on screen. */
  currentIndex: number;
}

export const DeckControlsContext = createContext<DeckControls | null>(null);

/** Returns the viewport controls, or `null` when rendering outside a viewport. */
export function useDeckControls(): DeckControls | null {
  return useContext(DeckControlsContext);
}

/** Formats seconds as `M:SS`, the only clock format a room can read at a glance. */
export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
