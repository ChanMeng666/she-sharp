/**
 * Gallery type definitions for She Sharp photo albums
 */

export const ALBUM_CATEGORIES = [
  'events',
  'conferences',
  'workshops',
  'networking',
  'celebrations',
] as const;

export type AlbumCategory = (typeof ALBUM_CATEGORIES)[number];

// Display names for categories
export const ALBUM_CATEGORY_LABELS: Record<AlbumCategory, string> = {
  'events': 'Events',
  'conferences': 'Conferences',
  'workshops': 'Workshops',
  'networking': 'Networking',
  'celebrations': 'Celebrations',
};

export interface GalleryAlbum {
  id: string;
  title: string;
  description?: string;
  coverImage: string;
  previewImages?: string[];
  googlePhotosUrl: string;
  category: AlbumCategory;
  date: string;
  photoCount?: number;
  location?: string;
  isFeatured?: boolean;
}
