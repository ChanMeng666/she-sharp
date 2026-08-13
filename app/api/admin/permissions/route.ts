import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { adminPermissions, users, activityLogs, ActivityType } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { withRoles, type AuthedContext } from '@/lib/auth/role-middleware';

// NOTE: these handlers gate on the `admin_permissions.canEditUsers` column read
// directly, where a MISSING row denies access. `withRoles`'
// `requiredAdminPermissions` treats a missing row as "all defaults granted", so
// it cannot express this check — `withRoles` supplies the signed-in user only
// and the permission test stays in the handler.
export const GET = withRoles({}, async (_request: NextRequest, { user }: AuthedContext) => {
  try {
    // Check if user is admin
    const [currentUserAdmin] = await db
      .select()
      .from(adminPermissions)
      .where(eq(adminPermissions.userId, user.id))
      .limit(1);

    if (!currentUserAdmin || !currentUserAdmin.canEditUsers) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get all admin permissions with user info
    const admins = await db
      .select({
        id: adminPermissions.id,
        userId: adminPermissions.userId,
        userName: users.name,
        userEmail: users.email,
        userImage: users.image,
        canViewAllData: adminPermissions.canViewAllData,
        canEditUsers: adminPermissions.canEditUsers,
        canManageRelationships: adminPermissions.canManageRelationships,
        canAccessAnalytics: adminPermissions.canAccessAnalytics,
        canManageContent: adminPermissions.canManageContent,
        canVerifyMentors: adminPermissions.canVerifyMentors,
        canManageEvents: adminPermissions.canManageEvents,
        grantedBy: adminPermissions.grantedBy,
        grantedAt: adminPermissions.grantedAt,
      })
      .from(adminPermissions)
      .leftJoin(users, eq(adminPermissions.userId, users.id))
      .orderBy(desc(adminPermissions.grantedAt));

    // Get granter info for each admin
    const enrichedAdmins = await Promise.all(
      admins.map(async (admin) => {
        if (admin.grantedBy) {
          const [granter] = await db
            .select({
              name: users.name,
              email: users.email,
            })
            .from(users)
            .where(eq(users.id, admin.grantedBy))
            .limit(1);

          return {
            ...admin,
            grantedByName: granter?.name,
            grantedByEmail: granter?.email,
          };
        }
        return admin;
      })
    );

    return NextResponse.json({ admins: enrichedAdmins });
  } catch (error) {
    console.error('Error fetching admin permissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin permissions' },
      { status: 500 }
    );
  }
});

export const POST = withRoles({}, async (request: NextRequest, { user }: AuthedContext) => {
  try {
    // Check if user can grant admin permissions
    const [currentUserAdmin] = await db
      .select()
      .from(adminPermissions)
      .where(eq(adminPermissions.userId, user.id))
      .limit(1);

    if (!currentUserAdmin || !currentUserAdmin.canEditUsers) {
      return NextResponse.json(
        { error: 'You do not have permission to grant admin access' },
        { status: 403 }
      );
    }

    const data = await request.json();
    const { userEmail, permissions } = data;

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, userEmail))
      .limit(1);

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user already has admin permissions
    const [existingAdmin] = await db
      .select()
      .from(adminPermissions)
      .where(eq(adminPermissions.userId, targetUser.id))
      .limit(1);

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'User already has admin permissions' },
        { status: 400 }
      );
    }

    // Grant admin permissions
    const [newAdmin] = await db
      .insert(adminPermissions)
      .values({
        userId: targetUser.id,
        canViewAllData: permissions?.canViewAllData ?? true,
        canEditUsers: permissions?.canEditUsers ?? false,
        canManageRelationships: permissions?.canManageRelationships ?? true,
        canAccessAnalytics: permissions?.canAccessAnalytics ?? true,
        canManageContent: permissions?.canManageContent ?? true,
        canVerifyMentors: permissions?.canVerifyMentors ?? true,
        canManageEvents: permissions?.canManageEvents ?? true,
        grantedBy: user.id,
      })
      .returning();

    // Log activity
    await db.insert(activityLogs).values({
      userId: user.id,
      action: 'GRANT_ADMIN' as any, // This action type might need to be added
      entityType: 'user',
      entityId: targetUser.id,
      metadata: { permissions, userEmail },
    });

    return NextResponse.json({
      message: 'Admin permissions granted successfully',
      admin: newAdmin,
    });
  } catch (error) {
    console.error('Error granting admin permissions:', error);
    return NextResponse.json(
      { error: 'Failed to grant admin permissions' },
      { status: 500 }
    );
  }
});

export const PUT = withRoles({}, async (request: NextRequest, { user }: AuthedContext) => {
  try {
    // Check if user can edit admin permissions
    const [currentUserAdmin] = await db
      .select()
      .from(adminPermissions)
      .where(eq(adminPermissions.userId, user.id))
      .limit(1);

    if (!currentUserAdmin || !currentUserAdmin.canEditUsers) {
      return NextResponse.json(
        { error: 'You do not have permission to modify admin access' },
        { status: 403 }
      );
    }

    const data = await request.json();
    const { userId, permissions } = data;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Prevent self-modification
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'You cannot modify your own permissions' },
        { status: 400 }
      );
    }

    // Update permissions
    const [updated] = await db
      .update(adminPermissions)
      .set({
        canViewAllData: permissions.canViewAllData,
        canEditUsers: permissions.canEditUsers,
        canManageRelationships: permissions.canManageRelationships,
        canAccessAnalytics: permissions.canAccessAnalytics,
        canManageContent: permissions.canManageContent,
        canVerifyMentors: permissions.canVerifyMentors,
        canManageEvents: permissions.canManageEvents,
      })
      .where(eq(adminPermissions.userId, userId))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: 'Admin permissions not found' },
        { status: 404 }
      );
    }

    // Log activity
    await db.insert(activityLogs).values({
      userId: user.id,
      action: 'UPDATE_ADMIN' as any,
      entityType: 'user',
      entityId: userId,
      metadata: { permissions },
    });

    return NextResponse.json({
      message: 'Admin permissions updated successfully',
      admin: updated,
    });
  } catch (error) {
    console.error('Error updating admin permissions:', error);
    return NextResponse.json(
      { error: 'Failed to update admin permissions' },
      { status: 500 }
    );
  }
});

export const DELETE = withRoles({}, async (request: NextRequest, { user }: AuthedContext) => {
  try {
    // Check if user can revoke admin permissions
    const [currentUserAdmin] = await db
      .select()
      .from(adminPermissions)
      .where(eq(adminPermissions.userId, user.id))
      .limit(1);

    if (!currentUserAdmin || !currentUserAdmin.canEditUsers) {
      return NextResponse.json(
        { error: 'You do not have permission to revoke admin access' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Prevent self-revocation
    if (parseInt(userId) === user.id) {
      return NextResponse.json(
        { error: 'You cannot revoke your own permissions' },
        { status: 400 }
      );
    }

    // Check if there will be at least one admin with canEditUsers left
    const adminsWithEditPermission = await db
      .select()
      .from(adminPermissions)
      .where(
        and(
          eq(adminPermissions.canEditUsers, true),
          eq(adminPermissions.userId, parseInt(userId))
        )
      );

    if (adminsWithEditPermission.length === 1) {
      // This is the last admin with edit permissions
      const allAdminsWithEdit = await db
        .select()
        .from(adminPermissions)
        .where(eq(adminPermissions.canEditUsers, true));

      if (allAdminsWithEdit.length === 1) {
        return NextResponse.json(
          { error: 'Cannot revoke permissions. At least one admin with user edit permissions must remain.' },
          { status: 400 }
        );
      }
    }

    // Revoke admin permissions
    await db
      .delete(adminPermissions)
      .where(eq(adminPermissions.userId, parseInt(userId)));

    // Log activity
    await db.insert(activityLogs).values({
      userId: user.id,
      action: 'REVOKE_ADMIN' as any,
      entityType: 'user',
      entityId: parseInt(userId),
    });

    return NextResponse.json({
      message: 'Admin permissions revoked successfully',
    });
  } catch (error) {
    console.error('Error revoking admin permissions:', error);
    return NextResponse.json(
      { error: 'Failed to revoke admin permissions' },
      { status: 500 }
    );
  }
});