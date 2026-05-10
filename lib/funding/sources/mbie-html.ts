import * as cheerio from 'cheerio';
import type { FundingSource, RawOpportunity } from '../types';

const PAGE_URL =
  'https://www.mbie.govt.nz/science-and-technology/science-and-innovation/open-and-upcoming-science-and-innovation-funding-opportunities';
const ORIGIN = 'https://www.mbie.govt.nz';

const MONTHS: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

/**
 * Parses MBIE-style date strings like "1 July 2026" or "12 noon, 1 July 2026".
 * Returns the LAST date found in the string (intended for closing dates).
 */
function parseLastDate(text: string): Date | undefined {
  const re = /(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/g;
  let last: Date | undefined;
  for (const match of text.matchAll(re)) {
    const day = parseInt(match[1], 10);
    const monthIdx = MONTHS[match[2].toLowerCase()];
    const year = parseInt(match[3], 10);
    if (Number.isFinite(day) && monthIdx !== undefined && Number.isFinite(year)) {
      last = new Date(Date.UTC(year, monthIdx, day));
    }
  }
  return last;
}

export const mbieSource: FundingSource = {
  key: 'mbie',
  displayName: 'MBIE — Open & Upcoming Funding',
  async fetch(): Promise<RawOpportunity[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);

    try {
      const res = await fetch(PAGE_URL, {
        signal: controller.signal,
        headers: { 'User-Agent': 'SheSharp-Funding-Crawler/1.0 (+https://shesharp.org.nz)' },
      });
      if (!res.ok) throw new Error(`MBIE returned ${res.status}`);
      const html = await res.text();
      const $ = cheerio.load(html);

      const items: RawOpportunity[] = [];
      $('div.accordion section').each((_, sectionEl) => {
        const $section = $(sectionEl);
        const title = $section.find('p.toggle-accordion span').first().text().trim();
        if (!title) return;

        const $transcript = $section.find('.transcript').first();
        const transcriptText = $transcript.text();

        // Pull the "More information" link if present, otherwise fall back to the page itself.
        let detailUrl: string | undefined;
        $transcript.find('a[href]').each((_i, a) => {
          if (detailUrl) return;
          const href = $(a).attr('href');
          if (href && href.length > 1) {
            detailUrl = href.startsWith('http') ? href : `${ORIGIN}${href}`;
          }
        });
        const url = detailUrl ?? PAGE_URL;

        // Extract "Application period" paragraph for deadline parsing.
        let appPeriod = '';
        $transcript.find('p').each((_i, p) => {
          const $p = $(p);
          const prev = $p.prev('p').text();
          if (prev.toLowerCase().includes('application period')) {
            appPeriod = $p.text().trim();
          }
        });

        const deadline = appPeriod ? parseLastDate(appPeriod) : undefined;

        // Brief summary: first non-Details paragraph text.
        const summary = transcriptText
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 600);

        items.push({
          source: 'mbie',
          externalId: url,
          title,
          url,
          summary,
          deadline,
          rawMetadata: { applicationPeriod: appPeriod || undefined },
        });
      });

      return items;
    } finally {
      clearTimeout(timeout);
    }
  },
};
