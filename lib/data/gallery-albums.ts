/**
 * Gallery album data and helper functions for She Sharp photo gallery
 *
 * How to add new albums:
 * 1. Create a shared album in Google Photos
 * 2. Get the share link (e.g., https://photos.app.goo.gl/xxx)
 * 3. Add album data to the `galleryAlbums` array below
 * 4. Use a cover image from the album or a local image
 */

import {
  GalleryAlbum,
  AlbumCategory,
  ALBUM_CATEGORIES,
  ALBUM_CATEGORY_LABELS,
} from '@/types/gallery';

export const galleryAlbums: GalleryAlbum[] = [
  {
    id: 'ethnic-advantage-2025',
    title: 'Ethnic Advantage Conference 2025',
    description: 'Celebrating diversity in tech at the Ethnic Advantage Conference',
    coverImage: 'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/684918c467a93421eafe8f3b_unnamed.jpg',
    googlePhotosUrl: 'https://photos.app.goo.gl/4x8J5DKZLP7WESwq8',
    category: 'conferences',
    date: 'June 2025',
    photoCount: 45,
    location: 'Auckland',
    isFeatured: true,
  },
  {
    id: 'myob-tech-week-2025',
    title: 'Tech That Matches Your Vibe: Find Your Perfect Fit',
    description: 'MYOB Tech Week event helping attendees find their perfect tech career match',
    coverImage: 'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/67fd6ff293328e7d586a0200_myOB%20tech%20week%20event.png',
    googlePhotosUrl: 'https://photos.app.goo.gl/4x8J5DKZLP7WESwq8',
    category: 'events',
    date: 'May 2025',
    photoCount: 32,
    location: 'Auckland',
    isFeatured: true,
  },
  {
    id: 'iamremarkable-2025',
    title: '#IAmRemarkable Workshop',
    description: 'Empowering women to speak openly about their accomplishments',
    coverImage: 'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/67ce885e79f6ad76f91dc4a1_Screen%20Shot%202025-03-10%20at%207.36.11%20PM.png',
    googlePhotosUrl: 'https://photos.app.goo.gl/4x8J5DKZLP7WESwq8',
    category: 'workshops',
    date: 'April 2025',
    photoCount: 28,
    location: 'Auckland',
    isFeatured: false,
  },
  {
    id: 'iwd-2025',
    title: "She Sharp & academyEX: International Women's Day",
    description: "International Women's Day celebration with academyEX",
    coverImage: 'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/67db4b3d53a88fa011d49f6e_IWD%20-%20Poster%20(1).png',
    googlePhotosUrl: 'https://photos.app.goo.gl/4x8J5DKZLP7WESwq8',
    category: 'celebrations',
    date: 'March 2025',
    photoCount: 56,
    location: 'Auckland',
    isFeatured: true,
  },
  {
    id: 'google-educator-2024',
    title: 'Google Educator Conference',
    description: 'Annual Google Educator Conference bringing together tech educators',
    coverImage: 'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/67c1393875d438f45786d5d9_Google%20Educator%20Conference.jpg',
    googlePhotosUrl: 'https://photos.app.goo.gl/4x8J5DKZLP7WESwq8',
    category: 'conferences',
    date: 'November 2024',
    photoCount: 42,
    location: 'Auckland',
    isFeatured: false,
  },
  {
    id: 'sustainable-tech-2024',
    title: 'The Role of Technology in Sustainable Development',
    description: 'Exploring how technology drives sustainable development goals',
    coverImage: 'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/67c1388d5ccd8b5bd8b7be0c_The%20Role%20of%20Technology%20in%20Sustainable%20Development.png',
    googlePhotosUrl: 'https://photos.app.goo.gl/4x8J5DKZLP7WESwq8',
    category: 'events',
    date: 'November 2024',
    photoCount: 38,
    location: 'Auckland',
    isFeatured: false,
  },
  {
    id: '10-year-anniversary-2024',
    title: 'She Sharp 10-Year Anniversary',
    description: 'Celebrating 10 years of empowering women in technology',
    coverImage: 'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/67230db0aea4360addb5e13a_10yr.png',
    googlePhotosUrl: 'https://photos.app.goo.gl/4x8J5DKZLP7WESwq8',
    category: 'celebrations',
    date: 'October 2024',
    photoCount: 89,
    location: 'Auckland',
    isFeatured: true,
  },
  {
    id: 'data-ai-workshop-2024',
    title: 'Harness the Power of Data and AI',
    description: 'Workshop on leveraging data and AI for innovation',
    coverImage: 'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66d5745b61e76397cc18bc7f_Harness%20the%20power%20of%20data%20and%20AI.png',
    googlePhotosUrl: 'https://photos.app.goo.gl/4x8J5DKZLP7WESwq8',
    category: 'workshops',
    date: 'August 2024',
    photoCount: 24,
    location: 'Auckland',
    isFeatured: false,
  },
  {
    id: 'fp-hackathon-2024',
    title: 'F&P Hackathon',
    description: 'Fisher & Paykel Hackathon fostering innovation and collaboration',
    coverImage: 'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66acb041bbdbd2a1c9e5e353_F%26P%20Hackathon%20with%20She%23-p-500.png',
    googlePhotosUrl: 'https://photos.app.goo.gl/4x8J5DKZLP7WESwq8',
    category: 'events',
    date: 'July 2024',
    photoCount: 67,
    location: 'Auckland',
    isFeatured: false,
  },
];

// Helper functions

export function getAlbumById(id: string): GalleryAlbum | undefined {
  return galleryAlbums.find((album) => album.id === id);
}

export function getAlbumsByCategory(category: AlbumCategory): GalleryAlbum[] {
  return galleryAlbums.filter((album) => album.category === category);
}

export function getFeaturedAlbums(limit?: number): GalleryAlbum[] {
  const featured = galleryAlbums.filter((album) => album.isFeatured);
  return limit ? featured.slice(0, limit) : featured;
}

export function getLatestAlbums(limit?: number): GalleryAlbum[] {
  const sorted = [...galleryAlbums].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB.getTime() - dateA.getTime();
  });
  return limit ? sorted.slice(0, limit) : sorted;
}

export function searchAlbums(query: string): GalleryAlbum[] {
  const lowerQuery = query.toLowerCase();
  return galleryAlbums.filter(
    (album) =>
      album.title.toLowerCase().includes(lowerQuery) ||
      album.description?.toLowerCase().includes(lowerQuery) ||
      album.location?.toLowerCase().includes(lowerQuery) ||
      ALBUM_CATEGORY_LABELS[album.category].toLowerCase().includes(lowerQuery)
  );
}

export function getAllAlbumCategories(): AlbumCategory[] {
  const usedCategories = new Set(galleryAlbums.map((album) => album.category));
  return ALBUM_CATEGORIES.filter((cat) => usedCategories.has(cat));
}

export function getGalleryStats(): {
  totalAlbums: number;
  totalPhotos: number;
  categories: number;
  featuredAlbums: number;
} {
  const totalPhotos = galleryAlbums.reduce(
    (acc, album) => acc + (album.photoCount || 0),
    0
  );

  return {
    totalAlbums: galleryAlbums.length,
    totalPhotos,
    categories: getAllAlbumCategories().length,
    featuredAlbums: galleryAlbums.filter((a) => a.isFeatured).length,
  };
}

export function getCategoryLabel(category: AlbumCategory): string {
  return ALBUM_CATEGORY_LABELS[category];
}

export { ALBUM_CATEGORIES, ALBUM_CATEGORY_LABELS };
