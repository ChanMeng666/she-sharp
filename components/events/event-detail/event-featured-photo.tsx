"use client";

import { EventV3 } from "@/types/event";
import { cn } from "@/lib/utils";

interface EventFeaturedPhotoProps {
  event: EventV3;
  className?: string;
}

export function EventFeaturedPhoto({
  event,
  className,
}: EventFeaturedPhotoProps) {
  const photos = event.detailPageData.photos;
  const featured = photos && photos.length > 0 ? photos[0] : null;

  if (!featured) {
    return null;
  }

  return (
    <figure
      className={cn(
        "w-full overflow-hidden rounded-lg bg-muted",
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={featured.url}
        alt={featured.alt || `${event.title} group photo`}
        className="w-full h-auto object-cover"
        loading="lazy"
      />
      {featured.alt && (
        <figcaption className="sr-only">{featured.alt}</figcaption>
      )}
    </figure>
  );
}
