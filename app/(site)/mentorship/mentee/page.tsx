"use client";

import { MentorshipHeroSection } from "@/components/mentorship/mentorship-hero-section";
import { BenefitsSection } from "@/components/mentorship/benefits-section";
import { Trophy, Rocket, Users } from "lucide-react";
import { MenteeResponsibilitiesSection } from "@/components/mentorship/mentee/mentee-responsibilities-section";
import { BecomeMenteeCTASection } from "@/components/mentorship/mentee/become-mentee-cta-section";
import { StickyApplyBar } from "@/components/mentorship/sticky-apply-bar";

export default function MenteeApplicationPage() {
  return (
    <>
      <MentorshipHeroSection
        topLeftTitle={
          <>
            BECOME A
            <br />
            MENTEE
          </>
        }
        topLeftBgColor="bg-brand"
        topRightImage="/img/mentees.jpg"
        topRightImageAlt="She Sharp mentorship programme"
        bottomLeftVideo="/video/Mentee-Video.mp4"
        bottomRightTitle="Learn and be inspired by our empowering mentors in STEM"
        bottomRightDescription="Gain valuable advice, inspiration, and empowerment from our amazing mentors in STEM to support your personal and professional development journey."
      />
      <BenefitsSection
        title="Benefits of Becoming a Mentee"
        benefits={[
          {
            icon: Trophy,
            title: "Personalised direction and evaluation",
            description:
              "Get personalised guidance and feedback from your mentor, tailored to your specific needs and goals.",
          },
          {
            icon: Rocket,
            title: "Navigate your growth",
            description:
              "Identify your strengths and areas for improvement, guiding you towards becoming the best version of yourself.",
          },
          {
            icon: Users,
            title: "Opportunities for career growth",
            description:
              "Seize the opportunity to advance in your professional journey and confidently achieve your career goals.",
          },
        ]}
      />

      <MenteeResponsibilitiesSection />

      <BecomeMenteeCTASection />

      <StickyApplyBar
        href="/mentorship/mentee/apply"
        label="Apply to Become a Mentee"
        accentColor="bg-purple-dark"
      />
    </>
  );
}
