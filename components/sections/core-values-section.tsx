"use client";

import { Heart, Rocket, Target } from "lucide-react";
import { cn } from "@/lib/utils";

type CoreValue = {
  icon: React.ElementType;
  title: string;
  description: string;
  accentClass: string;
  bgClass: string;
};

const coreValues: CoreValue[] = [
  {
    icon: Target,
    title: "Connect",
    description:
      "Building a strong network of women in tech through meaningful relationships.",
    accentClass: "text-purple-dark",
    bgClass: "bg-purple-light/40",
  },
  {
    icon: Heart,
    title: "Inspire",
    description:
      "Showcasing role models and success stories to motivate the next generation.",
    accentClass: "text-periwinkle-dark",
    bgClass: "bg-periwinkle-light/50",
  },
  {
    icon: Rocket,
    title: "Empower",
    description:
      "Providing tools, mentorship, and opportunities for career advancement.",
    accentClass: "text-mint-dark",
    bgClass: "bg-mint-light/60",
  },
];

export function CoreValuesSection() {
  return (
    <section className="relative py-14 sm:py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center mb-10 md:mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading text-navy-dark">
            Our Core Values
          </h2>
          <p className="mt-3 text-base sm:text-lg text-gray">
            What drives our community forward every day.
          </p>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {coreValues.map((value) => (
            <li
              key={value.title}
              className={cn(
                "rounded-2xl border border-border/50 backdrop-blur-sm p-5 sm:p-6 md:p-7",
                "transition-transform duration-200 hover:-translate-y-0.5",
                value.bgClass
              )}
            >
              <div className="flex items-start gap-4">
                <div className={cn("inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/70", value.accentClass)}>
                  <value.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-navy-dark">{value.title}</h3>
                  <p className="mt-1.5 text-sm sm:text-base text-navy-dark/70">
                    {value.description}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default CoreValuesSection;


