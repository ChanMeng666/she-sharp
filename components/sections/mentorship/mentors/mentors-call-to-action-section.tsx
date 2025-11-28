import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export function MentorsCallToActionSection() {
  return (
    <Section className="py-16 bg-gradient-to-b from-purple-50 to-white">
      <Container>
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-dark px-4 py-2 rounded-full mb-6">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Become a Mentor</span>
          </div>
          <h2 className="text-3xl font-bold text-navy-dark mb-6">
            Share your wisdom and inspire more Women in STEM
          </h2>
          <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
            Use your experience to guide, inspire, and empower women, fostering
            their personal and career growth journeys to achieve success and
            fulfillment in STEM fields.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-purple-dark hover:bg-purple-mid"
            >
              <Link href="/mentorship/become-a-mentor" className="inline-flex items-center gap-2">
                Apply as Mentor
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-purple-dark text-purple-dark hover:bg-purple-50"
            >
              <Link href="/mentorship" className="inline-flex items-center gap-2">
                Learn About the Program
              </Link>
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}
