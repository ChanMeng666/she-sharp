import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { layoutSystem } from "@/lib/layout-system";

export function ContactHeroSection() {
  return (
    <Section bgColor="white" noPadding className="pt-16 pb-20">
      <Container size="narrow">
        <div className="text-center">
          <h1 className="text-5xl font-light tracking-tight text-navy-dark sm:text-6xl md:text-7xl">
            Get in Touch
          </h1>
          <p className="mt-8 text-xl text-gray leading-relaxed">
            We&apos;d love to hear from you. Send us a message and we&apos;ll respond within 48 hours.
          </p>
        </div>
      </Container>
    </Section>
  );
}