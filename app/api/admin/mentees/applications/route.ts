import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/auth/role-middleware';
import { db } from '@/lib/db/drizzle';
import { menteeFormSubmissions, users, programmes } from '@/lib/db/schema';
import { eq, or, desc, and } from 'drizzle-orm';

/**
 * GET /api/admin/mentees/applications
 * Fetches mentee applications from form submissions (including public submissions).
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
      const programmeIdFilter = searchParams.get('programmeId');

      let statusCondition;
      if (statusFilter === 'pending' || statusFilter === 'submitted') {
        statusCondition = eq(menteeFormSubmissions.status, 'submitted');
      } else if (statusFilter === 'under_review') {
        statusCondition = eq(menteeFormSubmissions.status, 'in_progress');
      } else if (statusFilter === 'approved') {
        statusCondition = eq(menteeFormSubmissions.status, 'approved');
      } else if (statusFilter === 'rejected') {
        statusCondition = eq(menteeFormSubmissions.status, 'rejected');
      } else {
        statusCondition = or(
          eq(menteeFormSubmissions.status, 'submitted'),
          eq(menteeFormSubmissions.status, 'approved'),
          eq(menteeFormSubmissions.status, 'rejected')
        );
      }

      const submissions = await db
        .select({
          id: menteeFormSubmissions.id,
          userId: menteeFormSubmissions.userId,
          email: menteeFormSubmissions.email,
          status: menteeFormSubmissions.status,
          fullName: menteeFormSubmissions.fullName,
          gender: menteeFormSubmissions.gender,
          phone: menteeFormSubmissions.phone,
          mbtiType: menteeFormSubmissions.mbtiType,
          bio: menteeFormSubmissions.bio,
          photoUrl: menteeFormSubmissions.photoUrl,
          city: menteeFormSubmissions.city,
          currentStage: menteeFormSubmissions.currentStage,
          currentJobTitle: menteeFormSubmissions.currentJobTitle,
          currentIndustry: menteeFormSubmissions.currentIndustry,
          longTermGoals: menteeFormSubmissions.longTermGoals,
          shortTermGoals: menteeFormSubmissions.shortTermGoals,
          whyMentor: menteeFormSubmissions.whyMentor,
          programExpectations: menteeFormSubmissions.programExpectations,
          submittedAt: menteeFormSubmissions.submittedAt,
          reviewedAt: menteeFormSubmissions.reviewedAt,
          reviewedBy: menteeFormSubmissions.reviewedBy,
          reviewNotes: menteeFormSubmissions.reviewNotes,
          programmeId: menteeFormSubmissions.programmeId,
          createdAt: menteeFormSubmissions.createdAt,
          userName: users.name,
          programmeName: programmes.name,
          userEmail: users.email,
          userImage: users.image,
        })
        .from(menteeFormSubmissions)
        .leftJoin(users, eq(menteeFormSubmissions.userId, users.id))
        .leftJoin(programmes, eq(menteeFormSubmissions.programmeId, programmes.id))
        .where(
          programmeIdFilter
            ? and(statusCondition!, eq(menteeFormSubmissions.programmeId, parseInt(programmeIdFilter)))
            : statusCondition
        )
        .orderBy(desc(menteeFormSubmissions.submittedAt));

      const formattedApplications = submissions.map(app => {
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
          bio: app.bio || '',
          city: app.city || '',
          currentStage: app.currentStage || '',
          currentJobTitle: app.currentJobTitle || '',
          currentIndustry: app.currentIndustry || '',
          longTermGoals: app.longTermGoals || '',
          shortTermGoals: app.shortTermGoals || '',
          whyMentor: app.whyMentor || '',
          programExpectations: app.programExpectations || '',
          mbtiType: app.mbtiType,
          submittedAt: app.submittedAt?.toISOString() || app.createdAt.toISOString(),
          reviewedAt: app.reviewedAt?.toISOString(),
          programmeId: app.programmeId,
          programmeName: (app as any).programmeName || null,
          reviewNotes: app.reviewNotes,
          status: uiStatus,
        };
      });

      const stats = {
        pending: submissions.filter(s => s.status === 'submitted').length,
        underReview: submissions.filter(s => s.status === 'in_progress').length,
        approved: submissions.filter(s => s.status === 'approved').length,
        rejected: submissions.filter(s => s.status === 'rejected').length,
      };

      // Add programme breakdown to stats
      const programmeBreakdown: Record<string, number> = {};
      for (const s of submissions) {
        const pName = (s as any).programmeName || 'General';
        programmeBreakdown[pName] = (programmeBreakdown[pName] || 0) + 1;
      }

      return NextResponse.json({
        applications: formattedApplications,
        total: formattedApplications.length,
        stats,
        programmeBreakdown,
      });
    } catch (error) {
      console.error('Error fetching mentee applications:', error);
      return NextResponse.json(
        { error: 'Failed to fetch mentee applications' },
        { status: 500 }
      );
    }
  }
);
