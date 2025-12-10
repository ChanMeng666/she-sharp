"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Heart, Calendar, Globe, GraduationCap, TrendingUp } from "lucide-react";
import { pageStats } from "@/lib/data/stats";
import { layoutSystem, layoutClasses } from "@/lib/layout-system";

const programFeatures = [
  {
    icon: Calendar,
    title: "3-Month Journey",
    description: "Structured program with clear milestones and regular check-ins",
  },
  {
    icon: Users,
    title: "Expert Matching",
    description: "Pairing based on goals, industry, and compatibility",
  },
  {
    icon: Globe,
    title: "Community Support",
    description: "Join events, workshops, and a supportive network",
  },
];

const iconMap: Record<string, any> = {
  Users,
  GraduationCap,
  TrendingUp,
};

export function ProgramOverviewSection() {
  return (
    <Section bgColor="white">
      <Container size="wide">
        <div className={layoutClasses(
          "grid lg:grid-cols-12 items-center",
          layoutSystem.patterns.splitLayout.gap
        )}>
          {/* Left Content */}
          <div className={layoutClasses("space-y-6", layoutSystem.patterns.splitLayout.left)}>
            <div>
              <Badge className="mb-4 bg-muted text-foreground border-border">
                <Heart className="w-3 h-3 mr-1" />
                Empowering Women in Tech
              </Badge>
              <h2 className="text-display-sm text-foreground mb-4">
                Mentorship that moves careers forward
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                We connect women in STEM with mentors for structured 1:1 guidance. Gain clarity, overcome challenges, and grow with a supportive community.
              </p>
            </div>

            {/* Program Features Grid */}
            <div className="grid grid-cols-2 gap-4">
              {programFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card key={feature.title} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <Icon className="w-8 h-8 text-foreground mb-3" />
                      <h3 className="font-semibold text-foreground text-sm mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Right Content - Key Metrics (single source) */}
          <div className={layoutSystem.patterns.splitLayout.right}>
            <Card className="overflow-hidden">
              <CardHeader className="bg-muted">
                <CardTitle className="text-foreground">Program Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  {pageStats.mentorship.overview.map((item) => {
                    const Icon = iconMap[item.icon] || Users;
                    const displayValue = `${item.value}${item.suffix || ""}`;
                    return (
                      <div key={item.label} className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-muted">
                          <Icon className="w-5 h-5 text-foreground" />
                        </div>
                        <div>
                          <div className="text-xl font-bold text-foreground">{displayValue}</div>
                          <div className="text-sm text-muted-foreground">{item.label}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </Section>
  );
}