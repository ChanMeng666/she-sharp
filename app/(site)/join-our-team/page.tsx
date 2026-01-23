import { FeatureShowcase } from "@/components/ui/feature-showcase";
import {
  volunteerImages,
  volunteerPaths,
  joinTeamStats,
  joinTeamContent,
} from "@/lib/data/join-team";

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
