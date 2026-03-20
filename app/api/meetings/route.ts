import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { meetings, mentorshipRelationships, users, mentorProfiles, menteeProfiles, mentorFormSubmissions, menteeFormSubmissions, activityLogs, ActivityType } from '@/lib/db/schema';
import { eq, and, or, gte, lte, desc, asc } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const role = searchParams.get('role'); // 'mentor' or 'mentee'

    // Get user's relationships
    const relationships = await db
      .select()
      .from(mentorshipRelationships)
      .where(
        or(
          eq(mentorshipRelationships.mentorUserId, user.id),
          eq(mentorshipRelationships.menteeUserId, user.id)
        )
      );

    if (relationships.length === 0) {
      return NextResponse.json({ meetings: [] });
    }

    const relationshipIds = relationships.map(r => r.id);

    // Build query conditions
    const conditions = [
      or(...relationshipIds.map(id => eq(meetings.relationshipId, id)))
    ];

    if (startDate) {
      conditions.push(gte(meetings.scheduledAt, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(meetings.scheduledAt, new Date(endDate)));
    }

    if (status) {
      conditions.push(eq(meetings.status, status as any));
    }

    // Get meetings
    const allMeetings = await db
      .select({
        id: meetings.id,
        relationshipId: meetings.relationshipId,
        scheduledAt: meetings.scheduledAt,
        durationMinutes: meetings.durationMinutes,
        meetingType: meetings.meetingType,
        meetingLink: meetings.meetingLink,
        status: meetings.status,
        topicsDiscussed: meetings.topicsDiscussed,
        goalsSet: meetings.goalsSet,
        actionItems: meetings.actionItems,
        mentorNotes: meetings.mentorNotes,
        menteeFeedback: meetings.menteeFeedback,
        rating: meetings.rating,
        actualStartTime: meetings.actualStartTime,
        actualEndTime: meetings.actualEndTime,
        createdAt: meetings.createdAt,
      })
      .from(meetings)
      .where(and(...conditions))
      .orderBy(desc(meetings.scheduledAt));

    // Enrich meetings with relationship and user data
    const enrichedMeetings = await Promise.all(
      allMeetings.map(async (meeting) => {
        const relationship = relationships.find(r => r.id === meeting.relationshipId);
        if (!relationship) return { ...meeting, userRole: undefined };

        const isMentor = relationship.mentorUserId === user.id;
        const otherUserId = isMentor ? relationship.menteeUserId : relationship.mentorUserId;

        // Fetch other user with form → profile → user image fallback
        const [otherUserRaw] = await db
          .select({
            name: users.name,
            email: users.email,
            userImage: users.image,
            mentorProfilePhoto: mentorProfiles.photoUrl,
            menteeProfilePhoto: menteeProfiles.photoUrl,
            mentorFormPhoto: mentorFormSubmissions.photoUrl,
            menteeFormPhoto: menteeFormSubmissions.photoUrl,
          })
          .from(users)
          .leftJoin(mentorProfiles, eq(mentorProfiles.userId, users.id))
          .leftJoin(menteeProfiles, eq(menteeProfiles.userId, users.id))
          .leftJoin(mentorFormSubmissions, eq(mentorFormSubmissions.userId, users.id))
          .leftJoin(menteeFormSubmissions, eq(menteeFormSubmissions.userId, users.id))
          .where(eq(users.id, otherUserId))
          .limit(1);

        const otherUser = otherUserRaw ? {
          name: otherUserRaw.name,
          email: otherUserRaw.email,
          image: (isMentor
            ? (otherUserRaw.menteeFormPhoto || otherUserRaw.menteeProfilePhoto)
            : (otherUserRaw.mentorFormPhoto || otherUserRaw.mentorProfilePhoto)
          ) || otherUserRaw.userImage || null,
        } : null;

        return {
          ...meeting,
          userRole: isMentor ? 'mentor' : 'mentee' as 'mentor' | 'mentee',
          otherUser,
          relationship: {
            id: relationship.id,
            status: relationship.status,
          },
        };
      })
    );

    // Filter by role if specified
    const filteredMeetings = role
      ? enrichedMeetings.filter(m => m.userRole && m.userRole === role)
      : enrichedMeetings;

    // Separate by status
    const upcoming = filteredMeetings.filter(m => 
      m.status === 'scheduled' && new Date(m.scheduledAt) > new Date()
    );
    const past = filteredMeetings.filter(m => 
      m.status === 'completed' || new Date(m.scheduledAt) < new Date()
    );
    const cancelled = filteredMeetings.filter(m => m.status === 'cancelled');

    return NextResponse.json({
      upcoming,
      past,
      cancelled,
      total: filteredMeetings.length,
    });
  } catch (error) {
    console.error('Error fetching meetings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meetings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { relationshipId, scheduledAt, durationMinutes, meetingType, meetingLink } = data;

    // Validate required fields
    if (!relationshipId || !scheduledAt) {
      return NextResponse.json(
        { error: 'Relationship ID and scheduled time are required' },
        { status: 400 }
      );
    }

    // Check if user is part of this relationship
    const [relationship] = await db
      .select()
      .from(mentorshipRelationships)
      .where(
        and(
          eq(mentorshipRelationships.id, relationshipId),
          or(
            eq(mentorshipRelationships.mentorUserId, user.id),
            eq(mentorshipRelationships.menteeUserId, user.id)
          )
        )
      )
      .limit(1);

    if (!relationship) {
      return NextResponse.json(
        { error: 'You are not part of this mentorship relationship' },
        { status: 403 }
      );
    }

    // Check if relationship is active
    if (relationship.status !== 'active') {
      return NextResponse.json(
        { error: 'Can only schedule meetings for active relationships' },
        { status: 400 }
      );
    }

    // Create meeting
    const [newMeeting] = await db
      .insert(meetings)
      .values({
        relationshipId,
        scheduledAt: new Date(scheduledAt),
        durationMinutes: durationMinutes || 60,
        meetingType: meetingType || 'regular',
        meetingLink,
        status: 'scheduled',
      })
      .returning();

    // Update next meeting date in relationship
    await db
      .update(mentorshipRelationships)
      .set({
        nextMeetingDate: new Date(scheduledAt),
      })
      .where(eq(mentorshipRelationships.id, relationshipId));

    // Log activity
    await db.insert(activityLogs).values({
      userId: user.id,
      action: ActivityType.SCHEDULE_MEETING,
      entityType: 'meeting',
      entityId: newMeeting.id,
      metadata: { relationshipId, scheduledAt },
    });

    return NextResponse.json({
      message: 'Meeting scheduled successfully',
      meeting: newMeeting,
    });
  } catch (error) {
    console.error('Error creating meeting:', error);
    return NextResponse.json(
      { error: 'Failed to schedule meeting' },
      { status: 500 }
    );
  }
}