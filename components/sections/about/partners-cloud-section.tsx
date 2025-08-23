"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useState } from "react";

const partners = [
  {
    name: "Microsoft",
    logo: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg",
    tier: "platinum",
    description: "Supporting women in tech through mentorship and career opportunities",
    size: "large"
  },
  {
    name: "Google",
    logo: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg",
    tier: "platinum",
    description: "Empowering the next generation of women engineers",
    size: "large"
  },
  {
    name: "Amazon Web Services",
    logo: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg",
    tier: "gold",
    description: "Cloud computing education and certification programs",
    size: "medium"
  },
  {
    name: "Atlassian",
    logo: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg",
    tier: "gold",
    description: "Collaborative tools and workplace diversity initiatives",
    size: "medium"
  },
  {
    name: "Xero",
    logo: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg",
    tier: "gold",
    description: "Supporting women in fintech and accounting technology",
    size: "medium"
  },
  {
    name: "Datacom",
    logo: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg",
    tier: "silver",
    description: "IT solutions and career development",
    size: "small"
  },
  {
    name: "Spark",
    logo: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg",
    tier: "silver",
    description: "Digital futures and connectivity",
    size: "small"
  },
  {
    name: "Fisher & Paykel Healthcare",
    logo: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg",
    tier: "silver",
    description: "Innovation in healthcare technology",
    size: "small"
  },
  {
    name: "AUT",
    logo: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg",
    tier: "education",
    description: "Academic excellence and research partnerships",
    size: "medium"
  },
  {
    name: "University of Auckland",
    logo: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg",
    tier: "education",
    description: "STEM education and student pathways",
    size: "medium"
  }
];

export function PartnersCloudSection() {
  const [hoveredPartner, setHoveredPartner] = useState<string | null>(null);

  // Desktop cloud layout positions
  const getPosition = (index: number, size: string) => {
    const positions: Record<number, { top: string; left: string }> = {
      0: { top: '10%', left: '15%' },
      1: { top: '5%', left: '60%' },
      2: { top: '30%', left: '5%' },
      3: { top: '25%', left: '35%' },
      4: { top: '20%', left: '70%' },
      5: { top: '50%', left: '10%' },
      6: { top: '45%', left: '55%' },
      7: { top: '50%', left: '80%' },
      8: { top: '70%', left: '25%' },
      9: { top: '70%', left: '65%' }
    };
    return positions[index] || { top: '50%', left: '50%' };
  };

  const getSize = (size: string) => {
    switch (size) {
      case 'large': return 'w-40 h-40';
      case 'medium': return 'w-32 h-32';
      case 'small': return 'w-24 h-24';
      default: return 'w-28 h-28';
    }
  };

  return (
    <Section className="bg-gradient-to-b from-white to-purple-light/10 py-20">
      <Container>
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-navy">Our Partners</h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            50+ organizations supporting our mission to empower women in STEM
          </p>
        </div>

        {/* Desktop Logo Cloud */}
        <div className="hidden lg:block relative h-[600px] max-w-6xl mx-auto">
          {partners.map((partner, index) => {
            const position = getPosition(index, partner.size);
            const sizeClass = getSize(partner.size);
            
            return (
              <div
                key={partner.name}
                className={cn(
                  "absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300",
                  sizeClass,
                  hoveredPartner === partner.name ? "scale-110 z-20" : "hover:scale-105",
                  partner.tier === 'platinum' && "animate-pulse"
                )}
                style={position}
                onMouseEnter={() => setHoveredPartner(partner.name)}
                onMouseLeave={() => setHoveredPartner(null)}
              >
                <Card className={cn(
                  "relative w-full h-full p-4 flex items-center justify-center bg-white/80 backdrop-blur-sm",
                  "hover:shadow-xl transition-all cursor-pointer",
                  partner.tier === 'platinum' && "border-2 border-purple-dark",
                  partner.tier === 'gold' && "border-2 border-yellow-500",
                  partner.tier === 'silver' && "border-2 border-gray-400"
                )}>
                  <Image
                    src={partner.logo}
                    alt={partner.name}
                    fill
                    sizes="(max-width: 640px) 120px, 160px"
                    className="object-contain p-4"
                  />
                  
                  {/* Hover Card */}
                  {hoveredPartner === partner.name && (
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 translate-y-full z-30">
                      <Card className="p-4 shadow-xl bg-white border-purple-dark">
                        <h4 className="font-semibold text-navy">{partner.name}</h4>
                        <p className="text-sm text-gray-600 mt-1 max-w-xs">
                          {partner.description}
                        </p>
                        <Badge className={cn(
                          "mt-2",
                          partner.tier === 'platinum' && "bg-purple-dark",
                          partner.tier === 'gold' && "bg-yellow-500",
                          partner.tier === 'silver' && "bg-gray-400",
                          partner.tier === 'education' && "bg-blue-600"
                        )}>
                          {partner.tier.charAt(0).toUpperCase() + partner.tier.slice(1)} Partner
                        </Badge>
                      </Card>
                    </div>
                  )}
                </Card>
              </div>
            );
          })}
          
          {/* Decorative elements */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-96 h-96 bg-purple-light/20 rounded-full blur-3xl" />
          </div>
        </div>

        {/* Mobile Carousel */}
        <div className="lg:hidden">
          <Carousel className="w-full max-w-sm mx-auto">
            <CarouselContent>
              {partners.map((partner) => (
                <CarouselItem key={partner.name} className="basis-1/2">
                  <Card className={cn(
                    "p-4 h-32 flex items-center justify-center",
                    partner.tier === 'platinum' && "border-2 border-purple-dark",
                    partner.tier === 'gold' && "border-2 border-yellow-500",
                    partner.tier === 'silver' && "border-2 border-gray-400"
                  )}>
                    <Image
                      src={partner.logo}
                      alt={partner.name}
                      width={100}
                      height={60}
                      className="object-contain"
                    />
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>

        {/* Partner CTA */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-6">
            Interested in partnering with She Sharp?
          </p>
          <Button 
            asChild 
            size="lg" 
            variant="outline"
          >
            <Link href="/sponsors">
              Become a Partner
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";