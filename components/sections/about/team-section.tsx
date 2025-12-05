"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Carousel, TestimonialCard, iTestimonial } from "@/components/ui/retro-testimonial";
import { teamMembers } from "@/lib/data/team";

export function TeamSection() {
  const testimonialData: iTestimonial[] = teamMembers.map((member) => ({
    name: member.name,
    designation: member.roles.join(", "),
    description: member.description,
    profileImage: member.image,
  }));

  const cards = testimonialData.map((testimonial, index) => (
    <TestimonialCard
      key={`team-${index}`}
      testimonial={testimonial}
      index={index}
      backgroundImage="https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=2029&auto=format&fit=crop"
    />
  ));

  return (
    <Section className="pt-0 rounded-b-[50px]">
      <Container size="wide">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
            Meet Our People
          </h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg max-w-2xl mx-auto px-4 sm:px-0">
            The passionate team of leaders, innovators, and advocates driving
            change in the tech industry
          </p>
        </div>

        <Carousel items={cards} />
      </Container>
    </Section>
  );
}
