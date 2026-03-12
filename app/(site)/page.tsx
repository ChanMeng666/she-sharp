import { Metadata } from "next";
import "@/styles/animations/hero.css";
import { HeroSection } from "@/components/home/hero-section";
import { CTASection } from "@/components/home/CTA-section";

export const metadata: Metadata = {
  title: "She Sharp | Empowering Women in STEM",
  description:
    "She Sharp is a nonprofit organisation dedicated to empowering women in STEM through mentorship, events, workshops, and community support across New Zealand.",
};
import { CoreImpactSection } from "@/components/home/core-impact-section";
import { CoreValuesSection } from "@/components/home/core-values-section";
import { ProgramsSection } from "@/components/home/programs-section";
import { SponsorsSection } from "@/components/home/sponsors-section";
import { ScrollingSponsorsSection } from "@/components/home/scrolling-sponsors-section";
import { EventsShowcaseSection } from "@/components/home/events-showcase-section";
import { HomeTestimonialsSection } from "@/components/home/testimonials-section";

export default function HomePage() {
  return (
    <div className="relative isolate">
      <div
        className="fixed inset-0 z-[-1] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/img/bg-img.jpg)" }}
      />

      <HeroSection />
      <EventsShowcaseSection />
      <ScrollingSponsorsSection />
      <CoreImpactSection />
      <CoreValuesSection />
      <ProgramsSection />
      <HomeTestimonialsSection />
      <SponsorsSection />
      <CTASection />
    </div>
  );
}