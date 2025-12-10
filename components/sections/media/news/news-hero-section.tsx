import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";

export function NewsHeroSection() {
  return (
    <Section className="relative overflow-hidden bg-muted">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-muted/5" />

      <Container className="relative z-10">
        <div className="py-12 md:py-16">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-4 bg-foreground text-background border-0">
              Making Headlines
            </Badge>

            <h1 className="text-display-lg text-foreground mb-6">
              News & Press
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed">
              Celebrating milestones, sharing stories, and amplifying the voices of women in technology
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}