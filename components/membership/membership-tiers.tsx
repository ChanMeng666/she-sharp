"use client";

import Link from "next/link";
import { Section } from "@/components/layout/section";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Pricing } from "@/components/ui/pricing";
import { membershipTiers } from "@/lib/data/membership";

const pricingPlans = membershipTiers.map((tier) => ({
  name: tier.name,
  price: tier.price,
  monthlyPrice: tier.price === 0 ? 0 : Math.round((tier.price / 12) * 1.2),
  currency: tier.currency,
  description: tier.description,
  features: tier.features,
  buttonText: tier.ctaText,
  href: tier.ctaHref,
  isPopular: tier.isPopular ?? false,
}));

export function MembershipTiers() {
  return (
    <Section className="py-16 md:py-24 lg:py-32 bg-[#eaf2ff]" noPadding>
      <Container size="wide">
        <Pricing
          plans={pricingPlans}
          title="Choose Your Membership"
          description={
            "Select the plan that best fits your goals.\nAll memberships support our mission to empower women in tech."
          }
        />

        {/* Bottom CTA */}
        <div className="text-center mt-12 md:mt-16">
          <p className="text-muted-foreground mb-4">
            Not sure which plan is right for you?
          </p>
          <Link href="/contact">
            <Button variant="brand" size="lg" className="rounded-full px-8">
              Contact Us Today
            </Button>
          </Link>
        </div>
      </Container>
    </Section>
  );
}
