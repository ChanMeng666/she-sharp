import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { layoutSystem, layoutClasses } from "@/lib/layout-system";

interface Sponsor {
  name: string;
  logo: string;
  level: "platinum" | "gold" | "silver" | "bronze";
  industry: string;
  joinedYear: number;
  description?: string;
  scale?: string;
}

const sponsors: Sponsor[] = [
  {
    name: "HCLTech",
    logo: "https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/6470185f85072710b161d610_hcltech-logo.svg",
    level: "silver",
    industry: "Technology",
    joinedYear: 2021,
    description: "Global technology company empowering enterprises with next-gen solutions.",
    scale: "scale-90" // Reduced size as requested
  },
  {
    name: "Fonterra",
    logo: "https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/65e50fc6d2f01ad68fb15688_fonterra.png",
    level: "silver",
    industry: "Agriculture",
    joinedYear: 2022,
    description: "Leading dairy nutrition company committed to diversity and innovation.",
    scale: "scale-100" // Maintaining good balance
  },
  {
    name: "MYOB",
    logo: "https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/64701860f27305f34ecc8b66_myob-logo.svg",
    level: "silver",
    industry: "Technology",
    joinedYear: 2020,
    description: "Business management platform supporting SMEs across New Zealand.",
    scale: "scale-105" // Reduced size as requested
  },
  {
    name: "Fisher & Paykel Healthcare",
    logo: "https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/65d80a4331c46a8a017e669f_PNG%20-%20for%20web%2C%20video%2C%20%26%20MS%20Office_F%26P_HEALTHCARE-BLACK.png",
    level: "bronze",
    industry: "Healthcare",
    joinedYear: 2023,
    description: "Medical device manufacturer improving care and outcomes globally.",
    scale: "scale-125" // Increased size as requested for more prominence
  },
];

const levelColors = {
  platinum: "bg-gray-400 text-white",
  gold: "bg-yellow-500 text-white",
  silver: "bg-gray-500 text-white",
  bronze: "bg-orange-600 text-white",
};

export function CurrentSponsorsSection() {
  return (
    <Section bgColor="white">
      <Container size="wide">
        <div className="space-y-8">
          {/* Section Header */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Our Corporate Partners
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join these forward-thinking organizations in creating pathways for women in STEM
            </p>
          </div>

          {/* Sponsors Grid */}
          <div className={layoutClasses(
            "grid",
            layoutSystem.grids.content.cols1,
            layoutSystem.grids.content.cols2,
            layoutSystem.grids.content.cols4,
            layoutSystem.grids.content.gap
          )}>
            {sponsors.map((sponsor) => (
              <Card key={sponsor.name} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="relative h-12 w-32">
                        <Image
                          src={sponsor.logo}
                          alt={sponsor.name}
                          fill
                          className={`object-contain object-left ${sponsor.scale || 'scale-100'}`}
                        />
                      </div>
                      <Badge className={`${levelColors[sponsor.level]} text-xs`}>
                        {sponsor.level.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{sponsor.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{sponsor.description}</p>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">{sponsor.industry}</span>
                      <span className="text-muted-foreground">Since {sponsor.joinedYear}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center pt-8">
            <Button asChild size="lg">
              <Link href="#contact">Join Our Partner Network</Link>
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}