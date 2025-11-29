import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/auth/role-middleware';
import { db } from '@/lib/db/drizzle';
import { mentorFormSubmissions, users } from '@/lib/db/schema';
import { eq, and, or, desc, sql, isNotNull } from 'drizzle-orm';

/**
 * GET /api/admin/mentors/applications
 * Fetches mentor applications from form submissions (including public submissions).
 */
export const GET = withRoles(
  {
    requiredRoles: ['admin'],
    requiredAdminPermissions: ['canVerifyMentors']
  },
  async (req: NextRequest, context: any) => {
    try {
      const { searchParams } = new URL(req.url);
      const statusFilter = searchParams.get('status') || 'pending';

      // Build status conditions
      let statusCondition;
      if (statusFilter === 'pending' || statusFilter === 'submitted') {
        statusCondition = eq(mentorFormSubmissions.status, 'submitted');
      } else if (statusFilter === 'under_review') {
        statusCondition = eq(mentorFormSubmissions.status, 'in_progress');
      } else if (statusFilter === 'approved') {
        statusCondition = eq(mentorFormSubmissions.status, 'approved');
      } else if (statusFilter === 'rejected') {
        statusCondition = eq(mentorFormSubmissions.status, 'rejected');
      } else {
        // 'all' - fetch all non-draft submissions
        statusCondition = or(
          eq(mentorFormSubmissions.status, 'submitted'),
          eq(mentorFormSubmissions.status, 'approved'),
          eq(mentorFormSubmissions.status, 'rejected')
        );
      }

      // Fetch form submissions (left join with users for public submissions)
      const submissions = await db
        .select({
          id: mentorFormSubmissions.id,
          userId: mentorFormSubmissions.userId,
          email: mentorFormSubmissions.email,
          status: mentorFormSubmissions.status,
          fullName: mentorFormSubmissions.fullName,
          gender: mentorFormSubmissions.gender,
          phone: mentorFormSubmissions.phone,
          mbtiType: mentorFormSubmissions.mbtiType,
          jobTitle: mentorFormSubmissions.jobTitle,
          company: mentorFormSubmissions.company,
          bio: mentorFormSubmissions.bio,
          photoUrl: mentorFormSubmissions.photoUrl,
          yearsExperience: mentorFormSubmissions.yearsExperience,
          linkedinUrl: mentorFormSubmissions.linkedinUrl,
          availabilityHoursPerMonth: mentorFormSubmissions.availabilityHoursPerMonth,
          maxMentees: mentorFormSubmissions.maxMentees,
          softSkillsExpert: mentorFormSubmissions.softSkillsExpert,
          industrySkillsExpert: mentorFormSubmissions.industrySkillsExpert,
          expectedMenteeGoalsLongTerm: mentorFormSubmissions.expectedMenteeGoalsLongTerm,
          programExpectations: mentorFormSubmissions.programExpectations,
          submittedAt: mentorFormSubmissions.submittedAt,
          reviewedAt: mentorFormSubmissions.reviewedAt,
          reviewedBy: mentorFormSubmissions.reviewedBy,
          reviewNotes: mentorFormSubmissions.reviewNotes,
          createdAt: mentorFormSubmissions.createdAt,
          // User fields (may be null for public submissions)
          userName: users.name,
          userEmail: users.email,
          userImage: users.image,
        })
        .from(mentorFormSubmissions)
        .leftJoin(users, eq(mentorFormSubmissions.userId, users.id))
        .where(statusCondition)
        .orderBy(desc(mentorFormSubmissions.submittedAt));

      // Transform to match expected interface
      const formattedApplications = submissions.map(app => {
        // Combine soft skills and industry skills as expertise areas
        const expertiseAreas = [
          ...(app.softSkillsExpert as string[] || []),
          ...(app.industrySkillsExpert as string[] || []),
        ];

        // Map form status to UI status
        let uiStatus: 'pending' | 'under_review' | 'approved' | 'rejected';
        switch (app.status) {
          case 'submitted':
            uiStatus = 'pending';
            break;
          case 'in_progress':
            uiStatus = 'under_review';
            break;
          case 'approved':
            uiStatus = 'approved';
            break;
          case 'rejected':
            uiStatus = 'rejected';
            break;
          default:
            uiStatus = 'pending';
        }

        return {
          id: app.id,
          userId: app.userId,
          isPublicApplication: !app.userId,
          user: {
            name: app.fullName || app.userName || 'Unknown',
            email: app.email || app.userEmail || 'No email',
            image: app.photoUrl || app.userImage,
          },
          expertiseAreas,
          yearsExperience: app.yearsExperience || 0,
          company: app.company || '',
          jobTitle: app.jobTitle || '',
          bio: app.bio || '',
          linkedinUrl: app.linkedinUrl || '',
          availabilityHoursPerMonth: app.availabilityHoursPerMonth || 0,
          maxMentees: app.maxMentees || 3,
          mbtiType: app.mbtiType,
          expectedMenteeGoals: app.expectedMenteeGoalsLongTerm || '',
          programExpectations: app.programExpectations || '',
          submittedAt: app.submittedAt?.toISOString() || app.createdAt.toISOString(),
          reviewedAt: app.reviewedAt?.toISOString(),
          reviewNotes: app.reviewNotes,
          status: uiStatus,
        };
      });

      // Calculate stats
      const stats = {
        pending: submissions.filter(s => s.status === 'submitted').length,
        underReview: submissions.filter(s => s.status === 'in_progress').length,
        approved: submissions.filter(s => s.status === 'approved').length,
        rejected: submissions.filter(s => s.status === 'rejected').length,
      };

      return NextResponse.json({
        applications: formattedApplications,
        total: formattedApplications.length,
        stats,
      });
    } catch (error) {
      console.error('Error fetching mentor applications:', error);
      return NextResponse.json(
        { error: 'Failed to fetch mentor applications' },
        { status: 500 }
      );
    }
  }
);
