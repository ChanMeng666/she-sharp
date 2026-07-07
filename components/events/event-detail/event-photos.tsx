"use client";

import { EventV3 } from "@/types/event";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CurtainReveal } from "@/components/ui/reveal";
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

interface EventPhotosProps {
  event: EventV3;
  className?: string;
}

export function EventPhotos({ event, className }: EventPhotosProps) {
  if (!hasPhotos(event) || event.detailPageData.hidePhotosSection) {
    return null;
  }

  // Skip photos[0] because EventFeaturedPhoto already shows it above the description,
  // unless hideFeaturedPhoto is set — then include all photos here.
  const photos = event.detailPageData.hideFeaturedPhoto
    ? event.detailPageData.photos
    : event.detailPageData.photos.slice(1);

  if (photos.length === 0 && !event.detailPageData.galleryUrl) {
    return null;
  }

  return (
    <section id="event-photos" className={cn("space-y-8 py-12 sm:py-16 md:py-20 lg:py-24", className)}>
      <h2 className="text-display-sm text-foreground text-center mb-6 sm:mb-8 md:mb-12">
        A taste of the event
      </h2>
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[46vw] sm:auto-rows-[200px] md:auto-rows-[220px] gap-3 md:gap-4">
          {photos.map((photo, index) => (
            <CurtainReveal
              key={index}
              delay={(index % 4) * 80}
              className={cn(
                "h-full overflow-hidden rounded-[16px] border border-border bg-muted",
                spanForIndex(index)
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.alt || `${event.title} photo ${index + 2}`}
                className="w-full h-full object-cover"
              />
            </CurtainReveal>
          ))}
        </div>
      )}
      {event.detailPageData.galleryUrl && (
        <div className="flex justify-center mt-6 sm:mt-8 md:mt-12">
          <Button
            variant="brand"
            size="lg"
            onClick={() => {
              window.open(event.detailPageData.galleryUrl, "_blank");
            }}
          >
            View Gallery
          </Button>
        </div>
      )}
    </section>
  );
}
