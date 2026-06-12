"use client";

import { BentoGrid2x2 } from "@/components/ui/bento-grid";
import {
  PodcastPreviewCard,
  ImpactReportsCard,
  PressHighlightCard,
  PhotoGalleryPreviewCard,
  NewsletterPreviewCard,
} from "./bento-cards";
import { impactReports } from "@/lib/data/impact-reports";
import { SPOTIFY_SHOW } from "@/lib/data/spotify-podcasts";

/**
 * Main bento grid showcase for the resources page.
 * Uses a 2x2 grid for the four main sections plus a full-width
 * Newsletters banner below.
 */
export function ResourcesBentoShowcase() {
  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-4 sm:gap-5 md:gap-6">
      <BentoGrid2x2
        // Photo Gallery (links to /resources/photo-gallery)
        topLeft={<PhotoGalleryPreviewCard />}
        // Podcast (links to /resources/podcasts)
        topRight={<PodcastPreviewCard show={SPOTIFY_SHOW} />}
        // Impact Reports
        bottomLeft={
          <div id="impact-reports" className="scroll-mt-28 h-full w-full">
            <ImpactReportsCard reports={impactReports} />
          </div>
        }
        // In the Press (links to /resources/in-the-press)
        bottomRight={<PressHighlightCard />}
      />

      {/* Newsletters (links to /resources/newsletters) */}
      <NewsletterPreviewCard />
    </div>
  );
}
