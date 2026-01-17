"use client";

import { Event } from "@/lib/data/events";
import { cn } from "@/lib/utils";
import { EventCountdown } from "./event-countdown";

interface EventHeaderProps {
  event: Event;
  className?: string;
}

export function EventHeader({ event, className }: EventHeaderProps) {
  const isPast = event.status === "completed";

  // Check if event is in the future
  const eventDate = new Date(event.startDate);
  const [hours, minutes] = event.startTime.split(":").map(Number);
  eventDate.setHours(hours, minutes, 0, 0);
  const now = new Date();
  const isFutureEvent = eventDate > now;

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
