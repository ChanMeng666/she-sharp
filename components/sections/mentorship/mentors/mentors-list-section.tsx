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
  }));

  return (
    <Section id="mentors-list" className="py-16 bg-background">
      <Container size="full">
        <div className="space-y-12">
          <div className="text-center">
            <h2 className="text-display-sm text-foreground mb-4">
              Explore Our Mentors
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Connect with experienced professionals across various industries who are passionate about guiding the next generation of women in STEM.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {memberCards.map((member, index) => (
              <MemberCard
                key={member.id ?? `mentor-${index}`}
                member={member}
                index={index}
                background="bg-navy-light"
                accentColor="bg-info/10"
              />
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
