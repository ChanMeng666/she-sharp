/**
 * Gallery album data for She Sharp photo gallery.
 * Hydrated from scraped JSON so all galleries stay in sync.
 */

import type { GalleryAlbum } from "@/types/gallery";
import galleriesData from "@/lib/data/json/shesharp_photo_galleries.json";

type ScrapedGallery = (typeof galleriesData)["galleries"][number];

const mapGalleryToAlbum = (gallery: ScrapedGallery): GalleryAlbum => {
  return {
    title: gallery.title,
    // Keep the original human-readable date string from the source.
    date: gallery.date,
    googlePhotosUrl: gallery.galleryUrl,
    // Use the primary cover image URL for the album thumbnail.
    coverImage: gallery.coverImage.url,
  };
};

export const galleryAlbums: GalleryAlbum[] = galleriesData.galleries.map(
  mapGalleryToAlbum,
);
