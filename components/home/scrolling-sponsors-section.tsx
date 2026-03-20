"use client";

import { Section } from "@/components/layout/section";
import { Container } from "@/components/layout/container";
import { LogoCloud } from "@/components/ui/logo-cloud";
import { scrollingSponsorLogos } from "@/lib/data/sponsors";

export function ScrollingSponsorsSection() {
  const logos = scrollingSponsorLogos.map((sponsor) => ({
    src: sponsor.logo,
    alt: sponsor.name,
  }));

  return (
    <Section className="bg-white overflow-hidden pt-4 md:pt-8">
      <Container size="full">
        <h2 className="text-xl md:text-2xl text-gray-400 text-center mb-10 md:mb-14">
          Sponsors who have supported our events
        </h2>
      </Container>

      <LogoCloud logos={logos} />
    </Section>
  );
}
