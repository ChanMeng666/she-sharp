import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { mentorProfiles, menteeProfiles, userRoles } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * GET /api/user/profile-photo
 * Returns the current user's profile photo URL based on their active roles.
 * Priority: mentor > mentee > users.image
 */
export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's active roles
    const roles = await db
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, user.id),
          eq(userRoles.isActive, true)
        )
      );

    const activeRoles = roles.map(r => r.roleType);
    let photoUrl: string | null = null;

    // Check mentor profile first
    if (activeRoles.includes('mentor')) {
      const [mentorProfile] = await db
        .select({ photoUrl: mentorProfiles.photoUrl })
        .from(mentorProfiles)
        .where(eq(mentorProfiles.userId, user.id))
        .limit(1);

      if (mentorProfile?.photoUrl) {
        photoUrl = mentorProfile.photoUrl;
      }
    }

    // If no mentor photo, check mentee profile
    if (!photoUrl && activeRoles.includes('mentee')) {
      const [menteeProfile] = await db
        .select({ photoUrl: menteeProfiles.photoUrl })
        .from(menteeProfiles)
        .where(eq(menteeProfiles.userId, user.id))
        .limit(1);

      if (menteeProfile?.photoUrl) {
        photoUrl = menteeProfile.photoUrl;
      }
    }

    // Fallback to users.image (OAuth avatar)
    if (!photoUrl && user.image) {
      photoUrl = user.image;
    }

    return NextResponse.json({
      photoUrl,
      activeRoles,
      isAdmin: activeRoles.includes('admin'),
      isMentor: activeRoles.includes('mentor'),
      isMentee: activeRoles.includes('mentee'),
    });
  } catch (error) {
    console.error('Error fetching profile photo:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile photo' },
      { status: 500 }
    );
  }
}
