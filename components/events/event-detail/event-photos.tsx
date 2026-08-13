"use client";

import Image from "next/image";
import { EventV3 } from "@/types/event";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CurtainReveal } from "@/components/ui/reveal";
import { Lightbox, useLightbox, type LightboxImage } from "@/components/ui/lightbox";
import type { EventArchivePhoto } from "@/lib/data/event-archive-photos";
import { hasPhotos } from "@/lib/data/events";

// Repeating span pattern that gives the gallery an asymmetric editorial rhythm
// without needing per-photo dimensions.
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

interface EventPhotosProps {
  event: EventV3;
  /**
   * Archive photo set injected for past events that ship no on-page photos of
   * their own. When present it replaces the event's (empty) photo set.
   */
  archivePhotos?: EventArchivePhoto[];
  className?: string;
}

export function EventPhotos({ event, archivePhotos, className }: EventPhotosProps) {
  const isArchive = !!archivePhotos && archivePhotos.length > 0;

  // Build the display set. Archive galleries show every photo; the event's own
  // set skips photos[0] because EventFeaturedPhoto already renders it above,
  // unless hideFeaturedPhoto is set. Computed before any early return so the
  // Lightbox hook below always runs (Rules of Hooks).
  const tiles: LightboxImage[] = isArchive
    ? archivePhotos!.map((photo) => ({
        src: photo.src,
        alt: photo.alt,
        width: photo.width,
        height: photo.height,
      }))
    : (event.detailPageData.hideFeaturedPhoto
        ? event.detailPageData.photos
        : event.detailPageData.photos.slice(1)
      ).map((photo, index) => ({
        src: photo.url,
        alt: photo.alt || `${event.title} photo ${index + 2}`,
      }));

  const lightbox = useLightbox(tiles);

  const galleryUrl = event.detailPageData.galleryUrl;

  if (event.detailPageData.hidePhotosSection) {
    return null;
  }
  if (!isArchive && !hasPhotos(event)) {
    return null;
  }
  if (tiles.length === 0 && !galleryUrl) {
    return null;
  }

  return (
    <section id="event-photos" className={cn("space-y-8 py-12 sm:py-16 md:py-20 lg:py-24", className)}>
      <h2 className="text-display-sm text-foreground text-center mb-6 sm:mb-8 md:mb-12">
        A taste of the event
      </h2>
      {tiles.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[46vw] sm:auto-rows-[200px] md:auto-rows-[220px] gap-3 md:gap-4">
          {tiles.map((photo, index) => (
            <CurtainReveal
              key={index}
              delay={(index % 4) * 80}
              className={cn(
                "h-full overflow-hidden rounded-[16px] border border-border bg-muted",
                spanForIndex(index)
              )}
            >
              <button
                type="button"
                onClick={() => lightbox.openAt(index)}
                aria-label={`View photo ${index + 1} of ${tiles.length}`}
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
      )}

      {galleryUrl && (
        <div className="flex justify-center mt-6 sm:mt-8 md:mt-12">
          {isArchive ? (
            <Button variant="outline" size="lg" asChild>
              <a href={galleryUrl} target="_blank" rel="noopener noreferrer">
                Full album on Google Photos
              </a>
            </Button>
          ) : (
            <Button
              variant="brand"
              size="lg"
              onClick={() => {
                window.open(galleryUrl, "_blank");
              }}
            >
              View Gallery
            </Button>
          )}
        </div>
      )}

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
