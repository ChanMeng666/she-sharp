import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { ApplicationCountdown } from "@/components/mentorship/application-countdown";
import { ArrowRight, Mail } from "lucide-react";
import Link from "next/link";
import { isMentorshipOpen } from "@/lib/config/mentorship";
import { MAILCHIMP_CONFIG } from "@/lib/data/newsletters";

type MentorshipRole = "mentor" | "mentee";

const ROLE_COPY: Record<
  MentorshipRole,
  { heading: string; open: string; closed: string; applyHref: string; applyLabel: string }
> = {
  mentor: {
    heading: "Interested in becoming a mentor?",
    open: "Join our community of mentors and help shape the next generation of women in STEM.",
    closed:
      "Applications for this year's programme have closed, but we're always growing our community of mentors. Subscribe to our newsletter to be the first to know when mentor applications reopen for the next cohort.",
    applyHref: "/mentorship/mentor/apply",
    applyLabel: "Apply to be a Mentor",
  },
  mentee: {
    heading: "Interested in becoming a mentee?",
    open: "Take the first step towards transforming your career with personalised mentorship from industry leaders.",
    closed:
      "Applications for this year's programme have closed, but our community keeps growing. Subscribe to our newsletter and you'll be the first to know when mentee applications reopen for the next cohort.",
    applyHref: "/mentorship/mentee/apply",
    applyLabel: "Apply to Become a Mentee",
  },
};

/**
 * Closing call-to-action on the mentor and mentee landing pages.
 *
 * Both pages render the same panel; only the heading, blurb, apply link and
 * section id differ. Outside the registration window the apply button becomes
 * a newsletter subscribe and a "closed" pill appears above the heading.
 */
export function BecomeCTASection({ role }: { role: MentorshipRole }) {
  const applicationsOpen = isMentorshipOpen();
  const copy = ROLE_COPY[role];

  return (
    <Section
      id={`become-${role}-cta`}
      bgColor="white"
      className="py-16 sm:py-20 lg:py-28"
    >
      <Container size="full">
        <div className="rounded-[32px] bg-[#eaf2ff] p-8 md:p-12 lg:p-16">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            <div className="flex flex-col gap-10">
              <div>
                {!applicationsOpen && (
                  <span className="inline-flex w-fit items-center rounded-full border border-border bg-white px-4 py-1.5 text-sm font-medium text-ink-600 mb-6">
                    Applications currently closed
                  </span>
                )}
                <h2 className="text-display-sm text-foreground mb-4">
                  {copy.heading}
                </h2>
                <p className="text-base md:text-lg text-ink-600 max-w-2xl">
                  {applicationsOpen ? copy.open : copy.closed}
                </p>
              </div>

              {applicationsOpen && <ApplicationCountdown variant="onLight" />}
            </div>

            <div className="flex flex-col items-start md:items-center gap-6">
              {applicationsOpen ? (
                <Button variant="brand" size="lg" asChild>
                  <Link
                    href={copy.applyHref}
                    className="inline-flex items-center gap-2"
                  >
                    {copy.applyLabel}
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <Button variant="brand" size="lg" asChild>
                  <a
                    href={MAILCHIMP_CONFIG.subscribeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2"
                  >
                    <Mail className="h-5 w-5" />
                    Subscribe for Updates
                  </a>
                </Button>
              )}

              <p className="text-base text-ink-600 text-center">
                Questions?{" "}
                <Link href="/contact" className="text-brand hover:underline font-medium">
                  Contact our support team
                </Link>
              </p>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
