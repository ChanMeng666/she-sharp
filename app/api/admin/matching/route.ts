import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { isUserAdmin } from '@/lib/auth/permissions';
import {
  runBatchMatching,
  getPendingMatches,
  getMatchingRunHistory,
  getMatchingStats,
  reviewMatchSuggestion,
} from '@/lib/matching/service';

/**
 * GET /api/admin/matching
 * Gets pending matches, matching history, and stats for admin review.
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

    const [pendingMatchesRaw, runHistory, stats] = await Promise.all([
      getPendingMatches(),
      getMatchingRunHistory(10),
      getMatchingStats(),
    ]);

    // Format pending matches for the UI
    const pendingMatches = pendingMatchesRaw.map(item => ({
      id: item.match.id,
      mentorUserId: item.match.mentorUserId,
      menteeUserId: item.match.menteeUserId,
      mentorName: item.mentorName || 'Unknown Mentor',
      mentorEmail: '',
      menteeName: item.menteeName || 'Unknown Mentee',
      menteeEmail: '',
      overallScore: parseFloat(item.match.overallScore || '0'),
      mbtiScore: item.match.mbtiCompatibilityScore ? parseFloat(item.match.mbtiCompatibilityScore) : undefined,
      skillScore: item.match.skillMatchScore ? parseFloat(item.match.skillMatchScore) : undefined,
      goalScore: item.match.goalAlignmentScore ? parseFloat(item.match.goalAlignmentScore) : undefined,
      industryScore: item.match.industryMatchScore ? parseFloat(item.match.industryMatchScore) : undefined,
      matchingFactors: item.match.matchingFactors || {},
      status: item.match.status,
      createdAt: item.match.createdAt?.toISOString() || new Date().toISOString(),
    }));

    return NextResponse.json({
      pendingMatches,
      runHistory,
      stats,
    });
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
 * Runs the batch matching algorithm.
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

    const result = await runBatchMatching(user.id);

    return NextResponse.json({
      success: true,
      runId: result.runId,
      matchesGenerated: result.matchesGenerated,
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
    });
  } catch (error) {
    console.error('Error reviewing match:', error);
    return NextResponse.json(
      { error: 'Failed to process match review' },
      { status: 500 }
    );
  }
}
