/**
 * Gallery album data for She Sharp photo gallery.
 * Derived from events data as the single source of truth.
 */

import type { GalleryAlbum } from "@/types/gallery";
import { getAllEvents, parseDateString } from "./events";
import { eventArchivePhotos } from "./event-archive-photos";

// Up to two extra images (besides the cover) to feed the album card mosaic.
// Prefer the event's own on-page photos; fall back to the harvested archive set.
const buildThumbnails = (
  event: ReturnType<typeof getAllEvents>[number]
): string[] => {
  const own = event.detailPageData.photos ?? [];
  if (own.length >= 2) {
    return own.slice(0, 2).map((p) => p.url);
  }
  const archive = eventArchivePhotos[event.slug] ?? [];
  return archive.slice(0, 2).map((p) => p.src);
};

const buildGalleryAlbums = (): GalleryAlbum[] => {
  return getAllEvents()
    .filter((event) => event.detailPageData.galleryUrl?.trim())
    .map((event) => ({
      title: event.title,
      date: event.date,
      googlePhotosUrl: event.detailPageData.galleryUrl,
      coverImage: event.coverImage.url,
      slug: event.slug,
      thumbnails: buildThumbnails(event),
    }))
    .sort(
      (a, b) =>
        parseDateString(b.date).getTime() - parseDateString(a.date).getTime()
    );
};

export const galleryAlbums: GalleryAlbum[] = buildGalleryAlbums();
