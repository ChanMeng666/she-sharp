import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { menteeProfiles, users, userRoles, mentorshipRelationships, menteeFormSubmissions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { withRoles, type AuthedRouteContext } from '@/lib/auth/role-middleware';
import { canViewMentorshipPrivateDetails } from '@/lib/mentorship/access';
import { resolvePhoto } from '@/lib/mentorship/resolve';

/**
 * A single mentee's profile.
 *
 * Signed-in only: until 2026-09-06 this handler had no session check at all, so
 * `/api/mentees/1` returned a named beneficiary — a student or career changer —
 * with their email address to anyone, and the integer id enumerated the whole
 * cohort. The email address and the `includeFormData=true` application record
 * (phone, gender, age, city, goals) are narrower still — see
 * `canViewMentorshipPrivateDetails()`.
 */
export const GET = withRoles(
  {},
  async (request: NextRequest, { params, user: viewer }: AuthedRouteContext<{ id: string }>) => {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeFormData = searchParams.get('includeFormData') === 'true';
    const byUserId = searchParams.get('byUserId') === 'true';

    const menteeId = parseInt(id);

    if (isNaN(menteeId)) {
      return NextResponse.json(
        { error: 'Invalid mentee ID' },
        { status: 400 }
      );
    }

    // Get mentee profile by profile ID or user ID
    const [menteeProfile] = await db
      .select()
      .from(menteeProfiles)
      .where(byUserId ? eq(menteeProfiles.userId, menteeId) : eq(menteeProfiles.id, menteeId))
      .limit(1);

    if (!menteeProfile) {
      return NextResponse.json(
        { error: 'Mentee profile not found' },
        { status: 404 }
      );
    }

    // Get user info separately
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, menteeProfile.userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has mentee role active
    const [menteeRole] = await db
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, menteeProfile.userId),
          eq(userRoles.roleType, 'mentee'),
          eq(userRoles.isActive, true)
        )
      )
      .limit(1);

    if (!menteeRole) {
      return NextResponse.json(
        { error: 'Mentee role not active' },
        { status: 404 }
      );
    }

    // Get form submission data for fallback (always needed for base fields like photo)
    const [menteeForm] = await db
      .select({
        photoUrl: menteeFormSubmissions.photoUrl,
        bio: menteeFormSubmissions.bio,
        currentStage: menteeFormSubmissions.currentStage,
      })
      .from(menteeFormSubmissions)
      .where(eq(menteeFormSubmissions.userId, menteeProfile.userId))
      .limit(1);

    // The email address and the form record are the private half of the
    // profile; the rest is directory data any signed-in member may read.
    const canViewPrivateDetails = await canViewMentorshipPrivateDetails(
      viewer.id,
      menteeProfile.userId
    );

    if (includeFormData && !canViewPrivateDetails) {
      return NextResponse.json(
        { error: 'Not authorised to view this application' },
        { status: 403 }
      );
    }

    // Build the mentee object with form → profile → user fallback
    const mentee = {
      id: menteeProfile.id,
      userId: menteeProfile.userId,
      name: user.name,
      email: canViewPrivateDetails ? user.email : null,
      image: resolvePhoto({
        formPhotoUrl: menteeForm?.photoUrl,
        profilePhotoUrl: menteeProfile.photoUrl,
        userImage: user.image,
      }),
      learningGoals: menteeProfile.learningGoals || [],
      careerStage: menteeForm?.currentStage || menteeProfile.careerStage || null,
      preferredExpertiseAreas: menteeProfile.preferredExpertiseAreas || [],
      preferredMeetingFrequency: menteeProfile.preferredMeetingFrequency || null,
      bio: menteeForm?.bio || menteeProfile.bio || null,
      currentChallenge: menteeProfile.currentChallenge || null,
      profileCompletedAt: menteeProfile.profileCompletedAt || null,
    };

    // Check if current user has a relationship with this mentee
    let relationshipStatus = null;
    const relationships = await db
      .select()
      .from(mentorshipRelationships)
      .where(
        and(
          eq(mentorshipRelationships.menteeUserId, mentee.userId),
          eq(mentorshipRelationships.mentorUserId, viewer.id)
        )
      )
      .limit(1);

    if (relationships.length > 0) {
      relationshipStatus = relationships[0].status;
    }

    // Get form submission data if requested
    let formData = null;
    if (includeFormData) {
      const [formSubmission] = await db
        .select({
          fullName: menteeFormSubmissions.fullName,
          gender: menteeFormSubmissions.gender,
          age: menteeFormSubmissions.age,
          phone: menteeFormSubmissions.phone,
          currentStage: menteeFormSubmissions.currentStage,
          photoUrl: menteeFormSubmissions.photoUrl,
          bio: menteeFormSubmissions.bio,
          city: menteeFormSubmissions.city,
          preferredMeetingFormat: menteeFormSubmissions.preferredMeetingFormat,
          currentJobTitle: menteeFormSubmissions.currentJobTitle,
          currentIndustry: menteeFormSubmissions.currentIndustry,
          preferredIndustries: menteeFormSubmissions.preferredIndustries,
          softSkillsBasic: menteeFormSubmissions.softSkillsBasic,
          industrySkillsBasic: menteeFormSubmissions.industrySkillsBasic,
          softSkillsExpert: menteeFormSubmissions.softSkillsExpert,
          industrySkillsExpert: menteeFormSubmissions.industrySkillsExpert,
          longTermGoals: menteeFormSubmissions.longTermGoals,
          shortTermGoals: menteeFormSubmissions.shortTermGoals,
          whyMentor: menteeFormSubmissions.whyMentor,
          programExpectations: menteeFormSubmissions.programExpectations,
          mbtiType: menteeFormSubmissions.mbtiType,
          preferredMeetingFrequency: menteeFormSubmissions.preferredMeetingFrequency,
        })
        .from(menteeFormSubmissions)
        .where(eq(menteeFormSubmissions.userId, menteeProfile.userId))
        .limit(1);

      if (formSubmission) {
        formData = formSubmission;
      }
    }

    // Return clean JSON object
    return NextResponse.json({
      mentee: {
        ...mentee,
        relationshipStatus,
        formData,
      },
    });
  } catch (error) {
    console.error('Error fetching mentee details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mentee details' },
      { status: 500 }
    );
  }
});
