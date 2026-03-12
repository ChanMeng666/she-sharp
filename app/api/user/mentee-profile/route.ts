import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import {
  menteeProfiles,
  menteeFormSubmissions,
  userRoles,
  activityLogs,
  ActivityType,
} from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      photoUrl: formData?.photoUrl || '',
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
}

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

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
}
