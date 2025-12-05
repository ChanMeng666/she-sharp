"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Quote } from "lucide-react";
import { usePathname } from "next/navigation";
import { testimonialsByPage } from "@/lib/data/testimonials";

interface PageTestimonialsSectionProps {
  title?: string;
  subtitle?: string;
  className?: string;
  pageKey?: keyof typeof testimonialsByPage;
}

export function PageTestimonialsSection({ 
  title = "What Our Community Says",
  subtitle,
  className,
  pageKey
}: PageTestimonialsSectionProps) {
  const pathname = usePathname();
  
  // Determine which testimonials to show
  let testimonials: any[] = [];
  
  if (pageKey && testimonialsByPage[pageKey]) {
    testimonials = testimonialsByPage[pageKey];
  } else {
    // Auto-detect based on pathname
    if (pathname === "/") {
      testimonials = testimonialsByPage.home;
    } else if (pathname.includes("/mentorship")) {
      testimonials = testimonialsByPage.mentorship;
    } else if (pathname.includes("/events")) {
      testimonials = testimonialsByPage.events;
    } else if (pathname.includes("/donate")) {
      testimonials = testimonialsByPage.donate;
    } else if (pathname.includes("/about")) {
      testimonials = testimonialsByPage.about;
    } else if (pathname.includes("/media") || pathname.includes("/resources")) {
      testimonials = testimonialsByPage.media;
    } else {
      // Default to home testimonials
      testimonials = testimonialsByPage.home;
    }
  }

  // Render different layouts based on testimonial type
  const isMentorshipTestimonial = testimonials[0]?.mentee !== undefined;
  const isEventTestimonial = testimonials[0]?.event !== undefined;
  const isDonateTestimonial = testimonials[0]?.type !== undefined;

  return (
    <Section bgColor="light" className={className}>
      <Container>
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {title}
          </h2>
          {subtitle && (
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        <div className="relative">
          <Carousel
            plugins={[
              Autoplay({
                delay: 5000,
              }),
            ]}
            className="w-full max-w-5xl mx-auto"
          >
            <CarouselContent>
              {testimonials.map((testimonial) => (
                <CarouselItem key={testimonial.id} className="md:basis-1/2 lg:basis-1/3">
                  <Card className="h-full">
                    <CardContent className="p-6">
                      <Quote className="w-8 h-8 text-muted mb-4" />
                      
                      {/* Quote */}
                      <p className="text-gray-700 mb-6 italic">
                        "{testimonial.quote}"
                      </p>

                      {/* Mentorship testimonial format */}
                      {isMentorshipTestimonial && testimonial.mentee && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={testimonial.mentee.image} />
                              <AvatarFallback>{testimonial.mentee.name[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-foreground">{testimonial.mentee.name}</p>
                              <p className="text-sm text-gray-600">{testimonial.mentee.role}</p>
                            </div>
                          </div>
                          {testimonial.mentor && (
                            <p className="text-sm text-gray-600">
                              Mentored by <span className="font-semibold">{testimonial.mentor.name}</span>
                            </p>
                          )}
                        </div>
                      )}

                      {/* Event testimonial format */}
                      {isEventTestimonial && testimonial.event && (
                        <>
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar>
                              <AvatarImage src={testimonial.image} />
                              <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-foreground">{testimonial.name}</p>
                              <p className="text-sm text-gray-600">{testimonial.role}</p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {testimonial.event}
                          </Badge>
                        </>
                      )}

                      {/* Donate testimonial format */}
                      {isDonateTestimonial && testimonial.type && (
                        <>
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar>
                              <AvatarImage src={testimonial.image} />
                              <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-foreground">{testimonial.name}</p>
                              <p className="text-sm text-gray-600">{testimonial.company}</p>
                            </div>
                          </div>
                          <Badge 
                            variant="outline" 
                            className="border-border text-foreground"
                          >
                            {testimonial.type}
                          </Badge>
                        </>
                      )}

                      {/* Standard testimonial format */}
                      {!isMentorshipTestimonial && !isEventTestimonial && !isDonateTestimonial && (
                        <>
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar>
                              <AvatarImage src={testimonial.image} />
                              <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-foreground">{testimonial.name}</p>
                              <p className="text-sm text-gray-600">
                                {testimonial.role} at {testimonial.company}
                              </p>
                            </div>
                          </div>
                          {testimonial.tags && (
                            <div className="flex flex-wrap gap-2">
                              {testimonial.tags.map((tag: string) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        </div>
      </Container>
    </Section>
  );
}