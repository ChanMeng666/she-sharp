import { MentorshipHeroSection } from "@/components/sections/mentorship/mentorship-hero-section";
import { ProgramOverviewSection } from "@/components/sections/mentorship/program-overview-section";
import { TestimonialsSection } from "@/components/sections/mentorship/testimonials-section";
import { HowItWorksSection } from "@/components/sections/mentorship/how-it-works-section";
import { MentorsPreviewSection } from "@/components/sections/mentorship/mentors-preview-section";

export default function MentorshipPage() {
  return (
    <>
      <MentorshipHeroSection />
      <ProgramOverviewSection />
      <HowItWorksSection />
      <MentorsPreviewSection />
      <TestimonialsSection />
    </>
  );
}