"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import Iridescence, { brandColors } from "@/components/effects/iridescence";

// Hero images removed for minimalist design approach

export function HeroSection() {
  return (
    <section className="relative h-[85vh] sm:h-[90vh] md:h-[92vh] rounded-b-[100px] flex items-center overflow-hidden -mt-12 sm:-mt-16 pt-32 md:pt-18">
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

      <Container className="relative z-10 w-full max-w-7xl">
        <div className="relative mx-auto grid grid-cols-1 items-center justify-items-center gap-8 sm:gap-10 lg:grid-cols-2">
          {/* Left: Dark card with heading and CTA */}
          <div className="max-w-xl rounded-3xl bg-transparent text-white border border-white/60 shadow-xl p-6 sm:p-8 md:p-10 animate-fade-in-up text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl font-bold leading-tight tracking-tight drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)]">
              CONNECTING WOMEN IN
              <br />
              TECHNOLOGY
            </h1>
            <div className="mt-8">
              <Button variant="default" size="lg" asChild className="px-6">
                <Link href="#upcoming-event">Attend next event</Link>
              </Button>
            </div>
          </div>

          {/* Right Image */}
          <Image
            src="/img/hero-image.png"
            alt="Hero Image"
            width={1200}
            height={800}
            priority
            className="w-full max-w-[520px] sm:max-w-[640px] md:max-w-[820px] lg:max-w-[1000px] xl:max-w-[1200px]"
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 80vw, 50vw"
          />
        </div>
      </Container>
    </section>
  );
}
