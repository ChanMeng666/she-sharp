import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/auth/role-middleware';
import { db } from '@/lib/db/drizzle';
import { mentorshipRelationships, users, meetings, mentorFormSubmissions, menteeFormSubmissions, mentorProfiles, menteeProfiles } from '@/lib/db/schema';
import { eq, sql, desc, and, count } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

// Create aliases for users table to reference mentors and mentees
const mentorUser = alias(users, 'mentorUser');
const menteeUser = alias(users, 'menteeUser');
const mentorForm = alias(mentorFormSubmissions, 'mentorForm');
const menteeForm = alias(menteeFormSubmissions, 'menteeForm');
const mentorProfile = alias(mentorProfiles, 'mentorProfile');
const menteeProfile = alias(menteeProfiles, 'menteeProfile');

// Admin-only relationships endpoint
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

      // Fetch relationships with mentor and mentee info including form submissions
      const relationships = await db
        .select({
          id: mentorshipRelationships.id,
          mentorUserId: mentorshipRelationships.mentorUserId,
          menteeUserId: mentorshipRelationships.menteeUserId,
          status: mentorshipRelationships.status,
          startedAt: mentorshipRelationships.startedAt,
          endedAt: mentorshipRelationships.endedAt,
          meetingFrequency: mentorshipRelationships.meetingFrequency,
          nextMeetingDate: mentorshipRelationships.nextMeetingDate,
          relationshipGoals: mentorshipRelationships.relationshipGoals,
          mentorNotes: mentorshipRelationships.mentorNotes,
          menteeNotes: mentorshipRelationships.menteeNotes,
          createdAt: mentorshipRelationships.createdAt,
          updatedAt: mentorshipRelationships.updatedAt,
          // Mentor base info
          mentorName: mentorUser.name,
          mentorEmail: mentorUser.email,
          mentorImage: mentorUser.image,
          // Mentor form info
          mentorFormName: mentorForm.fullName,
          mentorFormPhoto: mentorForm.photoUrl,
          mentorFormCompany: mentorForm.company,
          mentorFormJobTitle: mentorForm.jobTitle,
          mentorFormCity: mentorForm.city,
          mentorFormMbti: mentorForm.mbtiType,
          // Mentor profile info
          mentorProfileCompany: mentorProfile.company,
          mentorProfileJobTitle: mentorProfile.jobTitle,
          mentorYearsExp: mentorProfile.yearsExperience,
          mentorExpertise: mentorProfile.expertiseAreas,
          // Mentee base info
          menteeName: menteeUser.name,
          menteeEmail: menteeUser.email,
          menteeImage: menteeUser.image,
          // Mentee form info
          menteeFormName: menteeForm.fullName,
          menteeFormPhoto: menteeForm.photoUrl,
          menteeFormCity: menteeForm.city,
          menteeFormMbti: menteeForm.mbtiType,
          menteeFormJobTitle: menteeForm.currentJobTitle,
          menteeFormIndustry: menteeForm.currentIndustry,
          menteeFormCareerStage: menteeForm.currentStage,
          // Mentee profile info
          menteeCareerStage: menteeProfile.careerStage,
          menteeLearningGoals: menteeProfile.learningGoals,
          mentorIsTestUser: mentorUser.isTestUser,
          menteeIsTestUser: menteeUser.isTestUser,
        })
        .from(mentorshipRelationships)
        .innerJoin(mentorUser, eq(mentorshipRelationships.mentorUserId, mentorUser.id))
        .innerJoin(menteeUser, eq(mentorshipRelationships.menteeUserId, menteeUser.id))
        .leftJoin(mentorForm, eq(mentorshipRelationships.mentorUserId, mentorForm.userId))
        .leftJoin(menteeForm, eq(mentorshipRelationships.menteeUserId, menteeForm.userId))
        .leftJoin(mentorProfile, eq(mentorshipRelationships.mentorUserId, mentorProfile.userId))
        .leftJoin(menteeProfile, eq(mentorshipRelationships.menteeUserId, menteeProfile.userId))
        .orderBy(desc(mentorshipRelationships.updatedAt))
        .limit(limit)
        .offset(offset);

      // Get meeting stats for each relationship
      const relationshipIds = relationships.map(r => r.id);
      let meetingStats: { relationshipId: number; completedCount: number; scheduledCount: number; avgRating: number | null }[] = [];

      if (relationshipIds.length > 0) {
        meetingStats = await db
          .select({
            relationshipId: meetings.relationshipId,
            completedCount: sql<number>`count(*) filter (where ${meetings.status} = 'completed')::int`,
            scheduledCount: sql<number>`count(*) filter (where ${meetings.status} = 'scheduled')::int`,
            avgRating: sql<number | null>`avg(${meetings.rating})`,
          })
          .from(meetings)
          .where(sql`${meetings.relationshipId} IN (${sql.join(relationshipIds.map(id => sql`${id}`), sql`, `)})`)
          .groupBy(meetings.relationshipId);
      }

      // Combine data with priority: form data > profile data > user data
      const relationshipsData = relationships.map(rel => {
        const stats = meetingStats.find(s => s.relationshipId === rel.id);
        const completedSessions = stats?.completedCount || 0;
        const totalPlannedSessions = 12; // Default expected sessions

        // Calculate at-risk flag for active relationships with no recent activity
        const daysSinceUpdate = rel.updatedAt
          ? Math.floor((Date.now() - new Date(rel.updatedAt).getTime()) / (1000 * 60 * 60 * 24))
          : 0;
        const isAtRisk = rel.status === 'active' && daysSinceUpdate > 30;
        // Compute display status for frontend (at_risk is a UI-only status)
        const displayStatus = isAtRisk ? 'at_risk' : rel.status;

        // Prioritize form data for mentor
        const mentorDisplayName = rel.mentorFormName || rel.mentorName;
        const mentorDisplayPhoto = rel.mentorFormPhoto || rel.mentorImage;
        const mentorCompany = rel.mentorFormCompany || rel.mentorProfileCompany;
        const mentorJobTitle = rel.mentorFormJobTitle || rel.mentorProfileJobTitle;

        // Prioritize form data for mentee
        const menteeDisplayName = rel.menteeFormName || rel.menteeName;
        const menteeDisplayPhoto = rel.menteeFormPhoto || rel.menteeImage;

        return {
          id: rel.id,
          mentor: {
            id: rel.mentorUserId,
            name: mentorDisplayName,
            email: rel.mentorEmail,
            avatar: mentorDisplayPhoto,
            company: mentorCompany,
            jobTitle: mentorJobTitle,
            city: rel.mentorFormCity,
            mbtiType: rel.mentorFormMbti,
            yearsExperience: rel.mentorYearsExp,
            expertise: (rel.mentorExpertise as string[]) || [],
            isTestUser: rel.mentorIsTestUser,
          },
          mentee: {
            id: rel.menteeUserId,
            name: menteeDisplayName,
            email: rel.menteeEmail,
            avatar: menteeDisplayPhoto,
            city: rel.menteeFormCity,
            mbtiType: rel.menteeFormMbti,
            jobTitle: rel.menteeFormJobTitle,
            industry: rel.menteeFormIndustry,
            careerStage: rel.menteeFormCareerStage || rel.menteeCareerStage,
            learningGoals: (rel.menteeLearningGoals as string[]) || [],
            isTestUser: rel.menteeIsTestUser,
          },
          status: displayStatus,
          startedAt: rel.startedAt,
          endedAt: rel.endedAt,
          meetingFrequency: rel.meetingFrequency,
          nextMeetingDate: rel.nextMeetingDate,
          goals: rel.relationshipGoals || [],
          progress: Math.round((completedSessions / totalPlannedSessions) * 100),
          sessionsCompleted: completedSessions,
          sessionsScheduled: stats?.scheduledCount || 0,
          totalSessions: totalPlannedSessions,
          satisfactionScore: stats?.avgRating ? Math.round(stats.avgRating * 10) / 10 : null,
          lastActivity: rel.updatedAt,
          createdAt: rel.createdAt,
        };
      });

      // Get overall statistics
      const [totalStats] = await db
        .select({
          total: sql<number>`count(*)::int`,
          pending: sql<number>`count(*) filter (where ${mentorshipRelationships.status} = 'pending')::int`,
          active: sql<number>`count(*) filter (where ${mentorshipRelationships.status} = 'active')::int`,
          completed: sql<number>`count(*) filter (where ${mentorshipRelationships.status} = 'completed')::int`,
          paused: sql<number>`count(*) filter (where ${mentorshipRelationships.status} = 'paused')::int`,
          rejected: sql<number>`count(*) filter (where ${mentorshipRelationships.status} = 'rejected')::int`,
        })
        .from(mentorshipRelationships);

      // Calculate at-risk count from results
      const atRiskCount = relationshipsData.filter(r => r.status === 'at_risk').length;

      // Get average satisfaction
      const [satisfactionStats] = await db
        .select({
          avgSatisfaction: sql<number | null>`avg(${meetings.rating})`,
          totalMeetings: sql<number>`count(*)::int`,
        })
        .from(meetings)
        .where(eq(meetings.status, 'completed'));

      return NextResponse.json({
        relationships: relationshipsData,
        stats: {
          total: totalStats?.total || 0,
          pending: totalStats?.pending || 0,
          active: totalStats?.active || 0,
          atRisk: atRiskCount,
          completed: totalStats?.completed || 0,
          paused: totalStats?.paused || 0,
          rejected: totalStats?.rejected || 0,
          avgSatisfaction: satisfactionStats?.avgSatisfaction
            ? Math.round(satisfactionStats.avgSatisfaction * 10) / 10
            : 0,
          totalMeetings: satisfactionStats?.totalMeetings || 0,
        },
        pagination: {
          total: totalStats?.total || 0,
          limit,
          offset,
          hasMore: offset + limit < (totalStats?.total || 0)
        }
      });
    } catch (error) {
      console.error('Error fetching relationships:', error);
      return NextResponse.json(
        { error: 'Failed to fetch relationships' },
        { status: 500 }
      );
    }
  }
);
