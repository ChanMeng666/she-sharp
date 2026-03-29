import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/auth/role-middleware';
import { db } from '@/lib/db/drizzle';
import { users, userRoles, activityLogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/admin/users/[id]
 * Get detailed user information
 */
export const GET = withRoles(
  {
    requiredRoles: ['admin'],
    requiredAdminPermissions: ['canViewAllData']
  },
  async (req: NextRequest, context: any) => {
    try {
      const params = await context.params;
      const userId = parseInt(params.id);

      if (isNaN(userId)) {
        return NextResponse.json(
          { error: 'Invalid user ID' },
          { status: 400 }
        );
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Get user roles
      const roles = await db
        .select()
        .from(userRoles)
        .where(eq(userRoles.userId, userId));

      return NextResponse.json({
        user: {
          ...user,
          roles: roles.map(r => ({
            type: r.roleType,
            isActive: r.isActive,
            activatedAt: r.activatedAt,
            verifiedAt: r.verifiedAt,
          })),
        },
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user' },
        { status: 500 }
      );
    }
  }
);

/**
 * PATCH /api/admin/users/[id]
 * Update user (suspend, unsuspend, update details)
 */
export const PATCH = withRoles(
  {
    requiredRoles: ['admin'],
    requiredAdminPermissions: ['canEditUsers']
  },
  async (req: NextRequest, context: any) => {
    try {
      const params = await context.params;
      const userId = parseInt(params.id);
      const adminUserId = context.user?.id;

      if (isNaN(userId)) {
        return NextResponse.json(
          { error: 'Invalid user ID' },
          { status: 400 }
        );
      }

      const body = await req.json();
      const { action, ...updateData } = body;

      // Check if user exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!existingUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Handle specific actions
      if (action === 'suspend') {
        await db
          .update(users)
          .set({
            deletedAt: new Date(), // Using deletedAt as suspension indicator
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));

        // Log activity
        await db.insert(activityLogs).values({
          userId: adminUserId,
          action: 'user_suspended',
          entityType: 'user',
          entityId: userId,
          metadata: { reason: body.reason || 'Admin action' },
        });

        return NextResponse.json({
          success: true,
          message: 'User suspended successfully',
        });
      }

      if (action === 'unsuspend') {
        await db
          .update(users)
          .set({
            deletedAt: null,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));

        // Log activity
        await db.insert(activityLogs).values({
          userId: adminUserId,
          action: 'user_unsuspended',
          entityType: 'user',
          entityId: userId,
          metadata: {},
        });

        return NextResponse.json({
          success: true,
          message: 'User unsuspended successfully',
        });
      }

      if (action === 'toggle_test_user') {
        const newValue = !existingUser.isTestUser;
        await db
          .update(users)
          .set({
            isTestUser: newValue,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));

        await db.insert(activityLogs).values({
          userId: adminUserId,
          action: newValue ? 'user_marked_test' : 'user_unmarked_test',
          entityType: 'user',
          entityId: userId,
          metadata: { isTestUser: newValue },
        });

        return NextResponse.json({
          success: true,
          message: newValue ? 'User marked as test user' : 'User unmarked as test user',
          isTestUser: newValue,
        });
      }

      // General update (for editing user details)
      const allowedFields = ['name', 'phone'];
      const filteredUpdate: Record<string, any> = {};

      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          filteredUpdate[field] = updateData[field];
        }
      }

      if (Object.keys(filteredUpdate).length > 0) {
        filteredUpdate.updatedAt = new Date();
        await db
          .update(users)
          .set(filteredUpdate)
          .where(eq(users.id, userId));
      }

      return NextResponse.json({
        success: true,
        message: 'User updated successfully',
      });
    } catch (error) {
      console.error('Error updating user:', error);
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }
  }
);

/**
 * DELETE /api/admin/users/[id]
 * Soft delete a user
 */
export const DELETE = withRoles(
  {
    requiredRoles: ['admin'],
    requiredAdminPermissions: ['canEditUsers']
  },
  async (req: NextRequest, context: any) => {
    try {
      const params = await context.params;
      const userId = parseInt(params.id);
      const adminUserId = context.user?.id;

      if (isNaN(userId)) {
        return NextResponse.json(
          { error: 'Invalid user ID' },
          { status: 400 }
        );
      }

      // Prevent self-deletion
      if (userId === adminUserId) {
        return NextResponse.json(
          { error: 'Cannot delete your own account' },
          { status: 400 }
        );
      }

      // Check if user exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!existingUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Soft delete by setting deletedAt
      await db
        .update(users)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      // Deactivate all roles
      await db
        .update(userRoles)
        .set({ isActive: false })
        .where(eq(userRoles.userId, userId));

      // Log activity
      await db.insert(activityLogs).values({
        userId: adminUserId,
        action: 'user_deleted',
        entityType: 'user',
        entityId: userId,
        metadata: { deletedUserEmail: existingUser.email },
      });

      return NextResponse.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 500 }
      );
    }
  }
);
