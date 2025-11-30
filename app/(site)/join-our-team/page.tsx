import { JoinTeamHeroSection } from "@/components/sections/join-team/join-team-hero-section";
import { TeamOverviewSection } from "@/components/sections/join-team/team-overview-section";
import { VolunteerOptionsSection } from "@/components/sections/join-team/volunteer-options-section";
import { TeamGallerySection } from "@/components/sections/join-team/team-gallery-section";
import { AnniversarySection } from "@/components/sections/join-team/anniversary-section";
import { TeamTestimonialsSection } from "@/components/sections/join-team/team-testimonials-section";

export default function JoinOurTeamPage() {
  return (
    <>
      <JoinTeamHeroSection />
      <TeamOverviewSection />
      <VolunteerOptionsSection />
      <TeamGallerySection />
      <AnniversarySection />
      <TeamTestimonialsSection />
    </>
  );
}