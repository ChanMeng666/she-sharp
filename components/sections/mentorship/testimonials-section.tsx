"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Quote, Calendar } from "lucide-react";
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
    <Section className="py-16 md:py-24 bg-background">
      <Container size="full">
        <div className="text-center mb-12">
          <h2 className="text-display-sm text-foreground mb-4">
            Hear From Our Community
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real stories from mentees and mentors who've transformed their
            careers through our program
          </p>
        </div>

        <div className="mx-auto max-w-5xl">
          <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300 rounded-[50px] p-10 pt-16">
            <CardHeader className="pb-0">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Mentee Info */}
                <div className="flex items-center gap-4 flex-1">
                  <Avatar className="h-24 w-24 border-2 border-border">
                    <AvatarImage
                      src={current.mentee.image}
                      alt={current.mentee.name}
                    />
                    <AvatarFallback>
                      {current.mentee.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-lg text-brand font-black mb-2">Mentee</p>
                    <h3 className="font-brand-script text-2xl text-foreground mb-2">
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
                  className="border-border text-base p-2"
                >
                  <Calendar className="w-5 h-5 mr-1" />
                  {current.mentee.journey}
                </Badge>

                {/* Mentor Info */}
                <div className="flex items-center gap-4 flex-1 md:justify-end">
                  <div className="text-right">
                    <p className="text-lg text-brand font-black mb-2">Mentor</p>
                    <h3 className="font-brand-script text-2xl text-foreground mb-2">
                      {current.mentor.name}
                    </h3>
                    <p className="text-base text-muted-foreground">
                      {current.mentor.role}
                    </p>
                    <p className="text-base text-muted-foreground">
                      {current.mentor.company}
                    </p>
                  </div>
                  <Avatar className="h-24 w-24 border-2 border-border">
                    <AvatarImage
                      src={current.mentor.image}
                      alt={current.mentor.name}
                    />
                    <AvatarFallback>
                      {current.mentor.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </CardHeader>

            <CardContent className="px-6 py-4">
              <Quote className="w-12 h-12 text-brand/30 mb-4" />
              <blockquote className="text-quote text-foreground mb-6">
                {current.quote}
              </blockquote>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-center items-center gap-4 mt-8">
            <Button
              onClick={prevTestimonial}
              variant="outline"
              size="icon"
              className="rounded-full border-border hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 transition-all duration-300 rounded-full ${
                    index === currentIndex
                      ? "w-8 bg-brand"
                      : "w-2 bg-muted hover:bg-muted/80"
                  }`}
                />
              ))}
            </div>

            <Button
              onClick={nextTestimonial}
              variant="outline"
              size="icon"
              className="rounded-full border-border hover:bg-muted"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}
