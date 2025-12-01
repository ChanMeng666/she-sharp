import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { isUserAdmin } from '@/lib/auth/permissions';
import {
  runBatchMatching,
  getPendingMatches,
  getMentorWithCandidates,
  getMatchingRunHistory,
  getMatchingStats,
  reviewMatchSuggestion,
  getWaitingQueue,
  getAvailableMentorCapacity,
} from '@/lib/matching/service';
import { isOpenAIConfigured } from '@/lib/matching/openai-service';
import { isRedisAvailable, getCacheInfo } from '@/lib/matching/cache';

/**
 * Helper to safely serialize data for JSON response
 * Converts Date objects to ISO strings recursively before JSON.stringify
 */
function safeSerialize<T>(obj: T): T {
  function convertDates(value: unknown): unknown {
    if (value === null || value === undefined) {
      return value;
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (Array.isArray(value)) {
      return value.map(convertDates);
    }
    if (typeof value === 'object' && value !== null) {
      const result: Record<string, unknown> = {};
      for (const key of Object.keys(value)) {
        result[key] = convertDates((value as Record<string, unknown>)[key]);
      }
      return result;
    }
    return value;
  }

  return convertDates(obj) as T;
}

/**
 * GET /api/admin/matching
 * Gets pending matches, matching history, stats, and queue information for admin review.
 *
 * Query parameters:
 * - view: 'list' (default) | 'grouped' - How to display matches
 * - includeQueue: 'true' | 'false' - Include queue statistics
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isUserAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'list';
    const includeQueue = searchParams.get('includeQueue') === 'true';

    // Fetch core data in parallel
    const [stats, runHistory, capacity] = await Promise.all([
      getMatchingStats(),
      getMatchingRunHistory(10),
      getAvailableMentorCapacity(),
    ]);

    // Fetch matches based on view preference
    let matchesData;
    if (view === 'grouped') {
      const mentorsWithCandidates = await getMentorWithCandidates();
      matchesData = {
        type: 'grouped',
        mentors: mentorsWithCandidates,
        totalMentors: mentorsWithCandidates.length,
        totalCandidates: mentorsWithCandidates.reduce((sum, m) => sum + m.candidates.length, 0),
      };
    } else {
      const pendingMatches = await getPendingMatches();
      matchesData = {
        type: 'list',
        matches: pendingMatches,
        total: pendingMatches.length,
      };
    }

    // Optionally include queue information
    let queueData = null;
    if (includeQueue) {
      const { entries, total } = await getWaitingQueue(20, 0);
      queueData = {
        entries,
        total,
        stats: {
          totalWaiting: stats.queueLength,
          averageWaitDays: stats.averageWaitDays,
          highPriorityCount: stats.highPriorityCount,
        },
      };
    }

    // System status
    const systemStatus = {
      openaiConfigured: isOpenAIConfigured(),
      redisAvailable: isRedisAvailable(),
      cacheInfo: await getCacheInfo(),
    };

    // Serialize all Date objects before returning JSON
    const responseData = {
      matches: matchesData,
      stats: {
        ...stats,
        mentorCapacity: capacity,
      },
      runHistory,
      queue: queueData,
      systemStatus,
    };

    const serialized = safeSerialize(responseData);
    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error fetching matching data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/matching
 * Runs the batch matching algorithm with optional configuration.
 *
 * Request body:
 * - limit?: number - Maximum mentees to process (default: 50)
 * - maxCandidatesPerMentee?: number - Max mentor candidates per mentee (default: 5)
 * - notifyOnMatch?: boolean - Send email notifications (default: false)
 * - preFilterThreshold?: number - Minimum pre-filter score (default: 30)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isUserAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse optional configuration from request body
    let options = {};
    try {
      const body = await request.json();
      options = {
        limit: body.limit,
        maxCandidatesPerMentee: body.maxCandidatesPerMentee,
        notifyOnMatch: body.notifyOnMatch,
        preFilterThreshold: body.preFilterThreshold,
      };
      // Remove undefined values
      Object.keys(options).forEach(key => {
        if ((options as Record<string, unknown>)[key] === undefined) {
          delete (options as Record<string, unknown>)[key];
        }
      });
    } catch {
      // Empty body is fine, use defaults
    }

    const result = await runBatchMatching(user.id, options);

    return NextResponse.json({
      success: true,
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
    });
  } catch (error) {
    console.error('Error running batch matching:', error);
    return NextResponse.json(
      { error: 'Failed to run matching algorithm' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/matching
 * Reviews a match suggestion (approve/reject).
 *
 * Request body:
 * - matchId: number - The ID of the match to review
 * - decision: 'approved' | 'rejected' - The review decision
 * - notes?: string - Optional review notes
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isUserAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { matchId, decision, notes } = body;

    if (!matchId || !decision) {
      return NextResponse.json(
        { error: 'Match ID and decision are required' },
        { status: 400 }
      );
    }

    if (!['approved', 'rejected'].includes(decision)) {
      return NextResponse.json(
        { error: 'Invalid decision. Must be "approved" or "rejected"' },
        { status: 400 }
      );
    }

    const result = await reviewMatchSuggestion(matchId, decision, user.id, notes);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      relationshipId: result.relationshipId,
      message: decision === 'approved'
        ? 'Match approved! Email notifications have been sent to both parties.'
        : 'Match rejected.',
    });
  } catch (error) {
    console.error('Error reviewing match:', error);
    return NextResponse.json(
      { error: 'Failed to process match review' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/matching
 * Bulk reject multiple matches.
 *
 * Request body:
 * - matchIds: number[] - Array of match IDs to reject
 * - reason?: string - Optional rejection reason
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isUserAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { matchIds, reason } = body;

    if (!matchIds || !Array.isArray(matchIds) || matchIds.length === 0) {
      return NextResponse.json(
        { error: 'matchIds array is required' },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      matchIds.map(id => reviewMatchSuggestion(id, 'rejected', user.id, reason))
    );

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      processed: matchIds.length,
      successful,
      failed,
      message: `Rejected ${successful} match(es)${failed > 0 ? `, ${failed} failed` : ''}.`,
    });
  } catch (error) {
    console.error('Error bulk rejecting matches:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk rejection' },
      { status: 500 }
    );
  }
}
