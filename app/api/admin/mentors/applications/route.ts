import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/auth/role-middleware';
import { db } from '@/lib/db/drizzle';
import { mentorProfiles, users, userRoles } from '@/lib/db/schema';
import { eq, and, isNull, isNotNull, desc, sql } from 'drizzle-orm';

// Admin-only mentor applications endpoint
export const GET = withRoles(
  {
    requiredRoles: ['admin'],
    requiredAdminPermissions: ['canVerifyMentors']
  },
  async (req: NextRequest, context: any) => {
    try {
      const { searchParams } = new URL(req.url);
      const statusFilter = searchParams.get('status') || 'pending';

      let conditions = [];

      // Filter based on verification status
      if (statusFilter === 'pending') {
        conditions.push(isNull(mentorProfiles.verifiedAt));
      } else if (statusFilter === 'under_review') {
        // For this simple implementation, treat under_review same as pending
        // In a real system, you might have a separate field for this
        conditions.push(isNull(mentorProfiles.verifiedAt));
      } else if (statusFilter === 'approved') {
        conditions.push(isNotNull(mentorProfiles.verifiedAt));
      }

      // Fetch mentor profiles with user information
      const applications = await db
        .select({
          id: mentorProfiles.id,
          userId: mentorProfiles.userId,
          userName: users.name,
          userEmail: users.email,
          userImage: users.image,
          expertiseAreas: mentorProfiles.expertiseAreas,
          yearsExperience: mentorProfiles.yearsExperience,
          company: mentorProfiles.company,
          jobTitle: mentorProfiles.jobTitle,
          bio: mentorProfiles.bio,
          linkedinUrl: mentorProfiles.linkedinUrl,
          availabilityHoursPerMonth: mentorProfiles.availabilityHoursPerMonth,
          profileCompletedAt: mentorProfiles.profileCompletedAt,
          verifiedAt: mentorProfiles.verifiedAt,
        })
        .from(mentorProfiles)
        .innerJoin(users, eq(mentorProfiles.userId, users.id))
        .where(
          conditions.length > 0
            ? and(
                ...conditions,
                sql`${users.deletedAt} IS NULL`
              )
            : sql`${users.deletedAt} IS NULL`
        )
        .orderBy(desc(mentorProfiles.profileCompletedAt));

      // Transform to match expected interface
      const formattedApplications = applications.map(app => {
        let status: 'pending' | 'under_review' | 'approved' | 'rejected';

        if (app.verifiedAt) {
          status = 'approved';
        } else {
          status = 'pending';
        }

        return {
          id: app.id,
          userId: app.userId,
          user: {
            name: app.userName || 'Unknown User',
            email: app.userEmail,
            image: app.userImage,
          },
          expertiseAreas: (app.expertiseAreas as string[]) || [],
          yearsExperience: app.yearsExperience || 0,
          company: app.company || '',
          jobTitle: app.jobTitle || '',
          bio: app.bio || '',
          linkedinUrl: app.linkedinUrl || '',
          availabilityHoursPerMonth: app.availabilityHoursPerMonth || 0,
          submittedAt: app.profileCompletedAt?.toISOString() || new Date().toISOString(),
          status,
        };
      });

      return NextResponse.json({
        applications: formattedApplications,
        total: formattedApplications.length
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
