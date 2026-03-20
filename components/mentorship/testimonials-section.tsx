"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Quote,
  Calendar,
  GraduationCap,
  Award,
} from "lucide-react";
import { useState } from "react";
import { testimonialsByPage } from "@/lib/data/testimonials";

const testimonials = testimonialsByPage.mentorship;

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
  };

  const current = testimonials[currentIndex];

  return (
    <Section className="py-16 bg-background">
      <Container size="full">
        <div className="text-center mb-12">
          <h2 className="text-display-sm text-foreground mb-4">
            Hear From Our Community
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Real stories from mentees and mentors who've transformed their
            careers through our programme
          </p>
        </div>

        <div className="mx-auto max-w-5xl py-4 md:py-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* Left Arrow */}
            <Button
              onClick={prevTestimonial}
              variant="outline"
              size="icon"
              className="hidden md:flex h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full border border-brand hover:border-brand hover:bg-brand/20 hover:text-brand-foreground bg-background shadow-sm shrink-0 transition-all duration-300"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-brand" />
            </Button>

            <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300 card-lg p-4 sm:p-6 md:p-10 flex-1 ">
              <CardHeader className="pb-0">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  {/* Mentee Info */}
                  <div className="flex items-center w-full md:flex-1">
                    <div className="w-full">
                      <p className="text-lg text-brand font-black mb-2 flex items-center gap-2">
                        <GraduationCap className="w-5 h-5" />
                        Mentee
                      </p>
                      <h3 className="font-heading font-bold text-2xl text-foreground mb-2">
                        {current.mentee.name}
                      </h3>
                      <p className="text-base text-muted-foreground">
                        {current.mentee.role}
                      </p>
                      <p className="text-base text-muted-foreground">
                        {current.mentee.company}
                      </p>
                    </div>
                  </div>

                  {/* Journey Badge */}
                  <Badge
                    variant="outline"
                    className="border-border text-base p-2 w-full md:w-auto"
                  >
                    <Calendar className="w-5 h-5 mr-1" />
                    {current.mentee.journey}
                  </Badge>

                  {/* Mentor Info */}
                  <div className="flex items-center w-full md:flex-1 md:justify-end">
                    <div className="w-full text-left md:text-right">
                      <p className="text-lg text-brand font-black mb-2 flex items-center gap-2 justify-start md:justify-end">
                        <Award className="w-5 h-5" />
                        Mentor
                      </p>
                      <h3 className="font-heading font-bold text-2xl text-foreground mb-2">
                        {current.mentor.name}
                      </h3>
                      <p className="text-base text-muted-foreground">
                        {current.mentor.role}
                      </p>
                      <p className="text-base text-muted-foreground">
                        {current.mentor.company}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="px-6 py-4">
                <blockquote className="text-quote text-foreground mb-6 flex items-start gap-2 md:gap-8">
                  <Quote className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 text-brand/30 mt-1 shrink-0 rotate-180" />
                  <span className="flex-1">{current.fullStory}</span>
                  <Quote className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 text-brand/30 mt-1 shrink-0" />
                </blockquote>
                {current.author && (
                  <p className="text-right text-base font-semibold text-brand mr-12">
                    — {current.author}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Right Arrow */}
            <Button
              onClick={nextTestimonial}
              variant="outline"
              size="icon"
              className="hidden md:flex h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full border border-brand hover:border-brand hover:bg-brand/20 hover:text-brand-foreground bg-background shadow-sm shrink-0 transition-all duration-300"
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-brand" />
            </Button>
          </div>

          {/* Mobile Navigation Buttons */}
          <div className="flex md:hidden justify-center items-center gap-6 mt-4">
            <Button
              onClick={prevTestimonial}
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full border border-brand hover:border-brand hover:bg-brand/20 hover:text-brand-foreground bg-background shadow-sm transition-all duration-300"
            >
              <ChevronLeft className="h-5 w-5 text-brand" />
            </Button>
            <Button
              onClick={nextTestimonial}
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full border border-brand hover:border-brand hover:bg-brand/20 hover:text-brand-foreground bg-background shadow-sm transition-all duration-300"
            >
              <ChevronRight className="h-5 w-5 text-brand" />
            </Button>
          </div>

          {/* Navigation Indicators */}
          <div className="flex justify-center items-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 transition-all duration-300 rounded-full ${index === currentIndex
                  ? "w-8 bg-brand"
                  : "w-4 bg-border"
                  }`}
              />
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
