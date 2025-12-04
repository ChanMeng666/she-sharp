"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { Users, Star, Award } from "lucide-react";

export function MentorsHeroSection() {
  const stats = [
    { icon: Users, value: "18+", label: "Expert Mentors" },
    { icon: Star, value: "4.8", label: "Average Rating" },
    { icon: Award, value: "100+", label: "Success Stories" },
  ];

  return (
    <Section className="relative overflow-hidden bg-foreground">
      <div className="absolute inset-0 bg-foreground" />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-muted/10 transform skew-x-12" />

      <Container className="relative z-10">
        <div className="py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div>
              <h1 className="text-5xl md:text-7xl font-bold text-background leading-tight">
                CONNECT WITH
              </h1>
              <h2 className="text-4xl md:text-6xl font-bold text-muted-foreground mt-2">
                EXPERT MENTORS
              </h2>
            </div>

            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Discover accomplished professionals ready to guide your STEM journey.
              Our mentors bring diverse expertise from leading tech companies and organizations.
            </p>

            <Button
              size="lg"
              className="bg-background hover:bg-background/90 text-foreground"
              onClick={() => {
                const element = document.getElementById('mentors-list');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Explore All Mentors
            </Button>

            <div className="flex flex-wrap justify-center gap-8 pt-4">
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-3">
                  <div className="p-3 bg-muted/20 rounded-lg">
                    <stat.icon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="text-left">
                    <p className="text-2xl font-bold text-background">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}