/**
 * Shared types for the NZ funding-opportunities crawler subsystem.
 * Matches the `funding_source` enum in lib/db/schema.ts.
 */

export type FundingSourceKey =
  | 'beehive'
  | 'treasury'
  | 'gets'
  | 'data_govt'
  | 'mbie'
  | 'women_govt';

export interface RawOpportunity {
  source: FundingSourceKey;
  externalId: string;
  title: string;
  url: string;
  summary?: string;
  publishedAt?: Date;
  deadline?: Date;
  rawMetadata?: Record<string, unknown>;
}

export interface ScoredOpportunity extends RawOpportunity {
  relevanceScore: number;
  relevanceReason: string;
}

export interface FundingSource {
  key: FundingSourceKey;
  displayName: string;
  fetch(): Promise<RawOpportunity[]>;
}

export interface FetchResult {
  source: FundingSourceKey;
  status: 'fulfilled' | 'rejected';
  count: number;
  error?: string;
  durationMs: number;
}

export const SOURCE_DISPLAY: Record<FundingSourceKey, { label: string; emoji: string }> = {
  beehive: { label: 'Beehive (Govt News)', emoji: '🐝' },
  treasury: { label: 'Treasury Publications', emoji: '🏛️' },
  gets: { label: 'GETS Tenders', emoji: '📋' },
  data_govt: { label: 'data.govt.nz Catalogue', emoji: '📊' },
  mbie: { label: 'MBIE Funding', emoji: '🔬' },
  women_govt: { label: 'Ministry for Women', emoji: '🟣' },
};
