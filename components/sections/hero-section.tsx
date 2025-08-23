"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import Iridescence, { brandColors } from "@/components/effects/iridescence";

// Hero images removed for minimalist design approach

export function HeroSection() {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden -mt-16">
      {/* Brand Color Iridescence Background */}
      <div className="absolute inset-0">
        <Iridescence
          color={brandColors.periwinkleBright}
          mouseReact={true}
          amplitude={0.15}
          speed={1.0}
          className="w-full h-full"
        />
        {/* Subtle overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/15" />
      </div>
      


      <Container className="relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold text-white mb-12 animate-fade-in-up leading-tight drop-shadow-lg">
            CONNECTING{" "}
            <span className="bg-gradient-to-r from-purple-light to-periwinkle-light bg-clip-text text-transparent">
              women in technology
            </span>
          </h1>

          {/* CTA Button */}
          <div className="animate-fade-in-up animation-delay-200">
            <Button
              size="lg"
              asChild
              className="bg-purple-dark hover:bg-purple-mid text-white shadow-lg px-8 py-6 text-lg"
            >
              <Link href="/events">Explore Events</Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}