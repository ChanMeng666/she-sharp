"use client";

import { Container } from "@/components/layout/container";
import { LogoCloud } from "@/components/ui/logo-cloud";
import { scrollingSponsorLogos } from "@/lib/data/sponsors";

export function ScrollingSponsorsSection() {
  const logos = scrollingSponsorLogos.map((sponsor) => ({
    src: sponsor.logo,
    alt: sponsor.name,
  }));

  return (
    <section className="overflow-hidden border-y border-border bg-white py-12 md:py-16">
      <Container size="full">
        <h2 className="text-label mb-10 text-center text-ink-500">
          Sponsors who have supported our events
        </h2>
      </Container>

      <LogoCloud logos={logos} />
    </section>
  );
}
