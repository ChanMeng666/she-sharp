import { Metadata } from "next";
import Image from "next/image";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { GalleryAlbumsGrid } from "@/components/resources";
import { PhotoMosaic } from "@/components/ui/photo-mosaic";
import { PhotoBand } from "@/components/ui/photo-band";
import { VISIONWORKS_CREDIT } from "@/components/ui/photo-credit";
import { galleryAlbums } from "@/lib/data/gallery-albums";
import { getEventGalleryPhotos } from "@/lib/data/event-photo-set";
import { GALLERY_ARCHIVE_WALL, toBandPhotos } from "@/lib/data/site-photos";

export const metadata: Metadata = {
  title: "Photo Gallery",
  alternates: { canonical: "/resources/photo-gallery" },
  description:
    "Photographs from She Sharp events since 2014, including the full set from the Aotearoa AI Hackathon Festival 2026 at AUT City Campus.",
};

/**
 * The gallery page, which until now showed no photographs.
 *
 * It was a grid of album cards that each linked out to Google Photos, so the
 * one page on the site named "Photo Gallery" was the one place a visitor could
 * not actually see a photograph. The albums stay — they are the full sets, and
 * CONTENT_RULES.md is clear that the album, not the repo, is the home of event
 * photography — but they now sit under a wall of the photographs themselves.
 *
 * The `<h1>` moved here from `GalleryAlbumsGrid`, which is why that component
 * takes `showHeader`: two `<h1>`s on one page is a failure
 * `scripts/seo/verify-page-metadata.ts` checks for by name.
 */

const HACKATHON_SLUG = "aotearoa-ai-hackathon-festival-2026";

/**
 * The day-two panorama, used at its true 2.9:1 rather than cropped into a
 * viewport-height hero — at `fill` cover on a phone it becomes a band of
 * torsos with every face outside the frame.
 */
const PANORAMA = {
  src: `/img/events/${HACKATHON_SLUG}/photo-7.webp`,
  width: 1600,
  height: 553,
  alt: "Around ninety participants and organisers massed together for a whole-festival group photograph, gathered around a neon She Sharp sign beneath the Aotearoa AI Hackathon Festival banners.",
};

export default function PhotoGalleryPage() {
  const hackathonPhotos = getEventGalleryPhotos(HACKATHON_SLUG).filter(
    (p) => p.src !== PANORAMA.src
  );
  const archivePhotos = toBandPhotos(GALLERY_ARCHIVE_WALL);

  return (
    <>
      <Section spacing="section" className="pt-28 pb-10 md:pt-32 md:pb-14">
        <Container size="full">
          <div className="mb-8 max-w-3xl md:mb-12">
            <p className="text-label mb-4 text-brand">Photo Gallery</p>
            <h1 className="text-display-sm text-foreground">
              Event photos &amp; highlights
            </h1>
            <p className="mt-4 text-base text-ink-600 md:text-lg">
              Twelve years of rooms that filled up. Below is the full set from
              our largest event yet, then a walk back through the archive, then
              every album we have.
            </p>
          </div>

          <figure className="overflow-hidden rounded-[16px] border border-border bg-muted">
            <Image
              src={PANORAMA.src}
              alt={PANORAMA.alt}
              width={PANORAMA.width}
              height={PANORAMA.height}
              sizes="(max-width: 1536px) 100vw, 1440px"
              priority
              className="h-auto w-full"
            />
          </figure>
        </Container>
      </Section>

      <Section spacing="section" className="py-10 md:py-14">
        <Container size="full">
          <PhotoMosaic
            photos={hackathonPhotos}
            eyebrow="August 2026 — AUT City Campus"
            heading="Aotearoa AI Hackathon Festival"
            credit={VISIONWORKS_CREDIT}
          />
        </Container>
      </Section>

      {/*
        The transition between this year and the rest, and the reminder that
        there is a rest: decorative, so no lightbox and no alt text.
      */}
      <PhotoBand
        photos={archivePhotos}
        tileHeight="sm"
        reverse
        className="py-6 md:py-10"
      />

      <Section spacing="section" className="py-10 md:py-14">
        <Container size="full">
          <PhotoMosaic
            photos={archivePhotos.map((p) => ({
              src: p.src,
              alt: p.alt,
              width: p.width,
              height: p.height,
            }))}
            eyebrow="2014 onwards"
            heading="From the archive"
          />
        </Container>
      </Section>

      <Section spacing="section" className="pt-4">
        <Container size="full">
          <h2 className="text-display-sm text-foreground">Full albums</h2>
          <p className="mt-4 max-w-2xl text-base text-ink-600 md:text-lg">
            Every event with a public album, newest first. Each one opens in
            Google Photos, where the complete set lives.
          </p>
        </Container>
        <GalleryAlbumsGrid albums={galleryAlbums} showHeader={false} />
      </Section>
    </>
  );
}
