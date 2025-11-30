import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { layoutSystem } from "@/lib/layout-system";

export function PodcastsHeroSection() {
  return (
    <Section bgColor="dark" noPadding className="relative overflow-hidden bg-foreground">
      {/* Simple background pattern */}
      <div className="absolute inset-0 bg-muted/10" />

      <Container size="content" className="relative z-10">
        <div className="py-20 md:py-28">
          <div className="flex flex-col items-center text-center">
            {/* Audio wave visualization */}
            <div className="mb-8 flex items-center gap-1">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-background/60 rounded-full"
                  style={{
                    height: `${Math.random() * 40 + 20}px`,
                  }}
                />
              ))}
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-background mb-4">
              She Sharp
            </h1>
            <h2 className="text-6xl md:text-8xl font-bold text-background/90 mb-6">
              Podcasts
            </h2>
            <p className="text-xl md:text-2xl text-background/80 max-w-2xl mx-auto">
              Inspiring conversations with women leading innovation in technology
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}