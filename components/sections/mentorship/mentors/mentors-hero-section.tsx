"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Users, Star, Award } from "lucide-react";
import Image from "next/image";
import { mentors } from "@/lib/data/mentors";
import Autoplay from "embla-carousel-autoplay";

export function MentorsHeroSection() {
  const featuredMentors = mentors.filter(m => m.rating && m.rating >= 4.9).slice(0, 6);

  const stats = [
    { icon: Users, value: "18+", label: "Expert Mentors" },
    { icon: Star, value: "4.8", label: "Average Rating" },
    { icon: Award, value: "100+", label: "Success Stories" },
  ];

  return (
    <Section className="relative overflow-hidden bg-foreground">
      <div className="absolute inset-0 bg-foreground" />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-muted/10 transform skew-x-12" />
      
      <Container className="relative z-10">
        <div className="py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div>
                <h1 className="text-5xl md:text-7xl font-bold text-background leading-tight">
                  CONNECT WITH
                </h1>
                <h2 className="text-4xl md:text-6xl font-bold text-muted-foreground mt-2">
                  EXPERT MENTORS
                </h2>
              </div>

              <p className="text-lg text-muted-foreground max-w-xl mb-8">
                Discover accomplished professionals ready to guide your STEM journey.
                Our mentors bring diverse expertise from leading tech companies and organizations.
              </p>

              <Button
                size="lg"
                className="bg-background hover:bg-background/90 text-foreground mb-8"
                onClick={() => {
                  const element = document.getElementById('mentors-list');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Explore All Mentors
              </Button>

              <div className="flex flex-wrap gap-8">
                {stats.map((stat) => (
                  <div key={stat.label} className="flex items-center gap-3">
                    <div className="p-3 bg-muted/20 rounded-lg">
                      <stat.icon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-background">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                }}
                plugins={[
                  Autoplay({
                    delay: 4000,
                  }),
                ]}
                className="w-full"
              >
                <CarouselContent>
                  {featuredMentors.map((mentor) => (
                    <CarouselItem key={mentor.id} className="md:basis-1/2 lg:basis-full">
                      <div className="p-1">
                        <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-muted p-1">
                          <div className="relative w-full h-full rounded-xl overflow-hidden">
                            <Image
                              src={mentor.image}
                              alt={mentor.name}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 50vw"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-transparent to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-6 text-background">
                              <h3 className="text-xl font-bold mb-1">{mentor.name}</h3>
                              <p className="text-sm opacity-90 mb-2">{mentor.role}</p>
                              <p className="text-sm opacity-80">{mentor.company}</p>
                              <div className="flex items-center gap-1 mt-3">
                                <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                <span className="text-sm font-medium">{mentor.rating}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-2 bg-background/20 border-background/30 text-background hover:bg-background/30" />
                <CarouselNext className="right-2 bg-background/20 border-background/30 text-background hover:bg-background/30" />
              </Carousel>

              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-muted/20 rounded-full blur-3xl" />
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-muted/20 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}