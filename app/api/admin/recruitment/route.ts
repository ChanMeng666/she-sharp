import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/auth/role-middleware';
import { db } from '@/lib/db/drizzle';
import { volunteerFormSubmissions } from '@/lib/db/schema';
import { desc, eq, and, or, like, count, sql } from 'drizzle-orm';

/**
 * GET /api/admin/recruitment
 * List volunteer/ambassador applications with filtering, search, and pagination.
 * Returns paginated results plus stage-based statistics.
 */
export const GET = withRoles(
  { requiredRoles: ['admin'] },
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const type = searchParams.get('type') as 'ambassador' | 'volunteer' | 'ex_ambassador' | null;
      const stage = searchParams.get('stage');
      const status = searchParams.get('status');
      const search = searchParams.get('search');
      const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
      const offset = (page - 1) * limit;

      // Build filter conditions
      const conditions = [];
      if (type) {
        conditions.push(eq(volunteerFormSubmissions.type, type));
      }
      if (stage) {
        conditions.push(eq(volunteerFormSubmissions.recruitmentStage, stage as any));
      }
      if (status) {
        conditions.push(eq(volunteerFormSubmissions.status, status as any));
      }
      if (search) {
        const pattern = `%${search}%`;
        conditions.push(
          or(
            like(volunteerFormSubmissions.firstName, pattern),
            like(volunteerFormSubmissions.lastName, pattern),
            like(volunteerFormSubmissions.email, pattern)
          )!
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Fetch paginated submissions
      const [submissions, totalResult] = await Promise.all([
        db
          .select()
          .from(volunteerFormSubmissions)
          .where(whereClause)
          .orderBy(desc(volunteerFormSubmissions.createdAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ total: count() })
          .from(volunteerFormSubmissions)
          .where(whereClause),
      ]);

      const total = totalResult[0]?.total ?? 0;

      // Compute stage counts (scoped to the current type filter if set)
      const stageCountConditions = type
        ? eq(volunteerFormSubmissions.type, type)
        : undefined;

      const stageCounts = await db
        .select({
          stage: volunteerFormSubmissions.recruitmentStage,
          count: count(),
        })
        .from(volunteerFormSubmissions)
        .where(stageCountConditions)
        .groupBy(volunteerFormSubmissions.recruitmentStage);

      const stats: Record<string, number> = {};
      for (const row of stageCounts) {
        stats[row.stage ?? 'new'] = row.count;
      }

      return NextResponse.json({
        submissions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        stats,
      });
    } catch (error) {
      console.error('Error listing recruitment applications:', error);
      return NextResponse.json(
        { error: 'Failed to list applications' },
        { status: 500 }
      );
    }
  }
);
