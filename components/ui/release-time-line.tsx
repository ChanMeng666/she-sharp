"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export type TimeLine_01Entry = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  description: string;
  items?: string[];
  image?: string;
  button?: {
    url: string;
    text: string;
  };
};

export interface TimeLine_01Props {
  title?: string;
  description?: string;
  entries?: TimeLine_01Entry[];
  className?: string;
}

export default function TimeLine_01({
  title,
  description,
  entries = [],
  className,
}: TimeLine_01Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const sentinelRefs = useRef<(HTMLDivElement | null)[]>([]);

  const setSentinelRef = (el: HTMLDivElement | null, i: number) => {
    sentinelRefs.current[i] = el;
  };

  useEffect(() => {
    if (!sentinelRefs.current.length) return;

    let frame = 0;
    const updateActiveByProximity = () => {
      frame = requestAnimationFrame(updateActiveByProximity);
      const centerY = window.innerHeight / 3;
      let bestIndex = 0;
      let bestDist = Infinity;
      sentinelRefs.current.forEach((node, i) => {
        if (!node) return;
        const rect = node.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        const dist = Math.abs(mid - centerY);
        if (dist < bestDist) {
          bestDist = dist;
          bestIndex = i;
        }
      });
      if (bestIndex !== activeIndex) setActiveIndex(bestIndex);
    };

    frame = requestAnimationFrame(updateActiveByProximity);
    return () => cancelAnimationFrame(frame);
  }, [activeIndex]);

  useEffect(() => {
    setActiveIndex(0);
  }, []);

  return (
    <section className={className}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {(title || description) && (
          <div className="mx-auto max-w-3xl text-center">
            {title && (
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl text-foreground">
                {title}
              </h2>
            )}
            {description && (
              <p className="mb-6 text-base text-foreground md:text-lg">
                {description}
              </p>
            )}
          </div>
        )}

        <div className="mx-auto mt-12 max-w-4xl space-y-12 md:mt-16 md:space-y-16">
          {entries.map((entry, index) => {
            const isActive =
              hoveredIndex !== null
                ? index === hoveredIndex
                : index === activeIndex;

            return (
              <div
                key={index}
                className="relative flex flex-col gap-4 md:flex-row md:gap-12"
                aria-current={isActive ? "true" : "false"}
              >
                {/* Sticky meta column */}
                <div
                  className="top-24 flex h-min w-full md:w-60 shrink-0 items-center gap-4 md:sticky"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl transition-colors duration-300 ${
                        isActive
                          ? "bg-brand text-brand-foreground"
                          : "bg-white text-muted-foreground"
                      }`}
                    >
                      <entry.icon className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="font-semibold text-foreground text-md md:text-lg">
                        {entry.title}
                      </span>
                      <span className="text-sm md:text-base text-muted-foreground">
                        {entry.subtitle}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Invisible sentinel */}
                <div
                  ref={(el) => setSentinelRef(el, index)}
                  aria-hidden
                  className="absolute -top-24 left-0 h-12 w-12 opacity-0"
                />

                {/* Content column */}
                <article
                  className={
                    "flex-1 flex flex-col rounded-[50px] border p-6 transition-all duration-300" +
                    (isActive
                      ? "border-brand/20 bg-brand shadow-lg"
                      : "border-border bg-white")
                  }
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {entry.image && (
                    <img
                      src={entry.image}
                      alt={`${entry.title} visual`}
                      className="mb-4 w-full h-48 md:h-64 rounded-xl object-cover"
                      loading="lazy"
                    />
                  )}
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <h3
                        className={
                          "text-lg mb-4 font-semibold leading-tight tracking-tight md:text-xl transition-colors duration-200 " +
                          (isActive ? "text-white" : "text-foreground/70")
                        }
                      >
                        {entry.title}
                      </h3>

                      <p
                        className={
                          "text-sm leading-relaxed md:text-base text-left transition-all duration-300 " +
                          (isActive
                            ? "text-white"
                            : "text-muted-foreground/80 line-clamp-2")
                        }
                      >
                        {entry.description}
                      </p>
                    </div>

                    {/* Expandable content */}
                    <div
                      aria-hidden={!isActive}
                      className={
                        "grid transition-all duration-500 ease-out " +
                        (isActive
                          ? "grid-rows-[1fr] opacity-100"
                          : "grid-rows-[0fr] opacity-0")
                      }
                    >
                      <div className="overflow-hidden">
                        <div className="space-y-4">
                          {entry.items && entry.items.length > 0 && (
                            <div className="rounded-[30px]  p-4">
                              <ul className="space-y-2">
                                {entry.items.map((item, itemIndex) => (
                                  <li
                                    key={itemIndex}
                                    className={`flex items-center gap-2 text-sm transition-colors duration-300 ${
                                      isActive
                                        ? "text-white"
                                        : "text-muted-foreground"
                                    }`}
                                  >
                                    <div
                                      className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                                        isActive ? "bg-white" : "bg-brand"
                                      }`}
                                    />
                                    <span className="leading-relaxed text-sm md:text-base ">
                                      {item}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {entry.button && (
                            <div className="flex justify-start p-2">
                              <Button
                                variant="outline"
                                size="lg"
                                className="group transition-all duration-200 bg-white text-brand border-white hover:bg-white/90 hover:text-brand hover:border-white/90"
                                asChild
                              >
                                <a href={entry.button.url}>
                                  {entry.button.text}
                                  <ArrowUpRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                </a>
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
