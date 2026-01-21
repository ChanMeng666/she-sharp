"use client";

import { Section } from "@/components/layout/section";
import { Container } from "@/components/layout/container";
import { galleryAlbums } from "@/lib/data/gallery-albums";
import { AlbumCard } from "./bento-cards";

export function GalleryAlbumsGrid() {
  return (
    <Section spacing="section" className="py-16 md:py-24 lg:py-32">
      <Container size="full">
        <div className="mb-10 md:mb-14 ">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight ">
            Photo Gallery
          </h1>
          <p className="mt-3 text-base md:text-lg text-muted-foreground max-w-2xl">
            Explore highlights from She Sharp events, workshops, and community
            moments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {galleryAlbums.map((album) => (
            <AlbumCard key={album.googlePhotosUrl} album={album} />
          ))}
        </div>
      </Container>
    </Section>
  );
}
