import { Metadata } from "next";
import { HeroSection } from "@/components/home/hero-section";
import { EventsShowcaseSection } from "@/components/home/events-showcase-section";
import { ScrollingSponsorsSection } from "@/components/home/scrolling-sponsors-section";
import { CoreImpactSection } from "@/components/home/core-impact-section";
import { PhotoDividerSection } from "@/components/home/photo-divider-section";
import { ProgramsSection } from "@/components/home/programs-section";
import { VideoShowcaseSection } from "@/components/home/video-showcase-section";
import { HomeTestimonialsSection } from "@/components/home/testimonials-section";
import { SponsorsSection } from "@/components/home/sponsors-section";
import { CTASection } from "@/components/home/CTA-section";
import { GeoHead, GEO_INSTRUCTIONS } from "@/components/seo/geo-head";

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
      <CoreImpactSection />
      <PhotoDividerSection />
      <ProgramsSection />
      <VideoShowcaseSection />
      <HomeTestimonialsSection />
      <SponsorsSection />
      <CTASection />
    </div>
  );
}
