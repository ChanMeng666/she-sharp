import { FeatureShowcase } from "@/components/ui/feature-showcase";
import {
  volunteerImages,
  joinTeamStats,
  joinTeamContent,
  getVolunteerSteps,
} from "@/lib/data/join-team";

export default function JoinOurTeamPage() {
  const steps = getVolunteerSteps();

  return (
    <FeatureShowcase
      title={joinTeamContent.title}
      description={joinTeamContent.description}
      stats={joinTeamStats}
      steps={steps}
      tabs={volunteerImages}
      defaultTab="volunteer"
      panelMinHeight={600}
      primaryCta={{ label: "Apply Now", mobileLabel: "Email us to apply", href: "mailto:people@shesharp.org.nz" }}
    />
  );
}
