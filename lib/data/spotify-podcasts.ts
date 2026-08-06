/**
 * Spotify podcast configuration for She Sharp
 *
 * NAMING — the show's own name is "She Sharp Bytes". The team settled on it in
 * April 2022 and every published link since carries `shesharpbytes`. This site
 * calls it "She Sharp Talks" in six places (the podcasts page heading and
 * description, the embed title, the nav description and the resources preview
 * card). The Spotify show id below is correct and points at the same show, so
 * nothing is broken — but the two names are not the same name, and which one
 * to standardise on is a branding call nobody has made. Individual episode
 * titles containing "Bytes" are correct history and should not be rewritten.
 *
 * The archive also records, in September 2024, that the organisation stopped
 * making the podcast and moved social content to video and written formats.
 * There are no 2024-or-later episodes here, which matches.
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
import podcastsData from "@/lib/data/json/shesharp_podcasts_with_local_images.json";

/** Main show configuration */
export const SPOTIFY_SHOW: SpotifyShowConfig = {
  showId: "3CQf214DtzML2jqvVIxCqT",
};

type ScrapedPodcast = (typeof podcastsData)["podcasts"][number];

const mapPodcastToSpotifyEpisode = (
  podcast: ScrapedPodcast,
): SpotifyEpisode | null => {
  // Prefer explicit Spotify episode ID; fall back to the Spotify Podcasters slug.
  const id = podcast.spotifyEpisodeId ?? podcast.spotifyEpisodeSlug;

  if (!id) {
    return null;
  }

  return {
    id,
    // Use expanded height so descriptions are visible by default.
    height: 352,
  };
};

/**
 * Featured episodes to display on the page.
 * To add more episodes, simply add new entries to this array.
 */
export const FEATURED_EPISODES: SpotifyEpisode[] = podcastsData.podcasts
  .map(mapPodcastToSpotifyEpisode)
  .filter((episode): episode is SpotifyEpisode => episode !== null);

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
