"use client";

import { Section } from "@/components/layout/section";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

const YOUTUBE_VIDEO_ID = "s9oxO8nH8po";

export function OurJourneyVideo() {
  return (
    <Section
      id="our-journey"
      noPadding
      className="relative bg-background py-16 md:py-24 lg:py-32"
    >
      <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-16">
        <AnimateOnScroll variant="fade-up">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
              Our Journey
            </h2>
            <p className="mt-3 text-base md:text-lg text-muted-foreground">
              Watch how She Sharp is bridging the gender gap in STEM.
            </p>
          </div>
          <div className="relative aspect-video w-full overflow-hidden rounded-[var(--radius-card-md)] bg-black shadow-xl">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${YOUTUBE_VIDEO_ID}?start=2`}
              title="She Sharp — Our Journey"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              className="absolute inset-0 h-full w-full border-0"
            />
          </div>
        </AnimateOnScroll>
      </div>
    </Section>
  );
}
