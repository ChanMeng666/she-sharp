/**
 * Waiting Queue Management Service
 * Manages mentees waiting for mentor matches when capacity is limited
 */

import { db } from '@/lib/db/drizzle';
import {
  menteeWaitingQueue,
  menteeProfiles,
  mentorProfiles,
  menteeFormSubmissions,
  users,
} from '@/lib/db/schema';
import { eq, and, desc, asc, sql, ne } from 'drizzle-orm';
import type {
  QueueStatus,
  QueueEntryWithDetails,
  QueueProcessingResult,
} from './types';
import { invalidateQueueCache } from './cache';

// Queue configuration
const QUEUE_EXPIRY_DAYS = parseInt(process.env.MATCHING_QUEUE_EXPIRY_DAYS || '90');

/**
 * Add a mentee to the waiting queue
 */
export async function addToWaitingQueue(
  menteeUserId: number,
  bestMatchScore?: number,
  notes?: string,
  programmeId?: number
): Promise<{ success: boolean; queuePosition: number; queueEntryId: number }> {
  // Check if already in queue
  const [existing] = await db
    .select()
    .from(menteeWaitingQueue)
    .where(
      and(
        eq(menteeWaitingQueue.menteeUserId, menteeUserId),
        eq(menteeWaitingQueue.status, 'waiting')
      )
    )
    .limit(1);

  if (existing) {
    const position = await getQueuePosition(menteeUserId);
    return { success: true, queuePosition: position, queueEntryId: existing.id };
  }

  // Calculate priority based on best potential match score
  // Higher score = higher priority (gets matched sooner)
  const priority = bestMatchScore ? Math.round(bestMatchScore) : 0;

  // Calculate expiry date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + QUEUE_EXPIRY_DAYS);

  const [entry] = await db
    .insert(menteeWaitingQueue)
    .values({
      menteeUserId,
      status: 'waiting',
      priority,
      bestMatchScore: bestMatchScore?.toString(),
      expiresAt,
      notes,
      programmeId,
    })
    .returning();

  // Invalidate cache
  await invalidateQueueCache();

  const position = await getQueuePosition(menteeUserId);
  return { success: true, queuePosition: position, queueEntryId: entry.id };
}

/**
 * Get queue position for a mentee
 * Position is based on priority (score) then join time
 */
export async function getQueuePosition(menteeUserId: number): Promise<number> {
  const [entry] = await db
    .select()
    .from(menteeWaitingQueue)
    .where(
      and(
        eq(menteeWaitingQueue.menteeUserId, menteeUserId),
        eq(menteeWaitingQueue.status, 'waiting')
      )
    )
    .limit(1);

  if (!entry) return -1;

  // Convert Date to ISO string for SQL comparison
  const joinedAtString = entry.joinedAt instanceof Date
    ? entry.joinedAt.toISOString()
    : entry.joinedAt;

  // Count entries with higher priority or same priority but earlier join time
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(menteeWaitingQueue)
    .where(
      and(
        eq(menteeWaitingQueue.status, 'waiting'),
        sql`(
          ${menteeWaitingQueue.priority} > ${entry.priority} OR
          (${menteeWaitingQueue.priority} = ${entry.priority} AND ${menteeWaitingQueue.joinedAt} < ${joinedAtString})
        )`
      )
    );

  return (result?.count || 0) + 1;
}

/**
 * Update queue entry status
 */
export async function updateQueueStatus(
  menteeUserId: number,
  status: QueueStatus,
  bestMatchScore?: number
): Promise<void> {
  const updateData: Partial<{
    status: QueueStatus;
    bestMatchScore: string;
    updatedAt: Date;
    lastMatchAttemptAt: Date;
    matchAttempts: number;
    priority: number;
  }> = {
    status,
    updatedAt: new Date(),
  };

  if (bestMatchScore !== undefined) {
    updateData.bestMatchScore = bestMatchScore.toString();
    updateData.priority = Math.round(bestMatchScore);
  }

  if (status === 'matching_in_progress') {
    updateData.lastMatchAttemptAt = new Date();
  }

  await db
    .update(menteeWaitingQueue)
    .set(updateData)
    .where(eq(menteeWaitingQueue.menteeUserId, menteeUserId));

  await invalidateQueueCache();
}

/**
 * Remove mentee from queue (when matched or cancelled)
 */
export async function removeFromQueue(menteeUserId: number): Promise<void> {
  await db
    .update(menteeWaitingQueue)
    .set({
      status: 'matched',
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(menteeWaitingQueue.menteeUserId, menteeUserId),
        eq(menteeWaitingQueue.status, 'waiting')
      )
    );

  await invalidateQueueCache();
}

/**
 * Cancel queue entry
 */
export async function cancelQueueEntry(menteeUserId: number): Promise<void> {
  await db
    .update(menteeWaitingQueue)
    .set({
      status: 'cancelled',
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(menteeWaitingQueue.menteeUserId, menteeUserId),
        eq(menteeWaitingQueue.status, 'waiting')
      )
    );

  await invalidateQueueCache();
}

/**
 * Increment match attempts for a queue entry
 */
export async function incrementMatchAttempts(menteeUserId: number): Promise<void> {
  await db
    .update(menteeWaitingQueue)
    .set({
      matchAttempts: sql`${menteeWaitingQueue.matchAttempts} + 1`,
      lastMatchAttemptAt: new Date(),
      status: 'waiting',
      updatedAt: new Date(),
    })
    .where(eq(menteeWaitingQueue.menteeUserId, menteeUserId));
}

/**
 * Get waiting queue with details
 */
export async function getWaitingQueue(
  limit: number = 50,
  offset: number = 0,
  programmeId?: number
): Promise<{ entries: QueueEntryWithDetails[]; total: number }> {
  // Get total count
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(menteeWaitingQueue)
    .where(
      programmeId
        ? and(eq(menteeWaitingQueue.status, 'waiting'), eq(menteeWaitingQueue.programmeId, programmeId))
        : eq(menteeWaitingQueue.status, 'waiting')
    );

  const total = countResult?.count || 0;

  // Get entries with details
  const entries = await db
    .select({
      queue: menteeWaitingQueue,
      userName: users.name,
      userEmail: users.email,
      userImage: users.image,
      isTestUser: users.isTestUser,
      profilePhotoUrl: menteeProfiles.photoUrl,
      menteeForm: menteeFormSubmissions,
    })
    .from(menteeWaitingQueue)
    .innerJoin(users, eq(menteeWaitingQueue.menteeUserId, users.id))
    .leftJoin(menteeProfiles, eq(menteeWaitingQueue.menteeUserId, menteeProfiles.userId))
    .leftJoin(menteeFormSubmissions, eq(menteeWaitingQueue.menteeUserId, menteeFormSubmissions.userId))
    .where(
      programmeId
        ? and(eq(menteeWaitingQueue.status, 'waiting'), eq(menteeWaitingQueue.programmeId, programmeId))
        : eq(menteeWaitingQueue.status, 'waiting')
    )
    .orderBy(desc(menteeWaitingQueue.priority), asc(menteeWaitingQueue.joinedAt))
    .limit(limit)
    .offset(offset);

  const now = new Date();
  const entriesWithDetails: QueueEntryWithDetails[] = entries.map(e => ({
    id: e.queue.id,
    menteeUserId: e.queue.menteeUserId,
    menteeName: e.userName || 'Unknown',
    menteeEmail: e.userEmail,
    menteeImage: e.menteeForm?.photoUrl || e.profilePhotoUrl || e.userImage || null,
    joinedAt: e.queue.joinedAt,
    status: e.queue.status as QueueStatus,
    priority: e.queue.priority || 0,
    bestMatchScore: e.queue.bestMatchScore ? parseFloat(e.queue.bestMatchScore) : null,
    matchAttempts: e.queue.matchAttempts || 0,
    waitDays: Math.floor((now.getTime() - new Date(e.queue.joinedAt).getTime()) / (1000 * 60 * 60 * 24)),
    preferredIndustries: (e.menteeForm?.preferredIndustries as string[]) || [],
    careerStage: e.menteeForm?.currentStage || null,
    isTestUser: e.isTestUser,
  }));

  return { entries: entriesWithDetails, total };
}

/**
 * Get queue entries ready for processing (sorted by priority)
 */
export async function getQueueForProcessing(limit: number = 20, programmeId?: number): Promise<number[]> {
  const entries = await db
    .select({ menteeUserId: menteeWaitingQueue.menteeUserId })
    .from(menteeWaitingQueue)
    .innerJoin(users, eq(menteeWaitingQueue.menteeUserId, users.id))
    .where(
      programmeId
        ? and(eq(menteeWaitingQueue.status, 'waiting'), eq(menteeWaitingQueue.programmeId, programmeId), eq(users.isTestUser, false))
        : and(eq(menteeWaitingQueue.status, 'waiting'), eq(users.isTestUser, false))
    )
    .orderBy(desc(menteeWaitingQueue.priority), asc(menteeWaitingQueue.joinedAt))
    .limit(limit);

  return entries.map(e => e.menteeUserId);
}

/**
 * Get queue statistics
 */
export async function getQueueStats(programmeId?: number): Promise<{
  totalWaiting: number;
  averageWaitDays: number;
  highPriorityCount: number;
  expiringSoonCount: number;
}> {
  const [stats] = await db
    .select({
      totalWaiting: sql<number>`count(*)::int`,
      avgWaitDays: sql<number>`coalesce(avg(extract(day from (now() - ${menteeWaitingQueue.joinedAt}))), 0)::int`,
      highPriority: sql<number>`count(*) filter (where ${menteeWaitingQueue.priority} >= 70)::int`,
      expiringSoon: sql<number>`count(*) filter (where ${menteeWaitingQueue.expiresAt} < (now() + interval '7 days'))::int`,
    })
    .from(menteeWaitingQueue)
    .innerJoin(users, eq(menteeWaitingQueue.menteeUserId, users.id))
    .where(
      programmeId
        ? and(eq(menteeWaitingQueue.status, 'waiting'), eq(menteeWaitingQueue.programmeId, programmeId), eq(users.isTestUser, false))
        : and(eq(menteeWaitingQueue.status, 'waiting'), eq(users.isTestUser, false))
    );

  return {
    totalWaiting: stats?.totalWaiting || 0,
    averageWaitDays: stats?.avgWaitDays || 0,
    highPriorityCount: stats?.highPriority || 0,
    expiringSoonCount: stats?.expiringSoon || 0,
  };
}

/**
 * Check available mentor capacity
 */
export async function getAvailableMentorCapacity(): Promise<{
  totalMentors: number;
  totalCapacity: number;
  availableSlots: number;
}> {
  const [stats] = await db
    .select({
      totalMentors: sql<number>`count(*)::int`,
      totalCapacity: sql<number>`sum(${mentorProfiles.maxMentees})::int`,
      usedCapacity: sql<number>`sum(${mentorProfiles.currentMenteesCount})::int`,
    })
    .from(mentorProfiles)
    .where(eq(mentorProfiles.isAcceptingMentees, true));

  const totalCapacity = stats?.totalCapacity || 0;
  const usedCapacity = stats?.usedCapacity || 0;

  return {
    totalMentors: stats?.totalMentors || 0,
    totalCapacity,
    availableSlots: totalCapacity - usedCapacity,
  };
}

/**
 * Expire old queue entries
 */
export async function expireOldQueueEntries(): Promise<number> {
  const result = await db
    .update(menteeWaitingQueue)
    .set({
      status: 'expired',
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(menteeWaitingQueue.status, 'waiting'),
        sql`${menteeWaitingQueue.expiresAt} < now()`
      )
    )
    .returning({ id: menteeWaitingQueue.id });

  if (result.length > 0) {
    await invalidateQueueCache();
  }

  return result.length;
}

/**
 * Update queue priority based on new match score
 */
export async function updateQueuePriority(
  menteeUserId: number,
  newBestScore: number
): Promise<void> {
  await db
    .update(menteeWaitingQueue)
    .set({
      priority: Math.round(newBestScore),
      bestMatchScore: newBestScore.toString(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(menteeWaitingQueue.menteeUserId, menteeUserId),
        eq(menteeWaitingQueue.status, 'waiting')
      )
    );

  await invalidateQueueCache();
}

/**
 * Check if mentee is in queue
 */
export async function isInQueue(menteeUserId: number): Promise<boolean> {
  const [entry] = await db
    .select({ id: menteeWaitingQueue.id })
    .from(menteeWaitingQueue)
    .where(
      and(
        eq(menteeWaitingQueue.menteeUserId, menteeUserId),
        eq(menteeWaitingQueue.status, 'waiting')
      )
    )
    .limit(1);

  return !!entry;
}

/**
 * Get estimated wait time for a mentee
 */
export async function getEstimatedWaitTime(menteeUserId: number): Promise<string> {
  const position = await getQueuePosition(menteeUserId);
  if (position <= 0) return 'Not in queue';

  const { availableSlots } = await getAvailableMentorCapacity();

  if (availableSlots >= position) {
    return 'Ready for matching';
  }

  // Rough estimate: assume 1 new mentor per week
  const weeksToWait = Math.ceil((position - availableSlots) / 2);

  if (weeksToWait <= 1) return 'Within 1 week';
  if (weeksToWait <= 4) return `${weeksToWait} weeks`;
  return `${Math.ceil(weeksToWait / 4)} months`;
}
