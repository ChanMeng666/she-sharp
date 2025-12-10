"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { TrendingUp, Users, Award, Sparkles, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { globalStats, pageStats } from "@/lib/data/stats";

const stats = pageStats.mentorship.outcomes.map((outcome, index) => {
  const icons = [Sparkles, Users, TrendingUp, Award];
  const colors = ["purple", "periwinkle", "mint", "navy"];
  
  return {
    percentage: outcome.percentage,
    value: outcome.percentage.includes("%") ? parseInt(outcome.percentage) : 100,
    description: outcome.description,
    detail: outcome.detail,
    icon: icons[index],
    color: colors[index]
  };
});

export function StatsSection() {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const getColorClasses = (color: string) => {
    switch (color) {
      case "purple":
      case "periwinkle":
      case "mint":
      case "navy":
      default:
        return {
          bg: "bg-muted",
          border: "border-border",
          text: "text-foreground",
          progress: "bg-foreground"
        };
    }
  };

  return (
    <Section className="py-16 md:py-24 bg-background">
      <Container>
        <div className="text-center mb-12">
          <h2 className="text-display-sm text-foreground mb-4">
            What You Get Out of a Mentorship Program
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Research shows participating in a mentorship program provides valuable 
            benefits for both mentees and mentors. Here's what our data reveals:
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const colors = getColorClasses(stat.color);
            const Icon = stat.icon;
            
            return (
              <HoverCard key={stat.percentage}>
                <HoverCardTrigger asChild>
                  <Card className={`relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg ${colors.bg} ${colors.border}`}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <Icon className={`w-8 h-8 ${colors.text}`} />
                        <Info className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className={`text-4xl text-stat mb-3 ${colors.text}`}>
                        {stat.percentage}
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        {stat.description}
                      </p>
                      <Progress 
                        value={animated ? stat.value : 0} 
                        className="h-2"
                        style={{
                          ['--progress-background' as any]: colors.progress
                        }}
                      />
                    </CardContent>
                  </Card>
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">{stat.percentage} - More Details</h4>
                    <p className="text-sm text-muted-foreground">
                      {stat.detail}
                    </p>
                  </div>
                </HoverCardContent>
              </HoverCard>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}