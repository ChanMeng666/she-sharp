"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Handshake, Heart, Award } from "lucide-react";

const sponsors = {
  silver: [
    { 
      name: "HCLTech", 
      logo: "/logos/hcltech-logo.svg",
      description: "Technology that makes a difference"
    },
    { 
      name: "Fonterra", 
      logo: "/logos/fonterra-logo.svg",
      description: "Innovation in every byte"
    },
  ],
  bronze: [
    { 
      name: "MYOB", 
      logo: "/logos/myob-logo.svg",
      description: "Business solutions for growth"
    },
    { 
      name: "Fisher & Paykel Healthcare", 
      logo: "/logos/FPHcare-logo.svg",
      description: "Healthcare innovation"
    },
    { 
      name: "FlexWare", 
      logo: "/logos/flexware-logo.svg",
      description: "Flexible software solutions"
    },
  ],
};

const sponsorBenefits = [
  {
    icon: Handshake,
    title: "Brand Visibility",
    description: "Connect with 2200+ talented women in tech"
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
    <Section className="bg-white overflow-hidden">
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
                    className={`object-contain transition-all duration-300 group-hover:scale-110 ${
                      sponsor.name === 'Fonterra' ? 'scale-125' : ''
                    }`}
                  />
                </div>
                <p className="text-center text-sm text-gray mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {sponsor.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bronze Sponsors - Carousel */}
        <div className="mb-12 sm:mb-16 overflow-hidden">
          <div className="text-center mb-8">
            <h3 className="text-sm font-medium text-gray mb-2 tracking-wide">BRONZE SPONSORS</h3>
            <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-gray/20 to-transparent mx-auto"></div>
          </div>
          <div className="max-w-4xl mx-auto relative px-12">
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              plugins={[
                Autoplay({
                  delay: 3000,
                }),
              ]}
              className="w-full"
            >
              <CarouselContent>
                {sponsors.bronze.map((sponsor) => (
                  <CarouselItem key={sponsor.name} className="basis-1/2 sm:basis-1/2 md:basis-1/3">
                    <div className="p-2">
                      <div className="group">
                        <div className="relative h-16 sm:h-20 flex items-center justify-center">
                          <Image
                            src={sponsor.logo}
                            alt={sponsor.name}
                            fill
                            className="object-contain transition-all duration-300 group-hover:scale-110"
                          />
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-0 sm:left-2 md:-left-12 h-8 w-8 sm:h-10 sm:w-10 bg-white/80 hover:bg-white/90" />
              <CarouselNext className="right-0 sm:right-2 md:-right-12 h-8 w-8 sm:h-10 sm:w-10 bg-white/80 hover:bg-white/90" />
            </Carousel>
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
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-purple-dark hover:bg-purple-mid"
            >
              <Link href="/sponsors/corporate-sponsorship">Become a Sponsor</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-purple-dark text-purple-dark hover:bg-white/50"
            >
              <Link href="/sponsors/corporate-sponsorship">Sponsorship Info</Link>
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}