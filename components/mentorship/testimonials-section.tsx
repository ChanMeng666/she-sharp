"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
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
    <Section bgColor="white" className="py-24 lg:py-28">
      <Container size="full">
        <div className="max-w-2xl mb-12">
          <span className="text-label text-brand mb-4 block">
            Community stories
          </span>
          <h2 className="text-display-sm text-foreground mb-4">
            Hear from our community
          </h2>
          <p className="text-base md:text-lg text-ink-600">
            Real stories from mentees and mentors who&apos;ve transformed their
            careers through our programme.
          </p>
        </div>

        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row md:items-stretch gap-4">
            <Button
              onClick={prevTestimonial}
              variant="outline"
              size="icon"
              className="hidden md:flex rounded-full shrink-0 self-center"
              aria-label="Previous story"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <article className="flex-1 rounded-[32px] border border-border bg-white p-6 sm:p-8 md:p-10">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="w-full md:flex-1">
                  <p className="text-label text-brand mb-2 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    Mentee
                  </p>
                  <h3 className="font-heading font-bold text-xl md:text-2xl text-foreground mb-1">
                    {current.mentee.name}
                  </h3>
                  <p className="text-base text-ink-600">{current.mentee.role}</p>
                  <p className="text-base text-ink-600">
                    {current.mentee.company}
                  </p>
                </div>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-ink-600 w-full md:w-auto">
                  <Calendar className="w-4 h-4 text-brand" />
                  {current.mentee.journey}
                </span>

                <div className="w-full md:flex-1 md:text-right">
                  <p className="text-label text-brand mb-2 flex items-center gap-2 justify-start md:justify-end">
                    <Award className="w-4 h-4" />
                    Mentor
                  </p>
                  <h3 className="font-heading font-bold text-xl md:text-2xl text-foreground mb-1">
                    {current.mentor.name}
                  </h3>
                  <p className="text-base text-ink-600">{current.mentor.role}</p>
                  <p className="text-base text-ink-600">
                    {current.mentor.company}
                  </p>
                </div>
              </div>

              <blockquote className="text-quote text-foreground mt-8 flex items-start gap-3 md:gap-6">
                <Quote className="w-8 h-8 md:w-10 md:h-10 text-brand shrink-0 rotate-180" />
                <span className="flex-1">{current.fullStory}</span>
                <Quote className="w-8 h-8 md:w-10 md:h-10 text-brand shrink-0 self-end" />
              </blockquote>
              {current.author && (
                <p className="text-right text-base font-semibold text-brand mt-4 mr-12">
                  — {current.author}
                </p>
              )}
            </article>

            <Button
              onClick={nextTestimonial}
              variant="outline"
              size="icon"
              className="hidden md:flex rounded-full shrink-0 self-center"
              aria-label="Next story"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex md:hidden justify-center items-center gap-6 mt-4">
            <Button
              onClick={prevTestimonial}
              variant="outline"
              size="icon"
              className="rounded-full"
              aria-label="Previous story"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              onClick={nextTestimonial}
              variant="outline"
              size="icon"
              className="rounded-full"
              aria-label="Next story"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex justify-center items-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Go to story ${index + 1}`}
                className={`h-1.5 transition-all duration-300 rounded-full ${
                  index === currentIndex ? "w-8 bg-brand" : "w-4 bg-ink-300"
                }`}
              />
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
