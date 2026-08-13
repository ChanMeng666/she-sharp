import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/auth/role-middleware';
import { db } from '@/lib/db/drizzle';
import { volunteerFormSubmissions, activityLogs, ActivityType } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { invalidBody } from '@/lib/api/validation';

const VALID_STAGES = [
  'new',
  'contacted',
  'screening',
  'interview_requested',
  'interview_scheduled',
  'approved',
  'rejected',
  'onboarding',
  'nda_sent',
  'nda_signed',
  'active',
] as const;

const updateStageSchema = z.object({
  stage: z.enum(VALID_STAGES, {
    errorMap: () => ({
      message: `Invalid stage. Must be one of: ${VALID_STAGES.join(', ')}`,
    }),
  }),
  notes: z.string().nullish(),
});

/**
 * PATCH /api/admin/recruitment/[id]/stage
 * Update the recruitment pipeline stage for an application.
 */
export const PATCH = withRoles(
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

      const parsed = updateStageSchema.safeParse(await req.json());
      if (!parsed.success) {
        return invalidBody(parsed.error);
      }
      const { stage, notes } = parsed.data;

      const adminUserId = context.user?.id;
      const adminName = context.user?.name || 'Admin';

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

      const oldStage = submission.recruitmentStage || 'new';

      // Update the recruitment stage
      const updateData: Record<string, any> = {
        recruitmentStage: stage,
        recruitmentStageUpdatedAt: new Date(),
        recruitmentStageUpdatedBy: adminUserId,
        updatedAt: new Date(),
      };

      // Set additional timestamp fields based on new stage
      if (stage === 'nda_sent') {
        updateData.ndaSentAt = new Date();
      }

      if (notes) {
        updateData.adminNotes = notes;
      }

      const [updated] = await db
        .update(volunteerFormSubmissions)
        .set(updateData)
        .where(eq(volunteerFormSubmissions.id, id))
        .returning();

      // Log activity
      await db.insert(activityLogs).values({
        userId: adminUserId,
        action: ActivityType.UPDATE_RECRUITMENT_STAGE,
        entityType: 'volunteer_application',
        entityId: id,
        metadata: {
          oldStage,
          newStage: stage,
          applicantName: `${submission.firstName} ${submission.lastName}`,
          applicationType: submission.type,
          notes: notes || null,
        },
      });

      // Send Slack notification (non-blocking)
      try {
        const { sendRecruitmentStageNotification } = await import(
          '@/lib/slack/service'
        );
        await sendRecruitmentStageNotification({
          applicantName: `${submission.firstName} ${submission.lastName}`,
          applicationType: submission.type,
          oldStage,
          newStage: stage,
          updatedBy: adminName,
        });
      } catch (slackError) {
        console.error('Failed to send Slack notification:', slackError);
      }

      // Send stage-specific emails (non-blocking)
      try {
        if (stage === 'interview_scheduled' || stage === 'interview_requested') {
          const { sendInterviewInvitationEmail } = await import(
            '@/lib/email/recruitment-emails'
          );
          await sendInterviewInvitationEmail(submission.email, {
            applicantName: `${submission.firstName} ${submission.lastName}`,
            applicationType: submission.type,
            interviewDate: submission.interviewScheduledAt
              ? submission.interviewScheduledAt.toISOString()
              : undefined,
            interviewNotes: submission.interviewNotes || undefined,
          });
        } else if (stage === 'onboarding') {
          const { sendOnboardingEmail } = await import(
            '@/lib/email/recruitment-emails'
          );
          await sendOnboardingEmail(submission.email, {
            applicantName: `${submission.firstName} ${submission.lastName}`,
            applicationType: submission.type,
          });
        } else if (stage === 'nda_sent') {
          const { sendNDAReminderEmail } = await import(
            '@/lib/email/recruitment-emails'
          );
          await sendNDAReminderEmail(submission.email, {
            applicantName: `${submission.firstName} ${submission.lastName}`,
          });
        }
      } catch (emailError) {
        console.error('Failed to send stage email:', emailError);
      }

      return NextResponse.json({
        success: true,
        message: `Stage updated from "${oldStage}" to "${stage}"`,
        submission: updated,
      });
    } catch (error) {
      console.error('Error updating recruitment stage:', error);
      return NextResponse.json(
        { error: 'Failed to update recruitment stage' },
        { status: 500 }
      );
    }
  }
);
