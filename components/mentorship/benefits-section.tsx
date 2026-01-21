"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { LucideIcon } from "lucide-react";

interface Benefit {
  icon: LucideIcon;
  title: string;
  description: string;
  iconColor?: string;
  iconBgColor?: string;
}

interface BenefitsSectionProps {
  title: string;
  benefits: Benefit[];
}

export function BenefitsSection({
  title,
  benefits,
}: BenefitsSectionProps) {
  return (
    <Section className="py-16 md:py-24 bg-muted">
      <Container size="full">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-left mb-12 md:mb-16">
            <h2 className="text-display-sm text-foreground mb-4">
              {title}
            </h2>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;

              return (
                <div
                  key={index}
                  className="flex flex-col items-start text-left"
                >
                  {/* Icon */}
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-6 border-2 border-white bg-white">
                    <Icon
                      className="w-8 h-8 text-brand"
                      strokeWidth={1.5}
                    />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3">
                    {benefit.title}
                  </h3>

                  {/* Description */}
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </Section>
  );
}

