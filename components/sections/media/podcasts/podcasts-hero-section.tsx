import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";
import { Mic } from "lucide-react";
import { SPOTIFY_SHOW } from "@/lib/data/spotify-podcasts";

export function PodcastsHeroSection() {
  return (
    <Section
      bgColor="dark"
      noPadding
      className="relative flex items-center overflow-hidden bg-foreground"
    >
      {/* Simple background pattern */}
      <div className="absolute inset-0 bg-muted/10" />

      <Container size="content" className="relative z-10">
        <div className="py-20 md:py-28 w-full">
          <div className="flex flex-col items-center text-center">
            {/* Badge */}
            <Badge
              variant="secondary"
              className="mb-6 bg-background/10 text-background border-background/20"
            >
              <Mic className="h-4 w-4 mr-2" />
              Podcasts
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold text-background mb-6">
              {SPOTIFY_SHOW.name}
            </h1>

            <p className="text-xl md:text-2xl text-background/80 max-w-2xl mx-auto">
              {SPOTIFY_SHOW.description}
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}
