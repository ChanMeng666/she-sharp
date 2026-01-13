import { TestimonialsSection } from "@/components/sections/mentorship/testimonials-section";
import { HowItWorksSection } from "@/components/sections/mentorship/how-it-works-section";
import { MentorsListSection } from "@/components/sections/mentorship/mentors/mentors-list-section";
import { MentorshipHeroSection } from "@/components/sections/mentorship/mentorship-hero-section";

export default function MentorshipPage() {
  return (
    <>
      <MentorshipHeroSection
        topLeftTitle={
          <>
            MENTORSHIP
            <br />
            PROGRAM
          </>
        }
        topRightImage="https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/public/img/home-page-ai-hackathon-2025-mentorship.jpg"
        topRightImageAlt="Women in technology mentorship program group photo"
        bottomLeftVideo="/video/Mentorship.mp4"
        bottomRightTitle="Empowering Women in STEM"
        bottomRightTitleHighlight="through mentoring"
        bottomRightDescription="Our mentorship program facilitates supportive relationships between our mentors and mentees. Through sharing knowledge, advice, and encouragement, we help mentees navigate careers, overcome challenges, and achieve interpersonal goals."
      />
      <HowItWorksSection />
      <MentorsListSection />
      <TestimonialsSection />
    </>
  );
}
