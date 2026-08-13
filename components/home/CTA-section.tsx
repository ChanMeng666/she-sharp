import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Reveal } from "@/components/ui/reveal";

export function CTASection() {
  return (
    <Section bgColor="white">
      <Container size="full">
        <Reveal className="flex flex-col items-start gap-8 border-t border-border pt-12 md:flex-row md:items-end md:justify-between md:pt-16">
          <h2 className="text-display-md text-foreground">
            Bridge the gap in{" "}
            <span className="text-outline text-foreground">STEM</span>
            <span className="text-brand">.</span>
          </h2>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Button asChild variant="brand" size="lg">
              <Link href="/donate">Donate</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/events">Come to an event</Link>
            </Button>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

export default CTASection;
