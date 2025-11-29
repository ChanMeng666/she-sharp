import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import {
  getMentorForm,
  saveMentorForm,
  submitMentorForm,
} from '@/lib/forms/service';

/**
 * GET /api/forms/mentor
 * Gets the current user's mentor form.
 */
export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const form = await getMentorForm(user.id);
    return NextResponse.json({ form });
  } catch (error) {
    console.error('Error getting mentor form:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/forms/mentor
 * Saves mentor form data.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const result = await saveMentorForm(user.id, data);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving mentor form:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/forms/mentor
 * Submits mentor form for review.
 */
export async function PUT() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await submitMentorForm(user.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error submitting mentor form:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
