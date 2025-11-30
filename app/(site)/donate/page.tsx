import { DonateHeroSection } from "@/components/sections/donate/donate-hero-section";
import { DonationOptionsSection } from "@/components/sections/donate/donation-options-section";
import { DonateInfoSection } from "@/components/sections/donate/donate-info-section";
import { DonationImpactSection } from "@/components/sections/donate/donation-impact-section";
import { TestimonialsSection } from "@/components/sections/donate/testimonials-section";

export default function DonatePage() {
  return (
    <>
      <DonateHeroSection />
      <DonationOptionsSection />
      <DonateInfoSection />
      <DonationImpactSection />
      <TestimonialsSection />
    </>
  );
}