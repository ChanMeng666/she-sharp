import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { isMentorshipOpen } from "@/lib/config/mentorship";
import { MAILCHIMP_CONFIG } from "@/lib/data/newsletters";

export function MentorshipCTASection() {
  const applicationsOpen = isMentorshipOpen();

  return (
    <Section bgColor="dark" className="py-16 md:py-20">
      <Container size="full">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="max-w-2xl">
            <h2 className="text-display-sm text-background mb-3">
              {applicationsOpen ? (
                <>
                  Join our <span className="text-mint">programme</span>
                </>
              ) : (
                <>
                  Stay <span className="text-mint">connected</span>
                </>
              )}
            </h2>
            <p className="text-base md:text-lg text-background/70">
              {applicationsOpen
                ? "Be part of a community that empowers women in STEM."
                : "Applications for this year's programme have closed. Subscribe to our newsletter for the latest mentorship updates, application announcements, and community news."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 shrink-0">
            {applicationsOpen ? (
              <>
                <Button variant="brand" size="lg" asChild>
                  <Link href="/mentorship/mentee">Become a Mentee</Link>
                </Button>
                <Button
                  size="lg"
                  className="bg-transparent border border-white/30 text-background hover:bg-white/10"
                  asChild
                >
                  <Link href="/mentorship/mentor">Become a Mentor</Link>
                </Button>
              </>
            ) : (
              <Button variant="brand" size="lg" asChild>
                <a
                  href={MAILCHIMP_CONFIG.subscribeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Mail className="h-5 w-5" />
                  Subscribe to Newsletter
                </a>
              </Button>
            )}
          </div>
        </div>
      </Container>
    </Section>
  );
}
