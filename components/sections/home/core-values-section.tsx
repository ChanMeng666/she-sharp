"use client";

import { Heart, Rocket, Target } from "lucide-react";
import Image from "next/image";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

type CoreValue = {
  icon: React.ElementType;
  title: string;
  description: string;
};

const coreValues: CoreValue[] = [
  {
    icon: Target,
    title: "Connect",
    description:
      "Building a strong network of women in tech through meaningful relationships.",
  },
  {
    icon: Heart,
    title: "Inspire",
    description:
      "Showcasing role models and success stories to motivate the next generation.",
  },
  {
    icon: Rocket,
    title: "Empower",
    description:
      "Providing tools, mentorship, and opportunities for career advancement.",
  },
];

export function CoreValuesSection() {
  return (
    <section className="relative flex min-h-[600px] md:min-h-[700px]">
      {/* Left side - Image (2/3 width) */}
      <AnimateOnScroll variant="fade-right" className="relative w-2/3 overflow-hidden">
        <div className="relative w-full h-full">
          <Image
            src="/img/yourcareer.png"
            alt="Core Values"
            fill
            className="object-cover"
            sizes="66vw"
          />
          {/* Simple overlay for smooth transition */}
          <div className="absolute inset-0 bg-white/30 pointer-events-none" />
        </div>
      </AnimateOnScroll>

      {/* Right side - Content with muted background (1/3 width) */}
      <div className="w-1/3 bg-muted flex items-center py-14 sm:py-16 md:py-20 relative">
        <div className="px-6 sm:px-8 md:px-10 lg:px-12 w-full relative z-10">
          <AnimateOnScroll variant="fade-up" className="mb-10 md:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading text-foreground relative z-20">
              Our Core Values
            </h2>
          </AnimateOnScroll>

          <ul className="flex flex-col gap-4 sm:gap-6 md:gap-8">
            {coreValues.map((value, index) => (
              <AnimateOnScroll
                key={value.title}
                variant="fade-up"
                delay={index * 100}
              >
                <li className="rounded-2xl border border-border p-5 sm:p-6 md:p-7 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-foreground/30 bg-background">
                  <div className="flex items-start gap-4">
                    <div className="inline-flex w-30 aspect-square items-center justify-center rounded-xl bg-muted border border-border">
                      <value.icon className="h-5 w-5 text-foreground" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold text-foreground font-heading">
                        {value.title}
                      </h3>
                      <p className="mt-1.5 text-sm sm:text-base text-muted-foreground">
                        {value.description}
                      </p>
                    </div>
                  </div>
                </li>
              </AnimateOnScroll>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default CoreValuesSection;
