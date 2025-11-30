import { MentorsHeroSection } from "@/components/sections/mentorship/mentors/mentors-hero-section";
import { MentorsCallToActionSection } from "@/components/sections/mentorship/mentors/mentors-call-to-action-section";
import { MentorsListSection } from "@/components/sections/mentorship/mentors/mentors-list-section";
import { MentorJourneySection } from "@/components/sections/mentorship/mentors/mentor-journey-section";
import { MentorCommunitySection } from "@/components/sections/mentorship/mentors/mentor-community-section";
import { MentorBenefitsSection } from "@/components/sections/mentorship/mentors/mentor-benefits-section";
import { PageTestimonialsSection } from "@/components/sections/shared/page-testimonials-section";

export default function MeetOurMentorsPage() {
  return (
    <>
      <MentorsHeroSection />
      <MentorsCallToActionSection />
      <MentorsListSection />
      <MentorJourneySection />
      <MentorCommunitySection />
      <MentorBenefitsSection />
      <PageTestimonialsSection
        title="Stories from Our Mentors"
        subtitle="Hear from mentors who are making a difference in the lives of women in STEM"
        pageKey="mentorship"
      />
    </>
  );
}