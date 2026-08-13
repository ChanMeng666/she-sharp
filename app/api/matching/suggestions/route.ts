import { NextRequest, NextResponse } from 'next/server';
import { withRoles, type AuthedContext } from '@/lib/auth/role-middleware';
import { getMatchSuggestions, generateMatchesForMentee } from '@/lib/matching/service';

/**
 * GET /api/matching/suggestions
 * Gets match suggestions for the current user (if they're a mentee).
 */
export const GET = withRoles(
  { requiredRoles: ['mentee'] },
  async (_request: NextRequest, { user }: AuthedContext) => {
  try {
    const suggestions = await getMatchSuggestions(user.id);

    // If no suggestions, try to generate new ones
    if (suggestions.length === 0) {
      const newMatches = await generateMatchesForMentee(user.id, { maxCandidatesPerMentee: 5 });

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
});
