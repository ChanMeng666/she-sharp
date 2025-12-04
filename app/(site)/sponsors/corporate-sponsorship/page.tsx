import { SponsorshipHeroSection } from "@/components/sections/sponsorship/sponsorship-hero-section";
import { CurrentSponsorsSection } from "@/components/sections/sponsorship/current-sponsors-section";
import { SponsorshipPackagesSection } from "@/components/sections/sponsorship/sponsorship-packages-section";

export default function CorporateSponsorshipPage() {
  return (
    <>
      <SponsorshipHeroSection />
      <CurrentSponsorsSection />
      <SponsorshipPackagesSection />
    </>
  );
}