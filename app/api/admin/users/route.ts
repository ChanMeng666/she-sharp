import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/auth/role-middleware';
import { db } from '@/lib/db/drizzle';
import { users, userRoles, userMemberships } from '@/lib/db/schema';
import { sql, eq, and, or, like, desc, asc } from 'drizzle-orm';

// Admin-only user management endpoint
export const GET = withRoles(
  {
    requiredRoles: ['admin'],
    requiredAdminPermissions: ['canEditUsers']
  },
  async (req: NextRequest, context: any) => {
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

      // Fetch users with their roles and membership
      const usersData = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          image: users.image,
          createdAt: users.createdAt,
          lastLoginAt: users.lastLoginAt,
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

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          roles: user.roles || [],
          membershipTier: user.membershipTier as 'free' | 'basic' | 'premium',
          status,
          createdAt: user.createdAt.toISOString(),
          lastLoginAt: user.lastLoginAt?.toISOString() || null,
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
