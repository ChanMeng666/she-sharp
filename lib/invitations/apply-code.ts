import { eq, and } from 'drizzle-orm';
import { maskEmail } from '@/lib/utils';
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

interface ApplyCodeSuccess {
  success: true;
}

interface ApplyCodeFailure {
  success: false;
  error: string;
}

type ApplyCodeResult = ApplyCodeSuccess | ApplyCodeFailure;

/**
 * Applies an invitation code for a user: validates, consumes the code,
 * updates user fields, creates membership/role/profile as needed.
 * Shared by both OAuth post-signup and manual verify-invitation flows.
 */
export async function applyInvitationCode(
  userId: number,
  codeString: string,
  userEmail: string
): Promise<ApplyCodeResult> {
  // Validate invitation code
  const codeValidation = await validateInvitationCode(codeString);
  if (!codeValidation.valid || !codeValidation.code) {
    return { success: false, error: codeValidation.error || 'Invalid invitation code.' };
  }

  // Check if code is for specific email
  if (
    codeValidation.code.generatedFor &&
    codeValidation.code.generatedFor.toLowerCase() !== userEmail.toLowerCase()
  ) {
    const maskedTarget = maskEmail(codeValidation.code.generatedFor);
    return {
      success: false,
      error: `This invitation code was generated for ${maskedTarget}. Please sign in with that email address, or contact admin for assistance.`,
    };
  }

  // Consume the invitation code
  const useResult = await useInvitationCode(codeString, userId, undefined, undefined);
  if (!useResult.success) {
    return { success: false, error: useResult.error || 'Failed to use invitation code.' };
  }

  // Get current user data for fallback fields
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return { success: false, error: 'User not found.' };
  }

  // Update user with verification timestamp and code reference
  await db
    .update(users)
    .set({
      inviteCodeVerifiedAt: new Date(),
      registeredViaInviteCode: codeValidation.code.id,
      isTestUser: codeValidation.code.codeType === 'test',
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  // Determine membership tier based on code type
  const membershipTier = codeValidation.code.codeType === 'payment' ? 'premium' : 'free';

  // Check if user already has membership
  const existingMembership = await db
    .select()
    .from(userMemberships)
    .where(eq(userMemberships.userId, userId))
    .limit(1);

  if (existingMembership.length === 0) {
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
  const targetRole = codeValidation.code.targetRole;
  if (targetRole) {
    const existingRole = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.userId, userId))
      .limit(1);

    const hasRole = existingRole.some((r) => r.roleType === targetRole);

    if (!hasRole) {
      const newRole: NewUserRole = {
        userId,
        roleType: targetRole,
        isActive: true,
        verifiedAt: targetRole === 'mentor' ? new Date() : undefined,
      };
      await db.insert(userRoles).values(newRole);
    } else if (targetRole === 'mentor') {
      await db
        .update(userRoles)
        .set({ verifiedAt: new Date() })
        .where(and(eq(userRoles.userId, userId), eq(userRoles.roleType, 'mentor')));
    }

    // Link form submission and create profile if applicable
    const linkedFormId = codeValidation.code.linkedFormId;
    const linkedFormType = codeValidation.code.linkedFormType;

    if (linkedFormId && linkedFormType === 'mentee') {
      const [menteeForm] = await db
        .select()
        .from(menteeFormSubmissions)
        .where(eq(menteeFormSubmissions.id, linkedFormId))
        .limit(1);

      if (menteeForm) {
        await db
          .update(menteeFormSubmissions)
          .set({ userId, status: 'approved', updatedAt: new Date() })
          .where(eq(menteeFormSubmissions.id, linkedFormId));

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

        const [existingProfile] = await db
          .select()
          .from(menteeProfiles)
          .where(eq(menteeProfiles.userId, userId))
          .limit(1);

        const profileData = {
          bio: menteeForm.bio,
          careerStage: menteeForm.currentStage,
          learningGoals: [menteeForm.longTermGoals, menteeForm.shortTermGoals].filter(
            Boolean
          ) as string[],
          preferredExpertiseAreas: menteeForm.preferredIndustries || [],
          preferredMeetingFrequency: menteeForm.preferredMeetingFrequency,
          currentChallenge: menteeForm.whyMentor,
          mbtiType: menteeForm.mbtiType,
          photoUrl: menteeForm.photoUrl,
          formSubmissionId: menteeForm.id,
          profileCompletedAt: new Date(),
        };

        if (!existingProfile) {
          await db.insert(menteeProfiles).values({ userId, ...profileData });
        } else {
          await db
            .update(menteeProfiles)
            .set(profileData)
            .where(eq(menteeProfiles.userId, userId));
        }

        await addToWaitingQueue(userId, undefined, 'Added after registration');
      }
    } else if (linkedFormId && linkedFormType === 'mentor') {
      const [mentorForm] = await db
        .select()
        .from(mentorFormSubmissions)
        .where(eq(mentorFormSubmissions.id, linkedFormId))
        .limit(1);

      if (mentorForm) {
        await db
          .update(mentorFormSubmissions)
          .set({ userId, status: 'approved', updatedAt: new Date() })
          .where(eq(mentorFormSubmissions.id, linkedFormId));

        await db
          .update(users)
          .set({
            name: mentorForm.fullName || user.name,
            phone: mentorForm.phone || user.phone,
            gender: mentorForm.gender || user.gender,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));

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
          await db.insert(mentorProfiles).values({ userId, ...profileData });
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
      codeType: codeValidation.code.codeType,
      targetRole: targetRole || null,
      membershipTier,
    },
  });

  return { success: true };
}
