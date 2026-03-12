import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUser } from '@/lib/db/queries';
import { comparePasswords } from '@/lib/auth/session';
import { z } from 'zod';
import { processUserDeletion } from '@/lib/user/deletion-service';

const deleteAccountSchema = z.object({
  password: z.string().min(8).max(100).optional(),
  emailConfirm: z.string().email().optional(),
}).refine(data => data.password || data.emailConfirm, {
  message: 'Either password or email confirmation is required',
});

/**
 * DELETE /api/user/delete-account
 * Soft deletes user account with comprehensive data cleanup.
 * Supports both password verification (for password users) and
 * email confirmation (for OAuth users).
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = deleteAccountSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.errors.map(e => e.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { password, emailConfirm } = validation.data;

    // Verification logic
    if (password) {
      // Password verification for users with passwords
      if (!user.passwordHash) {
        return NextResponse.json(
          { error: 'No password set for this account. Please use email confirmation instead.' },
          { status: 400 }
        );
      }

      const isPasswordValid = await comparePasswords(password, user.passwordHash);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Incorrect password. Account deletion failed.' },
          { status: 400 }
        );
      }
    } else if (emailConfirm) {
      // Email confirmation for OAuth users (or as fallback)
      if (emailConfirm !== user.email) {
        return NextResponse.json(
          { error: 'Email address does not match. Please enter your exact email address.' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Verification required. Please provide password or email confirmation.' },
        { status: 400 }
      );
    }

    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';

    // Process comprehensive user deletion with data cleanup
    const deletionResult = await processUserDeletion(user.id, ipAddress);

    if (!deletionResult.success) {
      console.error('Deletion errors:', deletionResult.errors);
      return NextResponse.json(
        { error: 'Failed to delete account. Please try again or contact support.' },
        { status: 500 }
      );
    }

    // Clear session cookie
    (await cookies()).delete('session');

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully. Your data will be retained for 30 days before permanent removal.',
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
