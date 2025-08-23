"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card, CardContent } from "@/components/ui/card";
import { Handshake, Heart, Award } from "lucide-react";

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

const sponsorBenefits = [
  {
    icon: Handshake,
    title: "Brand Visibility",
    description: "Connect with our thriving community of women in tech"
  },
  {
    icon: Heart,
    title: "Social Impact",
    description: "Support diversity and inclusion in STEM"
  },
  {
    icon: Award,
    title: "Talent Pipeline",
    description: "Access to top female tech talent"
  },
];

export function SponsorsSection() {
  return (
    <Section className="bg-white py-16 md:py-20 overflow-hidden">
      <Container size="full">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-navy-dark mb-4">
            Our Amazing Sponsors
          </h2>
          <p className="text-base sm:text-lg text-gray max-w-2xl mx-auto px-4">
            Thank you to these forward-thinking companies for investing in the future of women in technology
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

        {/* Sponsor Benefits */}
        <div className="bg-white rounded-lg p-6 sm:p-8 mb-8 sm:mb-12">
          <h3 className="text-lg sm:text-xl font-semibold text-navy-dark text-center mb-6">
            Why Partner With She Sharp?
          </h3>
          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
            {sponsorBenefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div key={benefit.title} className="text-center">
                  <div className="inline-flex p-2 sm:p-3 rounded-full bg-purple-light/20 mb-3">
                    <Icon className="w-5 sm:w-6 h-5 sm:h-6 text-purple-dark" />
                  </div>
                  <h4 className="text-sm sm:text-base font-semibold text-navy-dark mb-1">{benefit.title}</h4>
                  <p className="text-xs sm:text-sm text-gray">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-r from-purple-light to-periwinkle-light rounded-lg p-6 sm:p-8">
          <h3 className="text-xl sm:text-2xl font-bold text-navy-dark mb-4">
            Join Our Mission
          </h3>
          <p className="text-sm sm:text-base text-gray mb-6 max-w-xl mx-auto">
            Partner with us to create meaningful change in the tech industry and support the next generation of women leaders
          </p>
          <Button
            asChild
            size="lg"
            className="bg-purple-dark hover:bg-purple-mid"
          >
            <Link href="/sponsors/corporate-sponsorship">Partnership Opportunities</Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}