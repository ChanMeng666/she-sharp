"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";
import { getSponsorsByTier } from "@/lib/data/sponsors";

const goldSponsors = getSponsorsByTier("gold");
const silverSponsors = getSponsorsByTier("silver");
const bronzeSponsors = getSponsorsByTier("bronze");

// Benefits removed for brevity on homepage

export function SponsorsSection() {
  return (
    <Section className="overflow-hidden bg-white/20 py-16 xl:py-24 2xl:py-32">
      <Container size="full">
        <AnimateOnScroll variant="fade-up" className="text-center mb-12 md:mb-16 lg:mb-20">
          <h2 className="text-display-sm text-foreground">
            Thanks to Our Sponsors
          </h2>
        </AnimateOnScroll>

        {/* Gold Sponsors */}
        {goldSponsors.length > 0 && (
          <div className="mb-12 sm:mb-16">
            <AnimateOnScroll variant="fade-up" className="text-center mb-8 md:mb-12">
              <h3 className="text-xl text-brand font-bold">GOLD</h3>
            </AnimateOnScroll>
            <div className="flex flex-wrap justify-center gap-8 max-w-5xl mx-auto">
              {goldSponsors.map((sponsor, index) => (
                <AnimateOnScroll key={sponsor.name} variant="fade-up" delay={index * 100}>
                  <a
                    href={sponsor.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Visit ${sponsor.name} website`}
                    title={sponsor.description}
                    className="block"
                  >
                    <div className="relative h-20 w-56 flex items-center justify-center">
                      <Image src={sponsor.logo} alt={sponsor.name} fill className="object-contain" />
                    </div>
                  </a>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        )}

        {/* Silver Sponsors */}
        {silverSponsors.length > 0 && (
          <div className="mb-12 sm:mb-16">
            <AnimateOnScroll variant="fade-up" className="text-center mb-8 md:mb-12">
              <h3 className="text-xl text-brand font-bold">SILVER</h3>
            </AnimateOnScroll>
            <div className="flex flex-wrap justify-center gap-8 max-w-5xl mx-auto">
              {silverSponsors.map((sponsor, index) => (
                <AnimateOnScroll key={sponsor.name} variant="fade-up" delay={index * 100}>
                  <a
                    href={sponsor.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Visit ${sponsor.name} website`}
                    title={sponsor.description}
                    className="block"
                  >
                    <div className="relative h-20 w-56 flex items-center justify-center">
                      <Image src={sponsor.logo} alt={sponsor.name} fill className="object-contain" />
                    </div>
                  </a>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        )}

        {/* Bronze Sponsors */}
        {bronzeSponsors.length > 0 && (
          <div className="mb-12 sm:mb-16">
            <AnimateOnScroll variant="fade-up" className="text-center mb-8 md:mb-12">
              <h3 className="text-xl text-brand font-bold">BRONZE</h3>
            </AnimateOnScroll>
            <div className="flex flex-wrap justify-center gap-10 max-w-5xl mx-auto">
              {bronzeSponsors.map((sponsor, index) => (
                <AnimateOnScroll key={sponsor.name} variant="fade-up" delay={index * 100}>
                  <a
                    href={sponsor.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Visit ${sponsor.name} website`}
                    title={sponsor.description}
                    className="block"
                  >
                    <div className="relative h-20 w-56 flex items-center justify-center">
                      <Image src={sponsor.logo} alt={sponsor.name} fill className="object-contain" />
                    </div>
                  </a>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <AnimateOnScroll variant="fade-up" className="text-center">
          <Button asChild size="lg" variant="default" className="mb-12" >
            <Link href="/sponsors/corporate-sponsorship">Become a sponsor</Link>
          </Button>
        </AnimateOnScroll>
      </Container>
    </Section>
  );
}
