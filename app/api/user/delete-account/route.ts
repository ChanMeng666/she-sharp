import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUser, getUserWithTeam } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { users, teamMembers, activityLogs, ActivityType } from '@/lib/db/schema';
import { comparePasswords } from '@/lib/auth/session';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';

const deleteAccountSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
});

/**
 * DELETE /api/user/delete-account
 * Soft deletes user account after password verification.
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

    const { password } = validation.data;

    // Check if user has a password (OAuth users may not)
    if (!user.passwordHash) {
      return NextResponse.json(
        { error: 'No password set for this account. Please contact support for account deletion.' },
        { status: 400 }
      );
    }

    // Verify password
    const isPasswordValid = await comparePasswords(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Incorrect password. Account deletion failed.' },
        { status: 400 }
      );
    }

    const userWithTeam = await getUserWithTeam(user.id);

    // Log activity BEFORE deletion
    await db.insert(activityLogs).values({
      userId: user.id,
      action: ActivityType.DELETE_ACCOUNT,
      entityType: 'user',
      entityId: user.id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      metadata: { softDelete: true },
    });

    // Soft delete - set deletedAt and modify email for uniqueness
    await db
      .update(users)
      .set({
        deletedAt: sql`CURRENT_TIMESTAMP`,
        email: sql`CONCAT(email, '-', id, '-deleted')`,
      })
      .where(eq(users.id, user.id));

    // Remove from team if applicable
    if (userWithTeam?.teamId) {
      await db
        .delete(teamMembers)
        .where(
          and(
            eq(teamMembers.userId, user.id),
            eq(teamMembers.teamId, userWithTeam.teamId)
          )
        );
    }

    // Clear session cookie
    (await cookies()).delete('session');

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
