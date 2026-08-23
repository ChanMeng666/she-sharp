import { Metadata } from "next";
import { JoinTeamHeroSection } from "@/components/join-team/join-team-hero-section";
import { PricingComparison } from "@/components/ui/pricing-section-with-comparison";
import { JoinTeamTestimonialsSection } from "@/components/join-team/testimonials-section";
import { PhotoBand } from "@/components/ui/photo-band";
import { JOIN_TEAM_BAND, toBandPhotos } from "@/lib/data/site-photos";
import {
  volunteerPaths,
  joinTeamStats,
  joinTeamContent,
} from "@/lib/data/join-team";
import { PEOPLE_EMAIL } from "@/lib/config/contact-addresses";

export const metadata: Metadata = {
  title: "Join Our Team",
  description:
    "Become a volunteer or ambassador at She Sharp. Join our passionate community working to bridge the gender gap in STEM across New Zealand.",
  alternates: { canonical: "/join-our-team" },
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

      {/*
        The comparison table and the testimonials below it are two long runs of
        type back to back. This is what the volunteering actually looks like,
        set between them.
      */}
      <PhotoBand
        photos={toBandPhotos(JOIN_TEAM_BAND)}
        eyebrow="What a shift looks like"
        tileHeight="sm"
        className="pb-16 md:pb-24"
      />

      <JoinTeamTestimonialsSection />

      <div className="mx-auto max-w-3xl px-6 pb-16 md:pb-24 text-center">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Would rather just send us your CV? Email{" "}
          <a
            href={`mailto:${PEOPLE_EMAIL}`}
            className="underline hover:text-brand"
          >
            {PEOPLE_EMAIL}
          </a>
          .
        </p>
      </div>
    </section>
  );
}
