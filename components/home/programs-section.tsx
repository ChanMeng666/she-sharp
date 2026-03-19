"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import {
  Calendar,
  Users,
  GraduationCap,
  MessageCircle,
  BookOpen,
  Briefcase,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

// Color mapping for program cards using brand colors
const programColors: Record<string, { bg: string; border: string }> = {
  purple: { bg: "hsl(var(--brand))", border: "hsl(var(--brand) / 0.5)" }, // Brand Purple
  periwinkle: { bg: "#8982ff", border: "rgba(137, 130, 255, 0.5)" }, // Periwinkle Dark
  mint: { bg: "#1f1e44", border: "rgba(31, 30, 68, 0.5)" }, // Navy Dark
};

// 三大核心项目
const programs = [
  {
    id: "events",
    title: "Events & Networking",
    subtitle: "Connect with peers and leaders",
    description:
      "Join monthly events and workshops to build your network and learn from industry experts.",
    icon: Calendar,
    color: "purple",
    image:
      "/img/gallery/2025-11-HCLTech-Dunedin.jpg",
    features: [
      { icon: Users, text: "Monthly meetups" },
      { icon: MessageCircle, text: "Expert panels" },
      { icon: Calendar, text: "Annual conference" },
    ],
    stats: { primary: "Monthly", secondary: "Events" },
    cta: { text: "View Upcoming Events", href: "/events" },
    highlight: "Next event: March 15",
  },
  {
    id: "mentorship",
    title: "Mentorship Programme",
    subtitle: "Get career guidance",
    description:
      "Connect with experienced professionals for personalised career support and growth.",
    icon: Users,
    color: "periwinkle",
    image:
      "/img/gallery/home-page-ai-hackathon-2025-mentorship.jpg",
    features: [
      { icon: Users, text: "1-on-1 mentor matching" },
      { icon: Calendar, text: "Structured 6-month programmes" },
      { icon: Briefcase, text: "Career transition support" },
    ],
    stats: { primary: "6-Month", secondary: "Programmes" },
    cta: { text: "Apply Now", href: "/mentorship" },
    highlight: "Applications open",
  },
  {
    id: "skills",
    title: "Skills Development",
    subtitle: "Learn by doing",
    description:
      "Build technical and leadership skills through hands-on workshops and peer learning.",
    icon: GraduationCap,
    color: "mint",
    image:
      "/img/gallery/2025-10-Xero.jpg",
    features: [
      { icon: BookOpen, text: "Technical workshops" },
      { icon: GraduationCap, text: "Professional development" },
      { icon: Users, text: "Peer learning groups" },
    ],
    stats: { primary: "Weekly", secondary: "Workshops" },
    cta: { text: "Explore Workshops", href: "/events?type=workshop" },
    highlight: "New courses monthly",
  },
];

// Removed internal Next Event to avoid duplication with highlight section

export function ProgramsSection() {
  const [activeProgram, setActiveProgram] = useState(0);
  const [lastSelectedProgram, setLastSelectedProgram] = useState(0);

  return (
    <>
      <Section className="bg-background">
        <Container size="full" className="mt-12 md:mt-16 lg:mt-20 mb-12 md:mb-16 lg:mb-20">
          {/* Section Header */}
          <AnimateOnScroll variant="fade-up" className="text-center mb-12 md:mb-16 lg:mb-20">
            <h2 className="text-display-sm text-foreground mb-6">
              Your Path to Success
            </h2>
          </AnimateOnScroll>

          {/* Accordion Layout */}
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Left Column - Accordion */}
            <div className="space-y-4">
              {programs.map((program, index) => {
                const isActive = activeProgram === index;
                const Icon = program.icon;

                return (
                  <AnimateOnScroll
                    key={program.id}
                    variant="fade-up"
                    delay={index * 100}
                  >
                    <div
                      className={`card-lg transition-all duration-300 relative border ${isActive
                          ? "bg-background border-foreground/30 shadow-lg shadow-brand/10 "
                          : "bg-background border-border hover:border-foreground/30"
                        }`}
                    >
                      {/* Accordion Header */}
                      <button
                        onClick={() => {
                          if (isActive) {
                            return;
                          } else {
                            setActiveProgram(index);
                            setLastSelectedProgram(index);
                          }
                        }}
                        className="w-full p-6 text-left flex items-center justify-between transition-colors duration-200 text-foreground "
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className="p-2.5 lg:p-3 border rounded-full transition-all border-foreground/30 bg-foreground/10"
                          >
                            <Icon
                              className="h-5 w-5 text-foreground"
                            />
                          </div>
                          <div >
                            <h3 className="text-2xl font-bold text-foreground">{program.title}</h3>
                            <p className="text-muted-foreground">
                              {program.subtitle}
                            </p>
                          </div>
                        </div>
                        {!isActive && (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-foreground/10">
                            <Plus className="w-4 h-4 text-foreground" />
                          </div>
                        )}
                      </button>

                      {/* Accordion Content */}
                      <div
                        className={`overflow-hidden transition-all duration-500 ease-in-out ${isActive ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                          }`}
                      >
                        <div className="px-6 pb-6 text-foreground">
                          <p className="text-muted-foreground mb-6 leading-relaxed">
                            {program.description}
                          </p>

                          {/* Features */}
                          <ul className="space-y-3 mb-6">
                            {program.features.map((feature, featureIndex) => {
                              const FeatureIcon = feature.icon;
                              return (
                                <li
                                  key={featureIndex}
                                  className="flex items-center gap-3"
                                >
                                  <FeatureIcon className="w-4 h-4 text-foreground/80 shrink-0" />
                                  <span className="text-sm text-muted-foreground">
                                    {feature.text}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>

                          {/* CTA Button */}
                          <Link href={program.cta.href}>
                            <Button variant="ghost" size="lg" className="border-foreground/30 ">
                              {program.cta.text}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </AnimateOnScroll>
                );
              })}
            </div>

            {/* Right Column - fixed container to prevent CLS */}
            <div className="hidden lg:flex items-center min-h-[500px] pt-12">
            <AnimateOnScroll variant="fade-left" className="relative w-full md:w-4/5 mx-auto">
              <div
                className="absolute inset-0 border border-foreground/30 card-lg transform rotate-0 md:rotate-[-10deg] translate-x-0 md:translate-x-[-10px] translate-y-[-10px]"
              />
              <div className="relative w-full h-[300px] md:h-[400px] lg:h-[500px] card-lg z-10">
                {programs.map((program, index) => (
                  <Image
                    key={program.id}
                    src={program.image}
                    alt={program.title}
                    fill
                    className={`object-cover transition-opacity duration-500 ease-in-out ${
                      lastSelectedProgram === index ? "opacity-100" : "opacity-0"
                    }`}
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority={index === 0}
                  />
                ))}

                {/* Image overlay content */}
                <div className="absolute bottom-6 left-6 z-10">
                  <div className="glass-panel px-4 py-3">
                    <div className="text-white">
                      <div className="text-stat text-3xl mb-1">
                        {programs[lastSelectedProgram].stats.primary}
                      </div>
                      <div className="text-lg opacity-90">
                        {programs[lastSelectedProgram].stats.secondary}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>
            </div>

            {/* Mobile image (shown below accordion on small screens) */}
            <div className="lg:hidden">
              <AnimateOnScroll variant="fade-up" className="relative w-full md:w-4/5 mx-auto">
                <div
                  className="absolute inset-0 border border-foreground/30 card-lg transform rotate-0 lg:rotate-[-10deg] translate-x-0 md:translate-x-[-10px] translate-y-[-10px]"
                />
                <div className="relative w-full h-[300px] md:h-[400px] card-lg z-10">
                  {programs.map((program, index) => (
                    <Image
                      key={program.id}
                      src={program.image}
                      alt={program.title}
                      fill
                      className={`object-cover transition-opacity duration-500 ease-in-out ${
                        lastSelectedProgram === index ? "opacity-100" : "opacity-0"
                      }`}
                      sizes="100vw"
                    />
                  ))}
                  <div className="absolute bottom-6 left-6 z-10">
                    <div className="glass-panel px-4 py-3">
                      <div className="text-white">
                        <div className="text-stat text-3xl mb-1">
                          {programs[lastSelectedProgram].stats.primary}
                        </div>
                        <div className="text-lg opacity-90">
                          {programs[lastSelectedProgram].stats.secondary}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </AnimateOnScroll>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}