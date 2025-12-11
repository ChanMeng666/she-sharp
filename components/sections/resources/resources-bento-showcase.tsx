"use client";

import { BentoGridShowcase } from "@/components/ui/bento-grid";
import {
  FeaturedAlbumCard,
  AlbumCard,
  PodcastPreviewCard,
  ImpactReportsCard,
} from "./bento-cards";
import { getFeaturedAlbums, galleryAlbums } from "@/lib/data/gallery-albums";
import { SPOTIFY_SHOW, getSpotifyShowUrl } from "@/lib/data/spotify-podcasts";

/**
 * Impact reports data for the resources page.
 */
const impactReports = [
  { id: "2024", year: 2024, pdfUrl: "/reports/impact-report-2024.pdf" },
  { id: "2023", year: 2023, pdfUrl: "/reports/impact-report-2023.pdf" },
  { id: "2022", year: 2022, pdfUrl: "/reports/impact-report-2022.pdf" },
  { id: "2021", year: 2021, pdfUrl: "/reports/impact-report-2021.pdf" },
];

/**
 * Main bento grid showcase for the resources page.
 * Composes all slot cards into the BentoGridShowcase layout.
 */
export function ResourcesBentoShowcase() {
  const featuredAlbums = getFeaturedAlbums();
  const featuredAlbum = featuredAlbums[0];
  const spotifyUrl = getSpotifyShowUrl();

  // Get different albums for each slot
  const album1 = galleryAlbums[1]; // MYOB Tech Week 2025
  const album2 = galleryAlbums[2]; // #IAmRemarkable Workshop
  const album3 = galleryAlbums[3]; // IWD 2025

  return (
    <BentoGridShowcase
      className="max-w-7xl mx-auto"
      integrations={<AlbumCard album={album1} compact />}
      mainFeature={<FeaturedAlbumCard album={featuredAlbum} />}
      featureTags={<AlbumCard album={album2} compact />}
      secondaryFeature={
        <PodcastPreviewCard show={SPOTIFY_SHOW} spotifyUrl={spotifyUrl} />
      }
      statistic={<AlbumCard album={album3} />}
      journey={<ImpactReportsCard reports={impactReports} />}
    />
  );
}
