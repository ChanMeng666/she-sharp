import { NextRequest, NextResponse } from 'next/server';
import { withRoles, type AuthedRouteContext } from '@/lib/auth/role-middleware';
import { getProgrammeById, updateProgramme, getProgrammeStats } from '@/lib/programmes/service';

export const GET = withRoles(
  { requiredRoles: ['admin'] },
  async (_request: NextRequest, { params }: AuthedRouteContext<{ id: string }>) => {
    try {
      const { id } = await params;
      const programme = await getProgrammeById(parseInt(id));
      if (!programme) {
        return NextResponse.json({ error: 'Programme not found' }, { status: 404 });
      }

      const stats = await getProgrammeStats(programme.id);

      return NextResponse.json({ programme, stats });
    } catch (error) {
      console.error('Error fetching programme:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);

export const PUT = withRoles(
  { requiredRoles: ['admin'] },
  async (request: NextRequest, { params }: AuthedRouteContext<{ id: string }>) => {
    try {
      const { id } = await params;
      const body = await request.json();

      const programme = await updateProgramme(parseInt(id), {
        ...body,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        applicationDeadline: body.applicationDeadline ? new Date(body.applicationDeadline) : undefined,
      });

      return NextResponse.json({ programme });
    } catch (error) {
      console.error('Error updating programme:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);
