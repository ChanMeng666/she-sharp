import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { isUserAdmin } from '@/lib/auth/permissions';
import { getProgrammeById, updateProgramme, getProgrammeStats } from '@/lib/programmes/service';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user || !(await isUserAdmin(user.id))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user || !(await isUserAdmin(user.id))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

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
