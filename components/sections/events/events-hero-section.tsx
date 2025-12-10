"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

export function EventsHeroSection() {
  return (
    <Section className="bg-surface-periwinkle py-20">
      <Container>
        <AnimateOnScroll variant="fade-up" className="text-center">
          <p className="font-brand-script text-2xl md:text-3xl text-muted-foreground mb-4">
            Connect, learn, grow
          </p>
          <h1 className="text-display-lg text-foreground">
            She Sharp Events
          </h1>
          <p className="mt-4 text-xl text-muted-foreground">
            JOIN OUR NEXT EVENT
          </p>
        </AnimateOnScroll>
      </Container>
    </Section>
  );
}