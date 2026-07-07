"use client";

import { ArrowUpRight } from "lucide-react";
import { CurtainReveal } from "@/components/ui/reveal";
import type { GalleryAlbum } from "@/types/gallery";

interface AlbumCardProps {
  album: GalleryAlbum;
  compact?: boolean;
}

/**
 * Album card — image-top hairline card linking out to a Google Photos album.
 */
export function AlbumCard({ album, compact = false }: AlbumCardProps) {
  return (
    <a
      href={album.googlePhotosUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block h-full"
      aria-label={`View ${album.title} album in Google Photos`}
    >
      <article className="flex h-full flex-col overflow-hidden rounded-[32px] border border-border bg-background transition-colors duration-300 group-hover:border-foreground/30">
        <CurtainReveal className="relative aspect-[4/3] overflow-hidden">
          <img
            src={album.coverImage}
            alt={album.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        </CurtainReveal>
        <div className="flex flex-1 flex-col p-5 md:p-6">
          {!compact && (
            <p className="text-label text-ink-500">{album.date}</p>
          )}
          <h3 className="mt-2 flex items-start justify-between gap-3 text-base font-semibold text-foreground sm:text-lg">
            <span className="line-clamp-2">{album.title}</span>
            <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-brand transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </h3>
        </div>
      </article>
    </a>
  );
}
