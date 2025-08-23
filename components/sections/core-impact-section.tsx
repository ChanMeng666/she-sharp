"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Building2, Calendar, TrendingUp, Target, Heart, Rocket } from "lucide-react";

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
  return (
    <Section className="bg-white py-16 md:py-20">
      <Container>
        {/* Hero Text */}
        <div className="text-center mb-12 md:mb-16">
          <Badge className="mb-4 bg-purple-light text-purple-dark border-purple-mid">
            Proven Results
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-navy-dark mb-6">
            A Decade of Measurable Impact
          </h2>
          <p className="text-lg text-gray max-w-3xl mx-auto">
            Since 2014, we've built a track record of success. These numbers represent 
            real lives transformed and careers accelerated.
          </p>
        </div>

        {/* Core Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
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

        {/* Core Values */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {coreValues.map((value) => {
            const Icon = value.icon;
            return (
              <div key={value.title} className="text-center">
                <div className={`inline-flex p-4 rounded-full mb-4 ${value.bgColor}`}>
                  <Icon className={`w-8 h-8 ${value.color}`} />
                </div>
                <h3 className="text-xl font-bold text-navy-dark mb-3">
                  {value.title}
                </h3>
                <p className="text-gray leading-relaxed">
                  {value.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Impact Summary */}
        <div className="text-center bg-gradient-to-r from-purple-light/10 via-periwinkle-light/10 to-mint-light/10 rounded-2xl p-8 md:p-12">
          <h3 className="text-2xl md:text-3xl font-bold text-navy-dark mb-4">
            Creating Lasting Change
          </h3>
          <p className="text-lg text-gray max-w-2xl mx-auto">
            Every number represents a life touched, a career transformed, 
            and a step forward in building a more inclusive tech industry.
          </p>
        </div>
      </Container>
    </Section>
  );
}
