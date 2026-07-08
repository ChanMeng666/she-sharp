"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { MemberCard, MemberCardData } from "@/components/ui/member-card";
import { mentors } from "@/lib/data/mentors";

export function MentorsListSection() {
  const memberCards = mentors.map((mentor): MemberCardData => ({
    id: mentor.id,
    name: mentor.name,
    image: mentor.image,
    description: mentor.description,
    title: `${mentor.role} at ${mentor.company}`,
    linkedin: mentor.linkedIn,
  }));

  return (
    <Section id="mentors-list" bgColor="white" className="py-16 sm:py-20 lg:py-28">
      <Container size="full">
        <div className="space-y-12">
          <div className="max-w-2xl">
            <span className="text-label text-brand mb-4 block">Our mentors</span>
            <h2 className="text-display-sm text-foreground mb-4">
              Explore our mentors
            </h2>
            <p className="text-base md:text-lg text-ink-600">
              Connect with experienced professionals across various industries
              who are passionate about guiding the next generation of women in
              STEM.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {memberCards.map((member, index) => (
              <MemberCard
                key={member.id ?? `mentor-${index}`}
                member={member}
                index={index}
                background="bg-white"
                accentColor="bg-brand/10"
              />
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
