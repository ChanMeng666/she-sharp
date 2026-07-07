/**
 * Gallery type definitions for She Sharp photo albums
 */

export interface GalleryAlbum {
  title: string;
  date: string;
  googlePhotosUrl: string;
  coverImage: string;
  /** Event slug the album is derived from (used to look up archive photos). */
  slug: string;
  /** Extra photos for the card mosaic (event's own photos, else archive set). */
  thumbnails: string[];
}
