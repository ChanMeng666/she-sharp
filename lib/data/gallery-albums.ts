/**
 * Gallery album data for She Sharp photo gallery.
 * Derived from events data as the single source of truth.
 */

import type { GalleryAlbum } from "@/types/gallery";
import { getAllEvents, parseDateString } from "./events";

const buildGalleryAlbums = (): GalleryAlbum[] => {
  return getAllEvents()
    .filter((event) => event.detailPageData.galleryUrl?.trim())
    .map((event) => ({
      title: event.title,
      date: event.date,
      googlePhotosUrl: event.detailPageData.galleryUrl,
      coverImage: event.coverImage.url,
    }))
    .sort(
      (a, b) =>
        parseDateString(b.date).getTime() - parseDateString(a.date).getTime()
    );
};

export const galleryAlbums: GalleryAlbum[] = buildGalleryAlbums();
