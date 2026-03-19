"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";
import { Section } from "@/components/layout/section";
import { Container } from "@/components/layout/container";

type CoreValue = {
  number: string;
  title: string;
  description: string;
  image: string;
};

const CORE_VALUES: CoreValue[] = [
  {
    number: "01",
    title: "Connect",
    description:
      "Building a strong network of women in tech through meaningful relationships.",
    image: "/img/connection.jpg",
  },
  {
    number: "02",
    title: "Inspire",
    description:
      "Showcasing role models and success stories to motivate the next generation.",
    image: "/img/inspire.jpg",
  },
  {
    number: "03",
    title: "Empower",
    description:
      "Providing tools, mentorship, and opportunities for career advancement.",
    image: "/img/empower.jpg",
  },
];

const AUTO_PLAY_INTERVAL_MS = 2000;

export function CoreValuesSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const goToNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % CORE_VALUES.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(goToNext, AUTO_PLAY_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [paused, goToNext]);

  const handleSelect = (index: number) => {
    setActiveIndex(index);
    setPaused(true);
    setTimeout(() => setPaused(false), AUTO_PLAY_INTERVAL_MS * 2);
  };

  return (
    <Section spacing="section" className="bg-white py-16 xl:py-24 2xl:py-32">
      <Container size="full">
        <AnimateOnScroll variant="fade-up">
          <h2 className="text-display-sm text-left mb-12 md:mb-16 text-foreground">
            Our Core Values
          </h2>
          <div className="flex items-stretch gap-2 md:gap-4 mb-10 md:mb-14">
            {CORE_VALUES.map((value, index) => {
              const isActive = index === activeIndex;
              return (
                <button
                  key={value.title}
                  onClick={() => handleSelect(index)}
                  className={cn(
                    "group flex-1 text-left pt-3 pb-4 transition-all duration-300 relative cursor-pointer",
                    "border-t",
                    isActive
                      ? "border-foreground"
                      : "border-foreground/20 hover:border-foreground/40"
                  )}
                >
                  <p
                    className={cn(
                      "text-sm md:text-base mb-0.5 transition-colors duration-300",
                      isActive
                        ? "text-foreground/80"
                        : "text-foreground/40 group-hover:text-foreground/60"
                    )}
                  >
                    {value.number}.
                  </p>
                  <p
                    className={cn(
                      "text-sm md:text-base lg:text-lg transition-all duration-300",
                      isActive
                        ? "font-bold text-foreground"
                        : "font-normal text-foreground/40 group-hover:text-foreground/60"
                    )}
                  >
                    {value.title}
                  </p>
                </button>
              );
            })}
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll variant="fade-up">
          <div className="relative w-full aspect-16/9 card-lg shadow-xl">
            {CORE_VALUES.map((value, index) => (
              <div
                key={value.title}
                className={cn(
                  "absolute inset-0 transition-opacity duration-500 ease-in-out",
                  index === activeIndex
                    ? "opacity-100 z-10"
                    : "opacity-0 z-0"
                )}
              >
                <Image
                  src={value.image}
                  alt={value.title}
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                  priority={index === 0}
                />

                <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 lg:p-14">
                  <p className="text-white text-lg md:text-2xl lg:text-3xl font-semibold leading-snug tracking-wide drop-shadow-lg max-w-3xl">
                    {value.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </AnimateOnScroll>
      </Container>
    </Section>
  );
}

export default CoreValuesSection;
