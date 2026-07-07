"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/layout/section";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/ui/reveal";

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
    <article className="flex h-full flex-col rounded-[32px] border border-border bg-white p-6 md:p-8">
      <span
        aria-hidden
        className="mb-4 block font-brand-script text-5xl leading-none text-brand"
      >
        &ldquo;
      </span>
      <p className="flex-1 text-base leading-relaxed text-foreground">
        {testimonial.content}
      </p>
      <div className="mt-6 border-t border-border pt-4">
        <p className="font-semibold text-foreground">{testimonial.name}</p>
        <p className="text-sm text-ink-600">{testimonial.role}</p>
      </div>
    </article>
  );
}

function PagerButton({
  direction,
  onClick,
  disabled,
}: {
  direction: "prev" | "next";
  onClick: () => void;
  disabled: boolean;
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "prev" ? "Previous" : "Next"}
      className="h-10 w-10 rounded-full"
    >
      <Icon className="h-5 w-5" />
    </Button>
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

  return (
    <Section bgColor="white">
      <Container size="full">
        <Reveal>
          <div className="mb-12 flex items-end justify-between gap-6 md:mb-16">
            <div>
              <span className="text-label mb-3 block text-brand">(05)</span>
              <h2 className="text-display-sm text-foreground">
                Community voices
              </h2>
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <PagerButton
                direction="prev"
                onClick={() => setPageIndex((p) => p - 1)}
                disabled={pageIndex <= 0}
              />
              <PagerButton
                direction="next"
                onClick={() => setPageIndex((p) => p + 1)}
                disabled={pageIndex >= totalPages - 1}
              />
            </div>
          </div>
        </Reveal>

        {/* Desktop: 3-card pages */}
        <div className="hidden gap-6 md:grid md:grid-cols-3">
          {visibleTestimonials.map((testimonial, i) => (
            <Reveal key={`${pageIndex}-${i}`} variant="fade-up" delay={i * 100}>
              <TestimonialCard testimonial={testimonial} />
            </Reveal>
          ))}
        </div>

        {/* Mobile: single card with arrows */}
        <div className="md:hidden">
          <TestimonialCard testimonial={TESTIMONIALS[mobileIndex]} />
          <div className="mt-6 flex items-center justify-center gap-4">
            <PagerButton
              direction="prev"
              onClick={() => setMobileIndex((p) => p - 1)}
              disabled={mobileIndex <= 0}
            />
            <PagerButton
              direction="next"
              onClick={() => setMobileIndex((p) => p + 1)}
              disabled={mobileIndex >= TESTIMONIALS.length - 1}
            />
          </div>
        </div>
      </Container>
    </Section>
  );
}
