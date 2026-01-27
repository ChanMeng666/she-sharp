import { Metadata } from "next";
import { SponsorshipPricing } from "@/components/ui/pricing-sponsorship";

export const metadata: Metadata = {
  title: "Corporate Sponsorship | She Sharp",
  description:
    "Partner with She Sharp to support women in STEM. Explore sponsorship opportunities and make a meaningful impact on diversity in technology.",
};

export default function CorporateSponsorshipPage() {
  return <SponsorshipPricing />;
}
