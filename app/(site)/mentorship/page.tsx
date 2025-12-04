import { MentorshipHeroSection } from "@/components/sections/mentorship/mentorship-hero-section";
import { TestimonialsSection } from "@/components/sections/mentorship/testimonials-section";
import { HowItWorksSection } from "@/components/sections/mentorship/how-it-works-section";
import { MentorsPreviewSection } from "@/components/sections/mentorship/mentors-preview-section";

export default function MentorshipPage() {
  return (
    <>
      <MentorshipHeroSection />
      <HowItWorksSection />
      <MentorsPreviewSection />
      <TestimonialsSection />
    </>
  );
}