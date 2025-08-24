"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import { Calendar, Users, Trophy, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import { layoutSystem } from "@/lib/layout-system";

const milestones = [
  { year: "2014", title: "Founded", description: "She Sharp was founded to bridge the gender gap in STEM.", icon: Rocket },
  { year: "2018", title: "Mentorship Launch", description: "Launched our flagship mentorship program.", icon: Trophy },
  { year: "2020", title: "Going Virtual", description: "Scaled remote engagement and community reach.", icon: Calendar },
  { year: "2022", title: "2000+ Members", description: "Celebrated 2000 active members milestone.", icon: Users },
  { year: "2024", title: "10 Years", description: "A decade of impact with 80+ events.", icon: Trophy }
];

export function TimelineSection() {
  return (
    <Section bgColor="white">
      <Container size="content">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-navy-dark">Our Journey</h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-gray max-w-2xl mx-auto px-4 sm:px-0">
            From a small group of advocates to a thriving community
          </p>
        </div>

        {/* Simple vertical timeline */}
        <div className="relative pl-6 sm:pl-8">
          <div className="absolute left-2 sm:left-3 top-0 bottom-0 w-0.5 bg-navy-light" />
          <div className="space-y-6 sm:space-y-8">
            {milestones.map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.year} className="relative">
                  <div className="absolute -left-1.5 sm:-left-2 top-1.5 h-3 w-3 rounded-full bg-purple-light border-2 border-white" />
                  <Card className="ml-4 sm:ml-6 p-4 sm:p-6">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-light/30 text-purple-dark">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-purple-dark">{m.year}</p>
                        <h3 className="text-lg sm:text-xl font-bold text-navy-dark">{m.title}</h3>
                        <p className="mt-1 text-gray">{m.description}</p>
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </Section>
  );
}