import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";

export function NewslettersHeroSection() {
  return (
    <Section className="relative overflow-hidden bg-foreground">
      {/* Typography pattern background */}
      <div className="absolute inset-0 bg-muted/10" />

      {/* Floating typography elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 text-6xl font-bold text-background/5 transform -rotate-12">NEWS</div>
        <div className="absolute top-40 right-20 text-8xl font-bold text-background/5 transform rotate-6">TECH</div>
        <div className="absolute bottom-20 left-1/3 text-7xl font-bold text-background/5 transform -rotate-6">INSPIRE</div>
        <div className="absolute bottom-40 right-10 text-5xl font-bold text-background/5 transform rotate-12">CONNECT</div>
      </div>

      <Container className="relative z-10">
        <div className="py-12 md:py-16">
          <div className="max-w-4xl">
            <Badge className="mb-4 bg-muted text-background border-0">
              Monthly Publication
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold text-background mb-6 leading-tight">
              She Sharp
              <span className="block text-background/80">Newsletters</span>
            </h1>

            <p className="text-xl md:text-2xl text-background/80 mb-8 leading-relaxed">
              Your monthly dose of tech insights, career advice, and inspiring stories from women shaping the future of technology.
            </p>

            <div className="flex flex-wrap gap-4 text-background/60">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-muted rounded-full" />
                <span>Industry Trends</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-muted rounded-full" />
                <span>Career Development</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-muted rounded-full" />
                <span>Success Stories</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-muted rounded-full" />
                <span>Event Highlights</span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}