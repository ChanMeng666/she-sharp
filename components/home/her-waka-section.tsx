"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, Briefcase, Scale, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/layout/section";
import { Container } from "@/components/layout/container";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

const HER_WAKA_URL = "https://herwaka.shesharp.org.nz/";

const HIGHLIGHTS = [
  { icon: Sparkles, text: "AI Skills & Future of Work" },
  { icon: Briefcase, text: "Job Readiness & Interview Prep" },
  { icon: Scale, text: "Employment Rights in NZ" },
  { icon: Users, text: "Professional Networking" },
] as const;

export function HerWakaSection() {
  return (
    <Section spacing="section" className="bg-white py-16 xl:py-24 2xl:py-32">
      <Container size="full">
        <AnimateOnScroll variant="fade-up" className="mb-12 md:mb-16 lg:mb-20">
          <h2 className="text-display-sm text-foreground">
            Featured Programme
          </h2>
        </AnimateOnScroll>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 xl:gap-16 items-center">
          {/* Poster Image */}
          <AnimateOnScroll variant="fade-right" className="w-full lg:w-1/2">
            <a
              href={HER_WAKA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group block overflow-hidden card-lg"
            >
              {/* Landscape poster for desktop */}
              <div className="hidden md:block relative aspect-video">
                <Image
                  src="/img/her-waka-banner-landscape.jpg"
                  alt="HER WAKA — Your Journey. Your Pace. Your Path."
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              </div>
              {/* Portrait poster for mobile */}
              <div className="md:hidden relative aspect-4/5">
                <Image
                  src="/img/her-waka-banner-portrait.jpg"
                  alt="HER WAKA — Your Journey. Your Pace. Your Path."
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="100vw"
                  priority
                />
              </div>
            </a>
          </AnimateOnScroll>

          {/* Text Content */}
          <AnimateOnScroll
            variant="fade-left"
            className="w-full lg:w-1/2 flex flex-col gap-6"
          >
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-brand mb-2">
                SheSharp x Ministry of Social Development
              </p>
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                HER WAKA
              </h3>
              <p className="mt-3 text-lg md:text-xl text-muted-foreground leading-relaxed">
                Navigating pathways into sustainable employment
              </p>
            </div>

            <p className="text-base text-muted-foreground leading-relaxed">
              A free workshop series empowering women to (re-)enter the
              workforce with practical skills, knowledge, and confidence to
              navigate the modern job market.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {HIGHLIGHTS.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-purple-light/20 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-brand" />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {text}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Button asChild size="lg" variant="brand">
                <a
                  href={HER_WAKA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Explore HER WAKA Resources
                  <ArrowRight className="ml-2 w-4 h-4" />
                </a>
              </Button>
            </div>
          </AnimateOnScroll>
        </div>
      </Container>
    </Section>
  );
}
