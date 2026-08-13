"use client";

import { useEffect, type Dispatch, type SetStateAction } from "react";

import type { BreakSlide } from "@/lib/deck/types";

/** Whether the keyboard currently belongs to a text field rather than the deck. */
function isTypingTarget(): boolean {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) return false;
  const tag = active.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || active.isContentEditable;
}

export interface DeckKeyboardOptions {
  /** Total slides, so `End` can reach the last one. */
  total: number;
  /** The slide on screen when it is a break, otherwise `null`. */
  breakSlide: BreakSlide | null;
  overviewOpen: boolean;
  setOverviewOpen: Dispatch<SetStateAction<boolean>>;
  helpOpen: boolean;
  setHelpOpen: Dispatch<SetStateAction<boolean>>;
  blackout: boolean;
  setBlackout: Dispatch<SetStateAction<boolean>>;
  goNext: () => void;
  goPrevious: () => void;
  goTo: (target: number) => void;
  toggleFullscreen: () => void;
  toggleLowPower: () => void;
  toggleTimer: () => void;
}

/**
 * The host's keyboard map, assuming a presenter remote sends arrows and
 * Page Up/Down.
 *
 * Bound to `document` rather than the viewport element so a clicker still works
 * after the host has clicked something inside a slide, and so the keys survive
 * the browser moving focus on entering full screen.
 */
export function useDeckKeyboard({
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
}: DeckKeyboardOptions) {
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
    setBlackout,
    setHelpOpen,
    setOverviewOpen,
    toggleFullscreen,
    toggleLowPower,
    toggleTimer,
    total,
  ]);
}
