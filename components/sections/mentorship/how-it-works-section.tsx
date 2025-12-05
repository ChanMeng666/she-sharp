"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";
import TimeLine_01, { TimeLine_01Entry } from "@/components/ui/release-time-line";
import { Clock, Calendar, Handshake, Target } from "lucide-react";

const PROCESS_STEPS: TimeLine_01Entry[] = [
  {
    icon: Calendar,
    title: "Apply",
    subtitle: "5 minutes",
    description:
      "Tell us your goals and preferences. Complete a brief online form sharing your background and what you hope to achieve through mentorship.",
    items: [
      "Brief online application form",
      "Share your professional background",
      "Define your mentorship goals",
      "Select your preferred industry focus",
    ],
    button: {
      url: "/mentorship/join",
      text: "Start Application",
    },
  },
  {
    icon: Handshake,
    title: "Get Paired",
    subtitle: "~1 week",
    description:
      "We match you based on goals and industry. Our team carefully reviews your profile to find the perfect mentor who aligns with your career aspirations.",
    items: [
      "Goal alignment matching",
      "Industry & expertise pairing",
      "Personalized introductions",
      "Compatibility assessment",
    ],
  },
  {
    icon: Target,
    title: "Meet & Grow",
    subtitle: "3 months",
    description:
      "Regular catchups focused on outcomes. Connect with your mentor for at least 3 meetings, either virtually or in-person, with ongoing progress support.",
    items: [
      "Minimum 3 structured meetings",
      "Virtual or in-person options",
      "Ongoing progress tracking",
      "Community support access",
    ],
  },
];

export function HowItWorksSection() {
  return (
    <Section className="py-16 md:py-24 bg-surface-periwinkle rounded-[50px]">
      {/* Header */}
      <Container>
        <div className="text-center mb-8">
          <Badge className="mb-4 bg-muted text-foreground border-border">
            <Clock className="w-3 h-3 mr-1" />
            3-Month Program
          </Badge>
        </div>
      </Container>

      {/* Timeline */}
      <TimeLine_01
        title="How the Program Works"
        description="A structured journey designed to create meaningful connections and drive real career impact"
        entries={PROCESS_STEPS}
        className="py-8"
      />

    </Section>
  );
}
