import { MentorsHeroSection } from "@/components/sections/mentorship/mentors/mentors-hero-section";
import { MentorsListSection } from "@/components/sections/mentorship/mentors/mentors-list-section";
import { MentorJourneySection } from "@/components/sections/mentorship/mentors/mentor-journey-section";

export default function MeetOurMentorsPage() {
  return (
    <>
      <MentorsHeroSection />
      <MentorsListSection />
      <MentorJourneySection />
    </>
  );
}