import { ScrollingFeatureShowcase } from "@/components/ui/scrolling-feature-showcase";
import { DonationAmountButtons } from "@/components/sections/donate/donation-amount-buttons";
import { donateSlides } from "@/lib/data/donate-showcase";

export default function DonatePage() {
  return (
    <ScrollingFeatureShowcase
      slides={donateSlides}
      ctaText="Donate Now"
      ctaHref="/donate/checkout?amount=25"
      customFinalContent={<DonationAmountButtons variant="dark" />}
    />
  );
}
