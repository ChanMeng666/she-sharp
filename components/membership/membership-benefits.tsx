"use client";

import { Section } from "@/components/layout/section";
import { Container } from "@/components/layout/container";
import { membershipBenefits } from "@/lib/data/membership";

export function MembershipBenefits() {
  return (
    <Section className="py-16 md:py-24 lg:py-32 bg-white" noPadding>
      <Container size="wide">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-display-sm text-foreground mb-4">
            Why Join She Sharp?
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
              className="group p-4 sm:p-5 md:p-6 card-sm bg-[#f7e5f3]/30 hover:bg-[#f7e5f3]/60 transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center mb-5 group-hover:bg-brand/20 transition-colors">
                <benefit.icon className="w-7 h-7 text-brand" />
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

