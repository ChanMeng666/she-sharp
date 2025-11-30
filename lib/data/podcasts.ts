/**
 * Podcast data and helper functions for She Sharp media content
 */

import {
  Podcast,
  PodcastCategory,
  PODCAST_CATEGORIES,
  PODCAST_CATEGORY_LABELS,
} from '@/types/podcast';

export const podcasts: Podcast[] = [
  {
    slug: 'tech-wonderland-holiday-celebration-hannah-weir',
    title:
      "Tech Wonderland: A Holiday Celebration with Google's Performance Lead, Hannah Weir",
    date: 'December 2023',
    duration: '45 min',
    category: 'career-stories',
    coverImage:
      'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65a9cbb3c67fedb1bc802f30_Podcast%20Template%20(1).png',
    spotifyUrl: '#',
    description:
      "Join us for an inspiring conversation with Hannah Weir, Google's Performance Lead, as she shares her journey in tech and insights on building high-performing teams.",
    isFeatured: true,
    episodeNumber: 9,
  },
  {
    slug: 'technological-change-workplace-workforce-impacts',
    title: 'TECHNOLOGICAL CHANGE - WORKPLACE & WORKFORCE IMPACTS',
    date: 'November 2023',
    duration: '52 min',
    category: 'industry-insights',
    coverImage:
      'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/656449f3d01f2e91e441cff0_Podcast%20Template.png',
    spotifyUrl: '#',
    description:
      'Exploring how technological advancements are reshaping the workplace and what it means for the future workforce.',
    isFeatured: true,
    episodeNumber: 8,
  },
  {
    slug: 'inspire-her-te-whakatipuranga-wahine',
    title: 'Inspire Her: Te Whakatipuranga Wahine',
    date: 'October 2023',
    duration: '38 min',
    category: 'inspiration',
    coverImage:
      'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65509ac5a0623d92b00799c5_Group%20480965680%20(1).png',
    spotifyUrl: '#',
    description:
      'Celebrating the achievements of Māori women in technology and their contributions to innovation in Aotearoa.',
    isFeatured: true,
    episodeNumber: 7,
  },
  {
    slug: 'from-burnout-to-balance',
    title: 'From Burnout to Balance',
    date: 'September 2023',
    duration: '41 min',
    category: 'wellbeing',
    coverImage:
      'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6516caff046b6bee332a81b9_Group%20480965692.png',
    spotifyUrl: '#',
    description:
      'Practical strategies for maintaining work-life balance in the demanding tech industry.',
    isFeatured: false,
    episodeNumber: 6,
  },
  {
    slug: 'a-legendairy-career',
    title: 'A Legendairy Career',
    date: 'September 2023',
    duration: '48 min',
    category: 'career-stories',
    coverImage:
      'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64f48bfd055ab00edf0c9575_Event%20Tile_BGs%20(1).png',
    spotifyUrl: '#',
    description:
      'From dairy farming to data science - an unconventional journey into tech.',
    isFeatured: false,
    episodeNumber: 5,
  },
  {
    slug: 'innovation-unleashed-deloitte',
    title: 'Innovation Unleashed with Deloitte',
    date: 'July 2023',
    duration: '55 min',
    category: 'industry-insights',
    coverImage:
      'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64bb8ab537717a195533fc8a_Podcast%20Template%20(3).png',
    spotifyUrl: '#',
    description:
      'Deloitte leaders discuss fostering innovation and creating inclusive tech environments.',
    isFeatured: false,
    episodeNumber: 4,
  },
  {
    slug: 'kickstart-your-career-in-tech-myob',
    title: 'Kickstart Your Career in Tech with MYOB',
    date: 'May 2023',
    duration: '43 min',
    category: 'career-development',
    coverImage:
      'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64926803e40138d6dc0e5c02_Podcast%20Tile_Kickstart%20Your%20Career%20in%20Tech%20with%20MYOB.png',
    spotifyUrl: '#',
    description:
      'Essential tips and insights for launching a successful career in technology.',
    isFeatured: false,
    episodeNumber: 3,
  },
  {
    slug: 'chat-with-fiona-webby-academyex',
    title: 'A Chat with Fiona Webby @ AcademyEX: The New Youniversity',
    date: 'April 2023',
    duration: '50 min',
    category: 'education',
    coverImage:
      'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64926899d771e6ed62e9f52b_Podcast%20Tile_A%20Chat%20with%20Fiona%20Webby.png',
    spotifyUrl: '#',
    description:
      'Reimagining education for the digital age and preparing students for tech careers.',
    isFeatured: false,
    episodeNumber: 2,
  },
  {
    slug: 'iwd-embrace-equality',
    title: 'IWD #EmbraceEquality',
    date: 'April 2023',
    duration: '46 min',
    category: 'diversity-inclusion',
    coverImage:
      'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/649268ebdac5954a754425d5_Podcast%20Tile_IWD%20%23EmbraceEquality.png',
    spotifyUrl: '#',
    description:
      'International Women\'s Day special: Embracing equality in tech and beyond.',
    isFeatured: false,
    episodeNumber: 1,
  },
];

// Helper functions

export function getPodcastBySlug(slug: string): Podcast | undefined {
  return podcasts.find((podcast) => podcast.slug === slug);
}

export function getPodcastsByCategory(category: PodcastCategory): Podcast[] {
  return podcasts.filter((podcast) => podcast.category === category);
}

export function getFeaturedPodcasts(limit?: number): Podcast[] {
  const featured = podcasts.filter((podcast) => podcast.isFeatured);
  return limit ? featured.slice(0, limit) : featured;
}

export function getLatestPodcasts(limit?: number): Podcast[] {
  const sorted = [...podcasts].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB.getTime() - dateA.getTime();
  });
  return limit ? sorted.slice(0, limit) : sorted;
}

export function searchPodcasts(query: string): Podcast[] {
  const lowerQuery = query.toLowerCase();
  return podcasts.filter(
    (podcast) =>
      podcast.title.toLowerCase().includes(lowerQuery) ||
      podcast.description.toLowerCase().includes(lowerQuery) ||
      PODCAST_CATEGORY_LABELS[podcast.category]
        .toLowerCase()
        .includes(lowerQuery)
  );
}

export function getAllPodcastCategories(): PodcastCategory[] {
  const usedCategories = new Set(podcasts.map((podcast) => podcast.category));
  return PODCAST_CATEGORIES.filter((cat) => usedCategories.has(cat));
}

export function getPodcastStats(): {
  total: number;
  featured: number;
  categories: number;
  totalDuration: string;
} {
  const totalMinutes = podcasts.reduce((acc, podcast) => {
    const match = podcast.duration.match(/(\d+)/);
    return acc + (match ? parseInt(match[1], 10) : 0);
  }, 0);

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return {
    total: podcasts.length,
    featured: podcasts.filter((p) => p.isFeatured).length,
    categories: getAllPodcastCategories().length,
    totalDuration: `${hours}h ${minutes}m`,
  };
}

export function getCategoryLabel(category: PodcastCategory): string {
  return PODCAST_CATEGORY_LABELS[category];
}

export { PODCAST_CATEGORIES, PODCAST_CATEGORY_LABELS };
