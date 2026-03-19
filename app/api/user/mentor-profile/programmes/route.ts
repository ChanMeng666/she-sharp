import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { getMentorProgrammes } from '@/lib/programmes/service';

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = await getMentorProgrammes(user.id);

    return NextResponse.json({
      assignments: results.map((r) => ({
        assignment: {
          maxMenteesInProgramme: r.assignment.maxMenteesInProgramme,
          currentMenteesInProgramme: r.assignment.currentMenteesInProgramme,
          assignedAt: r.assignment.assignedAt,
        },
        programme: {
          id: r.programme.id,
          name: r.programme.name,
          slug: r.programme.slug,
          status: r.programme.status,
          startDate: r.programme.startDate,
          endDate: r.programme.endDate,
          partnerOrganisation: r.programme.partnerOrganisation,
        },
      })),
    });
  } catch (error) {
    console.error('Error fetching mentor programme assignments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
