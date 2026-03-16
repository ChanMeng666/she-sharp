import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/auth/role-middleware';
import { reviewMenteeForm } from '@/lib/forms/service';

/**
 * POST /api/admin/mentees/applications/[id]/review
 * Reviews a mentee application (approve or reject).
 */
export const POST = withRoles(
  {
    requiredRoles: ['admin'],
    requiredAdminPermissions: ['canVerifyMentors']
  },
  async (req: NextRequest, context: any) => {
    try {
      const params = await context.params;
      const { id } = params;
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

      const adminUserId = context.user?.id;

      if (!adminUserId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const decision = action === 'approve' ? 'approved' : 'rejected';
      const result = await reviewMenteeForm(applicationId, adminUserId, decision, notes);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      const response: any = {
        success: true,
        message: action === 'approve'
          ? 'Mentee application approved successfully'
          : 'Mentee application rejected',
      };

      if (result.invitationCode) {
        response.invitationCode = result.invitationCode;
        response.message = 'Mentee application approved. Invitation code sent to applicant.';
      }

      return NextResponse.json(response);
    } catch (error) {
      console.error('Error reviewing mentee application:', error);
      return NextResponse.json(
        { error: 'Failed to review application' },
        { status: 500 }
      );
    }
  }
);
