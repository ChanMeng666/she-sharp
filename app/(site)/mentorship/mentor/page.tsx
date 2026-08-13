"use client";

import { MentorshipHeroSection } from "@/components/mentorship/mentorship-hero-section";
import { BenefitsSection } from "@/components/mentorship/benefits-section";
import { Trophy, Rocket, Users } from "lucide-react";
import { BecomeMentorCTASection } from "@/components/mentorship/mentor/become-mentor-cta-section";
import { MentorResponsibilitiesSection } from "@/components/mentorship/mentor/mentor-responsibilities-section";
import { StickyApplyBar } from "@/components/mentorship/sticky-apply-bar";
import { MENTOR_VIDEO } from "@/lib/config/assets";
import { isMentorshipOpen } from "@/lib/config/mentorship";

export default function BecomeMentorPage() {
  const applicationsOpen = isMentorshipOpen();
  return (
    <>
      <MentorshipHeroSection
        eyebrow="Become a Mentor"
        title={
          <>
            Become
            <br />
            a mentor
          </>
        }
        image="/img/mentors.jpg"
        imageAlt="She Sharp mentorship programme"
        video={MENTOR_VIDEO}
        detailEyebrow="Your impact"
        detailTitle="Share your wisdom and inspire more women in STEM"
        detailDescription="Use your experience to guide, inspire, and empower women, fostering their personal and career growth journeys to achieve success and fulfilment in STEM fields."
      />
      <BenefitsSection
        title="Benefits of becoming a mentor"
        eyebrow="Why mentor"
        benefits={[
          {
            icon: Trophy,
            title: "Personal Fulfilment",
            description:
              "Find satisfaction in witnessing the growth and success of your mentee. Knowing you've played a part in their journey is genuinely rewarding.",
          },
          {
            icon: Rocket,
            title: "Leave a positive mark",
            description:
              "Leave behind a positive impact that lasts long after your interactions. It's about making a difference, one mentee at a time!",
          },
          {
            icon: Users,
            title: "Grow as you guide",
            description:
              "Develop strong leadership and communication abilities as you support your mentee. It's a win-win: they flourish, and you thrive right alongside them.",
          },
        ]}
      />

      <MentorResponsibilitiesSection />

      <BecomeMentorCTASection />

      {applicationsOpen && (
        <StickyApplyBar
          href="/mentorship/mentor/apply"
          label="Apply to be a Mentor"
          hideAtId="become-mentor-cta"
        />
      )}
    </>
  );
}
