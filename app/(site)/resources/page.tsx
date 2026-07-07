import { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { ResourcesBentoShowcase, ResourcesPageClient } from "@/components/resources";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "Explore She Sharp's podcasts, photo gallery, press coverage, and impact reports.",
  alternates: { canonical: "/resources" },
};

export default function ResourcesPage() {
  return (
    <ResourcesPageClient>
      <Section className="bg-transparent pt-28 pb-16 md:py-24 lg:py-32" noPadding>
        <Container size="full">
          <div className="mb-10 text-center md:mb-14">
            <p className="text-label mb-4 text-brand">Resources</p>
            <h1 className="text-display-sm text-foreground">
              The resource library
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-ink-600 md:text-lg">
              Podcasts, photo galleries, press coverage, and annual impact
              reports from across the She Sharp community.
            </p>
          </div>

          <ResourcesBentoShowcase />
        </Container>
      </Section>
    </ResourcesPageClient>
  );
}
