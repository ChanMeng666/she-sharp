import { and, gte, isNull } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { fundingOpportunities } from '@/lib/db/schema';
import { fetchAllSources } from './fetcher';
import { persistOpportunities } from './dedup';
import { scoreUnscored } from './scoring';
import { sendFundingDigestNotification } from '@/lib/slack/funding-digest-service';
import type { FetchResult, FundingSourceKey } from './types';

const LOOKBACK_DAYS = 7;

export interface FundingCrawlSummary {
  generatedAt: string;
  durationMs: number;
  totalFetched: number;
  perSource: FetchResult[];
  insertedCount: number;
  updatedCount: number;
  scoredCount: number;
  digestPostedCount: number;
  digestOk: boolean;
  digestReason?: string;
}

/**
 * Top-level orchestrator: fetch → dedup-persist → score new items → post digest.
 * Returns a summary suitable for cron route logging / response body.
 */
export async function runWeeklyFundingCrawl(): Promise<FundingCrawlSummary> {
  const startedAt = Date.now();
  const generatedAt = new Date();

  const { opportunities, perSource } = await fetchAllSources();
  const { inserted, updated } = await persistOpportunities(opportunities);

  // Score everything in the lookback window that still lacks a score —
  // this picks up freshly-inserted rows AND any older ones whose previous scoring failed.
  const lookbackStart = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  const unscored = await db
    .select()
    .from(fundingOpportunities)
    .where(
      and(
        gte(fundingOpportunities.firstSeenAt, lookbackStart),
        isNull(fundingOpportunities.relevanceScore),
      ),
    );
  const scoredCount = await scoreUnscored(unscored);

  // Per-source new-this-week counts for the digest header.
  const perSourceCounts: Partial<Record<FundingSourceKey, number>> = {};
  for (const row of inserted) {
    const key = row.source as FundingSourceKey;
    perSourceCounts[key] = (perSourceCounts[key] ?? 0) + 1;
  }

  const digest = await sendFundingDigestNotification({
    generatedAt,
    totalScanned: opportunities.length,
    totalNewThisWeek: inserted.length,
    perSourceCounts,
  });

  return {
    generatedAt: generatedAt.toISOString(),
    durationMs: Date.now() - startedAt,
    totalFetched: opportunities.length,
    perSource,
    insertedCount: inserted.length,
    updatedCount: updated,
    scoredCount,
    digestPostedCount: digest.postedCount,
    digestOk: digest.ok,
    digestReason: digest.reason,
  };
}
