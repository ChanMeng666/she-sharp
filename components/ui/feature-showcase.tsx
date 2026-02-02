"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

export function FeatureShowcase({
  eyebrow,
  title,
  description,
  stats = [],
  volunteerPaths = [],
  tabs,
  defaultTab,
  panelMinHeight = 600,
  primaryCta = { label: "Get started", href: "#start" },
  secondaryCta,
  className,
}: FeatureShowcaseProps) {
  const initial = defaultTab ?? tabs[0]?.value ?? "tab-0";

  return (
    <section className={cn("w-full bg-background text-foreground", className)}>
      {/* Hero Header */}
      <div className="bg-gradient-to-b from-muted/50 to-background py-16 md:py-24">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left: Text Content */}
            <div>
              {eyebrow && (
                <Badge variant="outline" className="mb-4">
                  {eyebrow}
                </Badge>
              )}

              <h1 className="text-display-sm mb-6">
                {title}
              </h1>

              {description && (
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8">
                  {description}
                </p>
              )}

              {/* Stats chips */}
              {stats.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-8">
                  {stats.map((s, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="bg-brand/10 text-brand border-brand/20 px-4 py-2 text-sm"
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Image Showcase */}
            <div>
              <Card
                className="relative overflow-hidden rounded-3xl border border-border bg-card/40 p-0 shadow-lg"
                style={{ height: panelMinHeight, minHeight: panelMinHeight }}
              >
                <Tabs defaultValue={initial} className="relative h-full w-full">
                  <div className="relative h-full w-full">
                    {tabs.map((t, idx) => (
                      <TabsContent
                        key={t.value}
                        value={t.value}
                        className={cn(
                          "absolute inset-0 m-0 h-full w-full",
                          "data-[state=inactive]:hidden"
                        )}
                      >
                        <Image
                          src={t.src}
                          alt={t.alt ?? t.label}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 50vw"
                          priority={idx === 0}
                        />
                      </TabsContent>
                    ))}
                  </div>

                  <div className="pointer-events-auto absolute inset-x-0 bottom-6 z-10 flex w-full justify-center">
                    <TabsList className="h-12 p-1.5 glass-pill">
                      {tabs.map((t) => (
                        <TabsTrigger
                          key={t.value}
                          value={t.value}
                          className="px-6 py-2 text-sm rounded-full data-[state=active]:bg-brand data-[state=active]:text-brand-foreground"
                        >
                          {t.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>
                </Tabs>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Volunteer Paths Section */}
      {volunteerPaths.length > 0 && (
        <div className="py-16 md:py-24 bg-background">
          <div className="container mx-auto max-w-7xl px-6">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-display-sm text-foreground mb-4">
                Choose Your Path
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Whether you have a few hours or want to make a bigger commitment, there's a place for you on our team.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {volunteerPaths.map((path, index) => (
                <Card
                  key={path.id}
                  className={cn(
                    "relative overflow-hidden rounded-3xl p-8 transition-all duration-300 hover:shadow-lg",
                    index === 0
                      ? "bg-linear-to-br from-teal-50 to-cyan-50 border-teal-200/50"
                      : "bg-linear-to-br from-purple-50 to-pink-50 border-purple-200/50"
                  )}
                >
                  {/* Header */}
                  <div className="mb-6">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center",
                          index === 0 ? "bg-teal-500" : "bg-brand"
                        )}
                      >
                        {index === 0 ? (
                          <Users className="w-6 h-6 text-white" />
                        ) : (
                          <Award className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "px-3 py-1",
                          index === 0
                            ? "border-teal-300 text-teal-700 bg-teal-100/50"
                            : "border-purple-300 text-purple-700 bg-purple-100/50"
                        )}
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        {path.commitment}
                      </Badge>
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">
                      {path.title}
                    </h3>
                  </div>

                  {/* Highlights */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className={cn("w-4 h-4", index === 0 ? "text-teal-600" : "text-purple-600")} />
                      <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Highlights
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {path.highlights.map((highlight, i) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className={cn(
                            "text-xs",
                            index === 0 ? "bg-teal-100 text-teal-800" : "bg-purple-100 text-purple-800"
                          )}
                        >
                          {highlight}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Responsibilities */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className={cn("w-4 h-4", index === 0 ? "text-teal-600" : "text-purple-600")} />
                      <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Responsibilities
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {path.responsibilities.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Check className={cn("w-4 h-4 mt-0.5 shrink-0", index === 0 ? "text-teal-500" : "text-purple-500")} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Benefits */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Heart className={cn("w-4 h-4", index === 0 ? "text-teal-600" : "text-purple-600")} />
                      <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Benefits
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {path.benefits.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Check className={cn("w-4 h-4 mt-0.5 shrink-0", index === 0 ? "text-teal-500" : "text-purple-500")} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Application Note */}
                  <div
                    className={cn(
                      "rounded-xl p-4 text-sm mb-6",
                      index === 0 ? "bg-teal-100/50 text-teal-800" : "bg-purple-100/50 text-purple-800"
                    )}
                  >
                    <p className="font-medium">{path.applicationNote}</p>
                  </div>

                  {/* Apply Button */}
                  <Button
                    asChild
                    size="lg"
                    className={cn(
                      "w-1/2 mx-auto",
                      index === 0
                        ? "bg-teal-500 hover:bg-teal-600 text-white"
                        : "bg-brand hover:bg-brand-hover text-white"
                    )}
                  >
                    <Link href={primaryCta.href}>Apply Now</Link>
                  </Button>
                </Card>
              ))}
            </div>

          </div>
        </div>
      )}
    </section>
  );
}
