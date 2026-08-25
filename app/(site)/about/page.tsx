import SmoothScrollHero from "@/components/about/smooth-scroll-hero";
import { TeamSection } from "@/components/about/team-section";
import { TimelineSection } from "@/components/about/timeline-section";
import { ArchiveMosaicSection } from "@/components/about/archive-mosaic-section";
import { ScrollToHash } from "@/components/layout/scroll-to-hash";
import { FounderQuote } from "@/components/about/founder-quote";
import { OurJourneyVideo } from "@/components/about/our-journey-video";
import { ValuesSection } from "@/components/about/values-section";

export default function AboutPage() {
  return (
    <div className="relative overflow-hidden">
      <ScrollToHash />

      <SmoothScrollHero />
      <FounderQuote />
      <OurJourneyVideo />

      <div id="values">
        <ValuesSection />
      </div>

      <div id="timeline">
        <TimelineSection />
      </div>

      <ArchiveMosaicSection />

      <div id="team">
        <TeamSection />
      </div>
    </div>
  );
}
