import { NextRequest, NextResponse } from 'next/server';
import { withRoles, type AuthedContext } from '@/lib/auth/role-middleware';
import { db } from '@/lib/db/drizzle';
import {
  mentorProfiles,
  mentorFormSubmissions,
  userRoles,
  activityLogs,
  ActivityType,
  genderEnum,
  meetingFormatEnum,
  bioMethodEnum,
  mbtiTypeEnum,
} from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { resolvePhoto } from '@/lib/mentorship/resolve';
import { z } from 'zod';
import { invalidBody } from '@/lib/api/validation';

const optionalText = z.string().nullish();
const optionalNumber = z.number().nullish();
const optionalStringArray = z.array(z.string()).nullish();

/**
 * The fields this handler actually reads off the body. Every one is optional
 * because the dashboard form saves partial profiles and the handler supplies its
 * own defaults; unknown keys are stripped rather than rejected.
 */
const mentorProfileSchema = z.object({
  expertiseAreas: optionalStringArray,
  yearsExperience: optionalNumber,
  jobTitle: optionalText,
  company: optionalText,
  bio: optionalText,
  linkedinUrl: optionalText,
  availabilityHoursPerMonth: optionalNumber,
  maxMentees: optionalNumber,
  isAcceptingMentees: z.boolean().optional(),
  photoUrl: optionalText,
  mbtiType: z.enum(mbtiTypeEnum.enumValues).nullish(),
  fullName: optionalText,
  gender: z.enum(genderEnum.enumValues).nullish(),
  phone: optionalText,
  city: optionalText,
  preferredMeetingFormat: z.enum(meetingFormatEnum.enumValues).nullish(),
  bioMethod: z.enum(bioMethodEnum.enumValues).nullish(),
  softSkillsBasic: optionalStringArray,
  softSkillsExpert: optionalStringArray,
  industrySkillsBasic: optionalStringArray,
  industrySkillsExpert: optionalStringArray,
  expectedMenteeGoalsLongTerm: optionalText,
  expectedMenteeGoalsShortTerm: optionalText,
  programExpectations: optionalText,
  preferredMenteeTypes: optionalStringArray,
  preferredIndustries: optionalStringArray,
});

export const GET = withRoles({}, async (_request: NextRequest, { user }: AuthedContext) => {
  try {
    // Get mentor profile
    const [profile] = await db
      .select()
      .from(mentorProfiles)
      .where(eq(mentorProfiles.userId, user.id))
      .limit(1);

    // Get form submission data for additional fields
    const [formData] = await db
      .select()
      .from(mentorFormSubmissions)
      .where(eq(mentorFormSubmissions.userId, user.id))
      .limit(1);

    // Merge data from both sources
    const mergedProfile = {
      // From mentor_profiles
      id: profile?.id,
      expertiseAreas: profile?.expertiseAreas || [],
      yearsExperience: profile?.yearsExperience || formData?.yearsExperience || 0,
      jobTitle: profile?.jobTitle || formData?.jobTitle || '',
      company: profile?.company || formData?.company || '',
      bio: profile?.bio || formData?.bio || '',
      linkedinUrl: profile?.linkedinUrl || formData?.linkedinUrl || '',
      availabilityHoursPerMonth: profile?.availabilityHoursPerMonth || formData?.availabilityHoursPerMonth || 4,
      maxMentees: profile?.maxMentees || formData?.maxMentees || 3,
      isAcceptingMentees: profile?.isAcceptingMentees ?? true,
      currentMenteesCount: profile?.currentMenteesCount || 0,
      profileCompletedAt: profile?.profileCompletedAt,
      verifiedAt: profile?.verifiedAt,

      // From mentor_form_submissions (additional fields)
      photoUrl:
        resolvePhoto({
          formPhotoUrl: formData?.photoUrl,
          profilePhotoUrl: profile?.photoUrl,
          userImage: user.image,
        }) ?? '',
      mbtiType: profile?.mbtiType || formData?.mbtiType || '',
      fullName: formData?.fullName || user.name || '',
      gender: formData?.gender || '',
      phone: formData?.phone || '',
      city: formData?.city || '',
      preferredMeetingFormat: formData?.preferredMeetingFormat || '',
      bioMethod: formData?.bioMethod || '',
      softSkillsBasic: formData?.softSkillsBasic || [],
      softSkillsExpert: formData?.softSkillsExpert || [],
      industrySkillsBasic: formData?.industrySkillsBasic || [],
      industrySkillsExpert: formData?.industrySkillsExpert || [],
      expectedMenteeGoalsLongTerm: formData?.expectedMenteeGoalsLongTerm || '',
      expectedMenteeGoalsShortTerm: formData?.expectedMenteeGoalsShortTerm || '',
      programExpectations: formData?.programExpectations || '',
      preferredMenteeTypes: formData?.preferredMenteeTypes || [],
      preferredIndustries: formData?.preferredIndustries || [],
    };

    return NextResponse.json({ profile: mergedProfile, formSubmissionId: formData?.id });
  } catch (error) {
    console.error('Error fetching mentor profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mentor profile' },
      { status: 500 }
    );
  }
});

export const POST = withRoles({}, async (request: Request, { user }: AuthedContext) => {
  try {
    const parsed = mentorProfileSchema.safeParse(await request.json());
    if (!parsed.success) {
      return invalidBody(parsed.error);
    }
    const data = parsed.data;

    // Prepare data for mentor_profiles table
    const profileData = {
      expertiseAreas: data.expertiseAreas || [],
      yearsExperience: data.yearsExperience || 0,
      jobTitle: data.jobTitle || null,
      company: data.company || null,
      bio: data.bio || null,
      linkedinUrl: data.linkedinUrl || null,
      availabilityHoursPerMonth: data.availabilityHoursPerMonth || 4,
      maxMentees: data.maxMentees || 3,
      isAcceptingMentees: data.isAcceptingMentees !== undefined ? data.isAcceptingMentees : true,
      photoUrl: data.photoUrl || null,
      mbtiType: data.mbtiType || null,
    };

    // Prepare data for mentor_form_submissions table
    const formData = {
      fullName: data.fullName || null,
      gender: data.gender || null,
      phone: data.phone || null,
      jobTitle: data.jobTitle || null,
      company: data.company || null,
      photoUrl: data.photoUrl || null,
      city: data.city || null,
      preferredMeetingFormat: data.preferredMeetingFormat || null,
      bioMethod: data.bioMethod || null,
      bio: data.bio || null,
      softSkillsBasic: data.softSkillsBasic || [],
      softSkillsExpert: data.softSkillsExpert || [],
      industrySkillsBasic: data.industrySkillsBasic || [],
      industrySkillsExpert: data.industrySkillsExpert || [],
      expectedMenteeGoalsLongTerm: data.expectedMenteeGoalsLongTerm || null,
      expectedMenteeGoalsShortTerm: data.expectedMenteeGoalsShortTerm || null,
      programExpectations: data.programExpectations || null,
      preferredMenteeTypes: data.preferredMenteeTypes || [],
      preferredIndustries: data.preferredIndustries || [],
      mbtiType: data.mbtiType || null,
      yearsExperience: data.yearsExperience || null,
      linkedinUrl: data.linkedinUrl || null,
      availabilityHoursPerMonth: data.availabilityHoursPerMonth || 4,
      maxMentees: data.maxMentees || 3,
      updatedAt: new Date(),
    };

    // Check if profile already exists
    const [existingProfile] = await db
      .select()
      .from(mentorProfiles)
      .where(eq(mentorProfiles.userId, user.id))
      .limit(1);

    // Check if form submission exists
    const [existingFormSubmission] = await db
      .select()
      .from(mentorFormSubmissions)
      .where(eq(mentorFormSubmissions.userId, user.id))
      .limit(1);

    let profile;

    // Update or create mentor_profiles
    if (existingProfile) {
      [profile] = await db
        .update(mentorProfiles)
        .set({
          ...profileData,
          profileCompletedAt: existingProfile.profileCompletedAt || new Date(),
        })
        .where(eq(mentorProfiles.userId, user.id))
        .returning();
    } else {
      [profile] = await db
        .insert(mentorProfiles)
        .values({
          userId: user.id,
          ...profileData,
          profileCompletedAt: new Date(),
        })
        .returning();

      // Activate mentor role if not already active
      const [existingRole] = await db
        .select()
        .from(userRoles)
        .where(
          and(
            eq(userRoles.userId, user.id),
            eq(userRoles.roleType, 'mentor')
          )
        )
        .limit(1);

      if (!existingRole) {
        await db.insert(userRoles).values({
          userId: user.id,
          roleType: 'mentor',
          isActive: true,
          activationStep: 3,
        });

        await db.insert(activityLogs).values({
          userId: user.id,
          action: ActivityType.ACTIVATE_MENTOR_ROLE,
          entityType: 'user',
          entityId: user.id,
          metadata: { profileCompleted: true }
        });
      }
    }

    // Update or create mentor_form_submissions
    if (existingFormSubmission) {
      await db
        .update(mentorFormSubmissions)
        .set(formData)
        .where(eq(mentorFormSubmissions.userId, user.id));
    } else {
      await db
        .insert(mentorFormSubmissions)
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
        .select({ id: mentorFormSubmissions.id })
        .from(mentorFormSubmissions)
        .where(eq(mentorFormSubmissions.userId, user.id))
        .limit(1);

      if (formSubmission) {
        await db
          .update(mentorProfiles)
          .set({ formSubmissionId: formSubmission.id })
          .where(eq(mentorProfiles.userId, user.id));
      }
    }

    // Log profile update activity
    await db.insert(activityLogs).values({
      userId: user.id,
      action: ActivityType.UPDATE_MENTOR_PROFILE,
      entityType: 'user',
      entityId: user.id,
      metadata: { profileId: profile.id }
    });

    return NextResponse.json({
      message: 'Mentor profile saved successfully',
      profile
    });
  } catch (error) {
    console.error('Error saving mentor profile:', error);
    return NextResponse.json(
      { error: 'Failed to save mentor profile' },
      { status: 500 }
    );
  }
});
