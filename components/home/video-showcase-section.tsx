"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

export function VideoShowcaseSection() {
  return (
    <Section className="bg-background">
      <Container size="full" className="mt-12 md:mt-16 lg:mt-20 mb-12 md:mb-16 lg:mb-20">
        <AnimateOnScroll variant="fade-up" className="text-center mb-12 md:mb-16">
          <h2 className="text-display-sm text-foreground mb-4">
            Our Story in Motion
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Watch how She Sharp is making an impact in the STEM community
          </p>
        </AnimateOnScroll>

        <AnimateOnScroll variant="fade-up">
          <div className="relative w-full aspect-video card-lg overflow-hidden">
            <iframe
              src="https://www.youtube.com/embed/9HT-O-MHhTs"
              title="She Sharp Anniversary Event"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          </div>
        </AnimateOnScroll>
      </Container>
    </Section>
  );
}
