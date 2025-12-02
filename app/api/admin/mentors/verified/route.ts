import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/auth/role-middleware';
import { db } from '@/lib/db/drizzle';
import { mentorProfiles, users, userRoles, mentorshipRelationships, meetings, mentorFormSubmissions } from '@/lib/db/schema';
import { eq, sql, desc, isNotNull, and, count } from 'drizzle-orm';

// Admin-only verified mentors endpoint
export const GET = withRoles(
  {
    requiredRoles: ['admin'],
    requiredAdminPermissions: ['canManageRelationships']
  },
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const limit = parseInt(searchParams.get('limit') || '50');
      const offset = parseInt(searchParams.get('offset') || '0');

      // Fetch verified mentors with user info and form submission data
      const mentors = await db
        .select({
          id: mentorProfiles.id,
          userId: mentorProfiles.userId,
          name: users.name,
          email: users.email,
          phone: users.phone,
          image: users.image,
          company: mentorProfiles.company,
          jobTitle: mentorProfiles.jobTitle,
          expertiseAreas: mentorProfiles.expertiseAreas,
          yearsExperience: mentorProfiles.yearsExperience,
          bio: mentorProfiles.bio,
          linkedinUrl: mentorProfiles.linkedinUrl,
          isAcceptingMentees: mentorProfiles.isAcceptingMentees,
          maxMentees: mentorProfiles.maxMentees,
          currentMenteesCount: mentorProfiles.currentMenteesCount,
          verifiedAt: mentorProfiles.verifiedAt,
          photoUrl: mentorProfiles.photoUrl,
          profileCompletedAt: mentorProfiles.profileCompletedAt,
          userCreatedAt: users.createdAt,
          // Form submission data for detailed info
          formFullName: mentorFormSubmissions.fullName,
          formPhotoUrl: mentorFormSubmissions.photoUrl,
          formCity: mentorFormSubmissions.city,
          formMbtiType: mentorFormSubmissions.mbtiType,
          formSoftSkillsExpert: mentorFormSubmissions.softSkillsExpert,
          formIndustrySkillsExpert: mentorFormSubmissions.industrySkillsExpert,
          formPreferredIndustries: mentorFormSubmissions.preferredIndustries,
          formCommunicationPref: mentorFormSubmissions.preferredMeetingFormat,
          formAvailability: mentorFormSubmissions.availabilityHoursPerMonth,
        })
        .from(mentorProfiles)
        .innerJoin(users, eq(mentorProfiles.userId, users.id))
        .leftJoin(mentorFormSubmissions, eq(mentorProfiles.userId, mentorFormSubmissions.userId))
        .where(isNotNull(mentorProfiles.verifiedAt))
        .orderBy(desc(mentorProfiles.verifiedAt))
        .limit(limit)
        .offset(offset);

      // Get mentorship stats for each mentor
      const mentorIds = mentors.map(m => m.userId);

      let relationshipStats: { mentorUserId: number; activeCount: number; totalCount: number }[] = [];
      let meetingStats: { mentorUserId: number; totalMeetings: number; avgRating: number | null }[] = [];

      if (mentorIds.length > 0) {
        // Get relationship counts
        relationshipStats = await db
          .select({
            mentorUserId: mentorshipRelationships.mentorUserId,
            activeCount: sql<number>`count(*) filter (where ${mentorshipRelationships.status} = 'active')::int`,
            totalCount: sql<number>`count(*)::int`,
          })
          .from(mentorshipRelationships)
          .where(sql`${mentorshipRelationships.mentorUserId} IN (${sql.join(mentorIds.map(id => sql`${id}`), sql`, `)})`)
          .groupBy(mentorshipRelationships.mentorUserId);

        // Get meeting stats
        meetingStats = await db
          .select({
            mentorUserId: mentorshipRelationships.mentorUserId,
            totalMeetings: sql<number>`count(${meetings.id})::int`,
            avgRating: sql<number | null>`avg(${meetings.rating})`,
          })
          .from(meetings)
          .innerJoin(mentorshipRelationships, eq(meetings.relationshipId, mentorshipRelationships.id))
          .where(sql`${mentorshipRelationships.mentorUserId} IN (${sql.join(mentorIds.map(id => sql`${id}`), sql`, `)})`)
          .groupBy(mentorshipRelationships.mentorUserId);
      }

      // Combine data with priority: form data > profile data > user data
      const mentorsData = mentors.map(mentor => {
        const relStats = relationshipStats.find(r => r.mentorUserId === mentor.userId);
        const meetStats = meetingStats.find(m => m.mentorUserId === mentor.userId);

        // Prioritize form data over profile/user data
        const displayName = mentor.formFullName || mentor.name;
        const displayPhoto = mentor.formPhotoUrl || mentor.photoUrl || mentor.image;

        // Combine skills from form and profile
        const formSkills = [
          ...(mentor.formSoftSkillsExpert as string[] || []),
          ...(mentor.formIndustrySkillsExpert as string[] || [])
        ];
        const expertise = formSkills.length > 0 ? formSkills : (mentor.expertiseAreas || []);

        return {
          id: mentor.id,
          userId: mentor.userId,
          name: displayName,
          email: mentor.email,
          phone: mentor.phone,
          avatar: displayPhoto,
          company: mentor.company,
          jobTitle: mentor.jobTitle,
          expertiseAreas: expertise,
          yearsExperience: mentor.yearsExperience,
          bio: mentor.bio,
          linkedinUrl: mentor.linkedinUrl,
          isAcceptingMentees: mentor.isAcceptingMentees,
          maxMentees: mentor.maxMentees,
          currentMenteesCount: mentor.currentMenteesCount || 0,
          verifiedAt: mentor.verifiedAt,
          createdAt: mentor.userCreatedAt,
          // Extended info from form submissions
          city: mentor.formCity,
          mbtiType: mentor.formMbtiType,
          preferredIndustries: (mentor.formPreferredIndustries as string[]) || [],
          communicationPreference: mentor.formCommunicationPref,
          monthlyAvailability: mentor.formAvailability,
          // Computed stats
          activeMentees: relStats?.activeCount || 0,
          totalMentees: relStats?.totalCount || 0,
          totalSessions: meetStats?.totalMeetings || 0,
          avgRating: meetStats?.avgRating ? Math.round(meetStats.avgRating * 10) / 10 : null,
          status: mentor.isAcceptingMentees
            ? (mentor.currentMenteesCount || 0) >= (mentor.maxMentees || 3) ? 'busy' : 'active'
            : 'paused',
        };
      });

      // Get overall statistics
      const [totalStats] = await db
        .select({
          totalVerified: sql<number>`count(*)::int`,
          totalActive: sql<number>`count(*) filter (where ${mentorProfiles.isAcceptingMentees} = true)::int`,
        })
        .from(mentorProfiles)
        .where(isNotNull(mentorProfiles.verifiedAt));

      // Get total sessions and average rating
      const [sessionStats] = await db
        .select({
          totalSessions: sql<number>`count(*)::int`,
          avgRating: sql<number | null>`avg(${meetings.rating})`,
        })
        .from(meetings)
        .innerJoin(mentorshipRelationships, eq(meetings.relationshipId, mentorshipRelationships.id))
        .innerJoin(mentorProfiles, and(
          eq(mentorshipRelationships.mentorUserId, mentorProfiles.userId),
          isNotNull(mentorProfiles.verifiedAt)
        ));

      return NextResponse.json({
        mentors: mentorsData,
        stats: {
          totalVerified: totalStats?.totalVerified || 0,
          totalActive: totalStats?.totalActive || 0,
          totalSessions: sessionStats?.totalSessions || 0,
          avgRating: sessionStats?.avgRating ? Math.round(sessionStats.avgRating * 10) / 10 : 0,
        },
        pagination: {
          total: totalStats?.totalVerified || 0,
          limit,
          offset,
          hasMore: offset + limit < (totalStats?.totalVerified || 0)
        }
      });
    } catch (error) {
      console.error('Error fetching verified mentors:', error);
      return NextResponse.json(
        { error: 'Failed to fetch verified mentors' },
        { status: 500 }
      );
    }
  }
);
