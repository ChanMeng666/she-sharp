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
    <Section id="become-mentor-cta" className="bg-periwinkle-soft relative overflow-hidden" noPadding>
      <div className="pt-16 md:pt-20 pb-24 lg:pb-28">
        <Container size="full">
          <div className="max-w-8xl mx-auto">
            <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
              <div className="flex flex-col gap-12">
                <div>
                  {!applicationsOpen && (
                    <span className="inline-flex w-fit items-center rounded-full bg-periwinkle-dark/10 px-4 py-1.5 text-sm font-semibold text-periwinkle-dark ring-1 ring-periwinkle-dark/20 mb-6">
                      Applications currently closed
                    </span>
                  )}
                  <h2 className="text-display-sm mb-4 text-left">
                    Interested in Becoming A Mentor?
                  </h2>
                  <p className="text-base md:text-lg text-muted-foreground/80 max-w-2xl text-left">
                    {applicationsOpen
                      ? "Join our community of mentors and help shape the next generation of women in STEM"
                      : "Applications for this year's programme have closed, but we're always growing our community of mentors. Subscribe to our newsletter to be the first to know when mentor applications reopen for the next cohort."}
                  </p>
                </div>

                {applicationsOpen && <ApplicationCountdown variant="onLight" />}
              </div>

              <div className="flex flex-col items-center gap-6">
                {applicationsOpen ? (
                  <Button
                    asChild
                    size="lg"
                    className="bg-white border-none text-periwinkle-dark hover:bg-white/90 text-lg font-bold px-12 py-4 h-auto shadow-lg shadow-black/20 group transition-all duration-300 hover:text-foreground hover:shadow-md hover:shadow-black/30 hover:scale-[1.02]"
                  >
                    <Link href="/mentorship/mentor/apply" className="inline-flex items-center gap-3">
                      Apply to be a Mentor
                      <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  </Button>
                ) : (
                  <Button
                    asChild
                    size="lg"
                    className="bg-white border-none text-periwinkle-dark hover:bg-white/90 text-lg font-bold px-12 py-4 h-auto shadow-lg shadow-black/20 group transition-all duration-300 hover:text-foreground hover:shadow-md hover:shadow-black/30 hover:scale-[1.02]"
                  >
                    <a
                      href={MAILCHIMP_CONFIG.subscribeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-3"
                    >
                      <Mail className="h-5 w-5" />
                      Subscribe for Updates
                    </a>
                  </Button>
                )}

                <p className="text-base text-muted-foreground/80 text-center">
                  Questions?{" "}
                  <Link href="/contact" className="hover:underline font-medium">
                    Contact our support team
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </Container>
      </div>
    </Section>
  );
}
