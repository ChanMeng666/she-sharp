"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Video, Users } from "lucide-react";
import { EventV3 } from "@/types/event";
import {
  formatEventDate,
  getEventDisplayTime,
  isPastEvent,
} from "@/lib/data/events";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface EventCardProps {
  event: EventV3;
  variant?: "default" | "compact" | "featured";
  className?: string;
}

export function EventCard({
  event,
  variant = "default",
  className,
}: EventCardProps) {
  const location = event.detailPageData.location;
  const isOnline = location.format === "online";
  const isHybrid = location.format === "hybrid";
  const isPast = isPastEvent(event);
  const displayTime = getEventDisplayTime(event);

  return (
    <Link href={`/events/${event.slug}`} className={cn("block", className)}>
      <Card
        className={cn(
          "group h-full overflow-hidden transition-all duration-300 py-0",
          "hover:shadow-xl hover:-translate-y-1",
          "border border-border card-sm",
          isPast && "opacity-75"
        )}
      >
        {/* Cover Image */}
        <div className="relative aspect-16/9 overflow-hidden  ">
          <Image
            src={event.coverImage.url}
            alt={event.coverImage.alt || event.title}
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={cn(
              "object-cover transition-transform duration-300",
              "group-hover:scale-105"
            )}
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-foreground/30" />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 flex justify-between items-start">
            {/* Format Badge */}
            <Badge
              variant="secondary"
              className={cn(
                "shadow-md ml-auto",
                isOnline && "bg-[#8982ff] text-white",
                isHybrid && "bg-foreground text-background",
                !isOnline && !isHybrid && "bg-white/90 text-foreground"
              )}
            >
              {isOnline ? (
                <>
                  <Video className="w-3 h-3 mr-1" />
                  Online
                </>
              ) : isHybrid ? (
                "Hybrid"
              ) : (
                "In Person"
              )}
            </Badge>
          </div>

          {/* Past Event Overlay */}
          {isPast && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Badge
                variant="secondary"
                className="bg-white/90 text-foreground"
              >
                Past Event
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4 sm:p-5 md:p-6 space-y-3">
          {/* Date & Time */}
          <div className="flex items-center gap-2 text-sm text-foreground font-medium">
            <Calendar className="w-4 h-4 text-[#8982ff]" />
            <span>
              {formatEventDate(event, "short")}
              {displayTime && ` · ${displayTime}`}
            </span>
          </div>

          {/* Title */}
          <h3
            className={cn(
              "font-semibold text-foreground line-clamp-2",
              "group-hover:text-foreground/80 transition-colors",
              variant === "compact" ? "text-base" : "text-lg"
            )}
          >
            {event.title}
          </h3>

          {/* Location */}
          {isOnline ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Video className="w-4 h-4 text-[#8982ff]" />
              <span>Online Event</span>
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-start gap-2 text-sm text-muted-foreground cursor-default">
                  <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="line-clamp-2">
                    {location.venueName || location.city || "TBA"}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                {location.venueName || location.city || "TBA"}
              </TooltipContent>
            </Tooltip>
          )}

          {/* Attendees */}
          {event.attendees && event.attendees > 0 && (
            <div className="flex items-center gap-3 pt-2 border-t border-border">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{event.attendees} attended</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

// Compact variant for sidebar or list views
export function EventCardCompact({
  event,
  className,
}: {
  event: EventV3;
  className?: string;
}) {
  return <EventCard event={event} variant="compact" className={className} />;
}
