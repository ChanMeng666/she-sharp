import { Metadata } from "next";
import { JoinTeamHeroSection } from "@/components/join-team/join-team-hero-section";
import { PricingComparison } from "@/components/ui/pricing-section-with-comparison";
import { JoinTeamTestimonialsSection } from "@/components/join-team/testimonials-section";
import {
  volunteerPaths,
  joinTeamStats,
  joinTeamContent,
} from "@/lib/data/join-team";

export const metadata: Metadata = {
  title: "Join Our Team | She Sharp",
  description:
    "Become a volunteer or ambassador at She Sharp. Join our passionate community working to bridge the gender gap in STEM across New Zealand.",
};

export default function JoinOurTeamPage() {
  return (
    <section className="w-full bg-background text-foreground">
      <JoinTeamHeroSection
        title={joinTeamContent.title}
        description={joinTeamContent.description}
        stats={joinTeamStats}
      />
      <PricingComparison volunteerPaths={volunteerPaths} />
      <JoinTeamTestimonialsSection />
    </section>
  );
}
