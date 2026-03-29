'use server';

import { db } from '@/lib/db/drizzle';
import {
  programmes,
  mentorProgrammeAssignments,
  mentorshipRelationships,
  menteeWaitingQueue,
  menteeFormSubmissions,
  activityLogs,
  notifications,
  users,
  mentorProfiles,
  type Programme,
  type NewProgramme,
  ActivityType,
} from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

// =====================
// Programme CRUD
// =====================

export async function getProgrammeBySlug(slug: string): Promise<Programme | null> {
  const [programme] = await db
    .select()
    .from(programmes)
    .where(eq(programmes.slug, slug))
    .limit(1);
  return programme || null;
}

export async function getProgrammeById(id: number): Promise<Programme | null> {
  const [programme] = await db
    .select()
    .from(programmes)
    .where(eq(programmes.id, id))
    .limit(1);
  return programme || null;
}

export async function getActiveProgrammes(): Promise<Programme[]> {
  return db
    .select()
    .from(programmes)
    .where(eq(programmes.status, 'active'))
    .orderBy(programmes.startDate);
}

export async function getAllProgrammes(): Promise<Programme[]> {
  return db
    .select()
    .from(programmes)
    .orderBy(programmes.createdAt);
}

export async function createProgramme(
  data: Omit<NewProgramme, 'id' | 'createdAt' | 'updatedAt' | 'currentMenteeCount'>
): Promise<Programme> {
  const [programme] = await db
    .insert(programmes)
    .values(data)
    .returning();
  return programme;
}

export async function updateProgramme(
  id: number,
  data: Partial<Omit<NewProgramme, 'id' | 'createdAt'>>
): Promise<Programme> {
  const [programme] = await db
    .update(programmes)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(programmes.id, id))
    .returning();
  return programme;
}

// =====================
// Mentor Assignments
// =====================

export async function assignMentorToProgramme(
  mentorUserId: number,
  programmeId: number,
  assignedBy: number,
  maxMentees?: number
) {
  const [assignment] = await db
    .insert(mentorProgrammeAssignments)
    .values({
      mentorUserId,
      programmeId,
      assignedBy,
      maxMenteesInProgramme: maxMentees ?? 2,
    })
    .onConflictDoUpdate({
      target: [mentorProgrammeAssignments.mentorUserId, mentorProgrammeAssignments.programmeId],
      set: {
        maxMenteesInProgramme: maxMentees ?? 2,
        assignedBy,
        assignedAt: new Date(),
      },
    })
    .returning();

  await db.insert(activityLogs).values({
    userId: assignedBy,
    action: ActivityType.ASSIGN_MENTOR_TO_PROGRAMME,
    entityType: 'mentor_programme_assignment',
    entityId: assignment.id,
    metadata: { mentorUserId, programmeId },
  });

  // Notify mentor
  await db.insert(notifications).values({
    userId: mentorUserId,
    type: 'mentorship',
    title: 'Programme Assignment',
    message: `You've been assigned to a mentorship programme. Check your profile for details.`,
    actionUrl: '/dashboard/mentor-profile',
    actionLabel: 'View Details',
  });

  return assignment;
}

export async function removeMentorFromProgramme(
  mentorUserId: number,
  programmeId: number
) {
  await db
    .delete(mentorProgrammeAssignments)
    .where(
      and(
        eq(mentorProgrammeAssignments.mentorUserId, mentorUserId),
        eq(mentorProgrammeAssignments.programmeId, programmeId)
      )
    );
}

export async function getProgrammeMentors(programmeId: number) {
  return db
    .select({
      assignment: mentorProgrammeAssignments,
      user: users,
      profile: mentorProfiles,
    })
    .from(mentorProgrammeAssignments)
    .innerJoin(users, eq(mentorProgrammeAssignments.mentorUserId, users.id))
    .leftJoin(mentorProfiles, eq(mentorProgrammeAssignments.mentorUserId, mentorProfiles.userId))
    .where(eq(mentorProgrammeAssignments.programmeId, programmeId));
}

export async function getMentorProgrammes(mentorUserId: number) {
  return db
    .select({
      assignment: mentorProgrammeAssignments,
      programme: programmes,
    })
    .from(mentorProgrammeAssignments)
    .innerJoin(programmes, eq(mentorProgrammeAssignments.programmeId, programmes.id))
    .where(eq(mentorProgrammeAssignments.mentorUserId, mentorUserId));
}

// =====================
// Programme Lifecycle
// =====================

export async function completeProgramme(programmeId: number, adminUserId: number) {
  // 1. Set status = completed
  await db
    .update(programmes)
    .set({ status: 'completed', updatedAt: new Date() })
    .where(eq(programmes.id, programmeId));

  const programme = await getProgrammeById(programmeId);
  if (!programme) throw new Error('Programme not found');

  // 2. Find active relationships for this programme
  const activeRelationships = await db
    .select()
    .from(mentorshipRelationships)
    .where(
      and(
        eq(mentorshipRelationships.programmeId, programmeId),
        eq(mentorshipRelationships.status, 'active')
      )
    );

  // 3. Mark each relationship as completed
  for (const rel of activeRelationships) {
    await db
      .update(mentorshipRelationships)
      .set({ status: 'completed', endedAt: new Date(), updatedAt: new Date() })
      .where(eq(mentorshipRelationships.id, rel.id));

    // Notify mentee
    await db.insert(notifications).values({
      userId: rel.menteeUserId,
      type: 'mentorship',
      title: `${programme.name} Programme Completed`,
      message: `Your ${programme.name} programme has ended. Thank you for participating! Continue your journey with She Sharp.`,
      actionUrl: '/dashboard',
      actionLabel: 'View Dashboard',
    });
  }

  // 4. Notify mentors with summary
  const mentorMap = new Map<number, number>();
  for (const rel of activeRelationships) {
    mentorMap.set(rel.mentorUserId, (mentorMap.get(rel.mentorUserId) || 0) + 1);
  }
  for (const [mentorId, count] of mentorMap) {
    await db.insert(notifications).values({
      userId: mentorId,
      type: 'mentorship',
      title: `${programme.name} Programme Completed`,
      message: `The ${programme.name} programme has completed. ${count} mentee relationship(s) have been concluded.`,
      actionUrl: '/dashboard/mentorship',
      actionLabel: 'View Mentorship',
    });
  }

  // 5. Reset mentor assignment counts
  await db
    .update(mentorProgrammeAssignments)
    .set({ currentMenteesInProgramme: 0 })
    .where(eq(mentorProgrammeAssignments.programmeId, programmeId));

  // 6. Cancel pending queue entries
  await db
    .update(menteeWaitingQueue)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(
      and(
        eq(menteeWaitingQueue.programmeId, programmeId),
        eq(menteeWaitingQueue.status, 'waiting')
      )
    );

  // 7. Log activity
  await db.insert(activityLogs).values({
    userId: adminUserId,
    action: ActivityType.COMPLETE_PROGRAMME,
    entityType: 'programme',
    entityId: programmeId,
    metadata: {
      programmeName: programme.name,
      relationshipsCompleted: activeRelationships.length,
      mentorsAffected: mentorMap.size,
    },
  });

  return { relationshipsCompleted: activeRelationships.length, mentorsAffected: mentorMap.size };
}

// =====================
// Programme Stats
// =====================

export async function getProgrammeStats(programmeId: number) {
  const [menteeCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(menteeFormSubmissions)
    .where(
      and(
        eq(menteeFormSubmissions.programmeId, programmeId),
        eq(menteeFormSubmissions.status, 'submitted')
      )
    );

  const [mentorCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(mentorProgrammeAssignments)
    .where(eq(mentorProgrammeAssignments.programmeId, programmeId));

  const [activeRelCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(mentorshipRelationships)
    .where(
      and(
        eq(mentorshipRelationships.programmeId, programmeId),
        eq(mentorshipRelationships.status, 'active')
      )
    );

  const [pendingAppCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(menteeFormSubmissions)
    .where(
      and(
        eq(menteeFormSubmissions.programmeId, programmeId),
        eq(menteeFormSubmissions.status, 'submitted')
      )
    );

  // Count mentees excluding test users (for display as capacity count)
  const [realMenteeCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(menteeFormSubmissions)
    .leftJoin(users, eq(menteeFormSubmissions.userId, users.id))
    .where(
      and(
        eq(menteeFormSubmissions.programmeId, programmeId),
        sql`${menteeFormSubmissions.status} IN ('submitted', 'approved')`,
        sql`(${users.isTestUser} = false OR ${users.id} IS NULL)`
      )
    );

  return {
    menteeApplications: Number(menteeCount?.count ?? 0),
    mentorCount: Number(mentorCount?.count ?? 0),
    activeRelationships: Number(activeRelCount?.count ?? 0),
    pendingApplications: Number(pendingAppCount?.count ?? 0),
    realMenteeCount: Number(realMenteeCount?.count ?? 0),
  };
}
