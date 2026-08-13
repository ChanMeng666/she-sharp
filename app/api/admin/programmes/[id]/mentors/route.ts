import { NextRequest, NextResponse } from 'next/server';
import { withRoles, type AuthedRouteContext } from '@/lib/auth/role-middleware';
import { assignMentorToProgramme, removeMentorFromProgramme, getProgrammeMentors } from '@/lib/programmes/service';
import { z } from 'zod';
import { invalidBody } from '@/lib/api/validation';

const assignMentorsSchema = z.object({
  mentorUserIds: z
    .array(z.coerce.number().int())
    .nonempty({ message: 'mentorUserIds array is required' }),
  maxMentees: z.number().int().positive().optional(),
});

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
      const parsed = assignMentorsSchema.safeParse(await request.json());
      if (!parsed.success) {
        return invalidBody(parsed.error);
      }
      const { mentorUserIds, maxMentees } = parsed.data;

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
