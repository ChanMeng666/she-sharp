"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Users, Lightbulb, ArrowRight } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";
import { layoutSystem } from "@/lib/layout-system";

const eventCategories = {
  networking: {
    title: "Networking Events",
    icon: Users,
    description: "Connect with industry leaders and peers",
    photos: [
      {
        src: "https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/64bb9496356882b94962ea96_20230428180106_IMG_5870%20(1)%201.png",
        alt: "Networking event with professionals mingling",
        caption: "Annual Mixer 2023 - 150+ attendees",
      },
      {
        src: "https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/66e53bf5807e91c5b0ebff7a_For%20Sponsors%20Photo3.png",
        alt: "She Sharp ambassadors at networking event",
        caption: "Brand ambassadors connecting communities",
      },
    ],
  },
  workshops: {
    title: "Technical Workshops",
    icon: Lightbulb,
    description: "Hands-on learning and skill development",
    photos: [
      {
        src: "https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/64bb9282bdc6d35c9c244e82_Hackathon-Sept2022-91%201.png",
        alt: "Hackathon participants collaborating",
        caption: "She Sharp Hackathon - Building solutions together",
      },
      {
        src: "https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/64bb97cd4e3f4165f114551d_Hackathon-Sept2022-57%201.png",
        alt: "Workshop participants coding",
        caption: "Python Workshop - Learning by doing",
      },
    ],
  },
  conferences: {
    title: "Conferences & Panels",
    icon: Calendar,
    description: "Inspiring talks and knowledge sharing",
    photos: [
      {
        src: "https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/66e53be23e332ec6b14b87c1_For%20Sponsors%20Photo1.jpg",
        alt: "Conference keynote presentation",
        caption: "STEM Leadership Summit 2023",
      },
      {
        src: "https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/66e53befc90bbde965b039f0_For%20Sponsors%20Photo2.jpg",
        alt: "Panel discussion with industry leaders",
        caption: "Women in Tech Panel Discussion",
      },
    ],
  },
};

export function PhotoGallerySection() {
  return (
    <Section bgColor="white">
      <Container size="wide">
        <div>
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-display-sm text-foreground mb-4">
              Experience She Sharp Events
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From intimate workshops to large-scale conferences, our events create meaningful
              connections and learning opportunities.
            </p>
          </div>

          {/* Tabbed Gallery */}
          <Tabs defaultValue="networking" className="w-full">
            <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-3 mb-8">
              {Object.entries(eventCategories).map(([key, category]) => {
                const Icon = category.icon;
                return (
                  <TabsTrigger
                    key={key}
                    value={key}
                    className="flex items-center gap-2 data-[state=active]:bg-foreground data-[state=active]:text-background"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{category.title}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {Object.entries(eventCategories).map(([key, category]) => (
              <TabsContent key={key} value={key} className="mt-0">
                <div className="space-y-6">
                  {/* Category Description */}
                  <Card className="border-border bg-background/50">
                    <CardContent className="p-6">
                      <p className="text-muted-foreground text-center">
                        {category.description}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Photo Carousel */}
                  <Carousel
                    opts={{
                      align: "start",
                      loop: true,
                    }}
                    plugins={[
                      Autoplay({
                        delay: 5000,
                        stopOnInteraction: true,
                      }),
                    ]}
                    className="w-full"
                  >
                    <CarouselContent>
                      {category.photos.map((photo, index) => (
                        <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/2">
                          <Card className="overflow-hidden">
                            <CardContent className="p-0">
                              <AspectRatio ratio={16 / 9}>
                                <Image
                                  src={photo.src}
                                  alt={photo.alt}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 768px) 100vw, 50vw"
                                />
                              </AspectRatio>
                              <div className="p-4 bg-foreground/90 absolute bottom-0 left-0 right-0">
                                <p className="text-background text-sm font-medium">
                                  {photo.caption}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="hidden md:flex -left-12" />
                    <CarouselNext className="hidden md:flex -right-12" />
                  </Carousel>
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {/* CTA Section */}
          <div className="mt-12 text-center space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                asChild
              >
                <Link href="/resources#gallery">
                  Explore Full Gallery
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-border text-foreground hover:bg-muted"
              >
                <Link href="/events">
                  Join Our Next Event
                </Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              See how our sponsors help create these impactful experiences
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}