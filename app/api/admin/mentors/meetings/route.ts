import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/auth/role-middleware';
import { db } from '@/lib/db/drizzle';
import { meetings, mentorshipRelationships, users } from '@/lib/db/schema';
import { eq, sql, desc, and, gte, lte } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

const mentorUser = alias(users, 'mentorUser');
const menteeUser = alias(users, 'menteeUser');

// Admin-only meetings endpoint
export const GET = withRoles(
  {
    requiredRoles: ['admin'],
    requiredAdminPermissions: ['canManageRelationships']
  },
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const limit = parseInt(searchParams.get('limit') || '50');
      const offset = parseInt(searchParams.get('offset') || '0');

      // Fetch meetings with participant info
      const meetingsList = await db
        .select({
          id: meetings.id,
          relationshipId: meetings.relationshipId,
          scheduledAt: meetings.scheduledAt,
          durationMinutes: meetings.durationMinutes,
          status: meetings.status,
          meetingLink: meetings.meetingLink,
          recordingUrl: meetings.recordingUrl,
          topicsDiscussed: meetings.topicsDiscussed,
          mentorNotes: meetings.mentorNotes,
          menteeFeedback: meetings.menteeFeedback,
          rating: meetings.rating,
          createdAt: meetings.createdAt,
          // Mentor info
          mentorName: mentorUser.name,
          mentorEmail: mentorUser.email,
          // Mentee info
          menteeName: menteeUser.name,
          menteeEmail: menteeUser.email,
        })
        .from(meetings)
        .innerJoin(mentorshipRelationships, eq(meetings.relationshipId, mentorshipRelationships.id))
        .innerJoin(mentorUser, eq(mentorshipRelationships.mentorUserId, mentorUser.id))
        .innerJoin(menteeUser, eq(mentorshipRelationships.menteeUserId, menteeUser.id))
        .orderBy(desc(meetings.scheduledAt))
        .limit(limit)
        .offset(offset);

      // Format meetings data
      const meetingsData = meetingsList.map(meeting => ({
        id: meeting.id,
        relationshipId: meeting.relationshipId,
        mentor: meeting.mentorName,
        mentee: meeting.menteeName,
        date: meeting.scheduledAt,
        duration: meeting.durationMinutes || 0,
        type: meeting.meetingLink ? 'video' : 'in_person',
        status: meeting.status,
        rating: meeting.rating,
        topics: meeting.topicsDiscussed || [],
        notes: meeting.mentorNotes || meeting.menteeFeedback,
        recordingAvailable: !!meeting.recordingUrl,
      }));

      // Get overall statistics
      const [totalStats] = await db
        .select({
          total: sql<number>`count(*)::int`,
          completed: sql<number>`count(*) filter (where ${meetings.status} = 'completed')::int`,
          scheduled: sql<number>`count(*) filter (where ${meetings.status} = 'scheduled')::int`,
          cancelled: sql<number>`count(*) filter (where ${meetings.status} = 'cancelled')::int`,
          avgDuration: sql<number | null>`avg(${meetings.durationMinutes}) filter (where ${meetings.status} = 'completed')`,
          avgRating: sql<number | null>`avg(${meetings.rating})`,
          totalRatings: sql<number>`count(${meetings.rating})::int`,
        })
        .from(meetings);

      // Get monthly trend data (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const monthlyTrend = await db
        .select({
          month: sql<string>`to_char(${meetings.scheduledAt}, 'Mon')`,
          meetings: sql<number>`count(*)::int`,
          avgDuration: sql<number | null>`avg(${meetings.durationMinutes})`,
        })
        .from(meetings)
        .where(gte(meetings.scheduledAt, sixMonthsAgo))
        .groupBy(sql`to_char(${meetings.scheduledAt}, 'Mon'), date_trunc('month', ${meetings.scheduledAt})`)
        .orderBy(sql`date_trunc('month', ${meetings.scheduledAt})`);

      // Get meeting type distribution
      const typeDistribution = await db
        .select({
          hasLink: sql<boolean>`${meetings.meetingLink} IS NOT NULL`,
          count: sql<number>`count(*)::int`,
        })
        .from(meetings)
        .groupBy(sql`${meetings.meetingLink} IS NOT NULL`);

      const videoMeetings = typeDistribution.find(t => t.hasLink)?.count || 0;
      const inPersonMeetings = typeDistribution.find(t => !t.hasLink)?.count || 0;
      const totalMeetings = videoMeetings + inPersonMeetings;

      const completionRate = totalStats?.total
        ? Math.round(((totalStats.completed || 0) / totalStats.total) * 100)
        : 0;

      return NextResponse.json({
        meetings: meetingsData,
        stats: {
          total: totalStats?.total || 0,
          completed: totalStats?.completed || 0,
          scheduled: totalStats?.scheduled || 0,
          cancelled: totalStats?.cancelled || 0,
          avgDuration: totalStats?.avgDuration ? Math.round(totalStats.avgDuration) : 0,
          avgRating: totalStats?.avgRating ? Math.round(totalStats.avgRating * 10) / 10 : 0,
          totalRatings: totalStats?.totalRatings || 0,
          completionRate,
        },
        trends: monthlyTrend.map(t => ({
          month: t.month,
          meetings: t.meetings,
          avgDuration: t.avgDuration ? Math.round(t.avgDuration) : 0,
        })),
        typeDistribution: [
          { type: 'Video Call', value: totalMeetings > 0 ? Math.round((videoMeetings / totalMeetings) * 100) : 0 },
          { type: 'In-Person', value: totalMeetings > 0 ? Math.round((inPersonMeetings / totalMeetings) * 100) : 0 },
        ],
        pagination: {
          total: totalStats?.total || 0,
          limit,
          offset,
          hasMore: offset + limit < (totalStats?.total || 0)
        }
      });
    } catch (error) {
      console.error('Error fetching meetings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch meetings' },
        { status: 500 }
      );
    }
  }
);
