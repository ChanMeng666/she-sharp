"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import Iridescence, { brandColors } from "@/components/effects/iridescence";

// Hero images removed for minimalist design approach

export function HeroSection() {
  return (
    <section className="relative -mt-16 sm:-mt-20 lg:-mt-24 h-[85vh] sm:h-[90vh] md:h-[95vh] flex items-center overflow-hidden pt-20 sm:pt-24">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/img/IMG_1232.jpg"
          alt="Hero Background"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        {/* <Iridescence
          color={brandColors.heroPeriwinkle}
          mouseReact={false}
          amplitude={0.15}
          speed={0.4}
          className="w-full h-full"
        /> */}

        {/* Multi-layer gradient overlay for better text readability */}
        {/* Dark gradient from left - makes text area more prominent */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />

        {/* Dark gradient from bottom - anchors the content */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent" />

        {/* Overall darkening overlay for better contrast */}
        <div className="absolute inset-0 bg-black/10" />

        {/* White frosted glass effect for better transition - 白色毛玻璃效果 */}
        {/* <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/15 to-white/25 backdrop-blur-sm" /> */}
      </div>

      <Container className="relative z-10 w-full max-w-7xl">
        <div className="relative mx-auto flex items-center justify-start">
          {/* Left: Content area with heading and CTA */}
          <div className="max-w-xl text-white p-6 sm:p-8 md:p-10 animate-fade-in-up text-center lg:text-left">
            <h1 className="relative text-4xl sm:text-5xl md:text-6xl lg:text-6xl font-extrabold leading-tight tracking-tight uppercase">
              <span
                aria-hidden="true"
                className="absolute inset-0 translate-x-[2px] translate-y-[2px] text-mint-light/40 blur-[1.5px] drop-shadow-[0_8px_20px_rgba(0,0,0,0.45)] pointer-events-none"
              >
                <span className="block">CONNECTING WOMEN IN</span>
                <span className="block">TECHNOLOGY</span>
              </span>
              <span className="relative block text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-mint-light drop-shadow-[0_10px_35px_rgba(0,0,0,0.6)]">
                CONNECTING WOMEN IN
                <br />
                TECHNOLOGY
              </span>
            </h1>
            <div className="mt-8 flex justify-center lg:justify-start">
              <Button variant="default" size="lg" asChild className="px-6">
                <Link href="#upcoming-event">Attend next event</Link>
              </Button>
            </div>
          </div>

          {/* Right Image */}
          {/* <Image
            src="/img/hero-image.png"
            alt="Hero Image"
            width={1200}
            height={800}
            priority
            className="w-full max-w-[520px] sm:max-w-[640px] md:max-w-[820px] lg:max-w-[1000px] xl:max-w-[1200px]"
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 80vw, 50vw"
          /> */}
        </div>
      </Container>
    </section>
  );
}
