import { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";
import { NewsletterGrid } from "@/components/newsletters";
import { AlbumGrid } from "@/components/gallery";
import { SpotifyEmbed } from "@/components/spotify/spotify-embed";
import { ResourcesNewsSection } from "@/components/sections/resources";
import { SPOTIFY_SHOW, getSpotifyShowUrl } from "@/lib/data/spotify-podcasts";
import { getGalleryStats } from "@/lib/data/gallery-albums";
import { getNewsletterStats } from "@/lib/data/newsletters";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Library,
  Camera,
  Mic,
  Mail,
  FileText,
  ExternalLink,
  Download,
  Award,
  Users,
  Calendar,
  Images,
  FolderOpen,
  Sparkles,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Resources | She Sharp",
  description:
    "Explore She Sharp's podcasts, newsletters, photo gallery, press coverage, and impact reports.",
};

export default function ResourcesPage() {
  const galleryStats = getGalleryStats();
  const newsletterStats = getNewsletterStats();

  return (
    <>
      {/* Hero Section */}
      <Section className="bg-surface-purple py-24 md:py-32 lg:py-40" noPadding>
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
              Explore our collection of podcasts, newsletters, photos, press
              coverage, and impact reports.
            </p>
          </AnimateOnScroll>
        </Container>
      </Section>

      {/* Section 1: Photo Gallery */}
      <Section id="gallery" bgColor="white" className="py-24 md:py-32" noPadding>
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
      <Section id="podcasts" className="bg-surface-periwinkle py-24 md:py-32" noPadding>
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

      {/* Section 3: Newsletters */}
      <Section id="newsletters" bgColor="white" className="py-24 md:py-32" noPadding>
        <Container size="full">
          <AnimateOnScroll variant="fade-up" className="mb-12 md:mb-16">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-purple-dark/10 rounded-xl">
                    <Mail className="h-6 w-6 text-purple-dark" />
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold">Newsletters</h2>
                </div>
                <p className="text-muted-foreground max-w-2xl text-base md:text-lg">
                  Browse our newsletter archive for updates, events, and inspiring
                  stories from the She Sharp community.
                </p>
              </div>
              <div className="flex flex-wrap gap-4 sm:gap-6">
                <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-full">
                  <span className="text-sm font-medium">{newsletterStats.monthlyCount} Monthly</span>
                </div>
                <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-full">
                  <span className="text-sm font-medium">{newsletterStats.eventCount} Events</span>
                </div>
              </div>
            </div>
          </AnimateOnScroll>
          <AnimateOnScroll variant="fade-up" delay={100}>
            <NewsletterGrid />
          </AnimateOnScroll>
        </Container>
      </Section>

      {/* Section 4: News & Press */}
      <ResourcesNewsSection />

      {/* Section 5: Impact Report */}
      <Section id="impact" className="bg-surface-purple py-24 md:py-32" noPadding>
        <Container size="content">
          <AnimateOnScroll variant="fade-up" className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 bg-purple-dark/10 text-purple-dark px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Annual Report
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Impact Report
            </h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
              Our annual progress and measurable outcomes empowering women in STEM.
            </p>
          </AnimateOnScroll>

          {/* Featured Report Card */}
          <AnimateOnScroll variant="fade-up" delay={100}>
            <Card className="border-2 border-purple-dark/20 shadow-xl mb-8 md:mb-12 bg-background">
              <CardContent className="p-8 md:p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-dark/10 rounded-2xl mb-6">
                  <Download className="h-8 w-8 text-purple-dark" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  2024 Annual Impact Report
                </h3>
                <p className="text-muted-foreground mb-8 max-w-xl mx-auto text-base md:text-lg">
                  Our comprehensive annual report showcases the growth,
                  achievements, and impact of our programs.
                </p>
                <Button size="lg" variant="brand">
                  <Download className="mr-2 h-5 w-5" />
                  Download Impact Report (PDF)
                </Button>
              </CardContent>
            </Card>
          </AnimateOnScroll>

          {/* Highlights & Looking Ahead Grid */}
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-12">
            <AnimateOnScroll variant="fade-up" delay={150}>
              <Card className="h-full bg-background hover:shadow-lg transition-shadow">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-purple-dark/10 rounded-xl">
                      <Award className="h-6 w-6 text-purple-dark" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold">2024 Highlights</h3>
                  </div>
                  <ul className="space-y-4">
                    {[
                      "Launched THRIVE career program with strong participant outcomes",
                      "Expanded mentorship matching and strategic partnerships",
                      "Hosted Google Educator Conference with record attendance",
                    ].map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="mt-1.5 h-2 w-2 rounded-full bg-purple-dark flex-shrink-0" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </AnimateOnScroll>

            <AnimateOnScroll variant="fade-up" delay={200}>
              <Card className="h-full bg-background hover:shadow-lg transition-shadow">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-purple-mid/10 rounded-xl">
                      <Users className="h-6 w-6 text-purple-mid" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold">Looking Ahead</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    We will expand mentorship and launch new initiatives to
                    accelerate career growth. We&apos;ll also deepen
                    partnerships to create more opportunities across STEM.
                  </p>
                  <div className="mt-6 pt-6 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      Join us in making a difference in the tech community.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </AnimateOnScroll>
          </div>

          {/* Historical Reports */}
          <AnimateOnScroll variant="fade-up" delay={250}>
            <div className="text-center bg-background rounded-2xl p-6 md:p-8">
              <h3 className="text-xl md:text-2xl font-bold mb-6">Previous Impact Reports</h3>
              <div className="flex flex-wrap justify-center gap-4">
                {[2023, 2022, 2021].map((year) => (
                  <Button key={year} variant="outline" size="lg">
                    <Calendar className="mr-2 h-4 w-4" />
                    {year} Report
                  </Button>
                ))}
              </div>
            </div>
          </AnimateOnScroll>
        </Container>
      </Section>
    </>
  );
}
