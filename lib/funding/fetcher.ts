import type { FetchResult, FundingSource, RawOpportunity } from './types';
import { FUNDING_SOURCES } from './sources';

export interface FetchAllResult {
  opportunities: RawOpportunity[];
  perSource: FetchResult[];
}

/**
 * Fetches all configured funding sources in parallel.
 * Uses Promise.allSettled so a single source failure does not block the others.
 * Each source is responsible for its own internal timeout (25s).
 */
export async function fetchAllSources(
  sources: ReadonlyArray<FundingSource> = FUNDING_SOURCES,
): Promise<FetchAllResult> {
  const settled = await Promise.allSettled(
    sources.map(async (src) => {
      const startedAt = Date.now();
      try {
        const items = await src.fetch();
        return { src, items, durationMs: Date.now() - startedAt, ok: true as const };
      } catch (err) {
        return {
          src,
          error: err instanceof Error ? err.message : String(err),
          durationMs: Date.now() - startedAt,
          ok: false as const,
        };
      }
    }),
  );

  const opportunities: RawOpportunity[] = [];
  const perSource: FetchResult[] = [];

  for (const r of settled) {
    if (r.status !== 'fulfilled') {
      // Should not happen because we catch inside, but handle defensively.
      perSource.push({
        source: 'beehive', // unreachable; placeholder
        status: 'rejected',
        count: 0,
        durationMs: 0,
        error: r.reason instanceof Error ? r.reason.message : String(r.reason),
      });
      continue;
    }
    const v = r.value;
    if (v.ok) {
      opportunities.push(...v.items);
      perSource.push({
        source: v.src.key,
        status: 'fulfilled',
        count: v.items.length,
        durationMs: v.durationMs,
      });
    } else {
      perSource.push({
        source: v.src.key,
        status: 'rejected',
        count: 0,
        durationMs: v.durationMs,
        error: v.error,
      });
    }
  }

  return { opportunities, perSource };
}
