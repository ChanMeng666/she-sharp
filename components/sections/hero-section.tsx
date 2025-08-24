"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import Iridescence, { brandColors } from "@/components/effects/iridescence";

// Hero images removed for minimalist design approach

export function HeroSection() {
  return (
    <section className="relative h-[85vh] sm:h-[90vh] md:h-screen flex items-center justify-center overflow-hidden -mt-12 sm:-mt-16">
      {/* Brand Color Iridescence Background */}
      <div className="absolute inset-0">
        <Iridescence
          color={brandColors.heroPeriwinkle}
          mouseReact={false}
          amplitude={0.15}
          speed={0.4}
          className="w-full h-full"
        />
        {/* Subtle overlay for text readability - 更轻柔的覆盖层 */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/3 via-transparent to-black/8" />
        
        {/* White frosted glass effect for better transition - 白色毛玻璃效果 */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/15 to-white/25 backdrop-blur-sm" />
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
              variant="glassmorphism"
              size="xl"
              asChild
              className="text-lg font-semibold"
            >
              <Link href="#upcoming-event">Attend next event</Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}