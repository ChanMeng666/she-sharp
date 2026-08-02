"use client";

import { useState } from "react";

import type { DeckImage as DeckImageData } from "@/lib/deck/types";
import { cn } from "@/lib/utils";

interface DeckImageProps {
  image: DeckImageData;
  className?: string;
  /** `cover` fills its box (photos); `contain` fits inside it (logos, posters). */
  fit?: "cover" | "contain";
  /** Passed through to the native `sizes` attribute when a srcSet is present. */
  sizes?: string;
  /** Slide-one imagery only; everything else is warmed by the preloader. */
  priority?: boolean;
}

/**
 * A plain `<img>` with a designed failure state.
 *
 * Deliberately not `next/image`: the deck ships pre-sized assets (the curated
 * manifest has 768/1280/1920 WebP renditions, headshots are fixed-size JPEGs),
 * and `/_next/image` adds a serverless round-trip that can cold-start at
 * exactly the wrong moment. Static files from the CDN cache once and then never
 * touch the network again.
 *
 * When a file is missing, a brand gradient carrying the alt text replaces it —
 * from ten metres away that reads as a design choice, a broken-image glyph does
 * not.
 */
export function DeckImage({
  image,
  className,
  fit = "cover",
  sizes,
  priority = false,
}: DeckImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={cn("deck-img-fallback", className)} role="img" aria-label={image.alt}>
        <span>{image.alt}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image.src}
      srcSet={image.srcSet}
      sizes={image.srcSet ? (sizes ?? "100vw") : undefined}
      alt={image.alt}
      className={cn("deck-img", fit === "contain" && "deck-img-contain", className)}
      // Crop from the bottom, never the top. The archive is overwhelmingly group
      // photographs, and the browser default of `50% 50%` takes an equal bite out
      // of both edges — which on those frames removes the top of people's heads.
      // `DeckImage.focus` remains the per-image override.
      style={{ objectPosition: image.focus ?? "50% 0%" }}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}
