/**
 * Posts the weekly NZ funding-opportunities digest to a dedicated Slack channel
 * via Incoming Webhook (SLACK_FUNDING_WEBHOOK_URL → #funding-opportunities).
 *
 * Pattern mirrors lib/slack/mentorship-stats-service.ts.
 */

import { and, gte, isNull, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { fundingOpportunities } from '@/lib/db/schema';
import type { FundingOpportunity } from '@/lib/db/schema';
import type { FundingSourceKey } from '@/lib/funding/types';
import { SOURCE_DISPLAY } from '@/lib/funding/types';

type SlackBlock = Record<string, unknown>;

const MIN_RELEVANCE_SCORE = 60;
const MAX_DIGEST_ITEMS = 10;
const LOOKBACK_DAYS = 7;

function getWebhookUrl(): string | null {
  return process.env.SLACK_FUNDING_WEBHOOK_URL?.trim() || null;
}

function formatDateNzdt(d: Date): string {
  return new Intl.DateTimeFormat('en-NZ', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Pacific/Auckland',
  }).format(d);
}

function formatDeadlineNzdt(d: Date): string {
  return new Intl.DateTimeFormat('en-NZ', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Pacific/Auckland',
  }).format(d);
}

function daysUntil(d: Date): number {
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function deadlineSuffix(d?: Date | null): string {
  if (!d) return '';
  const days = daysUntil(d);
  const date = formatDeadlineNzdt(d);
  if (days < 0) return ` · _closed ${date}_`;
  if (days === 0) return ` · ⚠️ *closes today (${date})*`;
  if (days <= 7) return ` · ⚠️ *closes in ${days}d (${date})*`;
  if (days <= 30) return ` · closes in ${days}d (${date})`;
  return ` · closes ${date}`;
}

interface DigestParams {
  totalScanned: number;
  totalNewThisWeek: number;
  perSourceCounts: Partial<Record<FundingSourceKey, number>>;
  generatedAt: Date;
}

function buildBlocks(items: FundingOpportunity[], params: DigestParams): SlackBlock[] {
  const { generatedAt, totalScanned, totalNewThisWeek, perSourceCounts } = params;

  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `🎯 NZ Funding Opportunities — Week of ${formatDateNzdt(generatedAt)}`,
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: [
          `*${items.length}* high-relevance opportunities for She Sharp this week`,
          `(scanned ${totalScanned} feed items, ${totalNewThisWeek} new in last ${LOOKBACK_DAYS}d)`,
        ].join('\n'),
      },
    },
  ];

  // Per-source breakdown
  const counts = Object.entries(perSourceCounts)
    .filter(([, n]) => (n ?? 0) > 0)
    .map(([k, n]) => {
      const meta = SOURCE_DISPLAY[k as FundingSourceKey];
      return `${meta?.emoji ?? '•'} ${meta?.label ?? k}: ${n}`;
    });
  if (counts.length > 0) {
    blocks.push({
      type: 'context',
      elements: [{ type: 'mrkdwn', text: `New this week — ${counts.join(' · ')}` }],
    });
  }

  if (items.length === 0) {
    blocks.push({ type: 'divider' });
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '_No new opportunities scored ≥ ' + MIN_RELEVANCE_SCORE + ' this week. Try lowering the threshold or expanding the source list._',
      },
    });
    return blocks;
  }

  blocks.push({ type: 'divider' });

  for (const item of items) {
    const meta = SOURCE_DISPLAY[item.source as FundingSourceKey];
    const sourceLabel = `${meta?.emoji ?? '•'} ${meta?.label ?? item.source}`;
    const deadline = deadlineSuffix(item.deadline);
    const score = item.relevanceScore ?? 0;
    const reason = item.relevanceReason ? `\n_${item.relevanceReason}_` : '';

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: [
          `*<${item.url}|${item.title}>*`,
          `${sourceLabel} · score *${score}*${deadline}`,
          reason,
        ].join('\n'),
      },
    });
  }

  blocks.push({ type: 'divider' });
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `_Sources: Beehive · Treasury · GETS · data.govt.nz · MBIE · Ministry for Women. Scored by GPT-4o-mini, threshold ≥ ${MIN_RELEVANCE_SCORE}. Generated ${formatDateNzdt(generatedAt)} NZ time._`,
      },
    ],
  });

  return blocks;
}

export interface DigestSendResult {
  ok: boolean;
  postedCount: number;
  reason?: string;
}

/**
 * Selects high-relevance opportunities first-seen in the last LOOKBACK_DAYS days
 * that have not yet been posted to Slack, posts a digest, and marks them posted.
 */
export async function sendFundingDigestNotification(params: DigestParams): Promise<DigestSendResult> {
  const webhookUrl = getWebhookUrl();
  if (!webhookUrl) {
    console.warn('SLACK_FUNDING_WEBHOOK_URL not configured, skipping funding digest notification');
    return { ok: false, postedCount: 0, reason: 'webhook_not_configured' };
  }

  const lookbackStart = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  const items = await db
    .select()
    .from(fundingOpportunities)
    .where(
      and(
        gte(fundingOpportunities.firstSeenAt, lookbackStart),
        gte(fundingOpportunities.relevanceScore, MIN_RELEVANCE_SCORE),
        isNull(fundingOpportunities.postedToSlackAt),
      ),
    )
    .orderBy(
      sql`${fundingOpportunities.relevanceScore} DESC NULLS LAST`,
      sql`${fundingOpportunities.deadline} ASC NULLS LAST`,
    )
    .limit(MAX_DIGEST_ITEMS);

  const blocks = buildBlocks(items, params);

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error('Funding digest webhook failed:', response.status, body);
      return { ok: false, postedCount: 0, reason: `http_${response.status}` };
    }

    if (items.length > 0) {
      await db
        .update(fundingOpportunities)
        .set({ postedToSlackAt: sql`now()` })
        .where(
          sql`${fundingOpportunities.id} IN (${sql.join(items.map((i) => sql`${i.id}`), sql`, `)})`,
        );
    }

    return { ok: true, postedCount: items.length };
  } catch (error) {
    console.error('Failed to send funding digest Slack notification:', error);
    return { ok: false, postedCount: 0, reason: error instanceof Error ? error.message : 'unknown' };
  }
}
