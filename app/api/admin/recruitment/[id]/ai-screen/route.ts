import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/auth/role-middleware';
import { db } from '@/lib/db/drizzle';
import { volunteerFormSubmissions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { screenVolunteerApplication } from '@/lib/recruitment/ai-screening';

/**
 * POST /api/admin/recruitment/[id]/ai-screen
 * Run AI screening on a single application.
 */
export const POST = withRoles(
  { requiredRoles: ['admin'] },
  async (req: NextRequest, context: any) => {
    try {
      const adminUserId = context.user?.id;
      if (!adminUserId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const params = await context.params;
      const id = parseInt(params.id);

      if (isNaN(id)) {
        return NextResponse.json(
          { error: 'Invalid application ID' },
          { status: 400 }
        );
      }

      // Verify submission exists
      const [submission] = await db
        .select({ id: volunteerFormSubmissions.id })
        .from(volunteerFormSubmissions)
        .where(eq(volunteerFormSubmissions.id, id))
        .limit(1);

      if (!submission) {
        return NextResponse.json(
          { error: 'Application not found' },
          { status: 404 }
        );
      }

      const result = await screenVolunteerApplication(id, adminUserId);

      return NextResponse.json({
        success: true,
        message: 'AI screening completed',
        result,
      });
    } catch (error) {
      console.error('Error running AI screening:', error);
      const message = error instanceof Error ? error.message : 'Failed to run AI screening';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }
);
