"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users, Calendar, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { layoutSystem, layoutClasses } from "@/lib/layout-system";

const impactMetrics = [
  {
    icon: Users,
    label: "Community Impact",
    current: 2200,
    target: 3000,
    unit: "active members",
    description: "Growing our inclusive STEM community",
    color: "purple",
  },
  {
    icon: Calendar,
    label: "Annual Engagement",
    current: 8,
    target: 12,
    unit: "events per year",
    description: "Expanding opportunities to connect",
    color: "periwinkle",
  },
  {
    icon: TrendingUp,
    label: "Partner Satisfaction",
    current: 95,
    target: 100,
    unit: "% renewal rate",
    description: "Building lasting partnerships",
    color: "mint",
  },
];

export function SponsorshipStatsSection() {
  const [animatedValues, setAnimatedValues] = useState(
    impactMetrics.map(() => 0)
  );

  useEffect(() => {
    const timers = impactMetrics.map((metric, index) => {
      return setTimeout(() => {
        const interval = setInterval(() => {
          setAnimatedValues((prev) => {
            const newValues = [...prev];
            const progress = (metric.current / metric.target) * 100;
            if (newValues[index] < progress) {
              newValues[index] = Math.min(newValues[index] + 2, progress);
            }
            return newValues;
          });
        }, 20);

        return () => clearInterval(interval);
      }, index * 200);
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <Section bgColor="white">
      <Container size="content">
        <div>
          <div className="text-center mb-12">
            <h2 className="text-display-sm text-foreground mb-4">
              Our Collective Impact
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Partner with us to drive meaningful change in the STEM community
            </p>
          </div>

          <div className={layoutClasses(
            "grid",
            layoutSystem.grids.content.cols1,
            layoutSystem.grids.content.cols3,
            layoutSystem.grids.content.gap
          )}>
            {impactMetrics.map((metric, index) => {
              const Icon = metric.icon;
              const progress = animatedValues[index];

              return (
                <Card key={metric.label} className="overflow-hidden border-2 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="p-3 rounded-full bg-muted">
                          <Icon className="h-6 w-6 text-foreground" />
                        </div>
                        <span className="text-2xl font-bold text-foreground">
                          {metric.current.toLocaleString()}
                          {metric.unit.includes("%") ? "%" : "+"}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-semibold text-foreground mb-1">
                          {metric.label}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {metric.description}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Current</span>
                          <span>Goal: {metric.target.toLocaleString()}{metric.unit.includes("%") ? "%" : ""}</span>
                        </div>
                        <Progress
                          value={progress}
                          className="h-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">
              Since 2014, we've hosted <span className="font-semibold text-foreground">84+ events</span> and
              partnered with <span className="font-semibold text-foreground">50+ organizations</span> to
              create lasting change.
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}