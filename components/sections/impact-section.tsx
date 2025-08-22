"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Building2, Calendar, TrendingUp } from "lucide-react";

const impactStats = [
  {
    icon: Users,
    value: "1000",
    label: "She Sharp Members",
    description: "Women empowered in tech",
    color: "purple",
  },
  {
    icon: Building2,
    value: "50+",
    label: "Corporate Sponsors",
    description: "Supporting our mission",
    color: "periwinkle",
  },
  {
    icon: Calendar,
    value: "84+",
    label: "Events Since 2014",
    description: "Connecting and inspiring",
    color: "mint",
  },
  {
    icon: TrendingUp,
    value: "500+",
    label: "Career Transitions",
    description: "Success stories created",
    color: "navy",
  },
];

export function ImpactSection() {
  return (
    <Section bgColor="light" className="relative overflow-hidden">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-10 md:opacity-15 lg:opacity-20"
        style={{
          backgroundImage: 'url(/img/bauhaus-1755865242427.svg)',
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'repeat'
        }}
      />
      <Container className="relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-navy-dark mb-4">
            Our Impact in Numbers
          </h2>
          <p className="text-lg text-gray max-w-2xl mx-auto">
            A decade of empowering women to thrive in technology
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {impactStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.label}
                className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <CardContent className="p-6">
                  <div
                    className={`inline-flex p-3 rounded-full mb-4 ${
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
                  <div className="text-3xl font-bold text-navy-dark mb-2">
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
      </Container>
    </Section>
  );
}