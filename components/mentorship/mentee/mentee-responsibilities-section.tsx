'use client';

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import {
  ResponsibilitiesAccordion,
  type ResponsibilityItem,
} from "@/components/mentorship/responsibilities-accordion";
import { curatedImages } from "@/public/img/curated";

const menteeFeatures: ResponsibilityItem[] = [
  {
    id: 1,
    title: "Communication",
    image: curatedImages["connection-ai-hackathon"].src,
    alt: curatedImages["connection-ai-hackathon"].alt,
    description:
      "Actively engage in the mentorship by communicating regularly with your mentor. Clearly share your goals, challenges, and needs, and provide regular updates on your progress so your mentor can best support you.",
  },
  {
    id: 2,
    title: "Goal Setting",
    image: curatedImages["detail-sketch-hands"].src,
    alt: curatedImages["detail-sketch-hands"].alt,
    description:
      "Team up with your mentor to pinpoint personal and professional goals. Proactively set and pursue identified objectives, tracking progress and adjusting goals as needed throughout your mentorship journey.",
  },
  {
    id: 3,
    title: "Learning & Growth",
    image: curatedImages["workshop-girls-night-build"].src,
    alt: curatedImages["workshop-girls-night-build"].alt,
    description:
      "Listen carefully to advice given by your mentor and accept constructive criticism with an open mind. Embrace opportunities to think critically and expand your knowledge in new directions.",
  },
  {
    id: 4,
    title: "Development",
    image: curatedImages["workshop-rpa-laughter"].src,
    alt: curatedImages["workshop-rpa-laughter"].alt,
    description:
      "Strive for continuous growth and improvement by taking initiative in your learning journey. Apply learned concepts to real-world situations and actively seek new challenges to accelerate your development.",
  },
];

export function MenteeResponsibilitiesSection() {
  return (
    <Section bgColor="accent" className="py-16 sm:py-20 lg:py-28">
      <Container size="full">
        <div className="mb-12 md:mb-16 max-w-2xl">
          <span className="text-label text-brand mb-4 block">
            Your responsibilities
          </span>
          <h2 className="text-display-sm text-foreground mb-4">
            What it means to be a <span className="text-brand">mentee</span>
          </h2>
          <p className="text-base md:text-lg text-ink-600 leading-relaxed">
            As a mentee, you&apos;ll embark on a transformative journey of
            professional and personal growth. Here&apos;s what we expect from you
            to ensure a successful mentoring experience.
          </p>
        </div>

        <ResponsibilitiesAccordion items={menteeFeatures} />
      </Container>
    </Section>
  );
}
