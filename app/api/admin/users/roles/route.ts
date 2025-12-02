import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/auth/role-middleware';
import { db } from '@/lib/db/drizzle';
import { users, userRoles, adminPermissions } from '@/lib/db/schema';
import { eq, sql, desc, isNull, and } from 'drizzle-orm';

// Admin-only user roles endpoint
export const GET = withRoles(
  {
    requiredRoles: ['admin'],
    requiredAdminPermissions: ['canEditUsers']
  },
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const limit = parseInt(searchParams.get('limit') || '50');
      const offset = parseInt(searchParams.get('offset') || '0');

      // Fetch users with their roles
      const usersWithRoles = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          image: users.image,
          createdAt: users.createdAt,
          deletedAt: users.deletedAt,
        })
        .from(users)
        .where(isNull(users.deletedAt))
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset);

      // Fetch roles for these users
      const userIds = usersWithRoles.map(u => u.id);
      const roles = userIds.length > 0
        ? await db
            .select({
              userId: userRoles.userId,
              roleType: userRoles.roleType,
              isActive: userRoles.isActive,
              activatedAt: userRoles.activatedAt,
            })
            .from(userRoles)
            .where(sql`${userRoles.userId} IN (${sql.join(userIds.map(id => sql`${id}`), sql`, `)})`)
        : [];

      // Fetch admin permissions
      const permissions = userIds.length > 0
        ? await db
            .select({
              userId: adminPermissions.userId,
              canViewAllData: adminPermissions.canViewAllData,
              canEditUsers: adminPermissions.canEditUsers,
              canManageContent: adminPermissions.canManageContent,
              canManageEvents: adminPermissions.canManageEvents,
              canManageRelationships: adminPermissions.canManageRelationships,
              canAccessAnalytics: adminPermissions.canAccessAnalytics,
              canVerifyMentors: adminPermissions.canVerifyMentors,
            })
            .from(adminPermissions)
            .where(sql`${adminPermissions.userId} IN (${sql.join(userIds.map(id => sql`${id}`), sql`, `)})`)
        : [];

      // Combine data
      const usersData = usersWithRoles.map(user => {
        const userRolesList = roles.filter(r => r.userId === user.id);
        const userPermissions = permissions.find(p => p.userId === user.id);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          createdAt: user.createdAt,
          roles: userRolesList.map(r => ({
            type: r.roleType,
            isActive: r.isActive,
            activatedAt: r.activatedAt,
          })),
          permissions: userPermissions || null,
        };
      });

      // Get role statistics
      const roleStats = await db
        .select({
          roleType: userRoles.roleType,
          count: sql<number>`count(*)::int`,
          activeCount: sql<number>`count(*) filter (where ${userRoles.isActive} = true)::int`,
        })
        .from(userRoles)
        .groupBy(userRoles.roleType);

      // Get total user count
      const [{ count: totalUsers }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(isNull(users.deletedAt));

      return NextResponse.json({
        users: usersData,
        roleStats: roleStats.reduce((acc, stat) => {
          acc[stat.roleType] = { total: stat.count, active: stat.activeCount };
          return acc;
        }, {} as Record<string, { total: number; active: number }>),
        pagination: {
          total: totalUsers,
          limit,
          offset,
          hasMore: offset + limit < totalUsers
        }
      });
    } catch (error) {
      console.error('Error fetching user roles:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user roles' },
        { status: 500 }
      );
    }
  }
);

// Update user role
export const PUT = withRoles(
  {
    requiredRoles: ['admin'],
    requiredAdminPermissions: ['canEditUsers']
  },
  async (req: NextRequest) => {
    try {
      const body = await req.json();
      const { userId, roleType, isActive } = body;

      if (!userId || !roleType) {
        return NextResponse.json(
          { error: 'userId and roleType are required' },
          { status: 400 }
        );
      }

      // Check if role exists
      const existingRole = await db
        .select()
        .from(userRoles)
        .where(and(
          eq(userRoles.userId, userId),
          eq(userRoles.roleType, roleType)
        ))
        .limit(1);

      if (existingRole.length === 0) {
        // Create new role - activatedAt defaults to now()
        await db.insert(userRoles).values({
          userId,
          roleType,
          isActive: isActive ?? true,
        });
      } else {
        // Update existing role
        await db
          .update(userRoles)
          .set({
            isActive,
            activatedAt: isActive ? new Date() : existingRole[0].activatedAt,
          })
          .where(and(
            eq(userRoles.userId, userId),
            eq(userRoles.roleType, roleType)
          ));
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error updating user role:', error);
      return NextResponse.json(
        { error: 'Failed to update user role' },
        { status: 500 }
      );
    }
  }
);
