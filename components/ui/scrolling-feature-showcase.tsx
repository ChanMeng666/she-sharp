"use client";

import React, { useState, useEffect, useRef, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface SlideData {
  id: string;
  title: string;
  description: string | ReactNode;
  image: string;
  imageAlt: string;
  bgColor: string;
  textColor: string;
}

export interface ScrollingFeatureShowcaseProps {
  slides: SlideData[];
  ctaText?: string;
  ctaHref?: string;
  customFinalContent?: ReactNode;
  /** Top padding to account for fixed navigation bar (default: 80px) */
  navOffset?: number;
  /** Bottom padding to account for footer or other elements (default: 32px) */
  bottomOffset?: number;
}

export function ScrollingFeatureShowcase({
  slides,
  ctaText = "Get Started",
  ctaHref = "#",
  customFinalContent,
  navOffset = 80,
  bottomOffset = 32,
}: ScrollingFeatureShowcaseProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Scroll handler
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollableHeight = container.scrollHeight - window.innerHeight;
      const stepHeight = scrollableHeight / slides.length;
      const newActiveIndex = Math.min(
        slides.length - 1,
        Math.floor(container.scrollTop / stepHeight)
      );
      setActiveIndex(newActiveIndex);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [slides.length]);

  const currentSlide = slides[activeIndex];
  const transitionDuration = prefersReducedMotion ? "0ms" : "700ms";

  // Navigate to specific slide
  const goToSlide = (index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollableHeight = container.scrollHeight - window.innerHeight;
    const stepHeight = scrollableHeight / slides.length;
    container.scrollTo({
      top: stepHeight * index,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  // Grid pattern for desktop right side
  const gridPatternStyle = {
    "--grid-color":
      currentSlide.textColor === "#ffffff"
        ? "rgba(255, 255, 255, 0.12)"
        : "rgba(0, 0, 0, 0.08)",
    backgroundImage: `
      linear-gradient(to right, var(--grid-color) 1px, transparent 1px),
      linear-gradient(to bottom, var(--grid-color) 1px, transparent 1px)
    `,
    backgroundSize: "3.5rem 3.5rem",
  } as React.CSSProperties;

  return (
    <div
      ref={scrollContainerRef}
      className="h-screen w-full overflow-y-auto"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {/* Hide scrollbar for webkit browsers */}
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <div style={{ height: `${slides.length * 100}vh` }}>
        <div
          className="sticky top-0 h-screen w-full flex flex-col items-center justify-center"
          style={{
            backgroundColor: currentSlide.bgColor,
            color: currentSlide.textColor,
            transition: `background-color ${transitionDuration} ease, color ${transitionDuration} ease`,
          }}
        >
          {/* Mobile: Background Image */}
          <div className="absolute inset-0 lg:hidden">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className={cn(
                  "absolute inset-0 transition-opacity",
                  index === activeIndex ? "opacity-50" : "opacity-0"
                )}
                style={{ transitionDuration }}
              >
                <Image
                  src={slide.image}
                  alt={slide.imageAlt}
                  fill
                  className="object-cover"
                  priority={index === 0}
                />
              </div>
            ))}
          </div>

          {/* Content Grid */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 h-full w-full max-w-8xl mx-auto">
            {/* Left Column: Text Content, Pagination & CTA */}
            <div
              className={cn(
                "relative flex flex-col justify-center px-8 md:px-16",
                "lg:border-r",
                currentSlide.textColor === "#ffffff"
                  ? "lg:border-white/10"
                  : "lg:border-black/10"
              )}
              style={{
                paddingTop: `${navOffset + 24}px`,
                paddingBottom: `${bottomOffset + 24}px`,
              }}
            >
              {/* Mobile: Glass card backdrop */}
              <div
                className="absolute left-4 right-4 lg:hidden glass-panel bg-black/30 rounded-[50px]"
                style={{
                  top: `${navOffset + 16}px`,
                  bottom: `${bottomOffset + 16}px`,
                }}
              />

              {/* Pagination Bars */}
              <div
                className="absolute left-8 md:left-16 flex space-x-2 z-20"
                style={{ top: `${navOffset + 32}px` }}
              >
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={cn(
                      "h-1 rounded-full transition-all ease-in-out",
                      index === activeIndex ? "w-12" : "w-6",
                      currentSlide.textColor === "#ffffff"
                        ? index === activeIndex
                          ? "bg-white/80"
                          : "bg-white/30"
                        : index === activeIndex
                          ? "bg-black/80"
                          : "bg-black/20"
                    )}
                    style={{ transitionDuration }}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>

              {/* Text Content */}
              <div className="relative h-auto min-h-[16rem] md:min-h-[18rem] w-full z-10">
                {slides.map((slide, index) => (
                  <div
                    key={slide.id}
                    className={cn(
                      "absolute inset-0 flex flex-col justify-center transition-all ease-in-out px-4 lg:px-0",
                      index === activeIndex
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-10 pointer-events-none"
                    )}
                    style={{ transitionDuration }}
                  >
                    <h2
                      className={cn(
                        "text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter",
                        "lg:text-inherit",
                        // Mobile: always white text on glass card
                        "text-white lg:text-[inherit]"
                      )}
                      style={{ color: "inherit" }}
                    >
                      {slide.title}
                    </h2>
                    <div
                      className={cn(
                        "mt-4 md:mt-6 text-base md:text-lg lg:text-xl max-w-md",
                        "text-white/90 lg:text-inherit"
                      )}
                    >
                      {typeof slide.description === "string" ? (
                        <p>{slide.description}</p>
                      ) : (
                        slide.description
                      )}
                    </div>

                    {/* Custom Final Content (Donation Buttons) */}
                    {index === slides.length - 1 && customFinalContent && (
                      <div className="mt-6 md:mt-8">{customFinalContent}</div>
                    )}
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <div
                className="absolute left-8 md:left-16 z-20"
                style={{ bottom: `${bottomOffset + 32}px` }}
              >
                <Button
                  asChild
                  size="lg"
                  variant={currentSlide.textColor === "#ffffff" ? "ghost" : "default"}
                >
                  <Link href={ctaHref}>{ctaText}</Link>
                </Button>
              </div>
            </div>

            {/* Right Column: Image Content with Grid Background (Desktop Only) */}
            <div
              className="hidden lg:flex items-center justify-center px-8"
              style={{
                paddingTop: `${navOffset}px`,
                paddingBottom: `${bottomOffset}px`,
                ...gridPatternStyle,
              }}
            >
              <div className="relative w-[60%] h-[70%] rounded-[50px] overflow-hidden shadow-2xl border-4 border-black/5">
                <div
                  className="absolute top-0 left-0 w-full h-full transition-transform ease-in-out"
                  style={{
                    transform: `translateY(-${activeIndex * 100}%)`,
                    transitionDuration,
                  }}
                >
                  {slides.map((slide, index) => (
                    <div key={slide.id} className="w-full h-full relative">
                      <Image
                        src={slide.image}
                        alt={slide.imageAlt}
                        fill
                        className="object-cover"
                        priority={index === 0}
                        sizes="(min-width: 1024px) 40vw, 100vw"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
