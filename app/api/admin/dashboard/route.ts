import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/auth/role-middleware';
import { db } from '@/lib/db/drizzle';
import {
  users,
  userRoles,
  mentorshipRelationships,
  aiMatchResults,
} from '@/lib/db/schema';
import { sql, gte, lte, and, eq } from 'drizzle-orm';

// Admin dashboard metrics endpoint
export const GET = withRoles(
  {
    requiredRoles: ['admin']
  },
  async (req: NextRequest, context: any) => {
    try {
      // Calculate date ranges
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Get total users
      const [{ totalUsers }] = await db
        .select({ totalUsers: sql<number>`count(*)` })
        .from(users)
        .where(sql`${users.deletedAt} IS NULL`);

      // Get users created this month
      const [{ newUsersThisMonth }] = await db
        .select({ newUsersThisMonth: sql<number>`count(*)` })
        .from(users)
        .where(
          and(
            gte(users.createdAt, startOfMonth),
            sql`${users.deletedAt} IS NULL`
          )
        );

      // Get users created last month
      const [{ newUsersLastMonth }] = await db
        .select({ newUsersLastMonth: sql<number>`count(*)` })
        .from(users)
        .where(
          and(
            gte(users.createdAt, lastMonth),
            lte(users.createdAt, endOfLastMonth),
            sql`${users.deletedAt} IS NULL`
          )
        );

      // Calculate user growth change percentage
      const userChange = newUsersLastMonth > 0
        ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100
        : newUsersThisMonth > 0 ? 100 : 0;

      // Get active users (logged in within last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const [{ activeUsers }] = await db
        .select({ activeUsers: sql<number>`count(*)` })
        .from(users)
        .where(
          and(
            gte(users.lastLoginAt, thirtyDaysAgo),
            sql`${users.deletedAt} IS NULL`
          )
        );

      // Get mentor and mentee counts
      const [{ mentorCount }] = await db
        .select({ mentorCount: sql<number>`count(DISTINCT ${userRoles.userId})` })
        .from(userRoles)
        .where(
          and(
            eq(userRoles.roleType, 'mentor'),
            eq(userRoles.isActive, true)
          )
        );

      const [{ menteeCount }] = await db
        .select({ menteeCount: sql<number>`count(DISTINCT ${userRoles.userId})` })
        .from(userRoles)
        .where(
          and(
            eq(userRoles.roleType, 'mentee'),
            eq(userRoles.isActive, true)
          )
        );

      // Get active mentorship pairs
      const [{ activePairs }] = await db
        .select({ activePairs: sql<number>`count(*)` })
        .from(mentorshipRelationships)
        .where(eq(mentorshipRelationships.status, 'active'));

      // Get pending applications
      const [{ pendingApplications }] = await db
        .select({ pendingApplications: sql<number>`count(*)` })
        .from(mentorshipRelationships)
        .where(eq(mentorshipRelationships.status, 'pending'));

      // Get completed mentorship relationships
      const [{ completedRelationships }] = await db
        .select({ completedRelationships: sql<number>`count(*)` })
        .from(mentorshipRelationships)
        .where(eq(mentorshipRelationships.status, 'completed'));

      // Get average AI match score
      const [{ avgMatchScore }] = await db
        .select({
          avgMatchScore: sql<number>`COALESCE(AVG(${aiMatchResults.overallScore}), 0)`
        })
        .from(aiMatchResults)
        .where(eq(aiMatchResults.status, 'approved'));

      // Compile metrics
      const metrics = {
        users: {
          total: totalUsers,
          active: activeUsers,
          new: newUsersThisMonth,
          change: Math.round(userChange * 10) / 10 // Round to 1 decimal
        },
        mentorship: {
          mentors: mentorCount,
          mentees: menteeCount,
          activePairs: activePairs,
          pendingApplications: pendingApplications,
          completedRelationships: completedRelationships,
          avgMatchScore: Math.round(avgMatchScore * 10) / 10 // Round to 1 decimal
        }
      };

      return NextResponse.json(metrics);
    } catch (error) {
      console.error('Error fetching admin dashboard metrics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch dashboard metrics' },
        { status: 500 }
      );
    }
  }
);
