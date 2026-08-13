"use client";

import Image from "next/image";
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
        {/*
          The event photo set carries no dimensions, so `width`/`height` are a
          3:2 hint (the archive's own ratio) used only to reserve space before
          the file arrives. `h-auto` hands the final height back to the image's
          own aspect ratio once it loads, so the rendered geometry is exactly
          what the raw <img> produced.
        */}
        <Image
          src={featured.url}
          alt={featured.alt || `${event.title} group photo`}
          width={1600}
          height={1067}
          sizes="(max-width: 1024px) 100vw, 1024px"
          className="w-full h-auto object-cover"
        />
        {featured.alt && (
          <figcaption className="sr-only">{featured.alt}</figcaption>
        )}
      </figure>
    </div>
  );
}
