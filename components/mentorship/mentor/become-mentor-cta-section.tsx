import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { ApplicationCountdown } from "@/components/mentorship/application-countdown";
import { ArrowRight, Mail } from "lucide-react";
import Link from "next/link";
import { isMentorshipOpen } from "@/lib/config/mentorship";
import { MAILCHIMP_CONFIG } from "@/lib/data/newsletters";

export function BecomeMentorCTASection() {
  const applicationsOpen = isMentorshipOpen();

  return (
    <Section id="become-mentor-cta" bgColor="white" className="py-24 lg:py-28">
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
                  Interested in becoming a mentor?
                </h2>
                <p className="text-base md:text-lg text-ink-600 max-w-2xl">
                  {applicationsOpen
                    ? "Join our community of mentors and help shape the next generation of women in STEM."
                    : "Applications for this year's programme have closed, but we're always growing our community of mentors. Subscribe to our newsletter to be the first to know when mentor applications reopen for the next cohort."}
                </p>
              </div>

              {applicationsOpen && <ApplicationCountdown variant="onLight" />}
            </div>

            <div className="flex flex-col items-start md:items-center gap-6">
              {applicationsOpen ? (
                <Button variant="brand" size="lg" asChild>
                  <Link
                    href="/mentorship/mentor/apply"
                    className="inline-flex items-center gap-2"
                  >
                    Apply to be a Mentor
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
