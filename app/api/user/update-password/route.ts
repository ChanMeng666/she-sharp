import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { activityLogs, ActivityType } from '@/lib/db/schema';
import { comparePasswords } from '@/lib/auth/session';
import { updatePasswordWithHistory } from '@/lib/auth/password-history';
import { validatePasswordStrength } from '@/lib/auth/password-validation';
import { z } from 'zod';

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(8, 'Password must be at least 8 characters').max(100),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(100),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters').max(100),
});

/**
 * POST /api/user/update-password
 * Updates user password with validation, strength check, and history tracking.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = updatePasswordSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.errors.map(e => e.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { currentPassword, newPassword, confirmPassword } = validation.data;

    // Check if user has a password (OAuth users may not)
    if (!user.passwordHash) {
      return NextResponse.json(
        { error: 'No password set for this account. You may have signed up with OAuth.' },
        { status: 400 }
      );
    }

    // Verify current password
    const isPasswordValid = await comparePasswords(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      // Log failed attempt
      await db.insert(activityLogs).values({
        userId: user.id,
        action: ActivityType.UPDATE_PASSWORD,
        entityType: 'user',
        entityId: user.id,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        metadata: { success: false, reason: 'invalid_current_password' },
      });

      return NextResponse.json(
        { error: 'Current password is incorrect.' },
        { status: 400 }
      );
    }

    // Check new password is different from current
    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: 'New password must be different from the current password.' },
        { status: 400 }
      );
    }

    // Confirm password match
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'New password and confirmation password do not match.' },
        { status: 400 }
      );
    }

    // Validate password strength
    const strengthResult = validatePasswordStrength(newPassword);
    if (!strengthResult.isValid) {
      return NextResponse.json(
        {
          error: 'Password does not meet security requirements.',
          feedback: strengthResult.feedback,
        },
        { status: 400 }
      );
    }

    // Update password with history tracking (checks reuse policy)
    const result = await updatePasswordWithHistory(user.id, newPassword);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update password.' },
        { status: 400 }
      );
    }

    // Log successful password update
    await db.insert(activityLogs).values({
      userId: user.id,
      action: ActivityType.UPDATE_PASSWORD,
      entityType: 'user',
      entityId: user.id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      metadata: { success: true },
    });

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (error) {
    console.error('Error updating password:', error);
    return NextResponse.json(
      { error: 'Failed to update password' },
      { status: 500 }
    );
  }
}
