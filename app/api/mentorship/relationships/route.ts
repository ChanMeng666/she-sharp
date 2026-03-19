import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { mentorshipRelationships, users, mentorProfiles, menteeProfiles, programmes } from '@/lib/db/schema';
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

    // Enrich relationships with user information
    const enrichedRelationships = await Promise.all(
      allRelationships.map(async (rel) => {
        let mentorData = null;
        let menteeData = null;
        let mentorRole = null;
        let menteeGoals = null;

        // Get mentor user data
        if (rel.mentorUserId) {
          const [mentorUser] = await db
            .select()
            .from(users)
            .where(eq(users.id, rel.mentorUserId))
            .limit(1);
          
          if (mentorUser) {
            mentorData = {
              name: mentorUser.name,
              email: mentorUser.email,
              image: mentorUser.image,
            };

            // Get mentor profile for active relationships
            if (rel.status === 'active') {
              const [mentorProfile] = await db
                .select({
                  jobTitle: mentorProfiles.jobTitle,
                  company: mentorProfiles.company,
                })
                .from(mentorProfiles)
                .where(eq(mentorProfiles.userId, rel.mentorUserId))
                .limit(1);
              
              if (mentorProfile) {
                mentorRole = mentorProfile.jobTitle;
                if (mentorProfile.company) {
                  mentorRole += ` at ${mentorProfile.company}`;
                }
              }
            }
          }
        }

        // Get mentee user data
        if (rel.menteeUserId) {
          const [menteeUser] = await db
            .select()
            .from(users)
            .where(eq(users.id, rel.menteeUserId))
            .limit(1);
          
          if (menteeUser) {
            menteeData = {
              name: menteeUser.name,
              email: menteeUser.email,
              image: menteeUser.image,
            };

            // Get mentee profile for active relationships
            if (rel.status === 'active') {
              const [menteeProfile] = await db
                .select({
                  learningGoals: menteeProfiles.learningGoals,
                })
                .from(menteeProfiles)
                .where(eq(menteeProfiles.userId, rel.menteeUserId))
                .limit(1);
              
              if (menteeProfile) {
                menteeGoals = menteeProfile.learningGoals;
              }
            }
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
          menteeGoals,
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