"use client";

import { Heart, Rocket, Target } from "lucide-react";
import Image from "next/image";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";
import { Section } from "@/components/layout/section";
import { Container } from "@/components/layout/container";

type CoreValue = {
  icon: React.ElementType;
  title: string;
  description: string;
  image: string;
};

const coreValues: CoreValue[] = [
  {
    icon: Target,
    title: "Connect",
    description:
      "Building a strong network of women in tech through meaningful relationships.",
    image: "/img/connection.jpg",
  },
  {
    icon: Heart,
    title: "Inspire",
    description:
      "Showcasing role models and success stories to motivate the next generation.",
    image: "/img/inspire.jpg",
  },
  {
    icon: Rocket,
    title: "Empower",
    description:
      "Providing tools, mentorship, and opportunities for career advancement.",
    image: "/img/empower.jpg",
  },
];

export function CoreValuesSection() {
  return (
    <Section spacing="section">
      <Container>
        <AnimateOnScroll variant="fade-up">
          <h2 className="text-display-sm text-center mb-12 md:mb-16 text-foreground opacity-60">
            Our Core Values
          </h2>
        </AnimateOnScroll>

        <div className="flex flex-col gap-12 md:gap-16">
          {coreValues.map((value, index) => {
            const isEven = index % 2 === 0;
            const iconBgClass = isEven
              ? "bg-purple-dark/10 border-purple-dark/20"
              : "bg-purple-dark/20 border-purple-dark/40";

            return (
              <AnimateOnScroll
                key={value.title}
                variant={isEven ? "fade-right" : "fade-left"}
              >
                <div
                  className={`flex flex-col ${
                    isEven ? "md:flex-row" : "md:flex-row-reverse"
                  } rounded-2xl overflow-hidden shadow-lg bg-white`}
                >
                  {/* Image */}
                  <div className="relative w-full md:w-2/3 h-64 md:h-[420px]">
                    <Image
                      src={value.image}
                      alt={value.title}
                      fill
                      className="object-cover object-center"
                    />
                  </div>

                  {/* Content */}
                  <div className="w-full md:w-1/3 flex items-center p-6 md:p-10 lg:p-12">
                    <div className="w-full">
                      <div className="flex items-center gap-4 mb-4">
                        <div
                          className={`inline-flex w-16 h-16 items-center justify-center rounded-xl border border-opacity-30 shrink-0 ${iconBgClass}`}
                        >
                          <value.icon className="h-8 w-8 text-purple-dark" />
                        </div>
                        <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
                          {value.title}
                        </h3>
                      </div>
                      <p className="text-base md:text-lg leading-relaxed text-muted-foreground">
                        {value.description}
                      </p>
                    </div>
                  </div>
                </div>
              </AnimateOnScroll>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}

export default CoreValuesSection;
