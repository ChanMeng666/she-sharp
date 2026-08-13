import { NextRequest, NextResponse } from 'next/server';
import { withRoles, type AuthedContext } from '@/lib/auth/role-middleware';
import { db } from '@/lib/db/drizzle';
import {
  menteeProfiles,
  menteeFormSubmissions,
  userRoles,
  activityLogs,
  ActivityType,
  genderEnum,
  meetingFormatEnum,
  careerStageEnum,
  mbtiTypeEnum,
} from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { resolvePhoto } from '@/lib/mentorship/resolve';
import { z } from 'zod';
import { invalidBody } from '@/lib/api/validation';

const optionalText = z.string().nullish();
const optionalStringArray = z.array(z.string()).nullish();

/**
 * The fields this handler actually reads off the body. Every one is optional
 * because the dashboard form saves partial profiles and the handler supplies its
 * own defaults; unknown keys are stripped rather than rejected.
 */
const menteeProfileSchema = z.object({
  learningGoals: optionalStringArray,
  // `careerStage` lands in two columns: a free varchar on `mentee_profiles` and
  // the `career_stage` enum on `mentee_form_submissions`, so it takes the enum.
  careerStage: z.enum(careerStageEnum.enumValues).nullish(),
  preferredExpertiseAreas: optionalStringArray,
  preferredMeetingFrequency: optionalText,
  bio: optionalText,
  currentChallenge: optionalText,
  fullName: optionalText,
  gender: z.enum(genderEnum.enumValues).nullish(),
  age: z.number().nullish(),
  phone: optionalText,
  photoUrl: optionalText,
  city: optionalText,
  preferredMeetingFormat: z.enum(meetingFormatEnum.enumValues).nullish(),
  currentJobTitle: optionalText,
  currentIndustry: optionalText,
  preferredIndustries: optionalStringArray,
  softSkillsBasic: optionalStringArray,
  softSkillsExpert: optionalStringArray,
  industrySkillsBasic: optionalStringArray,
  industrySkillsExpert: optionalStringArray,
  longTermGoals: optionalText,
  shortTermGoals: optionalText,
  whyMentor: optionalText,
  programExpectations: optionalText,
  mbtiType: z.enum(mbtiTypeEnum.enumValues).nullish(),
});

export const GET = withRoles({}, async (_request: NextRequest, { user }: AuthedContext) => {
  try {
    // Get mentee profile
    const [profile] = await db
      .select()
      .from(menteeProfiles)
      .where(eq(menteeProfiles.userId, user.id))
      .limit(1);

    // Get form submission data for additional fields
    const [formData] = await db
      .select()
      .from(menteeFormSubmissions)
      .where(eq(menteeFormSubmissions.userId, user.id))
      .limit(1);

    // Merge data from both sources
    const mergedProfile = {
      // From mentee_profiles
      id: profile?.id,
      learningGoals: profile?.learningGoals || [],
      careerStage: profile?.careerStage || formData?.currentStage || '',
      preferredExpertiseAreas: profile?.preferredExpertiseAreas || [],
      preferredMeetingFrequency: profile?.preferredMeetingFrequency || formData?.preferredMeetingFrequency || '',
      bio: profile?.bio || formData?.bio || '',
      currentChallenge: profile?.currentChallenge || '',
      profileCompletedAt: profile?.profileCompletedAt,

      // From mentee_form_submissions (additional fields)
      photoUrl:
        resolvePhoto({
          formPhotoUrl: formData?.photoUrl,
          profilePhotoUrl: profile?.photoUrl,
          userImage: user.image,
        }) ?? '',
      fullName: formData?.fullName || user.name || '',
      gender: formData?.gender || '',
      age: formData?.age || null,
      phone: formData?.phone || '',
      city: formData?.city || '',
      preferredMeetingFormat: formData?.preferredMeetingFormat || '',
      currentJobTitle: formData?.currentJobTitle || '',
      currentIndustry: formData?.currentIndustry || '',
      preferredIndustries: formData?.preferredIndustries || [],
      softSkillsBasic: formData?.softSkillsBasic || [],
      softSkillsExpert: formData?.softSkillsExpert || [],
      industrySkillsBasic: formData?.industrySkillsBasic || [],
      industrySkillsExpert: formData?.industrySkillsExpert || [],
      longTermGoals: formData?.longTermGoals || '',
      shortTermGoals: formData?.shortTermGoals || '',
      whyMentor: formData?.whyMentor || '',
      programExpectations: formData?.programExpectations || '',
      mbtiType: formData?.mbtiType || '',
    };

    return NextResponse.json({ profile: mergedProfile, formSubmissionId: formData?.id });
  } catch (error) {
    console.error('Error fetching mentee profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mentee profile' },
      { status: 500 }
    );
  }
});

export const POST = withRoles({}, async (request: Request, { user }: AuthedContext) => {
  try {
    const parsed = menteeProfileSchema.safeParse(await request.json());
    if (!parsed.success) {
      return invalidBody(parsed.error);
    }
    const data = parsed.data;

    // Prepare data for mentee_profiles table
    const profileData = {
      learningGoals: data.learningGoals || [],
      careerStage: data.careerStage || null,
      preferredExpertiseAreas: data.preferredExpertiseAreas || [],
      preferredMeetingFrequency: data.preferredMeetingFrequency || null,
      bio: data.bio || null,
      currentChallenge: data.currentChallenge || null,
    };

    // Prepare data for mentee_form_submissions table
    const formData = {
      fullName: data.fullName || null,
      gender: data.gender || null,
      age: data.age || null,
      phone: data.phone || null,
      photoUrl: data.photoUrl || null,
      city: data.city || null,
      preferredMeetingFormat: data.preferredMeetingFormat || null,
      currentStage: data.careerStage || null,
      currentJobTitle: data.currentJobTitle || null,
      currentIndustry: data.currentIndustry || null,
      preferredIndustries: data.preferredIndustries || [],
      softSkillsBasic: data.softSkillsBasic || [],
      softSkillsExpert: data.softSkillsExpert || [],
      industrySkillsBasic: data.industrySkillsBasic || [],
      industrySkillsExpert: data.industrySkillsExpert || [],
      longTermGoals: data.longTermGoals || null,
      shortTermGoals: data.shortTermGoals || null,
      whyMentor: data.whyMentor || null,
      programExpectations: data.programExpectations || null,
      mbtiType: data.mbtiType || null,
      preferredMeetingFrequency: data.preferredMeetingFrequency || null,
      bio: data.bio || null,
      updatedAt: new Date(),
    };

    // Check if profile already exists
    const [existingProfile] = await db
      .select()
      .from(menteeProfiles)
      .where(eq(menteeProfiles.userId, user.id))
      .limit(1);

    // Check if form submission exists
    const [existingFormSubmission] = await db
      .select()
      .from(menteeFormSubmissions)
      .where(eq(menteeFormSubmissions.userId, user.id))
      .limit(1);

    let profile;

    // Update or create mentee_profiles
    if (existingProfile) {
      [profile] = await db
        .update(menteeProfiles)
        .set({
          ...profileData,
          profileCompletedAt: existingProfile.profileCompletedAt || new Date(),
        })
        .where(eq(menteeProfiles.userId, user.id))
        .returning();
    } else {
      [profile] = await db
        .insert(menteeProfiles)
        .values({
          userId: user.id,
          ...profileData,
          profileCompletedAt: new Date(),
        })
        .returning();

      // Activate mentee role if not already active
      const [existingRole] = await db
        .select()
        .from(userRoles)
        .where(
          and(
            eq(userRoles.userId, user.id),
            eq(userRoles.roleType, 'mentee')
          )
        )
        .limit(1);

      if (!existingRole) {
        await db.insert(userRoles).values({
          userId: user.id,
          roleType: 'mentee',
          isActive: true,
          activationStep: 3,
        });

        await db.insert(activityLogs).values({
          userId: user.id,
          action: ActivityType.ACTIVATE_MENTEE_ROLE,
          entityType: 'user',
          entityId: user.id,
          metadata: { profileCompleted: true }
        });
      }
    }

    // Update or create mentee_form_submissions
    if (existingFormSubmission) {
      await db
        .update(menteeFormSubmissions)
        .set(formData)
        .where(eq(menteeFormSubmissions.userId, user.id));
    } else {
      await db
        .insert(menteeFormSubmissions)
        .values({
          userId: user.id,
          email: user.email,
          status: 'approved',
          ...formData,
        });
    }

    // Link form submission to profile if not already linked
    if (profile && !profile.formSubmissionId) {
      const [formSubmission] = await db
        .select({ id: menteeFormSubmissions.id })
        .from(menteeFormSubmissions)
        .where(eq(menteeFormSubmissions.userId, user.id))
        .limit(1);

      if (formSubmission) {
        await db
          .update(menteeProfiles)
          .set({ formSubmissionId: formSubmission.id })
          .where(eq(menteeProfiles.userId, user.id));
      }
    }

    // Log profile update activity
    await db.insert(activityLogs).values({
      userId: user.id,
      action: ActivityType.UPDATE_MENTEE_PROFILE,
      entityType: 'user',
      entityId: user.id,
      metadata: { profileId: profile.id }
    });

    return NextResponse.json({
      message: 'Mentee profile saved successfully',
      profile
    });
  } catch (error) {
    console.error('Error saving mentee profile:', error);
    return NextResponse.json(
      { error: 'Failed to save mentee profile' },
      { status: 500 }
    );
  }
});
