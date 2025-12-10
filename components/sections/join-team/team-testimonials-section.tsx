"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Quote, Sparkles } from "lucide-react";
import { layoutSystem } from "@/lib/layout-system";

const testimonials = [
  {
    id: 1,
    name: "Shein Delos Angeles",
    role: "Event Volunteer",
    theme: "purple",
    quote: "I volunteered to help with the She Sharp Tomorrow Expo and I enjoyed every step of the way. I was one of the volunteers who helped set up and talk to people about She Sharp's agenda and it was a blast! I wanted to commend this organisation for giving me an opportunity to meet people around tech and to know some people that are now my friends. I'm looking forward to the next upcoming event!",
    highlights: ["Tomorrow Expo", "Networking", "Community"]
  },
  {
    id: 2,
    name: "Vic Arce",
    role: "Previous Ambassador",
    theme: "periwinkle",
    quote: "Working with She# has been such a remarkable experience. I feel lucky to have had the opportunity to be surrounded by highly motivated people who want to make a difference for women. I once spoke with a friend who described the She# team as people who eat passion for breakfast - a very amusing description which I found true in the months I've been with the team.",
    highlights: ["Leadership", "Team Spirit", "Impact"]
  },
  {
    id: 3,
    name: "Aneela Lala",
    role: "Previous Ambassador",
    theme: "purple",
    quote: "As an Ambassador for She Sharp, I have had the privilege of collaborating with fabulous like-minded Wahine, connecting with amazing people from diverse STEM fields and sharing my passion for STEM and inclusivity with so many talented, successful and inspiring Women in Industry. In addition, She Sharp has allowed me to step outside of my comfort zone (as an introvert), by providing a supportive safety net of Ambassadors who challenge my own limiting beliefs about my capabilities and encourage me to grow.",
    highlights: ["Personal Growth", "STEM Advocacy", "Inclusivity"]
  },
  {
    id: 4,
    name: "Yinghui (Maxie) Ouyang",
    role: "Event Volunteer",
    theme: "periwinkle",
    quote: "Being a volunteer at She Sharp has been an enlightening and fulfilling experience. The She Sharp team really take care of you and make sure you get access to the benefits as if you are a participant of each event. Networking is a great example of that. I've met more women in tech from the first event than I have in months. They go out of their way to make sure the volunteers are seen and appreciated for their hard work.",
    highlights: ["Support", "Networking", "Recognition"]
  },
  {
    id: 5,
    name: "Anna Thompson",
    role: "Previous Ambassador",
    theme: "purple",
    quote: "She Sharp gave me the platform to develop skills I didn't know I had. From organizing events to mentoring new volunteers, every experience pushed me to grow professionally and personally. The friendships I've made here are invaluable.",
    highlights: ["Skill Development", "Mentoring", "Friendship"]
  },
  {
    id: 6,
    name: "Rachel Park",
    role: "Event Volunteer",
    theme: "periwinkle",
    quote: "As a university student, volunteering with She Sharp opened doors I never imagined. The exposure to industry professionals and the hands-on experience in event management has been instrumental in shaping my career path.",
    highlights: ["Career Development", "Industry Exposure", "Experience"]
  }
];

export function TeamTestimonialsSection() {
  return (
    <Section bgColor="accent">
      <Container size="full">
        <div className="mx-auto max-w-7xl">
          {/* Section Header with more spacing */}
          <div className="text-center mb-24 space-y-6">
            <div className="inline-flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-foreground mr-2" />
              <span className="text-sm font-medium text-foreground uppercase tracking-wider">
                Volunteer Stories
              </span>
              <Sparkles className="w-6 h-6 text-foreground ml-2" />
            </div>
            
            <h2 className="text-display-md text-foreground leading-tight">
              Voices from Our
              <span className="block text-foreground mt-2">Community</span>
            </h2>
            
            <div className="max-w-3xl mx-auto space-y-4">
              <p className="text-xl md:text-2xl text-gray leading-relaxed">
                Hear from the amazing volunteers who make She Sharp&apos;s mission possible
              </p>
              <Separator className="w-24 mx-auto bg-border" />
            </div>
          </div>

          {/* Testimonials Carousel with increased spacing */}
          <div className="relative px-4 md:px-8 lg:px-16">
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              plugins={[
                Autoplay({
                  delay: 6000,
                  stopOnInteraction: false,
                }),
              ]}
              className="w-full"
            >
              <CarouselContent className="-ml-6 lg:-ml-8">
                {testimonials.map((testimonial) => (
                  <CarouselItem key={testimonial.id} className="pl-6 lg:pl-8 basis-full md:basis-1/2 lg:basis-1/3">
                    <Card 
                      className={`h-full border-0 shadow-md hover:shadow-lg transition-shadow duration-150 overflow-hidden group ${
                        testimonial.theme === 'purple' ? 'bg-white' : 'bg-white'
                      }`}
                    >
                      {/* Color accent bar */}
                      <div className="h-1 bg-border" />
                      
                      <CardContent className="p-10 flex flex-col h-full space-y-6">
                        {/* Quote Icon with breathing room */}
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted transition-colors duration-150">
                          <Quote className="w-8 h-8 text-foreground" />
                        </div>

                        {/* Quote Text with improved typography */}
                        <blockquote className="flex-grow text-quote text-gray-700">
                          {testimonial.quote}
                        </blockquote>

                        <Separator className="bg-gray-100" />

                        {/* Author Info with better spacing */}
                        <div className="space-y-3">
                          <div>
                            <p className="font-brand-script text-2xl text-foreground">
                              {testimonial.name}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {testimonial.role}
                            </p>
                          </div>

                          {/* Highlights with refined style */}
                          <div className="flex flex-wrap gap-2 pt-2">
                            {testimonial.highlights.map((highlight) => (
                              <Badge
                                key={highlight}
                                variant="outline"
                                className="text-xs font-normal"
                              >
                                {highlight}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-0 xl:-left-16 h-14 w-14 bg-white shadow-lg hover:shadow-xl border-0" />
              <CarouselNext className="right-0 xl:-right-16 h-14 w-14 bg-white shadow-lg hover:shadow-xl border-0" />
            </Carousel>
          </div>

          {/* Impact Statistics with generous spacing */}
          <div className="mt-32 relative">
            <div className="absolute inset-0 bg-muted rounded-3xl" />
            <div className="relative bg-white rounded-3xl shadow-lg p-12 md:p-16">
              <h3 className="text-2xl font-bold text-foreground text-center mb-12">
                Our Collective Impact
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                <div className="text-center space-y-3">
                  <div className="text-4xl md:text-5xl text-stat text-foreground">200+</div>
                  <div className="text-base text-gray-600">Active Volunteers</div>
                </div>
                <div className="text-center space-y-3">
                  <div className="text-4xl md:text-5xl text-stat text-foreground">95%</div>
                  <div className="text-base text-gray-600">Would Recommend</div>
                </div>
                <div className="text-center space-y-3">
                  <div className="text-4xl md:text-5xl text-stat text-foreground">2200+</div>
                  <div className="text-base text-gray-600">Volunteer Hours</div>
                </div>
                <div className="text-center space-y-3">
                  <div className="text-4xl md:text-5xl text-stat text-foreground">10</div>
                  <div className="text-base text-gray-600">Years of Impact</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}