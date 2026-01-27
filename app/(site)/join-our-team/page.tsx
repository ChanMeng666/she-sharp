import { Metadata } from "next";
import { FeatureShowcase } from "@/components/ui/feature-showcase";
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
    <FeatureShowcase
      eyebrow={joinTeamContent.eyebrow}
      title={joinTeamContent.title}
      description={joinTeamContent.description}
      stats={joinTeamStats}
      volunteerPaths={volunteerPaths}
      tabs={volunteerImages}
      defaultTab="volunteer"
      panelMinHeight={500}
      primaryCta={{
        label: "Apply Now",
        mobileLabel: "Email us to apply",
        href: "mailto:people@shesharp.org.nz",
      }}
    />
  );
}
