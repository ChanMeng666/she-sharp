"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, MapPin, Clock, Video } from "lucide-react";
import { InflectedCard } from "@/components/ui/inflected-card";
import { Event } from "@/lib/data/events";
import { cn } from "@/lib/utils";

// Sample images from Unsplash for demo purposes
const SAMPLE_IMAGES = [
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80", // Conference
  "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&q=80", // Workshop
  "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&q=80", // Networking
  "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&q=80", // Tech event
  "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800&q=80", // Team meetup
  "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80", // Business meeting
];

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

  // Use sample image based on index
  const sampleImage = SAMPLE_IMAGES[index % SAMPLE_IMAGES.length];

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
    <div className={cn("relative flex flex-col h-[480px]", className)}>
      <div className="flex-1">
        <InflectedCard
          id={event.slug}
          image={sampleImage}
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
            description: "0.875rem",
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
      <div className="px-2 flex items-start gap-12 mt-auto">
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
