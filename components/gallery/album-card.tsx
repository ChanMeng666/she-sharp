"use client";

import { CalendarDays, Images } from "lucide-react";
import { AnimatedAlbumCard } from "@/components/ui/animated-album-card";
import type { GalleryAlbum } from "@/types/gallery";

interface AlbumCardProps {
  album: GalleryAlbum;
  priority?: boolean;
}

export function AlbumCard({ album }: AlbumCardProps) {
  const stats = [
    {
      icon: <CalendarDays className="h-4 w-4" />,
      label: album.date,
    },
    {
      icon: <Images className="h-4 w-4" />,
      label: "View Photos",
    },
  ];

  return (
    <AnimatedAlbumCard
      title={album.title}
      images={[album.coverImage]}
      stats={stats}
      description="View photos from this event"
      href={album.googlePhotosUrl}
    />
  );
}
