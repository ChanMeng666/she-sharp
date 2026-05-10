import * as cheerio from 'cheerio';
import type { FundingSource, RawOpportunity } from '../types';

const PAGE_URL = 'https://www.women.govt.nz/news';
const ORIGIN = 'https://www.women.govt.nz';

export const womenGovtSource: FundingSource = {
  key: 'women_govt',
  displayName: 'Ministry for Women — News',
  async fetch(): Promise<RawOpportunity[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);

    try {
      const res = await fetch(PAGE_URL, {
        signal: controller.signal,
        headers: { 'User-Agent': 'SheSharp-Funding-Crawler/1.0 (+https://shesharp.org.nz)' },
      });
      if (!res.ok) throw new Error(`Ministry for Women returned ${res.status}`);
      const html = await res.text();
      const $ = cheerio.load(html);

      const items: RawOpportunity[] = [];
      $('h2.heading-5-brand a[href^="/news/"]').each((_, el) => {
        const $a = $(el);
        const title = $a.text().trim();
        const href = $a.attr('href');
        if (!title || !href) return;

        const $article = $a.closest('article, .views-row, li, div').first();
        const dateAttr = $article.find('time[datetime]').first().attr('datetime');
        const badge = $article.find('.badge-secondary').first().text().trim();

        const url = href.startsWith('http') ? href : `${ORIGIN}${href}`;
        items.push({
          source: 'women_govt',
          externalId: url,
          title,
          url,
          publishedAt: dateAttr ? new Date(dateAttr) : undefined,
          rawMetadata: badge ? { category: badge } : undefined,
        });
      });

      return items;
    } finally {
      clearTimeout(timeout);
    }
  },
};
