'use server';

import { z } from 'zod';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  User,
  users,
  teams,
  teamMembers,
  activityLogs,
  userMemberships,
  userRoles,
  menteeFormSubmissions,
  mentorFormSubmissions,
  type NewUser,
  type NewTeam,
  type NewTeamMember,
  type NewActivityLog,
  type NewUserMembership,
  type NewUserRole,
  ActivityType,
  invitations,
  emailVerifications,
  invitationCodes,
} from '@/lib/db/schema';
import { validateInvitationCode, useInvitationCode } from '@/lib/invitations/service';
import { comparePasswords, hashPassword, setSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getUser, getUserWithTeam } from '@/lib/db/queries';
import {
  validatedAction,
  validatedActionWithUser
} from '@/lib/auth/middleware';
import { createEmailVerificationToken } from '@/lib/auth/email-verification';
import { sendVerificationEmail, sendInvitationEmail } from '@/lib/email/service';
import { isAccountLocked, recordFailedLoginAttempt, clearLoginAttempts } from '@/lib/auth/account-lock';
import { setRememberMeCookie } from '@/lib/auth/remember-me';
import { updatePasswordWithHistory } from '@/lib/auth/password-history';

async function logActivity(
  teamId: number | null | undefined,
  userId: number,
  type: ActivityType,
  ipAddress?: string
) {
  // Updated to use new activity log schema with entity fields
  const newActivity: NewActivityLog = {
    userId,
    action: type,
    entityType: teamId ? 'team' : 'user',
    entityId: teamId || userId,
    ipAddress: ipAddress || '',
    metadata: teamId ? { teamId } : undefined
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

  const userWithTeam = await db
    .select({
      user: users,
      team: teams
    })
    .from(users)
    .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
    .leftJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(eq(users.email, email))
    .limit(1);

  if (userWithTeam.length === 0) {
    // Record failed attempt for existing emails
    await recordFailedLoginAttempt(email);
    return {
      error: 'Invalid email or password. Please try again.',
      email,
      password: ''
    };
  }

  const { user: foundUser, team: foundTeam } = userWithTeam[0];

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

  // Set session with remember me option
  await Promise.all([
    setSession(foundUser),
    setRememberMeCookie(foundUser.id, foundUser.email, rememberMe || false),
    logActivity(foundTeam?.id, foundUser.id, ActivityType.SIGN_IN)
  ]);

  const redirectTo = formData.get('redirect') as string | null;

  // Redirect to dashboard (roles are now auto-assigned during registration)
  redirect(redirectTo || '/dashboard');
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
    };
    await db.insert(userRoles).values(newRole);

    // Link form submission to user if applicable
    const linkedFormId = codeValidation.code?.linkedFormId;
    const linkedFormType = codeValidation.code?.linkedFormType;

    if (linkedFormId && linkedFormType === 'mentee') {
      await db
        .update(menteeFormSubmissions)
        .set({
          userId: createdUser.id,
          status: 'approved',
          updatedAt: new Date(),
        })
        .where(eq(menteeFormSubmissions.id, linkedFormId));
    } else if (linkedFormId && linkedFormType === 'mentor') {
      await db
        .update(mentorFormSubmissions)
        .set({
          userId: createdUser.id,
          status: 'approved',
          updatedAt: new Date(),
        })
        .where(eq(mentorFormSubmissions.id, linkedFormId));
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

  // Set session for the new user
  await setSession(createdUser);

  // Redirect to dashboard (roles are auto-assigned based on invitation code)
  redirect('/dashboard');
});

export async function signOut() {
  const user = (await getUser()) as User;
  const userWithTeam = await getUserWithTeam(user.id);
  await logActivity(userWithTeam?.teamId, user.id, ActivityType.SIGN_OUT);
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

    const userWithTeam = await getUserWithTeam(user.id);
    await logActivity(userWithTeam?.teamId, user.id, ActivityType.UPDATE_PASSWORD);

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

    const userWithTeam = await getUserWithTeam(user.id);

    await logActivity(
      userWithTeam?.teamId,
      user.id,
      ActivityType.DELETE_ACCOUNT
    );

    // Soft delete
    await db
      .update(users)
      .set({
        deletedAt: sql`CURRENT_TIMESTAMP`,
        email: sql`CONCAT(email, '-', id, '-deleted')` // Ensure email uniqueness
      })
      .where(eq(users.id, user.id));

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
    const userWithTeam = await getUserWithTeam(user.id);

    await Promise.all([
      db.update(users).set({ name, email }).where(eq(users.id, user.id)),
      logActivity(userWithTeam?.teamId, user.id, ActivityType.UPDATE_ACCOUNT)
    ]);

    return { name, success: 'Account updated successfully.' };
  }
);

const removeTeamMemberSchema = z.object({
  memberId: z.number()
});

export const removeTeamMember = validatedActionWithUser(
  removeTeamMemberSchema,
  async (data, _, user) => {
    const { memberId } = data;
    const userWithTeam = await getUserWithTeam(user.id);

    if (!userWithTeam?.teamId) {
      return { error: 'User is not part of a team' };
    }

    await db
      .delete(teamMembers)
      .where(
        and(
          eq(teamMembers.id, memberId),
          eq(teamMembers.teamId, userWithTeam.teamId)
        )
      );

    await logActivity(
      userWithTeam.teamId,
      user.id,
      ActivityType.UPDATE_ACCOUNT
    );

    return { success: 'Team member removed successfully' };
  }
);

const inviteTeamMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['member', 'owner'])
});

export const inviteTeamMember = validatedActionWithUser(
  inviteTeamMemberSchema,
  async (data, _, user) => {
    const { email, role } = data;
    const userWithTeam = await getUserWithTeam(user.id);

    if (!userWithTeam?.teamId) {
      return { error: 'User is not part of a team' };
    }

    const existingMember = await db
      .select()
      .from(users)
      .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
      .where(
        and(eq(users.email, email), eq(teamMembers.teamId, userWithTeam.teamId))
      )
      .limit(1);

    if (existingMember.length > 0) {
      return { error: 'User is already a member of this team' };
    }

    // Check if there's an existing invitation
    const existingInvitation = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.email, email),
          eq(invitations.teamId, userWithTeam.teamId),
          eq(invitations.status, 'pending')
        )
      )
      .limit(1);

    if (existingInvitation.length > 0) {
      return { error: 'An invitation has already been sent to this email' };
    }

    // Create a new invitation
    const [invitation] = await db.insert(invitations).values({
      teamId: userWithTeam.teamId,
      email,
      role,
      invitedBy: user.id,
      status: 'pending'
    }).returning();

    await logActivity(
      userWithTeam.teamId,
      user.id,
      ActivityType.UPDATE_ACCOUNT
    );

    // Send invitation email
    try {
      const teamName = userWithTeam.team?.name || 'She Sharp Team';
      await sendInvitationEmail(email, teamName, role, invitation.id);
    } catch (error) {
      console.error('Failed to send invitation email:', error);
      // Continue even if email fails
    }

    return { success: 'Invitation sent successfully' };
  }
);
