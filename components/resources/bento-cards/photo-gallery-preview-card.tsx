"use client";

import { BentoLinkCard } from "./bento-link-card";

// Static cover image for the Photo Gallery preview card.
const COVER_IMAGE = "/img/gallery/photo-gallery-cover.jpg";

/**
 * Photo Gallery preview card for the resources hub — image-top hairline card.
 * Links to the photo gallery page.
 */
export function PhotoGalleryPreviewCard() {
  return (
    <BentoLinkCard
      href="/resources/photo-gallery"
      eyebrow="Photo Gallery"
      title="Event photos & highlights"
      description="Browse albums from our workshops, networking events, and community gatherings."
      action="Explore"
      image={{
        src: COVER_IMAGE,
        alt: "She Sharp community members gathered at an event",
      }}
    />
  );
}
