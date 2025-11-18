import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/auth/role-middleware';
import { db } from '@/lib/db/drizzle';
import {
  users,
  userRoles,
  mentorshipRelationships,
  events,
  eventRegistrations,
  resources
} from '@/lib/db/schema';
import { sql, gte, lte, and, eq, or } from 'drizzle-orm';

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

      // Get upcoming events
      const [{ upcomingEvents }] = await db
        .select({ upcomingEvents: sql<number>`count(*)` })
        .from(events)
        .where(gte(events.startTime, now));

      // Get events this month
      const [{ eventsThisMonth }] = await db
        .select({ eventsThisMonth: sql<number>`count(*)` })
        .from(events)
        .where(
          and(
            gte(events.startTime, startOfMonth),
            lte(events.startTime, now)
          )
        );

      // Get total registrations for upcoming events
      const [{ totalRegistrations }] = await db
        .select({ totalRegistrations: sql<number>`COALESCE(sum(${events.currentRegistrations}), 0)` })
        .from(events)
        .where(gte(events.startTime, now));

      // Calculate attendance rate (for past events with attendance data)
      const attendanceData = await db
        .select({
          avgRate: sql<number>`
            CASE
              WHEN sum(${events.capacity}) > 0
              THEN (sum(${events.actualAttendance})::float / sum(${events.capacity})::float) * 100
              ELSE 0
            END
          `
        })
        .from(events)
        .where(
          and(
            lte(events.endTime, now),
            sql`${events.actualAttendance} IS NOT NULL`,
            sql`${events.capacity} > 0`
          )
        );

      const attendanceRate = attendanceData[0]?.avgRate || 0;

      // Get resource counts
      const [{ totalResources }] = await db
        .select({ totalResources: sql<number>`count(*)` })
        .from(resources);

      // Note: newsletters and blogPosts would need separate tables
      // For now, we'll filter resources by type
      const [{ newsletters }] = await db
        .select({ newsletters: sql<number>`count(*)` })
        .from(resources)
        .where(sql`${resources.tags} @> '["newsletter"]'::jsonb`);

      const [{ blogPosts }] = await db
        .select({ blogPosts: sql<number>`count(*)` })
        .from(resources)
        .where(sql`${resources.tags} @> '["blog"]'::jsonb`);

      const [{ mediaFiles }] = await db
        .select({ mediaFiles: sql<number>`count(*)` })
        .from(resources)
        .where(
          or(
            eq(resources.resourceType, 'video'),
            sql`${resources.mimeType} LIKE 'image/%'`,
            sql`${resources.mimeType} LIKE 'video/%'`
          )
        );

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
          pendingApplications: pendingApplications
        },
        events: {
          upcoming: upcomingEvents,
          totalRegistrations: totalRegistrations,
          thisMonth: eventsThisMonth,
          attendanceRate: Math.round(attendanceRate * 10) / 10 // Round to 1 decimal
        },
        content: {
          resources: totalResources,
          newsletters: newsletters,
          blogPosts: blogPosts,
          mediaFiles: mediaFiles
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
