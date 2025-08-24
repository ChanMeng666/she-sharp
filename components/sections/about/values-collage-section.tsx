"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import { 
  Heart, 
  Lightbulb, 
  Users, 
  Rocket,
  Sparkles,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";

const values = [
  {
    title: "Connection",
    description: "Building meaningful relationships and professional networks",
    icon: Heart
  },
  {
    title: "Empowerment",
    description: "Providing tools and support for career growth",
    icon: Rocket
  },
  {
    title: "Inclusivity",
    description: "Creating spaces where everyone belongs",
    icon: Users
  }
];

export function ValuesCollageSection() {
  return (
    <Section className="bg-white">
      <Container>
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-navy">Our Core Values</h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4 sm:px-0">
            The principles that guide everything we do at She Sharp
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {values.map((value) => {
            const Icon = value.icon;
            return (
              <Card key={value.title} className="p-6 sm:p-8 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-full bg-purple-light/20 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-purple-dark" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-navy-dark">{value.title}</h3>
                    <p className="mt-2 text-gray-600">
                      {value.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}