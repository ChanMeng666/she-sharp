'use server';

import { db } from '@/lib/db/drizzle';
import {
  userPoints,
  pointsTransactions,
  experienceLevels,
  milestones,
  userMilestones,
  pointsRules,
  ActivityType,
  activityLogs,
} from '@/lib/db/schema';
import { eq, and, desc, type InferSelectModel } from 'drizzle-orm';

// Infer the UserPoints type from the schema
type UserPointsRecord = InferSelectModel<typeof userPoints>;

// =======================
// User Points Operations
// =======================

/**
 * Gets or creates user points record.
 */
export async function getUserPoints(userId: number): Promise<UserPointsRecord> {
  const [existing] = await db
    .select()
    .from(userPoints)
    .where(eq(userPoints.userId, userId))
    .limit(1);

  if (existing) {
    return existing;
  }

  // Create initial points record
  const [newPoints] = await db
    .insert(userPoints)
    .values({
      userId,
      currentPoints: 0,
      lifetimePoints: 0,
      experienceLevel: 1,
      experienceLevelName: 'Newcomer',
      eventsAttended: 0,
      meetingsCompleted: 0,
    })
    .returning();

  return newPoints;
}

/**
 * Awards points to a user.
 */
export async function awardPoints(
  userId: number,
  amount: number,
  transactionType: string,
  options?: {
    sourceEntityType?: string;
    sourceEntityId?: number;
    description?: string;
    confirmedBy?: number;
    expiresAt?: Date;
  }
): Promise<{ success: boolean; newBalance?: number; levelUp?: boolean; newLevel?: string }> {
  try {
    const currentPoints = await getUserPoints(userId);
    const newBalance = currentPoints.currentPoints + amount;
    const newLifetime = currentPoints.lifetimePoints + amount;

    // Calculate new experience level
    const levels = await db
      .select()
      .from(experienceLevels)
      .orderBy(experienceLevels.minPoints);

    let newLevel = currentPoints.experienceLevel;
    let newLevelName = currentPoints.experienceLevelName;
    let levelUp = false;

    for (const level of levels) {
      if (newLifetime >= level.minPoints && (!level.maxPoints || newLifetime <= level.maxPoints)) {
        if (level.level > currentPoints.experienceLevel) {
          newLevel = level.level;
          newLevelName = level.name;
          levelUp = true;
        }
        break;
      }
    }

    // Create transaction record
    await db.insert(pointsTransactions).values({
      userId,
      transactionType: transactionType as any,
      points: amount,
      balanceAfter: newBalance,
      sourceEntityType: options?.sourceEntityType,
      sourceEntityId: options?.sourceEntityId,
      description: options?.description,
      confirmedBy: options?.confirmedBy,
      confirmedAt: options?.confirmedBy ? new Date() : undefined,
      expiresAt: options?.expiresAt,
    });

    // Update user points
    await db
      .update(userPoints)
      .set({
        currentPoints: newBalance,
        lifetimePoints: newLifetime,
        experienceLevel: newLevel,
        experienceLevelName: newLevelName,
        updatedAt: new Date(),
      })
      .where(eq(userPoints.userId, userId));

    // Check for milestone achievements
    await checkMilestoneAchievements(userId, newLifetime);

    // Log activity
    await db.insert(activityLogs).values({
      userId,
      action: ActivityType.AWARD_POINTS,
      entityType: 'points',
      metadata: { amount, transactionType, newBalance, levelUp },
    });

    return { success: true, newBalance, levelUp, newLevel: levelUp ? newLevelName ?? undefined : undefined };
  } catch (error) {
    console.error('Error awarding points:', error);
    return { success: false };
  }
}

/**
 * Deducts points from a user.
 */
export async function deductPoints(
  userId: number,
  amount: number,
  description?: string
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  try {
    const currentPoints = await getUserPoints(userId);

    if (currentPoints.currentPoints < amount) {
      return { success: false, error: 'Insufficient points' };
    }

    const newBalance = currentPoints.currentPoints - amount;

    // Create transaction record
    await db.insert(pointsTransactions).values({
      userId,
      transactionType: 'redemption',
      points: -amount,
      balanceAfter: newBalance,
      description,
    });

    // Update user points
    await db
      .update(userPoints)
      .set({
        currentPoints: newBalance,
        updatedAt: new Date(),
      })
      .where(eq(userPoints.userId, userId));

    return { success: true, newBalance };
  } catch (error) {
    console.error('Error deducting points:', error);
    return { success: false, error: 'Failed to deduct points' };
  }
}

/**
 * Gets points transaction history for a user.
 */
export async function getPointsHistory(
  userId: number,
  options?: {
    limit?: number;
    offset?: number;
  }
) {
  return db
    .select()
    .from(pointsTransactions)
    .where(eq(pointsTransactions.userId, userId))
    .orderBy(desc(pointsTransactions.createdAt))
    .limit(options?.limit || 20)
    .offset(options?.offset || 0);
}

// =======================
// Experience Level Operations
// =======================

/**
 * Gets all experience levels.
 */
export async function getExperienceLevels() {
  return db
    .select()
    .from(experienceLevels)
    .orderBy(experienceLevels.level);
}

/**
 * Gets user's current level details.
 */
export async function getUserLevelDetails(userId: number) {
  const points = await getUserPoints(userId);

  const levels = await db
    .select()
    .from(experienceLevels)
    .orderBy(experienceLevels.level);

  const currentLevel = levels.find(l => l.level === points.experienceLevel);
  const nextLevel = levels.find(l => l.level === points.experienceLevel + 1);

  return {
    currentPoints: points.currentPoints,
    lifetimePoints: points.lifetimePoints,
    currentLevel: currentLevel || {
      level: 1,
      name: 'Newcomer',
      minPoints: 0,
      maxPoints: 100,
    },
    nextLevel,
    progressToNextLevel: nextLevel
      ? Math.min(100, ((points.lifetimePoints - (currentLevel?.minPoints || 0)) /
          ((nextLevel.minPoints || 0) - (currentLevel?.minPoints || 0))) * 100)
      : 100,
  };
}

// =======================
// Milestone Operations
// =======================

/**
 * Checks and awards milestone achievements.
 */
async function checkMilestoneAchievements(userId: number, lifetimePoints: number) {
  // Get all milestones user hasn't achieved
  const achievedMilestones = await db
    .select({ milestoneId: userMilestones.milestoneId })
    .from(userMilestones)
    .where(eq(userMilestones.userId, userId));

  const achievedIds = achievedMilestones.map(m => m.milestoneId);

  const availableMilestones = await db
    .select()
    .from(milestones)
    .where(eq(milestones.isActive, true));

  for (const milestone of availableMilestones) {
    if (achievedIds.includes(milestone.id)) continue;

    // Check if milestone is achieved based on type
    let achieved = false;

    if (milestone.milestoneType === 'points' && lifetimePoints >= milestone.targetValue) {
      achieved = true;
    }
    // Add more milestone type checks here (events_attended, meetings_completed, etc.)

    if (achieved) {
      // Award milestone
      await db.insert(userMilestones).values({
        userId,
        milestoneId: milestone.id,
        pointsAwarded: milestone.rewardPoints,
      });

      // Award bonus points if any
      if (milestone.rewardPoints && milestone.rewardPoints > 0) {
        const points = await getUserPoints(userId);
        await db
          .update(userPoints)
          .set({
            currentPoints: points.currentPoints + milestone.rewardPoints,
            lifetimePoints: points.lifetimePoints + milestone.rewardPoints,
            lastMilestoneAchieved: milestone.name,
            updatedAt: new Date(),
          })
          .where(eq(userPoints.userId, userId));
      }
    }
  }
}

/**
 * Gets user's achieved milestones.
 */
export async function getUserMilestones(userId: number) {
  return db
    .select({
      milestone: milestones,
      achievedAt: userMilestones.achievedAt,
      pointsAwarded: userMilestones.pointsAwarded,
    })
    .from(userMilestones)
    .innerJoin(milestones, eq(userMilestones.milestoneId, milestones.id))
    .where(eq(userMilestones.userId, userId))
    .orderBy(desc(userMilestones.achievedAt));
}

// =======================
// Points Rules Operations
// =======================

/**
 * Gets points for a specific action type.
 */
export async function getPointsForAction(
  transactionType: string,
  eventType?: string
): Promise<number> {
  const now = new Date();

  const [rule] = await db
    .select()
    .from(pointsRules)
    .where(
      and(
        eq(pointsRules.transactionType, transactionType as any),
        eq(pointsRules.isActive, true),
        eventType ? eq(pointsRules.eventType, eventType as any) : undefined
      )
    )
    .limit(1);

  if (rule) {
    // Check validity period
    if (rule.validFrom && rule.validFrom > now) return 0;
    if (rule.validUntil && rule.validUntil < now) return 0;
    return rule.pointsAmount;
  }

  // Default points if no rule found
  const defaults: Record<string, number> = {
    event_attendance: 10,
    meeting_completed: 20,
    referral_bonus: 50,
    milestone_reward: 100,
  };

  return defaults[transactionType] || 0;
}

/**
 * Awards points for event attendance.
 */
export async function awardEventAttendancePoints(
  userId: number,
  eventId: number,
  eventType?: string
): Promise<{ success: boolean; pointsAwarded?: number }> {
  const pointsAmount = await getPointsForAction('event_attendance', eventType);

  if (pointsAmount <= 0) {
    return { success: true, pointsAwarded: 0 };
  }

  const result = await awardPoints(userId, pointsAmount, 'event_attendance', {
    sourceEntityType: 'event',
    sourceEntityId: eventId,
    description: `Points for attending event #${eventId}`,
  });

  if (result.success) {
    // Update events attended counter
    const points = await getUserPoints(userId);
    await db
      .update(userPoints)
      .set({
        eventsAttended: points.eventsAttended + 1,
        updatedAt: new Date(),
      })
      .where(eq(userPoints.userId, userId));
  }

  return { success: result.success, pointsAwarded: pointsAmount };
}

/**
 * Awards points for meeting completion.
 */
export async function awardMeetingCompletionPoints(
  userId: number,
  meetingId: number
): Promise<{ success: boolean; pointsAwarded?: number }> {
  const pointsAmount = await getPointsForAction('meeting_completed');

  if (pointsAmount <= 0) {
    return { success: true, pointsAwarded: 0 };
  }

  const result = await awardPoints(userId, pointsAmount, 'meeting_completed', {
    sourceEntityType: 'meeting',
    sourceEntityId: meetingId,
    description: `Points for completing meeting #${meetingId}`,
  });

  if (result.success) {
    // Update meetings completed counter
    const points = await getUserPoints(userId);
    await db
      .update(userPoints)
      .set({
        meetingsCompleted: points.meetingsCompleted + 1,
        updatedAt: new Date(),
      })
      .where(eq(userPoints.userId, userId));
  }

  return { success: result.success, pointsAwarded: pointsAmount };
}
