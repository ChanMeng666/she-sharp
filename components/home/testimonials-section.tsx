"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/layout/section";
import { Container } from "@/components/layout/container";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

type Testimonial = {
  name: string;
  role: string;
  content: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Fay Fialho",
    role: "Mentee",
    content:
      "From the first meeting with Meeta, she was inspiring, both personally and professionally. Her humble yet professional attitude made me comfortable with a feeling of being heard. Her insights and experience of the job market, industries and people, provided me with clarity and direction.",
  },
  {
    name: "Shweta Sharma",
    role: "Mentee",
    content:
      "This initiative has truly been a taonga (treasure) for both mentors and mentees, offering invaluable opportunities for growth, guidance, and connection. A shoutout to my incredible She Sharp mentor, Anshu Maharaj, whose support has been instrumental in my journey.",
  },
  {
    name: "Shein Delos Angeles",
    role: "Event Volunteer",
    content:
      "I volunteered to help with the She Sharp Tomorrow Expo and I enjoyed every step of the way. I wanted to commend this organisation for giving me an opportunity to meet people around tech and to know some people that are now my friends.",
  },
  {
    name: "Vic Arce",
    role: "Previous Ambassador",
    content:
      "Working with She# has been such a remarkable experience. I feel lucky to have had the opportunity to be surrounded by highly motivated people who want to make a difference for women. A friend described the She# team as people who eat passion for breakfast.",
  },
  {
    name: "Aneela Lala",
    role: "Previous Ambassador",
    content:
      "As an Ambassador for She Sharp, I have had the privilege of collaborating with fabulous like-minded Wahine, connecting with amazing people from diverse STEM fields and sharing my passion for STEM and inclusivity with so many talented, successful and inspiring Women in Industry.",
  },
  {
    name: "Yinghui (Maxie) Ouyang",
    role: "Event Volunteer",
    content:
      "Being a volunteer at She Sharp has been an enlightening and fulfilling experience. The She Sharp team really take care of you and make sure you get access to the benefits as if you are a participant of each event.",
  },
];

const VISIBLE_COUNT_DESKTOP = 3;

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <article className="flex flex-col h-full card-md card-glass card-interactive">
      <div className="p-6 flex flex-col h-full">
        <Quote className="w-8 h-8 text-brand/30 rotate-180 mb-4 shrink-0" />
        <p className="text-base text-foreground leading-relaxed flex-1">
          {testimonial.content}
        </p>
        <div className="border-t border-border/30 pt-4 mt-6">
          <p className="font-semibold text-foreground">{testimonial.name}</p>
          <p className="text-sm text-muted-foreground">{testimonial.role}</p>
        </div>
      </div>
    </article>
  );
}

export function HomeTestimonialsSection() {
  const [pageIndex, setPageIndex] = useState(0);
  const [mobileIndex, setMobileIndex] = useState(0);

  const totalPages = Math.ceil(TESTIMONIALS.length / VISIBLE_COUNT_DESKTOP);

  const visibleTestimonials = TESTIMONIALS.slice(
    pageIndex * VISIBLE_COUNT_DESKTOP,
    pageIndex * VISIBLE_COUNT_DESKTOP + VISIBLE_COUNT_DESKTOP
  );

  const isDesktopAtStart = pageIndex <= 0;
  const isDesktopAtEnd = pageIndex >= totalPages - 1;
  const isMobileAtStart = mobileIndex <= 0;
  const isMobileAtEnd = mobileIndex >= TESTIMONIALS.length - 1;

  return (
    <Section className="bg-white py-16 xl:py-24 2xl:py-32">
      <Container size="full">
        <AnimateOnScroll variant="fade-up">
          <div className="flex items-center justify-between mb-12 md:mb-16">
            <h2 className="text-display-sm text-foreground">
              What People Say About She Sharp
            </h2>
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPageIndex((p) => p - 1)}
                disabled={isDesktopAtStart}
                className="h-10 w-10 rounded-full border border-brand hover:border-brand hover:bg-brand/20 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5 text-brand" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPageIndex((p) => p + 1)}
                disabled={isDesktopAtEnd}
                className="h-10 w-10 rounded-full border border-brand hover:border-brand hover:bg-brand/20 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-5 w-5 text-brand" />
              </Button>
            </div>
          </div>
        </AnimateOnScroll>

        {/* Desktop: 3-card pages */}
        <div className="hidden md:grid md:grid-cols-3 gap-6">
          {visibleTestimonials.map((testimonial, i) => (
            <AnimateOnScroll key={`${pageIndex}-${i}`} variant="fade-up" delay={i * 100}>
              <TestimonialCard testimonial={testimonial} />
            </AnimateOnScroll>
          ))}
        </div>

        {/* Mobile: single card with arrows */}
        <div className="md:hidden">
          <TestimonialCard testimonial={TESTIMONIALS[mobileIndex]} />
          <div className="flex items-center justify-center gap-4 mt-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setMobileIndex((p) => p - 1)}
              disabled={isMobileAtStart}
              className="h-10 w-10 rounded-full border border-brand hover:border-brand hover:bg-brand/20 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5 text-brand" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setMobileIndex((p) => p + 1)}
              disabled={isMobileAtEnd}
              className="h-10 w-10 rounded-full border border-brand hover:border-brand hover:bg-brand/20 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-5 w-5 text-brand" />
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}
