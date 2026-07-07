import { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Mail } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { NewslettersGrid } from "@/components/resources";
import { MAILCHIMP_CONFIG } from "@/lib/data/newsletters";
import { getAllNewsletters } from "@/lib/data/newsletters-manual";

export const metadata: Metadata = {
  title: "Newsletters",
  alternates: { canonical: "/resources/newsletters" },
  description:
    "Read past issues of the She Sharp newsletter or subscribe to receive updates on events, mentorship, and community news.",
};

export default function NewslettersPage() {
  const issues = getAllNewsletters();

  return (
    <Section spacing="section" className="pt-28 pb-16 md:py-24 lg:py-32">
      <Container size="full">
        {/* Header */}
        <div className="mb-8 max-w-3xl sm:mb-10 md:mb-12">
          <p className="text-label mb-4 text-brand">Newsletters</p>
          <h1 className="text-display-sm text-foreground">The newsletter archive</h1>
          <p className="mt-4 text-base text-ink-600 md:text-lg">
            Stay in the loop on She Sharp events, mentorship milestones, and
            community wins. Browse past issues below or subscribe to receive the
            next one.
          </p>
        </div>

        {/* Subscribe / archive call to action */}
        <div className="mb-10 md:mb-14 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button asChild size="lg" variant="brand">
            <Link
              href={MAILCHIMP_CONFIG.subscribeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Subscribe
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link
              href={MAILCHIMP_CONFIG.archiveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
            >
              Open full archive
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Issue grid */}
        <NewslettersGrid issues={issues} />
      </Container>
    </Section>
  );
}
