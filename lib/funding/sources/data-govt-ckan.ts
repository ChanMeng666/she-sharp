import type { FundingSource, RawOpportunity } from '../types';

const API_URL =
  'https://catalogue.data.govt.nz/api/3/action/package_search?q=funding+OR+grant+OR+scholarship&sort=metadata_modified+desc&rows=25';

interface CkanResource {
  url?: string;
  format?: string;
}

interface CkanResult {
  id: string;
  name: string;
  title: string;
  notes?: string;
  metadata_modified?: string;
  organization?: { title?: string; name?: string };
  resources?: CkanResource[];
}

interface CkanResponse {
  success: boolean;
  result?: { count?: number; results?: CkanResult[] };
}

export const dataGovtSource: FundingSource = {
  key: 'data_govt',
  displayName: 'data.govt.nz Catalogue',
  async fetch(): Promise<RawOpportunity[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);

    try {
      // catalogue.data.govt.nz sits behind Imperva CDN, which blocks generic
      // datacenter clients (Vercel egress) by serving an HTML JS challenge page
      // instead of JSON. Sending browser-realistic headers gets us through in
      // most cases; if Imperva still serves HTML we degrade gracefully rather
      // than throwing.
      const res = await fetch(API_URL, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-NZ,en;q=0.9',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
          'Referer': 'https://catalogue.data.govt.nz/',
        },
      });
      if (!res.ok) {
        throw new Error(`CKAN API returned ${res.status}`);
      }

      const contentType = res.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) {
        console.warn(
          `[funding/data_govt] Imperva served non-JSON (${contentType}); skipping this run`,
        );
        return [];
      }

      const data = (await res.json()) as CkanResponse;
      if (!data.success || !data.result?.results) return [];

      return data.result.results.flatMap((item): RawOpportunity[] => {
        const title = item.title?.trim();
        if (!title || !item.id) return [];
        const url = `https://catalogue.data.govt.nz/dataset/${item.name ?? item.id}`;

        return [{
          source: 'data_govt',
          externalId: item.id,
          title,
          url,
          summary: item.notes?.trim().slice(0, 600),
          publishedAt: item.metadata_modified ? new Date(item.metadata_modified) : undefined,
          rawMetadata: {
            organization: item.organization?.title ?? item.organization?.name,
            resourceCount: item.resources?.length ?? 0,
          },
        }];
      });
    } finally {
      clearTimeout(timeout);
    }
  },
};
