"use client";

import type { SpotifyShowConfig } from "@/types/spotify";
import { BentoLinkCard } from "./bento-link-card";

/**
 * Podcast preview card for the resources hub — image-top hairline card.
 * Links to the podcasts page. `show` is accepted for API parity with the hub.
 */
export function PodcastPreviewCard({ show: _show }: { show: SpotifyShowConfig }) {
  return (
    <BentoLinkCard
      href="/resources/podcasts"
      eyebrow="Podcast"
      title="She Sharp Talks"
      description="Inspiring conversations with women leading innovation in technology."
      action="Listen"
      image={{ src: "/img/podcast.jpg", alt: "She Sharp Talks podcast" }}
    />
  );
}
