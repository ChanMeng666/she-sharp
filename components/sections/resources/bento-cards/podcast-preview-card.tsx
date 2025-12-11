"use client";

import { Card } from "@/components/ui/card";
import type { SpotifyShowConfig } from "@/types/spotify";

interface PodcastPreviewCardProps {
  show: SpotifyShowConfig;
  spotifyUrl: string;
}

/**
 * Podcast embedded player card for the secondaryFeature slot.
 * Embeds the Spotify player directly for in-page listening.
 */
export function PodcastPreviewCard({ show }: PodcastPreviewCardProps) {
  const embedUrl = `https://open.spotify.com/embed/show/${show.showId}?utm_source=generator`;

  return (
    <Card className="relative h-full w-full overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl rounded-[50px] bg-[#121212]">
      {/* Spotify Embed */}
      <iframe
        src={embedUrl}
        width="100%"
        height="100%"
        frameBorder="0"
        allowFullScreen
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        title={`${show.name} - Spotify Podcast`}
        className="absolute inset-0 w-full h-full"
        style={{ borderRadius: "50px" }}
      />
    </Card>
  );
}
