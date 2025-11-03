"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";

export function AboutHeroSection() {
  return (
    <Section
      noPadding
      className="relative h-[85vh] sm:h-[90vh] md:h-screen flex items-center overflow-hidden bg-navy-light -mt-12 sm:-mt-16"
    >
      <Container>
        <div className="relative z-10 mx-auto max-w-3xl text-center px-6 sm:px-0 py-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl leading-tight uppercase">
            Changing the ratio in STEM
          </h1>
          <p className="mt-4 sm:mt-6 text-base sm:text-lg">
            We open doors to STEM careers through mentorship, hands‑on programs,
            and people who care.
          </p>

          {/* Founder’s Note (always visible) */}
          <div className="mt-6 sm:mt-8 text-left bg-white/10 backdrop-blur-sm rounded-md p-4 sm:p-5">
            <div className="space-y-3">
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
          </div>
        </div>
      </Container>
    </Section>
  );
}
