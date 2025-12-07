import { TestimonialsSection } from "@/components/sections/mentorship/testimonials-section";
import { HowItWorksSection } from "@/components/sections/mentorship/how-it-works-section";
import { MentorsListSection } from "@/components/sections/mentorship/mentors/mentors-list-section";

export default function MentorshipPage() {
  return (
    <>
      <HowItWorksSection />
      <MentorsListSection />
      <TestimonialsSection />
    </>
  );
}