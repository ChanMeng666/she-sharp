'use server';

import { z } from 'zod';
import { auth } from '@/lib/auth/auth.config';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { validatedAction } from '@/lib/auth/middleware';
import { applyInvitationCode } from '@/lib/invitations/apply-code';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const verifySchema = z.object({
  invitationCode: z.string().min(1, 'Invitation code is required'),
});

export const verifyOAuthInvitationCode = validatedAction(verifySchema, async (data) => {
  const { invitationCode } = data;

  // Get current OAuth session
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Session expired. Please sign in again.', invitationCode };
  }

  const userId = parseInt(session.user.id);

  // Get user from database
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return { error: 'User not found.', invitationCode };
  }

  // Check if already verified
  if (user.inviteCodeVerifiedAt) {
    redirect('/dashboard');
  }

  // Apply the invitation code using shared logic
  const result = await applyInvitationCode(userId, invitationCode, user.email);

  if (!result.success) {
    return { error: result.error, invitationCode };
  }

  // Set verification cookie for middleware
  const cookieStore = await cookies();
  cookieStore.set({
    name: 'oauth-verified',
    value: 'true',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  redirect('/dashboard');
});
