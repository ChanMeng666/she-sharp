"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Carousel, TestimonialCard, iTestimonial } from "@/components/ui/retro-testimonial";
import { mentors } from "@/lib/data/mentors";

export function MentorsListSection() {
  const testimonialData: iTestimonial[] = mentors.map((mentor) => ({
    name: mentor.name,
    designation: `${mentor.role} at ${mentor.company}`,
    description: mentor.description,
    profileImage: mentor.image,
  }));

  const cards = testimonialData.map((testimonial, index) => (
    <TestimonialCard
      key={`mentor-${index}`}
      testimonial={testimonial}
      index={index}
      backgroundImage="https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=2029&auto=format&fit=crop"
    />
  ));

  return (
    <Section id="mentors-list" className="py-16 bg-background">
      <Container>
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-display-sm text-foreground mb-4">
              Explore Our Mentors
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Connect with experienced professionals across various industries who are passionate about guiding the next generation of women in STEM.
            </p>
          </div>

          <Carousel items={cards} />
        </div>
      </Container>
    </Section>
  );
}
