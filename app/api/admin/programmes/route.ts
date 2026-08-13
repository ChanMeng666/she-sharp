import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/auth/role-middleware';
import { getAllProgrammes, createProgramme, getProgrammeStats } from '@/lib/programmes/service';

export const GET = withRoles({ requiredRoles: ['admin'] }, async () => {
  try {
    const programmesList = await getAllProgrammes();

    const programmesWithStats = await Promise.all(
      programmesList.map(async (p) => ({
        ...p,
        stats: await getProgrammeStats(p.id),
      }))
    );

    return NextResponse.json({ programmes: programmesWithStats });
  } catch (error) {
    console.error('Error fetching programmes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const POST = withRoles({ requiredRoles: ['admin'] }, async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { name, slug, description, status, startDate, endDate, applicationDeadline, maxMentees, requiresPayment, partnerOrganisation } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const programme = await createProgramme({
      name,
      slug,
      description,
      status: status || 'draft',
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : undefined,
      maxMentees: maxMentees || null,
      requiresPayment: requiresPayment ?? true,
      partnerOrganisation,
    });

    return NextResponse.json({ programme }, { status: 201 });
  } catch (error) {
    console.error('Error creating programme:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
