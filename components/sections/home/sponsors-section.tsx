"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";

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
    <Section className="overflow-hidden bg-mint-light ">
      <Container size="full">
        <div className="text-center mb-8 sm:mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-navy-dark">
            Thanks to Our Sponsors
          </h2>
          {/* <p className="text-base sm:text-lg text-gray max-w-2xl mx-auto px-4">
            Industry-leading organizations that share our vision and invest in advancing women in technology
          </p> */}
        </div>

        {/* Silver Sponsors */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h3 className="text-3xl text-purple-dark font-bold tracking-wider flex items-center justify-center gap-2">
              SILVER
            </h3>
          </div>
          <div className="grid md:grid-cols-3 gap-16 max-w-3xl mx-auto">
            {sponsors.silver.map((sponsor) => (
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
            ))}
          </div>
        </div>

        {/* Bronze Sponsors */}
        <div className="mb-12 sm:mb-16">
          <div className="text-center mb-12">
            <h3 className="text-3xl text-purple-dark font-bold tracking-wider flex items-center justify-center gap-2">
              BRONZE
            </h3>
          </div>

          <div className="flex justify-center max-w-2xl mx-auto">
            {sponsors.bronze.map((sponsor) => (
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
            ))}
          </div>
        </div>

        {/* Benefits removed to keep homepage concise */}

        {/* CTA */}
        <div className="text-center">
          <Button asChild size="lg">
            <Link href="/sponsors/corporate-sponsorship">Become a sponsor</Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}
