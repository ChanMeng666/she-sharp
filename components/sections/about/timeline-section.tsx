"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
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

        {/* Compact vertical timeline */}
        <div className="relative pl-6 sm:pl-8">
          <div className="absolute left-2 sm:left-3 top-0 bottom-0 w-px bg-navy-light" />
          <ul className="space-y-4 sm:space-y-5">
            {milestones.map((m) => {
              const Icon = m.icon;
              return (
                <li key={m.year} className="relative ml-2 sm:ml-4">
                  <div className="absolute -left-3 sm:-left-4 top-1 h-2.5 w-2.5 rounded-full bg-purple-light border border-white" />
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-purple-light/30 text-purple-dark">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-navy-dark">{m.year} · {m.title}</div>
                      <p className="text-sm text-gray truncate sm:whitespace-normal sm:truncate-none">{m.description}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </Container>
    </Section>
  );
}