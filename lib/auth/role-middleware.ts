import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { userRoles, adminPermissions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export type UserRole = 'mentor' | 'mentee' | 'admin';
export type AdminPermission = 
  | 'canViewAllData'
  | 'canEditUsers' 
  | 'canManageRelationships'
  | 'canAccessAnalytics'
  | 'canManageContent'
  | 'canVerifyMentors'
  | 'canManageEvents';

interface RoleCheckOptions {
  requiredRoles?: UserRole[];
  requiredAdminPermissions?: AdminPermission[];
  requireAny?: boolean; // If true, user needs only one of the required roles/permissions
}

/**
 * Check if the current user has the required roles
 */
export async function checkUserRoles(
  userId: number,
  requiredRoles: UserRole[]
): Promise<boolean> {
  if (requiredRoles.length === 0) return true;

  const roles = await db
    .select()
    .from(userRoles)
    .where(
      and(
        eq(userRoles.userId, userId),
        eq(userRoles.isActive, true)
      )
    );

  const activeRoles = roles.map(r => r.roleType);
  return requiredRoles.every(role => activeRoles.includes(role));
}

/**
 * Check if the current user has the required admin permissions
 */
export async function checkAdminPermissions(
  userId: number,
  requiredPermissions: AdminPermission[]
): Promise<boolean> {
  if (requiredPermissions.length === 0) return true;

  const [perms] = await db
    .select()
    .from(adminPermissions)
    .where(eq(adminPermissions.userId, userId))
    .limit(1);

  if (!perms) {
    // No explicit permission row means the admin has all default permissions.
    // The admin_permissions schema defaults every column to true, so a missing
    // row is equivalent to "all permissions granted".
    return true;
  }

  return requiredPermissions.every(permission =>
    perms[permission as keyof typeof perms] === true
  );
}

/**
 * Higher-order function to create role-protected API route handlers
 */
export function withRoles(
  options: RoleCheckOptions,
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      // Get the current user
      const user = await getUser();
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // Check roles if specified
      if (options.requiredRoles && options.requiredRoles.length > 0) {
        const hasRoles = options.requireAny
          ? await checkUserHasAnyRole(user.id, options.requiredRoles)
          : await checkUserRoles(user.id, options.requiredRoles);

        if (!hasRoles) {
          return NextResponse.json(
            { error: 'Insufficient role permissions' },
            { status: 403 }
          );
        }
      }

      // Check admin permissions if specified
      if (options.requiredAdminPermissions && options.requiredAdminPermissions.length > 0) {
        const hasPermissions = options.requireAny
          ? await checkUserHasAnyAdminPermission(user.id, options.requiredAdminPermissions)
          : await checkAdminPermissions(user.id, options.requiredAdminPermissions);

        if (!hasPermissions) {
          return NextResponse.json(
            { error: 'Insufficient admin permissions' },
            { status: 403 }
          );
        }
      }

      // Call the actual handler with the user context
      return handler(req, { ...context, user });
    } catch (error) {
      console.error('Role middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Check if user has any of the specified roles
 */
async function checkUserHasAnyRole(
  userId: number,
  requiredRoles: UserRole[]
): Promise<boolean> {
  const roles = await db
    .select()
    .from(userRoles)
    .where(
      and(
        eq(userRoles.userId, userId),
        eq(userRoles.isActive, true)
      )
    );

  const activeRoles = roles.map(r => r.roleType);
  return requiredRoles.some(role => activeRoles.includes(role));
}

/**
 * Check if user has any of the specified admin permissions
 */
async function checkUserHasAnyAdminPermission(
  userId: number,
  requiredPermissions: AdminPermission[]
): Promise<boolean> {
  const [perms] = await db
    .select()
    .from(adminPermissions)
    .where(eq(adminPermissions.userId, userId))
    .limit(1);

  if (!perms) {
    // No explicit permission row — treat as all defaults granted (all true).
    return true;
  }

  return requiredPermissions.some(permission =>
    perms[permission as keyof typeof perms] === true
  );
}

/**
 * Utility function to get user's active roles
 */
export async function getUserRoles(userId: number): Promise<UserRole[]> {
  const roles = await db
    .select()
    .from(userRoles)
    .where(
      and(
        eq(userRoles.userId, userId),
        eq(userRoles.isActive, true)
      )
    );

  return roles.map(r => r.roleType as UserRole);
}

/**
 * Utility function to check if user is a mentor
 */
export async function isMentor(userId: number): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roles.includes('mentor');
}

/**
 * Utility function to check if user is a mentee
 */
export async function isMentee(userId: number): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roles.includes('mentee');
}

/**
 * Utility function to check if user is an admin
 */
export async function isAdmin(userId: number): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roles.includes('admin');
}