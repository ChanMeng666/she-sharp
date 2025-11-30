import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar, Sparkles } from "lucide-react";
import Link from "next/link";

export function SponsorshipHeroSection() {
  return (
    <Section className="min-h-screen flex items-center">
      <Container>
        <div className="space-y-8">

          {/* Limited Time Alert */}
          <Alert className="bg-muted border-border max-w-2xl">
            <Sparkles className="h-4 w-4 text-foreground" />
            <AlertDescription className="text-foreground">
              <strong>Limited Opportunity:</strong> Only 3 Platinum sponsorship spots remaining for our 2025 Annual Gala!
              <Link href="#packages" className="ml-2 underline font-medium text-foreground hover:text-foreground/90">
                View packages
              </Link>
            </AlertDescription>
          </Alert>

          {/* Main Content */}
          <div className="max-w-4xl space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
              Partner with Purpose
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
              Join leading organizations in empowering women in STEM through strategic corporate partnerships that drive real change.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" className="bg-foreground hover:bg-foreground/90 text-background" asChild>
                <Link href="#packages">
                  Explore Partnership Options
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-muted" asChild>
                <a href="/docs/sponsorship-guide-2025.pdf" download>
                  <Calendar className="mr-2 h-4 w-4" />
                  Download 2025 Guide
                </a>
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}