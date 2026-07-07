'use client';

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import {
  ResponsibilitiesAccordion,
  type ResponsibilityItem,
} from "@/components/mentorship/responsibilities-accordion";
import { curatedImages } from "@/public/img/curated";

const mentorFeatures: ResponsibilityItem[] = [
  {
    id: 1,
    title: "Commitment",
    image: curatedImages["mentoring-huddle"].src,
    alt: curatedImages["mentoring-huddle"].alt,
    description:
      "Stay dedicated to mentoring by initiating regular contact with your mentee, committing 2-4 hours per month to the relationship. Follow through on the plans and actions you've mutually agreed upon, ensuring consistency and reliability throughout the mentorship journey.",
  },
  {
    id: 2,
    title: "Guidance",
    image: curatedImages["workshop-design-thinking"].src,
    alt: curatedImages["workshop-design-thinking"].alt,
    description:
      "Help your mentee figure out and set meaningful goals, encouraging them to nurture their independent thinking skills. Foster their growth by providing direction and support, and celebrate their achievements along the way.",
  },
  {
    id: 3,
    title: "Communication",
    image: curatedImages["connection-smiles"].src,
    alt: curatedImages["connection-smiles"].alt,
    description:
      "Listen to what your mentee needs rather than just pushing your own thoughts. Create a safe space for open dialogue and don't hesitate to give constructive feedback that helps them grow both personally and professionally.",
  },
];

export function MentorResponsibilitiesSection() {
  return (
    <Section bgColor="accent" className="py-24 lg:py-28">
      <Container size="full">
        <div className="mb-12 md:mb-16 max-w-2xl">
          <span className="text-label text-brand mb-4 block">
            Your responsibilities
          </span>
          <h2 className="text-display-sm text-foreground mb-4">
            What it means to be a <span className="text-brand">mentor</span>
          </h2>
          <p className="text-base md:text-lg text-ink-600 leading-relaxed">
            As a mentor, you play a crucial role in shaping the future of women
            in STEM. Here&apos;s what we expect from our mentors.
          </p>
        </div>

        <ResponsibilitiesAccordion items={mentorFeatures} />
      </Container>
    </Section>
  );
}
