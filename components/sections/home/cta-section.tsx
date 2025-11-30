"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Heart, DollarSign, ArrowRight } from "lucide-react";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

export function CTASection() {
  return (
    <Section className="bg-muted">
      <Container size="full">
        <AnimateOnScroll variant="scale" className="max-w-7xl mx-auto bg-foreground rounded-4xl p-8">
          <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-8 p-8">
            {/* Left side - Main heading */}
            <AnimateOnScroll variant="fade-right" className="w-full lg:w-2/5">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-background leading-tight">
                BRIDGE THE<br />
                GENDER GAP<br />
                IN STEM<br />
                WITH US
              </h2>
            </AnimateOnScroll>

            {/* Right side - CTA blocks */}
            <div className="w-full lg:w-2/3 flex flex-col lg:flex-row gap-6">
              {/* Donate CTA */}
              <AnimateOnScroll variant="fade-up" delay={100} className="flex-1 max-w-lg mx-auto text-left flex flex-col items-start">
                <div className="w-18 h-18 bg-background rounded-full flex items-center justify-center mb-4">
                  <DollarSign className="w-8 h-8 text-foreground" />
                </div>
                <h3 className="text-2xl font-semibold text-background mb-3">
                  Donate to She Sharp
                </h3>
                <p className="text-background/80 leading-relaxed mb-6">
                  Help us empower more young women to pursue careers in STEM through events and networking opportunities.
                </p>
                <Button
                  variant="outline"
                  size="lg"
                  asChild
                  className="border border-background text-background bg-transparent hover:bg-background/10"
                >
                  <Link href="/donate">
                    Make a donation
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </AnimateOnScroll>

              {/* Event CTA */}
              <AnimateOnScroll variant="fade-up" delay={200} className="flex-1 max-w-lg mx-auto text-left flex flex-col items-start">
                <div className="w-18 h-18 bg-background rounded-full flex items-center justify-center mb-4">
                  <Heart className="w-8 h-8 text-foreground" />
                </div>
                <h3 className="text-2xl font-semibold text-background mb-3">
                  Come to an event
                </h3>
                <p className="text-background/80 leading-relaxed mb-6">
                  Meet new people, network with companies, engage in workshops and learn more about working in STEM!
                </p>
                <Button
                  variant="outline"
                  size="lg"
                  asChild
                  className="border border-background text-background bg-transparent hover:bg-background/10"
                >
                  <Link href="/events">
                    Explore Events
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </AnimateOnScroll>
            </div>
          </div>
        </AnimateOnScroll>
      </Container>
    </Section>
  );
}

export default CTASection;