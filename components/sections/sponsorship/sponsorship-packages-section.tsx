"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { PricingTable, type PricingFeature, type PricingPlan } from "@/components/ui/pricing-table";

const features: PricingFeature[] = [
  { name: "Logo on She Sharp website", included: "bronze" },
  { name: "Social media recognition", included: "bronze" },
  { name: "Complimentary event tickets", included: "bronze" },
  { name: "Annual impact report feature", included: "bronze" },
  { name: "Event speaking opportunities", included: "silver" },
  { name: "Recruitment booth at events", included: "silver" },
  { name: "Employee mentorship program access", included: "silver" },
  { name: "Branded workshop/panel hosting", included: "gold" },
  { name: "Custom STEM diversity workshops", included: "gold" },
  { name: "Event naming rights", included: "platinum" },
  { name: "VIP table at all events", included: "platinum" },
  { name: "Executive advisory board seat", included: "platinum" },
];

const plans: PricingPlan[] = [
  {
    name: "Bronze",
    price: { monthly: 417, yearly: 5000 },
    level: "bronze",
  },
  {
    name: "Silver",
    price: { monthly: 833, yearly: 10000 },
    level: "silver",
  },
  {
    name: "Gold",
    price: { monthly: 1667, yearly: 20000 },
    level: "gold",
    popular: true,
  },
  {
    name: "Platinum",
    price: { monthly: 4167, yearly: 50000 },
    level: "platinum",
  },
];

export function SponsorshipPackagesSection() {
  return (
    <Section id="packages" className="py-20 bg-muted">
      <Container>
        <div className="space-y-12">
          {/* Section Header */}
          <div className="text-center space-y-4">
            <h2 className="text-display-sm text-foreground">
              Partnership Packages
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the partnership level that aligns with your organization&apos;s goals and commitment to diversity in STEM.
            </p>
          </div>

          {/* Pricing Table */}
          <PricingTable
            features={features}
            plans={plans}
            defaultPlan="gold"
            defaultInterval="yearly"
            currency="NZD"
            intervalLabels={{ monthly: "Monthly", yearly: "Annual" }}
            buttonText="Discuss Partnership Options"
          />

          {/* Note */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              All packages are customizable to meet your specific objectives
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}
