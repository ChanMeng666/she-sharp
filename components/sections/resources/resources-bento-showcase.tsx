"use client";

import { BentoGridShowcase } from "@/components/ui/bento-grid";
import {
  FeaturedAlbumCard,
  AlbumCard,
  PodcastPreviewCard,
  ImpactReportsCard,
} from "./bento-cards";
import { galleryAlbums } from "@/lib/data/gallery-albums";
import { impactReports } from "@/lib/data/impact-reports";
import { SPOTIFY_SHOW, getSpotifyShowUrl } from "@/lib/data/spotify-podcasts";

/**
 * Main bento grid showcase for the resources page.
 * Composes all slot cards into the BentoGridShowcase layout.
 */
export function ResourcesBentoShowcase() {
  const spotifyUrl = getSpotifyShowUrl();

  // Get albums for each slot - AI Hackathon 2025 in the center (mainFeature)
  const aiHackathon = galleryAlbums[0]; // She# AI Hackathon 2025
  const hclTechDunedin = galleryAlbums[1]; // She# & HCLTech Dunedin
  const vector = galleryAlbums[2]; // She# @ Vector
  const xeroSecureCode = galleryAlbums[3]; // She# @ Xero with Secure Code Warriors

  return (
    <BentoGridShowcase
      className="max-w-7xl mx-auto"
      integrations={<AlbumCard album={hclTechDunedin} compact />}
      mainFeature={<FeaturedAlbumCard album={aiHackathon} />}
      featureTags={<AlbumCard album={vector} compact />}
      secondaryFeature={
        <PodcastPreviewCard show={SPOTIFY_SHOW} spotifyUrl={spotifyUrl} />
      }
      statistic={<AlbumCard album={xeroSecureCode} />}
      journey={<ImpactReportsCard reports={impactReports} />}
    />
  );
}
