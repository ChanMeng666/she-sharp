"use client";

import { AboutHeroSection } from "@/components/sections/about/about-hero-section";
import { StatsDashboard } from "@/components/sections/about/stats-dashboard";
import { TeamSection } from "@/components/sections/about/team-section";
import { TimelineSection } from "@/components/sections/about/timeline-section";
import { ValuesCollageSection } from "@/components/sections/about/values-collage-section";
import { JoinUsSection } from "@/components/sections/about/join-us-section";
import { SmartCTASection } from "@/components/sections/shared/smart-cta-section";
import { AnimatedWrapper } from "@/components/sections/about/animated-wrapper";
import { useScrollToHash } from "@/hooks/use-scroll-to-hash";
import Iridescence, { brandColors } from "@/components/effects/iridescence";

export default function AboutPage() {
  // 使用自定义 hook 处理 hash 滚动
  useScrollToHash();

  return (
    <div className="relative overflow-hidden">
      {/* Page-level Iridescence background (About-specific color) */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-30">
        <Iridescence
          color={brandColors.navAbout}
          mouseReact={false}
          amplitude={0.10}
          speed={0.25}
          className="w-full h-full"
        />
      </div>

      {/* Subtle top/bottom gradient fades to improve text contrast */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-16 bg-gradient-to-t from-transparent via-white/30 to-white" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent via-white/30 to-white" />

      <AboutHeroSection />
      
      <AnimatedWrapper animation="fade-up">
        <StatsDashboard />
      </AnimatedWrapper>
      
      <div id="team">
        <AnimatedWrapper animation="fade-up" delay={100}>
          <TeamSection />
        </AnimatedWrapper>
      </div>
      
      <AnimatedWrapper animation="fade-up" delay={150}>
        <TimelineSection />
      </AnimatedWrapper>
      
      <AnimatedWrapper animation="fade-up" delay={200}>
        <ValuesCollageSection />
      </AnimatedWrapper>
      
      <AnimatedWrapper animation="fade-up" delay={250}>
        <JoinUsSection />
      </AnimatedWrapper>
      
      <SmartCTASection title="Join Our Journey" />
    </div>
  );
}