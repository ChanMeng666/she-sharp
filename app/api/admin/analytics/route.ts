import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/auth/role-middleware';
import { db } from '@/lib/db/drizzle';
import {
  users,
  userRoles,
  mentorshipRelationships,
  meetings,
  events,
  eventRegistrations,
  resources,
} from '@/lib/db/schema';
import { sql, gte, lte, and, eq } from 'drizzle-orm';

// Admin-only analytics endpoint
export const GET = withRoles(
  { 
    requiredRoles: ['admin'],
    requiredAdminPermissions: ['canAccessAnalytics']
  },
  async (req: NextRequest, context: any) => {
    try {
      // Get query parameters for date range
      const { searchParams } = new URL(req.url);
      const startDate = searchParams.get('startDate') 
        ? new Date(searchParams.get('startDate')!)
        : new Date(new Date().setMonth(new Date().getMonth() - 1)); // Default to last month
      const endDate = searchParams.get('endDate')
        ? new Date(searchParams.get('endDate')!)
        : new Date();

      // User Statistics
      const totalUsers = await db
        .select({ count: sql<number>`count(distinct ${users.id})` })
        .from(users);

      const newUsersInPeriod = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(
          and(
            gte(users.createdAt, startDate),
            lte(users.createdAt, endDate)
          )
        );

      // Role Distribution
      const roleDistribution = await db
        .select({
          roleType: userRoles.roleType,
          count: sql<number>`count(*)`
        })
        .from(userRoles)
        .where(eq(userRoles.isActive, true))
        .groupBy(userRoles.roleType);

      // Mentorship Statistics
      const mentorshipStats = await db
        .select({
          status: mentorshipRelationships.status,
          count: sql<number>`count(*)`
        })
        .from(mentorshipRelationships)
        .groupBy(mentorshipRelationships.status);

      const newRelationshipsInPeriod = await db
        .select({ count: sql<number>`count(*)` })
        .from(mentorshipRelationships)
        .where(
          and(
            gte(mentorshipRelationships.createdAt, startDate),
            lte(mentorshipRelationships.createdAt, endDate)
          )
        );

      // Meeting Statistics
      const meetingStats = await db
        .select({
          status: meetings.status,
          count: sql<number>`count(*)`,
          totalHours: sql<number>`sum(${meetings.durationMinutes}) / 60.0`
        })
        .from(meetings)
        .where(
          and(
            gte(meetings.scheduledAt, startDate),
            lte(meetings.scheduledAt, endDate)
          )
        )
        .groupBy(meetings.status);

      // Event Statistics
      const eventStats = await db
        .select({
          eventType: events.eventType,
          count: sql<number>`count(*)`,
          totalRegistrations: sql<number>`sum(${events.currentRegistrations})`
        })
        .from(events)
        .where(
          and(
            gte(events.startTime, startDate),
            lte(events.endTime, endDate)
          )
        )
        .groupBy(events.eventType);

      // Resource Statistics
      const resourceStats = await db
        .select({
          resourceType: resources.resourceType,
          count: sql<number>`count(*)`,
          totalViews: sql<number>`sum(${resources.viewCount})`,
          totalDownloads: sql<number>`sum(${resources.downloadCount})`
        })
        .from(resources)
        .where(
          and(
            gte(resources.uploadedAt, startDate),
            lte(resources.uploadedAt, endDate)
          )
        )
        .groupBy(resources.resourceType);

      // Top Mentors by Activity (removed - was based on unused stats table)
      const topMentors: any[] = [];

      // Engagement Metrics
      const avgMeetingsPerRelationship = await db
        .select({
          avg: sql<number>`avg(meeting_count)`
        })
        .from(
          sql`(
            SELECT ${mentorshipRelationships.id}, count(${meetings.id}) as meeting_count
            FROM ${mentorshipRelationships}
            LEFT JOIN ${meetings} ON ${meetings.relationshipId} = ${mentorshipRelationships.id}
            WHERE ${mentorshipRelationships.status} = 'active'
            GROUP BY ${mentorshipRelationships.id}
          ) as subquery`
        );

      const eventAttendanceRate = await db
        .select({
          rate: sql<number>`
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
            gte(events.startTime, startDate),
            lte(events.endTime, endDate),
            sql`${events.actualAttendance} IS NOT NULL`
          )
        );

      // Growth Metrics
      const monthlyGrowth = await db
        .select({
          month: sql<string>`to_char(${users.createdAt}, 'YYYY-MM')`,
          newUsers: sql<number>`count(*)`,
          cumulativeUsers: sql<number>`sum(count(*)) over (order by to_char(${users.createdAt}, 'YYYY-MM'))`
        })
        .from(users)
        .where(gte(users.createdAt, new Date(new Date().setMonth(new Date().getMonth() - 12)))) // Last 12 months
        .groupBy(sql`to_char(${users.createdAt}, 'YYYY-MM')`)
        .orderBy(sql`to_char(${users.createdAt}, 'YYYY-MM')`);

      // Compile Analytics Report
      const analyticsReport = {
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        overview: {
          totalUsers: totalUsers[0]?.count || 0,
          newUsersInPeriod: newUsersInPeriod[0]?.count || 0,
          totalActiveRelationships: mentorshipStats.find(s => s.status === 'active')?.count || 0,
          newRelationshipsInPeriod: newRelationshipsInPeriod[0]?.count || 0
        },
        roleDistribution,
        mentorshipStats,
        meetingStats: meetingStats.map(m => ({
          ...m,
          totalHours: parseFloat(m.totalHours?.toString() || '0')
        })),
        eventStats,
        resourceStats,
        topMentors: topMentors.map(m => ({
          ...m,
          totalMeetingHours: parseFloat(m.totalMeetingHours?.toString() || '0')
        })),
        engagement: {
          avgMeetingsPerRelationship: parseFloat(avgMeetingsPerRelationship[0]?.avg?.toString() || '0'),
          eventAttendanceRate: parseFloat(eventAttendanceRate[0]?.rate?.toString() || '0')
        },
        growth: {
          monthlyData: monthlyGrowth
        },
        generatedAt: new Date().toISOString(),
        generatedBy: context.user.email
      };

      return NextResponse.json(analyticsReport);
    } catch (error) {
      console.error('Error generating analytics report:', error);
      return NextResponse.json(
        { error: 'Failed to generate analytics report' },
        { status: 500 }
      );
    }
  }
);