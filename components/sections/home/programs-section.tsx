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
  Minus,
} from "lucide-react";
import { useState } from "react";

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
      "/img/security-event.jpg",
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
    title: "Mentorship Program",
    subtitle: "Get career guidance",
    description:
      "Connect with experienced professionals for personalized career support and growth.",
    icon: Users,
    color: "periwinkle",
    image:
      "/img/mentorship.jpg",
    features: [
      { icon: Users, text: "1-on-1 mentor matching" },
      { icon: Calendar, text: "Structured 6-month programs" },
      { icon: Briefcase, text: "Career transition support" },
    ],
    stats: { primary: "6-Month", secondary: "Programs" },
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
      "/img/AI.jpg",
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
      <Section>
        <Container size="full">
          {/* Section Header */}
          <div className="text-center mb-8 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-navy-dark mb-6">
              Your Path to Success
            </h2>
          </div>

          {/* Accordion Layout */}
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left Column - Accordion */}
            <div className="space-y-4">
              {programs.map((program, index) => {
                const isActive = activeProgram === index;
                const Icon = program.icon;

                return (
                  <div
                    key={program.id}
                    className={`rounded-2xl overflow-hidden transition-all duration-300 relative ${
                      isActive
                        ? "bg-navy-dark"
                        : "bg-mint-dark/50 border border-mint-dark"
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
                      className={`w-full p-6 text-left flex items-center justify-between transition-colors duration-200 ${
                        isActive ? "text-white" : "text-navy-dark"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-2.5 lg:p-3 border rounded-full bg-white/10 transition-all ${
                            isActive
                              ? "border-white"
                              : "border-navy-dark"
                          }`}
                        >
                          <Icon
                            className={`h-5 w-5 ${
                              isActive
                                ? "text-white"
                                : "text-navy-dark"
                            }`}
                          />
                        </div>
                        <div >
                          <h3 className="text-2xl font-bold">{program.title}</h3>
                          <p className={`${
                            isActive ? "text-white" : "text-navy-dark/70"
                          }`}>
                            {program.subtitle}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isActive
                            ? "bg-white/20"
                            : "bg-navy-dark"
                        }`}
                      >
                        {isActive ? (
                          <Minus className="w-4 h-4 text-white opacity-50" />
                        ) : (
                          <Plus className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </button>

                    {/* Accordion Content */}
                    <div 
                      className={`overflow-hidden transition-all duration-500 ease-in-out ${
                        isActive ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="px-6 pb-6 text-white">
                        <p className="text-white/90 mb-6 leading-relaxed">
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
                                <FeatureIcon className="w-4 h-4 text-white/80 flex-shrink-0" />
                                <span className="text-sm text-white/90">
                                  {feature.text}
                                </span>
                              </li>
                            );
                          })}
                        </ul>

                        {/* CTA Button */}
                        <Link href={program.cta.href}>
                          <Button className="bg-white text-navy-dark hover:bg-white/90 hover:shadow-mint-dark/20" size="lg">
                            {program.cta.text}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Column - Image */}
            <div className="relative w-4/5 mx-auto">
              {/* Background div with slight tilt */}
              <div 
                className="absolute bg-mint-dark rounded-2xl transform rotate-[-10deg] translate-x-[-10px] translate-y-[-10px]"
                style={{ width: '100%', height: '500px' }}
              ></div>
              <div className="relative w-full h-[500px] rounded-2xl overflow-hidden z-10">
                <Image
                  src={programs[lastSelectedProgram].image}
                  alt={programs[lastSelectedProgram].title}
                  fill
                  className="object-cover transition-opacity duration-200 ease-in-out"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                
                
                {/* Image overlay content */}
                <div className="absolute bottom-6 left-6 z-10 transition-all duration-500 ease-in-out">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg">
                    <div className="text-white">
                      <div className="text-3xl font-bold mb-1 transition-all duration-300">
                        {programs[lastSelectedProgram].stats.primary}
                      </div>
                      <div className="text-lg opacity-90 transition-all duration-300">
                        {programs[lastSelectedProgram].stats.secondary}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
