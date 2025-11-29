import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { getMatchSuggestions, generateMatchesForMentee } from '@/lib/matching/service';
import { db } from '@/lib/db/drizzle';
import { userRoles } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * GET /api/matching/suggestions
 * Gets match suggestions for the current user (if they're a mentee).
 */
export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a mentee
    const [menteeRole] = await db
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, user.id),
          eq(userRoles.roleType, 'mentee'),
          eq(userRoles.isActive, true)
        )
      )
      .limit(1);

    if (!menteeRole) {
      return NextResponse.json(
        { error: 'Only mentees can view match suggestions' },
        { status: 403 }
      );
    }

    const suggestions = await getMatchSuggestions(user.id);

    // If no suggestions, try to generate new ones
    if (suggestions.length === 0) {
      const newMatches = await generateMatchesForMentee(user.id, 5);

      // Return the generated matches (they'll be saved and shown as suggestions)
      return NextResponse.json({
        suggestions: newMatches.map(match => ({
          mentorUserId: match.mentorUserId,
          overallScore: match.overallScore,
          mbtiScore: match.mbtiScore,
          skillScore: match.skillScore,
          goalScore: match.goalScore,
          industryScore: match.industryScore,
          matchingFactors: match.matchingFactors,
        })),
        generated: true,
      });
    }

    return NextResponse.json({
      suggestions: suggestions.map(s => ({
        id: s.match.id,
        mentorUserId: s.match.mentorUserId,
        mentorName: s.mentorName,
        mentorEmail: s.mentorEmail,
        mentorProfile: s.mentorProfile,
        overallScore: parseFloat(s.match.overallScore),
        mbtiScore: s.match.mbtiCompatibilityScore ? parseFloat(s.match.mbtiCompatibilityScore) : null,
        skillScore: s.match.skillMatchScore ? parseFloat(s.match.skillMatchScore) : null,
        goalScore: s.match.goalAlignmentScore ? parseFloat(s.match.goalAlignmentScore) : null,
        industryScore: s.match.industryMatchScore ? parseFloat(s.match.industryMatchScore) : null,
        matchingFactors: s.match.matchingFactors,
        createdAt: s.match.createdAt,
      })),
      generated: false,
    });
  } catch (error) {
    console.error('Error fetching match suggestions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
