import Parser from 'rss-parser';
import type { FundingSource, RawOpportunity } from '../types';

const FEED_URL = 'https://www.treasury.govt.nz/feeds/publications';

const parser = new Parser({
  timeout: 25_000,
  headers: { 'User-Agent': 'SheSharp-Funding-Crawler/1.0 (+https://shesharp.org.nz)' },
});

export const treasurySource: FundingSource = {
  key: 'treasury',
  displayName: 'NZ Treasury Publications',
  async fetch(): Promise<RawOpportunity[]> {
    const feed = await parser.parseURL(FEED_URL);
    return (feed.items ?? []).flatMap((item) => {
      const title = item.title?.trim();
      const link = item.link?.trim();
      const guid = (item.guid ?? link ?? title)?.trim();
      if (!title || !link || !guid) return [];

      return [{
        source: 'treasury',
        externalId: guid,
        title,
        url: link,
        summary: item.contentSnippet?.trim() || item.content?.trim(),
        publishedAt: item.isoDate ? new Date(item.isoDate) : undefined,
        rawMetadata: {
          creator: item.creator,
        },
      }];
    });
  },
};
