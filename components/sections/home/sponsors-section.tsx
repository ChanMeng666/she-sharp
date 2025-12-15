"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

const sponsors = {
  silver: [
    {
      name: "HCLTech",
      logo: "/logos/hcltech-logo.svg",
      description: "Technology that makes a difference",
      url: "https://www.hcltech.com",
    },
    {
      name: "Fonterra",
      logo: "/logos/fonterra-logo.svg",
      description: "Innovation in every byte",
      url: "https://www.fonterra.com",
    },
    {
      name: "MYOB",
      logo: "/logos/myob-logo.svg",
      description: "Business solutions for growth",
      url: "https://www.myob.com",
    },
  ],
  bronze: [
    {
      name: "Fisher & Paykel Healthcare",
      logo: "/logos/FPHcare-logo.svg",
      description: "Healthcare innovation",
      url: "https://www.fphcare.com",
    },
  ],
};

// Benefits removed for brevity on homepage

export function SponsorsSection() {
  return (
    <Section className="overflow-hidden bg-background">
      <Container size="full">
        <AnimateOnScroll variant="fade-up" className="text-center mb-8 sm:mb-20">
          <h2 className="text-display-sm text-foreground">
            Thanks to Our Sponsors
          </h2>
        </AnimateOnScroll>

        {/* Silver Sponsors */}
        <div className="mb-20">
          <AnimateOnScroll variant="fade-up" className="text-center mb-12">
            <h3 className="text-label text-xl text-muted-foreground flex items-center justify-center gap-2">
              SILVER
            </h3>
          </AnimateOnScroll>
          <div className="grid md:grid-cols-3 gap-16 max-w-3xl mx-auto justify-items-center">
            {sponsors.silver.map((sponsor, index) => (
              <AnimateOnScroll
                key={sponsor.name}
                variant="fade-up"
                delay={index * 100}
              >
              <a
                key={sponsor.name}
                href={sponsor.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Visit ${sponsor.name} website`}
                title={sponsor.description}
                className="block"
              >
                <div className="relative h-20 w-56 sm:w-64 flex items-center justify-center shrink-0">
                  <Image
                    src={sponsor.logo}
                    alt={sponsor.name}
                    fill
                    className="object-contain"
                  />
                </div>
              </a>
              </AnimateOnScroll>
            ))}
          </div>
        </div>

        {/* Bronze Sponsors */}
        <div className="mb-12 sm:mb-16">
          <AnimateOnScroll variant="fade-up" className="text-center mb-12">
            <h3 className="text-label text-xl text-muted-foreground flex items-center justify-center gap-2">
              BRONZE
            </h3>
          </AnimateOnScroll>

          <div className="flex justify-center max-w-2xl mx-auto">
            {sponsors.bronze.map((sponsor) => (
              <AnimateOnScroll
                key={sponsor.name}
                variant="fade-up"
              >
              <a
                href={sponsor.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Visit ${sponsor.name} website`}
                title={sponsor.description}
                className="block"
              >
                <div className="relative h-20 w-56 sm:w-64 flex items-center justify-center shrink-0">
                  <Image
                    src={sponsor.logo}
                    alt={sponsor.name}
                    fill
                    className="object-contain"
                  />
                </div>
              </a>
              </AnimateOnScroll>
            ))}
          </div>
        </div>

        {/* Benefits removed to keep homepage concise */}

        {/* CTA */}
        <AnimateOnScroll variant="fade-up" className="text-center">
          <Button asChild size="lg">
            <Link href="/sponsors/corporate-sponsorship">Become a sponsor</Link>
          </Button>
        </AnimateOnScroll>
      </Container>
    </Section>
  );
}
