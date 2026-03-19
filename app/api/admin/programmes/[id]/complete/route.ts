import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { isUserAdmin } from '@/lib/auth/permissions';
import { completeProgramme, getProgrammeById } from '@/lib/programmes/service';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user || !(await isUserAdmin(user.id))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

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
