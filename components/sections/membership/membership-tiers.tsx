"use client";

import Link from "next/link";
import { Section } from "@/components/layout/section";
import { Container } from "@/components/layout/container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { membershipTiers } from "@/lib/data/membership";
import { cn } from "@/lib/utils";

export function MembershipTiers() {
  return (
    <Section spacing="section" className="py-16 md:py-24 lg:py-32 bg-[#eaf2ff]">
      <Container size="full">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Choose Your Membership
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select the plan that best fits your goals. All memberships support
            our mission to empower women in tech.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
          {membershipTiers.map((tier) => (
            <Card
              key={tier.id}
              className={cn(
                "relative flex flex-col p-6 md:p-8 rounded-[32px] border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
                tier.isPopular
                  ? "border-brand bg-white shadow-lg"
                  : "border-transparent bg-white"
              )}
            >
              {tier.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-block px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white bg-brand rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Tier Header */}
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {tier.name}
                </h3>
                <p className="text-sm text-muted-foreground min-h-[40px]">
                  {tier.description}
                </p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl md:text-5xl font-bold text-foreground">
                    ${tier.price}
                  </span>
                  {tier.price > 0 && (
                    <span className="text-muted-foreground">
                      / {tier.interval} (plus GST)
                    </span>
                  )}
                </div>
              </div>

              {/* CTA Button */}
              <Link href={tier.ctaHref} className="block mb-6">
                <Button
                  variant={tier.isPopular ? "brand" : "outline"}
                  size="lg"
                  className="w-full rounded-full"
                >
                  {tier.ctaText}
                </Button>
              </Link>

              {/* Features List */}
              <ul className="space-y-3 flex-1">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-5 h-5 text-muted-foreground/40 shrink-0 mt-0.5" />
                    )}
                    <span
                      className={cn(
                        "text-sm",
                        feature.included
                          ? "text-foreground"
                          : "text-muted-foreground/60"
                      )}
                    >
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

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

