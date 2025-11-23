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
          {/* Gradient overlay for smooth transition to dark */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-950/50 to-black/70 pointer-events-none" />
        </div>
      </AnimateOnScroll>

      {/* Right side - Content with dark background (1/3 width) */}
      <div className="w-1/3 bg-gradient-to-b from-gray-950/95 via-black/95 to-gray-950/95 flex items-center py-14 sm:py-16 md:py-20 relative">
        {/* Gradient overlay from left for smooth transition */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-transparent to-gray-950/95 pointer-events-none z-0" />
        <div className="px-6 sm:px-8 md:px-10 lg:px-12 w-full relative z-10">
          <AnimateOnScroll variant="fade-up" className="mb-10 md:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading text-ghost-white relative z-20">
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
                <li className="rounded-2xl border border-purple-dark/30 backdrop-blur-sm p-5 sm:p-6 md:p-7 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-dark/30 hover:border-purple-dark/60 bg-gray-800/40">
                  <div className="flex items-start gap-4">
                    <div className="inline-flex w-30 aspect-square items-center justify-center rounded-xl bg-purple-dark/20 border border-purple-dark/40">
                      <value.icon className="h-5 w-5 text-purple-dark" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold text-ghost-white font-heading">
                        {value.title}
                      </h3>
                      <p className="mt-1.5 text-sm sm:text-base text-gray-300">
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
