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
    <div className={cn("", className)}>
      {/* Cover Image */}
      <div className="relative h-64 md:h-80 lg:h-96 xl:h-[28rem] overflow-hidden">
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
    </div>
  );
}
