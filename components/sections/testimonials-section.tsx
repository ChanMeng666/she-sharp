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
import { testimonialsByPage } from "@/lib/data/testimonials";
import Iridescence, { brandColors } from "@/components/effects/iridescence";

export function TestimonialsSection() {
  const testimonials = testimonialsByPage.home;
  
  return (
    <Section className="relative bg-white py-16 md:py-20 overflow-hidden">
      {/* Iridescence 动态背景 */}
      <div className="absolute inset-0 opacity-20">
        <Iridescence
          color={brandColors.testimonialsBlush}
          mouseReact={false}
          amplitude={0.06}
          speed={0.6}
          className="w-full h-full"
        />
      </div>
      
      {/* 向上过渡渐变 - 与上一个板块的温和连接 */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-t from-transparent via-white/35 to-white" />
      
      {/* 向下过渡渐变 - 为下一个板块准备 */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-b from-transparent via-white/25 to-white" />
      
      <Container size="full" className="relative z-10">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-navy-dark mb-4">
            Stories from Our Community
          </h2>
          <p className="text-base sm:text-lg text-gray max-w-2xl mx-auto px-4">
            Hear from the amazing women who have found support, growth, and success through She Sharp
          </p>
        </div>

        <div className="relative overflow-hidden">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[
              Autoplay({
                delay: 5000,
              }),
            ]}
            className="w-full max-w-full mx-auto"
          >
            <CarouselContent className="-ml-4">
              {testimonials.map((testimonial) => (
                <CarouselItem key={testimonial.id} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                  <Card className="h-full border-2 hover:border-purple-light transition-colors">
                    <CardContent className="p-6 flex flex-col h-full">
                      {/* Quote Icon */}
                      <Quote className="w-8 h-8 text-purple-light mb-4" />
                      
                      {/* Testimonial Text */}
                      <blockquote className="text-gray italic mb-6 flex-grow">
                        "{testimonial.quote}"
                      </blockquote>

                      {/* Author Info */}
                      <div className="flex items-center gap-3 mb-4">
                        <Avatar>
                          <AvatarImage src={testimonial.image} alt={testimonial.name} />
                          <AvatarFallback className="bg-purple-light text-purple-dark">
                            {testimonial.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-navy-dark">{testimonial.name}</div>
                          <div className="text-sm text-gray">
                            {testimonial.role} at {testimonial.company}
                          </div>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2">
                        {testimonial.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-4 h-10 w-10 bg-white/80 backdrop-blur-sm hover:bg-white/90" />
            <CarouselNext className="right-4 h-10 w-10 bg-white/80 backdrop-blur-sm hover:bg-white/90" />
          </Carousel>
        </div>

        {/* Statistics */}
        <div className="mt-12 sm:mt-16 bg-purple-light/10 rounded-lg p-6 sm:p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-purple-dark">92%</div>
              <div className="text-xs sm:text-sm text-gray mt-1">Found career opportunities</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-purple-dark">87%</div>
              <div className="text-xs sm:text-sm text-gray mt-1">Expanded their network</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-purple-dark">95%</div>
              <div className="text-xs sm:text-sm text-gray mt-1">Recommend She Sharp</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-purple-dark">78%</div>
              <div className="text-xs sm:text-sm text-gray mt-1">Got promoted within 2 years</div>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}