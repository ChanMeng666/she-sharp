import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/auth/role-middleware';
import { db } from '@/lib/db/drizzle';
import { volunteerFormSubmissions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/admin/recruitment/[id]
 * Return a single volunteer/ambassador submission with all fields.
 */
export const GET = withRoles(
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

      return NextResponse.json({ submission });
    } catch (error) {
      console.error('Error fetching recruitment application:', error);
      return NextResponse.json(
        { error: 'Failed to fetch application' },
        { status: 500 }
      );
    }
  }
);

/**
 * PATCH /api/admin/recruitment/[id]
 * Update editable fields: adminNotes, interviewNotes, interviewScheduledAt, interviewRequestedBy.
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

      const body = await req.json();
      const allowedFields = [
        'adminNotes',
        'interviewNotes',
        'interviewScheduledAt',
        'interviewRequestedBy',
      ] as const;

      // Build update payload from allowed fields only
      const updateData: Record<string, any> = { updatedAt: new Date() };
      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          if (field === 'interviewScheduledAt' && body[field]) {
            updateData[field] = new Date(body[field]);
          } else {
            updateData[field] = body[field];
          }
        }
      }

      if (Object.keys(updateData).length === 1) {
        return NextResponse.json(
          { error: 'No valid fields to update' },
          { status: 400 }
        );
      }

      const [updated] = await db
        .update(volunteerFormSubmissions)
        .set(updateData)
        .where(eq(volunteerFormSubmissions.id, id))
        .returning();

      if (!updated) {
        return NextResponse.json(
          { error: 'Application not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, submission: updated });
    } catch (error) {
      console.error('Error updating recruitment application:', error);
      return NextResponse.json(
        { error: 'Failed to update application' },
        { status: 500 }
      );
    }
  }
);
