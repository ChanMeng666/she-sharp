import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/auth/role-middleware';
import { db } from '@/lib/db/drizzle';
import { users, userRoles, userMemberships, mentorProfiles, menteeProfiles, mentorFormSubmissions, menteeFormSubmissions, mentorshipRelationships, meetings } from '@/lib/db/schema';
import { sql, eq, and, or, like, desc, asc, isNull, isNotNull } from 'drizzle-orm';

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
      const applicationFilter = searchParams.get('application'); // 'all' | 'has_pending' | 'no_application'
      const userTypeFilter = searchParams.get('userType'); // 'all' | 'real' | 'test'
      const searchQuery = searchParams.get('search');

      const offset = (page - 1) * limit;
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Build conditions for registered users
      const userConditions = [sql`${users.deletedAt} IS NULL`];

      if (searchQuery) {
        userConditions.push(
          or(
            like(users.name, `%${searchQuery}%`),
            like(users.email, `%${searchQuery}%`)
          )!
        );
      }

      if (userTypeFilter === 'real') {
        userConditions.push(eq(users.isTestUser, false));
      } else if (userTypeFilter === 'test') {
        userConditions.push(eq(users.isTestUser, true));
      }

      // Fetch registered users with their detailed info
      const usersData = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          image: users.image,
          phone: users.phone,
          isTestUser: users.isTestUser,
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
          mentorLinkedinUrl: mentorProfiles.linkedinUrl,
          // Mentor form data (more detailed)
          mentorFormId: mentorFormSubmissions.id,
          mentorFormFullName: mentorFormSubmissions.fullName,
          mentorFormPhoto: mentorFormSubmissions.photoUrl,
          mentorFormCompany: mentorFormSubmissions.company,
          mentorFormJobTitle: mentorFormSubmissions.jobTitle,
          mentorFormCity: mentorFormSubmissions.city,
          mentorFormMbti: mentorFormSubmissions.mbtiType,
          mentorFormStatus: mentorFormSubmissions.status,
          mentorFormSubmittedAt: mentorFormSubmissions.submittedAt,
          mentorFormYearsExp: mentorFormSubmissions.yearsExperience,
          mentorFormLinkedinUrl: mentorFormSubmissions.linkedinUrl,
          mentorFormAvailability: mentorFormSubmissions.availabilityHoursPerMonth,
          mentorFormSoftSkillsExpert: mentorFormSubmissions.softSkillsExpert,
          mentorFormIndustrySkillsExpert: mentorFormSubmissions.industrySkillsExpert,
          mentorFormBio: mentorFormSubmissions.bio,
          mentorFormReviewNotes: mentorFormSubmissions.reviewNotes,
          // Mentee profile data
          menteeProfileId: menteeProfiles.id,
          menteeCareerStage: menteeProfiles.careerStage,
          menteeBio: menteeProfiles.bio,
          menteeLearningGoals: menteeProfiles.learningGoals,
          // Mentee form data (more detailed)
          menteeFormId: menteeFormSubmissions.id,
          menteeFormFullName: menteeFormSubmissions.fullName,
          menteeFormPhoto: menteeFormSubmissions.photoUrl,
          menteeFormCity: menteeFormSubmissions.city,
          menteeFormMbti: menteeFormSubmissions.mbtiType,
          menteeFormJobTitle: menteeFormSubmissions.currentJobTitle,
          menteeFormIndustry: menteeFormSubmissions.currentIndustry,
          menteeFormStatus: menteeFormSubmissions.status,
          menteeFormCareerStage: menteeFormSubmissions.currentStage,
          menteeFormSubmittedAt: menteeFormSubmissions.submittedAt,
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
        .where(userConditions.length > 0 ? and(...userConditions) : undefined)
        .orderBy(
          sortOrder === 'desc'
            ? desc(users[sortBy as keyof typeof users] as any)
            : asc(users[sortBy as keyof typeof users] as any)
        );

      // Fetch public applications (userId is NULL) - only pending/submitted ones
      const publicApplications = await db
        .select({
          id: mentorFormSubmissions.id,
          email: mentorFormSubmissions.email,
          fullName: mentorFormSubmissions.fullName,
          photoUrl: mentorFormSubmissions.photoUrl,
          phone: mentorFormSubmissions.phone,
          company: mentorFormSubmissions.company,
          jobTitle: mentorFormSubmissions.jobTitle,
          city: mentorFormSubmissions.city,
          mbtiType: mentorFormSubmissions.mbtiType,
          status: mentorFormSubmissions.status,
          submittedAt: mentorFormSubmissions.submittedAt,
          createdAt: mentorFormSubmissions.createdAt,
          yearsExperience: mentorFormSubmissions.yearsExperience,
          linkedinUrl: mentorFormSubmissions.linkedinUrl,
          availabilityHoursPerMonth: mentorFormSubmissions.availabilityHoursPerMonth,
          softSkillsExpert: mentorFormSubmissions.softSkillsExpert,
          industrySkillsExpert: mentorFormSubmissions.industrySkillsExpert,
          bio: mentorFormSubmissions.bio,
          reviewNotes: mentorFormSubmissions.reviewNotes,
          maxMentees: mentorFormSubmissions.maxMentees,
        })
        .from(mentorFormSubmissions)
        .where(
          and(
            isNull(mentorFormSubmissions.userId),
            or(
              eq(mentorFormSubmissions.status, 'submitted'),
              eq(mentorFormSubmissions.status, 'in_progress')
            )
          )
        )
        .orderBy(desc(mentorFormSubmissions.submittedAt));

      // Get mentor metrics for verified mentors
      const mentorMetrics = await db
        .select({
          mentorId: mentorProfiles.id,
          activeMentees: sql<number>`COUNT(DISTINCT CASE WHEN ${mentorshipRelationships.status} = 'active' THEN ${mentorshipRelationships.id} END)`,
          totalMentees: sql<number>`COUNT(DISTINCT ${mentorshipRelationships.id})`,
          totalSessions: sql<number>`COALESCE((
            SELECT COUNT(*) FROM ${meetings} m
            JOIN ${mentorshipRelationships} mr ON m.relationship_id = mr.id
            WHERE mr.mentor_user_id = ${mentorProfiles.userId}
            AND m.status = 'completed'
          ), 0)`,
          avgRating: sql<number | null>`(
            SELECT AVG(m.rating)
            FROM ${meetings} m
            JOIN ${mentorshipRelationships} mr ON m.relationship_id = mr.id
            WHERE mr.mentor_user_id = ${mentorProfiles.userId}
            AND m.rating IS NOT NULL
          )`,
        })
        .from(mentorProfiles)
        .leftJoin(mentorshipRelationships, eq(mentorProfiles.userId, mentorshipRelationships.mentorUserId))
        .where(isNotNull(mentorProfiles.verifiedAt))
        .groupBy(mentorProfiles.id, mentorProfiles.userId);

      // Create a map for quick lookup
      const metricsMap = new Map(mentorMetrics.map(m => [m.mentorId, m]));

      // Define the type for unified records
      type UnifiedRecord = {
        id: number;
        recordType: 'registered_user' | 'public_application';
        recordId: string;
        userId: number | null;
        applicationId: number | null;
        name: string | null;
        email: string;
        image: string | null;
        phone: string | null;
        isTestUser: boolean;
        roles: string[];
        membershipTier: 'free' | 'basic' | 'premium';
        accountStatus: 'active' | 'inactive' | 'suspended' | 'pending_registration';
        createdAt: string;
        lastLoginAt: string | null;
        company: string | null;
        jobTitle: string | null;
        city: string | null;
        mbtiType: string | null;
        applicationStatus: 'none' | 'pending' | 'approved' | 'rejected';
        applicationInfo: any;
        mentorInfo: {
          isVerified: boolean;
          verifiedAt: string | null;
          isAccepting: boolean | null;
          maxMentees: number;
          currentMentees: number;
          yearsExperience: number | null;
          expertise: string[];
          bio: string | null;
          linkedinUrl: string | null;
          activeMentees: number;
          totalMentees: number;
          totalSessions: number;
          avgRating: number | null;
          status: string;
        } | null;
        menteeInfo: {
          careerStage: string | null;
          currentIndustry: string | null;
          learningGoals: string[];
          bio: string | null;
        } | null;
      };

      // Transform registered users
      let allRecords: UnifiedRecord[] = usersData.map(user => {
        // Determine status based on lastLoginAt
        let accountStatus: 'active' | 'inactive' | 'suspended' | 'pending_registration';
        if (user.lastLoginAt && new Date(user.lastLoginAt) >= thirtyDaysAgo) {
          accountStatus = 'active';
        } else {
          accountStatus = 'inactive';
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

        // Determine application status and info
        let applicationStatus: 'none' | 'pending' | 'approved' | 'rejected' = 'none';
        let applicationInfo: any = null;

        if (user.mentorFormStatus === 'submitted' || user.mentorFormStatus === 'in_progress') {
          applicationStatus = 'pending';
          const expertise = [
            ...((user.mentorFormSoftSkillsExpert as string[]) || []),
            ...((user.mentorFormIndustrySkillsExpert as string[]) || []),
          ];
          applicationInfo = {
            id: user.mentorFormId,
            type: 'mentor',
            status: user.mentorFormStatus === 'submitted' ? 'pending' : 'under_review',
            submittedAt: user.mentorFormSubmittedAt?.toISOString() || null,
            yearsExperience: user.mentorFormYearsExp,
            expertise,
            availabilityHoursPerMonth: user.mentorFormAvailability,
            bio: user.mentorFormBio,
            linkedinUrl: user.mentorFormLinkedinUrl,
            reviewNotes: user.mentorFormReviewNotes,
          };
        } else if (user.menteeFormStatus === 'submitted' || user.menteeFormStatus === 'in_progress') {
          applicationStatus = 'pending';
          applicationInfo = {
            id: user.menteeFormId,
            type: 'mentee',
            status: user.menteeFormStatus === 'submitted' ? 'pending' : 'under_review',
            submittedAt: user.menteeFormSubmittedAt?.toISOString() || null,
          };
        } else if (user.mentorFormStatus === 'approved' || user.menteeFormStatus === 'approved') {
          applicationStatus = 'approved';
        } else if (user.mentorFormStatus === 'rejected' || user.menteeFormStatus === 'rejected') {
          applicationStatus = 'rejected';
        }

        // Get mentor metrics if applicable
        const metrics = user.mentorProfileId ? metricsMap.get(user.mentorProfileId) : null;

        return {
          id: user.id,
          recordType: 'registered_user' as const,
          recordId: `user_${user.id}`,
          userId: user.id,
          applicationId: user.mentorFormId || user.menteeFormId || null,
          name: displayName,
          email: user.email,
          image: displayImage,
          phone: user.phone,
          isTestUser: user.isTestUser,
          roles: user.roles || [],
          membershipTier: user.membershipTier as 'free' | 'basic' | 'premium',
          accountStatus,
          createdAt: user.createdAt.toISOString(),
          lastLoginAt: user.lastLoginAt?.toISOString() || null,
          // Extended profile info
          company,
          jobTitle,
          city,
          mbtiType,
          applicationStatus,
          applicationInfo,
          // Mentor specific with metrics
          mentorInfo: user.mentorProfileId ? {
            isVerified: !!user.mentorVerifiedAt,
            verifiedAt: user.mentorVerifiedAt?.toISOString() || null,
            isAccepting: user.mentorIsAccepting,
            maxMentees: user.mentorMaxMentees || 3,
            currentMentees: user.mentorCurrentMentees || 0,
            yearsExperience: user.mentorYearsExp || user.mentorFormYearsExp,
            expertise: (user.mentorExpertise as string[]) || [],
            bio: user.mentorBio || user.mentorFormBio,
            linkedinUrl: user.mentorLinkedinUrl || user.mentorFormLinkedinUrl,
            // Metrics
            activeMentees: metrics?.activeMentees || 0,
            totalMentees: metrics?.totalMentees || 0,
            totalSessions: metrics?.totalSessions || 0,
            avgRating: metrics?.avgRating || null,
            status: !user.mentorIsAccepting ? 'paused' :
                   (user.mentorCurrentMentees || 0) >= (user.mentorMaxMentees || 3) ? 'busy' : 'active',
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

      // Fetch public mentee applications (userId is NULL) - only pending/submitted ones
      const publicMenteeApplications = await db
        .select({
          id: menteeFormSubmissions.id,
          email: menteeFormSubmissions.email,
          fullName: menteeFormSubmissions.fullName,
          photoUrl: menteeFormSubmissions.photoUrl,
          phone: menteeFormSubmissions.phone,
          city: menteeFormSubmissions.city,
          mbtiType: menteeFormSubmissions.mbtiType,
          status: menteeFormSubmissions.status,
          submittedAt: menteeFormSubmissions.submittedAt,
          createdAt: menteeFormSubmissions.createdAt,
          currentJobTitle: menteeFormSubmissions.currentJobTitle,
          currentIndustry: menteeFormSubmissions.currentIndustry,
          currentStage: menteeFormSubmissions.currentStage,
          bio: menteeFormSubmissions.bio,
          reviewNotes: menteeFormSubmissions.reviewNotes,
        })
        .from(menteeFormSubmissions)
        .where(
          and(
            isNull(menteeFormSubmissions.userId),
            or(
              eq(menteeFormSubmissions.status, 'submitted'),
              eq(menteeFormSubmissions.status, 'in_progress')
            )
          )
        )
        .orderBy(desc(menteeFormSubmissions.submittedAt));

      // Transform public mentor applications
      const publicRecords = publicApplications
        .filter(app => {
          if (!searchQuery) return true;
          const searchLower = searchQuery.toLowerCase();
          return (
            (app.fullName?.toLowerCase().includes(searchLower)) ||
            (app.email?.toLowerCase().includes(searchLower))
          );
        })
        .map(app => {
          const expertise = [
            ...((app.softSkillsExpert as string[]) || []),
            ...((app.industrySkillsExpert as string[]) || []),
          ];

          return {
            id: app.id,
            recordType: 'public_application' as const,
            recordId: `app_mentor_${app.id}`,
            userId: null,
            applicationId: app.id,
            name: app.fullName,
            email: app.email || '',
            image: app.photoUrl,
            phone: app.phone,
            isTestUser: false,
            roles: [] as string[],
            membershipTier: 'free' as const,
            accountStatus: 'pending_registration' as const,
            createdAt: app.createdAt.toISOString(),
            lastLoginAt: null,
            company: app.company,
            jobTitle: app.jobTitle,
            city: app.city,
            mbtiType: app.mbtiType,
            applicationStatus: 'pending' as const,
            applicationInfo: {
              id: app.id,
              type: 'mentor',
              status: app.status === 'submitted' ? 'pending' : 'under_review',
              submittedAt: app.submittedAt?.toISOString() || app.createdAt.toISOString(),
              yearsExperience: app.yearsExperience,
              expertise,
              availabilityHoursPerMonth: app.availabilityHoursPerMonth,
              bio: app.bio,
              linkedinUrl: app.linkedinUrl,
              reviewNotes: app.reviewNotes,
              maxMentees: app.maxMentees,
            },
            mentorInfo: null,
            menteeInfo: null,
          };
        });

      // Transform public mentee applications
      const publicMenteeRecords = publicMenteeApplications
        .filter(app => {
          if (!searchQuery) return true;
          const searchLower = searchQuery.toLowerCase();
          return (
            (app.fullName?.toLowerCase().includes(searchLower)) ||
            (app.email?.toLowerCase().includes(searchLower))
          );
        })
        .map(app => ({
          id: app.id,
          recordType: 'public_application' as const,
          recordId: `app_mentee_${app.id}`,
          userId: null,
          applicationId: app.id,
          name: app.fullName,
          email: app.email || '',
          image: app.photoUrl,
          phone: app.phone,
          isTestUser: false,
          roles: [] as string[],
          membershipTier: 'free' as const,
          accountStatus: 'pending_registration' as const,
          createdAt: app.createdAt.toISOString(),
          lastLoginAt: null,
          company: null,
          jobTitle: app.currentJobTitle,
          city: app.city,
          mbtiType: app.mbtiType,
          applicationStatus: 'pending' as const,
          applicationInfo: {
            id: app.id,
            type: 'mentee',
            status: app.status === 'submitted' ? 'pending' : 'under_review',
            submittedAt: app.submittedAt?.toISOString() || app.createdAt.toISOString(),
            bio: app.bio,
            reviewNotes: app.reviewNotes,
          },
          mentorInfo: null,
          menteeInfo: null,
        }));

      // Combine all records
      allRecords = [...allRecords, ...publicRecords, ...publicMenteeRecords];

      // Apply filters
      if (roleFilter && roleFilter !== 'all') {
        if (roleFilter === 'no_role') {
          allRecords = allRecords.filter(record =>
            record.roles.length === 0 && record.recordType === 'registered_user'
          );
        } else {
          allRecords = allRecords.filter(record => record.roles.includes(roleFilter));
        }
      }

      if (statusFilter && statusFilter !== 'all') {
        if (statusFilter === 'pending_registration') {
          allRecords = allRecords.filter(record => record.accountStatus === 'pending_registration');
        } else {
          allRecords = allRecords.filter(record => record.accountStatus === statusFilter);
        }
      }

      if (membershipFilter && membershipFilter !== 'all') {
        allRecords = allRecords.filter(record => record.membershipTier === membershipFilter);
      }

      if (applicationFilter && applicationFilter !== 'all') {
        if (applicationFilter === 'has_pending') {
          allRecords = allRecords.filter(record => record.applicationStatus === 'pending');
        } else if (applicationFilter === 'no_application') {
          allRecords = allRecords.filter(record => record.applicationStatus === 'none');
        }
      }

      // Calculate stats
      const stats = {
        totalUsers: usersData.length,
        testUsers: usersData.filter(u => u.isTestUser).length,
        totalPublicApplications: publicApplications.length + publicMenteeApplications.length,
        pendingApplications: allRecords.filter(r => r.applicationStatus === 'pending').length,
        byRole: {
          admin: allRecords.filter(r => r.roles.includes('admin')).length,
          mentor: allRecords.filter(r => r.roles.includes('mentor')).length,
          mentee: allRecords.filter(r => r.roles.includes('mentee')).length,
        },
        byStatus: {
          active: allRecords.filter(r => r.accountStatus === 'active').length,
          inactive: allRecords.filter(r => r.accountStatus === 'inactive').length,
          suspended: allRecords.filter(r => r.accountStatus === 'suspended').length,
          pending_registration: allRecords.filter(r => r.accountStatus === 'pending_registration').length,
        },
      };

      // Pagination
      const total = allRecords.length;
      const paginatedRecords = allRecords.slice(offset, offset + limit);

      return NextResponse.json({
        users: paginatedRecords,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        stats,
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
