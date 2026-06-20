import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { ApplicationCountdown } from "@/components/mentorship/application-countdown";
import { ArrowRight, Mail } from "lucide-react";
import Link from "next/link";
import { isMentorshipOpen } from "@/lib/config/mentorship";
import { MAILCHIMP_CONFIG } from "@/lib/data/newsletters";

export function BecomeMenteeCTASection() {
  const applicationsOpen = isMentorshipOpen();

  return (
    <Section id="become-mentee-cta" className="bg-[#9b2e83] relative overflow-hidden" noPadding>
      <div className="pt-16 pb-24 lg:pb-28">
        <Container size="full">
          <div className="max-w-8xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:gap-12 items-center text-white">
              <div className="flex flex-col gap-12">
                <div>
                  {!applicationsOpen && (
                    <span className="inline-flex w-fit items-center rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-white/90 ring-1 ring-white/20 mb-6">
                      Applications currently closed
                    </span>
                  )}
                  <h2 className="text-display-sm text-white mb-4 text-left">
                    Interested in Becoming A Mentee?
                  </h2>
                  <p className="text-base md:text-lg text-white/80 max-w-2xl text-left">
                    {applicationsOpen
                      ? "Take the first step towards transforming your career with personalized mentorship from industry leaders"
                      : "Applications for this year's programme have closed, but our community keeps growing. Subscribe to our newsletter and you'll be the first to know when mentee applications reopen for the next cohort."}
                  </p>
                </div>

                {applicationsOpen && <ApplicationCountdown variant="onBrand" />}
              </div>

              <div className="flex flex-col items-center gap-6">
                {applicationsOpen ? (
                  <Button
                    asChild
                    size="lg"
                    className="bg-white border-none text-brand hover:bg-white/90 text-lg font-bold px-12 py-4 h-auto shadow-lg shadow-black/20 group transition-all duration-300 hover:text-foreground hover:shadow-md hover:shadow-black/30 hover:scale-[1.02]"
                  >
                    <Link href="/mentorship/mentee/apply" className="inline-flex items-center gap-3">
                      Apply to Become a Mentee
                      <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  </Button>
                ) : (
                  <Button
                    asChild
                    size="lg"
                    className="bg-white border-none text-brand hover:bg-white/90 text-lg font-bold px-12 py-4 h-auto shadow-lg shadow-black/20 group transition-all duration-300 hover:text-foreground hover:shadow-md hover:shadow-black/30 hover:scale-[1.02]"
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

                <p className="text-base text-white/80 text-center">
                  Questions?{" "}
                  <Link href="/contact" className="hover:underline font-medium text-white">
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
