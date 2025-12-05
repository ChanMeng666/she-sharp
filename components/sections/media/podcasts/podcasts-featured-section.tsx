import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { SpotifyEmbed } from "@/components/spotify/spotify-embed";
import { SPOTIFY_SHOW, getSpotifyShowUrl } from "@/lib/data/spotify-podcasts";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export function PodcastsFeaturedSection() {
  return (
    <Section bgColor="white" className="py-16 md:py-24">
      <Container size="content">
        {/* Main show embed */}
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6 text-center">
            Listen on Spotify
          </h2>
          <SpotifyEmbed type="show" id={SPOTIFY_SHOW.showId} height={352} />
        </div>

        {/* Link to full show on Spotify */}
        <div className="text-center">
          <Button asChild variant="outline" size="lg">
            <a
              href={getSpotifyShowUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
            >
              View All Episodes on Spotify
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </Container>
    </Section>
  );
}
