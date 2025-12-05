/**
 * Spotify podcast configuration for She Sharp
 *
 * HOW TO ADD NEW EPISODES:
 * =========================
 * 1. Go to Spotify and find the episode you want to feature
 * 2. Click the "..." menu > Share > Embed episode
 * 3. Copy the episode ID from the URL (the part after /episode/)
 *    Example: https://open.spotify.com/embed/episode/0GRfESmqleMwWBN2ANPqEp
 *             Episode ID: 0GRfESmqleMwWBN2ANPqEp
 * 4. Add a new object to the FEATURED_EPISODES array below
 * 5. Set height to 152 for compact view or 352 for expanded view with description
 */

import { SpotifyShowConfig, SpotifyEpisode } from "@/types/spotify";

/** Main show configuration */
export const SPOTIFY_SHOW: SpotifyShowConfig = {
  showId: "3CQf214DtzML2jqvVIxCqT",
  name: "She Sharp Talks",
  description:
    "Inspiring conversations with women leading innovation in technology",
};

/**
 * Featured episodes to display on the page.
 * To add more episodes, simply add new entries to this array.
 */
export const FEATURED_EPISODES: SpotifyEpisode[] = [
  {
    id: "0GRfESmqleMwWBN2ANPqEp",
    height: 152, // Compact view
  },
  {
    id: "4wQ6NuXiVQzbEKMQzMwdyy",
    height: 352, // Expanded view with description
  },
];

/** Get the embed URL for the main show */
export function getSpotifyShowEmbedUrl(): string {
  return `https://open.spotify.com/embed/show/${SPOTIFY_SHOW.showId}`;
}

/** Get the embed URL for a specific episode */
export function getSpotifyEpisodeEmbedUrl(episodeId: string): string {
  return `https://open.spotify.com/embed/episode/${episodeId}`;
}

/** Get the direct Spotify URL for the show (opens in Spotify) */
export function getSpotifyShowUrl(): string {
  return `https://open.spotify.com/show/${SPOTIFY_SHOW.showId}`;
}
