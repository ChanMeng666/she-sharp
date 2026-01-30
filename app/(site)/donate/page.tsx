import { Metadata } from "next";
import { ScrollingFeatureShowcase } from "@/components/ui/scrolling-feature-showcase";
import { DonationAmountButtons } from "@/components/donate/donation-amount-buttons";
import { donateSlides } from "@/lib/data/donate-showcase";

export const metadata: Metadata = {
  title: "Donate | She Sharp",
  description:
    "Support She Sharp's mission to empower women in STEM. Your donation helps fund mentorship programmes, workshops, and events across New Zealand.",
};

export default function DonatePage() {
  return (
    <ScrollingFeatureShowcase
      slides={donateSlides}
      ctaText="Donate Now"
      ctaHref="/donate/checkout?amount=25"
      customFinalContent={<DonationAmountButtons />}
    />
  );
}
