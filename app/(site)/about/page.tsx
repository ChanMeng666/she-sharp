"use client";

import SmoothScrollHero from "@/components/about/smooth-scroll-hero";
import { TeamSection } from "@/components/about/team-section";
import { TimelineSection } from "@/components/about/timeline-section";
import { useScrollToHash } from "@/hooks/use-scroll-to-hash";
import { FounderQuote } from "@/components/about/founder-quote";

export default function AboutPage() {
  // 使用自定义 hook 处理 hash 滚动
  useScrollToHash();

  return (
    <div className="relative overflow-hidden">

      <SmoothScrollHero />
      <FounderQuote />
      
      <div id="timeline">
        <TimelineSection />
      </div>

      <div id="team">
        <TeamSection />
      </div>
    </div>
  );
}
