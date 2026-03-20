import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { mentorshipRelationships, users, mentorProfiles, menteeProfiles, mentorFormSubmissions, menteeFormSubmissions, programmes } from '@/lib/db/schema';
import { eq, or } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all relationships where user is either mentor or mentee - simplified query
    const allRelationships = await db
      .select()
      .from(mentorshipRelationships)
      .where(
        or(
          eq(mentorshipRelationships.mentorUserId, user.id),
          eq(mentorshipRelationships.menteeUserId, user.id)
        )
      );

    // Collect all unique mentor and mentee user IDs for batch fetching
    const mentorUserIds = [...new Set(allRelationships.map(r => r.mentorUserId))];
    const menteeUserIds = [...new Set(allRelationships.map(r => r.menteeUserId))];

    // Batch fetch mentor data with form fallback
    const mentorDataMap = new Map<number, { name: string | null; email: string; image: string | null; jobTitle: string | null; company: string | null }>();
    if (mentorUserIds.length > 0) {
      for (const mentorId of mentorUserIds) {
        const [result] = await db
          .select({
            name: users.name,
            email: users.email,
            userImage: users.image,
            profilePhotoUrl: mentorProfiles.photoUrl,
            formPhotoUrl: mentorFormSubmissions.photoUrl,
            profileJobTitle: mentorProfiles.jobTitle,
            profileCompany: mentorProfiles.company,
            formJobTitle: mentorFormSubmissions.jobTitle,
            formCompany: mentorFormSubmissions.company,
          })
          .from(users)
          .leftJoin(mentorProfiles, eq(mentorProfiles.userId, users.id))
          .leftJoin(mentorFormSubmissions, eq(mentorFormSubmissions.userId, users.id))
          .where(eq(users.id, mentorId))
          .limit(1);

        if (result) {
          mentorDataMap.set(mentorId, {
            name: result.name,
            email: result.email,
            image: result.formPhotoUrl || result.profilePhotoUrl || result.userImage || null,
            jobTitle: result.formJobTitle || result.profileJobTitle || null,
            company: result.formCompany || result.profileCompany || null,
          });
        }
      }
    }

    // Batch fetch mentee data with form fallback
    const menteeDataMap = new Map<number, { name: string | null; email: string; image: string | null; learningGoals: string[] | null }>();
    if (menteeUserIds.length > 0) {
      for (const menteeId of menteeUserIds) {
        const [result] = await db
          .select({
            name: users.name,
            email: users.email,
            userImage: users.image,
            profilePhotoUrl: menteeProfiles.photoUrl,
            formPhotoUrl: menteeFormSubmissions.photoUrl,
            learningGoals: menteeProfiles.learningGoals,
          })
          .from(users)
          .leftJoin(menteeProfiles, eq(menteeProfiles.userId, users.id))
          .leftJoin(menteeFormSubmissions, eq(menteeFormSubmissions.userId, users.id))
          .where(eq(users.id, menteeId))
          .limit(1);

        if (result) {
          menteeDataMap.set(menteeId, {
            name: result.name,
            email: result.email,
            image: result.formPhotoUrl || result.profilePhotoUrl || result.userImage || null,
            learningGoals: result.learningGoals as string[] | null,
          });
        }
      }
    }

    // Enrich relationships with cached data
    const enrichedRelationships = await Promise.all(
      allRelationships.map(async (rel) => {
        const mentorData = mentorDataMap.get(rel.mentorUserId) || null;
        const menteeData = menteeDataMap.get(rel.menteeUserId) || null;

        // Build mentor role string
        let mentorRole: string | null = null;
        if (rel.status === 'active' && mentorData) {
          mentorRole = mentorData.jobTitle || null;
          if (mentorRole && mentorData.company) {
            mentorRole += ` at ${mentorData.company}`;
          }
        }

        // Get programme name if applicable
        let programmeName: string | null = null;
        if (rel.programmeId) {
          const [programme] = await db
            .select({ name: programmes.name })
            .from(programmes)
            .where(eq(programmes.id, rel.programmeId))
            .limit(1);
          programmeName = programme?.name ?? null;
        }

        return {
          id: rel.id,
          mentorId: rel.mentorUserId,
          menteeId: rel.menteeUserId,
          status: rel.status,
          startedAt: rel.startedAt,
          endedAt: rel.endedAt,
          pausedAt: rel.pausedAt,
          nextMeetingDate: rel.nextMeetingDate,
          meetingFrequency: rel.meetingFrequency,
          relationshipGoals: rel.relationshipGoals,
          mentorNotes: rel.mentorNotes,
          menteeNotes: rel.menteeNotes,
          createdAt: rel.createdAt,
          updatedAt: rel.updatedAt,
          mentorName: mentorData?.name || null,
          mentorEmail: mentorData?.email || null,
          mentorImage: mentorData?.image || null,
          menteeName: menteeData?.name || null,
          menteeEmail: menteeData?.email || null,
          menteeImage: menteeData?.image || null,
          mentorRole,
          menteeGoals: rel.status === 'active' ? (menteeData?.learningGoals || null) : null,
          programmeId: rel.programmeId,
          programmeName,
        };
      })
    );

    // Separate by status
    const active = enrichedRelationships.filter(r => r.status === 'active');
    const pending = enrichedRelationships.filter(r => r.status === 'pending');
    const ended = enrichedRelationships.filter(r => r.status === 'completed');
    const rejected = enrichedRelationships.filter(r => r.status === 'rejected');

    return NextResponse.json({
      active,
      pending,
      ended,
      rejected,
      total: enrichedRelationships.length,
    });
  } catch (error) {
    console.error('Error fetching relationships:', error);
    return NextResponse.json(
      { error: 'Failed to fetch relationships' },
      { status: 500 }
    );
  }
}
