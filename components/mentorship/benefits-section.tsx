"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Reveal } from "@/components/ui/reveal";
import { LucideIcon } from "lucide-react";

interface Benefit {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface BenefitsSectionProps {
  title: string;
  eyebrow?: string;
  benefits: Benefit[];
}

export function BenefitsSection({
  title,
  eyebrow = "Why join",
  benefits,
}: BenefitsSectionProps) {
  return (
    <Section bgColor="white" className="py-24 lg:py-28">
      <Container size="full">
        <div className="max-w-2xl mb-12 md:mb-16">
          <span className="text-label text-brand mb-4 block">{eyebrow}</span>
          <h2 className="text-display-sm text-foreground">{title}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <Reveal
                key={index}
                delay={index * 80}
                className="flex flex-col items-start rounded-[16px] border border-border bg-white p-6 sm:p-8 h-full"
              >
                <Icon
                  className="w-8 h-8 text-foreground mb-6"
                  strokeWidth={1.5}
                />
                <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3">
                  {benefit.title}
                </h3>
                <p className="text-base text-ink-600 leading-relaxed">
                  {benefit.description}
                </p>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
