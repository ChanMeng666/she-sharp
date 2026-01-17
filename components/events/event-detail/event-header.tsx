"use client";

import { Event } from "@/lib/data/events";
import { cn } from "@/lib/utils";

interface EventHeaderProps {
  event: Event;
  className?: string;
}

export function EventHeader({ event, className }: EventHeaderProps) {
  const isPast = event.status === "completed";

  return (
    <div className={cn("space-y-6", className)}>
      {/* Cover Image */}
      <div className="relative aspect-2/1 overflow-hidden bg-muted rounded-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={event.coverImage}
          alt={event.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {isPast && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white text-base font-medium px-4 py-2 border border-white/50">
              Past Event
            </span>
          </div>
        )}
      </div>

      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-bold text-foreground mt-8">
        {event.title}
      </h1>
    </div>
  );
}
