/**
 * Podcast type definitions for She Sharp media content
 */

export const PODCAST_CATEGORIES = [
  'career-stories',
  'industry-insights',
  'wellbeing',
  'diversity-inclusion',
  'inspiration',
  'career-development',
  'education',
] as const;

export type PodcastCategory = (typeof PODCAST_CATEGORIES)[number];

// Display names for categories
export const PODCAST_CATEGORY_LABELS: Record<PodcastCategory, string> = {
  'career-stories': 'Career Stories',
  'industry-insights': 'Industry Insights',
  'wellbeing': 'Wellbeing',
  'diversity-inclusion': 'Diversity & Inclusion',
  'inspiration': 'Inspiration',
  'career-development': 'Career Development',
  'education': 'Education',
};

export interface PodcastHost {
  name: string;
  title?: string;
  image?: string;
}

export interface PodcastGuest {
  name: string;
  title: string;
  company?: string;
  image?: string;
}

export interface Podcast {
  slug: string;
  title: string;
  description: string;
  date: string;
  duration: string;
  category: PodcastCategory;
  coverImage: string;
  spotifyUrl?: string;
  applePodcastsUrl?: string;
  googlePodcastsUrl?: string;
  youtubeUrl?: string;
  host?: PodcastHost;
  guests?: PodcastGuest[];
  isFeatured?: boolean;
  episodeNumber?: number;
}
