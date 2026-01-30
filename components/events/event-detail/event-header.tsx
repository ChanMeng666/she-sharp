"use client";

import { EventV3 } from "@/types/event";
import { cn } from "@/lib/utils";
import { EventCountdown } from "./event-countdown";
import { isFutureDate } from "@/lib/data/events";

interface EventHeaderProps {
  event: EventV3;
  className?: string;
}

export function EventHeader({ event, className }: EventHeaderProps) {
  // Check if event is in the future
  const isFutureEvent = isFutureDate(event.date);

  return (
    <div className={cn("", className)}>
      {/* Cover Image */}
      <div className="relative h-64 md:h-80 lg:h-96 xl:h-[28rem] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={event.coverImage.url}
          alt={event.coverImage.alt || event.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Overlay Mask */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Countdown */}
        {isFutureEvent && (
          <div className="absolute bottom-4 sm:bottom-6 lg:bottom-8 z-10 w-full">
            <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
              <div className="w-full max-w-[600px]">
                <EventCountdown event={event} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
