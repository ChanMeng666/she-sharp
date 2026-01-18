"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, MapPin, Clock, Video } from "lucide-react";
import { InflectedCard } from "@/components/ui/inflected-card";
import { Event } from "@/lib/data/events";
import { cn } from "@/lib/utils";

interface EventInflectedCardProps {
  event: Event;
  className?: string;
  index?: number;
}

export function EventInflectedCard({
  event,
  className,
  index = 0,
}: EventInflectedCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/events/${event.slug}`);
  };

  // Use event coverImage, fallback to She Sharp logo if not available
  const displayImage = event.coverImage || "/logos/she-sharp-logo.svg";

  // Format date parts for prominent display
  const eventDate = new Date(event.startDate);
  const dayOfWeek = eventDate.toLocaleDateString("en-US", { weekday: "long" });
  const month = eventDate.toLocaleDateString("en-US", { month: "short" });
  const day = eventDate.getDate();

  // Check if event is online
  const isOnline = event.location.format === "online";
  
  // Location string - show venue for in-person, "Online" for online events
  const locationStr = isOnline 
    ? "Online" 
    : event.location.venueName || event.location.city || "";

  return (
    <div className={cn("relative flex flex-col h-full min-h-[480px]", className)}>
      <div className="flex-1 min-h-0">
        <InflectedCard
          id={event.slug}
          image={displayImage}
          title={event.title}
          description={
            event.shortDescription || event.description.slice(0, 120) + "..."
          }
          tags={[]}
          parentBackgroundColor="#eee"
          onClick={handleClick}
          cardRounding={16}
          fontSizes={{
            title: "1.25rem",
            description: "1rem",
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
      <div className="px-2 flex items-start gap-12 mt-auto ">
        {/* Prominent date display */}
        <div className="text-left shrink-0">
          <p className="text-2xl font-bold text-foreground">
            <span className="uppercase font-medium mr-1">{month}</span>
            {day}
          </p>
          <p className="text-base text-muted-foreground">{dayOfWeek}</p>
        </div>

        {/* Time and location */}
        <div className="space-y-1 min-w-0 pt-1">
          <div className="flex items-center gap-2 text-base text-muted-foreground">
            <Clock className="w-4 h-4 text-brand shrink-0" />
            <span>{event.startTime}</span>
          </div>
          {locationStr && (
            <div className="flex items-center gap-2 text-base text-muted-foreground">
              {isOnline ? (
                <Video className="w-4 h-4 text-brand shrink-0" />
              ) : (
                <MapPin className="w-4 h-4 text-brand shrink-0" />
              )}
              <span className="truncate text-base">{locationStr}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
