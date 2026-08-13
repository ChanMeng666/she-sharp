import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { mentorshipRelationships, mentorProfiles, activityLogs, ActivityType } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { withRoles, type AuthedContext } from '@/lib/auth/role-middleware';
import { z } from 'zod';
import { invalidBody } from '@/lib/api/validation';

const approveSchema = z.object({
  relationshipId: z.coerce
    .number()
    .int()
    .positive({ message: 'Relationship ID and action are required' }),
  action: z.enum(['approve', 'reject'], {
    errorMap: () => ({ message: 'Invalid action. Must be "approve" or "reject"' }),
  }),
  feedback: z.string().nullish(),
});

// Signed-in only: the "is this user the mentor on this relationship?" test is an
// ownership check against a row, which `withRoles` cannot express, so it stays
// in the handler.
export const POST = withRoles({}, async (request: NextRequest, { user }: AuthedContext) => {
  try {
    const parsed = approveSchema.safeParse(await request.json());
    if (!parsed.success) {
      return invalidBody(parsed.error);
    }
    const { relationshipId, action, feedback } = parsed.data;

    // Get the relationship
    const [relationship] = await db
      .select()
      .from(mentorshipRelationships)
      .where(eq(mentorshipRelationships.id, relationshipId))
      .limit(1);

    if (!relationship) {
      return NextResponse.json(
        { error: 'Relationship not found' },
        { status: 404 }
      );
    }

    // Check if user is the mentor
    if (relationship.mentorUserId !== user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to approve this application' },
        { status: 403 }
      );
    }

    // Check if relationship is pending
    if (relationship.status !== 'pending') {
      return NextResponse.json(
        { error: 'This application is not pending' },
        { status: 400 }
      );
    }

    let updatedRelationship;
    
    if (action === 'approve') {
      // Update relationship status to active
      [updatedRelationship] = await db
        .update(mentorshipRelationships)
        .set({
          status: 'active',
          startedAt: new Date(),
          mentorNotes: feedback || null,
          updatedAt: new Date(),
        })
        .where(eq(mentorshipRelationships.id, relationshipId))
        .returning();

      // Increment mentor's current mentees count
      await db
        .update(mentorProfiles)
        .set({
          currentMenteesCount: sql`${mentorProfiles.currentMenteesCount} + 1`,
        })
        .where(eq(mentorProfiles.userId, user.id));

      // Check if mentor should stop accepting new mentees
      const [mentorProfile] = await db
        .select()
        .from(mentorProfiles)
        .where(eq(mentorProfiles.userId, user.id))
        .limit(1);

      if (mentorProfile && mentorProfile.currentMenteesCount && mentorProfile.maxMentees && mentorProfile.currentMenteesCount >= mentorProfile.maxMentees) {
        await db
          .update(mentorProfiles)
          .set({
            isAcceptingMentees: false,
          })
          .where(eq(mentorProfiles.userId, user.id));
      }

      // Log activity
      await db.insert(activityLogs).values({
        userId: user.id,
        action: ActivityType.ACCEPT_MENTEE,
        entityType: 'relationship',
        entityId: relationshipId,
        metadata: { menteeId: relationship.menteeUserId, feedback },
      });

    } else {
      // Reject the application
      [updatedRelationship] = await db
        .update(mentorshipRelationships)
        .set({
          status: 'rejected',
          mentorNotes: feedback || null,
          updatedAt: new Date(),
        })
        .where(eq(mentorshipRelationships.id, relationshipId))
        .returning();

      // Log activity
      await db.insert(activityLogs).values({
        userId: user.id,
        action: ActivityType.REJECT_MENTEE,
        entityType: 'relationship',
        entityId: relationshipId,
        metadata: { menteeId: relationship.menteeUserId, feedback },
      });
    }

    // TODO: Send notification to mentee (email/in-app)

    return NextResponse.json({
      message: `Application ${action}d successfully`,
      relationship: updatedRelationship,
    });
  } catch (error) {
    console.error('Error processing mentorship application:', error);
    return NextResponse.json(
      { error: 'Failed to process application' },
      { status: 500 }
    );
  }
});