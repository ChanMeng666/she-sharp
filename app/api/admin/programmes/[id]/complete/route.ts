import { NextRequest, NextResponse } from 'next/server';
import { withRoles, type AuthedRouteContext } from '@/lib/auth/role-middleware';
import { completeProgramme, getProgrammeById } from '@/lib/programmes/service';

export const POST = withRoles(
  { requiredRoles: ['admin'] },
  async (_request: NextRequest, { params, user }: AuthedRouteContext<{ id: string }>) => {
    try {
      const { id } = await params;
      const programmeId = parseInt(id);

      const programme = await getProgrammeById(programmeId);
      if (!programme) {
        return NextResponse.json({ error: 'Programme not found' }, { status: 404 });
      }

      if (programme.status === 'completed' || programme.status === 'archived') {
        return NextResponse.json({ error: 'Programme is already completed or archived' }, { status: 400 });
      }

      const result = await completeProgramme(programmeId, user.id);

      return NextResponse.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error('Error completing programme:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);
