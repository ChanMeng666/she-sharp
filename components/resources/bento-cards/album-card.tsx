"use client";

import { Card } from "@/components/ui/card";
import { Images } from "lucide-react";
import type { GalleryAlbum } from "@/types/gallery";

interface AlbumCardProps {
  album: GalleryAlbum;
  compact?: boolean;
}

/**
 * Album card component for displaying a Google Photos album.
 * Links to the album in Google Photos.
 */
export function AlbumCard({ album, compact = false }: AlbumCardProps) {
  return (
    <a
      href={album.googlePhotosUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block h-full group"
      aria-label={`View ${album.title} album in Google Photos`}
    >
      <Card className="relative h-full w-full overflow-hidden border-0 shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 rounded-[30px] aspect-[3/4]">
        {/* Cover Image */}
        <img
          src={album.coverImage}
          alt={album.title}
          className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-auto min-w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

        {/* View Photos Badge */}
        <div className="absolute top-6 right-6 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="glass-pill bg-white px-3 py-1.5 flex items-center gap-1.5">
            <Images className="h-3.5 w-3.5 text-purple-dark" />
            <span className="text-xs font-medium text-purple-dark">View Photos</span>
          </div>
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
          {!compact && (
            <p className="text-xs font-medium text-white/80 uppercase tracking-wider mb-1">
              {album.date}
            </p>
          )}
          <h3 className={`font-bold text-white line-clamp-2 ${compact ? "text-base" : "text-lg"}`}>
            {album.title}
          </h3>
        </div>
      </Card>
    </a>
  );
}
