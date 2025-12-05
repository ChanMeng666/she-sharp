import { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { NewslettersHeroSection } from "@/components/sections/media/newsletters/newsletters-hero-section";
import { NewsletterGrid } from "@/components/newsletters";

export const metadata: Metadata = {
  title: "Newsletters | She Sharp",
  description:
    "Browse the She Sharp newsletter archive. Stay updated with the latest events, career opportunities, and inspiring stories from women in technology.",
};

export default function NewslettersPage() {
  return (
    <>
      <NewslettersHeroSection />
      <Section className="py-16">
        <Container size="full">
          <NewsletterGrid />
        </Container>
      </Section>
    </>
  );
}
