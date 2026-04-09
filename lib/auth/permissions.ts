import { redirect } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { User, users, userRoles } from '@/lib/db/schema';
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
 * Defense-in-depth: users with active roles (assigned by admin) also pass through,
 * and their inviteCodeVerifiedAt is auto-backfilled for future fast checks.
 * Call this in dashboard layouts/pages after getUser().
 */
export async function ensureUserVerified(user: User): Promise<void> {
  if (user.passwordHash) return;
  if (user.inviteCodeVerifiedAt) return;

  // Fallback: allow users with active roles (e.g., assigned by admin)
  const activeRoles = await db
    .select({ id: userRoles.id })
    .from(userRoles)
    .where(and(eq(userRoles.userId, user.id), eq(userRoles.isActive, true)))
    .limit(1);

  if (activeRoles.length > 0) {
    // Auto-backfill so future checks skip the DB query
    await db.update(users)
      .set({ inviteCodeVerifiedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, user.id));
    return;
  }

  redirect('/verify-invitation');
}