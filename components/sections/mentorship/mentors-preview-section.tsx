"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Users } from "lucide-react";
import Link from "next/link";
import {
  CompactTestimonialGrid,
  iTestimonialCompact,
} from "@/components/ui/retro-testimonial-compact";

const featuredMentors: iTestimonialCompact[] = [
  {
    name: "Aishvarya Saraf",
    designation: "Human Resources Manager (Advisory) at Fiserv",
    profileImage:
      "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65f0b7c3161799543612526c_Aishvarya%20Photo.jpg",
    href: "/mentorship/mentors",
  },
  {
    name: "Alana Hoponoa",
    designation: "Cloud Services, Sales and FinOps Consultant at OSS Group Ltd",
    profileImage:
      "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66e4f54c5fb03ae45239d90e_Alana%20Photo.jpg",
    href: "/mentorship/mentors",
  },
  {
    name: "Anshu Maharaj",
    designation: "Product Manager at MYOB",
    profileImage:
      "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65f7d581ab77ff98f436f102_Anshu%20Photo.jpg",
    href: "/mentorship/mentors",
  },
];

export function MentorsPreviewSection() {
  return (
    <Section className="py-16 md:py-24 bg-background">
      <Container>
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-muted text-foreground border-border">
            <Users className="w-3 h-3 mr-1" />
            Expert Mentors
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Meet Some of Our Mentors
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Industry leaders committed to guiding the next generation of women
            in tech
          </p>
        </div>

        <div className="max-w-4xl mx-auto mb-12">
          <CompactTestimonialGrid
            items={featuredMentors}
            columns={3}
            backgroundImage="https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=2029&auto=format&fit=crop"
          />
        </div>

        <div className="text-center space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg">
              <Link href="/mentorship/mentors">
                View All Mentors
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Can't find the right mentor? We'll help match you with the perfect
            guide for your journey.
          </p>
        </div>
      </Container>
    </Section>
  );
}
