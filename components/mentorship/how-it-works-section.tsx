"use client";

import { useState } from "react";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import TimeLine_01, { TimeLine_01Entry } from "@/components/ui/release-time-line";
import {
  Calendar,
  Handshake,
  Target,
  ClipboardCheck,
  Users,
  HeartHandshake,
  Award,
} from "lucide-react";

const TAB_VALUES = {
  mentee: "mentee",
  mentor: "mentor",
} as const;

const MENTEE_STEPS: TimeLine_01Entry[] = [
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
      "Personalised introductions",
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

const MENTOR_STEPS: TimeLine_01Entry[] = [
  {
    icon: ClipboardCheck,
    title: "Apply",
    subtitle: "10 minutes",
    description:
      "Submit your application and share your expertise. Tell us about your background, skills, and what you can offer to mentees.",
    items: [
      "Complete mentor application",
      "Define your expertise areas",
      "Set availability preferences",
      "Share your mentoring style",
    ],
  },
  {
    icon: Users,
    title: "Onboarding",
    subtitle: "1 week",
    description:
      "Complete orientation and get matched with a mentee. Access our mentor training resources and connect with the mentor community.",
    items: [
      "Attend mentor orientation",
      "Access training resources",
      "Get matched with mentee",
      "Set initial meeting goals",
    ],
  },
  {
    icon: HeartHandshake,
    title: "Guide & Support",
    subtitle: "3 months",
    description:
      "Regular check-ins with your mentee. Provide skill development support and continuous guidance throughout their journey.",
    items: [
      "Bi-weekly check-ins",
      "Career advice sessions",
      "Skill development support",
      "Progress reviews",
    ],
  },
  {
    icon: Award,
    title: "Celebrate Impact",
    subtitle: "Ongoing",
    description:
      "Recognise achievements and help shape the next generation of women leaders in STEM. Continue making a lasting difference.",
    items: [
      "Celebrate mentee wins",
      "Provide final feedback",
      "Option to continue mentoring",
      "Join mentor alumni network",
    ],
  },
];

export function HowItWorksSection() {
  const [activeRole, setActiveRole] = useState<(typeof TAB_VALUES)[keyof typeof TAB_VALUES]>(
    TAB_VALUES.mentee,
  );

  const isMentee = activeRole === TAB_VALUES.mentee;
  const ctaHref = isMentee ? "/mentorship/join" : "/mentorship/become-a-mentor";
  const ctaLabel = isMentee ? "Apply as Mentee" : "Apply as Mentor";

  return (
    <Section className="py-16 xl:py-24 2xl:py-32 bg-navy-light">
      <Container size="full">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-display-sm text-foreground mb-4">
            How the Programme Works
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
            Your path to meaningful mentorship connections
          </p>

          {/* Tabs */}
          <Tabs
            value={activeRole}
            onValueChange={(value) => {
              if (value === TAB_VALUES.mentee || value === TAB_VALUES.mentor) {
                setActiveRole(value);
              }
            }}
            className="w-full"
          >
            <div className="flex justify-center">
              <TabsList className="h-14 p-1.5 glass-pill">
                <TabsTrigger
                  value={TAB_VALUES.mentee}
                  className="px-8 py-2.5 text-base rounded-full data-[state=active]:bg-brand data-[state=active]:text-brand-foreground"
                >
                  Become a Mentee
                </TabsTrigger>
                <TabsTrigger
                  value={TAB_VALUES.mentor}
                  className="px-8 py-2.5 text-base rounded-full data-[state=active]:bg-navy data-[state=active]:text-navy-foreground"
                >
                  Become a Mentor
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={TAB_VALUES.mentee}>
              <TimeLine_01
                entries={MENTEE_STEPS}
                className="py-4"
                colorTheme="brand"
              />
            </TabsContent>

            <TabsContent value={TAB_VALUES.mentor}>
              <TimeLine_01
                entries={MENTOR_STEPS}
                className="py-4"
                colorTheme="navy"
              />
            </TabsContent>
          </Tabs>

          <div className="mt-16 flex justify-center">
            <Button
              variant={isMentee ? "brand" : "secondary"}
              size="lg"
              className="h-14 px-10 text-lg transition-all duration-150"
              asChild
            >
              <a href={ctaHref}>{ctaLabel}</a>
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}
