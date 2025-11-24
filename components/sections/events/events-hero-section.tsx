"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

export function EventsHeroSection() {
  return (
    <Section className="bg-gradient-to-r from-gray-950 via-black to-gray-950 py-20">
      <Container>
        <AnimateOnScroll variant="fade-up" className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-ghost-white sm:text-5xl md:text-6xl">
            She Sharp
          </h1>
          <p className="mt-4 text-2xl font-semibold text-purple-dark">
            JOIN OUR NEXT EVENT
          </p>
        </AnimateOnScroll>
      </Container>
    </Section>
  );
}