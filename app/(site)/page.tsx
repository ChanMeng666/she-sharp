import "@/styles/animations/hero.css";
import { HeroSection } from "@/components/home/hero-section";
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
    </>
  );
}