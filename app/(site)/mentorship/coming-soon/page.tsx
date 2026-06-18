import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Mentorship Programme — Coming Soon | She Sharp",
  description:
    "The She Sharp mentorship programme is currently being planned and will reopen for new mentees and mentors soon.",
};

// Temporary placeholder shown while the mentorship application forms are paused.
// All "apply" buttons and the /mentorship/*/apply routes redirect here until the
// programme reopens. To re-enable applications, restore the original button hrefs
// and remove the redirects in next.config.ts.
export default function MentorshipComingSoonPage() {
  return (
    <Section className="min-h-[70vh] flex items-center">
      <Container>
        <div className="mx-auto max-w-2xl text-center flex flex-col items-center gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#9b2e83]/10 text-[#9b2e83]">
            <Clock className="h-8 w-8" />
          </div>

          <h1 className="text-display-sm text-[#9b2e83]">
            Mentorship Programme — Coming Soon
          </h1>

          <p className="text-base md:text-lg text-muted-foreground">
            Our mentorship programme is currently being planned and is not
            accepting new mentees or mentors at the moment. We&apos;re working on
            something exciting and will open applications again soon — thank you
            for your patience and interest.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
            <Button asChild size="lg" className="bg-[#9b2e83] hover:bg-[#9b2e83]/90 text-white">
              <Link href="/mentorship" className="inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Mentorship
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/contact">Have a question? Contact us</Link>
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}
