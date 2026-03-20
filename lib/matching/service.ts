/**
 * AI-Powered Mentor-Mentee Matching Service
 * Integrates OpenAI GPT-4o-mini for intelligent compatibility analysis
 */

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
  notifications,
  mentorProgrammeAssignments,
  programmes,
} from '@/lib/db/schema';
import { eq, and, ne, notInArray, desc, sql, asc } from 'drizzle-orm';
import type {
  MentorMatchInput,
  MenteeMatchInput,
  MatchResult,
  PreFilterResult,
  BatchMatchingOptions,
  BatchMatchingResult,
  MatchingStats,
  MatchSuggestionWithDetails,
  MentorWithCandidates,
} from './types';
import { generateAIMatchWithFallback, isOpenAIConfigured } from './openai-service';
import {
  addToWaitingQueue,
  removeFromQueue,
  getQueueStats,
  getAvailableMentorCapacity,
  getQueueForProcessing,
  incrementMatchAttempts,
  updateQueuePriority,
  getWaitingQueue,
  isInQueue,
  getQueuePosition,
  getEstimatedWaitTime,
} from './queue-service';
import {
  sendMatchApprovalNotifications,
  sendAddedToQueueNotification,
  sendBatchMatchingSummaryToAdmin,
} from './email-service';
import {
  getCachedMentorProfiles,
  setCachedMentorProfiles,
  invalidateStatsCache,
  invalidateAllMatchCaches,
} from './cache';

// Pre-filter threshold (skip AI for pairs below this score)
const PRE_FILTER_THRESHOLD = parseInt(process.env.MATCHING_PRE_FILTER_THRESHOLD || '30');

// Minimum score to create a match suggestion
const MIN_MATCH_SCORE = parseInt(process.env.MATCHING_MIN_SCORE || '50');

/**
 * Get available mentor profiles with form data
 */
async function getAvailableMentors(): Promise<MentorMatchInput[]> {
  // Check cache first
  const cached = await getCachedMentorProfiles<MentorMatchInput>();
  if (cached) {
    return cached;
  }

  const mentors = await db
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
        sql`${mentorProfiles.currentMenteesCount} < ${mentorProfiles.maxMentees}`
      )
    );

  const result: MentorMatchInput[] = mentors.map(m => ({
    userId: m.profile.userId,
    name: m.userName || 'Unknown Mentor',
    mbtiType: m.profile.mbtiType || m.form?.mbtiType || null,
    company: m.form?.company || m.profile.company || null,
    jobTitle: m.form?.jobTitle || m.profile.jobTitle || null,
    yearsExperience: m.form?.yearsExperience ?? m.profile.yearsExperience ?? null,
    softSkillsExpert: (m.form?.softSkillsExpert as string[]) || [],
    industrySkillsExpert: (m.form?.industrySkillsExpert as string[]) || [],
    softSkillsBasic: (m.form?.softSkillsBasic as string[]) || [],
    industrySkillsBasic: (m.form?.industrySkillsBasic as string[]) || [],
    expectedMenteeGoalsLongTerm: m.form?.expectedMenteeGoalsLongTerm || null,
    expectedMenteeGoalsShortTerm: m.form?.expectedMenteeGoalsShortTerm || null,
    preferredMenteeTypes: (m.form?.preferredMenteeTypes as string[]) || [],
    preferredIndustries: (m.form?.preferredIndustries as string[]) || [],
    city: m.form?.city || null,
    preferredMeetingFormat: m.form?.preferredMeetingFormat || null,
    maxMentees: m.profile.maxMentees || 3,
    currentMenteesCount: m.profile.currentMenteesCount || 0,
  }));

  // Cache for 5 minutes
  await setCachedMentorProfiles(result);
  return result;
}

/**
 * Get available mentors assigned to a specific programme
 */
async function getAvailableMentorsForProgramme(programmeId: number): Promise<MentorMatchInput[]> {
  const assignments = await db
    .select({
      mentorUserId: mentorProgrammeAssignments.mentorUserId,
      maxMenteesInProgramme: mentorProgrammeAssignments.maxMenteesInProgramme,
      currentMenteesInProgramme: mentorProgrammeAssignments.currentMenteesInProgramme,
    })
    .from(mentorProgrammeAssignments)
    .where(eq(mentorProgrammeAssignments.programmeId, programmeId));

  if (assignments.length === 0) return [];

  // Filter to mentors with capacity in this programme
  const eligibleAssignments = assignments.filter(
    a => (a.currentMenteesInProgramme || 0) < (a.maxMenteesInProgramme || 2)
  );

  if (eligibleAssignments.length === 0) return [];

  const allMentors = await getAvailableMentors();
  const assignedIds = new Set(eligibleAssignments.map(a => a.mentorUserId));
  return allMentors.filter(m => assignedIds.has(m.userId));
}

/**
 * Get mentee profile with form data
 */
async function getMenteeProfile(menteeUserId: number): Promise<MenteeMatchInput | null> {
  const [menteeData] = await db
    .select({
      profile: menteeProfiles,
      form: menteeFormSubmissions,
      userName: users.name,
    })
    .from(menteeProfiles)
    .innerJoin(users, eq(menteeProfiles.userId, users.id))
    .leftJoin(menteeFormSubmissions, eq(menteeProfiles.userId, menteeFormSubmissions.userId))
    .where(eq(menteeProfiles.userId, menteeUserId))
    .limit(1);

  if (!menteeData) return null;

  return {
    userId: menteeData.profile.userId,
    name: menteeData.userName || 'Unknown Mentee',
    mbtiType: menteeData.profile.mbtiType || menteeData.form?.mbtiType || null,
    currentStage: menteeData.form?.currentStage || null,
    currentJobTitle: menteeData.form?.currentJobTitle || null,
    currentIndustry: menteeData.form?.currentIndustry || null,
    softSkillsBasic: (menteeData.form?.softSkillsBasic as string[]) || [],
    industrySkillsBasic: (menteeData.form?.industrySkillsBasic as string[]) || [],
    softSkillsExpert: (menteeData.form?.softSkillsExpert as string[]) || [],
    industrySkillsExpert: (menteeData.form?.industrySkillsExpert as string[]) || [],
    longTermGoals: menteeData.form?.longTermGoals || null,
    shortTermGoals: menteeData.form?.shortTermGoals || null,
    whyMentor: menteeData.form?.whyMentor || null,
    preferredIndustries: (menteeData.form?.preferredIndustries as string[]) || [],
    city: menteeData.form?.city || null,
    preferredMeetingFormat: menteeData.form?.preferredMeetingFormat || null,
  };
}

/**
 * Get the programmeId for a mentee from their form submission
 */
async function getMenteeProgrammeId(menteeUserId: number): Promise<number | null> {
  const [form] = await db
    .select({ programmeId: menteeFormSubmissions.programmeId })
    .from(menteeFormSubmissions)
    .where(eq(menteeFormSubmissions.userId, menteeUserId))
    .limit(1);
  return form?.programmeId ?? null;
}

/**
 * Deterministic pre-filter to reduce OpenAI API calls
 * Returns pairs that pass the minimum compatibility threshold
 */
function preFilterCandidates(
  mentor: MentorMatchInput,
  mentee: MenteeMatchInput
): PreFilterResult {
  let score = 0;
  let capacityPenalty = 0;

  // Capacity check (mentors closer to capacity get lower priority)
  const capacityRatio = mentor.currentMenteesCount / mentor.maxMentees;
  if (capacityRatio >= 0.8) {
    capacityPenalty = 15;
  } else if (capacityRatio >= 0.5) {
    capacityPenalty = 5;
  }

  // MBTI check (quick compatibility check)
  if (mentor.mbtiType && mentee.mbtiType) {
    score += 15;
  }

  // Skill overlap check
  const mentorSkills = new Set([
    ...mentor.softSkillsExpert.map(s => s.toLowerCase()),
    ...mentor.industrySkillsExpert.map(s => s.toLowerCase()),
  ]);
  const menteeDesiredSkills = [
    ...mentee.softSkillsBasic.map(s => s.toLowerCase()),
    ...mentee.industrySkillsBasic.map(s => s.toLowerCase()),
  ];

  if (mentorSkills.size > 0 && menteeDesiredSkills.length > 0) {
    const matchCount = menteeDesiredSkills.filter(s => mentorSkills.has(s)).length;
    const matchRatio = matchCount / menteeDesiredSkills.length;
    score += Math.round(matchRatio * 40);
  } else {
    score += 20; // Default when skills not specified
  }

  // Industry preference check
  if (mentor.preferredIndustries.length > 0 && mentee.preferredIndustries.length > 0) {
    const hasOverlap = mentor.preferredIndustries.some(i =>
      mentee.preferredIndustries.some(p =>
        p.toLowerCase().includes(i.toLowerCase()) ||
        i.toLowerCase().includes(p.toLowerCase())
      )
    );
    score += hasOverlap ? 20 : 5;
  } else {
    score += 10; // Default when industries not specified
  }

  // Location/meeting format check
  if (mentor.preferredMeetingFormat === 'online' || mentee.preferredMeetingFormat === 'online') {
    score += 15; // Online meetings are always compatible
  } else if (mentor.city && mentee.city) {
    if (mentor.city.toLowerCase() === mentee.city.toLowerCase()) {
      score += 15;
    } else {
      score += 5;
    }
  } else {
    score += 10;
  }

  // Goals specified check
  if (mentee.longTermGoals || mentee.shortTermGoals) {
    score += 10;
  }

  const preScore = Math.max(0, score - capacityPenalty);

  return {
    mentorUserId: mentor.userId,
    menteeUserId: mentee.userId,
    preScore,
    passesFilter: preScore >= PRE_FILTER_THRESHOLD,
    capacityPenalty,
    reason: preScore < PRE_FILTER_THRESHOLD
      ? `Pre-filter score (${preScore}) below threshold (${PRE_FILTER_THRESHOLD})`
      : undefined,
  };
}

/**
 * Generate AI-powered matches for a specific mentee
 */
export async function generateMatchesForMentee(
  menteeUserId: number,
  options: BatchMatchingOptions = {}
): Promise<MatchResult[]> {
  const { maxCandidatesPerMentee = 5, preFilterThreshold = PRE_FILTER_THRESHOLD } = options;

  const mentee = await getMenteeProfile(menteeUserId);
  if (!mentee) {
    console.warn(`Mentee profile not found for user ${menteeUserId}`);
    return [];
  }

  // Get existing relationships to exclude
  const existingRelationships = await db
    .select({ mentorId: mentorshipRelationships.mentorUserId })
    .from(mentorshipRelationships)
    .where(
      and(
        eq(mentorshipRelationships.menteeUserId, menteeUserId),
        ne(mentorshipRelationships.status, 'rejected')
      )
    );

  const excludeMentorIds = new Set(existingRelationships.map(r => r.mentorId));

  // Get available mentors (programme-filtered if applicable)
  const menteeProgrammeId = await getMenteeProgrammeId(menteeUserId);
  const availableMentors = menteeProgrammeId
    ? await getAvailableMentorsForProgramme(menteeProgrammeId)
    : await getAvailableMentors();
  const eligibleMentors = availableMentors.filter(m => !excludeMentorIds.has(m.userId));

  if (eligibleMentors.length === 0) {
    return [];
  }

  // Pre-filter candidates
  const preFilterResults = eligibleMentors.map(mentor =>
    preFilterCandidates(mentor, mentee)
  );

  // Sort by pre-filter score and take top candidates for AI analysis
  const topCandidates = preFilterResults
    .filter(r => r.passesFilter || r.preScore >= preFilterThreshold)
    .sort((a, b) => b.preScore - a.preScore)
    .slice(0, maxCandidatesPerMentee * 2); // Get extra for better AI selection

  if (topCandidates.length === 0) {
    return [];
  }

  const matches: MatchResult[] = [];
  let totalTokens = 0;
  let cacheHits = 0;

  // Generate AI matches for top candidates
  for (const candidate of topCandidates) {
    const mentor = eligibleMentors.find(m => m.userId === candidate.mentorUserId);
    if (!mentor) continue;

    try {
      const { result: aiResult, usage, fromCache, processingTime } =
        await generateAIMatchWithFallback(mentor, mentee);

      if (fromCache) cacheHits++;
      totalTokens += usage.total;

      // Only include matches above minimum score
      if (aiResult.overallScore >= MIN_MATCH_SCORE) {
        matches.push({
          mentorUserId: mentor.userId,
          menteeUserId: mentee.userId,
          overallScore: aiResult.overallScore,
          mbtiScore: aiResult.scores.mbtiCompatibility,
          skillScore: aiResult.scores.skillAlignment,
          goalScore: aiResult.scores.goalAlignment,
          industryScore: aiResult.scores.industryMatch,
          logisticsScore: aiResult.scores.logistics,
          aiExplanation: aiResult.explanation,
          aiRecommendation: aiResult.recommendation,
          confidenceLevel: aiResult.confidenceLevel,
          matchingFactors: {
            strengths: aiResult.matchingFactors.strengths,
            challenges: aiResult.matchingFactors.challenges,
            growthOpportunities: aiResult.matchingFactors.growthOpportunities,
          },
          tokenUsage: usage,
          processingTimeMs: processingTime,
          preFilterScore: candidate.preScore,
          fromCache,
        });
      }
    } catch (error) {
      console.error(`AI matching failed for mentor ${mentor.userId}:`, error);
    }

    // Stop early if we have enough high-quality matches
    if (matches.length >= maxCandidatesPerMentee) break;
  }

  // Sort by overall score
  return matches.sort((a, b) => b.overallScore - a.overallScore);
}

/**
 * Run batch matching for all unmatched mentees or queue processing
 */
export async function runBatchMatching(
  triggeredBy?: number,
  options: BatchMatchingOptions & { programmeId?: number } = {}
): Promise<BatchMatchingResult> {
  const { limit = 50, notifyOnMatch = false } = options;

  // Create matching run record
  const [run] = await db
    .insert(aiMatchingRuns)
    .values({
      runType: options.programmeId ? 'programme_batch' : 'batch',
      status: 'running',
      triggeredBy,
      programmeId: options.programmeId,
      menteesProcessed: 0,
      matchesGenerated: 0,
      totalApiCalls: 0,
      totalTokensUsed: 0,
    })
    .returning();

  const errors: string[] = [];
  let totalProcessed = 0;
  let totalMatches = 0;
  let queueUpdates = 0;
  let cacheHits = 0;
  let totalTokens = 0;
  let totalApiCalls = 0;
  let processingTimes: number[] = [];
  let scores: number[] = [];

  try {
    // Get mentees to process (from queue or unmatched)
    const queueMenteeIds = await getQueueForProcessing(limit);

    let menteesToProcess: number[] = [];

    if (queueMenteeIds.length > 0) {
      menteesToProcess = queueMenteeIds;
    } else {
      // Get unmatched mentees not in queue
      const unmatched = await db
        .select({ userId: menteeProfiles.userId })
        .from(menteeProfiles)
        .where(
          sql`NOT EXISTS (
            SELECT 1 FROM ${mentorshipRelationships}
            WHERE ${mentorshipRelationships.menteeUserId} = ${menteeProfiles.userId}
            AND ${mentorshipRelationships.status} IN ('pending', 'active')
          )`
        )
        .limit(limit);

      menteesToProcess = unmatched.map(m => m.userId);
    }

    // Check available mentor capacity
    const { availableSlots } = await getAvailableMentorCapacity();

    for (const menteeUserId of menteesToProcess) {
      try {
        const matches = await generateMatchesForMentee(menteeUserId, options);
        totalProcessed++;

        // Track metrics
        for (const match of matches) {
          if (match.tokenUsage) totalTokens += match.tokenUsage.total;
          if (match.processingTimeMs) processingTimes.push(match.processingTimeMs);
          if (match.fromCache) cacheHits++;
          else totalApiCalls++;
          scores.push(match.overallScore);
        }

        if (matches.length === 0) {
          // No matches found, add to queue
          const bestScore = 0;
          const { queuePosition } = await addToWaitingQueue(menteeUserId, bestScore, 'No compatible mentors found');
          queueUpdates++;

          // Get mentee info for notification
          const [menteeUser] = await db
            .select({ name: users.name, email: users.email })
            .from(users)
            .where(eq(users.id, menteeUserId))
            .limit(1);

          if (notifyOnMatch && menteeUser?.email) {
            const estimatedWait = await getEstimatedWaitTime(menteeUserId);
            await sendAddedToQueueNotification(
              menteeUser.email,
              menteeUser.name || 'Mentee',
              queuePosition,
              estimatedWait
            );
          }
          continue;
        }

        // Save matches to database
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
              logisticsScore: match.logisticsScore?.toString(),
              aiExplanation: match.aiExplanation,
              aiRecommendation: match.aiRecommendation,
              confidenceLevel: match.confidenceLevel,
              potentialChallenges: match.matchingFactors.challenges,
              suggestedFocusAreas: match.matchingFactors.growthOpportunities,
              matchingFactors: match.matchingFactors,
              processingTimeMs: match.processingTimeMs,
              tokenUsage: match.tokenUsage,
              aiModelVersion: isOpenAIConfigured() ? 'gpt-4o-mini' : 'fallback-v1',
              matchingAlgorithm: 'ai-weighted-composite',
              status: 'pending_review',
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            });
            totalMatches++;
          }
        }

        // Update queue priority with best match score
        const bestScore = matches[0]?.overallScore || 0;
        if (await isInQueue(menteeUserId)) {
          await updateQueuePriority(menteeUserId, bestScore);
          await incrementMatchAttempts(menteeUserId);
          queueUpdates++;
        } else if (availableSlots <= 0) {
          // Add to queue if no slots available
          await addToWaitingQueue(menteeUserId, bestScore, 'Added during batch processing');
          queueUpdates++;
        }

      } catch (error) {
        errors.push(`Mentee ${menteeUserId}: ${String(error)}`);
      }
    }

    // Calculate averages
    const averageScore = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;
    const avgProcessingTime = processingTimes.length > 0
      ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
      : 0;

    // Update run status
    await db
      .update(aiMatchingRuns)
      .set({
        status: 'completed',
        completedAt: new Date(),
        menteesProcessed: totalProcessed,
        matchesGenerated: totalMatches,
        totalApiCalls,
        totalTokensUsed: totalTokens,
        averageProcessingTimeMs: Math.round(avgProcessingTime),
        errorDetails: errors.length > 0 ? {
          errors: errors.map(e => ({
            menteeId: parseInt(e.match(/Mentee (\d+)/)?.[1] || '0'),
            error: e.replace(/^Mentee \d+: /, ''),
            timestamp: new Date().toISOString(),
          }))
        } : null,
        summary: {
          totalMentees: totalProcessed,
          totalMentors: 0,
          matchesCreated: totalMatches,
          averageScore: Math.round(averageScore * 10) / 10,
          errors,
          cacheHits,
          queueUpdates,
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
        metadata: { matchesGenerated: totalMatches, menteesProcessed: totalProcessed },
      });

      // Send summary to admin
      const [admin] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, triggeredBy))
        .limit(1);

      if (admin?.email) {
        await sendBatchMatchingSummaryToAdmin(admin.email, {
          totalProcessed,
          matchesGenerated: totalMatches,
          queueUpdates,
          averageScore,
          errors,
          runId: run.id,
        });
      }
    }

    // Invalidate caches
    await invalidateStatsCache();

    return {
      runId: run.id,
      totalProcessed,
      matchesGenerated: totalMatches,
      queueUpdates,
      cacheHits,
      errors,
      averageScore,
      totalApiCalls,
      totalTokensUsed: totalTokens,
      averageProcessingTimeMs: Math.round(avgProcessingTime),
    };

  } catch (error) {
    // Update run status on error
    await db
      .update(aiMatchingRuns)
      .set({
        status: 'failed',
        completedAt: new Date(),
        errorDetails: {
          errors: [{
            menteeId: 0,
            error: String(error),
            timestamp: new Date().toISOString(),
          }]
        },
        summary: {
          totalMentees: totalProcessed,
          totalMentors: 0,
          matchesCreated: totalMatches,
          averageScore: 0,
          errors: [String(error)],
        },
      })
      .where(eq(aiMatchingRuns.id, run.id));

    throw error;
  }
}

/**
 * Process waiting queue (for cron job)
 */
export async function processWaitingQueue(): Promise<BatchMatchingResult> {
  return runBatchMatching(undefined, {
    limit: 20,
    notifyOnMatch: true,
  });
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
      .select({
        match: aiMatchResults,
        mentorUserName: sql<string>`(SELECT name FROM users WHERE id = ${aiMatchResults.mentorUserId})`,
        mentorUserEmail: sql<string>`(SELECT email FROM users WHERE id = ${aiMatchResults.mentorUserId})`,
        menteeUserName: sql<string>`(SELECT name FROM users WHERE id = ${aiMatchResults.menteeUserId})`,
        menteeUserEmail: sql<string>`(SELECT email FROM users WHERE id = ${aiMatchResults.menteeUserId})`,
        mentorForm: mentorFormSubmissions,
        menteeForm: menteeFormSubmissions,
      })
      .from(aiMatchResults)
      .leftJoin(mentorFormSubmissions, eq(aiMatchResults.mentorUserId, mentorFormSubmissions.userId))
      .leftJoin(menteeFormSubmissions, eq(aiMatchResults.menteeUserId, menteeFormSubmissions.userId))
      .where(eq(aiMatchResults.id, matchId))
      .limit(1);

    // Get names from form submissions first, then fall back to users table
    const mentorName = match?.mentorForm?.fullName || match?.mentorUserName || 'Mentor';
    const mentorEmail = match?.mentorForm?.email || match?.mentorUserEmail || '';
    const menteeName = match?.menteeForm?.fullName || match?.menteeUserName || 'Mentee';
    const menteeEmail = match?.menteeForm?.email || match?.menteeUserEmail || '';

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

    // If approved, create mentorship relationship and send notifications
    if (decision === 'approved') {
      const [relationship] = await db
        .insert(mentorshipRelationships)
        .values({
          mentorUserId: match.match.mentorUserId,
          menteeUserId: match.match.menteeUserId,
          status: 'active',
          startedAt: new Date(),
          programmeId: match.match.programmeId,
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

      // Update mentor's mentee count
      await db
        .update(mentorProfiles)
        .set({
          currentMenteesCount: sql`${mentorProfiles.currentMenteesCount} + 1`,
        })
        .where(eq(mentorProfiles.userId, match.match.mentorUserId));

      // Increment programme assignment count if applicable
      if (match.match.programmeId) {
        await db
          .update(mentorProgrammeAssignments)
          .set({
            currentMenteesInProgramme: sql`${mentorProgrammeAssignments.currentMenteesInProgramme} + 1`,
          })
          .where(
            and(
              eq(mentorProgrammeAssignments.mentorUserId, match.match.mentorUserId),
              eq(mentorProgrammeAssignments.programmeId, match.match.programmeId)
            )
          );
      }

      // Remove mentee from queue if present
      await removeFromQueue(match.match.menteeUserId);

      // Send email notifications
      if (mentorEmail && menteeEmail) {
        await sendMatchApprovalNotifications({
          mentorName,
          mentorEmail,
          menteeName,
          menteeEmail,
          matchScore: parseFloat(match.match.overallScore) || 0,
          aiRecommendation: match.match.aiRecommendation,
          focusAreas: (match.match.suggestedFocusAreas as string[]) || [],
        });
      }

      // Create in-app notifications for both users
      await db.insert(notifications).values([
        {
          userId: match.match.mentorUserId,
          type: 'mentorship',
          title: 'New Mentee Matched!',
          message: `You have been matched with ${menteeName} in the She Sharp Mentorship Programme. View your dashboard to connect.`,
          actionUrl: '/dashboard/mentorship',
          actionLabel: 'View Mentee',
          metadata: {
            relationshipId: relationship.id,
            matchId: matchId,
          },
        },
        {
          userId: match.match.menteeUserId,
          type: 'mentorship',
          title: 'Mentor Match Confirmed!',
          message: `Congratulations! You have been matched with ${mentorName}. Your mentorship journey begins now!`,
          actionUrl: '/dashboard/mentorship',
          actionLabel: 'View Mentor',
          metadata: {
            relationshipId: relationship.id,
            matchId: matchId,
          },
        },
      ]);

      // Log activity
      await db.insert(activityLogs).values({
        userId: reviewerId,
        action: ActivityType.AI_MATCH_CONFIRMED,
        entityType: 'ai_match_result',
        entityId: matchId,
        metadata: { decision, relationshipId: relationship.id },
      });

      // Invalidate caches
      await invalidateAllMatchCaches();

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
 * Get pending matches for admin review with detailed information
 */
export async function getPendingMatches(): Promise<MatchSuggestionWithDetails[]> {
  const results = await db
    .select({
      match: aiMatchResults,
      // User basic info
      mentorName: sql<string>`(SELECT name FROM users WHERE id = ${aiMatchResults.mentorUserId})`,
      mentorEmail: sql<string>`(SELECT email FROM users WHERE id = ${aiMatchResults.mentorUserId})`,
      mentorImage: sql<string>`(SELECT image FROM users WHERE id = ${aiMatchResults.mentorUserId})`,
      menteeName: sql<string>`(SELECT name FROM users WHERE id = ${aiMatchResults.menteeUserId})`,
      menteeEmail: sql<string>`(SELECT email FROM users WHERE id = ${aiMatchResults.menteeUserId})`,
      menteeImage: sql<string>`(SELECT image FROM users WHERE id = ${aiMatchResults.menteeUserId})`,
      // Mentor profile
      mentorProfile: mentorProfiles,
      // Mentor form
      mentorForm: mentorFormSubmissions,
      // Mentee profile
      menteeProfile: menteeProfiles,
      // Mentee form
      menteeForm: menteeFormSubmissions,
    })
    .from(aiMatchResults)
    .leftJoin(mentorProfiles, eq(aiMatchResults.mentorUserId, mentorProfiles.userId))
    .leftJoin(mentorFormSubmissions, eq(aiMatchResults.mentorUserId, mentorFormSubmissions.userId))
    .leftJoin(menteeProfiles, eq(aiMatchResults.menteeUserId, menteeProfiles.userId))
    .leftJoin(menteeFormSubmissions, eq(aiMatchResults.menteeUserId, menteeFormSubmissions.userId))
    .where(eq(aiMatchResults.status, 'pending_review'))
    .orderBy(desc(sql`CAST(${aiMatchResults.overallScore} AS DECIMAL)`));

  return results.map(r => ({
    id: r.match.id,
    mentorUserId: r.match.mentorUserId,
    menteeUserId: r.match.menteeUserId,
    // Priority: form fullName > users.name > 'Unknown'
    mentorName: r.mentorForm?.fullName || r.mentorName || 'Unknown',
    mentorEmail: r.mentorForm?.email || r.mentorEmail || '',
    // Priority: form photoUrl > profile photoUrl > users.image
    mentorImage: r.mentorForm?.photoUrl || r.mentorProfile?.photoUrl || r.mentorImage || null,
    // Priority: form fullName > users.name > 'Unknown'
    menteeName: r.menteeForm?.fullName || r.menteeName || 'Unknown',
    menteeEmail: r.menteeForm?.email || r.menteeEmail || '',
    // Priority: form photoUrl > profile photoUrl > users.image
    menteeImage: r.menteeForm?.photoUrl || r.menteeProfile?.photoUrl || r.menteeImage || null,
    overallScore: parseFloat(r.match.overallScore) || 0,
    mbtiCompatibilityScore: r.match.mbtiCompatibilityScore ? parseFloat(r.match.mbtiCompatibilityScore) : null,
    skillMatchScore: r.match.skillMatchScore ? parseFloat(r.match.skillMatchScore) : null,
    goalAlignmentScore: r.match.goalAlignmentScore ? parseFloat(r.match.goalAlignmentScore) : null,
    industryMatchScore: r.match.industryMatchScore ? parseFloat(r.match.industryMatchScore) : null,
    logisticsScore: r.match.logisticsScore ? parseFloat(r.match.logisticsScore) : null,
    aiExplanation: r.match.aiExplanation,
    aiRecommendation: r.match.aiRecommendation,
    confidenceLevel: r.match.confidenceLevel,
    potentialChallenges: r.match.potentialChallenges as string[] | null,
    suggestedFocusAreas: r.match.suggestedFocusAreas as string[] | null,
    matchingFactors: r.match.matchingFactors as MatchResult['matchingFactors'] | null,
    status: r.match.status as 'pending_review',
    programmeId: r.match.programmeId,
    createdAt: r.match.createdAt,
    // Detailed mentor profile
    mentorProfile: {
      bio: r.mentorProfile?.bio || null,
      mbtiType: r.mentorProfile?.mbtiType || r.mentorForm?.mbtiType || null,
      company: r.mentorProfile?.company || r.mentorForm?.company || null,
      jobTitle: r.mentorProfile?.jobTitle || r.mentorForm?.jobTitle || null,
      yearsExperience: r.mentorProfile?.yearsExperience || r.mentorForm?.yearsExperience || null,
      city: r.mentorForm?.city || null,
      maxMentees: r.mentorProfile?.maxMentees || 3,
      currentMenteesCount: r.mentorProfile?.currentMenteesCount || 0,
      expertiseAreas: r.mentorProfile?.expertiseAreas as string[] || [],
      softSkillsExpert: r.mentorForm?.softSkillsExpert as string[] || [],
      industrySkillsExpert: r.mentorForm?.industrySkillsExpert as string[] || [],
      preferredIndustries: r.mentorForm?.preferredIndustries as string[] || [],
      preferredMeetingFormat: r.mentorForm?.preferredMeetingFormat || null,
    },
    // Detailed mentee profile
    menteeProfile: {
      bio: r.menteeProfile?.bio || null,
      mbtiType: r.menteeProfile?.mbtiType || r.menteeForm?.mbtiType || null,
      careerStage: r.menteeProfile?.careerStage || r.menteeForm?.currentStage || null,
      currentJobTitle: r.menteeForm?.currentJobTitle || null,
      currentIndustry: r.menteeForm?.currentIndustry || null,
      city: r.menteeForm?.city || null,
      learningGoals: r.menteeProfile?.learningGoals as string[] || [],
      softSkillsBasic: r.menteeForm?.softSkillsBasic as string[] || [],
      industrySkillsBasic: r.menteeForm?.industrySkillsBasic as string[] || [],
      preferredIndustries: r.menteeForm?.preferredIndustries as string[] || [],
      longTermGoals: r.menteeForm?.longTermGoals || null,
      shortTermGoals: r.menteeForm?.shortTermGoals || null,
      whyMentor: r.menteeForm?.whyMentor || null,
      preferredMeetingFormat: r.menteeForm?.preferredMeetingFormat || null,
      currentChallenge: r.menteeProfile?.currentChallenge || null,
    },
  }));
}

/**
 * Get matches grouped by mentor for multi-mentee assignment view
 */
export async function getMentorWithCandidates(): Promise<MentorWithCandidates[]> {
  const pendingMatches = await getPendingMatches();

  // Group by mentor
  const mentorMap = new Map<number, MentorWithCandidates>();

  for (const match of pendingMatches) {
    if (!mentorMap.has(match.mentorUserId)) {
      mentorMap.set(match.mentorUserId, {
        mentorUserId: match.mentorUserId,
        mentorName: match.mentorName,
        mentorEmail: match.mentorEmail,
        mentorImage: match.mentorImage,
        company: match.mentorProfile?.company || null,
        jobTitle: match.mentorProfile?.jobTitle || null,
        currentMentees: match.mentorProfile?.currentMenteesCount || 0,
        maxMentees: match.mentorProfile?.maxMentees || 3,
        availableSlots: (match.mentorProfile?.maxMentees || 3) - (match.mentorProfile?.currentMenteesCount || 0),
        candidates: [],
      });
    }

    mentorMap.get(match.mentorUserId)!.candidates.push(match);
  }

  // Sort by available slots (ascending) then by total candidates (descending)
  return Array.from(mentorMap.values())
    .sort((a, b) => {
      if (a.availableSlots !== b.availableSlots) {
        return a.availableSlots - b.availableSlots; // Fewer slots first
      }
      return b.candidates.length - a.candidates.length; // More candidates first
    });
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
 * Get comprehensive matching statistics
 */
export async function getMatchingStats(): Promise<MatchingStats> {
  const [pendingCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(aiMatchResults)
    .where(eq(aiMatchResults.status, 'pending_review'));

  const [approvedCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(aiMatchResults)
    .where(eq(aiMatchResults.status, 'approved'));

  const [rejectedCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(aiMatchResults)
    .where(eq(aiMatchResults.status, 'rejected'));

  const [activeRelationships] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(mentorshipRelationships)
    .where(eq(mentorshipRelationships.status, 'active'));

  const [avgScore] = await db
    .select({ avg: sql<number>`avg(CAST(${aiMatchResults.overallScore} AS DECIMAL))` })
    .from(aiMatchResults)
    .where(eq(aiMatchResults.status, 'approved'));

  const queueStats = await getQueueStats();

  return {
    pendingMatches: pendingCount?.count || 0,
    approvedMatches: approvedCount?.count || 0,
    rejectedMatches: rejectedCount?.count || 0,
    activeRelationships: activeRelationships?.count || 0,
    averageMatchScore: avgScore?.avg ? Math.round(avgScore.avg * 10) / 10 : 0,
    queueLength: queueStats.totalWaiting,
    averageWaitDays: queueStats.averageWaitDays,
    highPriorityCount: queueStats.highPriorityCount,
  };
}

/**
 * Get unmatched mentors (mentors with available capacity who haven't been in pending matches)
 */
export async function getUnmatchedMentors(): Promise<{
  userId: number;
  name: string;
  email: string;
  image: string | null;
  company: string | null;
  jobTitle: string | null;
  yearsExperience: number | null;
  mbtiType: string | null;
  maxMentees: number;
  currentMenteesCount: number;
  availableSlots: number;
  expertiseAreas: string[];
  preferredIndustries: string[];
  city: string | null;
  createdAt: Date;
}[]> {
  const mentors = await db
    .select({
      userId: mentorProfiles.userId,
      name: users.name,
      email: users.email,
      image: users.image,
      profilePhotoUrl: mentorProfiles.photoUrl,
      company: mentorProfiles.company,
      jobTitle: mentorProfiles.jobTitle,
      yearsExperience: mentorProfiles.yearsExperience,
      mbtiType: mentorProfiles.mbtiType,
      maxMentees: mentorProfiles.maxMentees,
      currentMenteesCount: mentorProfiles.currentMenteesCount,
      expertiseAreas: mentorProfiles.expertiseAreas,
      createdAt: users.createdAt,
      formPhotoUrl: mentorFormSubmissions.photoUrl,
      formCompany: mentorFormSubmissions.company,
      formJobTitle: mentorFormSubmissions.jobTitle,
      formYearsExperience: mentorFormSubmissions.yearsExperience,
      formMbtiType: mentorFormSubmissions.mbtiType,
      formPreferredIndustries: mentorFormSubmissions.preferredIndustries,
      formCity: mentorFormSubmissions.city,
    })
    .from(mentorProfiles)
    .innerJoin(users, eq(mentorProfiles.userId, users.id))
    .leftJoin(mentorFormSubmissions, eq(mentorProfiles.userId, mentorFormSubmissions.userId))
    .where(
      and(
        eq(mentorProfiles.isAcceptingMentees, true),
        sql`${mentorProfiles.currentMenteesCount} < ${mentorProfiles.maxMentees}`
      )
    )
    .orderBy(desc(users.createdAt));

  return mentors.map(m => ({
    userId: m.userId,
    name: m.name || 'Unknown',
    email: m.email,
    image: m.formPhotoUrl || m.profilePhotoUrl || m.image || null,
    company: m.formCompany || m.company,
    jobTitle: m.formJobTitle || m.jobTitle,
    yearsExperience: m.formYearsExperience ?? m.yearsExperience,
    mbtiType: m.formMbtiType || m.mbtiType,
    maxMentees: m.maxMentees || 3,
    currentMenteesCount: m.currentMenteesCount || 0,
    availableSlots: (m.maxMentees || 3) - (m.currentMenteesCount || 0),
    expertiseAreas: (m.expertiseAreas as string[]) || [],
    preferredIndustries: (m.formPreferredIndustries as string[]) || [],
    city: m.formCity || null,
    createdAt: m.createdAt,
  }));
}

/**
 * Get unmatched mentees (mentees without active/pending relationships)
 */
export async function getUnmatchedMentees(): Promise<{
  userId: number;
  name: string;
  email: string;
  image: string | null;
  careerStage: string | null;
  currentJobTitle: string | null;
  currentIndustry: string | null;
  mbtiType: string | null;
  preferredIndustries: string[];
  city: string | null;
  createdAt: Date;
  inQueue: boolean;
  queuePosition: number | null;
}[]> {
  // Get mentees without active/pending relationships
  const mentees = await db
    .select({
      userId: menteeProfiles.userId,
      name: users.name,
      email: users.email,
      image: users.image,
      profilePhotoUrl: menteeProfiles.photoUrl,
      careerStage: menteeProfiles.careerStage,
      mbtiType: menteeProfiles.mbtiType,
      createdAt: users.createdAt,
      formPhotoUrl: menteeFormSubmissions.photoUrl,
      formCurrentStage: menteeFormSubmissions.currentStage,
      formCurrentJobTitle: menteeFormSubmissions.currentJobTitle,
      formCurrentIndustry: menteeFormSubmissions.currentIndustry,
      formMbtiType: menteeFormSubmissions.mbtiType,
      formPreferredIndustries: menteeFormSubmissions.preferredIndustries,
      formCity: menteeFormSubmissions.city,
    })
    .from(menteeProfiles)
    .innerJoin(users, eq(menteeProfiles.userId, users.id))
    .leftJoin(menteeFormSubmissions, eq(menteeProfiles.userId, menteeFormSubmissions.userId))
    .where(
      sql`NOT EXISTS (
        SELECT 1 FROM ${mentorshipRelationships}
        WHERE ${mentorshipRelationships.menteeUserId} = ${menteeProfiles.userId}
        AND ${mentorshipRelationships.status} IN ('pending', 'active')
      )`
    )
    .orderBy(desc(users.createdAt));

  // Check queue status for each mentee
  const results = await Promise.all(
    mentees.map(async m => {
      const inQueue = await isInQueue(m.userId);
      const queuePosition = inQueue ? await getQueuePosition(m.userId) : null;

      return {
        userId: m.userId,
        name: m.name || 'Unknown',
        email: m.email,
        image: m.formPhotoUrl || m.profilePhotoUrl || m.image || null,
        careerStage: m.formCurrentStage || m.careerStage,
        currentJobTitle: m.formCurrentJobTitle || null,
        currentIndustry: m.formCurrentIndustry || null,
        mbtiType: m.formMbtiType || m.mbtiType,
        preferredIndustries: (m.formPreferredIndustries as string[]) || [],
        city: m.formCity || null,
        createdAt: m.createdAt,
        inQueue,
        queuePosition,
      };
    })
  );

  return results;
}

/**
 * Run AI matching between manually selected mentor and mentee groups
 */
export async function runManualGroupMatching(
  mentorUserIds: number[],
  menteeUserIds: number[],
  triggeredBy: number
): Promise<BatchMatchingResult> {
  const [run] = await db
    .insert(aiMatchingRuns)
    .values({
      runType: 'manual_group',
      status: 'running',
      triggeredBy,
      menteesProcessed: 0,
      matchesGenerated: 0,
      totalApiCalls: 0,
      totalTokensUsed: 0,
    })
    .returning();

  let totalMatches = 0;
  let totalProcessed = 0;
  const errors: string[] = [];
  let totalTokens = 0;
  let totalApiCalls = 0;
  const processingTimes: number[] = [];
  const scores: number[] = [];

  try {
    // Get mentor profiles from the specified IDs
    const allMentors = await getAvailableMentors();
    const selectedMentors = allMentors.filter(m => mentorUserIds.includes(m.userId));

    for (const menteeUserId of menteeUserIds) {
      try {
        const mentee = await getMenteeProfile(menteeUserId);
        if (!mentee) continue;

        totalProcessed++;

        for (const mentor of selectedMentors) {
          try {
            const { result: aiResult, usage, fromCache, processingTime } =
              await generateAIMatchWithFallback(mentor, mentee);

            totalTokens += usage.total;
            if (!fromCache) totalApiCalls++;
            if (processingTime) processingTimes.push(processingTime);

            if (aiResult.overallScore >= MIN_MATCH_SCORE) {
              // Check if match already exists
              const [existing] = await db
                .select()
                .from(aiMatchResults)
                .where(
                  and(
                    eq(aiMatchResults.mentorUserId, mentor.userId),
                    eq(aiMatchResults.menteeUserId, mentee.userId)
                  )
                )
                .limit(1);

              if (!existing) {
                // Determine programmeId if all mentees share the same programme
                const menteeProgrammeId = await getMenteeProgrammeId(mentee.userId);

                await db.insert(aiMatchResults).values({
                  mentorUserId: mentor.userId,
                  menteeUserId: mentee.userId,
                  overallScore: aiResult.overallScore.toString(),
                  mbtiCompatibilityScore: aiResult.scores.mbtiCompatibility.toString(),
                  skillMatchScore: aiResult.scores.skillAlignment.toString(),
                  goalAlignmentScore: aiResult.scores.goalAlignment.toString(),
                  industryMatchScore: aiResult.scores.industryMatch.toString(),
                  logisticsScore: aiResult.scores.logistics?.toString(),
                  aiExplanation: aiResult.explanation,
                  aiRecommendation: aiResult.recommendation,
                  confidenceLevel: aiResult.confidenceLevel,
                  potentialChallenges: aiResult.matchingFactors.challenges,
                  suggestedFocusAreas: aiResult.matchingFactors.growthOpportunities,
                  matchingFactors: {
                    strengths: aiResult.matchingFactors.strengths,
                    challenges: aiResult.matchingFactors.challenges,
                    growthOpportunities: aiResult.matchingFactors.growthOpportunities,
                  },
                  processingTimeMs: processingTime,
                  tokenUsage: usage,
                  aiModelVersion: isOpenAIConfigured() ? 'gpt-4o-mini' : 'fallback-v1',
                  matchingAlgorithm: 'manual-group-ai',
                  programmeId: menteeProgrammeId,
                  status: 'pending_review',
                  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                });
                totalMatches++;
                scores.push(aiResult.overallScore);
              }
            }
          } catch (error) {
            errors.push(`Mentor ${mentor.userId} x Mentee ${menteeUserId}: ${String(error)}`);
          }
        }
      } catch (error) {
        errors.push(`Mentee ${menteeUserId}: ${String(error)}`);
      }
    }

    const averageScore = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;
    const avgProcessingTime = processingTimes.length > 0
      ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
      : 0;

    await db
      .update(aiMatchingRuns)
      .set({
        status: 'completed',
        completedAt: new Date(),
        menteesProcessed: totalProcessed,
        matchesGenerated: totalMatches,
        totalApiCalls,
        totalTokensUsed: totalTokens,
        averageProcessingTimeMs: Math.round(avgProcessingTime),
        summary: {
          totalMentees: totalProcessed,
          totalMentors: selectedMentors.length,
          matchesCreated: totalMatches,
          averageScore: Math.round(averageScore * 10) / 10,
          errors,
        },
      })
      .where(eq(aiMatchingRuns.id, run.id));

    await invalidateStatsCache();

    return {
      runId: run.id,
      totalProcessed,
      matchesGenerated: totalMatches,
      queueUpdates: 0,
      cacheHits: 0,
      errors,
      averageScore,
      totalApiCalls,
      totalTokensUsed: totalTokens,
      averageProcessingTimeMs: Math.round(avgProcessingTime),
    };
  } catch (error) {
    await db
      .update(aiMatchingRuns)
      .set({
        status: 'failed',
        completedAt: new Date(),
        errorDetails: { errors: [{ menteeId: 0, error: String(error), timestamp: new Date().toISOString() }] },
        summary: { totalMentees: totalProcessed, totalMentors: 0, matchesCreated: totalMatches, averageScore: 0, errors: [String(error)] },
      })
      .where(eq(aiMatchingRuns.id, run.id));
    throw error;
  }
}

// Re-export queue service functions for convenience
export {
  getWaitingQueue,
  getQueueStats,
  getAvailableMentorCapacity,
  isInQueue,
  getQueuePosition,
  getEstimatedWaitTime,
};
