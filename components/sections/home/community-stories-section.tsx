"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Quote, ArrowRight, Sparkles } from "lucide-react";
import { testimonialsByPage } from "@/lib/data/testimonials";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

// 精选成功故事（从testimonials中选择最有代表性的）
const featuredStories = testimonialsByPage.home
  .filter(
    (story) =>
      story.featured || ["home-1", "home-3", "home-5"].includes(story.id)
  )
  .slice(0, 3);

// Removed upcoming events column to keep focus on testimonials

export function CommunityStoriesSection() {
  return (
    <Section className="bg-foreground">
      <Container size="full">
        {/* Section Header */}
        <AnimateOnScroll variant="fade-up" className="text-center mb-8 sm:mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-background">
            Community in Action
          </h2>
        </AnimateOnScroll>

        {/* Success Stories with Left Side Content */}
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-start gap-10 lg:gap-16 lg:justify-evenly">
            {/* Left side - Description and CTA */}
            <AnimateOnScroll variant="fade-right" className="w-full lg:w-1/3 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center gap-3 mb-8">
                  <Sparkles className="w-6 h-6 text-background" />
                  <h3 className="text-2xl font-semibold text-background">
                    Success Stories
                  </h3>
                </div>

                <p className="text-lg text-gray-200 leading-relaxed">
                  Real stories from women who've transformed their careers, plus
                  upcoming opportunities to connect and grow through our
                  network.
                </p>
              </div>

              {/* View More Stories CTA */}
              <Button
                variant="default"
                size="lg"
                asChild
                className="mt-12 w-fit"
              >
                <Link href="/about#testimonials">Read More Stories</Link>
              </Button>
            </AnimateOnScroll>

            {/* Right side - Carousel */}
            <AnimateOnScroll variant="fade-left" className="w-full lg:w-2/5">
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                }}
                plugins={[
                  Autoplay({
                    delay: 6000,
                  }),
                ]}
                className="w-full"
              >
                <CarouselContent>
                  {featuredStories.map((story) => (
                    <CarouselItem key={story.id}>
                      <Card className="border-border bg-background">
                        <CardContent className="p-10">
                          {/* Story Text */}
                          <div className="relative">
                            <Quote className="absolute -top-2 -left-2 w-6 h-6 text-muted-foreground rotate-180" />
                            <blockquote className="text-foreground italic text-lg mb-12 leading-relaxed pl-8">
                              {story.quote}
                            </blockquote>
                            <Quote className="absolute -bottom-2 -right-2 w-6 h-6 text-muted-foreground" />
                          </div>

                          {/* Author Info */}
                          <div className="flex items-center gap-5 mb-4">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={story.image} alt={story.name} />
                              <AvatarFallback
                                style={{
                                  backgroundColor: "var(--color-foreground)",
                                  color: "var(--color-background)",
                                }}
                              >
                                {story.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold text-foreground text-lg">
                                {story.name}
                              </div>
                              <div className="text-muted-foreground">
                                {story.role} at {story.company}
                              </div>
                            </div>
                          </div>

                          {/* Tags */}
                          <div className="flex flex-wrap gap-3">
                            {story.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs bg-muted text-foreground border border-border px-3 py-1"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex -left-16 h-10 w-10 bg-muted hover:bg-muted/80 border-border text-foreground" />
                <CarouselNext className="hidden md:flex -right-16 h-10 w-10 bg-muted hover:bg-muted/80 border-border text-foreground" />
              </Carousel>
            </AnimateOnScroll>
          </div>
        </div>

      </Container>
    </Section>
  );
}
