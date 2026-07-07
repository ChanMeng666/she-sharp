"use client";

import { Section } from "@/components/layout/section";
import { Container } from "@/components/layout/container";
import { membershipBenefits } from "@/lib/data/membership";

export function MembershipBenefits() {
  return (
    <Section className="py-16 md:py-24 lg:py-32 bg-background" noPadding>
      <Container size="wide">
        <div className="text-center mb-12 md:mb-16">
          <p className="text-label text-ink-500 mb-4">Why join</p>
          <h2 className="text-display-sm text-foreground mb-4">
            Why join She Sharp?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Unlock your potential with resources, mentorship, and a supportive
            community of women in tech.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10">
          {membershipBenefits.map((benefit, index) => (
            <div
              key={index}
              className="group p-6 sm:p-7 md:p-8 card-sm border border-border bg-background transition-colors duration-300 hover:border-foreground/30"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 bg-muted">
                <benefit.icon className="w-6 h-6 text-brand" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {benefit.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}

