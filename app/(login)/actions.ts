'use server';

import { z } from 'zod';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  User,
  users,
  activityLogs,
  userMemberships,
  userRoles,
  menteeFormSubmissions,
  mentorFormSubmissions,
  mentorProfiles,
  menteeProfiles,
  type NewUser,
  type NewActivityLog,
  type NewUserMembership,
  type NewUserRole,
  ActivityType,
  emailVerifications,
  invitationCodes,
} from '@/lib/db/schema';
import { validateInvitationCode, useInvitationCode } from '@/lib/invitations/service';
import { addToWaitingQueue } from '@/lib/matching/queue-service';
import { comparePasswords, hashPassword, setSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getUser } from '@/lib/db/queries';
import {
  validatedAction,
  validatedActionWithUser
} from '@/lib/auth/middleware';
import { createEmailVerificationToken } from '@/lib/auth/email-verification';
import { sendVerificationEmail } from '@/lib/email/service';
import { isAccountLocked, recordFailedLoginAttempt, clearLoginAttempts } from '@/lib/auth/account-lock';
import { setRememberMeCookie } from '@/lib/auth/remember-me';
import { updatePasswordWithHistory } from '@/lib/auth/password-history';

async function logActivity(
  userId: number,
  type: ActivityType,
  ipAddress?: string
) {
  const newActivity: NewActivityLog = {
    userId,
    action: type,
    entityType: 'user',
    entityId: userId,
    ipAddress: ipAddress || '',
  };
  await db.insert(activityLogs).values(newActivity);
}

const signInSchema = z.object({
  email: z.string().email().min(3).max(255),
  password: z.string().min(8).max(100),
  rememberMe: z.string().optional().transform(val => val === 'on')
});

export const signIn = validatedAction(signInSchema, async (data, formData) => {
  const { email, password, rememberMe } = data;

  // Check if account is locked
  const locked = await isAccountLocked(email);
  if (locked) {
    return {
      error: 'Account is temporarily locked due to multiple failed login attempts. Please try again later.',
      email,
      password: ''
    };
  }

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (userResult.length === 0) {
    // Record failed attempt for existing emails
    await recordFailedLoginAttempt(email);
    return {
      error: 'Invalid email or password. Please try again.',
      email,
      password: ''
    };
  }

  const foundUser = userResult[0];

  if (!foundUser.passwordHash) {
    return {
      error: 'Invalid email or password.',
      email,
      password: ''
    };
  }

  const isPasswordValid = await comparePasswords(
    password,
    foundUser.passwordHash
  );

  if (!isPasswordValid) {
    // Record failed login attempt
    const { locked, remainingAttempts } = await recordFailedLoginAttempt(email);

    if (locked) {
      return {
        error: 'Account has been locked due to multiple failed attempts. Please try again in 15 minutes.',
        email,
        password: ''
      };
    }

    return {
      error: remainingAttempts > 0
        ? `Invalid password. ${remainingAttempts} attempts remaining.`
        : 'Invalid email or password. Please try again.',
      email,
      password: ''
    };
  }

  // Clear login attempts on successful login
  await clearLoginAttempts(foundUser.id);

  // Set session with remember me option - only pass id to avoid Date serialization issues
  await Promise.all([
    setSession({ id: foundUser.id } as any),
    setRememberMeCookie(foundUser.id, foundUser.email, rememberMe || false),
    logActivity(foundUser.id, ActivityType.SIGN_IN)
  ]);

  const redirectTo = formData.get('redirect') as string | null;

  // Return success with redirect URL instead of using redirect()
  // This avoids Date serialization issues with Server Actions
  return {
    success: true,
    redirectTo: redirectTo || '/dashboard'
  };
});

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  invitationCode: z.string().min(1, 'Invitation code is required'),
  inviteId: z.string().optional() // Legacy field for backward compatibility
});

export const signUp = validatedAction(signUpSchema, async (data, formData) => {
  const { email, password, invitationCode } = data;

  // Validate invitation code first
  const codeValidation = await validateInvitationCode(invitationCode);
  if (!codeValidation.valid) {
    return {
      error: codeValidation.error || 'Invalid invitation code.',
      email,
      password: '',
      invitationCode
    };
  }

  // Check if invitation code is for specific email
  if (codeValidation.code?.generatedFor &&
      codeValidation.code.generatedFor.toLowerCase() !== email.toLowerCase()) {
    return {
      error: 'This invitation code is not valid for this email address.',
      email,
      password: '',
      invitationCode
    };
  }

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    return {
      error: 'An account with this email already exists. Please sign in or use a different email.',
      email,
      password: '',
      invitationCode
    };
  }

  const passwordHash = await hashPassword(password);

  const newUser: NewUser = {
    email,
    passwordHash,
    registeredViaInviteCode: codeValidation.code?.id
  };

  const [createdUser] = await db.insert(users).values(newUser).returning();

  if (!createdUser) {
    return {
      error: 'Failed to create user. Please try again.',
      email,
      password: '',
      invitationCode
    };
  }

  // Use the invitation code
  const useResult = await useInvitationCode(
    invitationCode,
    createdUser.id,
    formData.get('ip') as string | undefined,
    formData.get('userAgent') as string | undefined
  );

  if (!useResult.success) {
    // Rollback user creation on code use failure
    await db.delete(users).where(eq(users.id, createdUser.id));
    return {
      error: useResult.error || 'Failed to use invitation code.',
      email,
      password: '',
      invitationCode
    };
  }

  // Determine membership tier based on code type
  const membershipTier = codeValidation.code?.codeType === 'payment' ? 'premium' : 'free';

  // Create membership for new user
  const newMembership: NewUserMembership = {
    userId: createdUser.id,
    tier: membershipTier,
    featuresAccess: {
      maxMentorApplications: true,
      accessBasicResources: true,
      joinFreeEvents: true,
      viewMentorProfiles: true,
      priorityEventAccess: membershipTier === 'premium',
      accessPremiumResources: membershipTier === 'premium',
    },
    eventPriorityAccess: membershipTier === 'premium',
  };

  await db.insert(userMemberships).values(newMembership);

  // Auto-assign role based on invitation code's targetRole
  const targetRole = codeValidation.code?.targetRole;
  if (targetRole) {
    const newRole: NewUserRole = {
      userId: createdUser.id,
      roleType: targetRole,
      isActive: true,
      // Set verifiedAt for mentors since their form was already approved
      verifiedAt: targetRole === 'mentor' ? new Date() : undefined,
    };
    await db.insert(userRoles).values(newRole);

    // Link form submission to user and create profile if applicable
    const linkedFormId = codeValidation.code?.linkedFormId;
    const linkedFormType = codeValidation.code?.linkedFormType;

    if (linkedFormId && linkedFormType === 'mentee') {
      // Get the form data first
      const [menteeForm] = await db
        .select()
        .from(menteeFormSubmissions)
        .where(eq(menteeFormSubmissions.id, linkedFormId))
        .limit(1);

      if (menteeForm) {
        // Update form submission with userId
        await db
          .update(menteeFormSubmissions)
          .set({
            userId: createdUser.id,
            status: 'approved',
            updatedAt: new Date(),
          })
          .where(eq(menteeFormSubmissions.id, linkedFormId));

        // Update user info from form data
        await db
          .update(users)
          .set({
            name: menteeForm.fullName,
            phone: menteeForm.phone,
            gender: menteeForm.gender,
            age: menteeForm.age,
            updatedAt: new Date(),
          })
          .where(eq(users.id, createdUser.id));

        // Create mentee profile from form data
        await db.insert(menteeProfiles).values({
          userId: createdUser.id,
          bio: menteeForm.bio,
          careerStage: menteeForm.currentStage,
          learningGoals: [menteeForm.longTermGoals, menteeForm.shortTermGoals].filter(Boolean) as string[],
          preferredExpertiseAreas: menteeForm.preferredIndustries || [],
          preferredMeetingFrequency: menteeForm.preferredMeetingFrequency,
          currentChallenge: menteeForm.whyMentor,
          mbtiType: menteeForm.mbtiType,
          photoUrl: menteeForm.photoUrl,
          formSubmissionId: menteeForm.id,
          profileCompletedAt: new Date(),
        });

        // Add mentee to waiting queue for matching
        await addToWaitingQueue(createdUser.id, undefined, 'Added after registration');
      }
    } else if (linkedFormId && linkedFormType === 'mentor') {
      // Get the form data first
      const [mentorForm] = await db
        .select()
        .from(mentorFormSubmissions)
        .where(eq(mentorFormSubmissions.id, linkedFormId))
        .limit(1);

      if (mentorForm) {
        // Update form submission with userId
        await db
          .update(mentorFormSubmissions)
          .set({
            userId: createdUser.id,
            status: 'approved',
            updatedAt: new Date(),
          })
          .where(eq(mentorFormSubmissions.id, linkedFormId));

        // Update user info from form data
        await db
          .update(users)
          .set({
            name: mentorForm.fullName,
            phone: mentorForm.phone,
            gender: mentorForm.gender,
            updatedAt: new Date(),
          })
          .where(eq(users.id, createdUser.id));

        // Create mentor profile from form data
        await db.insert(mentorProfiles).values({
          userId: createdUser.id,
          bio: mentorForm.bio,
          company: mentorForm.company,
          jobTitle: mentorForm.jobTitle,
          yearsExperience: mentorForm.yearsExperience,
          linkedinUrl: mentorForm.linkedinUrl,
          maxMentees: mentorForm.maxMentees || 3,
          availabilityHoursPerMonth: mentorForm.availabilityHoursPerMonth,
          mbtiType: mentorForm.mbtiType,
          photoUrl: mentorForm.photoUrl,
          formSubmissionId: mentorForm.id,
          verifiedAt: new Date(),
          expertiseAreas: [
            ...(mentorForm.softSkillsExpert || []),
            ...(mentorForm.industrySkillsExpert || []),
          ],
        });
      }
    }
  }

  // Log activity
  await db.insert(activityLogs).values({
    userId: createdUser.id,
    action: ActivityType.SIGN_UP,
    entityType: 'user',
    entityId: createdUser.id,
    metadata: {
      invitationCodeType: codeValidation.code?.codeType,
      membershipTier,
      autoAssignedRole: targetRole || null,
    },
  });

  // Create email verification token and send email
  try {
    const verification = await createEmailVerificationToken(createdUser.id);
    await sendVerificationEmail(createdUser.email, verification.token);
  } catch (error) {
    console.error('Failed to send verification email:', error);
  }

  // Set session for the new user - only pass the id to avoid Date serialization issues
  await setSession({ id: createdUser.id } as any);

  // Return success with redirect URL instead of using redirect()
  // This avoids Date serialization issues with Server Actions
  return {
    success: true,
    redirectTo: '/dashboard'
  };
});

export async function signOut() {
  const user = (await getUser()) as User;
  await logActivity(user.id, ActivityType.SIGN_OUT);
  (await cookies()).delete('session');
}

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(100),
  newPassword: z.string().min(8).max(100),
  confirmPassword: z.string().min(8).max(100)
});

export const updatePassword = validatedActionWithUser(
  updatePasswordSchema,
  async (data, _, user) => {
    const { currentPassword, newPassword, confirmPassword } = data;

    if (!user.passwordHash) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: 'User password not found.'
      };
    }

    const isPasswordValid = await comparePasswords(
      currentPassword,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: 'Current password is incorrect.'
      };
    }

    if (currentPassword === newPassword) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: 'New password must be different from the current password.'
      };
    }

    if (confirmPassword !== newPassword) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: 'New password and confirmation password do not match.'
      };
    }

    // Update password with history tracking
    const result = await updatePasswordWithHistory(user.id, newPassword);

    if (!result.success) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: result.error || 'Failed to update password.'
      };
    }

    await logActivity(user.id, ActivityType.UPDATE_PASSWORD);

    return {
      success: 'Password updated successfully.'
    };
  }
);

const deleteAccountSchema = z.object({
  password: z.string().min(8).max(100)
});

export const deleteAccount = validatedActionWithUser(
  deleteAccountSchema,
  async (data, _, user) => {
    const { password } = data;

    if (!user.passwordHash) {
      return {
        password,
        error: 'User password not found.'
      };
    }

    const isPasswordValid = await comparePasswords(password, user.passwordHash);
    if (!isPasswordValid) {
      return {
        password,
        error: 'Incorrect password. Account deletion failed.'
      };
    }

    await logActivity(user.id, ActivityType.DELETE_ACCOUNT);

    // Soft delete
    await db
      .update(users)
      .set({
        deletedAt: sql`CURRENT_TIMESTAMP`,
        email: sql`CONCAT(email, '-', id, '-deleted')` // Ensure email uniqueness
      })
      .where(eq(users.id, user.id));

    (await cookies()).delete('session');
    redirect('/sign-in');
  }
);

const updateAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address')
});

export const updateAccount = validatedActionWithUser(
  updateAccountSchema,
  async (data, _, user) => {
    const { name, email } = data;

    await Promise.all([
      db.update(users).set({ name, email }).where(eq(users.id, user.id)),
      logActivity(user.id, ActivityType.UPDATE_ACCOUNT)
    ]);

    return { name, success: 'Account updated successfully.' };
  }
);
