'use server';

import { db } from '@/lib/db/drizzle';
import {
  aiMatchResults,
  aiMatchingRuns,
  mentorProfiles,
  menteeProfiles,
  mentorshipRelationships,
  users,
  mentorFormSubmissions,
  menteeFormSubmissions,
  ActivityType,
  activityLogs,
} from '@/lib/db/schema';
import { eq, and, ne, notInArray, desc, sql, type InferSelectModel } from 'drizzle-orm';

// MBTI Compatibility Matrix (higher score = better match)
const MBTI_COMPATIBILITY: Record<string, Record<string, number>> = {
  // Analysts
  INTJ: { ENFP: 95, ENTP: 90, INFJ: 85, INFP: 80, ENTJ: 75, INTJ: 70, INTP: 65, ENFJ: 60 },
  INTP: { ENTJ: 95, ESTJ: 90, INFJ: 85, INTJ: 80, ENTP: 75, INTP: 70, ENFP: 65, INFP: 60 },
  ENTJ: { INTP: 95, INFP: 90, INTJ: 85, ENTP: 80, ENFJ: 75, ENTJ: 70, INFJ: 65, ISTP: 60 },
  ENTP: { INFJ: 95, INTJ: 90, ENFJ: 85, INTP: 80, ENTP: 75, ENTJ: 70, INFP: 65, ENFP: 60 },
  // Diplomats
  INFJ: { ENTP: 95, ENFP: 90, INTJ: 85, INFP: 80, ENFJ: 75, INFJ: 70, INTP: 65, ENTJ: 60 },
  INFP: { ENFJ: 95, ENTJ: 90, INFJ: 85, ENFP: 80, INFP: 75, INTJ: 70, ENTP: 65, INTP: 60 },
  ENFJ: { INFP: 95, ISFP: 90, ENTP: 85, INFJ: 80, ENFJ: 75, ENFP: 70, INTJ: 65, ENTJ: 60 },
  ENFP: { INTJ: 95, INFJ: 90, ENFJ: 85, ENTP: 80, ENFP: 75, INFP: 70, ENTJ: 65, INTP: 60 },
  // Sentinels
  ISTJ: { ESFP: 95, ESTP: 90, ISFJ: 85, ESTJ: 80, ISTJ: 75, ISTP: 70, ISFP: 65, ENTJ: 60 },
  ISFJ: { ESTP: 95, ESFP: 90, ISTJ: 85, ESFJ: 80, ISFJ: 75, ISFP: 70, ISTP: 65, ENFJ: 60 },
  ESTJ: { ISTP: 95, INTP: 90, ISTJ: 85, ESFJ: 80, ESTJ: 75, ESTP: 70, ISFJ: 65, ENTJ: 60 },
  ESFJ: { ISFP: 95, ISTP: 90, ISFJ: 85, ESTJ: 80, ESFJ: 75, ESFP: 70, ISTJ: 65, ENFJ: 60 },
  // Explorers
  ISTP: { ESFJ: 95, ESTJ: 90, ESTP: 85, ISFP: 80, ISTP: 75, ISTJ: 70, ESFP: 65, ENTJ: 60 },
  ISFP: { ENFJ: 95, ESFJ: 90, ESTP: 85, ISTP: 80, ISFP: 75, ISFJ: 70, ESFP: 65, INFJ: 60 },
  ESTP: { ISFJ: 95, ISTJ: 90, ISTP: 85, ESFP: 80, ESTP: 75, ESTJ: 70, ISFP: 65, ENTJ: 60 },
  ESFP: { ISTJ: 95, ISFJ: 90, ISFP: 85, ESTP: 80, ESFP: 75, ESFJ: 70, ISTP: 65, ENFJ: 60 },
};

// Get default compatibility if not in matrix
function getMBTICompatibility(mentor: string | null, mentee: string | null): number {
  if (!mentor || !mentee) return 50; // Default if no MBTI available
  const mentorUpper = mentor.toUpperCase();
  const menteeUpper = mentee.toUpperCase();
  return MBTI_COMPATIBILITY[mentorUpper]?.[menteeUpper] || 50;
}

// Calculate skill overlap score
function calculateSkillMatch(
  mentorSkills: string[] | null,
  menteeDesiredSkills: string[] | null
): number {
  if (!mentorSkills?.length || !menteeDesiredSkills?.length) return 50;

  const mentorSet = new Set(mentorSkills.map(s => s.toLowerCase()));
  let matchCount = 0;

  for (const skill of menteeDesiredSkills) {
    if (mentorSet.has(skill.toLowerCase())) {
      matchCount++;
    }
  }

  // Score based on percentage of mentee's desired skills that mentor has
  return Math.round((matchCount / menteeDesiredSkills.length) * 100);
}

// Calculate goal alignment score
function calculateGoalAlignment(
  mentorExpectations: string | null,
  menteeGoals: string | null
): number {
  if (!mentorExpectations || !menteeGoals) return 50;

  // Simple keyword matching for now
  const mentorKeywords = extractKeywords(mentorExpectations);
  const menteeKeywords = extractKeywords(menteeGoals);

  if (!mentorKeywords.length || !menteeKeywords.length) return 50;

  const mentorSet = new Set(mentorKeywords);
  let matchCount = 0;

  for (const keyword of menteeKeywords) {
    if (mentorSet.has(keyword)) {
      matchCount++;
    }
  }

  return Math.round((matchCount / menteeKeywords.length) * 100);
}

// Extract keywords from text
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'could', 'should', 'may', 'might', 'must', 'i', 'you', 'he',
    'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our',
    'their', 'this', 'that', 'these', 'those', 'want', 'like', 'need',
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));
}

// Calculate industry match score
function calculateIndustryMatch(
  mentorIndustry: string | null,
  menteePreferredIndustries: string[] | null
): number {
  if (!mentorIndustry || !menteePreferredIndustries?.length) return 50;

  const mentorIndustryLower = mentorIndustry.toLowerCase();

  for (const industry of menteePreferredIndustries) {
    if (industry.toLowerCase() === mentorIndustryLower) {
      return 100;
    }
    // Partial match
    if (industry.toLowerCase().includes(mentorIndustryLower) ||
        mentorIndustryLower.includes(industry.toLowerCase())) {
      return 80;
    }
  }

  return 30;
}

interface MatchResult {
  mentorUserId: number;
  menteeUserId: number;
  overallScore: number;
  mbtiScore: number;
  skillScore: number;
  goalScore: number;
  industryScore: number;
  matchingFactors: {
    mbti?: { mentorType: string; menteeType: string; compatibilityReason: string };
    skills?: { matchedSkills: string[]; complementarySkills: string[] };
    goals?: { alignedGoals: string[]; mentorCanHelp: string[] };
    industry?: { mentorIndustries: string[]; menteePreferred: string[]; overlap: string[] };
  };
}

/**
 * Generate AI matches for a specific mentee
 */
export async function generateMatchesForMentee(
  menteeUserId: number,
  limit: number = 5
): Promise<MatchResult[]> {
  // Get mentee profile and form data
  const [menteeProfile] = await db
    .select()
    .from(menteeProfiles)
    .where(eq(menteeProfiles.userId, menteeUserId))
    .limit(1);

  const [menteeForm] = await db
    .select()
    .from(menteeFormSubmissions)
    .where(eq(menteeFormSubmissions.userId, menteeUserId))
    .limit(1);

  if (!menteeProfile && !menteeForm) {
    return [];
  }

  // Get existing relationships for this mentee
  const existingRelationships = await db
    .select({ mentorId: mentorshipRelationships.mentorUserId })
    .from(mentorshipRelationships)
    .where(
      and(
        eq(mentorshipRelationships.menteeUserId, menteeUserId),
        ne(mentorshipRelationships.status, 'rejected')
      )
    );

  const excludeMentorIds = existingRelationships.map(r => r.mentorId);

  // Get all available mentors (accepting mentees and not at capacity)
  const availableMentors = await db
    .select({
      profile: mentorProfiles,
      form: mentorFormSubmissions,
      userName: users.name,
    })
    .from(mentorProfiles)
    .innerJoin(users, eq(mentorProfiles.userId, users.id))
    .leftJoin(mentorFormSubmissions, eq(mentorProfiles.userId, mentorFormSubmissions.userId))
    .where(
      and(
        eq(mentorProfiles.isAcceptingMentees, true),
        sql`${mentorProfiles.currentMenteesCount} < ${mentorProfiles.maxMentees}`,
        excludeMentorIds.length > 0
          ? notInArray(mentorProfiles.userId, excludeMentorIds)
          : undefined
      )
    );

  if (!availableMentors.length) {
    return [];
  }

  const matches: MatchResult[] = [];

  for (const mentor of availableMentors) {
    // Calculate individual scores
    const mentorMbti = mentor.profile.mbtiType || mentor.form?.mbtiType || null;
    const menteeMbti = menteeProfile?.mbtiType || menteeForm?.mbtiType || null;
    const mbtiScore = getMBTICompatibility(mentorMbti, menteeMbti);

    const mentorSkills = [
      ...(mentor.form?.softSkillsExpert || []),
      ...(mentor.form?.industrySkillsExpert || []),
    ];
    const menteeDesiredSkills = [
      ...(menteeForm?.softSkillsBasic || []),
      ...(menteeForm?.industrySkillsBasic || []),
    ];
    const skillScore = calculateSkillMatch(mentorSkills, menteeDesiredSkills);

    const goalScore = calculateGoalAlignment(
      mentor.form?.expectedMenteeGoalsLongTerm || null,
      menteeForm?.longTermGoals || null
    );

    const mentorIndustry = mentor.form?.company || mentor.profile.company || null;
    const menteeIndustries = menteeForm?.preferredIndustries as string[] | null;
    const industryScore = calculateIndustryMatch(mentorIndustry, menteeIndustries);

    // Calculate weighted overall score
    const overallScore = Math.round(
      mbtiScore * 0.25 +
      skillScore * 0.35 +
      goalScore * 0.25 +
      industryScore * 0.15
    );

    const matchedSkills = mentorSkills.filter(s =>
      menteeDesiredSkills.some(d => d.toLowerCase() === s.toLowerCase())
    );

    matches.push({
      mentorUserId: mentor.profile.userId,
      menteeUserId,
      overallScore,
      mbtiScore,
      skillScore,
      goalScore,
      industryScore,
      matchingFactors: {
        mbti: {
          mentorType: mentorMbti || 'Unknown',
          menteeType: menteeMbti || 'Unknown',
          compatibilityReason: mbtiScore > 70 ? 'High compatibility' : mbtiScore > 40 ? 'Moderate compatibility' : 'Complementary types',
        },
        skills: {
          matchedSkills,
          complementarySkills: mentorSkills.filter(s => !matchedSkills.includes(s)),
        },
        goals: {
          alignedGoals: goalScore > 70 ? ['Strong alignment'] : goalScore > 40 ? ['Moderate alignment'] : ['Exploring common ground'],
          mentorCanHelp: goalScore > 50 ? ['Career guidance', 'Skill development'] : ['General mentorship'],
        },
        industry: {
          mentorIndustries: mentorIndustry ? [mentorIndustry] : [],
          menteePreferred: menteeIndustries || [],
          overlap: industryScore === 100 ? ['Exact match'] : industryScore > 60 ? ['Related field'] : [],
        },
      },
    });
  }

  // Sort by overall score and return top matches
  return matches
    .sort((a, b) => b.overallScore - a.overallScore)
    .slice(0, limit);
}

/**
 * Run matching algorithm for all unmatched mentees
 */
export async function runBatchMatching(
  triggeredBy?: number
): Promise<{ runId: number; matchesGenerated: number }> {
  // Create matching run record
  const [run] = await db
    .insert(aiMatchingRuns)
    .values({
      runType: 'batch',
      status: 'running',
      triggeredBy,
      menteesProcessed: 0,
      matchesGenerated: 0,
    })
    .returning();

  try {
    // Get all mentees without active mentors
    const menteesWithoutMentors = await db
      .select({ userId: menteeProfiles.userId })
      .from(menteeProfiles)
      .where(
        sql`NOT EXISTS (
          SELECT 1 FROM ${mentorshipRelationships}
          WHERE ${mentorshipRelationships.menteeUserId} = ${menteeProfiles.userId}
          AND ${mentorshipRelationships.status} IN ('pending', 'active')
        )`
      );

    let totalMatches = 0;
    let processed = 0;

    for (const mentee of menteesWithoutMentors) {
      const matches = await generateMatchesForMentee(mentee.userId, 3);

      for (const match of matches) {
        // Check if match already exists
        const [existing] = await db
          .select()
          .from(aiMatchResults)
          .where(
            and(
              eq(aiMatchResults.mentorUserId, match.mentorUserId),
              eq(aiMatchResults.menteeUserId, match.menteeUserId)
            )
          )
          .limit(1);

        if (!existing) {
          await db.insert(aiMatchResults).values({
            mentorUserId: match.mentorUserId,
            menteeUserId: match.menteeUserId,
            overallScore: match.overallScore.toString(),
            mbtiCompatibilityScore: match.mbtiScore.toString(),
            skillMatchScore: match.skillScore.toString(),
            goalAlignmentScore: match.goalScore.toString(),
            industryMatchScore: match.industryScore.toString(),
            matchingFactors: match.matchingFactors,
            aiModelVersion: 'v1.0',
            matchingAlgorithm: 'weighted-composite',
            status: 'pending_review',
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          });
          totalMatches++;
        }
      }

      processed++;
    }

    // Update run status
    await db
      .update(aiMatchingRuns)
      .set({
        status: 'completed',
        completedAt: new Date(),
        menteesProcessed: processed,
        matchesGenerated: totalMatches,
        summary: {
          totalMentees: processed,
          totalMentors: 0, // Could be calculated if needed
          matchesCreated: totalMatches,
          averageScore: 0, // Could be calculated from actual scores
          errors: [],
        },
      })
      .where(eq(aiMatchingRuns.id, run.id));

    // Log activity
    if (triggeredBy) {
      await db.insert(activityLogs).values({
        userId: triggeredBy,
        action: ActivityType.AI_MATCH_GENERATED,
        entityType: 'ai_matching_run',
        entityId: run.id,
        metadata: { matchesGenerated: totalMatches, menteesProcessed: processed },
      });
    }

    return { runId: run.id, matchesGenerated: totalMatches };
  } catch (error) {
    // Update run status on error
    await db
      .update(aiMatchingRuns)
      .set({
        status: 'failed',
        completedAt: new Date(),
        summary: {
          totalMentees: 0,
          totalMentors: 0,
          matchesCreated: 0,
          averageScore: 0,
          errors: [String(error)],
        },
      })
      .where(eq(aiMatchingRuns.id, run.id));

    throw error;
  }
}

/**
 * Get match suggestions for a mentee
 */
export async function getMatchSuggestions(menteeUserId: number) {
  return db
    .select({
      match: aiMatchResults,
      mentorName: users.name,
      mentorEmail: users.email,
      mentorProfile: mentorProfiles,
    })
    .from(aiMatchResults)
    .innerJoin(users, eq(aiMatchResults.mentorUserId, users.id))
    .leftJoin(mentorProfiles, eq(aiMatchResults.mentorUserId, mentorProfiles.userId))
    .where(
      and(
        eq(aiMatchResults.menteeUserId, menteeUserId),
        eq(aiMatchResults.status, 'pending_review')
      )
    )
    .orderBy(desc(sql`CAST(${aiMatchResults.overallScore} AS DECIMAL)`));
}

/**
 * Approve or reject a match suggestion
 */
export async function reviewMatchSuggestion(
  matchId: number,
  decision: 'approved' | 'rejected',
  reviewerId: number,
  notes?: string
): Promise<{ success: boolean; relationshipId?: number; error?: string }> {
  try {
    const [match] = await db
      .select()
      .from(aiMatchResults)
      .where(eq(aiMatchResults.id, matchId))
      .limit(1);

    if (!match) {
      return { success: false, error: 'Match not found' };
    }

    // Update match status
    await db
      .update(aiMatchResults)
      .set({
        status: decision,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        reviewNotes: notes,
        updatedAt: new Date(),
      })
      .where(eq(aiMatchResults.id, matchId));

    // If approved, create mentorship relationship
    if (decision === 'approved') {
      const [relationship] = await db
        .insert(mentorshipRelationships)
        .values({
          mentorUserId: match.mentorUserId,
          menteeUserId: match.menteeUserId,
          status: 'pending',
        })
        .returning();

      // Update match with relationship ID
      await db
        .update(aiMatchResults)
        .set({
          relationshipId: relationship.id,
          status: 'active',
        })
        .where(eq(aiMatchResults.id, matchId));

      // Log activity
      await db.insert(activityLogs).values({
        userId: reviewerId,
        action: ActivityType.AI_MATCH_CONFIRMED,
        entityType: 'ai_match_result',
        entityId: matchId,
        metadata: { decision, relationshipId: relationship.id },
      });

      return { success: true, relationshipId: relationship.id };
    }

    // Log rejection
    await db.insert(activityLogs).values({
      userId: reviewerId,
      action: ActivityType.AI_MATCH_CONFIRMED,
      entityType: 'ai_match_result',
      entityId: matchId,
      metadata: { decision, notes },
    });

    return { success: true };
  } catch (error) {
    console.error('Error reviewing match suggestion:', error);
    return { success: false, error: 'Failed to process match review' };
  }
}

/**
 * Get pending matches for admin review
 */
export async function getPendingMatches() {
  return db
    .select({
      match: aiMatchResults,
      mentorName: sql<string>`(SELECT name FROM users WHERE id = ${aiMatchResults.mentorUserId})`,
      menteeName: sql<string>`(SELECT name FROM users WHERE id = ${aiMatchResults.menteeUserId})`,
    })
    .from(aiMatchResults)
    .where(eq(aiMatchResults.status, 'pending_review'))
    .orderBy(desc(sql`CAST(${aiMatchResults.overallScore} AS DECIMAL)`));
}

/**
 * Get matching run history
 */
export async function getMatchingRunHistory(limit: number = 10) {
  return db
    .select()
    .from(aiMatchingRuns)
    .orderBy(desc(aiMatchingRuns.createdAt))
    .limit(limit);
}

/**
 * Get matching statistics
 */
export async function getMatchingStats() {
  const [pendingCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(aiMatchResults)
    .where(eq(aiMatchResults.status, 'pending_review'));

  const [approvedCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(aiMatchResults)
    .where(eq(aiMatchResults.status, 'approved'));

  const [rejectedCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(aiMatchResults)
    .where(eq(aiMatchResults.status, 'rejected'));

  const [activeRelationships] = await db
    .select({ count: sql<number>`count(*)` })
    .from(mentorshipRelationships)
    .where(eq(mentorshipRelationships.status, 'active'));

  const [avgScore] = await db
    .select({ avg: sql<number>`avg(CAST(${aiMatchResults.overallScore} AS DECIMAL))` })
    .from(aiMatchResults)
    .where(eq(aiMatchResults.status, 'approved'));

  return {
    pendingMatches: Number(pendingCount?.count) || 0,
    approvedMatches: Number(approvedCount?.count) || 0,
    rejectedMatches: Number(rejectedCount?.count) || 0,
    activeRelationships: Number(activeRelationships?.count) || 0,
    averageMatchScore: Number(avgScore?.avg) || 0,
  };
}
