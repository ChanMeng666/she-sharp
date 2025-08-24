"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Building2, Calendar, TrendingUp, Target, Heart, Rocket } from "lucide-react";
import Iridescence, { brandColors } from "@/components/effects/iridescence";
import { useInView } from "@/hooks/use-in-view";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

// 统一的核心数据 - 解决数据不一致问题
const coreStats = [
  {
    icon: Users,
    value: "2200+",
    label: "Active Members",
    description: "Women empowered in tech",
    color: "purple",
  },
  {
    icon: Calendar,
    value: "84+",
    label: "Events Since 2014",
    description: "Connecting and inspiring",
    color: "periwinkle",
  },
  {
    icon: Building2,
    value: "50+",
    label: "Partner Companies",
    description: "Supporting our mission",
    color: "mint",
  },
  {
    icon: TrendingUp,
    value: "500+",
    label: "Career Success Stories",
    description: "Lives transformed",
    color: "navy",
  },
];

// 三大核心价值主张 - 简化的commitments
const coreValues = [
  {
    icon: Target,
    title: "Connect",
    description: "Building a strong network of women in tech through meaningful relationships.",
    color: "text-purple-dark",
    bgColor: "bg-purple-light/20",
  },
  {
    icon: Heart,
    title: "Inspire",
    description: "Showcasing role models and success stories to motivate the next generation.",
    color: "text-periwinkle-dark", 
    bgColor: "bg-periwinkle-light/20",
  },
  {
    icon: Rocket,
    title: "Empower",
    description: "Providing tools, mentorship, and opportunities for career advancement.",
    color: "text-mint-dark",
    bgColor: "bg-mint-light/20",
  },
];

export function CoreImpactSection() {
  const { ref, inView } = useInView();
  const reduceMotion = usePrefersReducedMotion();
  return (
    <Section>
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
        <Container>
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <Badge className="mb-3 bg-purple-light text-purple-dark border-purple-mid">
            Proven Results
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-navy-dark">
            A Decade of Measurable Impact
          </h2>
        </div>

        {/* Core Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {coreStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.label}
                className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <CardContent className="p-6 text-center">
                  <div
                    className={`inline-flex p-3 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300 ${
                      stat.color === "purple" ? "bg-purple-light/20" :
                      stat.color === "periwinkle" ? "bg-periwinkle-light/20" :
                      stat.color === "mint" ? "bg-mint-light/20" :
                      "bg-navy-light/20"
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${
                      stat.color === "purple" ? "text-purple-dark" :
                      stat.color === "periwinkle" ? "text-periwinkle-dark" :
                      stat.color === "mint" ? "text-mint-dark" :
                      "text-navy-dark"
                    }`} />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-navy-dark mb-2">
                    {stat.value}
                  </div>
                  <div className="text-lg font-semibold text-navy-dark mb-1">
                    {stat.label}
                  </div>
                  <div className="text-sm text-gray">
                    {stat.description}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Values and long summary removed to keep section focused on metrics */}
        </Container>
      </div>
    </Section>
  );
}
