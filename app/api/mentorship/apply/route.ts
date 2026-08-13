import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { mentorshipRelationships, mentorProfiles, userRoles, activityLogs, ActivityType } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { withRoles, type AuthedContext } from '@/lib/auth/role-middleware';

export const POST = withRoles({}, async (request: NextRequest, { user }: AuthedContext) => {
  try {
    const { mentorId, message } = await request.json();

    if (!mentorId || !message) {
      return NextResponse.json(
        { error: 'Mentor ID and message are required' },
        { status: 400 }
      );
    }

    // Check if user has mentee role
    const [menteeRole] = await db
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, user.id),
          eq(userRoles.roleType, 'mentee'),
          eq(userRoles.isActive, true)
        )
      )
      .limit(1);

    if (!menteeRole) {
      return NextResponse.json(
        { error: 'You need to activate your mentee role first' },
        { status: 400 }
      );
    }

    // Check if mentor exists and is accepting mentees
    const [mentor] = await db
      .select()
      .from(mentorProfiles)
      .where(eq(mentorProfiles.userId, mentorId))
      .limit(1);

    if (!mentor) {
      return NextResponse.json(
        { error: 'Mentor not found' },
        { status: 404 }
      );
    }

    if (!mentor.isAcceptingMentees) {
      return NextResponse.json(
        { error: 'This mentor is not accepting new mentees' },
        { status: 400 }
      );
    }

    // Check if mentor has available spots
    const currentCount = mentor.currentMenteesCount || 0;
    const maxCount = mentor.maxMentees || 3;
    if (currentCount >= maxCount) {
      return NextResponse.json(
        { error: 'This mentor has no available spots' },
        { status: 400 }
      );
    }

    // Check if relationship already exists
    const [existingRelationship] = await db
      .select()
      .from(mentorshipRelationships)
      .where(
        and(
          eq(mentorshipRelationships.mentorUserId, mentorId),
          eq(mentorshipRelationships.menteeUserId, user.id)
        )
      )
      .limit(1);

    if (existingRelationship) {
      if (existingRelationship.status === 'pending') {
        return NextResponse.json(
          { error: 'You already have a pending application with this mentor' },
          { status: 400 }
        );
      }
      if (existingRelationship.status === 'active') {
        return NextResponse.json(
          { error: 'You already have an active mentorship with this mentor' },
          { status: 400 }
        );
      }
      if (existingRelationship.status === 'rejected' && existingRelationship.updatedAt) {
        // Check if it's been at least 30 days since rejection
        const daysSinceRejection = Math.floor(
          (Date.now() - new Date(existingRelationship.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceRejection < 30) {
          return NextResponse.json(
            { error: `Please wait ${30 - daysSinceRejection} more days before reapplying` },
            { status: 400 }
          );
        }
      }
    }

    // Create or update the mentorship relationship
    let relationship;
    if (existingRelationship) {
      // Update existing relationship (reapplication)
      [relationship] = await db
        .update(mentorshipRelationships)
        .set({
          status: 'pending',
          menteeNotes: message,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(mentorshipRelationships.mentorUserId, mentorId),
            eq(mentorshipRelationships.menteeUserId, user.id)
          )
        )
        .returning();
    } else {
      // Create new relationship
      [relationship] = await db
        .insert(mentorshipRelationships)
        .values({
          mentorUserId: mentorId,
          menteeUserId: user.id,
          status: 'pending',
          menteeNotes: message,
        })
        .returning();
    }

    // Log activity
    await db.insert(activityLogs).values({
      userId: user.id,
      action: ActivityType.REQUEST_MENTOR,
      entityType: 'relationship',
      entityId: relationship.id,
      metadata: { mentorId, message },
    });

    return NextResponse.json({
      message: 'Application sent successfully',
      relationship,
    });
  } catch (error) {
    console.error('Error applying for mentorship:', error);
    return NextResponse.json(
      { error: 'Failed to send application' },
      { status: 500 }
    );
  }
});