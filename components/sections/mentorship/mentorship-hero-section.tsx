"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Sparkles, Target } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

export function MentorshipHeroSection() {
  return (
    <Section className="relative overflow-hidden bg-muted">
      <Container>
        <div className="py-16 md:py-24">
          {/* Title and CTA */}
          <AnimateOnScroll variant="fade-up" className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-4">
              MENTORSHIP
              <span className="block text-muted-foreground">PROGRAM</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Match with experts. Grow faster. Advance with purpose.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/mentorship/join">
                  Join as Mentee
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/mentorship/become-a-mentor">
                  Apply as Mentor
                  <Sparkles className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </AnimateOnScroll>
        </div>
      </Container>
    </Section>
  );
}