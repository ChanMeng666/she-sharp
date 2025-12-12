"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

export type TabMedia = {
  value: string;
  label: string;
  src: string;
  alt?: string;
};

export type ShowcaseStep = {
  id: string;
  title: string;
  text: string;
};

export type FeatureShowcaseProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  stats?: string[];
  steps?: ShowcaseStep[];
  tabs: TabMedia[];
  defaultTab?: string;
  panelMinHeight?: number;
  primaryCta?: {
    label: string;
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
  steps = [],
  tabs,
  defaultTab,
  panelMinHeight = 720,
  primaryCta = { label: "Get started", href: "#start" },
  secondaryCta,
  className,
}: FeatureShowcaseProps) {
  const initial = defaultTab ?? tabs[0]?.value ?? "tab-0";

  return (
    <section className={cn("w-full bg-background text-foreground", className)}>
      <div className="container mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-16 md:grid-cols-12 md:py-20 lg:gap-14">
        {/* Left column */}
        <div className="md:col-span-6">
          {eyebrow && (
            <Badge variant="outline" className="mb-6">
              {eyebrow}
            </Badge>
          )}

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter">
            {title}
          </h2>

          {description ? (
            <p className="mt-6 max-w-xl text-muted-foreground">{description}</p>
          ) : null}

          {/* Stats chips */}
          {stats.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {stats.map((s, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="bg-muted text-foreground"
                >
                  {s}
                </Badge>
              ))}
            </div>
          )}

          {/* Steps (Accordion) */}
          {steps.length > 0 && (
            <div className="mt-10 max-w-xl">
              <Accordion type="single" collapsible className="w-full">
                {steps.map((step) => (
                  <AccordionItem key={step.id} value={step.id}>
                    <AccordionTrigger className="text-left text-base font-medium">
                      {step.title}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      {step.text}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              {/* CTAs */}
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" variant="brand">
                  <Link href={primaryCta.href}>{primaryCta.label}</Link>
                </Button>
                {secondaryCta && (
                  <Button asChild size="lg" variant="outline">
                    <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="md:col-span-6">
          <Card
            className="relative overflow-hidden rounded-[50px] border border-border bg-card/40 p-0 shadow-sm"
            style={{ height: panelMinHeight, minHeight: panelMinHeight }}
          >
            <Tabs defaultValue={initial} className="relative h-full w-full">
              {/* Absolute-fill media container */}
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

              {/* Tab controls (pill) */}
              <div className="pointer-events-auto absolute inset-x-0 bottom-6 z-10 flex w-full justify-center">
                <TabsList className="h-14 p-1.5 bg-white/50 backdrop-blur-sm rounded-full">
                  {tabs.map((t) => (
                    <TabsTrigger
                      key={t.value}
                      value={t.value}
                      className="px-8 py-2.5 text-base rounded-full data-[state=active]:bg-brand data-[state=active]:text-brand-foreground"
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
    </section>
  );
}
