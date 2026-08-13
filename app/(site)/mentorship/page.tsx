import { Metadata } from "next";
import { Megaphone } from "lucide-react";
import { TestimonialsSection } from "@/components/mentorship/testimonials-section";
import { HowItWorksSection } from "@/components/mentorship/how-it-works-section";
import { MentorsListSection } from "@/components/mentorship/mentors/mentors-list-section";
import { MentorshipHeroSection } from "@/components/mentorship/mentorship-hero-section";
import { MentorshipBenefits } from "@/components/mentorship/mentorship-benefits-section";
import { MentorshipCTASection } from "@/components/mentorship/mentorship-cta-section";
import { MENTORSHIP_VIDEO } from "@/lib/config/assets";
import { isMentorshipOpen } from "@/lib/config/mentorship";
import { MAILCHIMP_CONFIG } from "@/lib/data/newsletters";
import { GeoHead, GEO_INSTRUCTIONS } from "@/components/seo/geo-head";
import { ParallaxImage } from "@/components/ui/parallax";
import { curatedImages } from "@/public/img/curated";

export const metadata: Metadata = {
  // "New Zealand" is in the title on purpose. This page takes ~2,800 search
  // impressions a quarter for ~38 clicks, and the queries eating that budget
  // split two ways: generic head terms ("mentorship", "mentorship programs")
  // where a local charity at position 6-9 will never win the click, and
  // location-qualified ones ("mentors nz", "nz mentors") where it should.
  // Only the second group is winnable, so the title names the country.
  // Kept short enough that "| She Sharp" still fits inside Google's ~60-char
  // display width — 53 with the template applied.
  title: "Mentorship Programme for Women in Tech NZ",
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
        eyebrow="Mentorship Programme"
        title={
          <>
            Mentorship
            <br />
            programme
          </>
        }
        image="/img/gallery/home-page-ai-hackathon-2025-mentorship.jpg"
        imageAlt="Women in technology mentorship programme group photo"
        video={MENTORSHIP_VIDEO}
        detailEyebrow="Why it matters"
        detailTitle="Empowering women in STEM"
        detailTitleHighlight="through mentoring."
        detailDescription="Our mentorship programme facilitates supportive relationships between our mentors and mentees. Through sharing knowledge, advice, and encouragement, we help mentees navigate careers, overcome challenges, and achieve interpersonal goals."
      />

      {!applicationsOpen && (
        <div className="bg-muted border-y border-border">
          <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <a
              href={MAILCHIMP_CONFIG.subscribeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col sm:flex-row items-center justify-center gap-x-2 gap-y-1 text-center text-sm md:text-base font-medium text-brand hover:text-brand-hover transition-colors"
            >
              <span className="inline-flex items-center gap-2">
                <Megaphone className="h-4 w-4 shrink-0" />
                Applications closed
              </span>
              <span className="text-ink-600">
                — subscribe for updates about future cohorts.
              </span>
            </a>
          </div>
        </div>
      )}

      <MentorshipBenefits />
      <HowItWorksSection />

      {/* Decorative parallax breather between the process and the mentors. */}
      <section aria-hidden>
        <ParallaxImage
          image={{ ...curatedImages["divider-educator-conference"], alt: "" }}
          heightClass="h-[40vh] md:h-[50vh]"
        />
      </section>

      <MentorsListSection />
      <TestimonialsSection />
      <MentorshipCTASection />
    </>
  );
}
