"use client";

import { BentoGrid2x2 } from "@/components/ui/bento-grid";
import {
  PodcastPreviewCard,
  ImpactReportsCard,
  PressHighlightCard,
  PhotoGalleryPreviewCard,
} from "./bento-cards";
import { impactReports } from "@/lib/data/impact-reports";
import { SPOTIFY_SHOW } from "@/lib/data/spotify-podcasts";

/**
 * Main bento grid showcase for the resources page.
 * Uses a 2x2 grid layout for the four main resource sections.
 */
export function ResourcesBentoShowcase() {
  return (
    <BentoGrid2x2
      className="max-w-5xl mx-auto"
      // Photo Gallery (links to /resources/photo-gallery)
      topLeft={<PhotoGalleryPreviewCard />}
      // Podcast (links to /resources/podcasts)
      topRight={<PodcastPreviewCard show={SPOTIFY_SHOW} />}
      // Impact Reports
      bottomLeft={<ImpactReportsCard reports={impactReports} />}
      // In the Press (links to /resources/in-the-press)
      bottomRight={<PressHighlightCard />}
    />
  );
}
