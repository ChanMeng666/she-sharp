import "./hero-animations.css";
import { HeroSection } from "@/components/sections/home/hero-section";
import { CoreImpactSection } from "@/components/sections/home/core-impact-section";
import { CoreValuesSection } from "@/components/sections/home/core-values-section";
import { ProgramsSection } from "@/components/sections/home/programs-section";
import { UpcomingEventSection } from "@/components/sections/home/upcoming-event-section";
import { CommunityStoriesSection } from "@/components/sections/home/community-stories-section";
import { CTASection } from "@/components/sections/home/cta-section";
import { SponsorsSection } from "@/components/sections/home/sponsors-section";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <CoreImpactSection />
      <CoreValuesSection />
      <ProgramsSection />
      <UpcomingEventSection />
      <CommunityStoriesSection />
      <CTASection />
      <SponsorsSection />
    </>
  );
}