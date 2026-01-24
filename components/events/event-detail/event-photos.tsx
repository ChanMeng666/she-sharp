"use client";

import { EventV3 } from "@/types/event";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { hasPhotos } from "@/lib/data/events";

interface EventPhotosProps {
  event: EventV3;
  className?: string;
}

export function EventPhotos({ event, className }: EventPhotosProps) {
  if (!hasPhotos(event)) {
    return null;
  }

  const photos = event.detailPageData.photos;

  return (
    <section id="event-photos" className={cn("space-y-8 py-24", className)}>
      <h2 className="text-display-sm uppercase text-center mb-12">
        A taste of the Event
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map((photo, index) => (
          <div key={index} className="aspect-square overflow-hidden bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url}
              alt={photo.alt || `${event.title} photo ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
      {event.detailPageData.galleryUrl && (
        <div className="flex justify-center mt-12">
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
