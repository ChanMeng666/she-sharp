import { NextRequest, NextResponse } from 'next/server';
import { withRoles, type AuthedRouteContext } from '@/lib/auth/role-middleware';
import { assignMentorToProgramme, removeMentorFromProgramme, getProgrammeMentors } from '@/lib/programmes/service';

export const GET = withRoles(
  { requiredRoles: ['admin'] },
  async (_request: NextRequest, { params }: AuthedRouteContext<{ id: string }>) => {
    try {
      const { id } = await params;
      const mentors = await getProgrammeMentors(parseInt(id));

      return NextResponse.json({
        mentors: mentors.map((m) => ({
          id: m.assignment.id,
          mentorUserId: m.assignment.mentorUserId,
          name: m.user.name,
          email: m.user.email,
          company: m.profile?.company,
          jobTitle: m.profile?.jobTitle,
          maxMenteesInProgramme: m.assignment.maxMenteesInProgramme,
          currentMenteesInProgramme: m.assignment.currentMenteesInProgramme,
          assignedAt: m.assignment.assignedAt,
        })),
      });
    } catch (error) {
      console.error('Error fetching programme mentors:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);

export const POST = withRoles(
  { requiredRoles: ['admin'] },
  async (request: NextRequest, { params, user }: AuthedRouteContext<{ id: string }>) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const { mentorUserIds, maxMentees } = body;

      if (!mentorUserIds || !Array.isArray(mentorUserIds) || mentorUserIds.length === 0) {
        return NextResponse.json({ error: 'mentorUserIds array is required' }, { status: 400 });
      }

      const results = await Promise.all(
        mentorUserIds.map((mentorId: number) =>
          assignMentorToProgramme(mentorId, parseInt(id), user.id, maxMentees)
        )
      );

      return NextResponse.json({ assignments: results }, { status: 201 });
    } catch (error) {
      console.error('Error assigning mentors:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);

export const DELETE = withRoles(
  { requiredRoles: ['admin'] },
  async (request: NextRequest, { params }: AuthedRouteContext<{ id: string }>) => {
    try {
      const { id } = await params;
      const { searchParams } = new URL(request.url);
      const mentorUserId = searchParams.get('mentorUserId');

      if (!mentorUserId) {
        return NextResponse.json({ error: 'mentorUserId is required' }, { status: 400 });
      }

      await removeMentorFromProgramme(parseInt(mentorUserId), parseInt(id));

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error removing mentor:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);
