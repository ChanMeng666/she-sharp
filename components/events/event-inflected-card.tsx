"use client";

import Link from "next/link";
import { ArrowRight, MapPin, Clock, Video, Users } from "lucide-react";
import { InflectedCard } from "@/components/ui/inflected-card";
import type { EventListItem } from "@/lib/data/event-list-item";
import { parseDateString } from "@/lib/data/event-utils";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface EventInflectedCardProps {
  event: EventListItem;
  className?: string;
}

export function EventInflectedCard({
  event,
  className,
}: EventInflectedCardProps) {
  const eventHref = `/events/${event.slug}`;
  const displayImage = event.imageUrl || "/logos/she-sharp-logo.svg";

  const eventDate = parseDateString(event.date);
  const dayOfWeek = eventDate.toLocaleDateString("en-US", { weekday: "long" });
  const month = eventDate.toLocaleDateString("en-US", { month: "short" });
  const day = eventDate.getDate();
  const year = eventDate.getFullYear();
  const displayTime = event.displayTime;

  const isOnline = event.locationFormat === "online";
  const locationStr = isOnline
    ? "Online"
    : event.venueName || event.city || "";

  return (
    <Link
      href={eventHref}
      aria-label={event.title}
      className={cn(
        "relative flex flex-col h-full min-h-[300px] sm:min-h-[400px] md:min-h-[480px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded-[32px]",
        className
      )}
    >
      <div className="flex-1 min-h-0">
        <InflectedCard
          id={event.slug}
          image={displayImage}
          title={event.title}
          description={event.shortDescription.slice(0, 120) + "..."}
          tags={[]}
          parentBackgroundColor="var(--color-background)"
          cardRounding={32}
          fontSizes={{
            title: "clamp(1.05rem, 4vw, 1.25rem)",
            description: "clamp(0.875rem, 3vw, 1rem)",
            tags: "0.75rem",
          }}
          margins={{
            title: "0 0 8px 0",
            description: "0 0 0 0",
            tags: "0",
          }}
          buttonIcon={<ArrowRight />}
          buttonIconSize={24}
          buttonIconColor="#ffffff"
          buttonIconHoverColor="#ffffff"
          buttonBackgroundColor="#000000"
          buttonBackgroundHoverColor="#333333"
          imageHoverScale={1.08}
          titleColor="#000000"
          descriptionColor="#525252"
          titleAlignment="left"
          descriptionAlignment="left"
          tagsAlignment="left"
          maxWidth="100%"
        />
      </div>

      {/* Date, time and location info below the card - aligned to bottom */}
      <div className="px-2 flex items-start gap-4 sm:gap-6 md:gap-8 lg:gap-12 mt-auto ">
        {/* Prominent date display */}
        <div className="text-left shrink-0">
          <p className="text-2xl font-bold text-foreground">
            <span className="uppercase font-medium mr-1">{month}</span>
            {day}
          </p>
          <p className="text-base text-muted-foreground">
            {dayOfWeek}, {year}
          </p>
        </div>

        {/* Time and location */}
        <div className="space-y-1 min-w-0 pt-1">
          {displayTime && (
            <div className="flex items-center gap-2 text-base text-muted-foreground">
              <Clock className="w-4 h-4 text-brand shrink-0" />
              <span>{displayTime}</span>
            </div>
          )}
          {locationStr && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-start gap-2 text-sm text-muted-foreground cursor-default">
                  {isOnline ? (
                    <Video className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                  ) : (
                    <MapPin className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                  )}
                  <span className="line-clamp-2">{locationStr}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                {locationStr}
              </TooltipContent>
            </Tooltip>
          )}
          {event.attendees != null && event.attendees > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4 text-brand shrink-0" />
              <span>
                {event.attendees} registered
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
