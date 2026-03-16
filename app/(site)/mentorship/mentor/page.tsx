"use client";

import { MentorshipHeroSection } from "@/components/mentorship/mentorship-hero-section";
import { BenefitsSection } from "@/components/mentorship/benefits-section";
import { Trophy, Rocket, Users } from "lucide-react";
import { BecomeMentorCTASection } from "@/components/mentorship/mentor/become-mentor-cta-section";
import { MentorResponsibilitiesSection } from "@/components/mentorship/mentor/mentor-responsibilities-section";

export default function BecomeMentorPage() {
  return (
    <>
      <MentorshipHeroSection
        topLeftTitle={
          <>
            BECOME A
            <br />
            MENTOR
          </>
        }
        topRightImage="/img/mentors.jpg"
        topRightImageAlt="She Sharp mentorship programme"
        bottomLeftVideo="/video/Mentor-Video.mp4"
        bottomRightTitle="Share your wisdom and inspire more Women in STEM "
        bottomRightDescription="Use your experience to guide, inspire, and empower women, fostering their personal and career growth journeys to achieve success and fulfilment in STEM fields."
      />
      <BenefitsSection
        title="Benefits of Becoming a Mentor"
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
    </>
  );
}
