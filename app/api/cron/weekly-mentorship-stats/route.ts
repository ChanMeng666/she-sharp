import { NextRequest, NextResponse } from 'next/server';
import { getMentorshipStatsSnapshot } from '@/lib/mentorship/stats-service';
import { sendMentorshipStatsNotification } from '@/lib/slack/mentorship-stats-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/cron/weekly-mentorship-stats
 * Vercel Cron entry point. Schedule (vercel.json): "0 20 * * 0"
 *   = Sunday 20:00 UTC = Monday 09:00 NZDT (08:00 NZST during winter).
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
 * POST /api/cron/weekly-mentorship-stats
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
  const startedAt = Date.now();
  console.log('[cron] weekly-mentorship-stats invoked', {
    manual: opts.manual ?? false,
    at: new Date().toISOString(),
  });
  try {
    const snapshot = await getMentorshipStatsSnapshot();
    await sendMentorshipStatsNotification(snapshot);

    const durationMs = Date.now() - startedAt;
    console.log('Weekly mentorship stats sent', {
      manual: opts.manual ?? false,
      durationMs,
      mentors: snapshot.mentors,
      mentees: snapshot.mentees,
      activeRelationships: snapshot.activeRelationships,
      waitingQueueLength: snapshot.waitingQueueLength,
    });

    return NextResponse.json({
      success: true,
      manual: opts.manual ?? false,
      timestamp: new Date().toISOString(),
      durationMs,
      snapshot,
    });
  } catch (error) {
    console.error('Weekly mentorship stats cron failed:', error);
    return NextResponse.json(
      {
        error: 'Weekly mentorship stats failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
