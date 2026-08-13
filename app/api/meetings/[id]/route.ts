import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { meetings, mentorshipRelationships, activityLogs, ActivityType } from '@/lib/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { withRoles, type AuthedRouteContext } from '@/lib/auth/role-middleware';

// Signed-in only: every handler here then checks the caller is the mentor or
// mentee on the meeting's relationship — an ownership test `withRoles` cannot
// express, so it stays in the handler.
export const GET = withRoles(
  {},
  async (request: NextRequest, { params, user }: AuthedRouteContext<{ id: string }>) => {
  try {
    const { id } = await params;
    const meetingId = parseInt(id);

    if (isNaN(meetingId)) {
      return NextResponse.json(
        { error: 'Invalid meeting ID' },
        { status: 400 }
      );
    }

    // Get meeting
    const [meeting] = await db
      .select()
      .from(meetings)
      .where(eq(meetings.id, meetingId))
      .limit(1);

    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    // Check if user is part of this meeting's relationship
    const [relationship] = await db
      .select()
      .from(mentorshipRelationships)
      .where(
        and(
          eq(mentorshipRelationships.id, meeting.relationshipId),
          or(
            eq(mentorshipRelationships.mentorUserId, user.id),
            eq(mentorshipRelationships.menteeUserId, user.id)
          )
        )
      )
      .limit(1);

    if (!relationship) {
      return NextResponse.json(
        { error: 'You are not authorized to view this meeting' },
        { status: 403 }
      );
    }

    const isMentor = relationship.mentorUserId === user.id;

    return NextResponse.json({
      meeting,
      userRole: isMentor ? 'mentor' : 'mentee',
      relationship: {
        id: relationship.id,
        status: relationship.status,
        mentorUserId: relationship.mentorUserId,
        menteeUserId: relationship.menteeUserId,
      },
    });
  } catch (error) {
    console.error('Error fetching meeting:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meeting' },
      { status: 500 }
    );
  }
});

export const PUT = withRoles(
  {},
  async (request: NextRequest, { params, user }: AuthedRouteContext<{ id: string }>) => {
  try {
    const { id } = await params;
    const meetingId = parseInt(id);

    if (isNaN(meetingId)) {
      return NextResponse.json(
        { error: 'Invalid meeting ID' },
        { status: 400 }
      );
    }

    const data = await request.json();

    // Get meeting
    const [meeting] = await db
      .select()
      .from(meetings)
      .where(eq(meetings.id, meetingId))
      .limit(1);

    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    // Check if user is part of this meeting's relationship
    const [relationship] = await db
      .select()
      .from(mentorshipRelationships)
      .where(
        and(
          eq(mentorshipRelationships.id, meeting.relationshipId),
          or(
            eq(mentorshipRelationships.mentorUserId, user.id),
            eq(mentorshipRelationships.menteeUserId, user.id)
          )
        )
      )
      .limit(1);

    if (!relationship) {
      return NextResponse.json(
        { error: 'You are not authorized to update this meeting' },
        { status: 403 }
      );
    }

    const isMentor = relationship.mentorUserId === user.id;

    // Handle status updates
    if (data.status) {
      if (data.status === 'completed') {
        // Mark meeting as completed
        const [updatedMeeting] = await db
          .update(meetings)
          .set({
            status: 'completed',
            actualStartTime: data.actualStartTime || meeting.scheduledAt,
            actualEndTime: data.actualEndTime || new Date(),
            topicsDiscussed: data.topicsDiscussed,
            goalsSet: data.goalsSet,
            actionItems: data.actionItems,
            mentorNotes: isMentor ? data.notes : meeting.mentorNotes,
            menteeFeedback: !isMentor ? data.feedback : meeting.menteeFeedback,
            rating: !isMentor ? data.rating : meeting.rating,
          })
          .where(eq(meetings.id, meetingId))
          .returning();

        // Log activity
        await db.insert(activityLogs).values({
          userId: user.id,
          action: ActivityType.COMPLETE_MEETING,
          entityType: 'meeting',
          entityId: meetingId,
          metadata: { relationshipId: meeting.relationshipId },
        });

        return NextResponse.json({
          message: 'Meeting completed successfully',
          meeting: updatedMeeting,
        });
      } else if (data.status === 'cancelled') {
        // Cancel meeting
        const [updatedMeeting] = await db
          .update(meetings)
          .set({
            status: 'cancelled',
          })
          .where(eq(meetings.id, meetingId))
          .returning();

        // Log activity
        await db.insert(activityLogs).values({
          userId: user.id,
          action: ActivityType.CANCEL_MEETING,
          entityType: 'meeting',
          entityId: meetingId,
          metadata: { relationshipId: meeting.relationshipId, reason: data.reason },
        });

        return NextResponse.json({
          message: 'Meeting cancelled successfully',
          meeting: updatedMeeting,
        });
      }
    }

    // Regular update (reschedule, update link, etc.)
    const updateData: any = {};
    if (data.scheduledAt) updateData.scheduledAt = new Date(data.scheduledAt);
    if (data.durationMinutes) updateData.durationMinutes = data.durationMinutes;
    if (data.meetingLink) updateData.meetingLink = data.meetingLink;
    if (data.meetingType) updateData.meetingType = data.meetingType;

    const [updatedMeeting] = await db
      .update(meetings)
      .set(updateData)
      .where(eq(meetings.id, meetingId))
      .returning();

    return NextResponse.json({
      message: 'Meeting updated successfully',
      meeting: updatedMeeting,
    });
  } catch (error) {
    console.error('Error updating meeting:', error);
    return NextResponse.json(
      { error: 'Failed to update meeting' },
      { status: 500 }
    );
  }
});

export const DELETE = withRoles(
  {},
  async (request: NextRequest, { params, user }: AuthedRouteContext<{ id: string }>) => {
  try {
    const { id } = await params;
    const meetingId = parseInt(id);

    if (isNaN(meetingId)) {
      return NextResponse.json(
        { error: 'Invalid meeting ID' },
        { status: 400 }
      );
    }

    // Get meeting
    const [meeting] = await db
      .select()
      .from(meetings)
      .where(eq(meetings.id, meetingId))
      .limit(1);

    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    // Check if user is the mentor in this relationship
    const [relationship] = await db
      .select()
      .from(mentorshipRelationships)
      .where(
        and(
          eq(mentorshipRelationships.id, meeting.relationshipId),
          eq(mentorshipRelationships.mentorUserId, user.id)
        )
      )
      .limit(1);

    if (!relationship) {
      return NextResponse.json(
        { error: 'Only mentors can delete meetings' },
        { status: 403 }
      );
    }

    // Delete meeting
    await db.delete(meetings).where(eq(meetings.id, meetingId));

    return NextResponse.json({
      message: 'Meeting deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    return NextResponse.json(
      { error: 'Failed to delete meeting' },
      { status: 500 }
    );
  }
});