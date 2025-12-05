/**
 * Reusable Spotify embed component for shows and episodes
 */

import { cn } from "@/lib/utils";

interface SpotifyEmbedProps {
  /** Type of content to embed */
  type: "show" | "episode";
  /** Spotify ID for the show or episode */
  id: string;
  /** Height of the embed (default: 152 for compact, use 352 for expanded) */
  height?: number;
  /** Additional CSS classes */
  className?: string;
}

export function SpotifyEmbed({
  type,
  id,
  height = 152,
  className,
}: SpotifyEmbedProps) {
  const embedUrl = `https://open.spotify.com/embed/${type}/${id}`;

  return (
    <iframe
      src={embedUrl}
      width="100%"
      height={height}
      frameBorder={0}
      allowFullScreen
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
      className={cn("rounded-xl", className)}
    />
  );
}
