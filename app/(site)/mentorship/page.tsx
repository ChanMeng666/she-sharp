import { MentorshipHeroSection } from "@/components/sections/mentorship/mentorship-hero-section";
import { ProgramOverviewSection } from "@/components/sections/mentorship/program-overview-section";
// removed StatsSection (metrics will live inside ProgramOverviewSection)
import { TestimonialsSection } from "@/components/sections/mentorship/testimonials-section";
import { HowItWorksSection } from "@/components/sections/mentorship/how-it-works-section";
import { MentorsPreviewSection } from "@/components/sections/mentorship/mentors-preview-section";
// removed BenefitsSection (merged into ProgramOverviewSection content)
import { IndustryLogosSection } from "@/components/sections/mentorship/industry-logos-section";
import { SmartCTASection } from "@/components/sections/shared/smart-cta-section";

export default function MentorshipPage() {
  return (
    <>
      <MentorshipHeroSection />
      <ProgramOverviewSection />
      <HowItWorksSection />
      <MentorsPreviewSection />
      <IndustryLogosSection />
      <TestimonialsSection />
      <SmartCTASection title="Start Your Mentorship Journey" />
    </>
  );
}