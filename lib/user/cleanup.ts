import { db } from '@/lib/db/drizzle';
import {
  users,
  userRoles,
  activityLogs,
  invitationCodes,
} from '@/lib/db/schema';
import { eq, and, isNull, lt, sql } from 'drizzle-orm';

interface ZombieUser {
  id: number;
  email: string;
  name: string | null;
  createdAt: Date;
}

interface CleanupResult {
  zombieUsers: ZombieUser[];
  deletedCount: number;
  dryRun: boolean;
}

/**
 * Finds and optionally deletes zombie OAuth users.
 *
 * Zombie users are those who completed OAuth sign-in but never verified
 * an invitation code and have no roles assigned.
 *
 * PROTECTION: Users with an active invitation code generated for their
 * email are excluded — they may still complete registration.
 */
export async function cleanupZombieUsers(dryRun = true): Promise<CleanupResult> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Find zombie users: no password, no invitation verification, no roles,
  // created more than 7 days ago, and no active invitation code for their email
  const zombieUsers = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(
      and(
        isNull(users.passwordHash),
        isNull(users.inviteCodeVerifiedAt),
        lt(users.createdAt, sevenDaysAgo)
      )
    )
    .then(async (candidates) => {
      // Filter out users who have roles or active invitation codes
      const filtered: ZombieUser[] = [];

      for (const candidate of candidates) {
        // Check for existing roles
        const roles = await db
          .select({ id: userRoles.id })
          .from(userRoles)
          .where(eq(userRoles.userId, candidate.id))
          .limit(1);

        if (roles.length > 0) continue;

        // Check for active invitation codes for this user's email
        const activeInvites = await db
          .select({ id: invitationCodes.id })
          .from(invitationCodes)
          .where(
            and(
              eq(invitationCodes.generatedFor, candidate.email),
              eq(invitationCodes.status, 'active')
            )
          )
          .limit(1);

        if (activeInvites.length > 0) continue;

        filtered.push(candidate);
      }

      return filtered;
    });

  if (dryRun || zombieUsers.length === 0) {
    return { zombieUsers, deletedCount: 0, dryRun };
  }

  // Delete zombie users (accounts, sessions, memberships cascade automatically)
  let deletedCount = 0;

  for (const zombie of zombieUsers) {
    // Delete activity logs first (no cascade on this FK)
    await db
      .delete(activityLogs)
      .where(eq(activityLogs.userId, zombie.id));

    // Delete the user (cascades to accounts, sessions, memberships)
    await db
      .delete(users)
      .where(eq(users.id, zombie.id));

    deletedCount++;
  }

  return { zombieUsers, deletedCount, dryRun };
}
