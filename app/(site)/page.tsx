import { Metadata } from "next";
import { HeroSection } from "@/components/home/hero-section";
import { EventsShowcaseSection } from "@/components/home/events-showcase-section";
import { ScrollingSponsorsSection } from "@/components/home/scrolling-sponsors-section";
import { CoreImpactSection } from "@/components/home/core-impact-section";
import { ArchiveFilmstripSection } from "@/components/home/archive-filmstrip-section";
import { PhotoDividerSection } from "@/components/home/photo-divider-section";
import { ProgramsSection } from "@/components/home/programs-section";
import { VideoShowcaseSection } from "@/components/home/video-showcase-section";
import { HomeTestimonialsSection } from "@/components/home/testimonials-section";
import { NewsletterCTASection } from "@/components/home/newsletter-cta-section";
import { SponsorsSection } from "@/components/home/sponsors-section";
import { CTASection } from "@/components/home/CTA-section";
import { GeoHead, GEO_INSTRUCTIONS } from "@/components/seo/geo-head";
import { getEventsHeldCount } from "@/lib/data/events";
import { buildHomeImpactData } from "@/lib/data/stats";

export const metadata: Metadata = {
  title: { absolute: "She Sharp | Empowering Women in STEM" },
  description:
    "She Sharp is a nonprofit organisation dedicated to empowering women in STEM through mentorship, events, workshops, and community support across New Zealand.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <div className="relative isolate">
      <GeoHead instructions={GEO_INSTRUCTIONS.home} />

      <HeroSection />
      <EventsShowcaseSection />
      <ScrollingSponsorsSection />
      <CoreImpactSection items={buildHomeImpactData(getEventsHeldCount())} />
      <ArchiveFilmstripSection />
      <PhotoDividerSection />
      <ProgramsSection />
      <VideoShowcaseSection />
      <HomeTestimonialsSection />
      <NewsletterCTASection />
      <SponsorsSection />
      <CTASection />
    </div>
  );
}
