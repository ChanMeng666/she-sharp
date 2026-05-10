import Parser from 'rss-parser';
import type { FundingSource, RawOpportunity } from '../types';
import { GETS_RELEVANT_CATEGORY_PREFIXES } from '../keywords';

const FEED_URL = 'https://www.gets.govt.nz/ExternalRSSFeed.htm';

interface GetsItem {
  title?: string;
  link?: string;
  guid?: string;
  contentSnippet?: string;
  content?: string;
  isoDate?: string;
  categories?: string[];
  creator?: string;
}

const parser: Parser<unknown, GetsItem> = new Parser({
  timeout: 25_000,
  headers: { 'User-Agent': 'SheSharp-Funding-Crawler/1.0 (+https://shesharp.org.nz)' },
});

function isCategoryRelevant(categories: string[] | undefined): boolean {
  if (!categories?.length) return false;
  return categories.some((raw) => {
    const code = raw.trim().match(/^(\d{8})/)?.[1];
    if (!code) return false;
    const prefix = code.slice(0, 2);
    return GETS_RELEVANT_CATEGORY_PREFIXES.includes(prefix);
  });
}

export const getsSource: FundingSource = {
  key: 'gets',
  displayName: 'GETS — NZ Government Tenders',
  async fetch(): Promise<RawOpportunity[]> {
    const feed = await parser.parseURL(FEED_URL);
    return (feed.items ?? []).flatMap((item) => {
      const title = item.title?.trim();
      const link = item.link?.trim();
      const guid = (item.guid ?? link ?? title)?.trim();
      if (!title || !link || !guid) return [];

      // Pre-filter: GETS publishes hundreds of tenders weekly across all sectors.
      // Skip anything outside our IT / business services / education / org-services UNSPSC bands.
      if (!isCategoryRelevant(item.categories)) return [];

      return [{
        source: 'gets' as const,
        externalId: guid,
        title,
        url: link,
        summary: item.contentSnippet?.trim() || item.content?.trim(),
        publishedAt: item.isoDate ? new Date(item.isoDate) : undefined,
        rawMetadata: {
          creator: item.creator,
          categories: item.categories,
        },
      }];
    });
  },
};
