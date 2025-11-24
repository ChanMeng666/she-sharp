"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import Iridescence, { brandColors } from "@/components/effects/iridescence";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

// Hero images removed for minimalist design approach

export function HeroSection() {
  return (
    <section className="relative -mt-16 sm:-mt-20 lg:-mt-24 h-[85vh] sm:h-[90vh] md:h-[95vh] flex items-center overflow-hidden pt-20 sm:pt-24">
      {/* Background Video */}
      <div className="absolute inset-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/video/shesharp.mp4" type="video/mp4" />
        </video>

        {/* Multi-layer gradient overlay for better text readability */}
        {/* Dark gradient from left - makes text area more prominent */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />

        {/* Dark gradient from bottom - anchors the content */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/30 to-transparent" />

        {/* Overall darkening overlay for better contrast */}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <Container className="relative z-10 w-full max-w-7xl">
        <div className="relative mx-auto flex items-center justify-start">
          {/* Left: Content area with heading and CTA */}
          <AnimateOnScroll variant="fade-up" className="max-w-xl p-6 sm:p-8 md:p-10 text-center lg:text-left">
            <h1 className="relative text-4xl sm:text-5xl md:text-6xl lg:text-6xl font-extrabold leading-tight tracking-tight uppercase">
              <span
                aria-hidden="true"
                className="absolute inset-0 translate-x-[2px] translate-y-[2px] text-light-pink/80 blur-[1.5px] drop-shadow-[0_8px_20px_rgba(0,0,0,0.45)] pointer-events-none"
              >
                <span className="block">CONNECTING WOMEN IN</span>
                <span className="block">TECHNOLOGY</span>
              </span>
              <span className="relative block text-light-pink/70 bg-clip-text bg-gradient-to-r from-ghost-white via-ghost-white to-mint-light drop-shadow-[0_10px_35px_rgba(0,0,0,0.6)]">
                CONNECTING WOMEN IN
                <br />
                TECHNOLOGY
              </span>
            </h1>
            <div className="mt-12 flex justify-center lg:justify-start">
              <Button variant="default" size="lg" asChild className="px-6">
                <Link href="#upcoming-event">Attend next event</Link>
              </Button>
            </div>
          </AnimateOnScroll>

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
