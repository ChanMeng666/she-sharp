import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/auth/role-middleware';
import { db } from '@/lib/db/drizzle';
import {
  volunteerFormSubmissions,
  activityLogs,
  ActivityType,
} from '@/lib/db/schema';
import { inArray } from 'drizzle-orm';
import { sendRecruitmentStageNotification } from '@/lib/slack/service';
import { batchScreenApplications } from '@/lib/recruitment/ai-screening';

/**
 * POST /api/admin/recruitment/bulk
 * Perform bulk operations on recruitment applications.
 * Supports: stage_update, ai_screen.
 */
export const POST = withRoles(
  { requiredRoles: ['admin'] },
  async (req: NextRequest, context: any) => {
    try {
      const adminUserId = context.user?.id;
      const adminName = context.user?.name || 'Admin';

      if (!adminUserId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const body = await req.json();
      const { ids, action, stage } = body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json(
          { error: 'ids array is required and must not be empty' },
          { status: 400 }
        );
      }

      if (!action || !['stage_update', 'ai_screen'].includes(action)) {
        return NextResponse.json(
          { error: 'Invalid action. Must be "stage_update" or "ai_screen"' },
          { status: 400 }
        );
      }

      if (action === 'stage_update') {
        const validStages = [
          'new', 'contacted', 'screening', 'interview_requested',
          'interview_scheduled', 'approved', 'rejected', 'onboarding',
          'nda_sent', 'nda_signed', 'active',
        ];

        if (!stage || !validStages.includes(stage)) {
          return NextResponse.json(
            { error: `Invalid stage. Must be one of: ${validStages.join(', ')}` },
            { status: 400 }
          );
        }

        // Fetch current submissions for logging
        const submissions = await db
          .select({
            id: volunteerFormSubmissions.id,
            firstName: volunteerFormSubmissions.firstName,
            lastName: volunteerFormSubmissions.lastName,
            type: volunteerFormSubmissions.type,
            recruitmentStage: volunteerFormSubmissions.recruitmentStage,
          })
          .from(volunteerFormSubmissions)
          .where(inArray(volunteerFormSubmissions.id, ids));

        // Bulk update stage
        const updateData: Record<string, any> = {
          recruitmentStage: stage,
          recruitmentStageUpdatedAt: new Date(),
          recruitmentStageUpdatedBy: adminUserId,
          updatedAt: new Date(),
        };

        if (stage === 'nda_sent') {
          updateData.ndaSentAt = new Date();
        }

        await db
          .update(volunteerFormSubmissions)
          .set(updateData)
          .where(inArray(volunteerFormSubmissions.id, ids));

        // Log activity
        await db.insert(activityLogs).values({
          userId: adminUserId,
          action: ActivityType.UPDATE_RECRUITMENT_STAGE,
          entityType: 'volunteer_application',
          entityId: 0,
          metadata: {
            bulkAction: true,
            targetIds: ids,
            newStage: stage,
            count: submissions.length,
          },
        });

        // Send Slack notifications (non-blocking)
        try {
          for (const sub of submissions) {
            await sendRecruitmentStageNotification({
              applicantName: `${sub.firstName} ${sub.lastName}`,
              applicationType: sub.type,
              oldStage: sub.recruitmentStage || 'new',
              newStage: stage,
              updatedBy: adminName,
            });
          }
        } catch (slackError) {
          console.error('Failed to send bulk Slack notifications:', slackError);
        }

        return NextResponse.json({
          success: true,
          action: 'stage_update',
          affectedCount: submissions.length,
          message: `Updated ${submissions.length} application(s) to stage "${stage}"`,
        });
      }

      if (action === 'ai_screen') {
        const results = await batchScreenApplications(ids, adminUserId);

        const successCount = Array.from(results.values()).filter(
          (r) => !('error' in r)
        ).length;

        const resultList = Array.from(results.entries()).map(([id, r]) => ({
          id,
          success: !('error' in r),
          ...('error' in r ? { error: r.error } : {}),
        }));

        return NextResponse.json({
          success: true,
          action: 'ai_screen',
          results: resultList,
          message: `Screened ${successCount}/${results.size} application(s)`,
        });
      }

      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    } catch (error) {
      console.error('Error performing bulk recruitment action:', error);
      return NextResponse.json(
        { error: 'Failed to perform bulk action' },
        { status: 500 }
      );
    }
  }
);
