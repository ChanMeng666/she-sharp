"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";
import { VideoPlayer } from "@/components/ui/video-thumbnail-player";

const videos = {
  featured: {
    videoId: "waEBnmEZamY",
    title: "SheSharp 10 Years - Highlight Reel",
  },
  grid: [
    {
      videoId: "9HT-O-MHhTs",
      title: "She Sharp Anniversary Event",
    },
    {
      videoId: "kONKHNGsIP4",
      title: "Google Educator Conference",
    },
  ],
};

export function VideoShowcaseSection() {
  return (
    <Section className="bg-background">
      <Container size="full" className="mt-12 md:mt-16 lg:mt-20 mb-12 md:mb-16 lg:mb-20">
        {/* Section Header */}
        <AnimateOnScroll variant="fade-up" className="text-center mb-12 md:mb-16">
          <h2 className="text-display-sm text-foreground mb-4">
            Our Story in Motion
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Watch how She Sharp is making an impact in the STEM community
          </p>
        </AnimateOnScroll>

        {/* Featured Video */}
        <AnimateOnScroll variant="fade-up" className="mb-8">
          <VideoPlayer
            videoId={videos.featured.videoId}
            title={videos.featured.title}
          />
        </AnimateOnScroll>

        {/* Grid Videos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {videos.grid.map((video, index) => (
            <AnimateOnScroll
              key={video.videoId}
              variant="fade-up"
              delay={index * 100}
            >
              <VideoPlayer videoId={video.videoId} title={video.title} />
            </AnimateOnScroll>
          ))}
        </div>
      </Container>
    </Section>
  );
}
