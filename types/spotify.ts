/**
 * Spotify embed type definitions for She Sharp podcasts
 */

export interface SpotifyEpisode {
  /** Spotify episode ID (e.g., "0GRfESmqleMwWBN2ANPqEp") */
  id: string;
  /** Optional custom height: 152 (compact) or 352 (expanded with description) */
  height?: number;
}

export interface SpotifyShowConfig {
  /** Spotify show ID (e.g., "3CQf214DtzML2jqvVIxCqT") */
  showId: string;
}
