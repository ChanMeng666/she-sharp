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
import { UpcomingEventSection } from "@/components/home/upcoming-event-section";
import { SponsorsSection } from "@/components/home/sponsors-section";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <CoreImpactSection />
      <CoreValuesSection />
      <ProgramsSection />
      <UpcomingEventSection />
      <SponsorsSection />
      <CTASection />
    </>
  );
}