import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/auth/role-middleware';
import { db } from '@/lib/db/drizzle';
import {
  mentorFormSubmissions,
  menteeFormSubmissions,
  menteeWaitingQueue,
  aiMatchResults,
  users,
} from '@/lib/db/schema';
import { sql, eq, and } from 'drizzle-orm';

// Admin-only pending tasks endpoint
export const GET = withRoles(
  {
    requiredRoles: ['admin']
  },
  async (req: NextRequest, context: any) => {
    try {
      // Get pending mentor applications count (from form submissions with 'submitted' status)
      const [{ pendingMentors }] = await db
        .select({ pendingMentors: sql<number>`count(*)` })
        .from(mentorFormSubmissions)
        .where(eq(mentorFormSubmissions.status, 'submitted'));

      // Get pending mentee applications count
      const [{ pendingMentees }] = await db
        .select({ pendingMentees: sql<number>`count(*)` })
        .from(menteeFormSubmissions)
        .where(eq(menteeFormSubmissions.status, 'submitted'));

      // Get mentees waiting for matching (excludes test users)
      const [{ waitingMentees }] = await db
        .select({ waitingMentees: sql<number>`count(*)` })
        .from(menteeWaitingQueue)
        .innerJoin(users, eq(menteeWaitingQueue.menteeUserId, users.id))
        .where(and(
          eq(menteeWaitingQueue.status, 'waiting'),
          eq(users.isTestUser, false)
        ));

      // Get pending AI match results that need review (excludes matches where either mentor or mentee is a test user)
      const [{ pendingMatches }] = await db
        .select({ pendingMatches: sql<number>`count(*)` })
        .from(aiMatchResults)
        .where(sql`${aiMatchResults.status} = 'pending_review'
          AND NOT EXISTS (
            SELECT 1 FROM users WHERE users.id IN (${aiMatchResults.menteeUserId}, ${aiMatchResults.mentorUserId}) AND users.is_test_user = true
          )`);

      const tasks = [
        {
          task: 'Review mentor applications',
          count: pendingMentors,
          priority: 'high' as const,
          href: '/dashboard/admin/users?application=pending'
        },
        {
          task: 'Review mentee applications',
          count: pendingMentees,
          priority: 'high' as const,
          href: '/dashboard/admin/users?application=has_pending'
        },
        {
          task: 'Review AI match suggestions',
          count: pendingMatches,
          priority: 'high' as const,
          href: '/dashboard/admin/matching'
        },
        {
          task: 'Mentees waiting for match',
          count: waitingMentees,
          priority: 'medium' as const,
          href: '/dashboard/admin/matching'
        },
      ];

      // Calculate total pending tasks
      const totalCount = tasks.reduce((sum, task) => sum + task.count, 0);

      return NextResponse.json({
        tasks,
        totalCount
      });
    } catch (error) {
      console.error('Error fetching pending tasks:', error);
      return NextResponse.json(
        { error: 'Failed to fetch pending tasks' },
        { status: 500 }
      );
    }
  }
);
