"use client";
import * as React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/layout/container";
import { cn } from "@/lib/utils";
import { Check, Clock, Sparkles, Users, Heart, Award } from "lucide-react";

export type TabMedia = {
  value: string;
  label: string;
  src: string;
  alt?: string;
};

export type VolunteerPath = {
  id: string;
  title: string;
  commitment: string;
  highlights: string[];
  responsibilities: string[];
  benefits: string[];
  applicationNote: string;
};

export type FeatureShowcaseProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  stats?: string[];
  volunteerPaths?: VolunteerPath[];
  tabs: TabMedia[];
  defaultTab?: string;
  panelMinHeight?: number;
  primaryCta?: {
    label: string;
    mobileLabel?: string;
    href: string;
  };
  secondaryCta?: {
    label: string;
    href: string;
  };
  className?: string;
};

export function VolunteerPathsSection({
  volunteerPaths = [],
  tabs,
  defaultTab,
  primaryCta = { label: "Get started", href: "#start" },
  className,
}: FeatureShowcaseProps) {
  const initial = defaultTab ?? tabs[0]?.value ?? "tab-0";

  return (
    <section className="w-full  text-foreground ">
      {/* Volunteer Paths Section */}
      {volunteerPaths.length > 0 && (
        <div className="py-16 md:py-24 bg-white">
          <Container size="full">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-display-sm text-foreground mb-4">
                Choose Your Path
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
                Whether you have a few hours or want to make a bigger commitment, there's a place for you on our team.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-4 md:py-6">
              {volunteerPaths.slice().reverse().map((path, index) => {
                const originalIndex = volunteerPaths.length - 1 - index;
                return (
                  <Card
                    key={path.id}
                    className={cn(
                      "relative overflow-hidden rounded-3xl p-8 transition-all duration-300 hover:shadow-lg bg-card border flex flex-col",
                      index === 0 ? "border-brand/20" : "border-periwinkle-dark/20"
                    )}
                  >
                    {/* Header */}
                    <div className="mb-6 shrink-0">
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center",
                            index === 0 ? "bg-brand" : "bg-periwinkle-dark"
                          )}
                        >
                          {originalIndex === 0 ? (
                            <Users className="w-6 h-6 text-white" />
                          ) : (
                            <Award className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <Badge variant="outline" className="px-4 py-2 border-border text-foreground bg-muted/50">
                          <Clock className="w-3 h-3 mr-1" />
                          {path.commitment}
                        </Badge>
                      </div>
                      <h3 className="text-2xl font-bold text-foreground mb-2">
                        {path.title}
                      </h3>
                    </div>

                    {/* Content area that grows */}
                    <div className="flex-1 flex flex-col">
                      {/* Highlights */}
                      <div className="mb-8">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles
                            className={cn("w-4 h-4", index === 0 ? "text-brand" : "text-periwinkle-dark")}
                          />
                          <span className="text-lg font-semibold text-muted-foreground uppercase ">
                            Highlights
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {path.highlights.map((highlight, i) => (
                            <Badge key={i} variant="secondary" className="text-sm px-4 py-2 rounded-full">
                              {highlight}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Responsibilities */}
                      <div className="mb-8">
                        <div className="flex items-center gap-2 mb-3">
                          <Users
                            className={cn("w-4 h-4", index === 0 ? "text-brand" : "text-periwinkle-dark")}
                          />
                          <span className="text-lg font-semibold text-muted-foreground uppercase ">
                            Responsibilities
                          </span>
                        </div>
                        <ul className="space-y-2">
                          {path.responsibilities.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <Check
                                className={cn(
                                  "w-4 h-4 mt-0.5 shrink-0",
                                  index === 0 ? "text-brand" : "text-periwinkle-dark"
                                )}
                              />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Benefits */}
                      <div className="mb-8">
                        <div className="flex items-center gap-2 mb-3">
                          <Heart
                            className={cn("w-4 h-4", index === 0 ? "text-brand" : "text-periwinkle-dark")}
                          />
                          <span className="text-lg font-semibold text-muted-foreground uppercase ">
                            Benefits
                          </span>
                        </div>
                        <ul className="space-y-2">
                          {path.benefits.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <Check
                                className={cn(
                                  "w-4 h-4 mt-0.5 shrink-0",
                                  index === 0 ? "text-brand" : "text-periwinkle-dark"
                                )}
                              />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Application Note */}
                      <div className="rounded-xl p-4 text-sm mb-6 bg-muted/50 text-foreground">
                        <p className="font-medium">{path.applicationNote}</p>
                      </div>
                    </div>

                    {/* Apply Button - Fixed at bottom */}
                    <div className="flex justify-start mt-auto shrink-0">
                      <Button
                        asChild
                        size="lg"
                        className={cn(
                          "text-white",
                          index === 0
                            ? "bg-brand hover:bg-brand/90"
                            : "bg-periwinkle-dark hover:bg-periwinkle-dark/90"
                        )}
                      >
                        <Link
                          href={
                            path.id === "volunteer"
                              ? "https://docs.google.com/forms/d/e/1FAIpQLSdTEFjOs6lLHZDGpSvoMfkckloPBMbvFA45iNhVvh1sAsUZlA/viewform"
                              : path.id === "ambassador"
                              ? "https://docs.google.com/forms/d/e/1FAIpQLSfQCjMOvfh7OVmBZg3T7eS70xhKkB_iSnlIpjv3xJ1i-EUTyg/viewform"
                              : primaryCta.href
                          }
                          target="_blank"
                        >
                          Apply Now
                        </Link>
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </Container>
        </div>
      )}
    </section>
  );
}