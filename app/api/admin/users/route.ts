import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/auth/role-middleware';
import { db } from '@/lib/db/drizzle';
import { users, userRoles, userMemberships, mentorProfiles, menteeProfiles, mentorFormSubmissions, menteeFormSubmissions } from '@/lib/db/schema';
import { sql, eq, and, or, like, desc, asc } from 'drizzle-orm';

// Admin-only user management endpoint
export const GET = withRoles(
  {
    requiredRoles: ['admin'],
    requiredAdminPermissions: ['canEditUsers']
  },
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const sortBy = searchParams.get('sortBy') || 'createdAt';
      const sortOrder = searchParams.get('sortOrder') || 'desc';
      const roleFilter = searchParams.get('role');
      const statusFilter = searchParams.get('status');
      const membershipFilter = searchParams.get('membership');
      const searchQuery = searchParams.get('search');

      const offset = (page - 1) * limit;
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Build conditions
      const conditions = [sql`${users.deletedAt} IS NULL`];

      if (searchQuery) {
        conditions.push(
          or(
            like(users.name, `%${searchQuery}%`),
            like(users.email, `%${searchQuery}%`)
          )!
        );
      }

      // Fetch users with their detailed info from form submissions and profiles
      const usersData = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          image: users.image,
          phone: users.phone,
          createdAt: users.createdAt,
          lastLoginAt: users.lastLoginAt,
          // Mentor profile data
          mentorProfileId: mentorProfiles.id,
          mentorCompany: mentorProfiles.company,
          mentorJobTitle: mentorProfiles.jobTitle,
          mentorBio: mentorProfiles.bio,
          mentorYearsExp: mentorProfiles.yearsExperience,
          mentorExpertise: mentorProfiles.expertiseAreas,
          mentorVerifiedAt: mentorProfiles.verifiedAt,
          mentorIsAccepting: mentorProfiles.isAcceptingMentees,
          mentorMaxMentees: mentorProfiles.maxMentees,
          mentorCurrentMentees: mentorProfiles.currentMenteesCount,
          // Mentor form data (more detailed)
          mentorFormFullName: mentorFormSubmissions.fullName,
          mentorFormPhoto: mentorFormSubmissions.photoUrl,
          mentorFormCompany: mentorFormSubmissions.company,
          mentorFormJobTitle: mentorFormSubmissions.jobTitle,
          mentorFormCity: mentorFormSubmissions.city,
          mentorFormMbti: mentorFormSubmissions.mbtiType,
          mentorFormStatus: mentorFormSubmissions.status,
          // Mentee profile data
          menteeProfileId: menteeProfiles.id,
          menteeCareerStage: menteeProfiles.careerStage,
          menteeBio: menteeProfiles.bio,
          menteeLearningGoals: menteeProfiles.learningGoals,
          // Mentee form data (more detailed)
          menteeFormFullName: menteeFormSubmissions.fullName,
          menteeFormPhoto: menteeFormSubmissions.photoUrl,
          menteeFormCity: menteeFormSubmissions.city,
          menteeFormMbti: menteeFormSubmissions.mbtiType,
          menteeFormJobTitle: menteeFormSubmissions.currentJobTitle,
          menteeFormIndustry: menteeFormSubmissions.currentIndustry,
          menteeFormStatus: menteeFormSubmissions.status,
          menteeFormCareerStage: menteeFormSubmissions.currentStage,
          // Subqueries for membership and roles
          membershipTier: sql<string>`COALESCE((SELECT tier FROM user_memberships WHERE user_id = ${users.id}), 'free')`,
          roles: sql<string[]>`COALESCE(
            ARRAY(
              SELECT role_type::text
              FROM user_roles
              WHERE user_id = ${users.id}
              AND is_active = true
            ),
            ARRAY[]::text[]
          )`,
        })
        .from(users)
        .leftJoin(mentorProfiles, eq(users.id, mentorProfiles.userId))
        .leftJoin(mentorFormSubmissions, eq(users.id, mentorFormSubmissions.userId))
        .leftJoin(menteeProfiles, eq(users.id, menteeProfiles.userId))
        .leftJoin(menteeFormSubmissions, eq(users.id, menteeFormSubmissions.userId))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .limit(limit)
        .offset(offset)
        .orderBy(
          sortOrder === 'desc'
            ? desc(users[sortBy as keyof typeof users] as any)
            : asc(users[sortBy as keyof typeof users] as any)
        );

      // Get total count
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      // Transform and filter data
      let filteredUsers = usersData.map(user => {
        // Determine status based on lastLoginAt
        let status: 'active' | 'inactive' | 'suspended';
        if (user.lastLoginAt && new Date(user.lastLoginAt) >= thirtyDaysAgo) {
          status = 'active';
        } else {
          status = 'inactive';
        }

        // Prioritize: form fullName > users.name
        const displayName = user.mentorFormFullName || user.menteeFormFullName || user.name;
        // Prioritize: form photoUrl > users.image
        const displayImage = user.mentorFormPhoto || user.menteeFormPhoto || user.image;
        // Get company from mentor form/profile
        const company = user.mentorFormCompany || user.mentorCompany;
        // Get job title from mentor form/profile or mentee form
        const jobTitle = user.mentorFormJobTitle || user.mentorJobTitle || user.menteeFormJobTitle;
        // Get city from mentor or mentee form
        const city = user.mentorFormCity || user.menteeFormCity;
        // Get MBTI from either form
        const mbtiType = user.mentorFormMbti || user.menteeFormMbti;

        // Determine application status
        let applicationStatus: 'none' | 'pending' | 'approved' | 'rejected' = 'none';
        if (user.mentorFormStatus === 'submitted' || user.menteeFormStatus === 'submitted') {
          applicationStatus = 'pending';
        } else if (user.mentorFormStatus === 'approved' || user.menteeFormStatus === 'approved') {
          applicationStatus = 'approved';
        } else if (user.mentorFormStatus === 'rejected' || user.menteeFormStatus === 'rejected') {
          applicationStatus = 'rejected';
        } else if (user.mentorFormStatus === 'in_progress' || user.menteeFormStatus === 'in_progress') {
          applicationStatus = 'pending';
        }

        return {
          id: user.id,
          name: displayName,
          email: user.email,
          image: displayImage,
          phone: user.phone,
          roles: user.roles || [],
          membershipTier: user.membershipTier as 'free' | 'basic' | 'premium',
          status,
          createdAt: user.createdAt.toISOString(),
          lastLoginAt: user.lastLoginAt?.toISOString() || null,
          // Extended profile info
          company,
          jobTitle,
          city,
          mbtiType,
          applicationStatus,
          // Mentor specific
          mentorInfo: user.mentorProfileId ? {
            isVerified: !!user.mentorVerifiedAt,
            verifiedAt: user.mentorVerifiedAt?.toISOString() || null,
            isAccepting: user.mentorIsAccepting,
            maxMentees: user.mentorMaxMentees || 3,
            currentMentees: user.mentorCurrentMentees || 0,
            yearsExperience: user.mentorYearsExp,
            expertise: (user.mentorExpertise as string[]) || [],
            bio: user.mentorBio,
          } : null,
          // Mentee specific
          menteeInfo: user.menteeProfileId ? {
            careerStage: user.menteeFormCareerStage || user.menteeCareerStage,
            currentIndustry: user.menteeFormIndustry,
            learningGoals: (user.menteeLearningGoals as string[]) || [],
            bio: user.menteeBio,
          } : null,
        };
      });

      // Apply client-side filters (for role, status, membership)
      if (roleFilter && roleFilter !== 'all') {
        filteredUsers = filteredUsers.filter(user =>
          user.roles.includes(roleFilter)
        );
      }

      if (statusFilter && statusFilter !== 'all') {
        filteredUsers = filteredUsers.filter(user =>
          user.status === statusFilter
        );
      }

      if (membershipFilter && membershipFilter !== 'all') {
        filteredUsers = filteredUsers.filter(user =>
          user.membershipTier === membershipFilter
        );
      }

      return NextResponse.json({
        users: filteredUsers,
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }
  }
);
