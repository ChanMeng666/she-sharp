'use server';

import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  users,
  userRoles,
  userMemberships,
  menteeFormSubmissions,
  mentorFormSubmissions,
  mentorProfiles,
  menteeProfiles,
  activityLogs,
  ActivityType,
  type NewUserRole,
  type NewUserMembership,
} from '@/lib/db/schema';
import { validateInvitationCode, useInvitationCode } from '@/lib/invitations/service';
import { addToWaitingQueue } from '@/lib/matching/queue-service';
import { auth } from '@/lib/auth/auth.config';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { validatedAction } from '@/lib/auth/middleware';

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

  // Validate invitation code
  const codeValidation = await validateInvitationCode(invitationCode);
  if (!codeValidation.valid) {
    return { error: codeValidation.error || 'Invalid invitation code.', invitationCode };
  }

  // Check if code is for specific email
  if (codeValidation.code?.generatedFor &&
      codeValidation.code.generatedFor.toLowerCase() !== user.email.toLowerCase()) {
    return {
      error: 'This invitation code is not valid for your email address.',
      invitationCode
    };
  }

  // Use the invitation code
  const useResult = await useInvitationCode(
    invitationCode,
    userId,
    undefined,
    undefined
  );

  if (!useResult.success) {
    return { error: useResult.error || 'Failed to use invitation code.', invitationCode };
  }

  // Update user with verification timestamp and code reference
  await db
    .update(users)
    .set({
      inviteCodeVerifiedAt: new Date(),
      registeredViaInviteCode: codeValidation.code?.id,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  // Determine membership tier based on code type
  const membershipTier = codeValidation.code?.codeType === 'payment' ? 'premium' : 'free';

  // Check if user already has membership
  const existingMembership = await db
    .select()
    .from(userMemberships)
    .where(eq(userMemberships.userId, userId))
    .limit(1);

  if (existingMembership.length === 0) {
    // Create membership for user
    const newMembership: NewUserMembership = {
      userId,
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
  } else if (membershipTier === 'premium') {
    // Upgrade existing membership to premium if code is payment type
    await db
      .update(userMemberships)
      .set({
        tier: 'premium',
        featuresAccess: {
          maxMentorApplications: true,
          accessBasicResources: true,
          joinFreeEvents: true,
          viewMentorProfiles: true,
          priorityEventAccess: true,
          accessPremiumResources: true,
        },
        eventPriorityAccess: true,
        updatedAt: new Date(),
      })
      .where(eq(userMemberships.userId, userId));
  }

  // Assign role based on invitation code's targetRole
  const targetRole = codeValidation.code?.targetRole;
  if (targetRole) {
    // Check if role already exists
    const existingRole = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.userId, userId))
      .limit(1);

    const hasRole = existingRole.some(r => r.roleType === targetRole);

    if (!hasRole) {
      const newRole: NewUserRole = {
        userId,
        roleType: targetRole,
        isActive: true,
        // Set verifiedAt for mentors since their form was already approved
        verifiedAt: targetRole === 'mentor' ? new Date() : undefined,
      };
      await db.insert(userRoles).values(newRole);
    } else if (targetRole === 'mentor') {
      // Update existing mentor role to set verifiedAt
      await db
        .update(userRoles)
        .set({ verifiedAt: new Date() })
        .where(and(eq(userRoles.userId, userId), eq(userRoles.roleType, 'mentor')));
    }

    // Link form submission and create profile if applicable
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
            userId,
            status: 'approved',
            updatedAt: new Date(),
          })
          .where(eq(menteeFormSubmissions.id, linkedFormId));

        // Update user info from form data
        await db
          .update(users)
          .set({
            name: menteeForm.fullName || user.name,
            phone: menteeForm.phone || user.phone,
            gender: menteeForm.gender || user.gender,
            age: menteeForm.age || user.age,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));

        // Create mentee profile from form data
        const [existingProfile] = await db
          .select()
          .from(menteeProfiles)
          .where(eq(menteeProfiles.userId, userId))
          .limit(1);

        if (!existingProfile) {
          await db.insert(menteeProfiles).values({
            userId,
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
        } else {
          await db
            .update(menteeProfiles)
            .set({
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
            })
            .where(eq(menteeProfiles.userId, userId));
        }

        // Add mentee to waiting queue for matching
        await addToWaitingQueue(userId, undefined, 'Added after registration');
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
            userId,
            status: 'approved',
            updatedAt: new Date(),
          })
          .where(eq(mentorFormSubmissions.id, linkedFormId));

        // Update user info from form data
        await db
          .update(users)
          .set({
            name: mentorForm.fullName || user.name,
            phone: mentorForm.phone || user.phone,
            gender: mentorForm.gender || user.gender,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));

        // Create mentor profile from form data
        const [existingProfile] = await db
          .select()
          .from(mentorProfiles)
          .where(eq(mentorProfiles.userId, userId))
          .limit(1);

        const profileData = {
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
        };

        if (!existingProfile) {
          await db.insert(mentorProfiles).values({
            userId,
            ...profileData,
          });
        } else {
          await db
            .update(mentorProfiles)
            .set(profileData)
            .where(eq(mentorProfiles.userId, userId));
        }
      }
    }
  }

  // Log activity
  await db.insert(activityLogs).values({
    userId,
    action: ActivityType.USE_INVITATION_CODE,
    entityType: 'user',
    entityId: userId,
    metadata: {
      codeType: codeValidation.code?.codeType,
      targetRole: targetRole || null,
      verificationMethod: 'oauth_post_signup',
      membershipTier,
    },
  });

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
