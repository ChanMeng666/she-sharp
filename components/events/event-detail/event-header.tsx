"use client";

import { EventV3 } from "@/types/event";
import { cn } from "@/lib/utils";
import { EventCountdown } from "./event-countdown";
import { isFutureDate, formatEventDate } from "@/lib/data/events";
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
    <div className={cn("relative overflow-hidden bg-[#1f1e44]", className)}>
      {/* Ambient glows */}
      <div className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full bg-[#9b2e83]/25 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-[420px] h-[320px] rounded-full bg-[#8982ff]/15 blur-[110px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-32 pb-12 md:pt-36 md:pb-14 lg:pt-40 lg:pb-16">
        {/* Category badge */}
        {category && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/65 border border-white/10 mb-6 capitalize tracking-wide">
            {category}
          </span>
        )}

        {/* Title */}
        <h1
          className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-bold text-white leading-tight max-w-3xl mb-4"
          style={{ textWrap: "balance" } as React.CSSProperties}
        >
          {event.title}
        </h1>

        {/* Subtitle */}
        {event.detailPageData.subtitle && (
          <p className="text-lg text-white/60 leading-relaxed max-w-2xl mb-8">
            {event.detailPageData.subtitle}
          </p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-white/55 text-sm mb-10">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 shrink-0 text-white/35" />
            <span>{formatEventDate(event, "full")}</span>
          </div>
          {locationLabel && (
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Video className="w-4 h-4 shrink-0 text-white/35" />
              ) : (
                <MapPin className="w-4 h-4 shrink-0 text-white/35" />
              )}
              <span>{locationLabel}</span>
            </div>
          )}
        </div>

        {/* Countdown — component unchanged */}
        {isFutureEvent && (
          <div className="w-full max-w-[90vw] sm:max-w-[600px]">
            <EventCountdown event={event} />
          </div>
        )}
      </div>
    </div>
  );
}
