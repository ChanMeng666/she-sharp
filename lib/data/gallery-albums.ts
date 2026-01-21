/**
 * Gallery album data for She Sharp photo gallery
 */

import type { GalleryAlbum } from '@/types/gallery';

const BLOB_BASE_URL = 'https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/public/img';

export const galleryAlbums: GalleryAlbum[] = [
  {
    title: '2025-08 - She# AI Hackathon 2025',
    date: 'Aug 15-16',
    googlePhotosUrl: 'https://photos.app.goo.gl/GUQBZCNDV7X5Jx5d6',
    coverImage: `${BLOB_BASE_URL}/2025-08-AI-Hackathon.jpg`,
  },
  {
    title: '2025-11 - She# & HCLTech Dunedin',
    date: 'Nov 21',
    googlePhotosUrl: 'https://photos.app.goo.gl/krVccsrdhyEeWtSAA',
    coverImage: `${BLOB_BASE_URL}/2025-11-HCLTech-Dunedin.jpg`,
  },
  {
    title: '2025-11 - She# @ Vector',
    date: 'Nov 12',
    googlePhotosUrl: 'https://photos.app.goo.gl/4x8J5DKZLP7WESwq8',
    coverImage: `${BLOB_BASE_URL}/2025-11-Vector.jpg`,
  },
  {
    title: '2025-10 - She# @ Xero with Secure Code Warriors',
    date: 'Oct 3',
    googlePhotosUrl: 'https://photos.app.goo.gl/4CWo8WBuM1rfg63q9',
    coverImage: `${BLOB_BASE_URL}/2025-10-Xero.jpg`,
  },
  // {
  //   title: '2025-09 - She# @ Fonterra',
  //   date: 'Sep 3',
  //   googlePhotosUrl: 'https://photos.app.goo.gl/TYrx8hrvrp4rbAS19',
  //   coverImage: `${BLOB_BASE_URL}/2025-09-Fonterra.jpg`,
  // },
];
