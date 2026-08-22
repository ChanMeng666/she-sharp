"use client";

import { EventV3 } from "@/types/event";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PhotoMosaic } from "@/components/ui/photo-mosaic";
import type { LightboxImage } from "@/components/ui/lightbox";
import type { EventArchivePhoto } from "@/lib/data/event-archive-photos";
import { hasPhotos } from "@/lib/data/event-utils";

/**
 * The grid, the span rhythm and the lightbox now live in
 * `components/ui/photo-mosaic.tsx` — the gallery page needed the same thing
 * over a different photo source. What stays here is the part that is actually
 * about events: which photos to show, and where the "see the rest" link goes.
 */

/**
 * Fold the grid past this many tiles.
 *
 * Sized for the 2026 hackathon, which ships 24 photographs. Twenty-three tiles
 * at `auto-rows-[46vw]` is around fifteen rows on a phone — seven screens of
 * photographs between the reader and the sponsors. Every other event ships five
 * or fewer, so nothing else changes.
 */
const FOLD_AFTER = 12;

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
  // unless hideFeaturedPhoto is set.
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

  const footer = galleryUrl ? (
    <div className="mt-6 flex justify-center sm:mt-8 md:mt-12">
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
  ) : null;

  return (
    <PhotoMosaic
      id="event-photos"
      photos={tiles}
      heading="A taste of the event"
      // Only the events that actually record a photographer show a credit.
      credit={event.detailPageData.photoCredit}
      initialCount={FOLD_AFTER}
      footer={footer}
      className={cn("py-12 sm:py-16 md:py-20 lg:py-24", className)}
    />
  );
}
