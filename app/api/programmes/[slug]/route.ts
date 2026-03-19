import { NextRequest, NextResponse } from 'next/server';
import { getProgrammeBySlug } from '@/lib/programmes/service';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const programme = await getProgrammeBySlug(slug);

    if (!programme) {
      return NextResponse.json({ error: 'Programme not found' }, { status: 404 });
    }

    // Return only public-safe information
    return NextResponse.json({
      programme: {
        id: programme.id,
        name: programme.name,
        slug: programme.slug,
        description: programme.description,
        status: programme.status,
        startDate: programme.startDate,
        endDate: programme.endDate,
        applicationDeadline: programme.applicationDeadline,
        partnerOrganisation: programme.partnerOrganisation,
        isFull: programme.maxMentees ? programme.currentMenteeCount >= programme.maxMentees : false,
      },
    });
  } catch (error) {
    console.error('Error fetching programme:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
