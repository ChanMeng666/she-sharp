"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Reveal } from "@/components/ui/reveal";
import { getSponsorsByTier, type TieredSponsor } from "@/lib/data/sponsors";

const TIERS: { label: string; sponsors: TieredSponsor[] }[] = [
  { label: "Gold", sponsors: getSponsorsByTier("gold") },
  { label: "Silver", sponsors: getSponsorsByTier("silver") },
  { label: "Bronze", sponsors: getSponsorsByTier("bronze") },
];

function SponsorLogo({ sponsor }: { sponsor: TieredSponsor }) {
  return (
    <a
      href={sponsor.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Visit ${sponsor.name} website`}
      title={sponsor.description}
      className="block"
    >
      <div className="relative flex h-16 w-48 items-center justify-center">
        <Image
          src={sponsor.logo}
          alt={sponsor.name}
          fill
          className="object-contain grayscale transition duration-300 hover:grayscale-0"
        />
      </div>
    </a>
  );
}

export function SponsorsSection() {
  return (
    <Section bgColor="white">
      <Container size="full">
        <Reveal className="mb-14 text-center md:mb-20">
          <h2 className="text-display-sm text-foreground">
            Thanks to our sponsors
          </h2>
        </Reveal>

        <div className="space-y-12 md:space-y-16">
          {TIERS.map(
            ({ label, sponsors }) =>
              sponsors.length > 0 && (
                <Reveal key={label} variant="fade-up">
                  <div className="border-t border-border pt-8">
                    <p className="text-label mb-8 text-center text-ink-500">
                      {label}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-8">
                      {sponsors.map((sponsor) => (
                        <SponsorLogo key={sponsor.name} sponsor={sponsor} />
                      ))}
                    </div>
                  </div>
                </Reveal>
              )
          )}
        </div>

        <Reveal className="mt-16 text-center">
          <Button asChild size="lg" variant="outline">
            <Link href="/sponsors/corporate-sponsorship">Become a sponsor</Link>
          </Button>
        </Reveal>
      </Container>
    </Section>
  );
}
