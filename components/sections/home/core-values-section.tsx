"use client";

import { Heart, Rocket, Target } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const observerOptions = {
      root: containerRef.current,
      rootMargin: "-20% 0px -20% 0px",
      threshold: [0, 0.25, 0.5, 0.75, 1],
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      let maxRatio = 0;
      let maxIndex = 0;

      entries.forEach((entry) => {
        const index = sectionRefs.current.findIndex(
          (ref) => ref === entry.target
        );
        if (index !== -1 && entry.intersectionRatio > maxRatio) {
          maxRatio = entry.intersectionRatio;
          maxIndex = index;
        }
      });

      if (maxRatio > 0.2) {
        setActiveIndex(maxIndex);
      }
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions
    );

    const timeoutId = setTimeout(() => {
      const sections = sectionRefs.current.filter(Boolean);
      if (sections.length > 0) {
        sections.forEach((section) => {
          if (section) {
            observer.observe(section);
          }
        });
      }
    }, 200);

    return () => {
      clearTimeout(timeoutId);
      sectionRefs.current.forEach((section) => {
        if (section) {
          observer.unobserve(section);
        }
      });
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-[60vh] w-full overflow-y-scroll snap-y snap-proximity scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      style={{
        scrollBehavior: "smooth",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {coreValues.map((value, index) => {
        const isActive = activeIndex === index;
        const isEven = index % 2 === 0;
        const isSecond = index === 1;
        const isThird = index === 2;
        const bgClass = isSecond
          ? ""
          : isThird
            ? "bg-navy"
            : isEven
              ? "bg-surface-purple"
              : "bg-gray-950";
        const bgStyle = isSecond ? { backgroundColor: "#EFFEFB" } : {};
        const textClass = isSecond
          ? "text-foreground"
          : isThird
            ? "text-white"
            : isEven
              ? "text-foreground"
              : "text-ghost-white";
        const mutedTextClass = isSecond
          ? "text-muted-foreground"
          : isThird
            ? "text-gray-300"
            : isEven
              ? "text-muted-foreground"
              : "text-gray-300";
        const iconBgClass = isEven
          ? "bg-purple-dark/10 border-purple-dark/20"
          : "bg-purple-dark/20 border-purple-dark/40";
        const iconTextClass = isEven ? "text-purple-dark" : "text-purple-dark";

        return (
          <section
            key={value.title}
            ref={(el) => {
              if (el) {
                sectionRefs.current[index] = el as HTMLElement;
              }
            }}
            className={`snap-start h-[60vh] w-full flex items-center justify-center relative ${bgClass} transition-colors duration-700 ease-in-out shrink-0`}
            style={bgStyle}
          >
            <div
              className={`flex flex-col md:flex-row w-full max-w-7xl mx-auto px-4 md:px-8 transition-all duration-1000 ease-out ${
                isActive
                  ? "opacity-100 translate-y-0 scale-100"
                  : "opacity-100 translate-y-4 scale-100"
              }`}
            >
              {/* Left side - Image (2/3 width on desktop) */}
              <div className="relative w-full md:w-2/3 h-[200px] md:h-[60vh] overflow-hidden">
                <Image
                  src={value.image}
                  alt={value.title}
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 768px) 100vw, 66vw"
                />
              </div>

              {/* Right side - Content (1/3 width on desktop) */}
              <div
                className={`w-full md:w-1/3 flex items-center p-6 md:p-10 lg:p-12 ${
                  isSecond
                    ? ""
                    : isThird
                      ? "bg-navy"
                      : isEven
                        ? "bg-surface-purple"
                        : "bg-gray-950"
                } rounded-lg md:rounded-r-lg md:rounded-l-none`}
                style={isSecond ? { backgroundColor: "#EFFEFB" } : {}}
              >
                <div className="w-full">
                  {/* Section Title */}
                  <h2
                    className={`text-xl md:text-2xl lg:text-3xl font-heading mb-8 md:mb-12 lg:mb-16 ${textClass} opacity-60`}
                  >
                    Our Core Values
                  </h2>

                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={`inline-flex w-16 h-16 items-center justify-center rounded-xl border border-opacity-30 shrink-0 ${iconBgClass}`}
                    >
                      <value.icon className={`h-8 w-8 ${iconTextClass}`} />
                    </div>
                    <h3
                      className={`text-3xl md:text-4xl lg:text-5xl font-bold ${textClass}`}
                    >
                      {value.title}
                    </h3>
                  </div>
                  <p
                    className={`text-base md:text-lg leading-relaxed ${mutedTextClass}`}
                  >
                    {value.description}
                  </p>
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}

export default CoreValuesSection;
