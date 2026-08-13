"use client";

import { newsPressItems } from "@/lib/data/news-press";
import { BentoLinkCard } from "./bento-link-card";

/**
 * "In the Press" highlight card for the resources hub — image-top hairline card.
 * Uses the most recent news item as the cover image.
 */
export function PressHighlightCard() {
  const featured = newsPressItems[0];

  return (
    <BentoLinkCard
      href="/resources/in-the-press"
      eyebrow="In the Press"
      title="News & press coverage"
      description="Media features and awards celebrating the She Sharp community."
      action="Read"
      image={
        featured
          ? { src: featured.coverImage, alt: featured.title }
          : undefined
      }
    />
  );
}
