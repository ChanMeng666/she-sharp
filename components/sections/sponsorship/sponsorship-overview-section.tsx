"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Toggle } from "@/components/ui/toggle";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { layoutSystem } from "@/lib/layout-system";

const applicationSteps = [
  {
    number: "01",
    title: "Initial Inquiry",
    description: "Reach out through our contact form or email to express your interest in partnership. We'll respond within 24-48 hours.",
    duration: "1-2 days",
    details: [
      "Fill out the partnership inquiry form",
      "Provide basic company information",
      "Indicate preferred sponsorship level",
      "Share your diversity & inclusion goals",
    ],
  },
  {
    number: "02",
    title: "Discovery Meeting",
    description: "Schedule a 30-minute virtual meeting to discuss your objectives and explore partnership opportunities.",
    duration: "30 minutes",
    details: [
      "Meet with our Partnership Manager",
      "Discuss your company's D&I initiatives",
      "Review available sponsorship packages",
      "Identify alignment opportunities",
    ],
  },
  {
    number: "03",
    title: "Proposal & Customization",
    description: "Receive a tailored partnership proposal based on your goals and budget, with options for customization.",
    duration: "3-5 days",
    details: [
      "Customized partnership proposal",
      "Detailed benefits breakdown",
      "Annual event calendar",
      "Success metrics framework",
    ],
  },
  {
    number: "04",
    title: "Agreement & Onboarding",
    description: "Finalize the partnership agreement and begin the onboarding process with our dedicated team.",
    duration: "1 week",
    details: [
      "Review and sign partnership agreement",
      "Submit company assets (logo, description)",
      "Schedule onboarding session",
      "Receive partnership welcome kit",
    ],
  },
  {
    number: "05",
    title: "Launch & Activation",
    description: "Your partnership goes live! Start accessing benefits and making an impact in the STEM community.",
    duration: "Ongoing",
    details: [
      "Website and social media announcement",
      "Access to member network",
      "Event participation begins",
      "Quarterly check-ins scheduled",
    ],
  },
];

export function SponsorshipOverviewSection() {
  const [expandedSteps, setExpandedSteps] = useState<number[]>([0]);

  const toggleStep = (index: number) => {
    setExpandedSteps((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  return (
    <Section bgColor="accent">
      <Container size="content">
        <div className="space-y-12">
          {/* Section Header */}
          <div className="text-center space-y-4">
            <Badge className="bg-foreground text-background hover:bg-foreground">
              Simple & Transparent Process
            </Badge>
            <h2 className="text-display-sm text-foreground mt-4">
              Your Partnership Journey
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From initial contact to active partnership, we make the process seamless and rewarding.
            </p>
          </div>

          {/* Application Steps */}
          <div className="space-y-4">
            {applicationSteps.map((step, index) => {
              const isExpanded = expandedSteps.includes(index);
              const isCompleted = false; // This could be dynamic based on actual progress

              return (
                <Card
                  key={index}
                  className="overflow-hidden transition-shadow duration-150 hover:shadow-md"
                >
                  <CardContent className="p-0">
                    <Toggle
                      pressed={isExpanded}
                      onPressedChange={() => toggleStep(index)}
                      className="w-full p-6 hover:bg-transparent data-[state=on]:bg-transparent"
                    >
                      <div className="w-full">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                                <span className="text-lg font-bold text-foreground">
                                  {step.number}
                                </span>
                              </div>
                              {isCompleted && (
                                <CheckCircle2 className="absolute -bottom-1 -right-1 h-5 w-5 text-foreground bg-background rounded-full" />
                              )}
                            </div>
                            <div className="text-left">
                              <h3 className="font-semibold text-foreground text-lg">
                                {step.title}
                              </h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {step.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="hidden sm:inline-flex">
                              {step.duration}
                            </Badge>
                            {isExpanded ? (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </div>
                    </Toggle>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="px-6 pb-6 pt-0">
                        <div className="ml-16 space-y-3">
                          {step.details.map((detail, detailIndex) => (
                            <div
                              key={detailIndex}
                              className="flex items-start gap-3"
                            >
                              <Circle className="h-2 w-2 text-foreground mt-2 flex-shrink-0" />
                              <span className="text-sm text-muted-foreground">
                                {detail}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Timeline Summary */}
          <div className="bg-background rounded-xl p-8 text-center">
            <h3 className="text-xl font-semibold text-foreground mb-4">
              Total Timeline: 2-3 Weeks
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From your initial inquiry to becoming an active partner, the entire process
              typically takes 2-3 weeks. We're committed to making your partnership journey
              smooth, transparent, and aligned with your goals.
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}