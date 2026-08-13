"use client";

import { MentorshipHeroSection } from "@/components/mentorship/mentorship-hero-section";
import { BenefitsSection } from "@/components/mentorship/benefits-section";
import { Trophy, Rocket, Users } from "lucide-react";
import { MenteeResponsibilitiesSection } from "@/components/mentorship/mentee/mentee-responsibilities-section";
import { BecomeCTASection } from "@/components/mentorship/become-cta-section";
import { StickyApplyBar } from "@/components/mentorship/sticky-apply-bar";
import { MENTEE_VIDEO } from "@/lib/config/assets";
import { isMentorshipOpen } from "@/lib/config/mentorship";

export default function MenteeApplicationPage() {
  const applicationsOpen = isMentorshipOpen();
  return (
    <>
      <MentorshipHeroSection
        eyebrow="Become a Mentee"
        title={
          <>
            Become
            <br />
            a mentee
          </>
        }
        titlePanelDark
        image="/img/mentees.jpg"
        imageAlt="She Sharp mentorship programme"
        video={MENTEE_VIDEO}
        detailEyebrow="Your growth"
        detailTitle="Learn and be inspired by our empowering mentors in STEM"
        detailDescription="Gain valuable advice, inspiration, and empowerment from our amazing mentors in STEM to support your personal and professional development journey."
      />
      <BenefitsSection
        title="Benefits of becoming a mentee"
        eyebrow="Why join"
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

      <BecomeCTASection role="mentee" />

      {applicationsOpen && (
        <StickyApplyBar
          href="/mentorship/mentee/apply"
          label="Apply to Become a Mentee"
          hideAtId="become-mentee-cta"
        />
      )}
    </>
  );
}
