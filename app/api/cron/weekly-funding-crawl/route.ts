import { NextRequest, NextResponse } from 'next/server';
import { runWeeklyFundingCrawl } from '@/lib/funding/service';

export const dynamic = 'force-dynamic';
// 60s was too tight: 6 RSS/HTML source fetches + sequential OpenAI scoring batches
// + DB writes can exceed it when the lookback window has accumulated many
// unscored items (2026-05-18 timeout incident, repro'd 2026-05-24).
// 300s is the Pro-plan ceiling for serverless functions.
export const maxDuration = 300;

/**
 * GET /api/cron/weekly-funding-crawl
 * Vercel Cron entry point. Schedule (vercel.json): "0 21 * * 0"
 *   = Sunday 21:00 UTC = Monday 10:00 NZDT (09:00 NZST during winter).
 * In production, requires Authorization: Bearer ${CRON_SECRET}.
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      console.error('CRON_SECRET not configured');
      return NextResponse.json({ error: 'Cron secret not configured' }, { status: 500 });
    }
    if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return runJob();
}

/**
 * POST /api/cron/weekly-funding-crawl
 * Manual admin trigger (also accepts CRON_SECRET for parity with /api/cron/process-queue).
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!(cronSecret && authHeader === `Bearer ${cronSecret}`)) {
    const { getUser } = await import('@/lib/db/queries');
    const { isUserAdmin } = await import('@/lib/auth/permissions');

    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isAdmin = await isUserAdmin(user.id);
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return runJob({ manual: true });
}

async function runJob(opts: { manual?: boolean } = {}) {
  console.log('[cron] weekly-funding-crawl invoked', {
    manual: opts.manual ?? false,
    at: new Date().toISOString(),
  });
  try {
    const summary = await runWeeklyFundingCrawl();
    console.log('Weekly funding crawl complete', { manual: opts.manual ?? false, ...summary });
    return NextResponse.json({ success: true, manual: opts.manual ?? false, ...summary });
  } catch (error) {
    console.error('Weekly funding crawl failed:', error);
    return NextResponse.json(
      {
        error: 'Weekly funding crawl failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
