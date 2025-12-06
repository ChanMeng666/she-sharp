"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import TimeLine_01, { TimeLine_01Entry } from "@/components/ui/release-time-line";
import {
  Clock,
  Calendar,
  Handshake,
  Target,
  ClipboardCheck,
  Users,
  HeartHandshake,
  Award,
} from "lucide-react";

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
    button: {
      url: "/mentorship/become-a-mentor",
      text: "Apply as Mentor",
    },
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
      "Recognize achievements and help shape the next generation of women leaders in STEM. Continue making a lasting difference.",
    items: [
      "Celebrate mentee wins",
      "Provide final feedback",
      "Option to continue mentoring",
      "Join mentor alumni network",
    ],
  },
];

export function HowItWorksSection() {
  return (
    <Section className="py-16 md:py-24 bg-surface-periwinkle rounded-[50px]">
      <Container>
        {/* Header */}
        <div className="text-center mb-8">
          <Badge className="mb-4 bg-muted text-foreground border-border">
            <Clock className="w-3 h-3 mr-1" />
            Your Journey
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How the Program Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            A structured journey designed to create meaningful connections and
            drive real career impact
          </p>

          {/* Tabs */}
          <Tabs defaultValue="mentee" className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="h-12 p-1 bg-white/50 backdrop-blur-sm">
                <TabsTrigger
                  value="mentee"
                  className="px-6 py-2 text-base data-[state=active]:bg-brand data-[state=active]:text-brand-foreground"
                >
                  I&apos;m a Mentee
                </TabsTrigger>
                <TabsTrigger
                  value="mentor"
                  className="px-6 py-2 text-base data-[state=active]:bg-brand data-[state=active]:text-brand-foreground"
                >
                  I&apos;m a Mentor
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="mentee">
              <TimeLine_01
                title="Your Mentee Journey"
                description="From application to career growth – here's what your mentorship experience looks like"
                entries={MENTEE_STEPS}
                className="py-4"
              />
            </TabsContent>

            <TabsContent value="mentor">
              <TimeLine_01
                title="Your Mentor Journey"
                description="From application to impact – here's how you'll guide the next generation"
                entries={MENTOR_STEPS}
                className="py-4"
              />
            </TabsContent>
          </Tabs>
        </div>
      </Container>
    </Section>
  );
}
