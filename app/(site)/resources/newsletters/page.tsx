import { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Mail, Archive } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { MAILCHIMP_CONFIG } from "@/lib/data/newsletters";

export const metadata: Metadata = {
  title: "Newsletters | She Sharp",
  description:
    "Read past issues of the She Sharp newsletter or subscribe to receive updates on events, mentorship, and community news.",
};

export default function NewslettersPage() {
  return (
    <Section spacing="section" className="pt-28 pb-16 md:py-24 lg:py-32">
      <Container size="full">
        <div className="mb-8 sm:mb-10 md:mb-14 lg:mb-16 max-w-3xl">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
            Newsletters
          </h1>
          <p className="mt-3 text-base md:text-lg text-muted-foreground">
            Stay in the loop on She Sharp events, mentorship milestones, and
            community wins. Browse past issues or subscribe to receive the next
            one.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Archive card */}
          <div className="card-responsive-lg shadow-md bg-background p-6 sm:p-8 md:p-10 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand/10 text-brand">
                <Archive className="h-5 w-5" />
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold">
                Read past issues
              </h2>
            </div>
            <p className="text-muted-foreground flex-1">
              Browse our Mailchimp archive to revisit every newsletter we&apos;ve
              published, from community milestones to event recaps.
            </p>
            <div className="mt-6">
              <Button asChild size="lg" variant="brand">
                <Link
                  href={MAILCHIMP_CONFIG.archiveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  Open archive
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Subscribe card */}
          <div className="card-responsive-lg shadow-md bg-background p-6 sm:p-8 md:p-10 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand/10 text-brand">
                <Mail className="h-5 w-5" />
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold">
                Subscribe
              </h2>
            </div>
            <p className="text-muted-foreground flex-1">
              Never miss an event, speaker announcement, or opportunity. Join
              the She Sharp newsletter and get updates straight to your inbox.
            </p>
            <div className="mt-6">
              <Button asChild size="lg" variant="outline">
                <Link
                  href={MAILCHIMP_CONFIG.subscribeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  Subscribe now
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
