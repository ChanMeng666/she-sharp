"use client";

import Image from "next/image";
import { EventV3 } from "@/types/event";
import { cn } from "@/lib/utils";
import { EventCountdown } from "./event-countdown";
import { isFutureDate, formatEventDate } from "@/lib/data/event-utils";
import { Calendar, MapPin, Video } from "lucide-react";

interface EventHeaderProps {
  event: EventV3;
  className?: string;
}

export function EventHeader({ event, className }: EventHeaderProps) {
  const isFutureEvent = isFutureDate(event.date);
  const location = event.detailPageData.location;
  const category = event.detailPageData.category;
  const isOnline = location.format === "online";

  const locationLabel = isOnline
    ? "Online event"
    : location.venueName
    ? `${location.venueName}${location.city ? `, ${location.city}` : ""}`
    : location.city || null;

  return (
    <div
      className={cn(
        "relative isolate flex min-h-[62vh] items-end overflow-hidden bg-foreground",
        className
      )}
    >
      {/* Full-bleed real event photo */}
      <Image
        src={event.coverImage.url}
        alt={event.coverImage.alt || event.title}
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      {/* Navy scrim — heavier at the base for legibility, light ambient veil above */}
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/45 to-foreground/30" />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pt-32 pb-12 md:pt-36 md:pb-16 lg:pb-20">
        {/* Category chip */}
        {category && (
          <span className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium capitalize tracking-wide text-white/90 mb-6">
            {category}
          </span>
        )}

        {/* Title */}
        <h1
          className="text-display-md text-white max-w-3xl mb-4"
          style={{ textWrap: "balance" } as React.CSSProperties}
        >
          {event.title}
        </h1>

        {/* Subtitle */}
        {event.detailPageData.subtitle && (
          <p className="text-lg text-white/75 leading-relaxed max-w-2xl mb-8">
            {event.detailPageData.subtitle}
          </p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-white/80 text-sm mb-10">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 shrink-0 text-mint" />
            <span>{formatEventDate(event, "full")}</span>
          </div>
          {locationLabel && (
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Video className="w-4 h-4 shrink-0 text-mint" />
              ) : (
                <MapPin className="w-4 h-4 shrink-0 text-mint" />
              )}
              <span>{locationLabel}</span>
            </div>
          )}
        </div>

        {/* Countdown — quiet unit row */}
        {isFutureEvent && (
          <div className="w-full max-w-[90vw] sm:max-w-[520px]">
            <EventCountdown event={event} />
          </div>
        )}
      </div>
    </div>
  );
}
