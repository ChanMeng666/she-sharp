"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users } from "lucide-react";
import Link from "next/link";
import Iridescence, { brandColors } from "@/components/effects/iridescence";

export function MentorshipHeroSection() {
  return (
    <section className="relative h-[85vh] sm:h-[90vh] md:h-screen flex items-center justify-center overflow-hidden">
      {/* Iridescence Background */}
      <div className="absolute inset-0">
        <Iridescence
          color={brandColors.heroPeriwinkle}
          mouseReact={false}
          amplitude={0.15}
          speed={0.4}
          className="w-full h-full"
        />
        {/* Subtle overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/3 via-transparent to-black/8" />
        
        {/* White frosted glass effect for better transition */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/15 to-white/25 backdrop-blur-sm" />
      </div>
      
      <Container className="relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Title and CTA */}
          <div className="text-center">
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
    </section>
  );
}