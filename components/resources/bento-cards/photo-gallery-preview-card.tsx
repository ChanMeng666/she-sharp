"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

// Static cover image for the Photo Gallery preview card.
const COVER_IMAGE = "/img/gallery/photo-gallery-cover.jpg";

/**
 * Photo Gallery preview card for the resources hub — image-top hairline card.
 * Links to the photo gallery page.
 */
export function PhotoGalleryPreviewCard() {
  return (
    <Link href="/resources/photo-gallery" className="group block h-full">
      <article className="flex h-full flex-col overflow-hidden rounded-[32px] border border-border bg-background transition-colors duration-300 group-hover:border-foreground/30">
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={COVER_IMAGE}
            alt="She Sharp community members gathered at an event"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        </div>
        <div className="flex flex-1 flex-col p-6 md:p-8">
          <span className="text-label text-brand">Photo Gallery</span>
          <h3 className="mt-3 text-xl font-semibold text-foreground md:text-2xl">
            Event photos &amp; highlights
          </h3>
          <p className="mt-2 text-ink-600">
            Browse albums from our workshops, networking events, and community
            gatherings.
          </p>
          <span className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-brand">
            Explore
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </article>
    </Link>
  );
}
