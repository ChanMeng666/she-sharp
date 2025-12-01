"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

export function AboutHeroSection() {
  return (
    <Section
      noPadding
      className="relative min-h-screen flex items-center overflow-hidden bg-muted"
    >
      <Container>
        <AnimateOnScroll variant="fade-up" className="relative z-10 mx-auto max-w-3xl text-center px-6 sm:px-0 py-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl leading-tight uppercase text-foreground">
            Changing the ratio in STEM
          </h1>
          <p className="mt-4 sm:mt-6 text-base sm:text-lg text-muted-foreground">
            We open doors to STEM careers through mentorship, hands‑on programs,
            and people who care.
          </p>

          {/* Founder's Note (always visible) */}
          <AnimateOnScroll variant="fade-up" delay={200} className="mt-6 sm:mt-8 text-left bg-background rounded-md p-4 sm:p-5 border border-border">
            <div className="space-y-3 text-muted-foreground">
              <p>
                In 2014, we set out to make career paths into tech visible and
                reachable.
              </p>
              <p>
                We've grown by doing the simple things well: practical support,
                peer learning, and consistent action.
              </p>
              <p className="italic">
                — Dr. Mahsa McCauley, Founder and Director
              </p>
            </div>
          </AnimateOnScroll>
        </AnimateOnScroll>
      </Container>
    </Section>
  );
}
