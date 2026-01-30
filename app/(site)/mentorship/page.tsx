import { Metadata } from "next";
import { TestimonialsSection } from "@/components/mentorship/testimonials-section";
import { HowItWorksSection } from "@/components/mentorship/how-it-works-section";
import { MentorsListSection } from "@/components/mentorship/mentors/mentors-list-section";
import { MentorshipHeroSection } from "@/components/mentorship/mentorship-hero-section";

export const metadata: Metadata = {
  title: "Mentorship Programme | She Sharp",
  description:
    "Join She Sharp's mentorship programme to connect with experienced professionals in STEM. Get guidance, support, and grow your career in technology.",
};

export default function MentorshipPage() {
  return (
    <>
      <MentorshipHeroSection
        topLeftTitle={
          <>
            MENTORSHIP
            <br />
            PROGRAMME
          </>
        }
        topLeftBgColor="bg-white"
        topLeftTextColor="text-foreground"
        topRightImage="/img/gallery/home-page-ai-hackathon-2025-mentorship.jpg"
        topRightImageAlt="Women in technology mentorship programme group photo"
        bottomLeftVideo="/video/Mentorship.mp4"
        bottomRightTitle="Empowering Women in STEM"
        bottomRightTitleHighlight="through Mentoring"
        bottomRightDescription="Our mentorship programme facilitates supportive relationships between our mentors and mentees. Through sharing knowledge, advice, and encouragement, we help mentees navigate careers, overcome challenges, and achieve interpersonal goals."
      />
      <HowItWorksSection />
      <MentorsListSection />
      <TestimonialsSection />
    </>
  );
}
