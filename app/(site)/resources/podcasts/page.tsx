import { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import {
  SPOTIFY_SHOW,
  FEATURED_EPISODES,
  getSpotifyShowEmbedUrl,
  getSpotifyEpisodeEmbedUrl,
} from "@/lib/data/spotify-podcasts";

export const metadata: Metadata = {
  title: "Podcasts | She Sharp Talks",
  description:
    "Listen to She Sharp Talks – conversations with women leading innovation in technology.",
};

export default function PodcastsPage() {
  const showEmbedUrl = getSpotifyShowEmbedUrl();

  return (
    <Section spacing="section" className="py-16 md:py-24 lg:py-32">
      <Container size="full">
        <div className="mb-10 md:mb-14 max-w-3xl">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
            She Sharp Talks
          </h1>
          <p className="mt-3 text-base md:text-lg text-muted-foreground">
            Inspiring conversations with women leading innovation in technology.
            Listen to our latest episodes or explore featured conversations
            below.
          </p>
        </div>

        {/* Show embed */}
        <div className="mb-12">
          <div className="overflow-hidden rounded-3xl shadow-lg">
            <iframe
              src={showEmbedUrl}
              width="100%"
              height="232"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              title="She Sharp Talks - Spotify Show"
            />
          </div>
        </div>

        {/* Featured episodes */}
        <div className="space-y-6">
          <h2 className="text-xl md:text-2xl font-semibold">
            Featured episodes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FEATURED_EPISODES.map((episode) => (
              <div
                key={episode.id}
                className="overflow-hidden rounded-3xl shadow-md bg-background"
              >
                <iframe
                  src={getSpotifyEpisodeEmbedUrl(episode.id)}
                  width="100%"
                  height={episode.height}
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  title={`Spotify episode ${episode.id}`}
                />
              </div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}

