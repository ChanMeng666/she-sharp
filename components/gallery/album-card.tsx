"use client";

import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin, Images, ExternalLink } from "lucide-react";
import type { GalleryAlbum } from "@/types/gallery";
import { getCategoryLabel } from "@/lib/data/gallery-albums";

interface AlbumCardProps {
  album: GalleryAlbum;
  priority?: boolean;
}

export function AlbumCard({ album, priority = false }: AlbumCardProps) {
  return (
    <a
      href={album.googlePhotosUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
      <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300">
        {/* Cover Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={album.coverImage}
            alt={album.title}
            fill
            priority={priority}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* External link indicator */}
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <ExternalLink className="h-4 w-4 text-foreground" />
          </div>

          {/* Featured badge */}
          {album.isFeatured && (
            <Badge className="absolute top-3 left-3 bg-purple-dark text-white">
              Featured
            </Badge>
          )}

          {/* Photo count overlay */}
          {album.photoCount && (
            <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5 text-sm font-medium">
              <Images className="h-4 w-4" />
              <span>{album.photoCount}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-2">
          {/* Category */}
          <Badge variant="secondary" className="text-xs">
            {getCategoryLabel(album.category)}
          </Badge>

          {/* Title */}
          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-purple-dark transition-colors">
            {album.title}
          </h3>

          {/* Description */}
          {album.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {album.description}
            </p>
          )}

          {/* Meta info */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
            <div className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              <span>{album.date}</span>
            </div>
            {album.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                <span>{album.location}</span>
              </div>
            )}
          </div>

          {/* View prompt */}
          <div className="flex items-center gap-2 text-purple-dark font-medium text-sm pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <span>View in Google Photos</span>
            <ExternalLink className="h-4 w-4" />
          </div>
        </div>
      </Card>
    </a>
  );
}
