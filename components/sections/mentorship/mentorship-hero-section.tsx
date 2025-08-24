"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Sparkles, Target } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function MentorshipHeroSection() {
  return (
    <Section className="relative overflow-hidden bg-gradient-to-br from-white to-periwinkle-light/20 dark:from-gray-950 dark:to-periwinkle-dark/10">
      <Container>
        <div className="py-16 md:py-24">
          {/* Title and CTA */}
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-navy dark:text-white mb-4">
              MENTORSHIP
              <span className="block text-purple-dark dark:text-purple-mid">PROGRAM</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
              Match with experts. Grow faster. Advance with purpose.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-purple-dark hover:bg-purple-mid text-white">
                <Link href="/mentorship/mentee">
                  Become a Mentee
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-purple-dark text-purple-dark hover:bg-purple-light dark:border-purple-mid dark:text-purple-mid">
                <Link href="/mentorship/mentors">
                  View Our Mentors
                  <Users className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}