import { Metadata } from "next";
import { JoinTeamHeroSection } from "@/components/join-team/join-team-hero-section";
import { VolunteerPathsSection } from "@/components/join-team/volunteer-paths-section";
import { JoinTeamTestimonialsSection } from "@/components/join-team/testimonials-section";
import {
  volunteerImages,
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
      <VolunteerPathsSection
        title={joinTeamContent.title}
        description={joinTeamContent.description}
        stats={joinTeamStats.map(stat => stat.text)}
        volunteerPaths={volunteerPaths}
        tabs={volunteerImages}
        primaryCta={{
          label: "Apply Now",
          href: "mailto:people@shesharp.org.nz",
        }}
      />
      <JoinTeamTestimonialsSection />
    </section>
  );
}
