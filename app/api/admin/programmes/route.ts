import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/auth/role-middleware';
import { getAllProgrammes, createProgramme, getProgrammeStats } from '@/lib/programmes/service';
import { z } from 'zod';
import { invalidBody } from '@/lib/api/validation';

const createProgrammeSchema = z.object({
  name: z.string().min(1, 'Name and slug are required'),
  slug: z.string().min(1, 'Name and slug are required'),
  description: z.string().nullish(),
  status: z.enum(['draft', 'active', 'closed', 'completed', 'archived']).nullish(),
  startDate: z.string().nullish(),
  endDate: z.string().nullish(),
  applicationDeadline: z.string().nullish(),
  maxMentees: z.number().int().nullish(),
  requiresPayment: z.boolean().optional(),
  partnerOrganisation: z.string().nullish(),
});

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
    const parsed = createProgrammeSchema.safeParse(await request.json());
    if (!parsed.success) {
      return invalidBody(parsed.error);
    }
    const { name, slug, description, status, startDate, endDate, applicationDeadline, maxMentees, requiresPayment, partnerOrganisation } = parsed.data;

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
