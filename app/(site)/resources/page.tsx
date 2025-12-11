import { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { ResourcesBentoShowcase, ResourcesPageClient } from "@/components/sections/resources";

export const metadata: Metadata = {
  title: "Resources | She Sharp",
  description:
    "Explore She Sharp's podcasts, photo gallery, press coverage, and impact reports.",
};

export default function ResourcesPage() {
  return (
    <ResourcesPageClient>
      {/* Bento Grid Showcase with Title */}
      <Section className="bg-transparent py-16 md:py-24" noPadding>
        <Container size="full">
          {/* Title Section - Minimal Style */}
          <div className="mb-8 md:mb-12">
            <h1 className="text-center text-4xl font-bold tracking-tight">
              Resource Library
            </h1>
            <p className="text-center text-lg text-muted-foreground mt-2">
              Discover our podcasts, photo galleries, and annual impact reports.
            </p>
          </div>

          {/* Bento Grid */}
          <ResourcesBentoShowcase />
        </Container>
      </Section>
    </ResourcesPageClient>
  );
}
