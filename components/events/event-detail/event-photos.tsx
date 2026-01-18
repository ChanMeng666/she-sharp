"use client";

import { Event } from "@/types/event";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EventPhotosProps {
  event: Event;
  className?: string;
}

export function EventPhotos({ event, className }: EventPhotosProps) {
  if (!event.photos || event.photos.length === 0) {
    return null;
  }

  return (
    <section id="event-photos" className={cn("space-y-8, py-24", className)}>
      <h2 className="text-lg md:text-xl lg:text-4xl font-semibold uppercase text-center mb-12">
        A taste of the Event
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {event.photos.map((photo, index) => (
          <div
            key={index}
            className="aspect-square overflow-hidden bg-muted"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo}
              alt={`${event.title} photo ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-12">
        <Button
          variant="brand"
          size="lg"
          onClick={() => {
            if (event.albumUrl) {
              window.open(event.albumUrl, "_blank");
            }
          }}
          disabled={!event.albumUrl}
        >
          View Gallery
        </Button>
      </div>
    </section>
  );
}

