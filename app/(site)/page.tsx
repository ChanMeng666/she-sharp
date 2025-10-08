import "./hero-animations.css";
import { HeroSection } from "@/components/sections/hero-section";
import { CoreImpactSection } from "@/components/sections/core-impact-section";
import { CoreValuesSection } from "@/components/sections/core-values-section";
import { ProgramsSection } from "@/components/sections/programs-section";
import { UpcomingEventSection } from "@/components/sections/upcoming-event-section";
import { CommunityStoriesSection } from "@/components/sections/community-stories-section";
import { SponsorsSection } from "@/components/sections/sponsors-section";
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <CoreImpactSection />
      <CoreValuesSection />
      <ProgramsSection />
      <UpcomingEventSection />
      <CommunityStoriesSection />
      <SponsorsSection />
    </>
  );
}