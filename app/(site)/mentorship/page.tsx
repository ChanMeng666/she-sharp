import { TestimonialsSection } from "@/components/mentorship/testimonials-section";
import { HowItWorksSection } from "@/components/mentorship/how-it-works-section";
import { MentorsListSection } from "@/components/mentorship/mentors/mentors-list-section";
import { MentorshipHeroSection } from "@/components/mentorship/mentorship-hero-section";

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
        topRightImage="/img/vercel-blob/home-page-ai-hackathon-2025-mentorship.jpg"
        topRightImageAlt="Women in technology mentorship program group photo"
        bottomLeftVideo="/video/Mentorship.mp4"
        bottomRightTitle="Empowering Women in STEM"
        bottomRightTitleHighlight="through Mentoring"
        bottomRightDescription="Our mentorship program facilitates supportive relationships between our mentors and mentees. Through sharing knowledge, advice, and encouragement, we help mentees navigate careers, overcome challenges, and achieve interpersonal goals."
      />
      <HowItWorksSection />
      <MentorsListSection />
      <TestimonialsSection />
    </>
  );
}
