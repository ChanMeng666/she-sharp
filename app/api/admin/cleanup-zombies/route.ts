import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { isUserAdmin } from '@/lib/auth/permissions';
import { cleanupZombieUsers } from '@/lib/user/cleanup';

/**
 * GET /api/admin/cleanup-zombies
 * Dry run: returns list of zombie users that would be deleted.
 */
export async function GET() {
  const user = await getUser();
  if (!user || !(await isUserAdmin(user.id))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await cleanupZombieUsers(true);
    return NextResponse.json({
      dryRun: true,
      count: result.zombieUsers.length,
      users: result.zombieUsers.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        createdAt: u.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error in zombie cleanup dry run:', error);
    return NextResponse.json(
      { error: 'Failed to scan for zombie users' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/cleanup-zombies
 * Execute cleanup: deletes zombie users.
 */
export async function POST() {
  const user = await getUser();
  if (!user || !(await isUserAdmin(user.id))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await cleanupZombieUsers(false);
    return NextResponse.json({
      dryRun: false,
      deletedCount: result.deletedCount,
      deletedUsers: result.zombieUsers.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
      })),
    });
  } catch (error) {
    console.error('Error executing zombie cleanup:', error);
    return NextResponse.json(
      { error: 'Failed to clean up zombie users' },
      { status: 500 }
    );
  }
}
