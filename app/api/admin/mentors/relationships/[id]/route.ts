import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/auth/role-middleware';
import { db } from '@/lib/db/drizzle';
import { mentorshipRelationships } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Admin-only endpoint to update a specific relationship
export const PATCH = withRoles(
  {
    requiredRoles: ['admin'],
    requiredAdminPermissions: ['canManageRelationships']
  },
  async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await context.params;
      const relationshipId = parseInt(id, 10);

      if (isNaN(relationshipId)) {
        return NextResponse.json(
          { error: 'Invalid relationship ID' },
          { status: 400 }
        );
      }

      const body = await req.json();
      const { status, endReason } = body;

      // Validate status if provided
      const validStatuses = ['active', 'paused', 'completed', 'terminated'];
      if (status && !validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be one of: active, paused, completed, terminated' },
          { status: 400 }
        );
      }

      // Check if relationship exists
      const [existingRelationship] = await db
        .select()
        .from(mentorshipRelationships)
        .where(eq(mentorshipRelationships.id, relationshipId))
        .limit(1);

      if (!existingRelationship) {
        return NextResponse.json(
          { error: 'Relationship not found' },
          { status: 404 }
        );
      }

      // Build update object
      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (status) {
        updateData.status = status;

        // If completing/terminating, set the end date
        if (status === 'completed' || status === 'terminated') {
          updateData.endedAt = new Date();
        }

        // If resuming from paused, clear end date
        if (status === 'active' && existingRelationship.status === 'paused') {
          updateData.endedAt = null;
        }
      }

      // Store end reason in mentor notes if provided
      if (endReason) {
        const existingNotes = existingRelationship.mentorNotes || '';
        const timestamp = new Date().toISOString();
        updateData.mentorNotes = existingNotes
          ? `${existingNotes}\n\n[Admin - ${timestamp}] Relationship ended: ${endReason}`
          : `[Admin - ${timestamp}] Relationship ended: ${endReason}`;
      }

      // Update the relationship
      await db
        .update(mentorshipRelationships)
        .set(updateData)
        .where(eq(mentorshipRelationships.id, relationshipId));

      return NextResponse.json({
        success: true,
        message: `Relationship ${status ? `status updated to ${status}` : 'updated'}`,
      });
    } catch (error) {
      console.error('Error updating relationship:', error);
      return NextResponse.json(
        { error: 'Failed to update relationship' },
        { status: 500 }
      );
    }
  }
);

// Admin-only endpoint to get a specific relationship
export const GET = withRoles(
  {
    requiredRoles: ['admin'],
    requiredAdminPermissions: ['canManageRelationships']
  },
  async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await context.params;
      const relationshipId = parseInt(id, 10);

      if (isNaN(relationshipId)) {
        return NextResponse.json(
          { error: 'Invalid relationship ID' },
          { status: 400 }
        );
      }

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

      return NextResponse.json({ relationship });
    } catch (error) {
      console.error('Error fetching relationship:', error);
      return NextResponse.json(
        { error: 'Failed to fetch relationship' },
        { status: 500 }
      );
    }
  }
);
