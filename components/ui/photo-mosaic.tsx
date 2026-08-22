"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CurtainReveal } from "@/components/ui/reveal";
import { Lightbox, useLightbox, type LightboxImage } from "@/components/ui/lightbox";
import { PhotoCredit } from "@/components/ui/photo-credit";

/**
 * PhotoMosaic — the asymmetric photo grid, extracted so it exists once.
 *
 * This was the body of `components/events/event-detail/event-photos.tsx` and
 * nothing else could use it. The gallery page needs the same grid over a
 * different photo source, and the alternative was a second implementation that
 * would drift on the two fiddly parts: the span rhythm and the `sizes` hints
 * that have to mirror it. `EventPhotos` now renders this and stays
 * pixel-identical.
 *
 * NOT CSS `columns`. `layoutSystem.grids.masonry` exists and is tempting, but a
 * column-flow container fills top-to-bottom per column while the eye reads
 * left-to-right, so DOM order stops matching visual order — which silently
 * breaks both the lightbox's "photo 7 of 24" counter and tab order. The
 * explicit spans below keep the two in step.
 */

/**
 * Repeating span pattern that gives the gallery an asymmetric editorial rhythm
 * without needing per-photo dimensions.
 */
function spanForIndex(index: number): string {
  switch (index % 6) {
    case 0:
      return "col-span-2 row-span-2";
    case 5:
      return "col-span-2";
    default:
      return "";
  }
}

/**
 * Rendered width hint for the optimizer, mirroring `spanForIndex()`. The grid
 * is 2 columns below `md` and 4 above, so a single tile is 50vw / 25vw and a
 * double-width tile is 100vw / 50vw. Capped at the widest the tile can ever be
 * inside the page container so ultrawide displays do not fetch a needlessly
 * large file.
 */
function sizesForIndex(index: number): string {
  const wide = index % 6 === 0 || index % 6 === 5;
  return wide
    ? "(max-width: 767px) 100vw, (max-width: 1536px) 50vw, 768px"
    : "(max-width: 767px) 50vw, (max-width: 1536px) 25vw, 384px";
}

export interface PhotoMosaicProps {
  photos: LightboxImage[];
  /** Section heading. Omit to render the grid with no header of its own. */
  heading?: string;
  /** Small label above the heading. */
  eyebrow?: string;
  /** Photographer credit line, rendered under the grid. */
  credit?: string;
  /**
   * Render only this many tiles until the reader asks for the rest.
   *
   * Twenty-three tiles at `auto-rows-[46vw]` is roughly fifteen rows on a
   * phone — about seven screens of photographs between the reader and whatever
   * follows the gallery. The lightbox still holds every photo, so opening any
   * tile can page through to the end whether or not the fold has been lifted.
   */
  initialCount?: number;
  /** Trailing action slot, below the credit. */
  footer?: React.ReactNode;
  className?: string;
  id?: string;
}

export function PhotoMosaic({
  photos,
  heading,
  eyebrow,
  credit,
  initialCount,
  footer,
  className,
  id,
}: PhotoMosaicProps) {
  const [expanded, setExpanded] = React.useState(false);
  const lightbox = useLightbox(photos);

  const folded =
    !expanded && initialCount !== undefined && photos.length > initialCount;
  const visible = folded ? photos.slice(0, initialCount) : photos;

  if (photos.length === 0) return null;

  return (
    <section id={id} className={cn("space-y-8", className)}>
      {(eyebrow || heading) && (
        <div className="mb-6 text-center sm:mb-8 md:mb-12">
          {eyebrow && <p className="text-label mb-3 text-brand">{eyebrow}</p>}
          {heading && (
            <h2 className="text-display-sm text-foreground">{heading}</h2>
          )}
        </div>
      )}

      <div className="grid auto-rows-[46vw] grid-cols-2 gap-3 sm:auto-rows-[200px] md:auto-rows-[220px] md:grid-cols-4 md:gap-4">
        {visible.map((photo, index) => (
          <CurtainReveal
            key={`${photo.src}-${index}`}
            delay={(index % 4) * 80}
            className={cn(
              "h-full overflow-hidden rounded-[16px] border border-border bg-muted",
              spanForIndex(index)
            )}
          >
            <button
              type="button"
              onClick={() => lightbox.openAt(index)}
              aria-label={`View photo ${index + 1} of ${photos.length}`}
              className="group relative block h-full w-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes={sizesForIndex(index)}
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </button>
          </CurtainReveal>
        ))}
      </div>

      {folded && (
        <div className="flex justify-center">
          <Button variant="outline" size="lg" onClick={() => setExpanded(true)}>
            Show all {photos.length} photos
          </Button>
        </div>
      )}

      {credit && <PhotoCredit>{credit}</PhotoCredit>}

      {footer}

      <Lightbox
        images={lightbox.images}
        index={lightbox.index}
        open={lightbox.open}
        onIndexChange={lightbox.onIndexChange}
        onOpenChange={lightbox.onOpenChange}
      />
    </section>
  );
}
