import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/auth/role-middleware';
import { db } from '@/lib/db/drizzle';
import { mentorProfiles, userRoles, activityLogs } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Admin-only mentor application review endpoint
export const POST = withRoles(
  {
    requiredRoles: ['admin'],
    requiredAdminPermissions: ['canVerifyMentors']
  },
  async (req: NextRequest, context: any) => {
    try {
      const { id } = context.params;
      const applicationId = parseInt(id);

      if (isNaN(applicationId)) {
        return NextResponse.json(
          { error: 'Invalid application ID' },
          { status: 400 }
        );
      }

      const body = await req.json();
      const { action, notes } = body;

      if (!action || !['approve', 'reject'].includes(action)) {
        return NextResponse.json(
          { error: 'Invalid action. Must be "approve" or "reject"' },
          { status: 400 }
        );
      }

      // Get the admin user ID from session
      const adminUserId = context.user?.id;

      if (!adminUserId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // Get the mentor profile
      const [mentorProfile] = await db
        .select()
        .from(mentorProfiles)
        .where(eq(mentorProfiles.id, applicationId));

      if (!mentorProfile) {
        return NextResponse.json(
          { error: 'Application not found' },
          { status: 404 }
        );
      }

      if (action === 'approve') {
        // Update mentor profile with verification
        await db
          .update(mentorProfiles)
          .set({
            verifiedAt: new Date(),
            verifiedBy: adminUserId,
          })
          .where(eq(mentorProfiles.id, applicationId));

        // Update user role to mark mentor role as verified
        await db
          .update(userRoles)
          .set({
            verifiedAt: new Date(),
          })
          .where(
            and(
              eq(userRoles.userId, mentorProfile.userId),
              eq(userRoles.roleType, 'mentor')
            )
          );

        // Log the activity
        await db.insert(activityLogs).values({
          userId: adminUserId,
          action: 'mentor_application_approved',
          entityType: 'mentor_profile',
          entityId: applicationId,
          metadata: {
            mentorUserId: mentorProfile.userId,
            notes: notes || null,
          },
          timestamp: new Date(),
        });

        return NextResponse.json({
          success: true,
          message: 'Mentor application approved successfully'
        });
      } else {
        // For rejection, we'll just update the profile to mark it as rejected
        // In a real system, you might want a separate field for this
        // For now, we'll delete the mentor profile
        await db
          .delete(mentorProfiles)
          .where(eq(mentorProfiles.id, applicationId));

        // Deactivate the mentor role
        await db
          .update(userRoles)
          .set({
            isActive: false,
          })
          .where(
            and(
              eq(userRoles.userId, mentorProfile.userId),
              eq(userRoles.roleType, 'mentor')
            )
          );

        // Log the activity
        await db.insert(activityLogs).values({
          userId: adminUserId,
          action: 'mentor_application_rejected',
          entityType: 'mentor_profile',
          entityId: applicationId,
          metadata: {
            mentorUserId: mentorProfile.userId,
            notes: notes || null,
          },
          timestamp: new Date(),
        });

        return NextResponse.json({
          success: true,
          message: 'Mentor application rejected successfully'
        });
      }
    } catch (error) {
      console.error('Error reviewing mentor application:', error);
      return NextResponse.json(
        { error: 'Failed to review application' },
        { status: 500 }
      );
    }
  }
);
