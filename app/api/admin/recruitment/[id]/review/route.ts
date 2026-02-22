import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/auth/role-middleware';
import { db } from '@/lib/db/drizzle';
import { volunteerFormSubmissions, activityLogs, ActivityType } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/admin/recruitment/[id]/review
 * Approve or reject a volunteer/ambassador application.
 */
export const POST = withRoles(
  { requiredRoles: ['admin'] },
  async (req: NextRequest, context: any) => {
    try {
      const params = await context.params;
      const id = parseInt(params.id);

      if (isNaN(id)) {
        return NextResponse.json(
          { error: 'Invalid application ID' },
          { status: 400 }
        );
      }

      const body = await req.json();
      const { decision, notes } = body;

      if (!decision || !['approved', 'rejected'].includes(decision)) {
        return NextResponse.json(
          { error: 'Invalid decision. Must be "approved" or "rejected"' },
          { status: 400 }
        );
      }

      const adminUserId = context.user?.id;
      if (!adminUserId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // Fetch current submission
      const [submission] = await db
        .select()
        .from(volunteerFormSubmissions)
        .where(eq(volunteerFormSubmissions.id, id))
        .limit(1);

      if (!submission) {
        return NextResponse.json(
          { error: 'Application not found' },
          { status: 404 }
        );
      }

      // Update the submission status
      const [updated] = await db
        .update(volunteerFormSubmissions)
        .set({
          status: decision as 'approved' | 'rejected',
          reviewedAt: new Date(),
          reviewedBy: adminUserId,
          reviewNotes: notes || null,
          updatedAt: new Date(),
        })
        .where(eq(volunteerFormSubmissions.id, id))
        .returning();

      // Log activity
      await db.insert(activityLogs).values({
        userId: adminUserId,
        action: ActivityType.REVIEW_VOLUNTEER_APPLICATION,
        entityType: 'volunteer_application',
        entityId: id,
        metadata: {
          decision,
          applicantName: `${submission.firstName} ${submission.lastName}`,
          applicationType: submission.type,
          notes: notes || null,
        },
      });

      // Send appropriate email (non-blocking)
      try {
        if (decision === 'approved') {
          const { sendApplicationApprovedEmail } = await import(
            '@/lib/email/recruitment-emails'
          );
          await sendApplicationApprovedEmail(submission.email, {
            applicantName: `${submission.firstName} ${submission.lastName}`,
            applicationType: submission.type,
          });
        } else {
          const { sendApplicationRejectedEmail } = await import(
            '@/lib/email/recruitment-emails'
          );
          await sendApplicationRejectedEmail(submission.email, {
            applicantName: `${submission.firstName} ${submission.lastName}`,
            applicationType: submission.type,
            feedbackMessage: notes || undefined,
          });
        }
      } catch (emailError) {
        console.error('Failed to send review email:', emailError);
      }

      return NextResponse.json({
        success: true,
        message:
          decision === 'approved'
            ? 'Application approved successfully'
            : 'Application rejected',
        submission: updated,
      });
    } catch (error) {
      console.error('Error reviewing recruitment application:', error);
      return NextResponse.json(
        { error: 'Failed to review application' },
        { status: 500 }
      );
    }
  }
);
