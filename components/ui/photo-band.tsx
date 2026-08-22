"use client";

import * as React from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { Lightbox, useLightbox, type LightboxImage } from "@/components/ui/lightbox";
import { PhotoCredit } from "@/components/ui/photo-credit";

/**
 * PhotoBand — a drifting ribbon of event photographs.
 *
 * The site had one shape for showing many photographs at once (the home page
 * filmstrip) and it was welded to the home page. This is the reusable version:
 * a band that drops into any text-only stretch of a page and says "these are
 * real rooms that filled up" without asking the reader to do anything.
 *
 * RAW `<img>` ON PURPOSE, like `logo-cloud.tsx` beside it. Curated images ship
 * pre-generated 768/1280/1920 renditions and a `srcSet` built by `toSrcSet()`,
 * so the browser already has exactly the widths it needs. Routing them through
 * `next/image` would add an Image Optimization transformation per variant —
 * billed per cache miss, and slower on the first request — to re-derive files
 * that are already on disk. Fixed-aspect tiles keep this free of layout shift.
 *
 * REDUCED MOTION IS HANDLED HERE, not in `InfiniteSlider`, which calls
 * `useAnimationFrame` unconditionally and animates regardless of the user's
 * preference. The sponsor wall has had that defect unnoticed for a while;
 * fixing it there would change the one component every logo row depends on, so
 * this guards itself and falls back to a scrollable row. Worth fixing at the
 * source separately.
 */

export interface PhotoBandItem {
  src: string;
  /** Pre-generated width-descriptor srcSet, e.g. from `toSrcSet()`. */
  srcSet?: string;
  alt: string;
  width?: number;
  height?: number;
}

const TILE_HEIGHT = {
  sm: "h-32 md:h-40",
  md: "h-44 md:h-60",
} as const;

/** Widest a tile is ever rendered, so the browser stops at the 768px variant. */
const TILE_SIZES = "(max-width: 768px) 200px, 360px";

export interface PhotoBandProps {
  photos: PhotoBandItem[];
  /** Small label above the band. */
  eyebrow?: string;
  /** One line of context under the band. */
  caption?: string;
  /** Photographer credit, rendered under the caption. */
  credit?: string;
  tileHeight?: keyof typeof TILE_HEIGHT;
  /** Seconds for one full pass. Longer is calmer. */
  duration?: number;
  reverse?: boolean;
  /** Make tiles openable. Off by default: a decorative band is `aria-hidden`. */
  lightbox?: boolean;
  className?: string;
}

export function PhotoBand({
  photos,
  eyebrow,
  caption,
  credit,
  tileHeight = "md",
  duration = 80,
  reverse = false,
  lightbox = false,
  className,
}: PhotoBandProps) {
  const reduceMotion = useReducedMotion();
  const box = useLightbox(
    photos.map<LightboxImage>((p) => ({
      src: p.src,
      alt: p.alt,
      width: p.width,
      height: p.height,
    }))
  );

  if (photos.length === 0) return null;

  const tiles = photos.map((photo, index) => {
    const frame = (
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-[16px] border border-border bg-muted",
          "aspect-[3/2]",
          TILE_HEIGHT[tileHeight]
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.src}
          srcSet={photo.srcSet}
          sizes={TILE_SIZES}
          alt={lightbox ? photo.alt : ""}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      </div>
    );

    return lightbox ? (
      <button
        key={`${photo.src}-${index}`}
        type="button"
        onClick={() => box.openAt(index)}
        aria-label={`View photo ${index + 1} of ${photos.length}`}
        className="cursor-pointer rounded-[16px] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        {frame}
      </button>
    ) : (
      <React.Fragment key={`${photo.src}-${index}`}>{frame}</React.Fragment>
    );
  });

  return (
    <div className={cn("space-y-4", className)}>
      {eyebrow && (
        <p className="text-label px-4 text-brand md:px-6">{eyebrow}</p>
      )}

      <div
        className="relative"
        aria-hidden={lightbox ? undefined : true}
        style={{
          maskImage:
            "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
        }}
      >
        {reduceMotion ? (
          // No animation frame at all — a plain scroller the reader drives.
          <div className="flex gap-4 overflow-x-auto px-4 pb-2 md:px-6">
            {tiles}
          </div>
        ) : (
          <InfiniteSlider gap={16} duration={duration} durationOnHover={duration * 2} reverse={reverse}>
            {tiles}
          </InfiniteSlider>
        )}
      </div>

      {(caption || credit) && (
        <div className="space-y-1 px-4 md:px-6">
          {caption && <p className="text-sm text-ink-600">{caption}</p>}
          {credit && <PhotoCredit className="text-left">{credit}</PhotoCredit>}
        </div>
      )}

      {lightbox && (
        <Lightbox
          images={box.images}
          index={box.index}
          open={box.open}
          onIndexChange={box.onIndexChange}
          onOpenChange={box.onOpenChange}
        />
      )}
    </div>
  );
}
