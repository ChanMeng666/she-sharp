"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Minus, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { VolunteerPath } from "@/components/join-team/types";

interface FeatureRow {
  name: string;
  /** Which path IDs include this feature */
  includedIn: string[];
}

interface FeatureCategory {
  title: string;
  features: FeatureRow[];
}

function buildComparisonData(paths: VolunteerPath[]): FeatureCategory[] {
  const allHighlights = new Set<string>();
  const allResponsibilities = new Set<string>();
  const allBenefits = new Set<string>();

  for (const path of paths) {
    path.highlights.forEach((h) => allHighlights.add(h));
    path.responsibilities.forEach((r) => allResponsibilities.add(r));
    path.benefits.forEach((b) => allBenefits.add(b));
  }

  function buildRows(
    allItems: Set<string>,
    key: "highlights" | "responsibilities" | "benefits"
  ): FeatureRow[] {
    return Array.from(allItems).map((item) => ({
      name: item,
      includedIn: paths.filter((p) => p[key].includes(item)).map((p) => p.id),
    }));
  }

  return [
    { title: "Highlights", features: buildRows(allHighlights, "highlights") },
    {
      title: "Responsibilities",
      features: buildRows(allResponsibilities, "responsibilities"),
    },
    { title: "Benefits", features: buildRows(allBenefits, "benefits") },
  ];
}

function getPathHref(id: string): string {
  if (id === "volunteer") return "/join-our-team/apply?type=volunteer";
  if (id === "ambassador") return "/join-our-team/apply?type=ambassador";
  if (id === "ex-ambassador") return "/join-our-team/apply/ex-ambassador";
  return "/join-our-team";
}

function getButtonLabel(id: string): string {
  return id === "ex-ambassador" ? "Share Feedback" : "Apply Now";
}

export function PricingComparison({
  volunteerPaths,
}: {
  volunteerPaths: VolunteerPath[];
}) {
  // Display in reverse order (same as old component)
  const paths = [...volunteerPaths].reverse();
  const categories = buildComparisonData(paths);

  return (
    <section className="w-full py-16 md:py-20 lg:py-24 bg-white text-foreground">
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10 md:mb-12 lg:mb-16">
          <Badge
            variant="outline"
            className="mb-4 px-4 py-1.5 text-sm font-medium border-brand/30 text-brand"
          >
            Choose Your Path
          </Badge>
          <h2 className="text-display-sm text-foreground mb-4">
            Compare Volunteer Paths
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Whether you have a few hours or want to make a bigger commitment,
            there&apos;s a place for you on our team.
          </p>
        </div>

        {/* Mobile cards (visible below lg) */}
        <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {paths.map((path, index) => (
            <div
              key={path.id}
              className={cn(
                "card-sm border p-4 sm:p-5 md:p-6 transition-all duration-300 hover:shadow-md",
                index === 0 ? "border-brand/30" : "border-border"
              )}
            >
              <h3 className="text-xl font-bold text-foreground mb-1">
                {path.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                {path.description}
              </p>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-5">
                <Clock className="w-4 h-4" />
                {path.commitment}
              </div>

              {categories.map((category) => (
                <div key={category.title} className="mb-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    {category.title}
                  </h4>
                  <ul className="space-y-1.5">
                    {category.features.map((feature) => {
                      const included = feature.includedIn.includes(path.id);
                      return (
                        <li
                          key={feature.name}
                          className="flex items-start gap-2 text-sm"
                        >
                          {included ? (
                            <Check
                              className={cn(
                                "w-4 h-4 mt-0.5 shrink-0",
                                index === 0
                                  ? "text-brand"
                                  : "text-periwinkle-dark"
                              )}
                            />
                          ) : (
                            <Minus className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground/30" />
                          )}
                          <span
                            className={
                              included
                                ? "text-foreground"
                                : "text-muted-foreground/40"
                            }
                          >
                            {feature.name}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}

              <Button
                asChild
                size="lg"
                variant={index === 0 ? "brand" : "outline"}
                className="w-full mt-2"
              >
                <Link href={getPathHref(path.id)}>
                  {getButtonLabel(path.id)}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          ))}
        </div>

        {/* Desktop comparison table (visible at lg+) */}
        <div className="hidden lg:block">
          <div className="card-sm border border-border">
            {/* Column headers */}
            <div className="grid grid-cols-4 divide-x divide-border">
              {/* Empty top-left cell */}
              <div className="p-6 bg-muted/30" />

              {/* Path headers */}
              {paths.map((path, index) => (
                <div
                  key={path.id}
                  className={cn(
                    "p-6 text-center",
                    index === 0 ? "bg-brand/5" : "bg-muted/30"
                  )}
                >
                  <h3 className="text-lg font-bold text-foreground mb-1">
                    {path.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {path.description}
                  </p>
                  <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground mb-4">
                    <Clock className="w-4 h-4" />
                    {path.commitment}
                  </div>
                  <Button
                    asChild
                    size="default"
                    variant={index === 0 ? "brand" : "outline"}
                    className="w-full"
                  >
                    <Link href={getPathHref(path.id)}>
                      {getButtonLabel(path.id)}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>

            {/* Feature categories */}
            {categories.map((category) => (
              <div key={category.title}>
                {/* Category header row */}
                <div className="grid grid-cols-4 divide-x divide-border bg-muted/50">
                  <div className="p-4">
                    <span className="text-sm font-semibold uppercase tracking-wider text-foreground">
                      {category.title}
                    </span>
                  </div>
                  <div className="col-span-3" />
                </div>

                {/* Feature rows */}
                {category.features.map((feature) => (
                  <div
                    key={feature.name}
                    className="grid grid-cols-4 divide-x divide-border border-t border-border hover:bg-muted/20 transition-colors"
                  >
                    <div className="p-4 flex items-center">
                      <span className="text-sm text-foreground">
                        {feature.name}
                      </span>
                    </div>
                    {paths.map((path, index) => {
                      const included = feature.includedIn.includes(path.id);
                      return (
                        <div
                          key={path.id}
                          className={cn(
                            "p-4 flex items-center justify-center",
                            index === 0 ? "bg-brand/[0.02]" : ""
                          )}
                        >
                          {included ? (
                            <Check
                              className={cn(
                                "w-5 h-5",
                                index === 0
                                  ? "text-brand"
                                  : "text-periwinkle-dark"
                              )}
                            />
                          ) : (
                            <Minus className="w-5 h-5 text-muted-foreground/30" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
