"use client";

import { useEffect, useMemo, useState } from "react";

import type { Deck } from "@/lib/deck/types";
import { collectDeckImages } from "@/lib/deck/utils";

/** Images warmed at a time. Six keeps the connection busy without queueing. */
const PRELOAD_BATCH = 6;

export interface DeckPreloadState {
  /** Images settled so far — loaded or 404'd, both count. */
  loaded: number;
  /** Images the deck references in total. */
  total: number;
  /** Still warming, so the progress chip belongs on screen. */
  preloading: boolean;
}

/**
 * Warm every image the deck references, in batches, before the venue's wifi
 * has a chance to disappear.
 *
 * After this finishes the deck makes zero network calls, so a dropped
 * connection mid-talk costs nothing short of a page reload.
 */
export function useDeckPreload(deck: Deck): DeckPreloadState {
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

  return {
    loaded,
    total: images.length,
    preloading: images.length > 0 && loaded < images.length,
  };
}
