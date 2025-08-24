"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Heart, Calendar, Globe, GraduationCap, TrendingUp } from "lucide-react";
import { pageStats } from "@/lib/data/stats";
import { layoutSystem, layoutClasses } from "@/lib/layout-system";
import Iridescence, { brandColors } from "@/components/effects/iridescence";
import { useInView } from "@/hooks/use-in-view";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

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
  const { ref, inView } = useInView();
  const reduceMotion = usePrefersReducedMotion();

  return (
    <Section bgColor="white">
      <div ref={ref} className="relative">
        {inView && !reduceMotion && (
          <div className="absolute inset-0 opacity-15 pointer-events-none">
            <Iridescence
              color={brandColors.testimonialsSky}
              mouseReact={false}
              amplitude={0.04}
              speed={0.2}
              className="w-full h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/40 to-white/60" />
          </div>
        )}
        <Container size="wide" className="relative z-10">
          <div className={layoutClasses(
            "grid lg:grid-cols-12 items-center",
            layoutSystem.patterns.splitLayout.gap
          )}>
            {/* Left Content */}
            <div className={layoutClasses("space-y-6", layoutSystem.patterns.splitLayout.left)}>
              <div>
                <Badge className="mb-4 bg-purple-dark/10 text-purple-dark border-purple-dark">
                  <Heart className="w-3 h-3 mr-1" />
                  Empowering Women in Tech
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold text-navy-dark mb-4">
                  Mentorship that moves careers forward
                </h2>
                <p className="text-lg text-gray leading-relaxed">
                  We connect women in STEM with mentors for structured 1:1 guidance. Gain clarity, overcome challenges, and grow with a supportive community.
                </p>
              </div>

              {/* Program Features Grid */}
              <div className="grid grid-cols-2 gap-4">
                {programFeatures.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <Card key={feature.title} className="hover:shadow-md transition-shadow backdrop-blur-sm bg-white/80">
                      <CardContent className="p-4">
                        <Icon className="w-8 h-8 text-purple-dark mb-3" />
                        <h3 className="font-semibold text-navy-dark text-sm mb-1">
                          {feature.title}
                        </h3>
                        <p className="text-xs text-gray">
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
              <Card className="overflow-hidden backdrop-blur-sm bg-white/90">
                <CardHeader className="bg-periwinkle-light">
                  <CardTitle className="text-navy-dark">Program Snapshot</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    {pageStats.mentorship.overview.map((item) => {
                      const Icon = iconMap[item.icon] || Users;
                      const displayValue = `${item.value}${item.suffix || ""}`;
                      return (
                        <div key={item.label} className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-light/50">
                            <Icon className="w-5 h-5 text-purple-dark" />
                          </div>
                          <div>
                            <div className="text-xl font-bold text-navy-dark dark:text-white">{displayValue}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{item.label}</div>
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
      </div>
    </Section>
  );
}