import { NextRequest, NextResponse } from 'next/server';
import { withRoles, type AuthedContext } from '@/lib/auth/role-middleware';
import {
  getMenteeForm,
  saveMenteeForm,
  submitMenteeForm,
} from '@/lib/forms/service';

/**
 * GET /api/forms/mentee
 * Gets the current user's mentee form.
 */
export const GET = withRoles({}, async (_request: NextRequest, { user }: AuthedContext) => {
  try {
    const form = await getMenteeForm(user.id);
    return NextResponse.json({ form });
  } catch (error) {
    console.error('Error getting mentee form:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/forms/mentee
 * Saves mentee form data.
 */
export const POST = withRoles({}, async (request: NextRequest, { user }: AuthedContext) => {
  try {
    const data = await request.json();
    const result = await saveMenteeForm(user.id, data);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving mentee form:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

/**
 * PUT /api/forms/mentee
 * Submits mentee form.
 */
export const PUT = withRoles({}, async (_request: NextRequest, { user }: AuthedContext) => {
  try {
    const result = await submitMenteeForm(user.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error submitting mentee form:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
