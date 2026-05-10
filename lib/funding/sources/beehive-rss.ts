import Parser from 'rss-parser';
import type { FundingSource, RawOpportunity } from '../types';

const FEED_URL = 'https://www.beehive.govt.nz/rss.xml';

const parser = new Parser({
  timeout: 25_000,
  headers: { 'User-Agent': 'SheSharp-Funding-Crawler/1.0 (+https://shesharp.org.nz)' },
});

export const beehiveSource: FundingSource = {
  key: 'beehive',
  displayName: 'Beehive (NZ Government News)',
  async fetch(): Promise<RawOpportunity[]> {
    const feed = await parser.parseURL(FEED_URL);
    return (feed.items ?? []).flatMap((item) => {
      const title = item.title?.trim();
      const link = item.link?.trim();
      const guid = (item.guid ?? link ?? title)?.trim();
      if (!title || !link || !guid) return [];

      return [{
        source: 'beehive',
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
