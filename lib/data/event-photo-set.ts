import { getEventBySlug } from "@/lib/data/events";
import { eventArchivePhotos } from "@/lib/data/event-archive-photos";

/**
 * Projections of an event's photographs, for pages other than the event page.
 *
 * The gallery page wants one event's photographs rendered in full, on the site,
 * rather than a card that links out to Google Photos. It cannot reach for
 * `event.detailPageData.photos` directly: `lib/data/events` value-imports about
 * 960 KB of event JSON, which is why `app/(site)/events/page.tsx` and
 * `components/resources/albums.tsx` both take pains to import only types from
 * it. The same discipline applies here — this module is SERVER-ONLY. Call it
 * from a server component and pass the returned plain array to the client
 * component that renders it, the way `lib/data/event-list-item.ts` does for the
 * events index.
 *
 * Duplicating the photo list into a hand-written module was the alternative and
 * is worse: the Slack sync rewrites `events-custom.json`, and a second copy
 * would drift the first time an organiser refreshed the event.
 */

/** Structurally compatible with `LightboxImage` in components/ui/lightbox.tsx. */
export type GalleryPhoto = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
};

/**
 * Every photograph an event ships, in the order the record lists them.
 *
 * Unlike the event page this does NOT drop `photos[0]`: there is no featured
 * hero above it here, so holding the first frame back would simply lose it.
 * Falls back to the harvested archive set for events that ship none of their
 * own, which is the same precedence `app/(site)/events/[slug]/page.tsx` uses.
 */
export function getEventGalleryPhotos(slug: string): GalleryPhoto[] {
  const event = getEventBySlug(slug);
  const own = event?.detailPageData.photos ?? [];
  if (own.length > 0) {
    return own.map((photo) => ({ src: photo.url, alt: photo.alt }));
  }
  const archive = eventArchivePhotos[slug] ?? [];
  return archive.map((photo) => ({
    src: photo.src,
    alt: photo.alt,
    width: photo.width,
    height: photo.height,
  }));
}
