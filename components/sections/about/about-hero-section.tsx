"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

export function AboutHeroSection() {
  return (
    <Section
      noPadding
      className="relative h-[85vh] sm:h-[90vh] md:h-screen flex items-center overflow-hidden bg-gradient-to-b from-gray-950 via-black to-gray-950 -mt-12 sm:-mt-16"
    >
      <Container>
        <AnimateOnScroll variant="fade-up" className="relative z-10 mx-auto max-w-3xl text-center px-6 sm:px-0 py-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl leading-tight uppercase text-ghost-white">
            Changing the ratio in STEM
          </h1>
          <p className="mt-4 sm:mt-6 text-base sm:text-lg text-gray-200">
            We open doors to STEM careers through mentorship, hands‑on programs,
            and people who care.
          </p>

          {/* Founder's Note (always visible) */}
          <AnimateOnScroll variant="fade-up" delay={200} className="mt-6 sm:mt-8 text-left bg-gray-800/40 backdrop-blur-sm rounded-md p-4 sm:p-5 border border-purple-dark/20">
            <div className="space-y-3 text-gray-200">
              <p>
                In 2014, we set out to make career paths into tech visible and
                reachable.
              </p>
              <p>
                We’ve grown by doing the simple things well: practical support,
                peer learning, and consistent action.
              </p>
              <p className="italic">
                — Dr. Mahsa McCauley, Founder and Director
              </p>
            </div>
          </AnimateOnScroll>
        </AnimateOnScroll>
      </Container>
    </Section>
  );
}
