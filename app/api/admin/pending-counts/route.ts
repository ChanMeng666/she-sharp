import { NextResponse } from 'next/server';
import { withRoles } from '@/lib/auth/role-middleware';
import { db } from '@/lib/db/drizzle';
import {
  mentorProfiles,
  users,
  mentorshipRelationships
} from '@/lib/db/schema';
import { eq, isNull, count } from 'drizzle-orm';

export const GET = withRoles({ requiredRoles: ['admin'] }, async () => {
  try {
    // Fetch pending mentor applications
    const pendingMentors = await db
      .select({ count: count() })
      .from(mentorProfiles)
      .where(isNull(mentorProfiles.verifiedAt));

    // Fetch total users count
    const totalUsers = await db
      .select({ count: count() })
      .from(users);

    // Fetch pending mentorship relationships
    const pendingRelationships = await db
      .select({ count: count() })
      .from(mentorshipRelationships)
      .where(eq(mentorshipRelationships.status, 'pending'));

    return NextResponse.json({
      mentorApplications: pendingMentors[0]?.count || 0,
      '/dashboard/admin/users': totalUsers[0]?.count || 0,
      pendingRelationships: pendingRelationships[0]?.count || 0,
    });
  } catch (error) {
    console.error('Failed to fetch pending counts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});