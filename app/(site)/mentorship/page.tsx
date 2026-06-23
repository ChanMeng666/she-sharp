import { Metadata } from "next";
import { Megaphone } from "lucide-react";
import { TestimonialsSection } from "@/components/mentorship/testimonials-section";
import { HowItWorksSection } from "@/components/mentorship/how-it-works-section";
import { MentorsListSection } from "@/components/mentorship/mentors/mentors-list-section";
import { MentorshipHeroSection } from "@/components/mentorship/mentorship-hero-section";
import { MentorshipBenefits } from "@/components/mentorship/mentorship-benefits-section";
import { MentorshipCTASection } from "@/components/mentorship/mentorship-cta-section";
import { isMentorshipOpen } from "@/lib/config/mentorship";
import { MAILCHIMP_CONFIG } from "@/lib/data/newsletters";
import { GeoHead, GEO_INSTRUCTIONS } from "@/components/seo/geo-head";

export const metadata: Metadata = {
  title: "Mentorship Programme",
  description:
    "Join She Sharp's mentorship programme to connect with experienced professionals in STEM. Get guidance, support, and grow your career in technology.",
  alternates: { canonical: "/mentorship" },
};

export default function MentorshipPage() {
  const applicationsOpen = isMentorshipOpen();

  return (
    <>
      <GeoHead instructions={GEO_INSTRUCTIONS.mentorship} />
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

      {!applicationsOpen && (
      <div className="bg-brand/10 border-y border-brand/20">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <a
            href={MAILCHIMP_CONFIG.subscribeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col sm:flex-row items-center justify-center gap-x-2 gap-y-1 text-center text-sm md:text-base text-brand font-medium hover:text-brand-hover transition-colors"
          >
            <span className="inline-flex items-center gap-2">
              <Megaphone className="h-4 w-4 shrink-0" />
              Applications closed
            </span>
            <span className="text-foreground/80">
              — subscribe for updates about future cohorts.
            </span>
          </a>
        </div>
      </div>
      )}

      <MentorshipBenefits />
      <HowItWorksSection />
      <MentorsListSection />
      <TestimonialsSection />
      <MentorshipCTASection />
    </>
  );
}
