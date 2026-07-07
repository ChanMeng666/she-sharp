"use client";

import { Reveal } from "@/components/ui/reveal";
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
 * Resources hub showcase — a 2×2 grid of hairline image-top cards plus a
 * full-width Newsletters band below.
 */
export function ResourcesBentoShowcase() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 md:gap-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
        <Reveal variant="fade-up">
          <PhotoGalleryPreviewCard />
        </Reveal>
        <Reveal variant="fade-up" delay={60}>
          <PodcastPreviewCard show={SPOTIFY_SHOW} />
        </Reveal>
        <Reveal variant="fade-up" delay={120}>
          <div id="impact-reports" className="h-full scroll-mt-28">
            <ImpactReportsCard reports={impactReports} />
          </div>
        </Reveal>
        <Reveal variant="fade-up" delay={180}>
          <PressHighlightCard />
        </Reveal>
      </div>

      <Reveal variant="fade-up">
        <NewsletterPreviewCard />
      </Reveal>
    </div>
  );
}
