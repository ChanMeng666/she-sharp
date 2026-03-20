'use client';

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { AccordionFeatureSection } from "@/components/ui/accordion-feature-section";
import type { FeatureItem } from "@/components/ui/accordion-feature-section";

const mentorFeatures: FeatureItem[] = [
  {
    id: 1,
    title: "Commitment",
    image: "/img/scraped/site/mentorship/66e7d6d1507e385502912e7f_IMG_9898_a19afc43.jpg",
    description:
      "Stay dedicated to mentoring by initiating regular contact with your mentee, committing 2-4 hours per month to the relationship. Follow through on the plans and actions you've mutually agreed upon, ensuring consistency and reliability throughout the mentorship journey.",
  },
  {
    id: 2,
    title: "Guidance",
    image: "/img/scraped/site/mentorship/66e7d7462e0faf4e732c4cf1_IMG_9889_416482b4.jpg",
    description:
      "Help your mentee figure out and set meaningful goals, encouraging them to nurture their independent thinking skills. Foster their growth by providing direction and support, and celebrate their achievements along the way.",
  },
  {
    id: 3,
    title: "Communication",
    image: "/img/scraped/site/mentorship/mentor-communication.jpg",
    description:
      "Listen to what your mentee needs rather than just pushing your own thoughts. Create a safe space for open dialogue and don't hesitate to give constructive feedback that helps them grow both personally and professionally.",
  },
];

export function MentorResponsibilitiesSection() {
  return (
    <Section className="py-16 bg-white">
      <Container size="full">
        <div className="max-w-8xl mx-auto">
          <div className="mb-8 sm:mb-10 md:mb-12">
            <h2 className="text-display-sm text-foreground mb-4">
              What it means to be a <span className="text-brand">mentor</span>
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed max-w-3xl">
              As a mentor, you play a crucial role in shaping the future of women in STEM.
              Here&apos;s what we expect from our mentors:
            </p>
          </div>

          <AccordionFeatureSection features={mentorFeatures} />
        </div>
      </Container>
    </Section>
  );
}
