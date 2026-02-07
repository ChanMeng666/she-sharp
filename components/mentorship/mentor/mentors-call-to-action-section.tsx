import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export function MentorsCallToActionSection() {
  return (
    <Section className="py-16">
      <Container>
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-navy mb-6">
            Share your wisdom and inspire more Women in STEM
          </h2>
          <p className="text-lg text-gray-700 mb-8">
            Use your experience to guide, inspire, and empower women, fostering 
            their personal and career growth journeys to achieve success and 
            fulfillment in STEM fields.
          </p>
          <Button 
            asChild 
            size="lg" 
            className="bg-purple-dark hover:bg-purple-mid"
          >
            <a 
              href="https://forms.gle/msvCzw3qevVnPRvv7" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
            >
              Become a mentor
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </Container>
    </Section>
  );
}