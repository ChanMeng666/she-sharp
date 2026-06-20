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
    <Section className="bg-white py-16">
      <Container size="full">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-display-sm text-foreground mb-4">
              {applicationsOpen ? "Join Our Programme" : "Stay Connected"}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              {applicationsOpen
                ? "Join our mentorship programme and be part of a community that empowers women in STEM."
                : "Applications for this year's programme have closed, but we'd love to keep you updated. Subscribe to our newsletter to receive the latest mentorship updates, application announcements, events, and community news."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center py-4 md:py-6">
            {applicationsOpen ? (
              <>
                <Button variant="brand" size="lg" asChild>
                  <Link href="/mentorship/mentee">Become a Mentee</Link>
                </Button>
                <Button variant="secondary" size="lg" asChild>
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
