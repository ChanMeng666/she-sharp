/**
 * News & press data mapped from scraped JSON.
 */

import raw from "@/lib/data/json/shesharp_news_press_with_local_images.json";

export interface NewsPressItem {
  id: number;
  slug: string;
  title: string;
  isoDate: string;
  coverImage: string;
  shortDescription: string;
  externalLink?: string;
}

interface RawNewsItem {
  id: number;
  slug: string;
  title: string;
  date: {
    raw: string;
    month: string;
    year: number;
    isoDate: string;
  };
  coverImage: {
    url: string;
    alt: string;
    localPath: string;
  };
  shortDescription: string;
  externalLink: string;
}

interface RawNewsFile {
  metadata: unknown;
  news: RawNewsItem[];
}

const json = raw as RawNewsFile;

export const newsPressItems: NewsPressItem[] = json.news
  .map((item) => ({
    id: item.id,
    slug: item.slug,
    title: item.title,
    isoDate: item.date.isoDate,
    coverImage: item.coverImage.url,
    shortDescription: item.shortDescription,
    externalLink: item.externalLink || undefined,
  }))
  .sort((a, b) => (a.isoDate < b.isoDate ? 1 : -1));


