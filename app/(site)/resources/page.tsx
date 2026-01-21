import { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { ResourcesBentoShowcase, ResourcesPageClient } from "@/components/resources";

export const metadata: Metadata = {
  title: "Resources | She Sharp",
  description:
    "Explore She Sharp's podcasts, photo gallery, press coverage, and impact reports.",
};

export default function ResourcesPage() {
  return (
    <ResourcesPageClient>
      <Section className="bg-transparent py-16 md:py-24 lg:py-32" noPadding>
        <Container size="full">
          <div className="mb-8 md:mb-12">
            <h1 className="text-center text-4xl font-bold tracking-tight">
              Resource Library
            </h1>
            <p className="text-center text-lg text-muted-foreground mt-2">
              Discover our podcasts, photo galleries, and annual impact reports.
            </p>
          </div>

          <ResourcesBentoShowcase />
        </Container>
      </Section>
    </ResourcesPageClient>
  );
}
