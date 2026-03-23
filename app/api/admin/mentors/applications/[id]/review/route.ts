import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/auth/role-middleware';
import { reviewMentorForm } from '@/lib/forms/service';

/**
 * POST /api/admin/mentors/applications/[id]/review
 * Reviews a mentor application (approve or reject).
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
      const { action, notes, isTestUser } = body;

      if (!action || !['approve', 'reject'].includes(action)) {
        return NextResponse.json(
          { error: 'Invalid action. Must be "approve" or "reject"' },
          { status: 400 }
        );
      }

      // Get the admin user ID from context
      const adminUserId = context.user?.id;

      if (!adminUserId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // Use the forms service to handle the review
      const decision = action === 'approve' ? 'approved' : 'rejected';
      const result = await reviewMentorForm(applicationId, adminUserId, decision, notes, isTestUser);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      // Return success response with invitation code if generated
      const response: any = {
        success: true,
        message: action === 'approve'
          ? 'Mentor application approved successfully'
          : 'Mentor application rejected',
      };

      if (result.invitationCode) {
        response.invitationCode = result.invitationCode;
        response.message = 'Mentor application approved. Invitation code sent to applicant.';
      }

      return NextResponse.json(response);
    } catch (error) {
      console.error('Error reviewing mentor application:', error);
      return NextResponse.json(
        { error: 'Failed to review application' },
        { status: 500 }
      );
    }
  }
);
