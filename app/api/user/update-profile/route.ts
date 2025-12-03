import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { users, mentorProfiles, menteeProfiles, userRoles, activityLogs, ActivityType } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { createEmailVerificationToken } from '@/lib/auth/email-verification';

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(50).optional().nullable(),
  age: z.number().int().min(13).max(120).optional().nullable(),
  gender: z.enum(['female', 'male', 'non_binary', 'prefer_not_to_say', 'other']).optional().nullable(),
  image: z.string().url().optional().nullable(),
});

/**
 * POST /api/user/update-profile
 * Updates user profile with role-based photo sync.
 * - For mentor/mentee: updates profile tables with photoUrl
 * - For admin: simplified update (no photo)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateProfileSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.errors.map(e => e.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { name, email, phone, age, gender, image } = validation.data;
    const emailChanged = email !== user.email;

    // Get user's active roles
    const roles = await db
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, user.id),
          eq(userRoles.isActive, true)
        )
      );

    const activeRoles = roles.map(r => r.roleType);
    const isMentor = activeRoles.includes('mentor');
    const isMentee = activeRoles.includes('mentee');
    const isAdmin = activeRoles.includes('admin');

    // Update user basic info
    const userUpdateData: Record<string, unknown> = {
      name,
      email,
      updatedAt: new Date(),
    };

    // Only update extended fields for non-admin users
    if (!isAdmin || isMentor || isMentee) {
      if (phone !== undefined) userUpdateData.phone = phone;
      if (age !== undefined) userUpdateData.age = age;
      if (gender !== undefined) userUpdateData.gender = gender;
    }

    // If email changed, need to re-verify
    if (emailChanged) {
      userUpdateData.emailVerifiedAt = null;
    }

    await db.update(users).set(userUpdateData).where(eq(users.id, user.id));

    // Update photo in profile tables based on roles (skip for admin-only users)
    if (image && (isMentor || isMentee)) {
      const updatePromises: Promise<unknown>[] = [];

      if (isMentor) {
        updatePromises.push(
          db
            .update(mentorProfiles)
            .set({ photoUrl: image })
            .where(eq(mentorProfiles.userId, user.id))
        );
      }

      if (isMentee) {
        updatePromises.push(
          db
            .update(menteeProfiles)
            .set({ photoUrl: image })
            .where(eq(menteeProfiles.userId, user.id))
        );
      }

      await Promise.all(updatePromises);
    }

    // If email changed, create new verification token
    if (emailChanged) {
      await createEmailVerificationToken(user.id);
    }

    // Log activity
    await db.insert(activityLogs).values({
      userId: user.id,
      action: ActivityType.UPDATE_ACCOUNT,
      entityType: 'user',
      entityId: user.id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      metadata: {
        updatedFields: Object.keys(validation.data).filter(k => validation.data[k as keyof typeof validation.data] !== undefined),
        emailChanged,
      },
    });

    return NextResponse.json({
      success: true,
      message: emailChanged
        ? 'Profile updated. Please verify your new email address.'
        : 'Profile updated successfully.',
      emailChanged,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
