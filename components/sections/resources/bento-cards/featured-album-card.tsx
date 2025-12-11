"use client";

import { Card } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import type { GalleryAlbum } from "@/types/gallery";

interface FeaturedAlbumCardProps {
  album: GalleryAlbum;
}

/**
 * Featured album card for the mainFeature slot.
 * Displays the hero image of a featured album with overlay text.
 */
export function FeaturedAlbumCard({ album }: FeaturedAlbumCardProps) {
  return (
    <a
      href={album.googlePhotosUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block h-full group"
      aria-label={`View ${album.title} album in Google Photos`}
    >
      <Card className="relative h-full w-full overflow-hidden border-0 shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 rounded-[50px]">
        {/* Hero Image */}
        <img
          src={album.coverImage}
          alt={album.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Top Badge */}
        <div className="absolute top-8 left-8 z-10">
          <div className="rounded-full bg-white/90 backdrop-blur-sm px-4 py-1.5">
            <p className="text-sm font-semibold text-purple-dark">Featured Album</p>
          </div>
        </div>

        {/* External Link Icon */}
        <div className="absolute top-8 right-8 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="rounded-full bg-white/90 backdrop-blur-sm p-2">
            <ExternalLink className="h-4 w-4 text-purple-dark" />
          </div>
        </div>

        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
          <p className="text-xs font-medium text-white/80 uppercase tracking-wider mb-2">
            {album.date} • {album.location}
          </p>
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 line-clamp-2">
            {album.title}
          </h3>
          <p className="text-sm text-white/90 mb-4 line-clamp-2">
            {album.description}
          </p>
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/80">
              {album.photoCount} photos
            </span>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-white group-hover:text-purple-light transition-colors">
              View Album
              <ExternalLink className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </Card>
    </a>
  );
}
