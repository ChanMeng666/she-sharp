"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { useState } from "react";

const annualBenefits = [
  {
    benefit: "Logo on She Sharp website",
    bronze: true,
    silver: true,
    gold: true,
    platinum: true,
  },
  {
    benefit: "Social media recognition",
    bronze: "Quarterly",
    silver: "Monthly",
    gold: "Bi-weekly",
    platinum: "Weekly",
  },
  {
    benefit: "Event speaking opportunities",
    bronze: false,
    silver: "1 event",
    gold: "3 events",
    platinum: "All events",
  },
  {
    benefit: "Branded workshop/panel hosting",
    bronze: false,
    silver: false,
    gold: "1 per year",
    platinum: "Quarterly",
  },
  {
    benefit: "Recruitment booth at events",
    bronze: false,
    silver: "2 events",
    gold: "4 events",
    platinum: "All events",
  },
  {
    benefit: "Employee mentorship program access",
    bronze: false,
    silver: "2 slots",
    gold: "5 slots",
    platinum: "Unlimited",
  },
  {
    benefit: "Custom STEM diversity workshops",
    bronze: false,
    silver: false,
    gold: "1 workshop",
    platinum: "4 workshops",
  },
  {
    benefit: "Annual impact report feature",
    bronze: "Logo only",
    silver: "Logo + mention",
    gold: "Half page",
    platinum: "Full page",
  },
  {
    benefit: "Complimentary event tickets",
    bronze: "2 per event",
    silver: "4 per event",
    gold: "8 per event",
    platinum: "VIP table",
  },
  {
    benefit: "Investment amount (NZD)",
    bronze: "$5,000",
    silver: "$10,000",
    gold: "$20,000",
    platinum: "$50,000+",
  },
];

const eventBenefits = [
  {
    benefit: "Event naming rights",
    bronze: false,
    silver: false,
    gold: false,
    platinum: true,
  },
  {
    benefit: "Logo on event materials",
    bronze: true,
    silver: true,
    gold: true,
    platinum: true,
  },
  {
    benefit: "Opening/closing remarks",
    bronze: false,
    silver: false,
    gold: "Opening",
    platinum: "Both",
  },
  {
    benefit: "Branded activation space",
    bronze: false,
    silver: "Small booth",
    gold: "Large booth",
    platinum: "Premium space",
  },
  {
    benefit: "Social media coverage",
    bronze: "1 post",
    silver: "3 posts",
    gold: "5 posts",
    platinum: "Full coverage",
  },
  {
    benefit: "Attendee list access",
    bronze: false,
    silver: false,
    gold: "Post-event",
    platinum: "Pre & post",
  },
  {
    benefit: "Complimentary tickets",
    bronze: "2 tickets",
    silver: "5 tickets",
    gold: "10 tickets",
    platinum: "20 tickets",
  },
  {
    benefit: "Investment amount (NZD)",
    bronze: "$2,500",
    silver: "$5,000",
    gold: "$10,000",
    platinum: "$25,000+",
  },
];

function BenefitCell({ value }: { value: boolean | string }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="h-5 w-5 text-foreground mx-auto" />
    ) : (
      <X className="h-5 w-5 text-muted-foreground/30 mx-auto" />
    );
  }
  return <span className="text-sm text-foreground">{value}</span>;
}

export function SponsorshipPackagesSection() {
  const [sponsorshipType, setSponsorshipType] = useState<string>("annual");
  const benefits = sponsorshipType === "annual" ? annualBenefits : eventBenefits;

  return (
    <Section id="packages" className="py-20 bg-muted">
      <Container>
        <div className="space-y-12">
          {/* Section Header */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Partnership Packages
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the partnership level that aligns with your organization's goals and commitment to diversity in STEM.
            </p>
          </div>

          {/* Toggle between Annual and Event */}
          <div className="flex justify-center">
            <ToggleGroup
              type="single"
              value={sponsorshipType}
              onValueChange={(value) => value && setSponsorshipType(value)}
              className="bg-white/50 p-1 rounded-lg"
            >
              <ToggleGroupItem value="annual" className="px-6 py-2">
                Annual Partnership
              </ToggleGroupItem>
              <ToggleGroupItem value="event" className="px-6 py-2">
                Event Sponsorship
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Benefits Table */}
          <div className="bg-background rounded-xl shadow-sm border border-border overflow-hidden">
            <ScrollArea className="w-full">
              <div className="min-w-[640px]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-2">
                      <TableHead className="w-[280px] bg-muted font-semibold text-foreground">
                        Benefits & Features
                      </TableHead>
                      <TableHead className="text-center bg-muted">
                        <div className="space-y-1">
                          <div className="font-semibold text-foreground">Bronze</div>
                          <Badge variant="outline" className="text-xs">Entry Level</Badge>
                        </div>
                      </TableHead>
                      <TableHead className="text-center bg-muted">
                        <div className="space-y-1">
                          <div className="font-semibold text-foreground">Silver</div>
                          <Badge variant="outline" className="text-xs">Popular</Badge>
                        </div>
                      </TableHead>
                      <TableHead className="text-center bg-muted">
                        <div className="space-y-1">
                          <div className="font-semibold text-foreground">Gold</div>
                          <Badge className="bg-foreground text-background hover:bg-foreground/90 text-xs">
                            Recommended
                          </Badge>
                        </div>
                      </TableHead>
                      <TableHead className="text-center bg-muted">
                        <div className="space-y-1">
                          <div className="font-semibold text-foreground">Platinum</div>
                          <Badge variant="outline" className="text-xs">Premium</Badge>
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {benefits.map((row, index) => (
                      <TableRow
                        key={index}
                        className={
                          row.benefit.includes("Investment amount")
                            ? "bg-muted font-semibold"
                            : index % 2 === 0
                            ? "bg-muted/30"
                            : ""
                        }
                      >
                        <TableCell className="font-medium text-foreground">
                          {row.benefit}
                        </TableCell>
                        <TableCell className="text-center">
                          <BenefitCell value={row.bronze} />
                        </TableCell>
                        <TableCell className="text-center">
                          <BenefitCell value={row.silver} />
                        </TableCell>
                        <TableCell className="text-center bg-muted/50">
                          <BenefitCell value={row.gold} />
                        </TableCell>
                        <TableCell className="text-center">
                          <BenefitCell value={row.platinum} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>

          {/* CTA */}
          <div className="text-center pt-8">
            <p className="text-sm text-muted-foreground mb-4">
              All packages are customizable to meet your specific objectives
            </p>
            <a
              href="#contact"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-foreground text-background hover:bg-foreground/90 h-11 px-8"
            >
              Discuss Partnership Options
            </a>
          </div>
        </div>
      </Container>
    </Section>
  );
}