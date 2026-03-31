import { redirect } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { User, userRoles } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

export async function isUserAdmin(userId: number): Promise<boolean> {
  const adminRole = await db
    .select()
    .from(userRoles)
    .where(
      and(
        eq(userRoles.userId, userId),
        eq(userRoles.roleType, 'admin'),
        eq(userRoles.isActive, true)
      )
    )
    .limit(1);

  return adminRole.length > 0;
}

export async function getUserRoles(userId: number): Promise<string[]> {
  const roles = await db
    .select({
      roleType: userRoles.roleType,
    })
    .from(userRoles)
    .where(
      and(
        eq(userRoles.userId, userId),
        eq(userRoles.isActive, true)
      )
    );

  return roles.map(r => r.roleType);
}

export async function getUserRole(userId: number, roleType: 'admin' | 'mentor' | 'mentee'): Promise<boolean> {
  const role = await db
    .select()
    .from(userRoles)
    .where(
      and(
        eq(userRoles.userId, userId),
        eq(userRoles.roleType, roleType),
        eq(userRoles.isActive, true)
      )
    )
    .limit(1);

  return role.length > 0;
}

/**
 * Ensures OAuth users have completed invitation code verification.
 * Credential users (with passwordHash) pass through — they verified during signup.
 * Call this in dashboard layouts/pages after getUser().
 */
export function ensureUserVerified(user: User): void {
  if (user.passwordHash) return;
  if (user.inviteCodeVerifiedAt) return;
  redirect('/verify-invitation');
}