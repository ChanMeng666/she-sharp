import { NextRequest, NextResponse } from 'next/server';
import { processWaitingQueue } from '@/lib/matching/service';
import { expireOldQueueEntries } from '@/lib/matching/queue-service';

/**
 * GET /api/cron/process-queue
 * Cron job endpoint for processing the mentee waiting queue.
 *
 * This endpoint is designed to be called by Vercel Cron or similar services.
 * It requires a valid CRON_SECRET for authentication.
 *
 * Vercel Cron configuration (in vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/process-queue",
 *     "schedule": "0 6 * * *"
 *   }]
 * }
 *
 * This runs daily at 6:00 AM UTC.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // In production, require valid CRON_SECRET
    if (process.env.NODE_ENV === 'production') {
      if (!cronSecret) {
        console.error('CRON_SECRET not configured');
        return NextResponse.json(
          { error: 'Cron secret not configured' },
          { status: 500 }
        );
      }

      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    console.log('Starting queue processing cron job...');
    const startTime = Date.now();

    // First, expire old queue entries
    const expiredCount = await expireOldQueueEntries();
    console.log(`Expired ${expiredCount} old queue entries`);

    // Process the waiting queue
    const result = await processWaitingQueue();

    const duration = Date.now() - startTime;

    console.log('Queue processing completed:', {
      runId: result.runId,
      matchesGenerated: result.matchesGenerated,
      totalProcessed: result.totalProcessed,
      queueUpdates: result.queueUpdates,
      duration: `${duration}ms`,
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      expiredEntries: expiredCount,
      result: {
        runId: result.runId,
        matchesGenerated: result.matchesGenerated,
        totalProcessed: result.totalProcessed,
        queueUpdates: result.queueUpdates,
        cacheHits: result.cacheHits,
        averageScore: result.averageScore,
        totalApiCalls: result.totalApiCalls,
        totalTokensUsed: result.totalTokensUsed,
        averageProcessingTimeMs: result.averageProcessingTimeMs,
        errors: result.errors.length > 0 ? result.errors : undefined,
      },
    });
  } catch (error) {
    console.error('Queue processing cron job failed:', error);
    return NextResponse.json(
      {
        error: 'Queue processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/process-queue
 * Manual trigger for queue processing (admin only).
 *
 * This endpoint allows admins to manually trigger queue processing
 * outside of the scheduled cron job.
 */
export async function POST(request: NextRequest) {
  try {
    // For manual triggers, we accept either cron secret or check for admin session
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Check for cron secret
    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      // Authorized via cron secret
    } else {
      // Otherwise, check for admin session
      const { getUser } = await import('@/lib/db/queries');
      const { isUserAdmin } = await import('@/lib/auth/permissions');

      const user = await getUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const isAdmin = await isUserAdmin(user.id);
      if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    console.log('Manual queue processing triggered...');
    const startTime = Date.now();

    // Parse optional configuration
    let options = {};
    try {
      const body = await request.json();
      options = {
        limit: body.limit,
        notifyOnMatch: body.notifyOnMatch ?? true,
      };
    } catch {
      // Empty body is fine
    }

    // Expire old entries first
    const expiredCount = await expireOldQueueEntries();

    // Process queue with custom options
    const { runBatchMatching } = await import('@/lib/matching/service');
    const result = await runBatchMatching(undefined, {
      ...options,
      notifyOnMatch: true,
    });

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      manual: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      expiredEntries: expiredCount,
      result: {
        runId: result.runId,
        matchesGenerated: result.matchesGenerated,
        totalProcessed: result.totalProcessed,
        queueUpdates: result.queueUpdates,
        cacheHits: result.cacheHits,
        averageScore: result.averageScore,
        errors: result.errors.length > 0 ? result.errors : undefined,
      },
    });
  } catch (error) {
    console.error('Manual queue processing failed:', error);
    return NextResponse.json(
      {
        error: 'Queue processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
