import { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import {
  FEATURED_EPISODES,
  getSpotifyShowEmbedUrl,
  getSpotifyEpisodeEmbedUrl,
} from "@/lib/data/spotify-podcasts";

export const metadata: Metadata = {
  title: "Podcasts",
  alternates: { canonical: "/resources/podcasts" },
  description:
    "Listen to She Sharp Talks – conversations with women leading innovation in technology.",
};

export default function PodcastsPage() {
  const showEmbedUrl = getSpotifyShowEmbedUrl();

  return (
    <Section spacing="section" className="pt-28 pb-16 md:py-24 lg:py-32">
      <Container size="full">
        <div className="mb-8 max-w-3xl sm:mb-10 md:mb-14 lg:mb-16">
          <p className="text-label mb-4 text-brand">Podcast</p>
          <h1 className="text-display-sm text-foreground">She Sharp Talks</h1>
          <p className="mt-4 text-base text-ink-600 md:text-lg">
            Inspiring conversations with women leading innovation in technology.
            Listen to our latest episodes or explore featured conversations
            below.
          </p>
        </div>

        {/* Show embed */}
        <div className="mb-8 sm:mb-10 md:mb-12">
          <div className="overflow-hidden rounded-[32px] border border-border">
            <iframe
              src={showEmbedUrl}
              width="100%"
              height="232"
              style={{ border: 0 }}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              title="She Sharp Talks - Spotify Show"
            />
          </div>
        </div>

        {/* Featured episodes */}
        <div className="space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-8">
          <h2 className="text-xl font-semibold text-foreground sm:text-2xl lg:text-3xl">
            Featured episodes
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 md:gap-6 lg:gap-8 xl:grid-cols-3">
            {FEATURED_EPISODES.map((episode) => (
              <div
                key={episode.id}
                className="overflow-hidden rounded-[32px] border border-border bg-background"
              >
                <iframe
                  src={getSpotifyEpisodeEmbedUrl(episode.id)}
                  width="100%"
                  height={episode.height}
                  style={{ border: 0 }}
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
