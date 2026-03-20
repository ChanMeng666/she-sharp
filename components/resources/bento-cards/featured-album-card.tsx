"use client";

import { Card } from "@/components/ui/card";
import { ExternalLink, Images } from "lucide-react";
import type { GalleryAlbum } from "@/types/gallery";

interface FeaturedAlbumCardProps {
  album: GalleryAlbum;
}

/**
 * Featured album card for the mainFeature slot.
 * Displays a prominent card for the featured album.
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
      <Card className="relative h-full w-full border-0 shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 card-lg">
        {/* Cover Image */}
        <img
          src={album.coverImage}
          alt={album.title}
          className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-auto min-w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Top Badge */}
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 md:top-8 md:left-8 z-10">
          <div className="glass-pill bg-white/90 px-4 py-1.5">
            <p className="text-sm font-semibold text-purple-dark">Featured Album</p>
          </div>
        </div>

        {/* External Link Icon */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 md:top-8 md:right-8 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="glass-pill bg-white/90 p-2">
            <ExternalLink className="h-4 w-4 text-purple-dark" />
          </div>
        </div>

        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 z-10">
          <p className="text-xs font-medium text-white/80 uppercase tracking-wider mb-2">
            {album.date}
          </p>
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 line-clamp-2">
            {album.title}
          </h3>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-white group-hover:text-purple-light transition-colors">
              <Images className="h-4 w-4" />
              View Album
              <ExternalLink className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </Card>
    </a>
  );
}
