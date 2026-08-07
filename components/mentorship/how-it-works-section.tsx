"use client";

import { useState } from "react";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Reveal } from "@/components/ui/reveal";
import { isMentorshipOpen } from "@/lib/config/mentorship";
import { MAILCHIMP_CONFIG } from "@/lib/data/newsletters";
import { Mail } from "lucide-react";

const TAB_VALUES = {
  mentee: "mentee",
  mentor: "mentor",
} as const;

interface Step {
  title: string;
  subtitle: string;
  description: string;
  items: string[];
}

const MENTEE_STEPS: Step[] = [
  {
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
    title: "Get paired",
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
    title: "Meet & grow",
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

const MENTOR_STEPS: Step[] = [
  {
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
    title: "Guide & support",
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
    title: "Celebrate impact",
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

/**
 * The three things applicants most often get wrong, stated before they apply
 * rather than in a rejection email.
 *
 * The first two come from real refusals: a seventeen-year-old had to be turned
 * away over guardian consent, and the programme runs in New Zealand. The third
 * is the programme's most persistent misunderstanding — mentees arrive
 * expecting their mentor to find them a job, and She Sharp has been clear for
 * years that it does not do job placement or referrals.
 */
const ELIGIBILITY = [
  {
    title: "You need to be in New Zealand",
    body: "The programme is run for people based in Aotearoa New Zealand. Mentors and mentees meet here, in person or online.",
  },
  {
    title: "Mentees must be 18 or over",
    body: "We are not set up to take applicants under 18, and cannot handle the guardian consent that would require.",
  },
  {
    title: "This is mentoring, not job placement",
    body: "Your mentor is here to share experience, sharpen your thinking and open your view of the industry. She Sharp does not place people into roles, pass CVs to employers or make referrals — for anyone.",
  },
];

function EligibilityPanel() {
  return (
    <Reveal className="mt-16 rounded-[16px] border border-border bg-white p-6 sm:p-8">
      <h3 className="text-xl md:text-2xl font-bold text-foreground">
        Before you apply
      </h3>
      <dl className="mt-6 grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-3">
        {ELIGIBILITY.map((rule) => (
          <div key={rule.title}>
            <dt className="text-base font-semibold text-foreground">
              {rule.title}
            </dt>
            <dd className="mt-2 text-sm leading-relaxed text-ink-600">
              {rule.body}
            </dd>
          </div>
        ))}
      </dl>
    </Reveal>
  );
}

function StepGrid({ steps }: { steps: Step[] }) {
  const cols =
    steps.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3";
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${cols} gap-x-8 gap-y-10 text-left`}>
      {steps.map((step, index) => (
        <Reveal
          key={step.title}
          delay={index * 80}
          className="flex flex-col border-t border-border pt-6"
        >
          <span className="text-label text-brand">
            Step {String(index + 1).padStart(2, "0")}
          </span>
          <h3 className="text-xl md:text-2xl font-bold text-foreground mt-3">
            {step.title}
          </h3>
          <p className="text-sm font-medium text-brand mt-1">{step.subtitle}</p>
          <p className="text-base text-ink-600 leading-relaxed mt-3">
            {step.description}
          </p>
          <ul className="mt-4 space-y-1.5">
            {step.items.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-sm text-ink-600"
              >
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand" />
                {item}
              </li>
            ))}
          </ul>
        </Reveal>
      ))}
    </div>
  );
}

export function HowItWorksSection() {
  const [activeRole, setActiveRole] = useState<
    (typeof TAB_VALUES)[keyof typeof TAB_VALUES]
  >(TAB_VALUES.mentee);
  const applicationsOpen = isMentorshipOpen();
  const isMentee = activeRole === TAB_VALUES.mentee;
  const ctaHref = isMentee ? "/mentorship/mentee" : "/mentorship/mentor";
  const ctaLabel = isMentee ? "Apply as Mentee" : "Apply as Mentor";

  return (
    <Section id="how-it-works" bgColor="accent" className="py-16 sm:py-20 lg:py-28">
      <Container size="full">
        <div className="max-w-2xl mb-12">
          <span className="text-label text-brand mb-4 block">The journey</span>
          <h2 className="text-display-sm text-foreground mb-4">
            How the programme works
          </h2>
          <p className="text-base md:text-lg text-ink-600">
            Your path to meaningful mentorship connections.
          </p>
        </div>

        <Tabs
          value={activeRole}
          onValueChange={(value) => {
            if (value === TAB_VALUES.mentee || value === TAB_VALUES.mentor) {
              setActiveRole(value);
            }
          }}
          className="w-full"
        >
          <TabsList className="h-auto rounded-[12px] border border-border bg-white p-1 mb-12">
            <TabsTrigger
              value={TAB_VALUES.mentee}
              className="rounded-[8px] px-6 py-2 text-sm data-[state=active]:bg-brand data-[state=active]:text-brand-foreground"
            >
              For mentees
            </TabsTrigger>
            <TabsTrigger
              value={TAB_VALUES.mentor}
              className="rounded-[8px] px-6 py-2 text-sm data-[state=active]:bg-foreground data-[state=active]:text-background"
            >
              For mentors
            </TabsTrigger>
          </TabsList>

          <TabsContent value={TAB_VALUES.mentee}>
            <StepGrid steps={MENTEE_STEPS} />
          </TabsContent>

          <TabsContent value={TAB_VALUES.mentor}>
            <StepGrid steps={MENTOR_STEPS} />
          </TabsContent>
        </Tabs>

        <EligibilityPanel />

        <div className="mt-16 flex flex-col items-start gap-4">
          {applicationsOpen ? (
            <Button
              variant={isMentee ? "brand" : "default"}
              size="lg"
              asChild
            >
              <Link href={ctaHref}>{ctaLabel}</Link>
            </Button>
          ) : (
            <>
              <p className="text-base text-ink-600 max-w-3xl">
                Applications for this year&apos;s Mentorship Programme are now
                closed. Subscribe to our newsletter to be the first to hear when
                applications reopen for the next cohort.
              </p>
              <Button variant="brand" size="lg" asChild>
                <a
                  href={MAILCHIMP_CONFIG.subscribeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Mail className="h-5 w-5" />
                  Subscribe for Updates
                </a>
              </Button>
            </>
          )}
        </div>
      </Container>
    </Section>
  );
}
