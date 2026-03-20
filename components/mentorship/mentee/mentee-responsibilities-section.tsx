'use client';

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { AccordionFeatureSection } from "@/components/ui/accordion-feature-section";
import type { FeatureItem } from "@/components/ui/accordion-feature-section";

const menteeFeatures: FeatureItem[] = [
  {
    id: 1,
    title: "Communication",
    image: "/img/scraped/site/mentorship/66e7d7462e0faf4e732c4cf1_IMG_9889_416482b4.jpg",
    description:
      "Actively engage in the mentorship by communicating regularly with your mentor. Clearly share your goals, challenges, and needs, and provide regular updates on your progress so your mentor can best support you.",
  },
  {
    id: 2,
    title: "Goal Setting",
    image: "https://placehold.co/800x600/e8d5f5/9b2e83?text=Goal+Setting",
    description:
      "Team up with your mentor to pinpoint personal and professional goals. Proactively set and pursue identified objectives, tracking progress and adjusting goals as needed throughout your mentorship journey.",
  },
  {
    id: 3,
    title: "Learning & Growth",
    image: "https://placehold.co/800x600/d5e8f5/2e5a83?text=Learning+%26+Growth",
    description:
      "Listen carefully to advice given by your mentor and accept constructive criticism with an open mind. Embrace opportunities to think critically and expand your knowledge in new directions.",
  },
  {
    id: 4,
    title: "Development",
    image: "https://placehold.co/800x600/d5f5e8/2e8353?text=Development",
    description:
      "Strive for continuous growth and improvement by taking initiative in your learning journey. Apply learned concepts to real-world situations and actively seek new challenges to accelerate your development.",
  },
];

export function MenteeResponsibilitiesSection() {
  return (
    <Section className="py-16 bg-white">
      <Container size="full">
        <div className="max-w-8xl mx-auto">
          <div className="mb-8 sm:mb-10 md:mb-12">
            <h2 className="text-display-sm text-foreground mb-4">
              What it means to be a <span className="text-brand">mentee</span>
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed max-w-3xl">
              As a mentee, you&apos;ll embark on a transformative journey of professional and personal growth.
              Here&apos;s what we expect from you to ensure a successful mentoring experience:
            </p>
          </div>

          <AccordionFeatureSection features={menteeFeatures} />
        </div>
      </Container>
    </Section>
  );
}
