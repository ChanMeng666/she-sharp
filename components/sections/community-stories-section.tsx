"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
const featuredStories = testimonialsByPage.home.filter(story => 
  story.featured || ["home-1", "home-3", "home-5"].includes(story.id)
).slice(0, 3);

// Removed upcoming events column to keep focus on testimonials

export function CommunityStoriesSection() {
  return (
    <Section>
      <Container size="wide">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-navy-dark mb-6">
            Community in Action
          </h2>
          <p className="text-lg text-gray max-w-3xl mx-auto">
            Real stories from women who've transformed their careers, plus upcoming opportunities 
            to connect and grow through our network.
          </p>
        </div>

        {/* Success Stories Only */}
        <div className="max-w-5xl mx-auto">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-purple-dark" />
              <h3 className="text-xl font-semibold text-navy-dark">Success Stories</h3>
            </div>

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
                    <Card className="border-2 border-purple-light/30 hover:border-purple-light transition-colors">
                      <CardContent className="p-6">
                        {/* Quote Icon */}
                        <Quote className="w-8 h-8 text-purple-light mb-4" />
                        
                        {/* Story Text */}
                        <blockquote className="text-gray italic text-lg mb-6 leading-relaxed">
                          "{story.quote}"
                        </blockquote>

                        {/* Author Info */}
                        <div className="flex items-center gap-4 mb-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={story.image} alt={story.name} />
                            <AvatarFallback className="bg-purple-light text-purple-dark">
                              {story.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-navy-dark text-lg">{story.name}</div>
                            <div className="text-gray">
                              {story.role} at {story.company}
                            </div>
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2">
                          {story.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs bg-purple-light/20 text-purple-dark">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2 h-10 w-10 bg-white/90 hover:bg-white" />
              <CarouselNext className="right-2 h-10 w-10 bg-white/90 hover:bg-white" />
            </Carousel>

            {/* View More Stories CTA */}
            <div className="mt-6 text-center">
              <Button variant="outline" size="lg" asChild>
                <Link href="/about#testimonials">
                  Read More Stories
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>

        </div>

        {/* Section CTA removed to reduce CTA noise */}
      </Container>
    </Section>
  );
}
