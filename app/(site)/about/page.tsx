"use client";

import SmoothScrollHero from "@/components/about/smooth-scroll-hero";
import { TeamSection } from "@/components/about/team-section";
import { TimelineSection } from "@/components/about/timeline-section";
import { useScrollToHash } from "@/hooks/use-scroll-to-hash";
import { FounderQuote } from "@/components/about/founder-quote";
import { OurJourneyVideo } from "@/components/about/our-journey-video";

export default function AboutPage() {
  useScrollToHash();

  return (
    <div className="relative overflow-hidden">

      <SmoothScrollHero />
      <FounderQuote />
      <OurJourneyVideo />

      <div id="timeline">
        <TimelineSection />
      </div>

      <div id="team">
        <TeamSection />
      </div>
    </div>
  );
}
