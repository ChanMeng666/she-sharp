"use client";

import { CalendarDays, MapPin, Images } from "lucide-react";
import { AnimatedAlbumCard } from "@/components/ui/animated-album-card";
import type { GalleryAlbum } from "@/types/gallery";
import { getCategoryLabel } from "@/lib/data/gallery-albums";

interface AlbumCardProps {
  album: GalleryAlbum;
  priority?: boolean;
}

const DEFAULT_PREVIEW_IMAGES = [
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=400&h=300&fit=crop",
];

export function AlbumCard({ album }: AlbumCardProps) {
  const images = album.previewImages?.length
    ? album.previewImages
    : [album.coverImage, ...DEFAULT_PREVIEW_IMAGES.slice(0, 2)];

  const stats = [
    {
      icon: <CalendarDays className="h-4 w-4" />,
      label: album.date,
    },
    ...(album.location
      ? [
          {
            icon: <MapPin className="h-4 w-4" />,
            label: album.location,
          },
        ]
      : []),
    ...(album.photoCount
      ? [
          {
            icon: <Images className="h-4 w-4" />,
            label: `${album.photoCount} photos`,
          },
        ]
      : []),
  ];

  return (
    <AnimatedAlbumCard
      title={album.title}
      images={images}
      stats={stats}
      description={
        album.description ||
        `${getCategoryLabel(album.category)} - View photos from this event`
      }
      href={album.googlePhotosUrl}
    />
  );
}
