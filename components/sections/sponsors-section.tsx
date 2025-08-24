"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card, CardContent } from "@/components/ui/card";

const sponsors = {
  silver: [
    { 
      name: "HCLTech", 
      logo: "/logos/hcltech-logo.svg",
      description: "Technology that makes a difference",
      scale: "scale-90" // Reduced size as requested
    },
    { 
      name: "Fonterra", 
      logo: "/logos/fonterra-logo.svg",
      description: "Innovation in every byte",
      scale: "scale-100" // Maintaining good balance
    },
    { 
      name: "MYOB", 
      logo: "/logos/myob-logo.svg",
      description: "Business solutions for growth",
      scale: "scale-105" // Reduced size as requested
    },
  ],
  bronze: [
    { 
      name: "Fisher & Paykel Healthcare", 
      logo: "/logos/FPHcare-logo.svg",
      description: "Healthcare innovation",
      scale: "scale-125" // Increased size as requested for more prominence
    },
  ],
};

// Benefits removed for brevity on homepage

export function SponsorsSection() {
  return (
    <Section className="overflow-hidden">
      <Container size="full">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-navy-dark mb-4">
            Trusted Partners
          </h2>
          <p className="text-base sm:text-lg text-gray max-w-2xl mx-auto px-4">
            Industry-leading organizations that share our vision and invest in advancing women in technology
          </p>
        </div>


        {/* Silver Sponsors */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h3 className="text-lg font-bold bg-gradient-to-r from-gray via-navy-dark to-gray bg-clip-text text-transparent mb-2 tracking-wider flex items-center justify-center gap-2">
              <span className="w-8 h-0.5 bg-gradient-to-r from-transparent to-gray/40"></span>
              SILVER SPONSORS
              <span className="w-8 h-0.5 bg-gradient-to-l from-transparent to-gray/40"></span>
            </h3>
            <div className="w-32 h-1 bg-gradient-to-r from-transparent via-gray/50 to-transparent mx-auto"></div>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {sponsors.silver.map((sponsor) => (
              <div key={sponsor.name} className="group">
                <div className="relative h-24 flex items-center justify-center">
                  <Image
                    src={sponsor.logo}
                    alt={sponsor.name}
                    fill
                    className={`object-contain transition-all duration-300 group-hover:scale-110 ${sponsor.scale || 'scale-100'}`}
                  />
                </div>
                <p className="text-center text-sm text-gray mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {sponsor.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bronze Sponsors */}
        <div className="mb-12 sm:mb-16">
          <div className="text-center mb-8">
            <h3 className="text-sm font-medium text-gray mb-2 tracking-wide">BRONZE SPONSORS</h3>
            <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-gray/20 to-transparent mx-auto"></div>
          </div>
          <div className="flex justify-center max-w-2xl mx-auto">
            {sponsors.bronze.map((sponsor) => (
              <div key={sponsor.name} className="group">
                <div className="relative h-24 sm:h-28 flex items-center justify-center px-6">
                  <Image
                    src={sponsor.logo}
                    alt={sponsor.name}
                    fill
                    className={`object-contain transition-all duration-300 group-hover:scale-110 ${sponsor.scale || 'scale-100'}`}
                  />
                </div>
                <p className="text-center text-sm text-gray mt-3 opacity-0 group-hover:opacity-100 transition-opacity px-4">
                  {sponsor.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits removed to keep homepage concise */}

        {/* Minimal link instead of full CTA block */}
        <div className="text-center">
          <Button variant="link" asChild>
            <Link href="/sponsors/corporate-sponsorship">Become a sponsor</Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}