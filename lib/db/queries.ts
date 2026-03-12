import { desc, and, eq, isNull } from 'drizzle-orm';
import { db } from './drizzle';
import { activityLogs, users } from './schema';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';
import { auth } from '@/lib/auth/auth.config';

export async function getUser() {
  // First check for NextAuth session
  try {
    const nextAuthSession = await auth();
    if (nextAuthSession?.user?.id) {
      const user = await db
        .select()
        .from(users)
        .where(and(eq(users.id, parseInt(nextAuthSession.user.id)), isNull(users.deletedAt)))
        .limit(1);

      if (user.length > 0) {
        return user[0];
      }
    }
  } catch (error) {
    // If NextAuth session is invalid or corrupted, log and continue to fallback
    console.warn('NextAuth session error (likely invalid cookie), falling back to custom session:', error);
  }

  // Fall back to custom session
  const sessionCookie = (await cookies()).get('session');
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  const sessionData = await verifyToken(sessionCookie.value);
  if (
    !sessionData ||
    !sessionData.user ||
    typeof sessionData.user.id !== 'number'
  ) {
    return null;
  }

  if (new Date(sessionData.expires) < new Date()) {
    return null;
  }

  const user = await db
    .select()
    .from(users)
    .where(and(eq(users.id, sessionData.user.id), isNull(users.deletedAt)))
    .limit(1);

  if (user.length === 0) {
    return null;
  }

  return user[0];
}

export async function getActivityLogs() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  return await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      ipAddress: activityLogs.ipAddress,
      userName: users.name
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .where(eq(activityLogs.userId, user.id))
    .orderBy(desc(activityLogs.timestamp))
    .limit(10);
}
