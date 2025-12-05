import { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";
import { AlbumGrid } from "@/components/gallery";
import { SpotifyEmbed } from "@/components/spotify/spotify-embed";
import { ResourcesNewsSection, ImpactReportCards, ResourcesPageClient } from "@/components/sections/resources";
import { SPOTIFY_SHOW, getSpotifyShowUrl } from "@/lib/data/spotify-podcasts";
import { getGalleryStats } from "@/lib/data/gallery-albums";
import { Button } from "@/components/ui/button";
import {
  Library,
  Camera,
  Mic,
  ExternalLink,
  Images,
  FolderOpen,
  Sparkles,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Resources | She Sharp",
  description:
    "Explore She Sharp's podcasts, photo gallery, press coverage, and impact reports.",
};

export default function ResourcesPage() {
  const galleryStats = getGalleryStats();

  return (
    <ResourcesPageClient>
      {/* Hero Section */}
      <Section className="bg-transparent py-24 md:py-32 lg:py-40" noPadding>
        <Container size="content">
          <AnimateOnScroll variant="fade-up" className="text-center">
            <div className="inline-flex items-center gap-2 bg-purple-dark/10 text-purple-dark px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Library className="h-4 w-4" />
              Resources Hub
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Resources
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Explore our collection of podcasts, photos, press coverage, and
              impact reports.
            </p>
          </AnimateOnScroll>
        </Container>
      </Section>

      {/* Section 1: Photo Gallery */}
      <Section id="gallery" className="bg-transparent py-24 md:py-32" noPadding>
        <Container size="full">
          <AnimateOnScroll variant="fade-up" className="mb-12 md:mb-16">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-purple-dark/10 rounded-xl">
                    <Camera className="h-6 w-6 text-purple-dark" />
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold">Photo Gallery</h2>
                </div>
                <p className="text-muted-foreground max-w-2xl text-base md:text-lg">
                  Explore photo albums from our events, conferences, workshops, and
                  celebrations. Click on any album to view photos in Google Photos.
                </p>
              </div>
              <div className="flex flex-wrap gap-4 sm:gap-6">
                <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-full">
                  <FolderOpen className="h-4 w-4 text-purple-dark" />
                  <span className="text-sm font-medium">{galleryStats.totalAlbums} Albums</span>
                </div>
                <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-full">
                  <Images className="h-4 w-4 text-purple-dark" />
                  <span className="text-sm font-medium">{galleryStats.totalPhotos}+ Photos</span>
                </div>
              </div>
            </div>
          </AnimateOnScroll>
          <AnimateOnScroll variant="fade-up" delay={100}>
            <AlbumGrid />
          </AnimateOnScroll>
        </Container>
      </Section>

      {/* Section 2: Podcasts */}
      <Section id="podcasts" className="bg-transparent py-24 md:py-32" noPadding>
        <Container size="content">
          <AnimateOnScroll variant="fade-up" className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 bg-purple-mid/10 text-purple-mid px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Mic className="h-4 w-4" />
              Listen Now
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              {SPOTIFY_SHOW.name}
            </h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
              {SPOTIFY_SHOW.description}
            </p>
          </AnimateOnScroll>

          <AnimateOnScroll variant="fade-up" delay={100}>
            <div className="bg-background rounded-2xl p-4 md:p-6 shadow-lg">
              <SpotifyEmbed type="show" id={SPOTIFY_SHOW.showId} height={352} />
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll variant="fade-up" delay={200} className="text-center mt-8">
            <Button asChild variant="outline" size="lg" className="bg-background">
              <a
                href={getSpotifyShowUrl()}
                target="_blank"
                rel="noopener noreferrer"
              >
                View All Episodes on Spotify
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </AnimateOnScroll>
        </Container>
      </Section>

      {/* Section 3: News & Press */}
      <ResourcesNewsSection />

      {/* Section 4: Impact Report */}
      <Section id="impact" className="bg-transparent py-24 md:py-32" noPadding>
        <Container size="content">
          <AnimateOnScroll variant="fade-up" className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 bg-purple-dark/10 text-purple-dark px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Annual Report
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Impact Report
            </h2>
          </AnimateOnScroll>

          {/* Report Download Cards */}
          <AnimateOnScroll variant="fade-up" delay={100}>
            <ImpactReportCards />
          </AnimateOnScroll>
        </Container>
      </Section>
    </ResourcesPageClient>
  );
}
