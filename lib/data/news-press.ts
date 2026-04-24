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

// Known broken links: the scraped URL was live at scrape time but the destination
// has since 404'd or moved. Verified 2026-04-24.
const BROKEN_LINKS = new Set<string>([
  // DiversityWorks rebranded to Te Uru Tāngata Workplace Inclusion and the
  // individual case study page is no longer hosted under either domain.
  "https://diversityworksnz.org.nz/case-studies/2019-diversity-awards-nz/empowerment-she-sharp/",
]);

export const newsPressItems: NewsPressItem[] = json.news
  .map((item) => {
    const link = item.externalLink && !BROKEN_LINKS.has(item.externalLink)
      ? item.externalLink
      : undefined;
    return {
      id: item.id,
      slug: item.slug,
      title: item.title,
      isoDate: item.date.isoDate,
      coverImage: item.coverImage.url,
      shortDescription: item.shortDescription,
      externalLink: link,
    };
  })
  .sort((a, b) => (a.isoDate < b.isoDate ? 1 : -1));


