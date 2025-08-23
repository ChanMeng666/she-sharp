"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Heart, Calendar, ArrowRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const ctaOptions = [
  {
    id: "donate",
    icon: Heart,
    title: "Support Our Mission",
    subtitle: "Make a Donation",
    description: "Help us empower more young women to pursue careers in STEM through events, mentorship, and networking opportunities.",
    buttonText: "Donate Now",
    href: "/donate",
    color: "from-purple-dark to-purple-mid",
    hoverColor: "hover:from-purple-dark/90 hover:to-purple-mid/90"
  },
  {
    id: "events",
    icon: Calendar,
    title: "Join Our Community",
    subtitle: "Attend an Event",
    description: "Meet inspiring women, network with leading companies, participate in workshops, and discover your path in STEM.",
    buttonText: "Explore Events",
    href: "/events",
    color: "from-mint to-periwinkle",
    hoverColor: "hover:from-mint/90 hover:to-periwinkle/90"
  }
];

export function AboutCTASection() {
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  return (
    <Section className="relative overflow-hidden py-0">
      {/* Desktop Split Screen */}
      <div className="hidden md:flex h-[60vh] min-h-[500px]">
        {ctaOptions.map((option) => {
          const Icon = option.icon;
          const isHovered = hoveredOption === option.id;
          const otherIsHovered = hoveredOption && hoveredOption !== option.id;

          return (
            <div
              key={option.id}
              className={cn(
                "relative flex-1 transition-all duration-500 ease-out cursor-pointer overflow-hidden",
                isHovered && "flex-[1.5]",
                otherIsHovered && "flex-[0.5]"
              )}
              onMouseEnter={() => setHoveredOption(option.id)}
              onMouseLeave={() => setHoveredOption(null)}
            >
              {/* Background Gradient */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br transition-all duration-300",
                option.color,
                isHovered && "scale-105"
              )} />

              {/* Content */}
              <div className="relative z-10 h-full flex items-center justify-center p-12">
                <div className={cn(
                  "text-center text-white transition-all duration-300",
                  otherIsHovered && "opacity-50 scale-95"
                )}>
                  <Icon className={cn(
                    "mx-auto mb-6 transition-all duration-300",
                    isHovered ? "h-20 w-20" : "h-16 w-16"
                  )} />
                  
                  <h3 className={cn(
                    "font-bold mb-2 transition-all duration-300",
                    isHovered ? "text-4xl" : "text-3xl"
                  )}>
                    {option.title}
                  </h3>
                  
                  <p className={cn(
                    "text-xl mb-6 transition-all duration-300",
                    isHovered ? "opacity-100" : "opacity-80"
                  )}>
                    {option.subtitle}
                  </p>

                  {/* Extended content on hover */}
                  <div className={cn(
                    "max-w-md mx-auto transition-all duration-300",
                    isHovered ? "opacity-100 max-h-40" : "opacity-0 max-h-0 overflow-hidden"
                  )}>
                    <p className="mb-8 text-white/90">
                      {option.description}
                    </p>
                  </div>

                  <Button
                    asChild
                    size="lg"
                    variant="white"
                    className={cn(
                      "transition-all duration-300",
                      isHovered ? "scale-110" : ""
                    )}
                  >
                    <Link href={option.href}>
                      {option.buttonText}
                      <ArrowRight className={cn(
                        "ml-2 h-5 w-5 transition-all duration-300",
                        isHovered ? "translate-x-1" : ""
                      )} />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Decorative elements */}
              <div className={cn(
                "absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transition-all duration-500",
                isHovered ? "scale-150" : "scale-100"
              )} />
              <div className={cn(
                "absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl transition-all duration-500",
                isHovered ? "scale-150" : "scale-100"
              )} />
            </div>
          );
        })}
      </div>

      {/* Mobile Stacked View */}
      <div className="md:hidden">
        {ctaOptions.map((option) => {
          const Icon = option.icon;
          
          return (
            <div
              key={option.id}
              className={cn(
                "relative h-[50vh] min-h-[400px] flex items-center justify-center p-8 bg-gradient-to-br",
                option.color
              )}
            >
              <div className="text-center text-white">
                <Icon className="mx-auto h-16 w-16 mb-6" />
                <h3 className="text-3xl font-bold mb-2">{option.title}</h3>
                <p className="text-xl mb-6 opacity-90">{option.subtitle}</p>
                <p className="max-w-sm mx-auto mb-8 text-white/80">
                  {option.description}
                </p>
                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="bg-white text-gray-900 hover:bg-gray-100"
                >
                  <Link href={option.href}>
                    {option.buttonText}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Section Title */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20 text-center pointer-events-none">
        <h2 className="text-2xl md:text-3xl font-bold text-white/90 uppercase tracking-wider">
          Bridge the Gender Gap in STEM with Us
        </h2>
      </div>
    </Section>
  );
}