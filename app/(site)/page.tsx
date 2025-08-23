import "./hero-animations.css";
import { HeroSection } from "@/components/sections/hero-section";
import { CoreImpactSection } from "@/components/sections/core-impact-section";
import { ProgramsSection } from "@/components/sections/programs-section";
import { CommunityStoriesSection } from "@/components/sections/community-stories-section";
import { MediaSection } from "@/components/sections/media-section";
import { SponsorsSection } from "@/components/sections/sponsors-section";
import { SmartCTASection } from "@/components/sections/shared/smart-cta-section";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <CoreImpactSection />
      <ProgramsSection />
      <CommunityStoriesSection />
      <MediaSection />
      <SponsorsSection />
      <SmartCTASection title="Get Involved" />
    </>
  );
}