import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";

export function MentorshipCTASection() {
  return (
    <Section className="bg-white py-16 md:py-24 xl:py-32">
      <Container size="full">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-display-sm text-foreground mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Join our mentorship programme and be part of a community that empowers women in STEM.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center  py-4 md:py-6">
            <Button variant="brand" size="lg" asChild>
              <Link href="/mentorship/join">Become a Mentee</Link>
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <Link href="/mentorship/become-a-mentor">Become a Mentor</Link>
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}

