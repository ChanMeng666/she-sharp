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
  if (event.detailPageData.hideFeaturedPhoto) {
    return null;
  }

  const photos = event.detailPageData.photos;
  const featured = photos && photos.length > 0 ? photos[0] : null;

  if (!featured) {
    return null;
  }

  return (
    <div className="bg-muted py-10 sm:py-12 md:py-16 px-0 sm:px-6 lg:px-8">
      <figure
        className={cn(
          "mx-auto overflow-hidden max-w-5xl rounded-none sm:rounded-[32px] sm:border sm:border-border",
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
    </div>
  );
}
