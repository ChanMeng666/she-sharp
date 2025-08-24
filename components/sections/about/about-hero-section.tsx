"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
 
 
import Iridescence, { brandColors } from "@/components/effects/iridescence";

export function AboutHeroSection() {
  return (
    <Section noPadding className="relative h-[85vh] sm:h-[90vh] md:h-screen flex items-center overflow-hidden bg-white -mt-12 sm:-mt-16">
      {/* Iridescence dynamic background (About variant) */}
      <div className="absolute inset-0 z-0">
        <Iridescence
          color={brandColors.navAbout}
          mouseReact={false}
          amplitude={0.10}
          speed={0.25}
          className="w-full h-full"
        />
        {/* Subtle overlay for text readability - 更轻柔的覆盖层 */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/3 via-transparent to-black/8" />
        {/* White frosted glass effect for better transition - 白色毛玻璃效果 */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/15 to-white/25 backdrop-blur-sm" />
      </div>

      <Container>
        <div className="relative z-10 mx-auto max-w-3xl text-center text-white px-6 sm:px-0 py-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              Changing the ratio in STEM
            </h1>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-white/90">
              We open doors to STEM careers through mentorship, hands‑on programs, and people who care.
            </p>

            {/* Founder’s Note (always visible) */}
            <div className="mt-6 sm:mt-8 text-left bg-white/10 backdrop-blur-sm rounded-md p-4 sm:p-5">
              <div className="space-y-3 text-white/90">
                <p>
                  In 2014, we set out to make career paths into tech visible and reachable.
                </p>
                <p>
                  We’ve grown by doing the simple things well: practical support, peer learning, and consistent action.
                </p>
                <p className="italic text-white/80">
                  — Dr. Mahsa McCauley, Founder and Director
                </p>
              </div>
            </div>
        </div>
      </Container>
    </Section>
  );
}