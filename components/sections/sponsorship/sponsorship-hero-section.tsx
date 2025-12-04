import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import Link from "next/link";

export function SponsorshipHeroSection() {
  return (
    <Section className="min-h-[60vh] flex items-center">
      <Container>
        <div className="max-w-4xl space-y-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
            Partner with Purpose
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
            Join leading organizations in empowering women in STEM through strategic corporate partnerships that drive real change.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button size="lg" asChild>
              <Link href="#packages">
                Explore Partnership Options
              </Link>
            </Button>
            <Button size="lg" variant="ghost" asChild>
              <a href="/docs/sponsorship-guide-2025.pdf" download>
                <Calendar className="mr-2 h-4 w-4" />
                Download 2025 Guide
              </a>
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}