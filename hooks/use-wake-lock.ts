"use client";

import { useEffect } from "react";

/**
 * Hold the screen awake for as long as this component is mounted.
 *
 * Every failure mode is silent on purpose: the API rejects on a non-secure
 * origin, in a background tab, and on any browser that exposes it without the
 * permission. None of those are worth an error in front of a room, and the
 * worst case is the display dimming exactly as it would have anyway.
 */
export function useWakeLock() {
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
}
