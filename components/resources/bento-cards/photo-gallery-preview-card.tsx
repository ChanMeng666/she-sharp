"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ArrowUpRight, Images } from "lucide-react";
import { galleryAlbums } from "@/lib/data/gallery-albums";

/**
 * Photo Gallery preview card for the resources page.
 * Links to the photo gallery page with a featured album as background.
 */
export function PhotoGalleryPreviewCard() {
  const featured = galleryAlbums[0];

  return (
    <Link href="/resources/photo-gallery" className="block h-full group">
      <Card className="relative h-full w-full min-h-[300px] sm:min-h-[400px] md:min-h-[500px] border-0 shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 card-lg bg-black">
        {/* Background image */}
        {featured && (
          <img
            src={featured.coverImage}
            alt={featured.title}
            className="absolute inset-0 h-full w-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
          />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Badge */}
        <div className="absolute top-4 left-4 sm:top-5 sm:left-5 md:top-6 md:left-6 z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-gray-900">
            <Images className="h-3.5 w-3.5" />
            Photo Gallery
          </span>
        </div>

        {/* Content */}
        <div className="absolute inset-x-4 bottom-4 sm:inset-x-5 sm:bottom-5 md:inset-x-6 md:bottom-6 z-10 flex items-end justify-between gap-4">
          <div>
            <h3 className="text-2xl md:text-3xl font-bold text-white leading-snug line-clamp-2">
              Event Photos & Highlights
            </h3>
            <p className="mt-2 text-sm md:text-base text-white/80 line-clamp-2">
              Browse photo albums from our workshops, networking events, and community gatherings.
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/90 text-gray-900 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
            <ArrowUpRight className="h-6 w-6" />
          </div>
        </div>
      </Card>
    </Link>
  );
}

