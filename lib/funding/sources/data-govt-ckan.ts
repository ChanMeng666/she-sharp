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
      const res = await fetch(API_URL, {
        signal: controller.signal,
        headers: { 'User-Agent': 'SheSharp-Funding-Crawler/1.0 (+https://shesharp.org.nz)' },
      });
      if (!res.ok) {
        throw new Error(`CKAN API returned ${res.status}`);
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
