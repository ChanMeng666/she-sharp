import { SponsorshipHeroSection } from "@/components/sections/sponsorship/sponsorship-hero-section";
import { CurrentSponsorsSection } from "@/components/sections/sponsorship/current-sponsors-section";
import { SponsorshipOverviewSection } from "@/components/sections/sponsorship/sponsorship-overview-section";
import { SponsorshipStatsSection } from "@/components/sections/sponsorship/sponsorship-stats-section";
import { SponsorshipPackagesSection } from "@/components/sections/sponsorship/sponsorship-packages-section";
import { ROICalculatorSection } from "@/components/sections/sponsorship/roi-calculator-section";
import { PhotoGallerySection } from "@/components/sections/sponsorship/photo-gallery-section";

export default function CorporateSponsorshipPage() {
  return (
    <>
      <SponsorshipHeroSection />
      <SponsorshipStatsSection />
      <CurrentSponsorsSection />
      <SponsorshipPackagesSection />
      <SponsorshipOverviewSection />
      <ROICalculatorSection />
      <PhotoGallerySection />
    </>
  );
}