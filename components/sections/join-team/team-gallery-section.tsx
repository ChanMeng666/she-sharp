"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { Calendar, Users, MapPin, Camera } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";
import { layoutSystem } from "@/lib/layout-system";

const galleryImages = [
  {
    id: 1,
    src: "https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/64863e73a325a05fbc0e6e13_Join%20Our%20Team_3.png",
    alt: "She Sharp volunteers at event setup",
    caption: "Event Setup & Coordination",
    event: "Tomorrow Expo 2024",
    date: "March 2024",
    location: "Auckland CBD",
    volunteers: 12,
    description: "Our dedicated volunteers arrived early to transform the venue into an inspiring space for 200+ attendees. From registration desks to networking areas, every detail was carefully planned.",
    tags: ["Event Setup", "Team Work", "Community"]
  },
  {
    id: 2,
    src: "https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/64bba5904c40f11a7ff832e7_Mask%20group%20(1).png",
    alt: "She Sharp ambassadors team meeting",
    caption: "Ambassador Team Meeting",
    event: "Monthly Strategy Session",
    date: "February 2024",
    location: "She Sharp HQ",
    volunteers: 8,
    description: "Our ambassadors gather monthly to plan upcoming initiatives, share insights, and strengthen our mission. These sessions are where innovation meets passion.",
    tags: ["Leadership", "Planning", "Ambassadors"]
  },
  {
    id: 3,
    src: "https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/66e53b454b537205d48785f7_Join%20Our%20Team%20Photo1.png",
    alt: "She Sharp team collaboration",
    caption: "Team Collaboration Workshop",
    event: "Skills Development Day",
    date: "January 2024",
    location: "Tech Hub Auckland",
    volunteers: 15,
    description: "A hands-on workshop where volunteers learned new skills in event management, digital marketing, and community engagement. Knowledge sharing at its best!",
    tags: ["Training", "Skills", "Development"]
  },
  {
    id: 4,
    src: "https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/64863e7324d1d65cc87fe0ff_Join%20Our%20Team_1.png",
    alt: "She Sharp community event",
    caption: "Community Celebration",
    event: "10th Anniversary Gala",
    date: "December 2023",
    location: "Viaduct Events Centre",
    volunteers: 25,
    description: "Celebrating a decade of impact with our volunteers, members, and sponsors. An unforgettable evening recognizing the contributions of our amazing community.",
    tags: ["Celebration", "Milestone", "Community"]
  },
  {
    id: 5,
    src: "https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/66e53b454b537205d48785f7_Join%20Our%20Team%20Photo1.png",
    alt: "STEM workshop facilitation",
    caption: "STEM Workshop Facilitation",
    event: "High School Outreach",
    date: "November 2023",
    location: "Various Schools",
    volunteers: 10,
    description: "Our volunteers inspiring the next generation of women in STEM through interactive workshops and mentoring sessions at local high schools.",
    tags: ["Education", "Outreach", "STEM"]
  },
  {
    id: 6,
    src: "https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/64863e7324d1d65cc87fe0ff_Join%20Our%20Team_1.png",
    alt: "Networking event support",
    caption: "Industry Networking Night",
    event: "Tech Leaders Connect",
    date: "October 2023",
    location: "SkyCity Convention Centre",
    volunteers: 18,
    description: "Facilitating connections between students, professionals, and industry leaders. Our volunteers ensure everyone feels welcome and engaged.",
    tags: ["Networking", "Professional", "Connections"]
  }
];

export function TeamGallerySection() {
  return (
    <Section bgColor="accent" className="overflow-hidden">
      <Container size="full">
        <div>
          {/* Section Header */}
          <div className="text-center mb-20 space-y-4">
            <div className="inline-flex items-center justify-center gap-2 mb-4">
              <Camera className="w-5 h-5 text-foreground" />
              <span className="text-sm font-medium text-foreground uppercase tracking-wider">
                Volunteer Moments
              </span>
            </div>
            
            <h2 className="text-5xl md:text-6xl font-bold text-foreground">
              Life as a She Sharp Volunteer
            </h2>
            
            <p className="text-xl md:text-2xl text-gray max-w-3xl mx-auto leading-relaxed">
              Experience the energy, passion, and impact of our volunteer community through these moments
            </p>
          </div>

          {/* Main Carousel */}
          <div className="relative">
            <Carousel
              opts={{
                align: "center",
                loop: true,
              }}
              plugins={[
                Autoplay({
                  delay: 4000,
                  stopOnInteraction: false,
                }),
              ]}
              className="w-full"
            >
              <CarouselContent>
                {galleryImages.map((image) => (
                  <CarouselItem key={image.id} className="basis-full lg:basis-4/5">
                    <HoverCard openDelay={200}>
                      <HoverCardTrigger asChild>
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl cursor-pointer group">
                          <AspectRatio ratio={16/10}>
                            <Image
                              src={image.src}
                              alt={image.alt}
                              fill
                              className="object-cover transition-opacity duration-150"
                              priority={image.id === 1}
                            />
                          </AspectRatio>
                          
                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-black/50" />
                          
                          {/* Caption Overlay */}
                          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                            <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                              {image.caption}
                            </h3>
                            <div className="flex items-center gap-4 text-white/90">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span className="text-sm">{image.date}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span className="text-sm">{image.location}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                <span className="text-sm">{image.volunteers} volunteers</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Hover Indicator */}
                          <div className="absolute top-6 right-6 bg-white/20 backdrop-blur-sm rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                            <Camera className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      </HoverCardTrigger>
                      
                      <HoverCardContent className="w-96 p-6" side="top" align="center">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-lg font-semibold text-foreground mb-1">
                              {image.event}
                            </h4>
                            <p className="text-sm text-gray-600 leading-relaxed">
                              {image.description}
                            </p>
                          </div>
                          
                          <Separator />
                          
                          <div className="flex flex-wrap gap-2">
                            {image.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </CarouselItem>
                ))}
              </CarouselContent>
              
              <CarouselPrevious className="left-4 md:-left-16 h-12 w-12 bg-white/90 backdrop-blur hover:bg-white shadow-lg" />
              <CarouselNext className="right-4 md:-right-16 h-12 w-12 bg-white/90 backdrop-blur hover:bg-white shadow-lg" />
            </Carousel>
          </div>

          {/* Thumbnail Navigation */}
          <div className="mt-12 flex justify-center">
            <div className="flex gap-3 p-4 bg-white rounded-full shadow-lg">
              {galleryImages.map((image, index) => (
                <button
                  key={image.id}
                  className={`w-16 h-12 rounded-lg overflow-hidden transition-opacity duration-150 hover:opacity-80 ${
                    index === 0 ? 'ring-2 ring-border ring-offset-2' : ''
                  }`}
                  aria-label={`View ${image.caption}`}
                >
                  <Image
                    src={image.src}
                    alt={`Thumbnail ${index + 1}`}
                    width={64}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-16 text-center">
            <p className="text-lg text-gray-600 mb-4">
              Ready to create your own volunteer memories?
            </p>
            <Badge className="bg-foreground text-background px-6 py-2 text-sm hover:bg-foreground/90 cursor-pointer transition-colors duration-150">
              Join Our Next Event
            </Badge>
          </div>
        </div>
      </Container>
    </Section>
  );
}