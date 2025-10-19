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
    <Section>
      <Container size="full">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-navy-dark mb-6">
            Community in Action
          </h2>
        </div>

        {/* Success Stories with Left Side Content */}
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-12 lg:justify-between">
            {/* Left side - Description and CTA */}
            <div className="w-full lg:w-1/3 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles className="w-5 h-5" style={{ color: "#597B75" }} />
                  <h3 className="text-2xl font-semibold text-navy-dark">
                    Success Stories
                  </h3>
                </div>

                <p className="text-lg text-navy-dark/70 leading-relaxed">
                  Real stories from women who've transformed their careers, plus
                  upcoming opportunities to connect and grow through our network.
                </p>
              </div>

              {/* View More Stories CTA */}
              <Button variant="outline" size="lg" asChild className="border-2 mt-8" style={{ borderColor: "#597B75", color: "#597B75" }}>
                <Link href="/about#testimonials">Read More Stories</Link>
              </Button>
            </div>

            {/* Right side - Carousel */}
            <div className="w-full lg:w-1/2">
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
                      <Card
                        className="border-2"
                        style={{ borderColor: "#597B75" }}
                      >
                        <CardContent className="p-10">
                          {/* Quote Icon */}
                          <Quote
                            className="w-8 h-8 mb-4"
                            style={{ color: "#597B75" }}
                          />

                          {/* Story Text */}
                          <blockquote className="text-[#597B75] italic text-lg mb-8 leading-relaxed">
                            "{story.quote}"
                          </blockquote>

                          {/* Author Info */}
                          <div className="flex items-center gap-4 mb-4">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={story.image} alt={story.name} />
                              <AvatarFallback
                                style={{
                                  backgroundColor: "#597B75",
                                  color: "white",
                                }}
                              >
                                {story.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold text-navy-dark text-lg">
                                {story.name}
                              </div>
                              <div className="text-navy-dark/70">
                                {story.role} at {story.company}
                              </div>
                            </div>
                          </div>

                          {/* Tags */}
                          <div className="flex flex-wrap gap-2">
                            {story.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs"
                                style={{
                                  backgroundColor: "#EFFEFB",
                                  color: "#1F1E44/50",
                                }}
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
                <CarouselPrevious className="-left-16 h-10 w-10 bg-white/90 hover:bg-white border-2" style={{ borderColor: "#597B75", color: "#597B75" }} />
                <CarouselNext className="-right-16 h-10 w-10 bg-white/90 hover:bg-white border-2" style={{ borderColor: "#597B75", color: "#597B75" }} />
              </Carousel>
            </div>
          </div>
        </div>

        {/* Section CTA removed to reduce CTA noise */}
      </Container>
    </Section>
  );
}
