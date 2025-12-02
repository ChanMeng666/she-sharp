import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/auth/role-middleware';
import { db } from '@/lib/db/drizzle';
import {
  mentorProfiles,
  menteeWaitingQueue,
  aiMatchResults,
} from '@/lib/db/schema';
import { sql, isNull, eq } from 'drizzle-orm';

// Admin-only pending tasks endpoint
export const GET = withRoles(
  {
    requiredRoles: ['admin']
  },
  async (req: NextRequest, context: any) => {
    try {
      // Get pending mentor applications count
      const [{ pendingMentors }] = await db
        .select({ pendingMentors: sql<number>`count(*)` })
        .from(mentorProfiles)
        .where(isNull(mentorProfiles.verifiedAt));

      // Get mentees waiting for matching
      const [{ waitingMentees }] = await db
        .select({ waitingMentees: sql<number>`count(*)` })
        .from(menteeWaitingQueue)
        .where(eq(menteeWaitingQueue.status, 'waiting'));

      // Get pending AI match results that need review
      const [{ pendingMatches }] = await db
        .select({ pendingMatches: sql<number>`count(*)` })
        .from(aiMatchResults)
        .where(eq(aiMatchResults.status, 'pending_review'));

      const tasks = [
        {
          task: 'Review mentor applications',
          count: pendingMentors,
          priority: 'high' as const,
          href: '/dashboard/admin/mentors/applications'
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
