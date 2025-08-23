"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ChevronDown, Grid3X3, List, Building2 } from "lucide-react";
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
  const [filteredSponsors, setFilteredSponsors] = useState<Sponsor[]>(sponsors);
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<string>("grid");
  const [isLoading, setIsLoading] = useState(false);

  const industries = ["all", ...new Set(sponsors.map((s) => s.industry))];
  const levels = ["all", "platinum", "gold", "silver", "bronze"];

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      let filtered = [...sponsors];
      
      if (industryFilter !== "all") {
        filtered = filtered.filter((s) => s.industry === industryFilter);
      }
      
      if (levelFilter !== "all") {
        filtered = filtered.filter((s) => s.level === levelFilter);
      }
      
      setFilteredSponsors(filtered);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [industryFilter, levelFilter]);

  return (
    <Section bgColor="white">
      <Container size="wide">
        <div className="space-y-8">
          {/* Section Header */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-navy-dark">
              Our Corporate Partners
            </h2>
            <p className="text-lg text-gray max-w-2xl mx-auto">
              Join these forward-thinking organizations in creating pathways for women in STEM
            </p>
          </div>

          {/* Filters and View Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray/20">
            <div className="flex flex-wrap items-center gap-3">
              {/* Industry Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-[180px] justify-between">
                    <Building2 className="mr-2 h-4 w-4" />
                    {industryFilter === "all" ? "All Industries" : industryFilter}
                    <ChevronDown className="ml-auto h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[180px]">
                  <DropdownMenuLabel>Filter by Industry</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {industries.map((industry) => (
                    <DropdownMenuItem
                      key={industry}
                      onClick={() => setIndustryFilter(industry)}
                      className="cursor-pointer"
                    >
                      {industry === "all" ? "All Industries" : industry}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Level Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-[150px] justify-between">
                    {levelFilter === "all" ? "All Levels" : levelFilter.charAt(0).toUpperCase() + levelFilter.slice(1)}
                    <ChevronDown className="ml-auto h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[150px]">
                  <DropdownMenuLabel>Filter by Level</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {levels.map((level) => (
                    <DropdownMenuItem
                      key={level}
                      onClick={() => setLevelFilter(level)}
                      className="cursor-pointer"
                    >
                      {level === "all" ? "All Levels" : level.charAt(0).toUpperCase() + level.slice(1)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* View Mode Toggle */}
            <RadioGroup
              value={viewMode}
              onValueChange={setViewMode}
              className="flex items-center gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="grid" id="grid" />
                <Label htmlFor="grid" className="cursor-pointer flex items-center">
                  <Grid3X3 className="mr-1 h-4 w-4" />
                  Grid
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="list" id="list" />
                <Label htmlFor="list" className="cursor-pointer flex items-center">
                  <List className="mr-1 h-4 w-4" />
                  List
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Sponsors Display */}
          {isLoading ? (
            <div className={viewMode === "grid" ? layoutClasses(
              "grid",
              layoutSystem.grids.content.cols1,
              layoutSystem.grids.content.cols2,
              layoutSystem.grids.content.cols3,
              layoutSystem.grids.content.gap
            ) : "space-y-4"}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className={viewMode === "grid" ? "h-64" : "h-32"} />
              ))}
            </div>
          ) : filteredSponsors.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray">No sponsors found matching your criteria.</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className={layoutClasses(
              "grid",
              layoutSystem.grids.content.cols1,
              layoutSystem.grids.content.cols2,
              layoutSystem.grids.content.cols3,
              layoutSystem.grids.content.gap
            )}>
              {filteredSponsors.map((sponsor) => (
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
                        <h3 className="font-semibold text-navy-dark">{sponsor.name}</h3>
                        <p className="text-sm text-gray mt-1">{sponsor.description}</p>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray">{sponsor.industry}</span>
                        <span className="text-gray">Since {sponsor.joinedYear}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSponsors.map((sponsor) => (
                <Card key={sponsor.name} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-6 flex-1">
                        <div className="relative h-12 w-32 flex-shrink-0">
                          <Image
                            src={sponsor.logo}
                            alt={sponsor.name}
                            fill
                            className={`object-contain object-left ${sponsor.scale || 'scale-100'}`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-navy-dark">{sponsor.name}</h3>
                          <p className="text-sm text-gray truncate">{sponsor.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-sm text-gray">{sponsor.industry}</p>
                          <p className="text-xs text-gray">Since {sponsor.joinedYear}</p>
                        </div>
                        <Badge className={`${levelColors[sponsor.level]} text-xs`}>
                          {sponsor.level.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="text-center pt-8">
            <p className="text-gray mb-4">
              {filteredSponsors.length} {filteredSponsors.length === 1 ? "partner" : "partners"} shown
            </p>
            <Button asChild size="lg" className="bg-purple-dark hover:bg-purple-mid">
              <Link href="#contact">Join Our Partner Network</Link>
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}